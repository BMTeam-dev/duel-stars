import { randomBytes } from 'crypto';
import {
  DocumentData,
  DocumentReference,
  FieldValue,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { db, RULES } from './config';
import { notifyUser } from './notify';

// Tudo que mexe em estrelas acontece aqui, em transação, nunca no app (as
// regras do Firestore proíbem o app de escrever estrelas). Fluxo completo no
// doc do MVP, seção "Fluxo do desafio".
//
// Cada categoria (TCG presencial, Master Duel, Duel Links) tem a sua carteira
// em users.wallets.<categoria>: estrelas, vitórias, derrotas e sequência
// separadas - um duelo só mexe na carteira da categoria dele.
//
// Estrelas apostadas ficam "travadas" (wallets.<cat>.lockedStars) do aceite
// até o fim do duelo: o saldo continua em `stars`, mas `stars - lockedStars`
// é o que dá pra apostar em outro desafio ao mesmo tempo.

type Format = 'bo1' | 'bo3';
type Category = 'tcg' | 'md' | 'dl';
const CATEGORIES: Category[] = ['tcg', 'md', 'dl'];

function isCategory(value: unknown): value is Category {
  return CATEGORIES.includes(value as Category);
}

// Caminho de um campo da carteira, pra update com notação de ponto.
const walletPath = (category: Category, field: string) => `wallets.${category}.${field}`;
type DuelStatus = 'active' | 'awaiting' | 'disputed' | 'done' | 'cancelled';

const users = db.collection('users');
const duels = db.collection('duels');
const challenges = db.collection('challenges');
const feed = db.collection('feed');

function requireAuth(uid: string | undefined): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para duelar.');
  return uid;
}

function wallet(user: DocumentData, category: Category): DocumentData {
  return user.wallets?.[category] ?? {};
}

function available(user: DocumentData, category: Category): number {
  const w = wallet(user, category);
  return (w.stars ?? 0) - (w.lockedStars ?? 0);
}

// Código curto mostrado embaixo do QR, pra digitar quando a câmera não lê.
// Sem 0/O, 1/I/L pra não confundir na hora de digitar.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function randomCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  return Array.from(bytes, byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

async function openWithCode(code: string): Promise<string | null> {
  const found = await challenges.where('code', '==', code).where('status', '==', 'open').get();
  const valid = found.docs.find(doc => (doc.get('expiresAt') as Timestamp).toMillis() > Date.now());
  return valid?.id ?? null;
}

// Aceita o token do QR ou o código curto; devolve sempre o token (id do doc).
async function resolveToken(input: unknown): Promise<string> {
  const value = String(input ?? '').trim();
  if (value.length !== CODE_LENGTH) return value;
  // Desafio expirado continua 'open' no banco (ninguém fecha), então o
  // filtro de validade é aqui - senão um código antigo esconderia o novo.
  const found = await openWithCode(value.toUpperCase());
  if (!found) throw new HttpsError('not-found', 'Nenhum desafio aberto com esse código.');
  return found;
}

function other(players: string[], uid: string): string {
  return players[0] === uid ? players[1] : players[0];
}

export const createChallenge = onCall<{ stake: number; format: Format; category: Category }>(async request => {
  const uid = requireAuth(request.auth?.uid);
  const { stake, format, category } = request.data ?? {};
  if (!isCategory(category)) throw new HttpsError('invalid-argument', 'Categoria inválida.');
  if (!Number.isInteger(stake) || stake < RULES.minStake || stake > RULES.maxStake) {
    throw new HttpsError('invalid-argument', `A aposta vai de ${RULES.minStake} a ${RULES.maxStake} estrelas.`);
  }
  if (format !== 'bo1' && format !== 'bo3') {
    throw new HttpsError('invalid-argument', 'Formato inválido.');
  }

  const user = await users.doc(uid).get();
  if (!user.exists) throw new HttpsError('failed-precondition', 'Conclua seu cadastro antes de duelar.');
  if (available(user.data()!, category) < stake) {
    throw new HttpsError('failed-precondition', 'Você não tem estrelas suficientes para essa aposta.');
  }

  // O token é o que vai no QR: aleatório e de vida curta, pra um print do QR
  // não servir de desafio depois.
  const token = randomBytes(15).toString('base64url');
  const expiresAt = Timestamp.fromMillis(Date.now() + RULES.challengeTtlMs);
  // Código único entre os desafios abertos (abertos duram só 5 min, então
  // colisão é rara; tenta de novo se acontecer).
  let code = randomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!(await openWithCode(code))) break;
    code = randomCode();
  }
  await challenges.doc(token).set({
    code,
    category,
    creatorUid: uid,
    stake,
    format,
    status: 'open',
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  });
  return { token, code, expiresAt: expiresAt.toMillis() };
});

