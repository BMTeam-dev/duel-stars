import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { DuelHistoryProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { crashReportingService } from '../../../../services/crashReporting/crashReporting.service';
import { subscribeDuelHistory } from '../../../../services/duels/duels.service';
import { useDuelNotes } from '../../../../services/duels/duelNotes.service';
import { Duel } from '../../../../services/duels/duels.types';
import { usePublicProfiles } from '../../../../services/profile/usePublicProfiles';
import { EmptyState } from '../../../../shared/ui/EmptyState';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { DuelHistoryItem } from '../../components/DuelHistoryItem';
import { Screen } from './styles';

const PAGE_SIZE = 30;

function DuelHistoryScreen({ navigation }: DuelHistoryProps) {
  const uid = useAppSelector(state => state.profile.profile?.uid) ?? '';
  const [max, setMax] = useState(PAGE_SIZE);
  const [duels, setDuels] = useState<Duel[] | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeDuelHistory(uid, max, setDuels, error =>
      crashReportingService.recordError(error, 'subscribeDuelHistory'),
    );
  }, [uid, max]);

  const opponentUids = useMemo(
    () => (duels ?? []).map(duel => duel.players.find(p => p !== uid) ?? ''),
    [duels, uid],
  );
  const profiles = usePublicProfiles(opponentUids);
  const duelIds = useMemo(() => (duels ?? []).map(duel => duel.id), [duels]);
  const notes = useDuelNotes(uid, duelIds);

  // Página cheia = pode haver mais; aí pede a próxima ao chegar no fim.
  const hasMore = !!duels && duels.length === max;

  return (
    <Screen>
      <ScreenHeader title="Histórico de duelos" onBack={() => navigation.goBack()} />
      {duels === null ? (
        <ActivityIndicator color={colors.gold.main} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={duels}
          keyExtractor={duel => duel.id}
          contentContainerStyle={{ flexGrow: 1, gap: spacing.sm, padding: spacing.lg }}
          renderItem={({ item, index }) => (
            <DuelHistoryItem
              duel={item}
              myUid={uid}
              opponent={profiles[opponentUids[index]]}
              note={notes[item.id]}
              onPress={() => navigation.navigate('Duel', { duelId: item.id })}
            />
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => hasMore && setMax(m => m + PAGE_SIZE)}
          ListFooterComponent={
            hasMore ? <ActivityIndicator color={colors.gold.main} style={{ margin: spacing.lg }} /> : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="Nenhum duelo ainda"
              message="Seus duelos, de todas as categorias, aparecem aqui."
            />
          }
        />
      )}
    </Screen>
  );
}

export default DuelHistoryScreen;
