import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { ProfileProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import {
  deleteAccount,
  mapAuthError,
  signOut,
} from '../../../../services/auth/auth.service';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { TextField } from '../../../../shared/ui/TextField';
import { levelProgress, levelTitle } from '../../../../services/profile/level';
import { totalRecord } from '../../../../services/profile/profile.service';
import { useActiveCategory } from '../../../../services/profile/useActiveCategory';
import {
  CATEGORIES,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  Duel,
} from '../../../../services/duels/duels.types';
import { useDuelNotes } from '../../../../services/duels/duelNotes.service';
import {
  duelErrorMessage,
  subscribeDuelHistory,
} from '../../../../services/duels/duels.service';
import { crashReportingService } from '../../../../services/crashReporting/crashReporting.service';
import { usePublicProfiles } from '../../../../services/profile/usePublicProfiles';
import {
  pickFregues,
  pickNemesis,
  Rival,
  subscribeRivals,
} from '../../../../services/rivals/rivals.service';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Button } from '../../../../shared/ui/Button';
import { GameIdRow } from '../../../../shared/ui/GameIdRow';
import { useDialog } from '../../../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import { DuelHistoryItem } from '../../components/DuelHistoryItem';
import { LevelInfoSheet } from '../../components/LevelInfoSheet';
import { LevelProgressCard } from '../../components/LevelProgressCard';
import { MedalsRow } from '../../components/MedalsRow';
import { RivalsCard } from '../../components/RivalsCard';
import {
  CityRow,
  DeleteLink,
  DeleteLinkText,
  DeleteWarning,
  CityText,
  EditButton,
  GameIds,
  HistoryList,
  Identity,
  LevelText,
  Nick,
  SectionEmpty,
  SectionHeader,
  SectionTitle,
  SeeAll,
  SeeAllText,
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

const RECENT_DUELS = 5;

const DELETE_WORD = 'EXCLUIR';

function ProfileScreen({ navigation }: ProfileProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const { showDialog } = useDialog();
  const [signingOut, setSigningOut] = useState(false);
  const levelSheetRef = useRef<BottomSheetModal>(null);
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { category, setCategory } = useActiveCategory();
  const [recentDuels, setRecentDuels] = useState<Duel[]>([]);
  const [rivals, setRivals] = useState<Rival[]>([]);

  const uid = profile?.uid;
  useEffect(() => {
    if (!uid) return;
    const onError = (scope: string) => (error: Error) =>
      crashReportingService.recordError(error, scope);
    const stopDuels = subscribeDuelHistory(
      uid,
      RECENT_DUELS,
      setRecentDuels,
      onError('recentDuels'),
    );
    const stopRivals = subscribeRivals(uid, setRivals, onError('rivals'));
    return () => {
      stopDuels();
      stopRivals();
    };
  }, [uid]);

  const fregues = pickFregues(rivals);
  const nemesis = pickNemesis(rivals);
  const opponentUids = useMemo(
    () => [
      ...recentDuels.map(duel => duel.players.find(p => p !== uid) ?? ''),
      ...(fregues ? [fregues.uid] : []),
      ...(nemesis ? [nemesis.uid] : []),
    ],
    [recentDuels, fregues, nemesis, uid],
  );
  const profiles = usePublicProfiles(opponentUids);
  const recentIds = useMemo(
    () => recentDuels.map(duel => duel.id),
    [recentDuels],
  );
  const notes = useDuelNotes(uid, recentIds);

  if (!profile) return null;

  const total = totalRecord(profile);
  const progress = levelProgress(total.wins, total.losses);
  const wallet = profile.wallets[category];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Ao apagar, a sessão cai e o navigator volta sozinho pro Login.
      await deleteAccount();
      deleteSheetRef.current?.dismiss();
      toast.success('Conta excluída');
    } catch (err) {
      setDeleting(false);
      toast.error(duelErrorMessage(err));
    }
  };

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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <TopBar>
          <TopTitle>Perfil</TopTitle>
          <EditButton
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={8}
          >
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
            <StarsCaption>
              {wallet.lockedStars} em jogo em duelos abertos
            </StarsCaption>
          )}
        </StarsCard>

        <Wallets>
          {CATEGORIES.map(item => (
            <WalletRow
              key={item}
              active={item === category}
              onPress={() => setCategory(item)}
            >
              <Icon
                name={CATEGORY_ICON[item]}
                size={20}
                color={
                  item === category ? colors.gold.main : colors.text.secondary
                }
              />
              <WalletName active={item === category}>
                {CATEGORY_LABEL[item]}
              </WalletName>
              <WalletRecord>
                {profile.wallets[item].wins}V {profile.wallets[item].losses}D
              </WalletRecord>
              <WalletStars>
                <Icon
                  name="star-four-points"
                  size={14}
                  color={colors.gold.main}
                />
                <WalletStarsText>{profile.wallets[item].stars}</WalletStarsText>
              </WalletStars>
            </WalletRow>
          ))}
        </Wallets>

        <LevelProgressCard
          progress={progress}
          onInfo={() => levelSheetRef.current?.present()}
        />

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

        <SectionHeader>
          <SectionTitle>IDs dos jogos</SectionTitle>
          <SeeAll
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={8}
          >
            <SeeAllText>Editar</SeeAllText>
          </SeeAll>
        </SectionHeader>
        <GameIds>
          <GameIdRow
            game="md"
            label="Master Duel"
            id={profile.gameIds.md}
            emptyText="Não cadastrado"
          />
          <GameIdRow
            game="dl"
            label="Duel Links"
            id={profile.gameIds.dl}
            emptyText="Não cadastrado"
          />
        </GameIds>

        <SectionTitle>Rivais</SectionTitle>
        <RivalsCard fregues={fregues} nemesis={nemesis} profiles={profiles} />

        <SectionHeader>
          <SectionTitle>Últimos duelos</SectionTitle>
          {recentDuels.length > 0 && (
            <SeeAll
              onPress={() => navigation.navigate('DuelHistory')}
              hitSlop={8}
            >
              <SeeAllText>Ver todos</SeeAllText>
            </SeeAll>
          )}
        </SectionHeader>
        {recentDuels.length === 0 ? (
          <SectionEmpty>Seus duelos aparecem aqui.</SectionEmpty>
        ) : (
          <HistoryList>
            {recentDuels.map(duel => (
              <DuelHistoryItem
                key={duel.id}
                duel={duel}
                myUid={profile.uid}
                opponent={
                  profiles[duel.players.find(p => p !== profile.uid) ?? '']
                }
                note={notes[duel.id]}
                onPress={() => navigation.navigate('Duel', { duelId: duel.id })}
              />
            ))}
          </HistoryList>
        )}

        <SectionTitle>Medalhas</SectionTitle>
        <MedalsRow medals={profile.medals} />

        <Button
          label="Sair da conta"
          variant="secondary"
          icon="logout"
          loading={signingOut}
          onPress={handleSignOut}
        />
        <DeleteLink
          onPress={() => deleteSheetRef.current?.present()}
          hitSlop={8}
        >
          <DeleteLinkText>Excluir conta</DeleteLinkText>
        </DeleteLink>
      </ScrollView>

      <AppSheet
        ref={deleteSheetRef}
        title="Excluir conta"
        onDismiss={() => setConfirmText('')}
      >
        <DeleteWarning>
          Isso apaga de vez seu perfil, estrelas, medalhas, rivais e anotações,
          e libera seu nick. Os duelos continuam no histórico dos outros
          jogadores, como "conta excluída". Não dá para desfazer.
        </DeleteWarning>
        <TextField
          label={`Digite ${DELETE_WORD} para confirmar`}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button
          label="Excluir minha conta"
          icon="delete"
          variant="danger"
          disabled={confirmText.trim().toUpperCase() !== DELETE_WORD}
          loading={deleting}
          onPress={handleDelete}
        />
      </AppSheet>

      <LevelInfoSheet ref={levelSheetRef} currentLevel={progress.level} />
    </SafeAreaView>
  );
}

export default ProfileScreen;
