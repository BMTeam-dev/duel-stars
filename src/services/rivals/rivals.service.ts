import { collection, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '../firestore/db';

// users/{uid}/rivals/{outroUid}: placar entre os dois, somando todas as
// categorias - escrito pelo backend a cada duelo encerrado (applyFinalize).
export type Rival = {
  uid: string;
  wins: number;
  losses: number;
  lastDuelAt: number;
};

// Com uma vitória só ninguém é freguês de ninguém.
export const MIN_RIVALRY = 2;

export function subscribeRivals(
  uid: string,
  onChange: (rivals: Rival[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'rivals'),
    snapshot =>
      onChange(
        snapshot.docs.map(d => {
          const data = d.data();
          return {
            uid: d.id,
            wins: data.wins ?? 0,
            losses: data.losses ?? 0,
            lastDuelAt: data.lastDuelAt?.toMillis?.() ?? 0,
          };
        }),
      ),
    onError,
  );
}

// Freguês: quem eu mais venci (e venci mais do que perdi pra ele).
// Nêmesis: o inverso. Empate fica com o duelo mais recente.
function pick(rivals: Rival[], key: 'wins' | 'losses'): Rival | null {
  const other = key === 'wins' ? 'losses' : 'wins';
  return (
    rivals
      .filter(r => r[key] >= MIN_RIVALRY && r[key] > r[other])
      .sort((a, b) => b[key] - a[key] || b.lastDuelAt - a.lastDuelAt)[0] ?? null
  );
}

export const pickFregues = (rivals: Rival[]) => pick(rivals, 'wins');
export const pickNemesis = (rivals: Rival[]) => pick(rivals, 'losses');
