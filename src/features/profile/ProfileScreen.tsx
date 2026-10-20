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
import { totalRecord } from '../../services/profile/profile.service';
import { useActiveCategory } from '../../services/profile/useActiveCategory';
import { CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL } from '../../services/duels/duels.types';
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
  StarsCategory,
  Wallets,
  WalletName,
  WalletRecord,
  WalletRow,
  WalletStars,
  WalletStarsText,
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
  const { category, setCategory } = useActiveCategory();

  if (!profile) return null;

  const total = totalRecord(profile);
  const progress = levelProgress(total.wins, total.losses);
  const wallet = profile.wallets[category];

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
        // o ranking - por isso o maior destaque da tela. Uma carteira por
        // categoria; o card grande é a da categoria ativa. */}
        <StarsCard>
          <StarsCategory>{CATEGORY_LABEL[category]}</StarsCategory>
          <StarsRow>
            <Icon name="star-four-points" size={40} color={colors.gold.main} />
            <StarsNumber>{wallet.stars}</StarsNumber>
          </StarsRow>
          <StarsLabel>estrelas</StarsLabel>
          {wallet.lockedStars > 0 && (
            <StarsCaption>{wallet.lockedStars} em jogo em duelos abertos</StarsCaption>
          )}
        </StarsCard>

        <Wallets>
          {CATEGORIES.map(item => (
            <WalletRow key={item} active={item === category} onPress={() => setCategory(item)}>
              <Icon
                name={CATEGORY_ICON[item]}
                size={20}
                color={item === category ? colors.gold.main : colors.text.secondary}
              />
              <WalletName active={item === category}>{CATEGORY_LABEL[item]}</WalletName>
              <WalletRecord>
                {profile.wallets[item].wins}V {profile.wallets[item].losses}D
              </WalletRecord>
              <WalletStars>
                <Icon name="star-four-points" size={14} color={colors.gold.main} />
                <WalletStarsText>{profile.wallets[item].stars}</WalletStarsText>
              </WalletStars>
            </WalletRow>
          ))}
        </Wallets>

        <LevelProgressCard progress={progress} onInfo={() => levelSheetRef.current?.present()} />

        <StatsRow>
          <StatTile>
            <StatValue>{wallet.wins}</StatValue>
            <StatLabel>Vitórias</StatLabel>
          </StatTile>
          <StatTile>
            <StatValue>{wallet.losses}</StatValue>
            <StatLabel>Derrotas</StatLabel>
          </StatTile>
          <StatTile>
            <StatValue>{wallet.streak}</StatValue>
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
