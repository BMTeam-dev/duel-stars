import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
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
import { NewTournament, registrationOpen, Tournament, TournamentMatch, TournamentPlayer } from './tournaments.types';

const functions = getFunctions(getApp(), 'southamerica-east1');

async function call<Req, Res>(name: string, data: Req): Promise<Res> {
  return (await httpsCallable<Req, Res>(functions, name)(data)).data;
}

export const createTournament = (data: NewTournament) => call<NewTournament, { id: string }>('createTournament', data);
export const joinTournament = (id: string, password?: string) => call('joinTournament', { id, password });
export const leaveTournament = (id: string) => call('leaveTournament', { id });
export const cancelTournament = (id: string) => call('cancelTournament', { id });
export const openCheckin = (id: string) => call('openTournamentCheckin', { id });
export const checkInTournament = (id: string) => call('checkInTournament', { id });
export const startTournament = (id: string) => call('startTournament', { id });
// winnerUid null = derrota dupla.
export const resolveMatch = (id: string, matchId: string, winnerUid: string | null) =>
  call('resolveTournamentMatch', { id, matchId, winnerUid });
// Rodadas manuais. deadlineAt em millis; null = sem prazo.
export const startRound = (id: string, deadlineAt: number | null, message: string) =>
  call('startTournamentRound', { id, deadlineAt, message });
export const setRoundDeadline = (id: string, deadlineAt: number | null) =>
  call('setTournamentRoundDeadline', { id, deadlineAt });
export const postNotice = (id: string, message: string) => call('postTournamentNotice', { id, message });
export const updateDescription = (id: string, description: string) =>
  call('updateTournamentDescription', { id, description });
// Print do deck: sobe pro Storage (cada envio é um arquivo novo) e avisa o
// backend, que guarda o caminho e põe o deck em análise. O organizador vai
// nos metadados pra poder ler (storage.rules).
export async function uploadDeck(t: Tournament, uid: string, localUri: string, contentType: string) {
  const path = `decks/${t.id}/${uid}/${Date.now()}.jpg`;
  await putFile(ref(getStorage(), path), localUri, {
    contentType,
    customMetadata: { organizerUid: t.organizerUid },
  });
  await call('submitTournamentDeck', { id: t.id, path });
}
export const getDeckUrl = (path: string) => getDownloadURL(ref(getStorage(), path));
export const reviewDeck = (id: string, playerUid: string, approved: boolean, reason?: string) =>
  call('reviewTournamentDeck', { id, playerUid, approved, reason });
export const setPlayerPaid = (id: string, playerUid: string, paid: boolean) =>
  call('setTournamentPlayerPaid', { id, playerUid, paid });

// O backend manda `details.needsGameId` quando falta o ID do jogo no perfil.
export function needsGameId(error: unknown): 'md' | 'dl' | null {
  return (error as { details?: { needsGameId?: 'md' | 'dl' } })?.details?.needsGameId ?? null;
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
    roundMode: data.roundMode === 'manual' ? 'manual' : 'auto',
    requireDeck: !!data.requireDeck,
    roundMinutes: data.roundMinutes ?? null,
    roundPhase: data.roundPhase ?? null,
    roundLabel: data.roundLabel ?? null,
    roundDeadlineAt: millis(data.roundDeadlineAt),
    notice: data.notice?.text ? { text: data.notice.text, at: millis(data.notice.at) } : null,
    startsAt: millis(data.startsAt),
    code: data.code,
    organizerUid: data.organizerUid,
    status: data.status,
    playerUids: data.playerUids ?? [],
    playerCount: data.playerCount ?? 0,
    stage: data.stage ?? null,
    swissRounds: data.swissRounds ?? null,
    topCut: data.topCut ?? null,
    rounds: data.rounds ?? null,
    currentRound: data.currentRound ?? null,
    championUid: data.championUid ?? null,
    placements: data.placements ?? [],
    pot: data.pot ?? 0,
    finalStandings: data.finalStandings ?? [],
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
      where('status', 'in', ['open', 'checkin']),
      orderBy('startsAt', 'asc'),
      limit(max),
    ),
    snapshot =>
      onChange(
        snapshot.docs
          .map(d => toTournament(d.id, d.data()))
          .filter(registrationOpen)
          // Com data primeiro (do mais próximo); sem data depois.
          .sort((a, b) => (a.startsAt ?? Infinity) - (b.startsAt ?? Infinity)),
      ),
    onError,
  );
}

// Ordem dos "Meus": em andamento, check-in e inscrições abertas em cima (o
// que começa antes primeiro, sem data por último); depois os encerrados e
// cancelados, do mais recente pro mais antigo.
const STATUS_ORDER: Record<Tournament['status'], number> = {
  running: 0,
  checkin: 1,
  open: 2,
  finished: 3,
  cancelled: 3,
};

function compareMine(a: Tournament, b: Tournament): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus) return byStatus;
  // MAX_SAFE_INTEGER e não Infinity: Infinity - Infinity dá NaN.
  const never = Number.MAX_SAFE_INTEGER;
  if (STATUS_ORDER[a.status] < 3) return (a.startsAt ?? never) - (b.startsAt ?? never);
  return (b.startsAt ?? 0) - (a.startsAt ?? 0);
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
    onChange([...byId.values()].sort(compareMine));
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

export function subscribeTournamentPlayers(id: string, onChange: (players: TournamentPlayer[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'tournaments', id, 'players'), orderBy('joinedAt', 'asc')),
    snapshot =>
      onChange(
        snapshot.docs.map(d => ({
          uid: d.id,
          paid: !!d.data().paid,
          checkedIn: !!d.data().checkedIn,
          deckStatus: d.data().deckStatus ?? null,
          deckPath: d.data().deckPath ?? null,
          deckReason: d.data().deckReason ?? null,
          points: d.data().points ?? 0,
          wins: d.data().wins ?? 0,
          losses: d.data().losses ?? 0,
          opponents: d.data().opponents ?? [],
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
  return value
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
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
              stage: data.stage ?? 'top',
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
          // Suíço antes do mata-mata; dentro de cada fase, rodada e mesa.
          .sort(
            (a, b) => (a.stage === b.stage ? 0 : a.stage === 'swiss' ? -1 : 1) || a.round - b.round || a.slot - b.slot,
          ),
      ),
    listenerError('subscribeMatches'),
  );
}
