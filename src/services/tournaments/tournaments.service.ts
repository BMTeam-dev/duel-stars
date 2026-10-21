import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import { listenerError } from '../firestore/listenerError';
import type { Category } from '../duels/duels.types';
import { NewTournament, Tournament, TournamentMatch, TournamentPlayer } from './tournaments.types';

const functions = getFunctions(getApp(), 'southamerica-east1');

async function call<Req, Res>(name: string, data: Req): Promise<Res> {
  return (await httpsCallable<Req, Res>(functions, name)(data)).data;
}

export const createTournament = (data: NewTournament) =>
  call<NewTournament, { id: string }>('createTournament', data);
export const joinTournament = (id: string, password?: string) => call('joinTournament', { id, password });
export const leaveTournament = (id: string) => call('leaveTournament', { id });
export const cancelTournament = (id: string) => call('cancelTournament', { id });
export const checkInTournament = (id: string) => call('checkInTournament', { id });
export const startTournament = (id: string) => call('startTournament', { id });
// winnerUid null = derrota dupla.
export const resolveMatch = (id: string, matchId: string, winnerUid: string | null) =>
  call('resolveTournamentMatch', { id, matchId, winnerUid });
export const setPlayerPaid = (id: string, playerUid: string, paid: boolean) =>
  call('setTournamentPlayerPaid', { id, playerUid, paid });

// O backend manda `details.needsGameId` quando falta o ID do jogo no perfil.
export function needsGameId(error: unknown): 'md' | 'dl' | null {
  return ((error as { details?: { needsGameId?: 'md' | 'dl' } })?.details?.needsGameId) ?? null;
}

const millis = (value: unknown) => (value as { toMillis?: () => number })?.toMillis?.() ?? null;

function toTournament(id: string, data: DocumentData): Tournament {
  return {
    id,
    name: data.name,
    description: data.description ?? '',
    category: data.category,
    format: data.format,
    matchFormat: data.matchFormat,
    visibility: data.visibility,
    listed: !!data.listed,
    contact: data.contact ?? null,
    entryFeeCents: data.entryFeeCents ?? null,
    pixKey: data.pixKey ?? null,
    starsEntry: data.starsEntry ?? 0,
    minStars: data.minStars ?? null,
    maxPlayers: data.maxPlayers,
    roundMinutes: data.roundMinutes ?? null,
    startsAt: millis(data.startsAt) ?? 0,
    code: data.code,
    organizerUid: data.organizerUid,
    status: data.status,
    playerUids: data.playerUids ?? [],
    playerCount: data.playerCount ?? 0,
    rounds: data.rounds ?? null,
    currentRound: data.currentRound ?? null,
    championUid: data.championUid ?? null,
    placements: data.placements ?? [],
    pot: data.pot ?? 0,
  };
}

const tournaments = collection(db, 'tournaments');

// Abertos e visíveis da categoria, do que começa antes pro que começa depois.
export function subscribeOpenTournaments(
  category: Category,
  max: number,
  onChange: (list: Tournament[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      tournaments,
      where('category', '==', category),
      where('listed', '==', true),
      where('status', '==', 'open'),
      orderBy('startsAt', 'asc'),
      limit(max),
    ),
    snapshot =>
      onChange(
        snapshot.docs
          .map(d => toTournament(d.id, d.data()))
          // Inscrição fecha no horário de início.
          .filter(t => t.startsAt > Date.now()),
      ),
    onError,
  );
}

// "Meus": onde estou inscrito + os que organizo, sem repetir.
export function subscribeMyTournaments(
  uid: string,
  onChange: (list: Tournament[]) => void,
  onError: (error: Error) => void,
): () => void {
  let joined: Tournament[] = [];
  let organized: Tournament[] = [];
  const emit = () => {
    const byId = new Map([...joined, ...organized].map(t => [t.id, t]));
    onChange([...byId.values()].sort((a, b) => b.startsAt - a.startsAt));
  };
  const stopJoined = onSnapshot(
    query(tournaments, where('playerUids', 'array-contains', uid), orderBy('startsAt', 'desc'), limit(30)),
    snapshot => {
      joined = snapshot.docs.map(d => toTournament(d.id, d.data()));
      emit();
    },
    onError,
  );
  const stopOrganized = onSnapshot(
    query(tournaments, where('organizerUid', '==', uid), orderBy('startsAt', 'desc'), limit(30)),
    snapshot => {
      organized = snapshot.docs.map(d => toTournament(d.id, d.data()));
      emit();
    },
    onError,
  );
  return () => {
    stopJoined();
    stopOrganized();
  };
}

export function subscribeTournament(id: string, onChange: (t: Tournament | null) => void): () => void {
  return onSnapshot(
    doc(tournaments, id),
    snapshot => {
      const data = snapshot.data();
      onChange(data ? toTournament(snapshot.id, data) : null);
    },
    error => {
      listenerError('subscribeTournament')(error);
      onChange(null);
    },
  );
}

export function subscribeTournamentPlayers(
  id: string,
  onChange: (players: TournamentPlayer[]) => void,
): () => void {
  return onSnapshot(
    query(collection(db, 'tournaments', id, 'players'), orderBy('joinedAt', 'asc')),
    snapshot =>
      onChange(
        snapshot.docs.map(d => ({
          uid: d.id,
          paid: !!d.data().paid,
          checkedIn: !!d.data().checkedIn,
          joinedAt: millis(d.data().joinedAt),
        })),
      ),
    listenerError('subscribeTournamentPlayers'),
  );
}

// Só o organizador consegue ler (firestore.rules).
export async function getTournamentPassword(id: string): Promise<string | null> {
  return (await getDoc(doc(db, 'tournamentSecrets', id))).data()?.password ?? null;
}

export async function findTournamentByCode(code: string): Promise<string | null> {
  const found = await getDocs(query(tournaments, where('code', '==', code), limit(1)));
  return found.docs[0]?.id ?? null;
}

export function normalizeTournamentCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

// Chave inteira (no máximo 63 partidas): ordenada por rodada e posição.
export function subscribeMatches(id: string, onChange: (matches: TournamentMatch[]) => void): () => void {
  return onSnapshot(
    collection(db, 'tournaments', id, 'matches'),
    snapshot =>
      onChange(
        snapshot.docs
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              round: data.round,
              slot: data.slot,
              players: data.players ?? [],
              status: data.status,
              duelStatus: data.duelStatus ?? null,
              duelId: data.duelId ?? null,
              winnerUid: data.winnerUid ?? null,
              result: data.result ?? null,
            };
          })
          .sort((a, b) => a.round - b.round || a.slot - b.slot),
      ),
    listenerError('subscribeMatches'),
  );
}