export const cancelChallenge = onCall<{ token: string }>(async request => {
  const uid = requireAuth(request.auth?.uid);
  const ref = challenges.doc(String(request.data?.token ?? ''));
  await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists || snapshot.get('creatorUid') !== uid) {
      throw new HttpsError('not-found', 'Desafio não encontrado.');
    }
    if (snapshot.get('status') === 'open') tx.update(ref, { status: 'cancelled' });
  });
  return { ok: true };
});

// O que a tela "Aceitar desafio" mostra antes do aceite: quem desafiou,
// aposta, formato e o placar entre os dois. As regras não deixam o app ler
// o desafio de outra pessoa direto, então passa por aqui.
export const previewChallenge = onCall<{ token: string }>(async request => {
  const uid = requireAuth(request.auth?.uid);
  const snapshot = await challenges.doc(await resolveToken(request.data?.token)).get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Desafio não encontrado. Confira o QR ou o código.');
  const { creatorUid, stake, format, status, expiresAt } = snapshot.data()!;
  const category: Category = snapshot.get('category') ?? 'tcg';
  if (status !== 'open') throw new HttpsError('failed-precondition', 'Esse desafio já foi usado ou cancelado.');
  if ((expiresAt as Timestamp).toMillis() < Date.now()) {
    throw new HttpsError('deadline-exceeded', 'Esse desafio expirou. Peça para gerar outro.');
  }
  if (creatorUid === uid) throw new HttpsError('failed-precondition', 'Esse desafio é seu. Mande o código para o oponente.');
  const [creator, rival] = await Promise.all([
    users.doc(creatorUid).get(),
    users.doc(uid).collection('rivals').doc(creatorUid).get(),
  ]);
  return {
    creator: {
      uid: creatorUid,
      nick: creator.get('nick'),
      photoUrl: creator.get('photoUrl') ?? null,
      cityName: creator.get('cityName'),
      stateId: creator.get('stateId'),
      wins: wallet(creator.data() ?? {}, category).wins ?? 0,
      losses: wallet(creator.data() ?? {}, category).losses ?? 0,
    },
    stake,
    format,
    category,
    expiresAt: (expiresAt as Timestamp).toMillis(),
    // Placar do ponto de vista de quem está aceitando.
    headToHead: { wins: rival.get('wins') ?? 0, losses: rival.get('losses') ?? 0 },
  };
});

