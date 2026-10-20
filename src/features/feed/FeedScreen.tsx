import * as React from 'react';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../configs/colors';
import { CHALLENGE_BUTTON_AREA, spacing } from '../../configs/theme';
import { FeedProps } from '../../navigation/props';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { useAppSelector } from '../../redux/store';
import { ChallengeSheet } from './ChallengeSheet';
import { FeedHeader } from './FeedHeader';
import {
  Container,
  Header,
  ScopeRow,
  ScopeChip,
  ScopeChipText,
  ChallengeButtonArea,
} from './styles';

type Scope = 'city' | 'global';

function FeedScreen({ navigation }: FeedProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const challengeSheetRef = useRef<BottomSheetModal>(null);
  const [scope, setScope] = useState<Scope>('city');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Container>
        {profile && <FeedHeader profile={profile} onPress={() => navigation.navigate('Profile')} />}
        <Header>
          <ScopeRow>
            <ScopeChip active={scope === 'city'} onPress={() => setScope('city')}>
              <ScopeChipText active={scope === 'city'}>Minha cidade</ScopeChipText>
            </ScopeChip>
            <ScopeChip active={scope === 'global'} onPress={() => setScope('global')}>
              <ScopeChipText active={scope === 'global'}>Geral</ScopeChipText>
            </ScopeChip>
          </ScopeRow>
        </Header>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: CHALLENGE_BUTTON_AREA + spacing.lg }}
        >
          <EmptyState
            icon="sword-cross"
            title="Nenhum duelo ainda"
            message={
              scope === 'city'
                ? 'Os duelos da sua cidade aparecem aqui. Seja o primeiro: desafie alguém!'
                : 'Os duelos de todo o Brasil aparecem aqui.'
            }
          />
        </ScrollView>

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
