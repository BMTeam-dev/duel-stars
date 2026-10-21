import { randomBytes } from 'crypto';
import { DocumentData, DocumentReference, FieldValue, Timestamp, Transaction } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db } from './config';
import { applyCancel, applyFinalize, negate, readFinalizeData } from './duels';
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
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 64;
const MAX_STARS_ENTRY = 5;
const MAX_DAYS_AHEAD = 90;
const MAX_OPEN_PER_ORGANIZER = 1;

const users = db.collection('users');
const tournaments = db.collection('tournaments');
const secrets = db.collection('tournamentSecrets');

const walletPath = (category: Category, field: string) => `wallets.${category}.${field}`;
const GAME_LABEL: Record<Category, string> = { tcg: 'TCG', md: 'Master Duel', dl: 'Duel Links' };

// Código curto pra achar o torneio (o privado oculto não aparece na lista).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const randomCode = () =>
  Array.from(randomBytes(6), byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');

function requireAuth(uid: string | undefined): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para participar de torneios.');
  return uid;
}

function text(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function intIn(value: unknown, min: number, max: number, message: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpsError('invalid-argument', message);
  return n;
}

function wallet(user: DocumentData | undefined, category: Category): DocumentData {
  return user?.wallets?.[category] ?? {};
}

export const createTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const d = (request.data ?? {}) as Record<string, unknown>;

  const name = text(d.name, 60);
  if (name.length < 3) throw new HttpsError('invalid-argument', 'Dê um nome com pelo menos 3 letras.');
  const category = d.category as Category;
  if (!CATEGORIES.includes(category)) throw new HttpsError('invalid-argument', 'Categoria inválida.');
  const format = d.format === 'single' ? 'single' : 'swiss';
  const matchFormat = d.matchFormat === 'bo1' ? 'bo1' : 'bo3';
  const visibility = d.visibility === 'private' ? 'private' : 'public';
  const password = text(d.password, 30);
  if (visibility === 'private' && password.length < 3) {
    throw new HttpsError('invalid-argument', 'A senha do torneio privado precisa de pelo menos 3 caracteres.');
  }
  const maxPlayers = intIn(d.maxPlayers, MIN_PLAYERS, MAX_PLAYERS, `As vagas vão de ${MIN_PLAYERS} a ${MAX_PLAYERS}.`);
  const starsEntry = intIn(d.starsEntry ?? 0, 0, MAX_STARS_ENTRY, `A inscrição em estrelas vai de 0 a ${MAX_STARS_ENTRY}.`);
  const minStars = d.minStars == null ? null : intIn(d.minStars, 1, 9999, 'Mínimo de estrelas inválido.');
  const entryFeeCents = d.entryFeeCents == null ? null : intIn(d.entryFeeCents, 100, 1_000_000, 'Valor da inscrição inválido.');
  const pixKey = entryFeeCents ? text(d.pixKey, 77) : '';
  if (entryFeeCents && pixKey.length < 5) throw new HttpsError('invalid-argument', 'Informe a chave Pix para a inscrição paga.');
  const roundMinutes =
    d.roundMinutes == null ? null : intIn(d.roundMinutes, 10, 60 * 24 * 30, 'Prazo da rodada inválido.');

  const startsAtMs = Number(d.startsAt);
  const now = Date.now();
  if (!Number.isFinite(startsAtMs) || startsAtMs < now + 10 * 60 * 1000) {
    throw new HttpsError('invalid-argument', 'O torneio precisa começar pelo menos 10 minutos a partir de agora.');
  }
  if (startsAtMs > now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    throw new HttpsError('invalid-argument', `O início pode ser em até ${MAX_DAYS_AHEAD} dias.`);
  }

  const ref = tournaments.doc();
  await db.runTransaction(async tx => {
    const active = await tx.get(
      tournaments.where('organizerUid', '==', uid).where('status', 'in', ACTIVE).limit(MAX_OPEN_PER_ORGANIZER),
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
      roundMinutes,
      startsAt: Timestamp.fromMillis(startsAtMs),
      code: randomCode(),
      organizerUid: uid,
      status: 'open' as Status,
      playerUids: [],
      playerCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (visibility === 'private') tx.create(secrets.doc(ref.id), { password, organizerUid: uid });
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
    if (playerSnap.exists) throw new HttpsError('already-exists', 'Você já está inscrito.');
    if (t.status !== 'open' || (t.startsAt as Timestamp).toMillis() <= Date.now()) {
      throw new HttpsError('failed-precondition', 'As inscrições desse torneio já fecharam.');
    }
    if (t.playerCount >= t.maxPlayers) throw new HttpsError('resource-exhausted', 'O torneio está lotado.');
    if (t.visibility === 'private' && secretSnap.get('password') !== password) {
      throw new HttpsError('permission-denied', 'Senha incorreta. Peça a senha ao organizador.');
    }

    const user = userSnap.data();
    if (!user) throw new HttpsError('failed-precondition', 'Complete seu cadastro para entrar em torneios.');
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
      throw new HttpsError('failed-precondition', `Esse torneio pede pelo menos ${t.minStars} estrelas no ${GAME_LABEL[category]}.`);
    }
    const free = (w.stars ?? 0) - (w.lockedStars ?? 0);
    if (t.starsEntry > free) {
      throw new HttpsError('failed-precondition', `Você precisa de ${t.starsEntry} estrelas livres para a inscrição.`);
    }

    tx.create(ref.collection('players').doc(uid), {
      uid,
      joinedAt: FieldValue.serverTimestamp(),
      // Inscrição grátis já conta como paga.
      paid: !t.entryFeeCents,
      starsLocked: t.starsEntry,
    });
    tx.update(ref, { playerUids: FieldValue.arrayUnion(uid), playerCount: FieldValue.increment(1) });
    if (t.starsEntry > 0) {
      tx.update(users.doc(uid), { [walletPath(category, 'lockedStars')]: FieldValue.increment(t.starsEntry) });
    }
  });
  return { ok: true };
});

