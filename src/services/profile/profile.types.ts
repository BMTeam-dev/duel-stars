import type { Category } from '../duels/duels.types';

// Carteira de uma categoria: escrita só pelas Cloud Functions.
export type Wallet = {
  stars: number;
  // Estrelas apostadas em duelos ainda não encerrados (ver functions/src/duels.ts).
  lockedStars: number;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
};

// Formato do perfil como o app usa (datas em millis, pra caber no redux).
// No Firestore ficam como Timestamp - ver toProfile() em profile.service.ts.
export type UserProfile = {
  uid: string;
  nick: string;
  photoUrl: string | null;
  cityId: string;
  cityName: string;
  stateId: string;
  // Uma carteira por categoria (TCG, Master Duel, Duel Links).
  wallets: Record<Category, Wallet>;
  notificationsEnabled: boolean;
  // null = nunca trocou o nick (a primeira troca é livre, ver firestore.rules).
  nickChangedAt: number | null;
  createdAt: number | null;
};

export type City = {
  id: string;
  name: string;
  stateId: string;
};

export const INITIAL_STARS = 20;
export const NICK_CHANGE_INTERVAL_DAYS = 30;
