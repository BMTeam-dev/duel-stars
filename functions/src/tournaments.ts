import { randomBytes } from 'crypto';
import {
  DocumentData,
  DocumentReference,
  FieldValue,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db } from './config';
import {
  applyCancel,
  applyFinalize,
  negate,
  notifyAllMedals,
  readFinalizeData,
} from './duels';
import { deleteDeckFile, deleteTournamentDecks } from './decks';
import { notifyUser } from './notify';

// Torneios: criação, inscrição, check-in e mata-mata (o suíço vem depois). Regras
// no doc do MVP, seção "Torneios". Tudo que trava estrelas, confere senha
// ou limita vagas passa por aqui, em transação - o app só lê.
//
// tournaments/{id}                 dados públicos (lista, card, tela)
// tournaments/{id}/players/{uid}   inscritos (pago, estrelas travadas)
// tournaments/{id}/matches/{r1-s0} chave do mata-mata (rodada, posição)
// tournamentSecrets/{id}           senha do privado (só o organizador lê)
//
// Cada partida com dois jogadores é um duelo comum (aposta 0, com
// tournamentId/matchId): informar, confirmar e disputar funcionam igual.
// O trigger onTournamentDuelEnded avança a chave quando o duelo termina.

type Category = 'tcg' | 'md' | 'dl';
type Status = 'open' | 'checkin' | 'running' | 'finished' | 'cancelled';

const CATEGORIES: Category[] = ['tcg', 'md', 'dl'];
const ACTIVE: Status[] = ['open', 'checkin', 'running'];
// Antes do início: dá pra entrar, sair e cancelar.
const NOT_STARTED: Status[] = ['open', 'checkin'];
const startsAtMs = (t: DocumentData) =>
  t.startsAt ? (t.startsAt as Timestamp).toMillis() : null;

// Com data, fecha no horário marcado; sem data, até o organizador iniciar.
function registrationOpen(t: DocumentData): boolean {
  if (!NOT_STARTED.includes(t.status)) return false;
  const start = startsAtMs(t);
  return start === null || start > Date.now();
}
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 64;
const MAX_STARS_ENTRY = 5;
const MAX_DAYS_AHEAD = 90;
const MAX_OPEN_PER_ORGANIZER = 1;

const users = db.collection('users');
const tournaments = db.collection('tournaments');
const secrets = db.collection('tournamentSecrets');

const walletPath = (category: Category, field: string) =>
  `wallets.${category}.${field}`;
const GAME_LABEL: Record<Category, string> = {
  tcg: 'TCG',
  md: 'Master Duel',
  dl: 'Duel Links',
};

// Código curto pra achar o torneio (o privado oculto não aparece na lista).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const randomCode = () =>
  Array.from(
    randomBytes(6),
    byte => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join('');

function requireAuth(uid: string | undefined): string {
  if (!uid)
    throw new HttpsError(
      'unauthenticated',
      'Entre na sua conta para participar de torneios.',
    );
  return uid;
}

function text(value: unknown, max: number): string {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function intIn(
  value: unknown,
  min: number,
  max: number,
  message: string,
): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new HttpsError('invalid-argument', message);
  return n;
}

function wallet(
  user: DocumentData | undefined,
  category: Category,
): DocumentData {
  return user?.wallets?.[category] ?? {};
}

export const createTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const d = (request.data ?? {}) as Record<string, unknown>;

  const name = text(d.name, 60);
  if (name.length < 3)
    throw new HttpsError(
      'invalid-argument',
      'Dê um nome com pelo menos 3 letras.',
    );
  const category = d.category as Category;
  if (!CATEGORIES.includes(category))
    throw new HttpsError('invalid-argument', 'Categoria inválida.');
  const format = d.format === 'single' ? 'single' : 'swiss';
  const matchFormat = d.matchFormat === 'bo1' ? 'bo1' : 'bo3';
  const visibility = d.visibility === 'private' ? 'private' : 'public';
  const password = text(d.password, 30);
  if (visibility === 'private' && password.length < 3) {
    throw new HttpsError(
      'invalid-argument',
      'A senha do torneio privado precisa de pelo menos 3 caracteres.',
    );
  }
  const maxPlayers = intIn(
    d.maxPlayers,
    MIN_PLAYERS,
    MAX_PLAYERS,
    `As vagas vão de ${MIN_PLAYERS} a ${MAX_PLAYERS}.`,
  );
  const starsEntry = intIn(
    d.starsEntry ?? 0,
    0,
    MAX_STARS_ENTRY,
    `A inscrição em estrelas vai de 0 a ${MAX_STARS_ENTRY}.`,
  );
  const minStars =
    d.minStars == null
      ? null
      : intIn(d.minStars, 1, 9999, 'Mínimo de estrelas inválido.');
  const entryFeeCents =
    d.entryFeeCents == null
      ? null
      : intIn(d.entryFeeCents, 100, 1_000_000, 'Valor da inscrição inválido.');
  const pixKey = entryFeeCents ? text(d.pixKey, 77) : '';
  if (entryFeeCents && pixKey.length < 5)
    throw new HttpsError(
      'invalid-argument',
      'Informe a chave Pix para a inscrição paga.',
    );
  // 'manual': o organizador inicia cada rodada e marca o prazo (data e hora).
  const roundMode = d.roundMode === 'manual' ? 'manual' : 'auto';
  // Exige o print do deck: o organizador aprova antes do check-in.
  const requireDeck = d.requireDeck === true;
  const roundMinutes =
    roundMode === 'manual' || d.roundMinutes == null
      ? null
      : intIn(d.roundMinutes, 10, 60 * 24 * 30, 'Prazo da rodada inválido.');

  // Sem data: começa quando o organizador abrir o check-in e iniciar.
  const noDate = d.startsAt == null;
  const startsAtMs = Number(d.startsAt);
  const now = Date.now();
  if (
    !noDate &&
    (!Number.isFinite(startsAtMs) || startsAtMs < now + 10 * 60 * 1000)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'O torneio precisa começar pelo menos 10 minutos a partir de agora.',
    );
  }
  if (!noDate && startsAtMs > now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    throw new HttpsError(
      'invalid-argument',
      `O início pode ser em até ${MAX_DAYS_AHEAD} dias.`,
    );
  }

  const ref = tournaments.doc();
  await db.runTransaction(async tx => {
    const active = await tx.get(
      tournaments
        .where('organizerUid', '==', uid)
        .where('status', 'in', ACTIVE)
        .limit(MAX_OPEN_PER_ORGANIZER),
    );
    if (active.size >= MAX_OPEN_PER_ORGANIZER) {
      throw new HttpsError(
        'failed-precondition',
        'Você já tem um torneio em andamento. Termine ou cancele ele antes de criar outro.',
      );
    }
    tx.create(ref, {
      name,
      description: text(d.description, 500),
      category,
      format,
      matchFormat,
      visibility,
      // Privado só aparece na lista se o organizador quiser.
      listed: visibility === 'public' || d.listed === true,
      contact: text(d.contact, 80) || null,
      entryFeeCents,
      pixKey: pixKey || null,
      starsEntry,
      minStars,
      maxPlayers,
      roundMode,
      requireDeck,
      roundMinutes,
      startsAt: noDate ? null : Timestamp.fromMillis(startsAtMs),
      code: randomCode(),
      organizerUid: uid,
      status: 'open' as Status,
      playerUids: [],
      playerCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (visibility === 'private')
      tx.create(secrets.doc(ref.id), { password, organizerUid: uid });
  });
  return { id: ref.id };
});