export const acceptChallenge = onCall<{ token: string }>(async request => {
  const uid = requireAuth(request.auth?.uid);
  const token = await resolveToken(request.data?.token);
  if (!token) throw new HttpsError('invalid-argument', 'QR inválido.');

  const duelRef = duels.doc();
  const result = await db.runTransaction(async tx => {
    const challengeRef = challenges.doc(token);
    const challenge = await tx.get(challengeRef);
    if (!challenge.exists) throw new HttpsError('not-found', 'Desafio não encontrado. Confira o QR ou o código.');
    const { creatorUid, stake, format, status, expiresAt } = challenge.data()!;
    const category: Category = challenge.get('category') ?? 'tcg';
    if (status !== 'open') throw new HttpsError('failed-precondition', 'Esse desafio já foi usado ou cancelado.');
    if ((expiresAt as Timestamp).toMillis() < Date.now()) {
      throw new HttpsError('deadline-exceeded', 'Esse desafio expirou. Peça para gerar outro.');
    }
    if (creatorUid === uid) throw new HttpsError('failed-precondition', 'Você não pode aceitar o próprio desafio.');

    const [creator, acceptor] = await Promise.all([
      tx.get(users.doc(creatorUid)),
      tx.get(users.doc(uid)),
    ]);
    if (!acceptor.exists) throw new HttpsError('failed-precondition', 'Conclua seu cadastro antes de duelar.');
    if (!creator.exists) throw new HttpsError('not-found', 'Quem criou o desafio não existe mais.');
    if (available(acceptor.data()!, category) < stake) {
      throw new HttpsError('failed-precondition', `Você precisa de ${stake} estrelas livres para aceitar.`);
    }
    if (available(creator.data()!, category) < stake) {
      throw new HttpsError('failed-precondition', 'Quem te desafiou não tem mais estrelas para essa aposta.');
    }

    // Anti-farm: no máximo N duelos com aposta contra o mesmo jogador em 24h.
    const recent = await tx.get(
      duels
        .where('players', 'array-contains', uid)
        .where('createdAt', '>=', Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000)),
    );
    const sameOpponent = recent.docs.filter(
      doc => (doc.get('players') as string[]).includes(creatorUid) && doc.get('status') !== 'cancelled',
    ).length;
    if (sameOpponent >= RULES.maxDuelsPerOpponentPerDay) {
      throw new HttpsError(
        'resource-exhausted',
        `Vocês já fizeram ${RULES.maxDuelsPerOpponentPerDay} duelos com aposta nas últimas 24 horas.`,
      );
    }

    const cityIds = Array.from(new Set([creator.get('cityId'), acceptor.get('cityId')]));
    tx.set(duelRef, {
      players: [creatorUid, uid],
      stake,
      format,
      category,
      status: 'active' as DuelStatus,
      reports: {},
      cityIds,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(challengeRef, { status: 'used', duelId: duelRef.id });
    tx.update(users.doc(creatorUid), { [walletPath(category, 'lockedStars')]: FieldValue.increment(stake) });
    tx.update(users.doc(uid), { [walletPath(category, 'lockedStars')]: FieldValue.increment(stake) });
    return { creatorUid, acceptorNick: acceptor.get('nick') as string };
  });

  await notifyUser(result.creatorUid, {
    title: 'Desafio aceito!',
    body: `@${result.acceptorNick} aceitou seu desafio. Bom duelo!`,
    link: `/duel/${duelRef.id}`,
  });
  return { duelId: duelRef.id };
});

// Lê tudo que o fim do duelo precisa ANTES de qualquer escrita (exigência
// das transações do Firestore).
async function readFinalizeData(tx: Transaction, players: string[]) {
  const [a, b] = players;
  const [userA, userB, rivalAB, rivalBA] = await Promise.all([
    tx.get(users.doc(a)),
    tx.get(users.doc(b)),
    tx.get(users.doc(a).collection('rivals').doc(b)),
    tx.get(users.doc(b).collection('rivals').doc(a)),
  ]);
  return { userA, userB, rivalAB, rivalBA };
}

function applyFinalize(
  tx: Transaction,
  duelRef: DocumentReference,
  duel: DocumentData,
  winnerUid: string,
  reads: Awaited<ReturnType<typeof readFinalizeData>>,
) {
  const players = duel.players as string[];
  const loserUid = other(players, winnerUid);
  const stake = duel.stake as number;
  const category: Category = duel.category ?? 'tcg';
  const winner = players[0] === winnerUid ? reads.userA : reads.userB;
  const winnerWallet = wallet(winner.data() ?? {}, category);
  const now = FieldValue.serverTimestamp();
  const path = (field: string) => walletPath(category, field);

  const streak = (winnerWallet.streak ?? 0) + 1;
  tx.update(users.doc(winnerUid), {
    [path('stars')]: FieldValue.increment(stake),
    [path('lockedStars')]: FieldValue.increment(-stake),
    [path('wins')]: FieldValue.increment(1),
    [path('streak')]: streak,
    [path('bestStreak')]: Math.max(streak, winnerWallet.bestStreak ?? 0),
    // Entra no ranking da categoria a partir do primeiro duelo encerrado.
    [path('ranked')]: true,
  });
  tx.update(users.doc(loserUid), {
    [path('stars')]: FieldValue.increment(-stake),
    [path('lockedStars')]: FieldValue.increment(-stake),
    [path('losses')]: FieldValue.increment(1),
    [path('streak')]: 0,
    [path('ranked')]: true,
  });

  // Placar entre os dois - base de "Meu Freguês" / "Minha Nêmesis".
  tx.set(
    users.doc(winnerUid).collection('rivals').doc(loserUid),
    { wins: FieldValue.increment(1), lastDuelAt: now, lastWinnerUid: winnerUid },
    { merge: true },
  );
  tx.set(
    users.doc(loserUid).collection('rivals').doc(winnerUid),
    { losses: FieldValue.increment(1), lastDuelAt: now, lastWinnerUid: winnerUid },
    { merge: true },
  );

  tx.update(duelRef, { status: 'done' as DuelStatus, winnerUid, loserUid, endedAt: now });

  // Feed guarda só uids: o app mostra sempre o nick atual de cada um.
  tx.set(feed.doc(), {
    type: 'win',
    duelId: duelRef.id,
    winnerUid,
    loserUid,
    stars: stake,
    format: duel.format,
    category,
    cityIds: duel.cityIds ?? [],
    createdAt: now,
  });
  return { loserUid, stake };
}

function applyCancel(tx: Transaction, duelRef: DocumentReference, duel: DocumentData) {
  const stake = duel.stake as number;
  const category: Category = duel.category ?? 'tcg';
  for (const uid of duel.players as string[]) {
    tx.update(users.doc(uid), { [walletPath(category, 'lockedStars')]: FieldValue.increment(-stake) });
  }
  tx.update(duelRef, { status: 'cancelled' as DuelStatus, endedAt: FieldValue.serverTimestamp() });
}

async function notifyDone(winnerUid: string, loserUid: string, stake: number, duelId: string) {
  await Promise.all([
    notifyUser(winnerUid, {
      title: 'Vitória confirmada!',
      body: `Você ganhou ${stake} estrelas.`,
      link: `/duel/${duelId}`,
    }),
    notifyUser(loserUid, {
      title: 'Resultado confirmado',
      body: `Você perdeu ${stake} estrelas. Bora pra revanche?`,
      link: `/duel/${duelId}`,
    }),
  ]);
}

export const reportResult = onCall<{ duelId: string; winnerUid: string }>(async request => {
  const uid = requireAuth(request.auth?.uid);
  const duelRef = duels.doc(String(request.data?.duelId ?? ''));
  const winnerUid = String(request.data?.winnerUid ?? '');

  const outcome = await db.runTransaction(async tx => {
    const snapshot = await tx.get(duelRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Duelo não encontrado.');
    const duel = snapshot.data()!;
    const players = duel.players as string[];
    if (!players.includes(uid)) throw new HttpsError('permission-denied', 'Esse duelo não é seu.');
    if (!players.includes(winnerUid)) throw new HttpsError('invalid-argument', 'Vencedor inválido.');
    if (duel.status !== 'active' && duel.status !== 'awaiting' && duel.status !== 'disputed') {
      throw new HttpsError('failed-precondition', 'Esse duelo já foi encerrado.');
    }

    const reads = await readFinalizeData(tx, players);
    const opponent = other(players, uid);
    const opponentReport: string | undefined = duel.reports?.[opponent];

    // Em disputa, só muda alguma coisa quem corrige o próprio informe pra
    // concordar com o do oponente - aí o duelo fecha. Repetir a mesma
    // versão não reinicia o prazo de 48h nem conta outra disputa.
    if (duel.status === 'disputed' && opponentReport !== winnerUid) {
      return { kind: 'unchanged' as const };
    }

    if (!opponentReport) {
      tx.update(duelRef, {
        [`reports.${uid}`]: winnerUid,
        status: 'awaiting' as DuelStatus,
        firstReportAt: FieldValue.serverTimestamp(),
      });
      return { kind: 'awaiting' as const, opponent };
    }
    if (opponentReport === winnerUid) {
      tx.update(duelRef, { [`reports.${uid}`]: winnerUid });
      const { loserUid, stake } = applyFinalize(tx, duelRef, duel, winnerUid, reads);
      return { kind: 'done' as const, winnerUid, loserUid, stake };
    }
    // Discordaram: estrelas continuam travadas e nada vai pro feed.
    tx.update(duelRef, {
      [`reports.${uid}`]: winnerUid,
      status: 'disputed' as DuelStatus,
      disputedAt: FieldValue.serverTimestamp(),
    });
    for (const player of players) {
      tx.update(users.doc(player), { disputeCount: FieldValue.increment(1) });
    }
    return { kind: 'disputed' as const, players };
  });

  if (outcome.kind === 'awaiting') {
    const nick = (await users.doc(uid).get()).get('nick');
    await notifyUser(outcome.opponent, {
      title: 'Confirme o resultado',
      body: `@${nick} informou o resultado do duelo. Confirme em até 24 horas.`,
      link: `/duel/${duelRef.id}`,
    });
  } else if (outcome.kind === 'done') {
    await notifyDone(outcome.winnerUid, outcome.loserUid, outcome.stake, duelRef.id);
  } else if (outcome.kind === 'disputed') {
    await Promise.all(
      outcome.players.map(player =>
        notifyUser(player, {
          title: 'Resultado em disputa',
          body: 'Vocês informaram vencedores diferentes. As estrelas ficam travadas por até 48 horas.',
          link: `/duel/${duelRef.id}`,
        }),
      ),
    );
  }
  return { status: outcome.kind === 'unchanged' ? 'disputed' : outcome.kind };
});

// Prazos do duelo (doc do MVP, "Regras das estrelas"): sem confirmação em
// 24h vale o resultado informado; disputa ou duelo abandonado por 48h é
// cancelado e as apostas voltam.
export const expireDuels = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'America/Sao_Paulo' },
  async () => {
    const now = Date.now();
    const [awaiting, disputed, abandoned] = await Promise.all([
      duels
        .where('status', '==', 'awaiting')
        .where('firstReportAt', '<=', Timestamp.fromMillis(now - RULES.confirmWindowMs))
        .get(),
      duels
        .where('status', '==', 'disputed')
        .where('disputedAt', '<=', Timestamp.fromMillis(now - RULES.disputeWindowMs))
        .get(),
      duels
        .where('status', '==', 'active')
        .where('createdAt', '<=', Timestamp.fromMillis(now - RULES.abandonedWindowMs))
        .get(),
    ]);

    for (const doc of awaiting.docs) {
      try {
        const done = await db.runTransaction(async tx => {
          const snapshot = await tx.get(doc.ref);
          const duel = snapshot.data()!;
          if (duel.status !== 'awaiting') return null;
          const winnerUid = Object.values(duel.reports ?? {})[0] as string;
          const reads = await readFinalizeData(tx, duel.players);
          return { winnerUid, ...applyFinalize(tx, doc.ref, duel, winnerUid, reads) };
        });
        if (done) await notifyDone(done.winnerUid, done.loserUid, done.stake, doc.id);
      } catch (error) {
        logger.error('expireDuels: falha ao confirmar por prazo', { duelId: doc.id, error });
      }
    }

    // QR/código que ninguém usou fica 'open' pra sempre; some depois de 1 dia.
    const staleChallenges = await challenges
      .where('expiresAt', '<=', Timestamp.fromMillis(now - 24 * 60 * 60 * 1000))
      .limit(400)
      .get();
    if (!staleChallenges.empty) {
      const batch = db.batch();
      staleChallenges.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    for (const doc of [...disputed.docs, ...abandoned.docs]) {
      try {
        await db.runTransaction(async tx => {
          const snapshot = await tx.get(doc.ref);
          const duel = snapshot.data()!;
          if (duel.status !== 'disputed' && duel.status !== 'active') return;
          applyCancel(tx, doc.ref, duel);
        });
      } catch (error) {
        logger.error('expireDuels: falha ao cancelar', { duelId: doc.id, error });
      }
    }
  },
);

// Recarga semanal (doc do MVP): quem caiu abaixo de 3 estrelas volta a 10,
// pra ninguém ficar sem poder duelar.
export const weeklyRefill = onSchedule(
  { schedule: 'every monday 06:00', timeZone: 'America/Sao_Paulo' },
  async () => {
    const batch = db.batch();
    let refilled = 0;
    for (const category of CATEGORIES) {
      const low = await users.where(walletPath(category, 'stars'), '<', 3).get();
      low.docs
        .filter(doc => (doc.get(walletPath(category, 'lockedStars')) ?? 0) === 0)
        .forEach(doc => {
          batch.update(doc.ref, { [walletPath(category, 'stars')]: 10 });
          refilled += 1;
        });
    }
    await batch.commit();
    logger.info('weeklyRefill', { refilled });
  },
);
