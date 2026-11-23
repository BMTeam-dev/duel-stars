import { CATEGORY_LABEL, Category } from '../../services/duels/duels.types';
import { RankingEntry } from '../../services/ranking/ranking.types';
import { ShareContent } from '../../shared/ui/ShareSheet/content';

// Pódio do ranking para o grupo: os 3 primeiros da categoria e do escopo
// (cidade ou geral) que estão na tela.
export function rankingShare(
  entries: RankingEntry[],
  category: Category,
  scopeLabel: string,
): ShareContent {
  const month = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return {
    kind: 'ranking',
    heading: `Ranking ${CATEGORY_LABEL[category]}`,
    title: 'Top 3',
    subtitle: `${scopeLabel} · ${month}`,
    podium: entries.slice(0, 3).map(e => ({
      nick: e.nick,
      stars: e.stars,
      wins: e.wins,
      losses: e.losses,
    })),
  };
}