export const joinTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  const password = text(request.data?.password, 30);

  await db.runTransaction(async tx => {
    const [snap, userSnap, playerSnap, secretSnap] = await Promise.all([
      tx.get(ref),
      tx.get(users.doc(uid)),
      tx.get(ref.collection('players').doc(uid)),
      tx.get(secrets.doc(ref.id)),
    ]);
    const t = snap.data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (playerSnap.exists)
      throw new HttpsError('already-exists', 'Você já está inscrito.');
    if (!registrationOpen(t)) {
      throw new HttpsError(
        'failed-precondition',
        'As inscrições desse torneio já fecharam.',
      );
    }
    if (t.playerCount >= t.maxPlayers)
      throw new HttpsError('resource-exhausted', 'O torneio está lotado.');
    if (t.visibility === 'private' && secretSnap.get('password') !== password) {
      throw new HttpsError(
        'permission-denied',
        'Senha incorreta. Peça a senha ao organizador.',
      );
    }

    const user = userSnap.data();
    if (!user)
      throw new HttpsError(
        'failed-precondition',
        'Complete seu cadastro para entrar em torneios.',
      );
    const category = t.category as Category;
    if (category !== 'tcg' && !user?.gameIds?.[category]) {
      // `details` deixa o app oferecer o atalho pra Editar perfil.
      throw new HttpsError(
        'failed-precondition',
        `Cadastre seu ID do ${GAME_LABEL[category]} no perfil para entrar.`,
        { needsGameId: category },
      );
    }
    const w = wallet(user, category);
    if (t.minStars && (w.stars ?? 0) < t.minStars) {
      throw new HttpsError(
        'failed-precondition',
        `Esse torneio pede pelo menos ${t.minStars} estrelas no ${GAME_LABEL[category]}.`,
      );
    }
    const free = (w.stars ?? 0) - (w.lockedStars ?? 0);
    if (t.starsEntry > free) {
      throw new HttpsError(
        'failed-precondition',
        `Você precisa de ${t.starsEntry} estrelas livres para a inscrição.`,
      );
    }

    tx.create(ref.collection('players').doc(uid), {
      uid,
      joinedAt: FieldValue.serverTimestamp(),
      // Inscrição grátis já conta como paga.
      paid: !t.entryFeeCents,
      starsLocked: t.starsEntry,
      deckStatus: t.requireDeck ? 'missing' : null,
    });
    tx.update(ref, {
      playerUids: FieldValue.arrayUnion(uid),
      playerCount: FieldValue.increment(1),
    });
    if (t.starsEntry > 0) {
      tx.update(users.doc(uid), {
        [walletPath(category, 'lockedStars')]: FieldValue.increment(
          t.starsEntry,
        ),
      });
    }
  });
  return { ok: true };
});

// Sai de um torneio que ainda não começou (devolve as estrelas travadas).
// Usado pelo botão "Sair" e pela exclusão de conta.
export async function leaveTournamentBeforeStart(
  ref: DocumentReference,
  uid: string,
) {
  const deckPath = await db.runTransaction(async tx => {
    const [snap, playerSnap] = await Promise.all([
      tx.get(ref),
      tx.get(ref.collection('players').doc(uid)),
    ]);
    const t = snap.data();
    if (!t || !playerSnap.exists)
      throw new HttpsError(
        'not-found',
        'Você não está inscrito nesse torneio.',
      );
    if (!NOT_STARTED.includes(t.status))
      throw new HttpsError('failed-precondition', 'O torneio já começou.');
    const locked = playerSnap.get('starsLocked') ?? 0;
    tx.delete(playerSnap.ref);
    tx.update(ref, {
      playerUids: FieldValue.arrayRemove(uid),
      playerCount: FieldValue.increment(-1),
    });
    if (locked > 0) {
      tx.update(users.doc(uid), {
        [walletPath(t.category, 'lockedStars')]: FieldValue.increment(
          negate(locked),
        ),
      });
    }
    return playerSnap.get('deckPath');
  });
  await deleteDeckFile(deckPath);
}

export const leaveTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  await leaveTournamentBeforeStart(
    tournaments.doc(String(request.data?.id ?? '')),
    uid,
  );
  return { ok: true };
});

// Cancela um torneio que ainda não começou (exclusão de conta do organizador).
export async function cancelTournamentBeforeStart(ref: DocumentReference) {
  await db.runTransaction(async tx => {
    const t = (await tx.get(ref)).data();
    if (t && NOT_STARTED.includes(t.status)) await cancelInTx(tx, ref, t);
  });
  await deleteTournamentDecks(ref.id);
}

// Cancela antes do início: devolve as estrelas da inscrição de todo mundo.
async function cancelInTx(
  tx: Transaction,
  ref: DocumentReference,
  t: DocumentData,
) {
  const players = await tx.get(ref.collection('players'));
  for (const player of players.docs) {
    const locked = player.get('starsLocked') ?? 0;
    if (locked > 0) {
      tx.update(users.doc(player.id), {
        [walletPath(t.category, 'lockedStars')]: FieldValue.increment(
          negate(locked),
        ),
      });
    }
    tx.update(player.ref, { starsLocked: 0 });
  }
  tx.update(ref, {
    status: 'cancelled' as Status,
    cancelledAt: FieldValue.serverTimestamp(),
  });
}

export const cancelTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));

  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const t = snap.data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (t.organizerUid !== uid)
      throw new HttpsError(
        'permission-denied',
        'Só o organizador pode cancelar.',
      );
    // Depois do início as partidas já são duelos: aí o caminho é decidir as
    // partidas paradas (resolveTournamentMatch).
    if (!NOT_STARTED.includes(t.status))
      throw new HttpsError(
        'failed-precondition',
        'O torneio já começou e não pode mais ser cancelado.',
      );
    await cancelInTx(tx, ref, t);
  });
  await deleteTournamentDecks(ref.id);
  return { ok: true };
});

// O app não processa o Pix: o organizador confere e marca quem pagou.
export const setTournamentPlayerPaid = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  const playerUid = String(request.data?.playerUid ?? '');
  const snap = await ref.get();
  if (!snap.exists)
    throw new HttpsError('not-found', 'Torneio não encontrado.');
  if (snap.get('organizerUid') !== uid)
    throw new HttpsError(
      'permission-denied',
      'Só o organizador pode marcar pagamentos.',
    );
  const player = ref.collection('players').doc(playerUid);
  if (!(await player.get()).exists)
    throw new HttpsError('not-found', 'Jogador não inscrito.');
  await player.update({ paid: request.data?.paid === true });
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Check-in, início, suíço e mata-mata
//
// Partidas em tournaments/{id}/matches:
//   suíço       w{rodada}-t{mesa}  stage 'swiss'
//   mata-mata   r{rodada}-s{pos}   stage 'top' (top cut, ou o torneio todo no mata-mata)

