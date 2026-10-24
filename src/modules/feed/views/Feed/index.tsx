import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { CHALLENGE_BUTTON_AREA, spacing } from '../../../../configs/theme';
import { FeedProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { crashReportingService } from '../../../../services/crashReporting/crashReporting.service';
import { subscribeFeed, subscribeMyDuels } from '../../../../services/duels/duels.service';
import { Duel, FeedPost } from '../../../../services/duels/duels.types';
import { usePublicProfiles } from '../../../../services/profile/usePublicProfiles';
import { useMissingTournaments } from '../../../../services/tournaments/useMissingTournaments';
import { useActiveCategory } from '../../../../services/profile/useActiveCategory';
import { CategoryTabs } from '../../../../shared/ui/CategoryTabs';
import { Scope, ScopeChips } from '../../../../shared/ui/ScopeChips';
import { Button } from '../../../../shared/ui/Button';
import { EmptyState } from '../../../../shared/ui/EmptyState';
import { ActiveDuelBanner } from '../../components/ActiveDuelBanner';
import { ChallengeSheet } from '../../components/ChallengeSheet';
import { FeedHeader } from '../../components/FeedHeader';
import { FeedPostItem } from '../../components/FeedPostItem';
import { OpenTournaments } from '../../components/OpenTournaments';
import { ChallengeButtonArea, Container, Header } from './styles';

const OPEN_STATUSES: Duel['status'][] = ['active', 'awaiting', 'disputed'];

function FeedScreen({ navigation }: FeedProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const challengeSheetRef = useRef<BottomSheetModal>(null);
  const [scope, setScope] = useState<Scope>('city');
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [myDuels, setMyDuels] = useState<Duel[]>([]);
  const { category, setCategory } = useActiveCategory();

  const cityId = scope === 'city' ? profile?.cityId ?? null : null;
  useEffect(() => {
    setPosts(null);
    return subscribeFeed(category, cityId, setPosts, error => {
      crashReportingService.recordError(error, 'subscribeFeed');
      setPosts([]);
    });
  }, [category, cityId]);

  const uid = profile?.uid;
  useEffect(() => {
    if (!uid) return;
    return subscribeMyDuels(uid, setMyDuels);
  }, [uid]);

  const openDuel = myDuels.find(duel => OPEN_STATUSES.includes(duel.status));
  const playerUids = useMemo(
    () =>
      (posts ?? []).flatMap(post => [post.winnerUid, ...(post.loserUid ? [post.loserUid] : [])]),
    [posts],
  );
  const profiles = usePublicProfiles(playerUids);
  const tournamentIds = useMemo(
    () => (posts ?? []).flatMap(post => (post.tournamentId ? [post.tournamentId] : [])),
    [posts],
  );
  const missingTournaments = useMissingTournaments(tournamentIds);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Container>
        {profile && <FeedHeader profile={profile} onPress={() => navigation.navigate('Profile')} />}
        <Header>
          <CategoryTabs value={category} onChange={setCategory} />
          <ScopeChips value={scope} cityName={profile?.cityName} onChange={setScope} />
        </Header>

        {openDuel && profile && (
          <ActiveDuelBanner
            duel={openDuel}
            myUid={profile.uid}
            onPress={() => navigation.navigate('Duel', { duelId: openDuel.id })}
          />
        )}

        <OpenTournaments
          category={category}
          onOpen={tournamentId => navigation.navigate('Tournament', { tournamentId })}
          onSeeAll={() => navigation.navigate('Tournaments')}
        />

        {posts === null ? (
          <ActivityIndicator color={colors.gold.main} style={{ marginTop: spacing.xxl }} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={post => post.id}
            contentContainerStyle={{
              flexGrow: 1,
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingBottom: CHALLENGE_BUTTON_AREA + spacing.lg,
            }}
            renderItem={({ item }) => (
              <FeedPostItem
                post={item}
                myUid={profile?.uid ?? ''}
                winner={profiles[item.winnerUid]}
                loser={item.loserUid ? profiles[item.loserUid] : undefined}
                onOpenTournament={
                  item.tournamentId && !missingTournaments.has(item.tournamentId)
                    ? () => navigation.navigate('Tournament', { tournamentId: item.tournamentId! })
                    : undefined
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="sword-cross"
                title="Nenhum duelo ainda"
                message={
                  scope === 'city'
                    ? `Os duelos de ${profile?.cityName ?? 'sua cidade'} aparecem aqui. Seja o primeiro: desafie alguém!`
                    : 'Os duelos de todo o Brasil aparecem aqui.'
                }
              />
            }
          />
        )}

        <ChallengeButtonArea>
          <Button
            label="Desafiar"
            icon="sword-cross"
            size="lg"
            onPress={() => challengeSheetRef.current?.present()}
          />
        </ChallengeButtonArea>
      </Container>

      <ChallengeSheet ref={challengeSheetRef} />
    </SafeAreaView>
  );
}

export default FeedScreen;
