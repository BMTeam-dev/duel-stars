import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type DocumentData,
} from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import { City, INITIAL_STARS, NICK_CHANGE_INTERVAL_DAYS, UserProfile } from './profile.types';

const NICK_PATTERN = /^[a-z0-9_]{3,20}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export type NickStatus = 'invalid' | 'available' | 'taken' | 'yours';

// Mesma regra de firestore.rules: 3 a 20 caracteres, letras minúsculas,
// números e "_". O nick é exibido como digitado, mas a unicidade é por
// minúsculas (@Yugi e @yugi são o mesmo nick).
export function normalizeNick(nick: string): string {
  return nick.trim().replace(/^@/, '').toLowerCase();
}

export function isValidNick(nick: string): boolean {
  return NICK_PATTERN.test(normalizeNick(nick));
}

export async function checkNick(nick: string, uid: string): Promise<NickStatus> {
  const nickLower = normalizeNick(nick);
  if (!NICK_PATTERN.test(nickLower)) return 'invalid';
  const snapshot = await getDoc(doc(db, 'nicks', nickLower));
  const data = snapshot.data() as { uid: string; releasedAt?: Timestamp } | undefined;
  if (!data) return 'available';
  if (data.uid === uid) return 'yours';
  if (data.releasedAt && Date.now() > data.releasedAt.toMillis() + NICK_CHANGE_INTERVAL_DAYS * DAY_MS) {
    return 'available';
  }
  return 'taken';
}

type NewProfile = {
  nick: string;
  photoUrl: string | null;
  city: City;
  notificationsEnabled: boolean;
  fcmToken: string | null;
};

// Reserva do nick e criação do perfil no MESMO batch: as regras exigem que
// o doc do nick exista "depois" da escrita do perfil (getAfter), então os
// dois entram juntos ou nenhum entra. Se alguém pegou o nick entre a
// checagem e o envio, o batch inteiro falha com permission-denied.
export async function createProfile(uid: string, data: NewProfile): Promise<void> {
  const nickLower = normalizeNick(data.nick);
  const batch = writeBatch(db);
  batch.set(doc(db, 'nicks', nickLower), { uid });
  batch.set(doc(db, 'users', uid), {
    nick: data.nick.trim().replace(/^@/, ''),
    nickLower,
    nickChangedAt: null,
    photoUrl: data.photoUrl,
    cityId: data.city.id,
    cityName: data.city.name,
    stateId: data.city.stateId,
    notificationsEnabled: data.notificationsEnabled,
    fcmTokens: data.fcmToken ? [data.fcmToken] : [],
    stars: INITIAL_STARS,
    wins: 0,
    losses: 0,
    streak: 0,
    bestStreak: 0,
    disputeCount: 0,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

// null = ainda pode trocar; número = millis a partir de quando poderá.
export function nextNickChangeAt(profile: UserProfile): number | null {
  if (profile.nickChangedAt === null) return null;
  const next = profile.nickChangedAt + NICK_CHANGE_INTERVAL_DAYS * DAY_MS;
  return next > Date.now() ? next : null;
}

type ProfileChanges = {
  nick?: string;
  city?: City;
};

export async function updateProfile(profile: UserProfile, changes: ProfileChanges): Promise<void> {
  const batch = writeBatch(db);
  const userUpdate: Record<string, unknown> = {};

  if (changes.nick !== undefined) {
    const nickLower = normalizeNick(changes.nick);
    const oldNickLower = normalizeNick(profile.nick);
    userUpdate.nick = changes.nick.trim().replace(/^@/, '');
    if (nickLower !== oldNickLower) {
      userUpdate.nickLower = nickLower;
      userUpdate.nickChangedAt = serverTimestamp();
      batch.set(doc(db, 'nicks', nickLower), { uid: profile.uid });
      // O antigo continua reservado por 30 dias (ver firestore.rules).
      batch.set(doc(db, 'nicks', oldNickLower), { uid: profile.uid, releasedAt: serverTimestamp() });
    }
  }

  if (changes.city) {
    userUpdate.cityId = changes.city.id;
    userUpdate.cityName = changes.city.name;
    userUpdate.stateId = changes.city.stateId;
  }

  batch.update(doc(db, 'users', profile.uid), userUpdate);
  await batch.commit();
}

function toMillis(value: unknown): number | null {
  return value && typeof (value as Timestamp).toMillis === 'function'
    ? (value as Timestamp).toMillis()
    : null;
}

function toProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    nick: data.nick,
    photoUrl: data.photoUrl ?? null,
    cityId: data.cityId,
    cityName: data.cityName,
    stateId: data.stateId,
    stars: data.stars ?? 0,
    wins: data.wins ?? 0,
    losses: data.losses ?? 0,
    streak: data.streak ?? 0,
    bestStreak: data.bestStreak ?? 0,
    notificationsEnabled: !!data.notificationsEnabled,
    nickChangedAt: toMillis(data.nickChangedAt),
    createdAt: toMillis(data.createdAt),
  };
}

// Escuta o perfil em tempo real - quando uma Cloud Function mexer nas
// estrelas depois de um duelo, o Perfil atualiza sozinho.
export function subscribeProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'users', uid),
    snapshot => {
      const data = snapshot.data();
      onChange(data ? toProfile(uid, data) : null);
    },
    onError,
  );
}