const CHECKIN_WINDOW_MS = 30 * 60 * 1000;
const duels = db.collection('duels');

type MatchResult = 'win' | 'bye' | 'double_loss';
type Stage = 'swiss' | 'top';
type Created = { label: string; players: [string, string]; duelId: string };

const bracketId = (round: number, slot: number) => `r${round}-s${slot}`;
const swissId = (round: number, table: number) => `w${round}-t${table}`;

// Tabela da política oficial da Konami (v2.5, locais/regionais), até 64.
function swissPlan(players: number): { rounds: number; topCut: number } {
  if (players <= 8) return { rounds: 3, topCut: 0 };
  if (players <= 16) return { rounds: 4, topCut: 4 };
  if (players <= 32) return { rounds: 5, topCut: 4 };
  return { rounds: 6, topCut: 8 };
}

export function roundLabel(round: number, rounds: number): string {
  if (round === rounds) return 'Final';
  if (round === rounds - 1) return 'Semifinal';
  if (round === rounds - 2) return 'Quartas de final';
  return `Rodada ${round}`;
}

const swissLabel = (round: number, rounds: number) =>
  `Suíço · rodada ${round} de ${rounds}`;

// Com data: 30 min antes. Sem data: quando o organizador abre (status checkin).
function checkinOpen(t: DocumentData): boolean {
  if (t.status === 'checkin') return true;
  const start = startsAtMs(t);
  return (
    t.status === 'open' &&
    start !== null &&
    start - CHECKIN_WINDOW_MS <= Date.now()
  );
}

// Torneio sem data: o organizador avisa que vai começar e abre o check-in.
export const openTournamentCheckin = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  const t = await db.runTransaction(async tx => {
    const data = (await tx.get(ref)).data();
    if (!data) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (data.organizerUid !== uid)
      throw new HttpsError(
        'permission-denied',
        'Só o organizador pode abrir o check-in.',
      );
    if (data.status !== 'open' || startsAtMs(data) !== null) {
      throw new HttpsError(
        'failed-precondition',
        'O check-in desse torneio não pode ser aberto agora.',
      );
    }
    tx.update(ref, {
      status: 'checkin' as Status,
      checkinOpenedAt: FieldValue.serverTimestamp(),
    });
    return data;
  });
  await Promise.all(
    (t.playerUids as string[]).map(player =>
      notifyUser(player, {
        title: `${t.name} vai começar`,
        body: 'Confirme sua presença (check-in) para entrar nas rodadas.',
        link: `/tournament/${ref.id}`,
      }),
    ),
  );
  return { ok: true };
});

export const checkInTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  await db.runTransaction(async tx => {
    const [snap, player] = await Promise.all([
      tx.get(ref),
      tx.get(ref.collection('players').doc(uid)),
    ]);
    const t = snap.data();
    if (!t || !player.exists)
      throw new HttpsError(
        'not-found',
        'Você não está inscrito nesse torneio.',
      );
    if (!NOT_STARTED.includes(t.status))
      throw new HttpsError('failed-precondition', 'O torneio já começou.');
    if (!checkinOpen(t)) {
      throw new HttpsError(
        'failed-precondition',
        startsAtMs(t) === null
          ? 'O check-in abre quando o organizador avisar que vai começar.'
          : 'O check-in abre 30 minutos antes do início.',
      );
    }
    if (!player.get('paid')) {
      throw new HttpsError(
        'failed-precondition',
        'O organizador ainda não confirmou seu pagamento.',
      );
    }
    if (t.requireDeck && player.get('deckStatus') !== 'approved') {
      throw new HttpsError(
        'failed-precondition',
        player.get('deckStatus') === 'pending'
          ? 'O organizador ainda não aprovou seu deck.'
          : 'Envie o print do seu deck e espere a aprovação do organizador.',
      );
    }
    tx.update(player.ref, { checkedIn: true });
  });
  return { ok: true };
});

function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUInt32BE(0) % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Duelo da partida: aposta 0, mesmo fluxo de resultado dos duelos casuais.
function createMatchDuel(
  tx: Transaction,
  tRef: DocumentReference,
  t: DocumentData,
  match: { id: string; round: number; stage: Stage; label: string },
  players: [string, string],
  // Rodada manual: prazo marcado pelo organizador (null = sem prazo).
  deadlineMs?: number | null,
): string {
  const duelRef = duels.doc();
  const deadlineAt =
    deadlineMs !== undefined
      ? deadlineMs
      : t.roundMinutes
      ? Date.now() + t.roundMinutes * 60 * 1000
      : null;
  const deadline = deadlineAt ? Timestamp.fromMillis(deadlineAt) : null;
  // O lembrete de prazo usa a duração da rodada.
  const roundMinutes =
    deadlineMs !== undefined
      ? deadlineMs && Math.round((deadlineMs - Date.now()) / 60000)
      : t.roundMinutes ?? null;
  tx.create(duelRef, {
    players,
    stake: 0,
    format: t.matchFormat,
    category: t.category,
    status: 'active',
    reports: {},
    cityIds: [],
    createdAt: FieldValue.serverTimestamp(),
    tournamentId: tRef.id,
    tournamentName: t.name,
    matchId: match.id,
    stage: match.stage,
    round: match.round,
    roundLabel: match.label,
    deadlineAt: deadline,
    roundMinutes,
  });
  return duelRef.id;
}

const manualRounds = (t: DocumentData) => t.roundMode === 'manual';

// Partida com os dois jogadores: no modo automático o duelo já começa; no
// manual fica 'ready' (confronto visível) até o organizador iniciar a rodada.
function openMatch(
  tx: Transaction,
  tRef: DocumentReference,
  t: DocumentData,
  match: { id: string; round: number; stage: Stage; label: string },
  players: [string, string],
): { status: 'active' | 'ready'; duelId: string | null; created?: Created } {
  if (manualRounds(t)) return { status: 'ready', duelId: null };
  const duelId = createMatchDuel(tx, tRef, t, match, players);
  return {
    status: 'active',
    duelId,
    created: { label: match.label, players, duelId },
  };
}

async function notifyMatch(t: DocumentData, m: Created) {
  const nicks = await Promise.all(
    m.players.map(
      async uid => (await users.doc(uid).get()).get('nick') ?? '...',
    ),
  );
  await Promise.all(
    m.players.map((uid, i) =>
      notifyUser(uid, {
        title: `${t.name}: ${m.label}`,
        body: `Sua partida contra @${nicks[1 - i]} começou. Boa sorte!`,
        link: `/duel/${m.duelId}`,
      }),
    ),
  );
}

