import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions/v2';
import { db } from './config';

type Push = {
  title: string;
  body: string;
  // Rota de deep link que o app abre ao tocar (ver doc: "Notificações e deep links").
  link: string;
};

// Push nunca derruba a operação principal: o duelo já foi gravado, então
// uma falha de envio só vira log.
export async function notifyUser(uid: string, push: Push): Promise<void> {
  try {
    const snapshot = await db.collection('users').doc(uid).get();
    const tokens: string[] = snapshot.get('fcmTokens') ?? [];
    if (!snapshot.get('notificationsEnabled') || tokens.length === 0) return;
    await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: push.title, body: push.body },
      data: { link: push.link },
      android: { priority: 'high' },
    });
  } catch (error) {
    logger.warn('notifyUser falhou', { uid, error });
  }
}
