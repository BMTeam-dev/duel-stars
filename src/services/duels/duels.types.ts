import type { IconName } from '../../shared/ui/Icon';

export type DuelFormat = 'bo1' | 'bo3';

// Cada categoria tem carteira e ranking próprios (ver functions/src/duels.ts).
export type Category = 'tcg' | 'md' | 'dl';
export const CATEGORIES: Category[] = ['tcg', 'md', 'dl'];

export const CATEGORY_LABEL: Record<Category, string> = {
  tcg: 'TCG',
  md: 'Master Duel',
  dl: 'Duel Links',
};

export const CATEGORY_ICON: Record<Category, IconName> = {
  tcg: 'cards-playing',
  md: 'monitor',
  dl: 'cellphone',
};

// Online: o desafio vai por código (WhatsApp/Discord) e o jogo já tem o
// contador de LP - não faz sentido QR nem contador no app.
export const isOnlineCategory = (category: Category) => category !== 'tcg';
export type DuelStatus = 'active' | 'awaiting' | 'disputed' | 'done' | 'cancelled';

export const FORMAT_LABEL: Record<DuelFormat, string> = {
  bo1: 'Melhor de 1',
  bo3: 'Melhor de 3',
};

// Mesmos limites do backend (functions/src/config.ts > RULES).
export const MIN_STAKE = 1;
export const MAX_STAKE = 10;

export type Duel = {
  id: string;
  players: [string, string];
  stake: number;
  format: DuelFormat;
  category: Category;
  status: DuelStatus;
  // uid de quem informou -> uid que essa pessoa disse que venceu.
  reports: Record<string, string>;
  winnerUid: string | null;
  loserUid: string | null;
  createdAt: number | null;
  // Partida de torneio (aposta 0): de qual torneio e rodada.
  tournamentId: string | null;
  tournamentName: string | null;
  round: number | null;
  rounds: number | null;
};

export type ChallengePreview = {
  creator: {
    uid: string;
    nick: string;
    photoUrl: string | null;
    cityName: string;
    stateId: string;
    wins: number;
    losses: number;
  };
  stake: number;
  format: DuelFormat;
  category: Category;
  expiresAt: number;
  headToHead: { wins: number; losses: number };
};

export type FeedPost = {
  id: string;
  winnerUid: string;
  loserUid: string;
  stars: number;
  format: DuelFormat;
  category: Category;
  createdAt: number | null;
};

export type PublicProfile = {
  uid: string;
  nick: string;
  photoUrl: string | null;
  cityName: string;
  stateId: string;
  // IDs de jogador do Master Duel / Duel Links (9 dígitos), se cadastrados.
  gameIds: Partial<Record<'md' | 'dl', string>>;
};