// Ordem das posições na chave pra que 1º e 2º só se cruzem na final
// (8: 1x8, 4x5, 2x7, 3x6). No mata-mata puro os seeds são sorteados.
function bracketOrder(size: number): number[] {
  let order = [0];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap(i => [i, n - 1 - i]);
  }
  return order;
}

// Monta a 1ª rodada do mata-mata. Byes ficam com os melhores seeds, e bye
// nunca pega bye. Devolve as partidas criadas e os byes a fechar depois.
function createBracket(
  tx: Transaction,
  tRef: DocumentReference,
  t: DocumentData,
  seeds: string[],
) {
  let size = 2;
  while (size < seeds.length) size *= 2;
  const rounds = Math.log2(size);
  const order = bracketOrder(size);
  const created: Created[] = [];
  const byes: { id: string; player: string }[] = [];
  for (let slot = 0; slot < size / 2; slot++) {
    const a = seeds[order[slot * 2]];
    const b = seeds[order[slot * 2 + 1]] ?? null;
    const id = bracketId(1, slot);
    const ref = tRef.collection('matches').doc(id);
    const base = {
      round: 1,
      slot,
      stage: 'top',
      winnerUid: null,
      result: null,
    };
    if (b) {
      const label = roundLabel(1, rounds);
      const opened = openMatch(
        tx,
        tRef,
        t,
        { id, round: 1, stage: 'top', label },
        [a, b],
      );
      tx.create(ref, {
        ...base,
        players: [a, b],
        status: opened.status,
        duelId: opened.duelId,
      });
      if (opened.created) created.push(opened.created);
    } else {
      tx.create(ref, {
        ...base,
        players: [a, null],
        status: 'pending',
        duelId: null,
      });
      byes.push({ id, player: a });
    }
  }
  return { rounds, created, byes };
}

// --- Suíço -----------------------------------------------------------------

type SwissPlayer = {
  uid: string;
  points: number;
  wins: number;
  losses: number;
  opponents: string[];
  hadBye: boolean;
};

const MIN_WIN_RATE = 1 / 3;
const winRate = (p: SwissPlayer) =>
  Math.max(MIN_WIN_RATE, p.wins / Math.max(1, p.wins + p.losses));

// Classificação: pontos, % de vitórias dos adversários (mín. 33% cada) e %
// dos adversários dos adversários. Bye conta vitória mas não adversário.
function standings(players: SwissPlayer[]): SwissPlayer[] {
  const byUid = new Map(players.map(p => [p.uid, p]));
  const avg = (values: number[]) =>
    values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const omw = new Map(
    players.map(p => [
      p.uid,
      avg(p.opponents.map(o => winRate(byUid.get(o)!))),
    ]),
  );
  const oomw = new Map(
    players.map(p => [p.uid, avg(p.opponents.map(o => omw.get(o) ?? 0))]),
  );
  return [...players].sort(
    (a, b) =>
      b.points - a.points ||
      omw.get(b.uid)! - omw.get(a.uid)! ||
      oomw.get(b.uid)! - oomw.get(a.uid)!,
  );
}

// Junta quem tem a mesma pontuação, sem repetir adversário (com volta atrás
// quando trava). Com número ímpar, o pior colocado sem bye folga.
function pairSwiss(players: SwissPlayer[]): {
  pairs: [string, string][];
  bye: string | null;
} {
  const ordered = [...shuffle(players)].sort((a, b) => b.points - a.points);
  let bye: string | null = null;
  if (ordered.length % 2 === 1) {
    const idx = [...ordered].reverse().findIndex(p => !p.hadBye);
    const pick = ordered.length - 1 - (idx === -1 ? 0 : idx);
    bye = ordered[pick].uid;
    ordered.splice(pick, 1);
  }
  let budget = 20000;
  const solve = (rest: SwissPlayer[]): [string, string][] | null => {
    if (rest.length === 0) return [];
    if (--budget < 0) return null;
    const [first, ...others] = rest;
    for (let i = 0; i < others.length; i++) {
      if (first.opponents.includes(others[i].uid)) continue;
      const tail = solve([...others.slice(0, i), ...others.slice(i + 1)]);
      if (tail) return [[first.uid, others[i].uid], ...tail];
    }
    return null;
  };
  // Sem saída sem revanche (raro, no fim de suíço pequeno): aceita revanche.
  const pairs =
    solve(ordered) ??
    Array.from(
      { length: ordered.length / 2 },
      (_, i) =>
        [ordered[2 * i].uid, ordered[2 * i + 1].uid] as [string, string],
    );
  return { pairs, bye };
}

function createSwissRound(
  tx: Transaction,
  tRef: DocumentReference,
  t: DocumentData,
  round: number,
  players: SwissPlayer[],
): { created: Created[]; bye: string | null } {
  const { pairs, bye } = pairSwiss(players);
  const label = swissLabel(round, t.swissRounds);
  const created: Created[] = [];
  pairs.forEach((pair, table) => {
    const id = swissId(round, table);
    const opened = openMatch(
      tx,
      tRef,
      t,
      { id, round, stage: 'swiss', label },
      pair,
    );
    tx.create(tRef.collection('matches').doc(id), {
      round,
      slot: table,
      stage: 'swiss',
      players: pair,
      status: opened.status,
      duelId: opened.duelId,
      winnerUid: null,
      result: null,
    });
    if (opened.created) created.push(opened.created);
  });
  if (bye) {
    tx.create(tRef.collection('matches').doc(swissId(round, pairs.length)), {
      round,
      slot: pairs.length,
      stage: 'swiss',
      players: [bye, null],
      status: 'done',
      duelId: null,
      winnerUid: bye,
      result: 'bye',
    });
  }
  return { created, bye };
}

// Bye vale vitória (3 pontos), sem adversário.
function applyBye(p: SwissPlayer) {
  p.points += 3;
  p.wins += 1;
  p.hadBye = true;
}

const swissFields = (p: SwissPlayer) => ({
  points: p.points,
  wins: p.wins,
  losses: p.losses,
  opponents: p.opponents,
  hadBye: p.hadBye,
});

const toSwissPlayer = (doc: DocumentData, uid: string): SwissPlayer => ({
  uid,
  points: doc.points ?? 0,
  wins: doc.wins ?? 0,
  losses: doc.losses ?? 0,
  opponents: doc.opponents ?? [],
  hadBye: !!doc.hadBye,
});

// --- Início ----------------------------------------------------------------