export const leaveTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));

  await db.runTransaction(async tx => {
    const [snap, playerSnap] = await Promise.all([tx.get(ref), tx.get(ref.collection('players').doc(uid))]);
    const t = snap.data();
    if (!t || !playerSnap.exists) throw new HttpsError('not-found', 'Você não está inscrito nesse torneio.');
    if (t.status !== 'open') throw new HttpsError('failed-precondition', 'O torneio já começou.');
    const locked = playerSnap.get('starsLocked') ?? 0;
    tx.delete(playerSnap.ref);
    tx.update(ref, { playerUids: FieldValue.arrayRemove(uid), playerCount: FieldValue.increment(-1) });
    if (locked > 0) {
      tx.update(users.doc(uid), { [walletPath(t.category, 'lockedStars')]: FieldValue.increment(negate(locked)) });
    }
  });
  return { ok: true };
});

export const cancelTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));

  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const t = snap.data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (t.organizerUid !== uid) throw new HttpsError('permission-denied', 'Só o organizador pode cancelar.');
    // Depois do início as partidas já são duelos: aí o caminho é decidir as
    // partidas paradas (resolveTournamentMatch).
    if (t.status !== 'open') throw new HttpsError('failed-precondition', 'O torneio já começou e não pode mais ser cancelado.');
    const players = await tx.get(ref.collection('players'));
    // Devolve as estrelas da inscrição de todo mundo.
    for (const player of players.docs) {
      const locked = player.get('starsLocked') ?? 0;
      if (locked > 0) {
        tx.update(users.doc(player.id), { [walletPath(t.category, 'lockedStars')]: FieldValue.increment(negate(locked)) });
      }
      tx.update(player.ref, { starsLocked: 0 });
    }
    tx.update(ref, { status: 'cancelled' as Status, cancelledAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});

// O app não processa o Pix: o organizador confere e marca quem pagou.
export const setTournamentPlayerPaid = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  const playerUid = String(request.data?.playerUid ?? '');
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Torneio não encontrado.');
  if (snap.get('organizerUid') !== uid) throw new HttpsError('permission-denied', 'Só o organizador pode marcar pagamentos.');
  const player = ref.collection('players').doc(playerUid);
  if (!(await player.get()).exists) throw new HttpsError('not-found', 'Jogador não inscrito.');
  await player.update({ paid: request.data?.paid === true });
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Check-in, início e mata-mata

const CHECKIN_WINDOW_MS = 30 * 60 * 1000;
const duels = db.collection('duels');

type MatchResult = 'win' | 'bye' | 'double_loss';

const matchId = (round: number, slot: number) => `r${round}-s${slot}`;

