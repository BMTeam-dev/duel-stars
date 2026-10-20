import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import { ChallengePreview, Duel, DuelFormat, FeedPost } from './duels.types';

// Mesma região das Functions (functions/src/config.ts).
const functions = getFunctions(getApp(), 'southamerica-east1');

async function call<Req, Res>(name: string, data: Req): Promise<Res> {
  const result = await httpsCallable<Req, Res>(functions, name)(data);
  return result.data;
}

// As mensagens de erro do backend já vêm em português e prontas pra tela
// (HttpsError em functions/src/duels.ts); só a falta de rede precisa de texto.
export function duelErrorMessage(error: unknown): string {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  if (code === 'functions/unavailable' || code === 'functions/internal' || !message) {
    return 'Não foi possível falar com o servidor. Verifique a internet e tente de novo.';
  }
  return message;
}

export const createChallenge = (stake: number, format: DuelFormat) =>
  call<{ stake: number; format: DuelFormat }, { token: string; expiresAt: number }>(
    'createChallenge',
    { stake, format },
  );

export const cancelChallenge = (token: string) => call('cancelChallenge', { token });

export const previewChallenge = (token: string) =>
  call<{ token: string }, ChallengePreview>('previewChallenge', { token });

export const acceptChallenge = (token: string) =>
  call<{ token: string }, { duelId: string }>('acceptChallenge', { token });

export const reportResult = (duelId: string, winnerUid: string) =>
  call<{ duelId: string; winnerUid: string }, { status: 'awaiting' | 'done' | 'disputed' }>(
    'reportResult',
    { duelId, winnerUid },
  );

// O QR carrega um deep link; ler qualquer outro QR dá null.
const QR_PREFIX = 'duelstars://c/';

export function challengeQrValue(token: string): string {
  return QR_PREFIX + token;
}

export function tokenFromQr(value: string | undefined): string | null {
  if (!value?.startsWith(QR_PREFIX)) return null;
  const token = value.slice(QR_PREFIX.length).trim();
  return /^[A-Za-z0-9_-]{10,40}$/.test(token) ? token : null;
}

function millis(value: unknown): number | null {
  return value && typeof (value as { toMillis?: () => number }).toMillis === 'function'
    ? (value as { toMillis: () => number }).toMillis()
    : null;
}

function toDuel(id: string, data: DocumentData): Duel {
  return {
    id,
    players: data.players,
    stake: data.stake,
    format: data.format,
    status: data.status,
    reports: data.reports ?? {},
    winnerUid: data.winnerUid ?? null,
    loserUid: data.loserUid ?? null,
    createdAt: millis(data.createdAt),
  };
}

// Quem gerou o QR fica ouvindo o próprio desafio: quando o oponente aceita,
// o backend grava o duelId e a tela vai direto pro duelo.
export function subscribeChallenge(
  token: string,
  onChange: (challenge: { status: string; duelId: string | null }) => void,
): () => void {
  return onSnapshot(doc(db, 'challenges', token), snapshot => {
    const data = snapshot.data();
    if (data) onChange({ status: data.status, duelId: data.duelId ?? null });
  });
}

export function subscribeDuel(duelId: string, onChange: (duel: Duel | null) => void): () => void {
  return onSnapshot(doc(db, 'duels', duelId), snapshot => {
    const data = snapshot.data();
    onChange(data ? toDuel(snapshot.id, data) : null);
  });
}

// Duelos recentes do jogador; quem chama filtra os que ainda estão abertos.
export function subscribeMyDuels(uid: string, onChange: (duels: Duel[]) => void): () => void {
  return onSnapshot(
    query(
      collection(db, 'duels'),
      where('players', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
      limit(10),
    ),
    snapshot => onChange(snapshot.docs.map(d => toDuel(d.id, d.data()))),
  );
}

export function subscribeFeed(
  cityId: string | null,
  onChange: (posts: FeedPost[]) => void,
  onError: (error: Error) => void,
): () => void {
  const base = collection(db, 'feed');
  const q = cityId
    ? query(base, where('cityIds', 'array-contains', cityId), orderBy('createdAt', 'desc'), limit(50))
    : query(base, orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    snapshot =>
      onChange(
        snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            winnerUid: data.winnerUid,
            loserUid: data.loserUid,
            stars: data.stars,
            format: data.format,
            createdAt: millis(data.createdAt),
          };
        }),
      ),
    onError,
  );
}