export const startTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));

  const started = await db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (t.organizerUid !== uid)
      throw new HttpsError(
        'permission-denied',
        'Só o organizador pode iniciar.',
      );
    if (!NOT_STARTED.includes(t.status))
      throw new HttpsError('failed-precondition', 'Esse torneio já começou.');
    if (!checkinOpen(t)) {
      throw new HttpsError(
        'failed-precondition',
        startsAtMs(t) === null
          ? 'Abra o check-in antes de iniciar.'
          : 'Dá para iniciar a partir de 30 minutos antes do horário marcado.',
      );
    }
    const players = await tx.get(tRef.collection('players'));
    const checked = players.docs.filter(p => p.get('checkedIn'));
    const min = t.format === 'swiss' ? 4 : 2;
    if (checked.length < min) {
      throw new HttpsError(
        'failed-precondition',
        `É preciso pelo menos ${min} jogadores com check-in.`,
      );
    }

    // Quem não fez check-in sai do torneio e recebe as estrelas de volta.
    for (const p of players.docs.filter(p => !p.get('checkedIn'))) {
      const locked = p.get('starsLocked') ?? 0;
      if (locked > 0) {
        tx.update(users.doc(p.id), {
          [walletPath(t.category, 'lockedStars')]: FieldValue.increment(
            negate(locked),
          ),
        });
      }
      tx.delete(p.ref);
    }
    const uids = shuffle(checked.map(p => p.id));
    const common = {
      status: 'running',
      currentRound: 1,
      playerUids: uids,
      playerCount: uids.length,
      startedAt: FieldValue.serverTimestamp(),
      // Manual: confrontos prontos, esperando o organizador iniciar a rodada.
      roundPhase: manualRounds(t) ? 'ready' : null,
      roundDeadlineAt: null,
    };

    if (t.format === 'swiss') {
      const plan = swissPlan(uids.length);
      const tSwiss = { ...t, swissRounds: plan.rounds, topCut: plan.topCut };
      const fresh = uids.map(u => toSwissPlayer({}, u));
      const { created, bye } = createSwissRound(tx, tRef, tSwiss, 1, fresh);
      for (const p of fresh) {
        if (p.uid === bye) applyBye(p);
        tx.update(tRef.collection('players').doc(p.uid), swissFields(p));
      }
      tx.update(tRef, {
        ...common,
        stage: 'swiss',
        swissRounds: plan.rounds,
        topCut: plan.topCut,
        rounds: null,
      });
      return {
        t: tSwiss,
        created,
        byes: [] as { id: string; player: string }[],
      };
    }

    const bracket = createBracket(tx, tRef, { ...t, rounds: null }, uids);
    tx.update(tRef, { ...common, stage: 'top', rounds: bracket.rounds });
    return {
      t: { ...t, rounds: bracket.rounds },
      created: bracket.created,
      byes: bracket.byes,
    };
  });

  for (const bye of started.byes)
    await settleAndAdvance(tRef, bye.id, bye.player, 'bye');
  await Promise.all(started.created.map(m => notifyMatch(started.t, m)));
  return { ok: true };
});

// --- Fechar partidas -------------------------------------------------------

type SettleOut = {
  next?: { id: string; winner: string | null };
  finished?: boolean;
  created?: Created[];
  byes?: { id: string; player: string }[];
  t?: DocumentData;
};

// Mata-mata: fecha a partida e, se a irmã já terminou, monta a próxima.
async function settleBracketMatch(
  tRef: DocumentReference,
  id: string,
  winnerUid: string | null,
  result: MatchResult,
): Promise<SettleOut> {
  return db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    const matchRef = tRef.collection('matches').doc(id);
    const match = (await tx.get(matchRef)).data();
    if (!t || !match || match.status === 'done' || t.status !== 'running')
      return {};
    const { round, slot } = match as { round: number; slot: number };
    const last = round === t.rounds;
    const sibling = last
      ? undefined
      : (
          await tx.get(
            tRef.collection('matches').doc(bracketId(round, slot ^ 1)),
          )
        ).data();

    tx.update(matchRef, {
      status: 'done',
      winnerUid,
      result,
      endedAt: FieldValue.serverTimestamp(),
    });
    if (last) return { finished: true };
    if (!sibling || sibling.status !== 'done') return {};

    // Os dois lados decididos: próxima partida (vencedor da posição par em cima).
    const winners =
      slot % 2 === 0
        ? [winnerUid, sibling.winnerUid]
        : [sibling.winnerUid, winnerUid];
    const nextRound = round + 1;
    const nextSlot = slot >> 1;
    const nextId = bracketId(nextRound, nextSlot);
    const nextRef = tRef.collection('matches').doc(nextId);
    const base = {
      round: nextRound,
      slot: nextSlot,
      stage: 'top',
      winnerUid: null,
      result: null,
    };
    const present = winners.filter((w): w is string => !!w);
    if (present.length === 2) {
      const pair = present as [string, string];
      const label = roundLabel(nextRound, t.rounds);
      const opened = openMatch(
        tx,
        tRef,
        t,
        { id: nextId, round: nextRound, stage: 'top', label },
        pair,
      );
      tx.set(nextRef, {
        ...base,
        players: pair,
        status: opened.status,
        duelId: opened.duelId,
      });
      if (nextRound > (t.currentRound ?? 1))
        tx.update(tRef, { currentRound: nextRound });
      return { created: opened.created ? [opened.created] : [], t };
    }
    // Um lado vazio (derrota dupla antes): quem sobrou passa direto.
    tx.set(nextRef, {
      ...base,
      players: winners,
      status: 'pending',
      duelId: null,
    });
    return { next: { id: nextId, winner: present[0] ?? null } };
  });
}

// Suíço: fecha a partida, soma os pontos e, se a rodada acabou, pareia a
// próxima - ou, na última, leva o top cut pro mata-mata (ou encerra).
async function settleSwissMatch(
  tRef: DocumentReference,
  id: string,
  winnerUid: string | null,
): Promise<SettleOut> {
  return db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    const matchRef = tRef.collection('matches').doc(id);
    const match = (await tx.get(matchRef)).data();
    if (
      !t ||
      !match ||
      match.status === 'done' ||
      t.status !== 'running' ||
      t.stage !== 'swiss'
    )
      return {};
    const round = match.round as number;
    const roundMatches = await tx.get(
      tRef
        .collection('matches')
        .where('round', '==', round)
        .where('stage', '==', 'swiss'),
    );
    const playerDocs = await tx.get(tRef.collection('players'));

    // Pontos desta partida (vitória 3, derrota e derrota dupla 0).
    const [a, b] = match.players as [string, string];
    const players = new Map(
      playerDocs.docs.map(d => [d.id, toSwissPlayer(d.data(), d.id)]),
    );
    const changed = new Set([a, b]);
    for (const uid of [a, b]) {
      const p = players.get(uid)!;
      const won = uid === winnerUid;
      p.points += won ? 3 : 0;
      p.wins += won ? 1 : 0;
      p.losses += won ? 0 : 1;
      p.opponents.push(uid === a ? b : a);
    }
    // Cada documento é escrito uma vez só, no fim.
    const writePlayers = () =>
      changed.forEach(uid =>
        tx.update(
          tRef.collection('players').doc(uid),
          swissFields(players.get(uid)!),
        ),
      );
    tx.update(matchRef, {
      status: 'done',
      winnerUid,
      result: winnerUid ? 'win' : 'double_loss',
      endedAt: FieldValue.serverTimestamp(),
    });

    const roundOver = roundMatches.docs.every(
      d => d.id === id || d.get('status') === 'done',
    );
    if (!roundOver) {
      writePlayers();
      return {};
    }

    const all = [...players.values()];
    if (round < t.swissRounds) {
      const { created, bye } = createSwissRound(tx, tRef, t, round + 1, all);
      if (bye) {
        applyBye(players.get(bye)!);
        changed.add(bye);
      }
      writePlayers();
      tx.update(tRef, { currentRound: round + 1 });
      return { created, t };
    }

    writePlayers();
    const ranked = standings(all).map(p => p.uid);
    if (!t.topCut) {
      // Sem top cut: a classificação do suíço é o resultado final.
      payout(tx, tRef, t, playerDocs.docs, ranked.slice(0, 4), ranked);
      return { t: { ...t, championUid: ranked[0] }, created: [] };
    }
    const bracket = createBracket(
      tx,
      tRef,
      { ...t, rounds: null },
      ranked.slice(0, t.topCut),
    );
    tx.update(tRef, {
      stage: 'top',
      rounds: bracket.rounds,
      currentRound: 1,
      finalStandings: ranked,
    });
    return {
      created: bracket.created,
      byes: bracket.byes,
      t: { ...t, rounds: bracket.rounds },
    };
  });
}

