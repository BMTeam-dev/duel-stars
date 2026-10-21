import type { PublicProfile } from '../duels/duels.types';

export type RankingEntry = PublicProfile & {
  // Posição com empate: quem tem as mesmas estrelas divide a posição
  // (1, 2, 2, 4...), igual à de getMyPosition().
  position: number;
  stars: number;
  wins: number;
  losses: number;
};

export const RANKING_LIMIT = 50;
