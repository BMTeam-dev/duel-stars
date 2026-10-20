import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

// Mesmo banco nomeado do app (ver src/services/firestore/db.ts no app).
export const db = getFirestore('duel-start');

// São Paulo: perto dos jogadores e do Firestore (southamerica-east1).
// maxInstances baixo limita o estrago (e o custo) de um bug em loop.
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

// Regras do duelo - mesmos valores do doc do MVP ("Regras das estrelas").
export const RULES = {
  minStake: 1,
  maxStake: 10,
  challengeTtlMs: 5 * 60 * 1000,
  confirmWindowMs: 24 * 60 * 60 * 1000,
  disputeWindowMs: 48 * 60 * 60 * 1000,
  abandonedWindowMs: 48 * 60 * 60 * 1000,
  maxDuelsPerOpponentPerDay: 3,
};
