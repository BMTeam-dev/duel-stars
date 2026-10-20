import * as React from 'react';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../configs/colors';
import { spacing } from '../../configs/theme';
import { ProfileProps } from '../../navigation/props';
import { useAppSelector } from '../../redux/store';
import { mapAuthError, signOut } from '../../services/auth/auth.service';
import { levelProgress, levelTitle } from '../../services/profile/level';
import { Avatar } from '../../shared/ui/Avatar';
import { Button } from '../../shared/ui/Button';
import { useDialog } from '../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../shared/ui/Icon';
import { toast } from '../../shared/ui/toast';
import { LevelInfoSheet } from './components/LevelInfoSheet';
import { LevelProgressCard } from './components/LevelProgressCard';
import { MedalsRow } from './components/MedalsRow';
import {
  CityRow,
  CityText,
  EditButton,
  Identity,
  LevelText,
  Nick,
  SectionEmpty,
  SectionTitle,
  StarsCaption,
  StarsCard,
  StarsLabel,
  StarsNumber,
  StarsRow,
  StatLabel,
  StatTile,
  StatValue,
  StatsRow,
  TopBar,
  TopTitle,
} from './styles';

function ProfileScreen({ navigation }: ProfileProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const { showDialog } = useDialog();
  const [signingOut, setSigningOut] = useState(false);
  const levelSheetRef = useRef<BottomSheetModal>(null);

  if (!profile) return null;

  const progress = levelProgress(profile.wins, profile.losses);

  const handleSignOut = async () => {
    const confirmed = await showDialog({
      icon: 'logout',
      title: 'Sair da conta?',
      message: 'Você vai precisar entrar de novo para duelar.',
      confirmLabel: 'Sair',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (!confirmed) return;

    setSigningOut(true);
    try {
      // Ao sair, o navigator troca sozinho pro Login (ver navigation/index.tsx).
      await signOut();
    } catch (err) {
      toast.error(mapAuthError(err));
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <TopBar>
          <TopTitle>Perfil</TopTitle>
          <EditButton onPress={() => navigation.navigate('EditProfile')} hitSlop={8}>
            <Icon name="pencil" size={20} color={colors.text.secondary} />
          </EditButton>
        </TopBar>

        <Identity>
          <Avatar name={profile.nick} photoUrl={profile.photoUrl} size={88} />
          <Nick>@{profile.nick}</Nick>
          <LevelText>
            Nível {progress.level} · {levelTitle(progress.level)}
          </LevelText>
          <CityRow>
            <Icon name="map-marker" size={16} color={colors.text.secondary} />
            <CityText>
              {profile.cityName} · {profile.stateId}
            </CityText>
          </CityRow>
        </Identity>

        {/* As estrelas são o centro do app: o que se aposta e o que define
        // o ranking - por isso o maior destaque da tela. */}
        <StarsCard>
          <StarsRow>
            <Icon name="star-four-points" size={40} color={colors.gold.main} />
            <StarsNumber>{profile.stars}</StarsNumber>
          </StarsRow>
          <StarsLabel>estrelas</StarsLabel>
          <StarsCaption>Aposte em desafios para ganhar mais e subir no ranking.</StarsCaption>
        </StarsCard>

        <LevelProgressCard progress={progress} onInfo={() => levelSheetRef.current?.present()} />

        <StatsRow>
          <StatTile>
            <StatValue>{profile.wins}</StatValue>
            <StatLabel>Vitórias</StatLabel>
          </StatTile>
          <StatTile>
            <StatValue>{profile.losses}</StatValue>
            <StatLabel>Derrotas</StatLabel>
          </StatTile>
          <StatTile>
            <StatValue>{profile.streak}</StatValue>
            <StatLabel>Sequência</StatLabel>
          </StatTile>
        </StatsRow>

        <SectionTitle>Medalhas</SectionTitle>
        <MedalsRow unlocked={[]} />

        <SectionTitle>Histórico</SectionTitle>
        <SectionEmpty>Seus duelos aparecem aqui.</SectionEmpty>

        <Button
          label="Sair da conta"
          variant="secondary"
          icon="logout"
          loading={signingOut}
          onPress={handleSignOut}
        />
      </ScrollView>

      <LevelInfoSheet ref={levelSheetRef} currentLevel={progress.level} />
    </SafeAreaView>
  );
}

export default ProfileScreen;
