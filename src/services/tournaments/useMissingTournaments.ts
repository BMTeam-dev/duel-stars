import { useEffect, useState } from 'react';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { db } from '../firestore/db';

// Feed: posts de torneio continuam mesmo depois que o torneio é apagado
// (quem venceu segue valendo), mas o card não abre mais nada. Uma consulta
// por torneio por sessão; erro de leitura conta como "existe".
const cache = new Map<string, Promise<boolean>>();

function isMissing(id: string): Promise<boolean> {
  let pending = cache.get(id);
  if (!pending) {
    pending = getDoc(doc(db, 'tournaments', id))
      .then(snapshot => !snapshot.data())
      .catch(() => false);
    cache.set(id, pending);
  }
  return pending;
}

export function useMissingTournaments(ids: string[]): Set<string> {
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const key = Array.from(new Set(ids)).sort().join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const list = key.split(',');
    Promise.all(list.map(isMissing)).then(results => {
      if (!cancelled) setMissing(new Set(list.filter((_, i) => results[i])));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return missing;
}
