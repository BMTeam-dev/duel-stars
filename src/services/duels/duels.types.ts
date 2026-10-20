export type DuelFormat = 'bo1' | 'bo3';
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
  status: DuelStatus;
  // uid de quem informou -> uid que essa pessoa disse que venceu.
  reports: Record<string, string>;
  winnerUid: string | null;
  loserUid: string | null;
  createdAt: number | null;
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
  expiresAt: number;
  headToHead: { wins: number; losses: number };
};

export type FeedPost = {
  id: string;
  winnerUid: string;
  loserUid: string;
  stars: number;
  format: DuelFormat;
  createdAt: number | null;
};

export type PublicProfile = {
  uid: string;
  nick: string;
  photoUrl: string | null;
  cityName: string;
  stateId: string;
};
