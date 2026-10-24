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
import { listenerError } from '../firestore/listenerError';
import { Category, ChallengePreview, Duel, DuelFormat, FeedPost } from './duels.types';

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

export const createChallenge = (stake: number, format: DuelFormat, category: Category) =>
  call<
    { stake: number; format: DuelFormat; category: Category },
    { token: string; code: string; expiresAt: number }
  >('createChallenge', { stake, format, category });

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

// Código curto digitado à mão (6 letras/números, ver functions/src/duels.ts).
export const CHALLENGE_CODE_LENGTH = 6;

export function normalizeChallengeCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, CHALLENGE_CODE_LENGTH);
}

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
    // Duelos de antes das categorias eram todos TCG.
    category: data.category ?? 'tcg',
    status: data.status,
    reports: data.reports ?? {},
    winnerUid: data.winnerUid ?? null,
    loserUid: data.loserUid ?? null,
    createdAt: millis(data.createdAt),
    tournamentId: data.tournamentId ?? null,
    tournamentName: data.tournamentName ?? null,
    roundLabel: data.roundLabel ?? null,
  };
}

// Quem gerou o QR fica ouvindo o próprio desafio: quando o oponente aceita,
// o backend grava o duelId e a tela vai direto pro duelo.
export function subscribeChallenge(
  token: string,
  onChange: (challenge: { status: string; duelId: string | null }) => void,
): () => void {
  return onSnapshot(
    doc(db, 'challenges', token),
    snapshot => {
      const data = snapshot.data();
      if (data) onChange({ status: data.status, duelId: data.duelId ?? null });
    },
    listenerError('subscribeChallenge'),
  );
}

export function subscribeDuel(duelId: string, onChange: (duel: Duel | null) => void): () => void {
  return onSnapshot(
    doc(db, 'duels', duelId),
    snapshot => {
      const data = snapshot.data();
      onChange(data ? toDuel(snapshot.id, data) : null);
    },
    // Sem acesso (ex.: o duelo foi apagado) = a tela mostra "não encontrado".
    error => {
      listenerError('subscribeDuel')(error);
      onChange(null);
    },
  );
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
    listenerError('subscribeMyDuels'),
  );
}

// Histórico do Perfil: todos os duelos do jogador, de qualquer categoria.
// A tela aumenta `max` conforme rola (o índice players + createdAt já existe).
export function subscribeDuelHistory(
  uid: string,
  max: number,
  onChange: (duels: Duel[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, 'duels'),
      where('players', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
    snapshot => onChange(snapshot.docs.map(d => toDuel(d.id, d.data()))),
    onError,
  );
}

export function subscribeFeed(
  category: Category,
  cityId: string | null,
  onChange: (posts: FeedPost[]) => void,
  onError: (error: Error) => void,
): () => void {
  const base = collection(db, 'feed');
  const q = cityId
    ? query(
        base,
        where('category', '==', category),
        where('cityIds', 'array-contains', cityId),
        orderBy('createdAt', 'desc'),
        limit(50),
      )
    : query(base, where('category', '==', category), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    snapshot =>
      onChange(
        snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type === 'tournament' || data.type === 'match' ? data.type : 'win',
            winnerUid: data.winnerUid,
            loserUid: data.loserUid ?? null,
            tournamentId: data.tournamentId ?? null,
            tournamentName: data.tournamentName ?? null,
            roundLabel: data.roundLabel ?? null,
            playerCount: data.playerCount ?? null,
            stars: data.stars,
            format: data.format,
            category: data.category,
            createdAt: millis(data.createdAt),
          };
        }),
      ),
    onError,
  );
}