export const checkInTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  await db.runTransaction(async tx => {
    const [snap, player] = await Promise.all([tx.get(ref), tx.get(ref.collection('players').doc(uid))]);
    const t = snap.data();
    if (!t || !player.exists) throw new HttpsError('not-found', 'Você não está inscrito nesse torneio.');
    if (t.status !== 'open') throw new HttpsError('failed-precondition', 'O torneio já começou.');
    if ((t.startsAt as Timestamp).toMillis() - CHECKIN_WINDOW_MS > Date.now()) {
      throw new HttpsError('failed-precondition', 'O check-in abre 30 minutos antes do início.');
    }
    if (!player.get('paid')) {
      throw new HttpsError('failed-precondition', 'O organizador ainda não confirmou seu pagamento.');
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
  round: number,
  slot: number,
  players: [string, string],
): string {
  const duelRef = duels.doc();
  const deadline = t.roundMinutes ? Timestamp.fromMillis(Date.now() + t.roundMinutes * 60 * 1000) : null;
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
    matchId: matchId(round, slot),
    round,
    rounds: t.rounds,
    deadlineAt: deadline,
  });
  return duelRef.id;
}

export function roundLabel(round: number, rounds: number): string {
  if (round === rounds) return 'Final';
  if (round === rounds - 1) return 'Semifinal';
  if (round === rounds - 2) return 'Quartas de final';
  return `Rodada ${round}`;
}

async function notifyMatch(t: DocumentData, tid: string, round: number, players: string[], duelId: string) {
  const nicks = await Promise.all(players.map(async uid => (await users.doc(uid).get()).get('nick') ?? '...'));
  await Promise.all(
    players.map((uid, i) =>
      notifyUser(uid, {
        title: `${t.name}: ${roundLabel(round, t.rounds)}`,
        body: `Sua partida contra @${nicks[1 - i]} começou. Boa sorte!`,
        link: `/duel/${duelId}`,
      }),
    ),
  );
  logger.info('torneio: partida criada', { tid, round, duelId });
}

export const startTournament = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));

  const started = await db.runTransaction(async tx => {
    const snap = await tx.get(tRef);
    const t = snap.data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (t.organizerUid !== uid) throw new HttpsError('permission-denied', 'Só o organizador pode iniciar.');
    if (t.status !== 'open') throw new HttpsError('failed-precondition', 'Esse torneio já começou.');
    if (t.format !== 'single') {
      throw new HttpsError('unimplemented', 'O suíço ainda está chegando. Por enquanto, só dá para iniciar torneios mata-mata.');
    }
    if ((t.startsAt as Timestamp).toMillis() - CHECKIN_WINDOW_MS > Date.now()) {
      throw new HttpsError('failed-precondition', 'Dá para iniciar a partir de 30 minutos antes do horário marcado.');
    }
    const players = await tx.get(tRef.collection('players'));
    const checked = players.docs.filter(p => p.get('checkedIn'));
    if (checked.length < 2) throw new HttpsError('failed-precondition', 'É preciso pelo menos 2 jogadores com check-in.');

    // Quem não fez check-in sai do torneio e recebe as estrelas de volta.
    for (const p of players.docs.filter(p => !p.get('checkedIn'))) {
      const locked = p.get('starsLocked') ?? 0;
      if (locked > 0) tx.update(users.doc(p.id), { [walletPath(t.category, 'lockedStars')]: FieldValue.increment(negate(locked)) });
      tx.delete(p.ref);
    }

    // Chave: tamanho = potência de 2; byes ficam pros primeiros sorteados
    // (posição i enfrenta a posição size-1-i), então bye nunca pega bye.
    const seeds = shuffle(checked.map(p => p.id));
    let size = 2;
    while (size < seeds.length) size *= 2;
    const rounds = Math.log2(size);
    const tWithRounds = { ...t, rounds };
    const created: { round: number; players: [string, string]; duelId: string }[] = [];
    const byes: { id: string; player: string }[] = [];
    for (let slot = 0; slot < size / 2; slot++) {
      const a = seeds[slot];
      const b = seeds[size - 1 - slot] ?? null;
      const ref = tRef.collection('matches').doc(matchId(1, slot));
      if (b) {
        const duelId = createMatchDuel(tx, tRef, tWithRounds, 1, slot, [a, b]);
        tx.create(ref, { round: 1, slot, players: [a, b], status: 'active', duelId, winnerUid: null, result: null });
        created.push({ round: 1, players: [a, b], duelId });
      } else {
        tx.create(ref, { round: 1, slot, players: [a, null], status: 'pending', duelId: null, winnerUid: null, result: null });
        byes.push({ id: matchId(1, slot), player: a });
      }
    }
    tx.update(tRef, {
      status: 'running',
      rounds,
      currentRound: 1,
      playerUids: seeds,
      playerCount: seeds.length,
      startedAt: FieldValue.serverTimestamp(),
    });
    return { t: tWithRounds, created, byes };
  });

  for (const bye of started.byes) await settleAndAdvance(tRef, bye.id, bye.player, 'bye');
  await Promise.all(started.created.map(m => notifyMatch(started.t, tRef.id, m.round, m.players, m.duelId)));
  return { ok: true };
});

