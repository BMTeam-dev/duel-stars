import type { Category, DuelFormat } from '../duels/duels.types';

// Formato como o app usa (datas em millis). No Firestore: tournaments/{id},
// escrito só pelas Cloud Functions (functions/src/tournaments.ts).
export type TournamentFormat = 'swiss' | 'single';
export type TournamentStatus = 'open' | 'checkin' | 'running' | 'finished' | 'cancelled';

export type Tournament = {
  id: string;
  name: string;
  description: string;
  category: Category;
  format: TournamentFormat;
  matchFormat: DuelFormat;
  visibility: 'public' | 'private';
  listed: boolean;
  contact: string | null;
  entryFeeCents: number | null;
  pixKey: string | null;
  starsEntry: number;
  minStars: number | null;
  maxPlayers: number;
  // null = sem prazo (o organizador avança as rodadas).
  roundMinutes: number | null;
  startsAt: number;
  code: string;
  organizerUid: string;
  status: TournamentStatus;
  playerUids: string[];
  playerCount: number;
  // A partir do início:
  rounds: number | null;
  currentRound: number | null;
  championUid: string | null;
  // [campeão, vice, semifinalistas] - null onde não houve (bye, derrota dupla).
  placements: (string | null)[];
  pot: number;
};

export type MatchResult = 'win' | 'bye' | 'double_loss';

export type TournamentMatch = {
  id: string;
  round: number;
  slot: number;
  players: (string | null)[];
  status: 'pending' | 'active' | 'done';
  // Estado do duelo enquanto a partida está em jogo.
  duelStatus: 'active' | 'awaiting' | 'disputed' | null;
  duelId: string | null;
  winnerUid: string | null;
  result: MatchResult | null;
};

export const CHECKIN_WINDOW_MS = 30 * 60 * 1000;

export function roundLabel(round: number, rounds: number): string {
  if (round === rounds) return 'Final';
  if (round === rounds - 1) return 'Semifinal';
  if (round === rounds - 2) return 'Quartas de final';
  return `Rodada ${round}`;
}

export type TournamentPlayer = {
  uid: string;
  paid: boolean;
  checkedIn: boolean;
  joinedAt: number | null;
};

export type NewTournament = {
  name: string;
  description: string;
  category: Category;
  format: TournamentFormat;
  matchFormat: DuelFormat;
  visibility: 'public' | 'private';
  password?: string;
  listed: boolean;
  contact: string;
  entryFeeCents: number | null;
  pixKey: string;
  starsEntry: number;
  minStars: number | null;
  maxPlayers: number;
  roundMinutes: number | null;
  startsAt: number;
};

export const TOURNAMENT_FORMAT_LABEL: Record<TournamentFormat, string> = {
  swiss: 'Suíço + top cut',
  single: 'Mata-mata',
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 64;
export const MAX_STARS_ENTRY = 5;
export const TOURNAMENT_CODE_LENGTH = 6;

// Opções de prazo da rodada (null = sem prazo).
export const ROUND_DEADLINES: { minutes: number | null; label: string }[] = [
  { minutes: 50, label: '50 min' },
  { minutes: 60 * 24, label: '1 dia' },
  { minutes: 60 * 24 * 3, label: '3 dias' },
  { minutes: 60 * 24 * 7, label: '7 dias' },
  { minutes: null, label: 'Sem prazo' },
];

export function roundDeadlineLabel(minutes: number | null): string {
  return ROUND_DEADLINES.find(option => option.minutes === minutes)?.label ?? `${minutes} min`;
}

export function formatMoney(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const pad = (n: number) => String(n).padStart(2, '0');

// "sáb, 25/10 · 19:00"
export function formatStart(ms: number): string {
  const d = new Date(ms);
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}
