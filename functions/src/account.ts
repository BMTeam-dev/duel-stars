import { getAuth } from 'firebase-admin/auth';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db } from './config';
import {
  cancelTournamentBeforeStart,
  leaveTournamentBeforeStart,
} from './tournaments';

// Exclusão de conta (exigência da Google Play e da App Store).
//
// Apaga o que é do jogador: perfil (carteiras, medalhas), rivais, anotações,
// desafios criados, o nick (fica livre) e o login. Duelos e posts do feed
// ficam - são histórico dos outros jogadores também; o app mostra "conta
// excluída" onde o perfil não existe mais.
//
// Bloqueia enquanto houver estrelas em jogo: duelo em andamento ou torneio
// já iniciado. Torneio que ainda não começou é resolvido aqui (cancela o
// que organiza, sai do que está inscrito) e as estrelas voltam pra todos.

const users = db.collection('users');
const OPEN_DUEL = ['active', 'awaiting', 'disputed'];

async function deleteCollection(path: FirebaseFirestore.CollectionReference) {
  for (;;) {
    const page = await path.limit(400).get();
    if (page.empty) return;
    const batch = db.batch();
    page.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export const deleteAccount = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid)
    throw new HttpsError(
      'unauthenticated',
      'Entre na sua conta para excluí-la.',
    );

  const openDuels = await db
    .collection('duels')
    .where('players', 'array-contains', uid)
    .where('status', 'in', OPEN_DUEL)
    .limit(1)
    .get();
  if (!openDuels.empty) {
    throw new HttpsError(
      'failed-precondition',
      'Você tem um duelo em andamento. Termine ou cancele ele antes de excluir a conta.',
    );
  }

  const tournaments = db.collection('tournaments');
  const [organizing, playing] = await Promise.all([
    tournaments
      .where('organizerUid', '==', uid)
      .where('status', 'in', ['open', 'checkin', 'running'])
      .get(),
    tournaments
      .where('playerUids', 'array-contains', uid)
      .where('status', 'in', ['open', 'checkin', 'running'])
      .get(),
  ]);
  if (
    [...organizing.docs, ...playing.docs].some(
      doc => doc.get('status') === 'running',
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Você está num torneio em andamento. Espere ele terminar para excluir a conta.',
    );
  }
  for (const doc of organizing.docs) await cancelTournamentBeforeStart(doc.ref);
  for (const doc of playing.docs) {
    if (doc.get('organizerUid') !== uid)
      await leaveTournamentBeforeStart(doc.ref, uid);
  }

  const userRef = users.doc(uid);
  const nickLower: string | undefined = (await userRef.get()).get('nickLower');
  await deleteCollection(userRef.collection('rivals'));
  await deleteCollection(userRef.collection('duelNotes'));
  const challenges = await db
    .collection('challenges')
    .where('creatorUid', '==', uid)
    .get();
  const batch = db.batch();
  challenges.docs.forEach(doc => batch.delete(doc.ref));
  if (nickLower) batch.delete(db.collection('nicks').doc(nickLower));
  batch.delete(userRef);
  await batch.commit();

  await getAuth().deleteUser(uid);
  logger.info('conta excluída', { uid });
  return { ok: true };
});