async function settleAndAdvance(
  tRef: DocumentReference,
  id: string,
  winnerUid: string | null,
  result: MatchResult,
) {
  if (id.startsWith('w')) {
    const out = await settleSwissMatch(tRef, id, winnerUid);
    if (out.t && out.created)
      await Promise.all(out.created.map(m => notifyMatch(out.t!, m)));
    for (const bye of out.byes ?? [])
      await settleAndAdvance(tRef, bye.id, bye.player, 'bye');
    if (out.t?.championUid)
      await notifyFinished(tRef, out.t, out.t.championUid);
    return;
  }
  let current: {
    id: string;
    winner: string | null;
    result: MatchResult;
  } | null = { id, winner: winnerUid, result };
  while (current) {
    const out = await settleBracketMatch(
      tRef,
      current.id,
      current.winner,
      current.result,
    );
    if (out.created && out.t)
      await Promise.all(out.created.map(m => notifyMatch(out.t!, m)));
    if (out.finished) await finishBracket(tRef);
    current = out.next
      ? {
          id: out.next.id,
          winner: out.next.winner,
          result: out.next.winner ? 'bye' : 'double_loss',
        }
      : null;
  }
}

// --- Fim e bolo de estrelas -------------------------------------------------

// Divisão do bolo pelo tamanho do torneio: 2-3 jogadores, tudo pro campeão;
// 4-7, 70/30; 8+, 50/30/10/10. Sobra de arredondamento (e prêmio sem dono)
// vai pro campeão. Sem campeão, todo mundo recebe de volta.
function prizeShares(players: number): number[] {
  if (players < 4) return [1];
  if (players < 8) return [0.7, 0.3];
  return [0.5, 0.3, 0.1, 0.1];
}

function payout(
  tx: Transaction,
  tRef: DocumentReference,
  t: DocumentData,
  players: DocumentData[],
  placements: (string | null)[],
  finalStandings?: string[],
) {
  const champion = placements[0] ?? null;
  const pot = players.reduce((sum, p) => sum + (p.get('starsLocked') ?? 0), 0);
  const delta = new Map<string, number>();
  const add = (uid: string, n: number) =>
    delta.set(uid, (delta.get(uid) ?? 0) + n);
  if (champion && pot > 0) {
    let paid = 0;
    const shares = prizeShares(players.length);
    placements.forEach((uid, i) => {
      if (!uid || i === 0) return;
      const prize = Math.floor(pot * (shares[i] ?? 0));
      add(uid, prize);
      paid += prize;
    });
    add(champion, pot - paid);
  }
  for (const p of players) {
    const locked = p.get('starsLocked') ?? 0;
    const change = (champion ? negate(locked) : 0) + (delta.get(p.id) ?? 0);
    tx.update(users.doc(p.id), {
      [walletPath(t.category, 'lockedStars')]: FieldValue.increment(
        negate(locked),
      ),
      [walletPath(t.category, 'stars')]: FieldValue.increment(change),
      ...(p.id === champion ? { 'medals.champion': 1 } : {}),
    });
  }
  tx.update(tRef, {
    status: 'finished',
    championUid: champion,
    placements: placements.slice(0, 4),
    ...(finalStandings ? { finalStandings } : {}),
    pot,
    finishedAt: FieldValue.serverTimestamp(),
  });
}

async function finishBracket(tRef: DocumentReference) {
  const result = await db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    if (!t || t.status !== 'running') return null;
    const matches = tRef.collection('matches');
    const final = (await tx.get(matches.doc(bracketId(t.rounds, 0)))).data()!;
    const semis =
      t.rounds >= 2
        ? await Promise.all(
            [0, 1].map(async s =>
              (await tx.get(matches.doc(bracketId(t.rounds - 1, s)))).data(),
            ),
          )
        : [];
    const players = await tx.get(tRef.collection('players'));
    const loserOf = (m?: DocumentData) =>
      m && m.result === 'win'
        ? (m.players as string[]).find(p => p !== m.winnerUid) ?? null
        : null;
    const placements = [
      final.winnerUid ?? null,
      loserOf(final),
      ...semis.map(loserOf),
    ];
    payout(tx, tRef, t, players.docs, placements);
    return { t, champion: placements[0] };
  });
  if (result?.champion) await notifyFinished(tRef, result.t, result.champion);
}

async function notifyFinished(
  tRef: DocumentReference,
  t: DocumentData,
  champion: string,
) {
  // Os prints do deck só servem pra validar: somem com o fim do torneio.
  await deleteTournamentDecks(tRef.id);
  const players = (await tRef.collection('players').get()).docs.map(d => d.id);
  const championDoc = await users.doc(champion).get();
  // O `t` recebido é de antes da premiação: o bolo vem do documento atual.
  const pot = (await tRef.get()).get('pot') ?? 0;
  const nick = championDoc.get('nick') ?? '...';
  // Post do campeão no Feed (fora da transação: precisa da cidade dele, e
  // um post a menos não estraga nada). Na cidade do campeão e no Geral.
  await db.collection('feed').add({
    type: 'tournament',
    tournamentId: tRef.id,
    tournamentName: t.name,
    format: t.format,
    winnerUid: champion,
    playerCount: t.playerCount ?? players.length,
    stars: pot,
    category: t.category,
    cityIds: championDoc.get('cityId') ? [championDoc.get('cityId')] : [],
    createdAt: FieldValue.serverTimestamp(),
  });
  await Promise.all(
    players.map(uid =>
      notifyUser(uid, {
        title: `${t.name} terminou`,
        body:
          uid === champion
            ? 'Você é o campeão! Medalha Campeão conquistada.'
            : `@${nick} é o campeão.`,
        link: `/tournament/${tRef.id}`,
      }),
    ),
  );
}

