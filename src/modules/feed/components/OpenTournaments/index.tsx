import * as React from 'react';
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { spacing } from '../../../../configs/theme';
import type { Category } from '../../../../services/duels/duels.types';
import { listenerError } from '../../../../services/firestore/listenerError';
import { subscribeOpenTournaments } from '../../../../services/tournaments/tournaments.service';
import { Tournament } from '../../../../services/tournaments/tournaments.types';
import { TournamentCard } from '../../../../shared/ui/TournamentCard';
import { Header, SeeAll, SeeAllText, Title, Wrapper } from './styles';

type Props = {
  category: Category;
  onOpen: (id: string) => void;
  onSeeAll: () => void;
};

const CARD_WIDTH = 260;

// Vitrine no Feed: só aparece quando há torneio aberto na categoria ativa.
export function OpenTournaments({ category, onOpen, onSeeAll }: Props) {
  const [list, setList] = useState<Tournament[]>([]);

  useEffect(
    () => subscribeOpenTournaments(category, 10, setList, listenerError('feedTournaments')),
    [category],
  );

  if (list.length === 0) return null;

  return (
    <Wrapper>
      <Header>
        <Title>Torneios abertos</Title>
        <SeeAll onPress={onSeeAll} hitSlop={8}>
          <SeeAllText>Ver todos</SeeAllText>
        </SeeAll>
      </Header>
      <FlatList
        horizontal
        data={list}
        keyExtractor={t => t.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        renderItem={({ item }) => (
          <TournamentCard tournament={item} width={CARD_WIDTH} onPress={() => onOpen(item.id)} />
        )}
      />
    </Wrapper>
  );
}
