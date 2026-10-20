import { useEffect, useState } from 'react';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import { PublicProfile } from '../duels/duels.types';

// Feed e duelos guardam só uids (o nick pode mudar); os perfis são buscados
// aqui, uma vez por uid por sessão.
const cache = new Map<string, Promise<PublicProfile | null>>();

function fetchProfile(uid: string): Promise<PublicProfile | null> {
  let pending = cache.get(uid);
  if (!pending) {
    pending = getDoc(doc(db, 'users', uid))
      .then(snapshot => {
        const data = snapshot.data();
        return data
          ? {
              uid,
              nick: data.nick,
              photoUrl: data.photoUrl ?? null,
              cityName: data.cityName,
              stateId: data.stateId,
            }
          : null;
      })
      .catch(() => {
        cache.delete(uid);
        return null;
      });
    cache.set(uid, pending);
  }
  return pending;
}

export function usePublicProfiles(uids: string[]): Record<string, PublicProfile> {
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const key = Array.from(new Set(uids)).sort().join(',');

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(',') : [];
    Promise.all(list.map(fetchProfile)).then(results => {
      if (cancelled) return;
      const next: Record<string, PublicProfile> = {};
      results.forEach(profile => {
        if (profile) next[profile.uid] = profile;
      });
      setProfiles(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return profiles;
}