// Acompanha o duelo de cada partida: o estado (aguardando confirmação, em
// disputa) vai pra chave, pro organizador ver onde agir; no fim (confirmado,
// prazo ou decisão do organizador), avança o torneio.
export const onTournamentDuelEnded = onDocumentUpdated(
  { document: 'duels/{duelId}', database: 'duel-start' },
  async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after?.tournamentId || before.status === after.status)
      return;
    const tRef = tournaments.doc(after.tournamentId);
    if (after.status !== 'done' && after.status !== 'cancelled') {
      await tRef
        .collection('matches')
        .doc(after.matchId)
        .update({ duelStatus: after.status });
      return;
    }
    const winner = after.status === 'done' ? (after.winnerUid as string) : null;
    await settleAndAdvance(
      tRef,
      after.matchId,
      winner,
      winner ? 'win' : 'double_loss',
    );
    await markRoundReady(tRef);
  },
);

// --- Rodadas manuais -------------------------------------------------------
//
// No modo manual (roundMode 'manual') as partidas nascem 'ready', sem duelo.
// Quando nenhuma está em jogo e há confrontos prontos, a rodada fica
// 'ready' e o organizador é avisado. Ele inicia com um prazo (data e hora,
// ou sem prazo) e um aviso, que vai por push pra todos e fica fixo na tela
// do torneio - o "canal de avisos" dentro do app.

const MIN_DEADLINE_MS = 10 * 60 * 1000;
const MAX_DEADLINE_MS = 60 * 24 * 60 * 60 * 1000;
const NOTICE_MAX = 280;

// "quarta-feira, 29/10 às 22:00" (horário de Brasília).
export function formatDeadline(ms: number): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(new Date(ms))
      .map(part => [part.type, part.value]),
  );
  return `${parts.weekday}, ${parts.day}/${parts.month} às ${parts.hour}:${parts.minute}`;
}

function readDeadline(value: unknown): number | null {
  if (value == null) return null;
  const ms = Number(value);
  const now = Date.now();
  if (!Number.isFinite(ms) || ms < now + MIN_DEADLINE_MS)
    throw new HttpsError(
      'invalid-argument',
      'O prazo precisa ser pelo menos 10 minutos a partir de agora.',
    );
  if (ms > now + MAX_DEADLINE_MS)
    throw new HttpsError(
      'invalid-argument',
      'O prazo pode ser de até 60 dias.',
    );
  return ms;
}

const matchLabel = (t: DocumentData, m: DocumentData) =>
  m.stage === 'swiss'
    ? swissLabel(m.round, t.swissRounds)
    : roundLabel(m.round, t.rounds);

function requireOrganizer(t: DocumentData | undefined, uid: string) {
  if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
  if (t.organizerUid !== uid)
    throw new HttpsError(
      'permission-denied',
      'Só o organizador pode fazer isso.',
    );
  return t;
}

async function markRoundReady(tRef: DocumentReference) {
  const t = await db.runTransaction(async tx => {
    const data = (await tx.get(tRef)).data();
    if (
      !data ||
      !manualRounds(data) ||
      data.status !== 'running' ||
      data.roundPhase !== 'playing'
    )
      return null;
    const matches = tRef.collection('matches');
    const [active, ready] = await Promise.all([
      tx.get(matches.where('status', '==', 'active').limit(1)),
      tx.get(matches.where('status', '==', 'ready').limit(1)),
    ]);
    if (!active.empty || ready.empty) return null;
    tx.update(tRef, { roundPhase: 'ready', roundDeadlineAt: null });
    return {
      name: data.name as string,
      organizerUid: data.organizerUid as string,
      next: matchLabel(data, ready.docs[0].data()),
    };
  });
  if (!t) return;
  await notifyUser(t.organizerUid, {
    title: `${t.name}: ${t.next} pronta`,
    body: 'Todas as partidas terminaram. Inicie a próxima rodada quando quiser.',
    link: `/tournament/${tRef.id}`,
  });
}

// Quem recebe os avisos: no suíço todos seguem jogando; no mata-mata, só
// quem ainda está na chave (os das partidas desta rodada).
const noticeTargets = (t: DocumentData, matchPlayers: string[]) =>
  t.stage === 'swiss' ? (t.playerUids as string[]) : matchPlayers;

export const startTournamentRound = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));
  const deadlineMs = readDeadline(request.data?.deadlineAt);
  const message = text(request.data?.message, NOTICE_MAX);

  const started = await db.runTransaction(async tx => {
    const t = requireOrganizer((await tx.get(tRef)).data(), uid);
    if (t.status !== 'running' || !manualRounds(t) || t.roundPhase !== 'ready')
      throw new HttpsError(
        'failed-precondition',
        'Não há rodada pronta para iniciar.',
      );
    const matches = tRef.collection('matches');
    const [active, ready] = await Promise.all([
      tx.get(matches.where('status', '==', 'active').limit(1)),
      tx.get(matches.where('status', '==', 'ready')),
    ]);
    if (!active.empty || ready.empty)
      throw new HttpsError(
        'failed-precondition',
        'Ainda há partidas da rodada anterior em jogo.',
      );
    const created: Created[] = [];
    for (const doc of ready.docs) {
      const m = doc.data();
      const label = matchLabel(t, m);
      const players = m.players as [string, string];
      const duelId = createMatchDuel(
        tx,
        tRef,
        t,
        { id: doc.id, round: m.round, stage: m.stage, label },
        players,
        deadlineMs,
      );
      tx.update(doc.ref, { status: 'active', duelId });
      created.push({ label, players, duelId });
    }
    const label = created[0].label;
    tx.update(tRef, {
      roundPhase: 'playing',
      roundLabel: label,
      roundDeadlineAt: deadlineMs ? Timestamp.fromMillis(deadlineMs) : null,
      notice: message
        ? { text: message, at: FieldValue.serverTimestamp() }
        : null,
    });
    return { t, created, label };
  });

  const { t, created, label } = started;
  const deadline = deadlineMs
    ? `Prazo: ${formatDeadline(deadlineMs)}.`
    : 'Sem prazo.';
  const nicks = new Map<string, string>();
  const matchPlayers = created.flatMap(m => m.players);
  await Promise.all(
    matchPlayers.map(async p =>
      nicks.set(p, (await users.doc(p).get()).get('nick') ?? '...'),
    ),
  );
  const matchOf = new Map(
    created.flatMap(m => m.players.map(p => [p, m] as const)),
  );
  await Promise.all(
    noticeTargets(t, matchPlayers).map(player => {
      const m = matchOf.get(player);
      const opponent = m?.players.find(p => p !== player);
      return notifyUser(player, {
        title: `${t.name}: ${label} começou`,
        body: [
          message,
          opponent
            ? `Você enfrenta @${nicks.get(opponent)}.`
            : 'Você está de folga (bye) nesta rodada.',
          message ? '' : deadline,
        ]
          .filter(Boolean)
          .join(' '),
        link: m ? `/duel/${m.duelId}` : `/tournament/${tRef.id}`,
      });
    }),
  );
  return { ok: true };
});

