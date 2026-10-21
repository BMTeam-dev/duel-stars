import { randomBytes } from 'crypto';
import { DocumentData, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db } from './config';

// Torneios: criação e inscrição (rodadas e pareamento vêm depois). Regras
// no doc do MVP, seção "Torneios". Tudo que trava estrelas, confere senha
// ou limita vagas passa por aqui, em transação - o app só lê.
//
// tournaments/{id}                 dados públicos (lista, card, tela)
// tournaments/{id}/players/{uid}   inscritos (pago, estrelas travadas)
// tournamentSecrets/{id}           senha do privado (só o organizador lê)

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
      tx.update(users.doc(uid), { [walletPath(t.category, 'lockedStars')]: FieldValue.increment(-locked) });
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
    if (!ACTIVE.includes(t.status)) throw new HttpsError('failed-precondition', 'Esse torneio já terminou.');
    const players = await tx.get(ref.collection('players'));
    // Devolve as estrelas da inscrição de todo mundo.
    for (const player of players.docs) {
      const locked = player.get('starsLocked') ?? 0;
      if (locked > 0) {
        tx.update(users.doc(player.id), { [walletPath(t.category, 'lockedStars')]: FieldValue.increment(-locked) });
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