// Fecha uma partida e, se a irmã já terminou, monta a próxima. Devolve o
// que precisa continuar fora da transação (bye em cascata, fim do torneio).
async function settleMatch(
  tRef: DocumentReference,
  id: string,
  winnerUid: string | null,
  result: MatchResult,
): Promise<{ next?: { id: string; winner: string | null }; finished?: boolean; created?: { round: number; players: [string, string]; duelId: string }; t?: DocumentData }> {
  return db.runTransaction(async tx => {
    const tSnap = await tx.get(tRef);
    const t = tSnap.data();
    const matchRef = tRef.collection('matches').doc(id);
    const match = (await tx.get(matchRef)).data();
    if (!t || !match || match.status === 'done' || t.status !== 'running') return {};
    const { round, slot } = match as { round: number; slot: number };
    const last = round === t.rounds;
    const siblingRef = tRef.collection('matches').doc(matchId(round, slot ^ 1));
    const sibling = last ? undefined : (await tx.get(siblingRef)).data();

    tx.update(matchRef, { status: 'done', winnerUid, result, endedAt: FieldValue.serverTimestamp() });
    if (last) return { finished: true };
    if (!sibling || sibling.status !== 'done') return {};

    // Os dois lados decididos: próxima partida (vencedor da posição par em cima).
    const winners = slot % 2 === 0 ? [winnerUid, sibling.winnerUid] : [sibling.winnerUid, winnerUid];
    const nextRound = round + 1;
    const nextSlot = slot >> 1;
    const nextRef = tRef.collection('matches').doc(matchId(nextRound, nextSlot));
    const present = winners.filter((w): w is string => !!w);
    if (present.length === 2) {
      const pair = present as [string, string];
      const duelId = createMatchDuel(tx, tRef, t, nextRound, nextSlot, pair);
      tx.set(nextRef, { round: nextRound, slot: nextSlot, players: pair, status: 'active', duelId, winnerUid: null, result: null });
      if (nextRound > (t.currentRound ?? 1)) tx.update(tRef, { currentRound: nextRound });
      return { created: { round: nextRound, players: pair, duelId }, t };
    }
    // Um lado vazio (derrota dupla antes): quem sobrou passa direto.
    tx.set(nextRef, { round: nextRound, slot: nextSlot, players: winners, status: 'pending', duelId: null, winnerUid: null, result: null });
    return { next: { id: matchId(nextRound, nextSlot), winner: present[0] ?? null } };
  });
}

async function settleAndAdvance(tRef: DocumentReference, id: string, winnerUid: string | null, result: MatchResult) {
  let current: { id: string; winner: string | null; result: MatchResult } | null = { id, winner: winnerUid, result };
  while (current) {
    const out = await settleMatch(tRef, current.id, current.winner, current.result);
    if (out.created && out.t) await notifyMatch(out.t, tRef.id, out.created.round, out.created.players, out.created.duelId);
    if (out.finished) await finishTournament(tRef);
    current = out.next ? { id: out.next.id, winner: out.next.winner, result: out.next.winner ? 'bye' : 'double_loss' } : null;
  }
}

// Bolo de estrelas: 50% campeão, 30% vice, 10% para cada semifinalista;
// sobra de arredondamento (e prêmios sem dono) vai pro campeão.
const PRIZE_SHARES = [0.5, 0.3, 0.1, 0.1];

