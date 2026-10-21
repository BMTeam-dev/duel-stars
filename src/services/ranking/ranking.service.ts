import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import type { Category } from '../duels/duels.types';
import { RANKING_LIMIT, RankingEntry } from './ranking.types';

// O ranking é o próprio saldo da carteira: lido direto de users/, sem
// coleção extra pra manter em dia. Só conta quem já jogou na categoria
// (ranked, gravado pelo backend) - senão todo mundo que acabou de entrar,
// com as 20 iniciais, empataria lá em cima. cityId null = Geral.
function rankingQuery(category: Category, cityId: string | null) {
  const ranked = where(`wallets.${category}.ranked`, '==', true);
  const base = collection(db, 'users');
  return cityId ? query(base, where('cityId', '==', cityId), ranked) : query(base, ranked);
}

export function subscribeRanking(
  category: Category,
  cityId: string | null,
  onChange: (entries: RankingEntry[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    rankingQuery(category, cityId),
    orderBy(`wallets.${category}.stars`, 'desc'),
    // Desempate só da ordem na lista; a posição continua dividida.
    orderBy(`wallets.${category}.wins`, 'desc'),
    limit(RANKING_LIMIT),
  );
  return onSnapshot(
    q,
    snapshot => {
      const entries: RankingEntry[] = [];
      snapshot.docs.forEach((d, index) => {
        const data = d.data();
        const wallet = data.wallets?.[category];
        if (!wallet) return;
        const previous = entries[entries.length - 1];
        entries.push({
          uid: d.id,
          nick: data.nick,
          photoUrl: data.photoUrl ?? null,
          cityName: data.cityName,
          stateId: data.stateId,
          stars: wallet.stars,
          wins: wallet.wins,
          losses: wallet.losses,
          position: previous && previous.stars === wallet.stars ? previous.position : index + 1,
        });
      });
      onChange(entries);
    },
    onError,
  );
}

// Pra quem está fora do top: 1 + quantos têm mais estrelas.
export async function getMyPosition(
  category: Category,
  cityId: string | null,
  stars: number,
): Promise<number> {
  const snapshot = await getCountFromServer(
    query(rankingQuery(category, cityId), where(`wallets.${category}.stars`, '>', stars)),
  );
  return snapshot.data().count + 1;
}