// Muda o prazo da rodada em jogo (estender quando alguém pede mais um dia).
export const setTournamentRoundDeadline = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));
  const deadlineMs = readDeadline(request.data?.deadlineAt);

  const out = await db.runTransaction(async tx => {
    const t = requireOrganizer((await tx.get(tRef)).data(), uid);
    if (t.status !== 'running' || t.roundPhase !== 'playing')
      throw new HttpsError(
        'failed-precondition',
        'Não há rodada em jogo agora.',
      );
    const active = await tx.get(
      tRef.collection('matches').where('status', '==', 'active'),
    );
    const roundMinutes =
      deadlineMs && Math.round((deadlineMs - Date.now()) / 60000);
    for (const doc of active.docs) {
      const duelId = doc.get('duelId');
      if (!duelId) continue;
      tx.update(duels.doc(duelId), {
        deadlineAt: deadlineMs ? Timestamp.fromMillis(deadlineMs) : null,
        roundMinutes,
        reminderSent: false,
      });
    }
    tx.update(tRef, {
      roundDeadlineAt: deadlineMs ? Timestamp.fromMillis(deadlineMs) : null,
    });
    return {
      t,
      players: active.docs.flatMap(d => d.get('players') as string[]),
    };
  });

  await Promise.all(
    noticeTargets(out.t, out.players).map(player =>
      notifyUser(player, {
        title: `${out.t.name}: prazo alterado`,
        body: deadlineMs
          ? `${out.t.roundLabel ?? 'A rodada'} agora vai até ${formatDeadline(
              deadlineMs,
            )}.`
          : `${out.t.roundLabel ?? 'A rodada'} agora está sem prazo.`,
        link: `/tournament/${tRef.id}`,
      }),
    ),
  );
  return { ok: true };
});

// Aviso livre do organizador: fica fixo na tela e vai por push pros inscritos.
export const postTournamentNotice = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));
  const message = text(request.data?.message, NOTICE_MAX);
  if (message.length < 3)
    throw new HttpsError('invalid-argument', 'Escreva o aviso.');

  const t = await db.runTransaction(async tx => {
    const data = requireOrganizer((await tx.get(tRef)).data(), uid);
    if (!ACTIVE.includes(data.status))
      throw new HttpsError('failed-precondition', 'O torneio já terminou.');
    tx.update(tRef, {
      notice: { text: message, at: FieldValue.serverTimestamp() },
    });
    return data;
  });

  await Promise.all(
    (t.playerUids as string[])
      .filter(player => player !== uid)
      .map(player =>
        notifyUser(player, {
          title: `${t.name}: aviso do organizador`,
          body: message,
          link: `/tournament/${tRef.id}`,
        }),
      ),
  );
  return { ok: true };
});

// Organizador destrava uma partida parada: dá a vitória a um lado (W.O.) ou
// derrota dupla. O trigger acima avança o torneio.
export const resolveTournamentMatch = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));
  const id = String(request.data?.matchId ?? '');
  const winnerUid = request.data?.winnerUid
    ? String(request.data.winnerUid)
    : null;

  const unlocked = await db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (t.organizerUid !== uid)
      throw new HttpsError(
        'permission-denied',
        'Só o organizador pode decidir partidas.',
      );
    const match = (await tx.get(tRef.collection('matches').doc(id))).data();
    if (match && (match.players as string[]).includes(uid)) {
      throw new HttpsError(
        'permission-denied',
        'Você joga essa partida: ela segue pelo informe dos dois e pelo prazo da rodada.',
      );
    }
    if (!match || match.status !== 'active' || !match.duelId) {
      throw new HttpsError(
        'failed-precondition',
        'Essa partida não está em andamento.',
      );
    }
    const duelRef = duels.doc(match.duelId);
    const duel = (await tx.get(duelRef)).data()!;
    if (!['active', 'awaiting', 'disputed'].includes(duel.status)) {
      throw new HttpsError(
        'failed-precondition',
        'Essa partida já tem resultado.',
      );
    }
    if (winnerUid) {
      if (!(match.players as string[]).includes(winnerUid))
        throw new HttpsError('invalid-argument', 'Jogador inválido.');
      const reads = await readFinalizeData(tx, duel.players);
      return applyFinalize(tx, duelRef, duel, winnerUid, reads).unlocked;
    }
    applyCancel(tx, duelRef, duel);
    return undefined;
  });
  await notifyAllMedals(unlocked);
  return { ok: true };
});

// Torneio sem data que nunca começou: cancelado depois de 30 dias (devolve
// as estrelas e libera o organizador pra criar outro).
const UNDATED_MAX_MS = 30 * 24 * 60 * 60 * 1000;

async function expireUndated(now: number) {
  const stale = await tournaments
    .where('status', 'in', NOT_STARTED)
    .where('startsAt', '==', null)
    .where('createdAt', '<=', Timestamp.fromMillis(now - UNDATED_MAX_MS))
    .get();
  for (const doc of stale.docs) {
    await db.runTransaction(async tx => {
      const t = (await tx.get(doc.ref)).data();
      if (t && NOT_STARTED.includes(t.status)) await cancelInTx(tx, doc.ref, t);
    });
    await deleteTournamentDecks(doc.id);
    await notifyUser(doc.get('organizerUid'), {
      title: `${doc.get('name')} foi cancelado`,
      body: 'O torneio ficou 30 dias sem começar. As estrelas da inscrição voltaram para todos.',
      link: `/tournament/${doc.id}`,
    });
  }
}

// Lembrete do prazo, de hora em hora: quem ainda não informou o resultado
// recebe um aviso quando faltam menos de 24 h. Só em rodadas de 1 dia ou
// mais - na de 50 min o jogador está na mesa.
const REMINDER_MS = 24 * 60 * 60 * 1000;

export const remindTournamentDeadlines = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'America/Sao_Paulo' },
  async () => {
    const now = Date.now();
    await expireUndated(now);
    const soon = await duels
      .where('status', 'in', ['active', 'awaiting', 'disputed'])
      .where('deadlineAt', '<=', Timestamp.fromMillis(now + REMINDER_MS))
      .get();
    for (const doc of soon.docs) {
      const duel = doc.data();
      const deadline = (duel.deadlineAt as Timestamp).toMillis();
      if (
        duel.reminderSent ||
        deadline <= now ||
        (duel.roundMinutes ?? 0) < 24 * 60
      )
        continue;
      await doc.ref.update({ reminderSent: true });
      const hours = Math.max(
        1,
        Math.round((deadline - now) / (60 * 60 * 1000)),
      );
      const pending = (duel.players as string[]).filter(
        uid => !duel.reports?.[uid],
      );
      await Promise.all(
        pending.map(uid =>
          notifyUser(uid, {
            title: `${duel.tournamentName}: faltam ${hours} h`,
            body:
              duel.status === 'awaiting'
                ? 'Seu oponente já informou o resultado. Confirme antes do fim do prazo.'
                : 'Informe o resultado da sua partida. Sem resultado no prazo, é derrota dupla.',
            link: `/duel/${doc.id}`,
          }),
        ),
      );
    }
  },
);