async function finishTournament(tRef: DocumentReference) {
  const result = await db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    if (!t || t.status !== 'running') return null;
    const matches = tRef.collection('matches');
    const final = (await tx.get(matches.doc(matchId(t.rounds, 0)))).data()!;
    const semis =
      t.rounds >= 2
        ? await Promise.all([0, 1].map(async s => (await tx.get(matches.doc(matchId(t.rounds - 1, s)))).data()))
        : [];
    const players = await tx.get(tRef.collection('players'));

    const loserOf = (m?: DocumentData) =>
      m && m.result === 'win' ? ((m.players as string[]).find(p => p !== m.winnerUid) ?? null) : null;
    const champion: string | null = final.winnerUid ?? null;
    const placements = [champion, loserOf(final), ...semis.map(loserOf)];

    const pot = players.docs.reduce((sum, p) => sum + (p.get('starsLocked') ?? 0), 0);
    const delta = new Map<string, number>();
    const add = (uid: string, n: number) => delta.set(uid, (delta.get(uid) ?? 0) + n);
    if (champion && pot > 0) {
      let paid = 0;
      placements.forEach((uid, i) => {
        if (!uid || i === 0) return;
        const prize = Math.floor(pot * PRIZE_SHARES[i]);
        add(uid, prize);
        paid += prize;
      });
      add(champion, pot - paid);
    }
    for (const p of players.docs) {
      const locked = p.get('starsLocked') ?? 0;
      // Sem campeão (final com derrota dupla), todo mundo recebe a inscrição de volta.
      const change = (champion ? negate(locked) : 0) + (delta.get(p.id) ?? 0);
      tx.update(users.doc(p.id), {
        [walletPath(t.category, 'lockedStars')]: FieldValue.increment(negate(locked)),
        [walletPath(t.category, 'stars')]: FieldValue.increment(change),
      });
    }
    tx.update(tRef, {
      status: 'finished',
      championUid: champion,
      placements: placements.slice(0, 4),
      pot,
      finishedAt: FieldValue.serverTimestamp(),
    });
    return { t, champion, players: players.docs.map(p => p.id) };
  });
  if (!result?.champion) return;
  const nick = (await users.doc(result.champion).get()).get('nick') ?? '...';
  await Promise.all(
    result.players.map(uid =>
      notifyUser(uid, {
        title: `${result.t.name} terminou`,
        body: uid === result.champion ? 'Você é o campeão!' : `@${nick} é o campeão.`,
        link: `/tournament/${tRef.id}`,
      }),
    ),
  );
}

// Fim do duelo de uma partida (confirmado, prazo ou decisão do organizador).
export const onTournamentDuelEnded = onDocumentUpdated(
  { document: 'duels/{duelId}', database: 'duel-start' },
  async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after?.tournamentId || before.status === after.status) return;
    if (after.status !== 'done' && after.status !== 'cancelled') return;
    const tRef = tournaments.doc(after.tournamentId);
    const winner = after.status === 'done' ? (after.winnerUid as string) : null;
    await settleAndAdvance(tRef, after.matchId, winner, winner ? 'win' : 'double_loss');
  },
);

// Organizador destrava uma partida parada: dá a vitória a um lado (W.O.) ou
// derrota dupla. O trigger acima avança a chave.
export const resolveTournamentMatch = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const tRef = tournaments.doc(String(request.data?.id ?? ''));
  const id = String(request.data?.matchId ?? '');
  const winnerUid = request.data?.winnerUid ? String(request.data.winnerUid) : null;

  await db.runTransaction(async tx => {
    const t = (await tx.get(tRef)).data();
    if (!t) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (t.organizerUid !== uid) throw new HttpsError('permission-denied', 'Só o organizador pode decidir partidas.');
    const match = (await tx.get(tRef.collection('matches').doc(id))).data();
    if (!match || match.status !== 'active' || !match.duelId) {
      throw new HttpsError('failed-precondition', 'Essa partida não está em andamento.');
    }
    const duelRef = duels.doc(match.duelId);
    const duel = (await tx.get(duelRef)).data()!;
    if (!['active', 'awaiting', 'disputed'].includes(duel.status)) {
      throw new HttpsError('failed-precondition', 'Essa partida já tem resultado.');
    }
    if (winnerUid) {
      if (!(match.players as string[]).includes(winnerUid)) throw new HttpsError('invalid-argument', 'Jogador inválido.');
      const reads = await readFinalizeData(tx, duel.players);
      applyFinalize(tx, duelRef, duel, winnerUid, reads);
    } else {
      applyCancel(tx, duelRef, duel);
    }
  });
  return { ok: true };
});
