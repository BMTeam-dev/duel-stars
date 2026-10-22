import type { Category, DuelFormat } from '../duels/duels.types';

// Formato como o app usa (datas em millis). No Firestore: tournaments/{id},
// escrito só pelas Cloud Functions (functions/src/tournaments.ts).
export type TournamentFormat = 'swiss' | 'single';
// 'manual': o organizador inicia cada rodada com prazo (data e hora) e aviso.
export type RoundMode = 'auto' | 'manual';
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
  roundMode: RoundMode;
  // Modo automático: duração de cada rodada. null = sem prazo.
  roundMinutes: number | null;
  // Modo manual: 'ready' = confrontos prontos esperando o organizador;
  // 'playing' = rodada em jogo até roundDeadlineAt (null = sem prazo).
  roundPhase: 'ready' | 'playing' | null;
  roundLabel: string | null;
  roundDeadlineAt: number | null;
  // Aviso fixo do organizador (o da rodada ou um avulso).
  notice: { text: string; at: number | null } | null;
  // null = sem data: começa quando o organizador abrir o check-in e iniciar.
  startsAt: number | null;
  code: string;
  organizerUid: string;
  status: TournamentStatus;
  playerUids: string[];
  playerCount: number;
  // A partir do início. stage: 'swiss' durante o suíço, 'top' no mata-mata
  // (o torneio todo, ou o top cut depois do suíço).
  stage: 'swiss' | 'top' | null;
  swissRounds: number | null;
  topCut: number | null;
  rounds: number | null;
  currentRound: number | null;
  championUid: string | null;
  // [campeão, vice, semifinalistas] - null onde não houve (bye, derrota dupla).
  placements: (string | null)[];
  pot: number;
  // Classificação final do suíço (uids), pra mostrar depois do top cut.
  finalStandings: string[];
};

export type MatchResult = 'win' | 'bye' | 'double_loss';

export type TournamentMatch = {
  id: string;
  stage: 'swiss' | 'top';
  round: number;
  slot: number;
  players: (string | null)[];
  // 'ready': confronto definido, esperando o organizador iniciar a rodada.
  status: 'pending' | 'ready' | 'active' | 'done';
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
  // Suíço:
  points: number;
  wins: number;
  losses: number;
  opponents: string[];
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
  roundMode: RoundMode;
  roundMinutes: number | null;
  startsAt: number | null;
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
// Antes do início: dá pra entrar, sair e cancelar.
export const notStarted = (t: Tournament) => t.status === 'open' || t.status === 'checkin';

// Inscrições: com data, até o horário; sem data, até o organizador iniciar.
export const registrationOpen = (t: Tournament) => notStarted(t) && (t.startsAt === null || t.startsAt > Date.now());

// Check-in: com data, 30 min antes; sem data, quando o organizador abre.
export const checkinIsOpen = (t: Tournament) =>
  t.status === 'checkin' ||
  (t.status === 'open' && t.startsAt !== null && Date.now() >= t.startsAt - CHECKIN_WINDOW_MS);

export function formatStart(ms: number | null): string {
  if (ms === null) return 'Início quando o organizador iniciar';
  const d = new Date(ms);
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

// Classificação do suíço - mesma regra do backend (functions/src/tournaments.ts):
// pontos, % de vitórias dos adversários (mín. 33%) e dos adversários deles.
export type Standing = TournamentPlayer & { omw: number };

export function swissStandings(players: TournamentPlayer[]): Standing[] {
  const byUid = new Map(players.map(p => [p.uid, p]));
  const rate = (p?: TournamentPlayer) => (p ? Math.max(1 / 3, p.wins / Math.max(1, p.wins + p.losses)) : 0);
  const avg = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0);
  const omw = new Map(players.map(p => [p.uid, avg(p.opponents.map(o => rate(byUid.get(o))))]));
  const oomw = new Map(players.map(p => [p.uid, avg(p.opponents.map(o => omw.get(o) ?? 0))]));
  return players
    .map(p => ({ ...p, omw: omw.get(p.uid)! }))
    .sort((a, b) => b.points - a.points || b.omw - a.omw || oomw.get(b.uid)! - oomw.get(a.uid)!);
}
