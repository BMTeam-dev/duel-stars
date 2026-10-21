import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { RankingProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { crashReportingService } from '../../../../services/crashReporting/crashReporting.service';
import { CATEGORY_LABEL } from '../../../../services/duels/duels.types';
import { useActiveCategory } from '../../../../services/profile/useActiveCategory';
import { getMyPosition, subscribeRanking } from '../../../../services/ranking/ranking.service';
import { RankingEntry } from '../../../../services/ranking/ranking.types';
import { CategoryTabs } from '../../../../shared/ui/CategoryTabs';
import { Button } from '../../../../shared/ui/Button';
import { EmptyState } from '../../../../shared/ui/EmptyState';
import { Scope, ScopeChips } from '../../../../shared/ui/ScopeChips';
import { MyPositionBar } from '../../components/MyPositionBar';
import { Podium } from '../../components/Podium';
import { RankingRow } from '../../components/RankingRow';
import { ErrorBox, Header, Screen, Title } from './styles';

function RankingScreen(_: RankingProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const { category, wallet, setCategory } = useActiveCategory();
  const [scope, setScope] = useState<Scope>('city');
  const [entries, setEntries] = useState<RankingEntry[] | null>(null);
  const [countedPosition, setCountedPosition] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const uid = profile?.uid ?? '';
  const cityId = scope === 'city' ? profile?.cityId ?? null : null;
  useEffect(() => {
    setEntries(null);
    setFailed(false);
    return subscribeRanking(category, cityId, setEntries, error => {
      crashReportingService.recordError(error, 'subscribeRanking');
      // Descarta o que veio do cache local antes do erro (pode ser parcial).
      setEntries(null);
      setFailed(true);
    });
  }, [category, cityId, attempt]);

  // Dentro do top a posição vem da lista; fora dele, de uma contagem.
  const listedPosition = entries?.find(entry => entry.uid === uid)?.position ?? null;
  const myStars = wallet?.stars;
  const ranked = !!wallet?.ranked;
  useEffect(() => {
    setCountedPosition(null);
    if (entries === null || listedPosition !== null || !ranked || myStars === undefined) return;
    let cancelled = false;
    getMyPosition(category, cityId, myStars)
      .then(position => !cancelled && setCountedPosition(position))
      .catch(error => crashReportingService.recordError(error, 'getMyPosition'));
    return () => {
      cancelled = true;
    };
  }, [entries, listedPosition, ranked, category, cityId, myStars]);

  const scopeLabel = scope === 'city' ? profile?.cityName ?? 'Minha cidade' : 'Geral';

  return (
    <Screen edges={['top']}>
      <Header>
        <Title>Ranking</Title>
        <CategoryTabs value={category} onChange={setCategory} />
        <ScopeChips value={scope} cityName={profile?.cityName} onChange={setScope} />
      </Header>

      {failed ? (
        <ErrorBox>
          <EmptyState
            icon="alert-circle-outline"
            title="Não foi possível carregar o ranking"
            message="Algo deu errado do nosso lado. Tente de novo em instantes."
          />
          <Button label="Tentar de novo" icon="refresh" variant="secondary" onPress={() => setAttempt(n => n + 1)} />
        </ErrorBox>
      ) : entries === null ? (
        <ActivityIndicator color={colors.gold.main} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={entries.slice(3)}
          keyExtractor={entry => entry.uid}
          contentContainerStyle={{ flexGrow: 1, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
          ListHeaderComponent={entries.length > 0 ? <Podium entries={entries.slice(0, 3)} myUid={uid} /> : undefined}
          renderItem={({ item }) => (
            <RankingRow entry={item} mine={item.uid === uid} showCity={scope === 'global'} />
          )}
          ListEmptyComponent={
            entries.length === 0 ? (
              <EmptyState
                icon="trophy-outline"
                title="Ranking vazio"
                message={`Ninguém jogou ${CATEGORY_LABEL[category]}${
                  scope === 'city' ? ` em ${scopeLabel}` : ''
                } ainda. Desafie alguém e seja o primeiro!`}
              />
            ) : undefined
          }
        />
      )}

      {wallet && (
        <MyPositionBar
          position={listedPosition ?? countedPosition}
          ranked={ranked}
          categoryLabel={CATEGORY_LABEL[category]}
          stars={wallet.stars}
          scopeLabel={scopeLabel}
        />
      )}
    </Screen>
  );
}

export default RankingScreen;
