import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db } from './config';
import { notifyUser } from './notify';

// Print do deck nos torneios que exigem (requireDeck). O app sobe a imagem
// direto pro Storage em decks/{torneio}/{uid}/{arquivo} (storage.rules: só
// o dono escreve; leem o dono e o organizador) e avisa aqui. Cada envio é
// um arquivo novo e só o caminho gravado aqui vale - então trocar a imagem
// depois do início não muda nada. As imagens somem quando o torneio acaba.
//
// tournaments/{id}/players/{uid}.deckStatus:
//   'missing' (sem print) | 'pending' (esperando o organizador)
//   'approved' | 'rejected' (com deckReason)

const BUCKET = 'newagent-90870.firebasestorage.app';
const bucket = () => getStorage().bucket(BUCKET);
const tournaments = db.collection('tournaments');
const NOT_STARTED = ['open', 'checkin'];
const REASON_MAX = 140;

export async function deleteDeckFile(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('decks/')) return;
  await bucket()
    .file(path)
    .delete({ ignoreNotFound: true })
    .catch(error => logger.warn('deck: falha ao apagar', { path, error }));
}

export async function deleteTournamentDecks(id: string) {
  await bucket()
    .deleteFiles({ prefix: `decks/${id}/` })
    .catch(error => logger.warn('deck: falha ao limpar', { id, error }));
}

export const submitTournamentDeck = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta.');
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  const path = String(request.data?.path ?? '');
  if (!path.startsWith(`decks/${ref.id}/${uid}/`) || path.includes('..'))
    throw new HttpsError('invalid-argument', 'Arquivo inválido.');
  const [exists] = await bucket().file(path).exists();
  if (!exists)
    throw new HttpsError(
      'failed-precondition',
      'A imagem não chegou. Tente enviar de novo.',
    );

  const out = await db.runTransaction(async tx => {
    const playerRef = ref.collection('players').doc(uid);
    const [snap, player] = await Promise.all([tx.get(ref), tx.get(playerRef)]);
    const t = snap.data();
    if (!t || !player.exists)
      throw new HttpsError(
        'not-found',
        'Você não está inscrito nesse torneio.',
      );
    if (!t.requireDeck)
      throw new HttpsError(
        'failed-precondition',
        'Esse torneio não pede o deck.',
      );
    if (!NOT_STARTED.includes(t.status))
      throw new HttpsError(
        'failed-precondition',
        'O torneio já começou: o deck não pode mais ser trocado.',
      );
    // O organizador que joga não precisa se aprovar.
    const own = t.organizerUid === uid;
    tx.update(playerRef, {
      deckPath: path,
      deckStatus: own ? 'approved' : 'pending',
      deckReason: null,
      // Deck novo precisa de nova aprovação antes do check-in.
      checkedIn: own ? player.get('checkedIn') ?? false : false,
    });
    return { t, previous: player.get('deckPath'), own };
  });

  if (out.previous !== path) await deleteDeckFile(out.previous);
  if (!out.own) {
    const nick = (await db.collection('users').doc(uid).get()).get('nick');
    await notifyUser(out.t.organizerUid, {
      title: `${out.t.name}: deck para analisar`,
      body: `@${nick ?? 'jogador'} enviou o print do deck.`,
      link: `/tournament/${ref.id}/players`,
    });
  }
  return { ok: true };
});

export const reviewTournamentDeck = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta.');
  const ref = tournaments.doc(String(request.data?.id ?? ''));
  const playerUid = String(request.data?.playerUid ?? '');
  const approved = request.data?.approved === true;
  const reason = String(request.data?.reason ?? '')
    .trim()
    .slice(0, REASON_MAX);

  const t = await db.runTransaction(async tx => {
    const playerRef = ref.collection('players').doc(playerUid);
    const [snap, player] = await Promise.all([tx.get(ref), tx.get(playerRef)]);
    const data = snap.data();
    if (!data) throw new HttpsError('not-found', 'Torneio não encontrado.');
    if (data.organizerUid !== uid)
      throw new HttpsError(
        'permission-denied',
        'Só o organizador pode analisar os decks.',
      );
    if (!player.exists || !player.get('deckPath'))
      throw new HttpsError(
        'failed-precondition',
        'Esse jogador ainda não enviou o deck.',
      );
    if (!NOT_STARTED.includes(data.status))
      throw new HttpsError('failed-precondition', 'O torneio já começou.');
    tx.update(playerRef, {
      deckStatus: approved ? 'approved' : 'rejected',
      deckReason: approved ? null : reason || null,
      // Recusado sai do check-in até mandar outro e ser aprovado.
      ...(approved ? {} : { checkedIn: false }),
    });
    return data;
  });

  await notifyUser(playerUid, {
    title: approved ? `${t.name}: deck aprovado` : `${t.name}: deck recusado`,
    body: approved
      ? 'Tudo certo com o seu deck.'
      : `${reason || 'O organizador recusou o print.'} Envie outro pelo app.`,
    link: `/tournament/${ref.id}/info`,
  });
  return { ok: true };
});
