import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { DuelProps } from '../../navigation/props';
import { useAppSelector } from '../../redux/store';
import { duelErrorMessage, reportResult, subscribeDuel } from '../../services/duels/duels.service';
import { Duel, FORMAT_LABEL, PublicProfile } from '../../services/duels/duels.types';
import { usePublicProfiles } from '../../services/profile/usePublicProfiles';
import { AppSheet } from '../../shared/ui/AppSheet';
import { Avatar } from '../../shared/ui/Avatar';
import { Button } from '../../shared/ui/Button';
import { useDialog } from '../../shared/ui/dialog/DialogProvider';
import { Icon, IconName } from '../../shared/ui/Icon';
import { toast } from '../../shared/ui/toast';
import { LifePoints } from './LifePoints';
import { ScreenHeader } from './ScreenHeader';

function DuelScreen({ navigation, route }: DuelProps) {
  const { duelId } = route.params;
  const myUid = useAppSelector(state => state.auth.user?.uid) ?? '';
  const { showDialog } = useDialog();
  const winnerSheetRef = useRef<BottomSheetModal>(null);
  const [duel, setDuel] = useState<Duel | null | undefined>(undefined);
  const [sending, setSending] = useState(false);

  useEffect(() => subscribeDuel(duelId, setDuel), [duelId]);
  const profiles = usePublicProfiles(duel?.players ?? []);

  if (duel === undefined) {
    return (
      <Screen>
        <Center>
          <ActivityIndicator color={colors.gold.main} size="large" />
        </Center>
      </Screen>
    );
  }
  if (duel === null) {
    return (
      <Screen>
        <ScreenHeader title="Duelo" onBack={() => navigation.goBack()} />
        <Center>
          <Message>Duelo não encontrado.</Message>
        </Center>
      </Screen>
    );
  }

  const opponentUid = duel.players[0] === myUid ? duel.players[1] : duel.players[0];
  const me = profiles[myUid];
  const opponent = profiles[opponentUid];
  const nickOf = (uid: string) => (uid === myUid ? 'você' : `@${profiles[uid]?.nick ?? '...'}`);
  const goToFeed = () => navigation.navigate('MainTabs', { screen: 'Feed' });

  const send = async (winnerUid: string) => {
    setSending(true);
    try {
      const { status } = await reportResult(duel.id, winnerUid);
      if (status === 'awaiting') toast('Resultado enviado. Esperando o oponente confirmar.');
    } catch (error) {
      toast.error(duelErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const chooseWinner = async (winnerUid: string) => {
    winnerSheetRef.current?.dismiss();
    const confirmed = await showDialog({
      icon: 'flag-checkered',
      title: winnerUid === myUid ? 'Confirmar sua vitória?' : `Confirmar vitória de @${opponent?.nick}?`,
      message: 'O oponente também precisa confirmar. Se discordarem, o duelo vai para disputa.',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Voltar',
    });
    if (confirmed) send(winnerUid);
  };

  const contest = async (claimedWinner: string) => {
    const realWinner = claimedWinner === myUid ? opponentUid : myUid;
    const confirmed = await showDialog({
      icon: 'alert',
      title: 'Contestar o resultado?',
      message: `Você vai informar que ${nickOf(realWinner)} venceu. Com vencedores diferentes, o duelo vai para disputa: as estrelas ficam travadas e, sem acordo em 48 horas, o duelo é cancelado.`,
      confirmLabel: 'Contestar',
      cancelLabel: 'Voltar',
      destructive: true,
    });
    if (confirmed) send(realWinner);
  };

  const header = (
    <ScreenHeader title={`Duelo · ${FORMAT_LABEL[duel.format]}`} onBack={() => navigation.goBack()} />
  );

  const versus = (
    <Versus>
      <Player>
        <Avatar name={me?.nick ?? '?'} photoUrl={me?.photoUrl ?? null} size={56} />
        <PlayerNick numberOfLines={1}>@{me?.nick ?? '...'}</PlayerNick>
      </Player>
      <Stake>
        <Icon name="star-four-points" size={22} color={colors.gold.main} />
        <StakeValue>{duel.stake}</StakeValue>
        <StakeLabel>em jogo</StakeLabel>
      </Stake>
      <Player>
        <Avatar name={opponent?.nick ?? '?'} photoUrl={opponent?.photoUrl ?? null} size={56} />
        <PlayerNick numberOfLines={1}>@{opponent?.nick ?? '...'}</PlayerNick>
      </Player>
    </Versus>
  );

  if (duel.status === 'done' || duel.status === 'cancelled') {
    const won = duel.winnerUid === myUid;
    const cancelled = duel.status === 'cancelled';
    const icon: IconName = cancelled ? 'undo-variant' : won ? 'trophy' : 'sword-cross';
    return (
      <Screen>
        {header}
        <Center>
          <ResultCircle won={won && !cancelled}>
            <Icon name={icon} size={64} color={won && !cancelled ? colors.gold.main : colors.text.secondary} />
          </ResultCircle>
          <ResultTitle>{cancelled ? 'Duelo cancelado' : won ? 'Vitória!' : 'Derrota'}</ResultTitle>
          <ResultStars won={won && !cancelled}>
            {cancelled ? 'As estrelas apostadas voltaram.' : `${won ? '+' : '−'}${duel.stake} estrelas`}
          </ResultStars>
          {!cancelled && (
            <Message>
              {won ? `Você venceu @${opponent?.nick ?? ''}.` : `@${opponent?.nick ?? ''} venceu. Bora pra revanche?`}
            </Message>
          )}
        </Center>
        <Footer>
          <Button label="Voltar ao feed" onPress={goToFeed} />
        </Footer>
      </Screen>
    );
  }

  const myReport = duel.reports[myUid];
  const opponentReport = duel.reports[opponentUid];

  let statusCard: React.ReactNode = null;
  let footer: React.ReactNode = (
    <Button
      label="Encerrar e informar vencedor"
      icon="flag-checkered"
      size="lg"
      loading={sending}
      onPress={() => winnerSheetRef.current?.present()}
    />
  );

  if (duel.status === 'disputed') {
    statusCard = (
      <StatusCard tone="negative">
        <Icon name="alert" color={colors.feedback.negative} />
        <StatusText>
          Vocês informaram vencedores diferentes. As estrelas ficam travadas até vocês se acertarem; sem
          acordo em 48 horas, o duelo é cancelado.
        </StatusText>
      </StatusCard>
    );
    footer = <Button label="Voltar ao feed" variant="secondary" onPress={goToFeed} />;
  } else if (myReport && !opponentReport) {
    statusCard = (
      <StatusCard tone="neutral">
        <Icon name="timer-sand" color={colors.text.secondary} />
        <StatusText>
          {myReport === myUid ? 'Você informou que venceu.' : `Você informou que @${opponent?.nick ?? ''} venceu.`}{' '}
          Esperando @{opponent?.nick ?? ''} confirmar. Sem resposta em 24 horas, vale o seu resultado.
        </StatusText>
      </StatusCard>
    );
    footer = <Button label="Voltar ao feed" variant="secondary" onPress={goToFeed} />;
  } else if (opponentReport && !myReport) {
    statusCard = (
      <StatusCard tone="gold">
        <Icon name="flag-checkered" color={colors.gold.main} />
        <StatusText>
          @{opponent?.nick ?? ''} informou que {opponentReport === myUid ? 'você venceu' : 'venceu'} o
          duelo. Está certo?
        </StatusText>
      </StatusCard>
    );
    footer = (
      <>
        <Button label="Confirmar resultado" icon="check" size="lg" loading={sending} onPress={() => send(opponentReport)} />
        <Button label="Não foi isso que aconteceu" variant="ghost" onPress={() => contest(opponentReport)} />
      </>
    );
  }

  return (
    <Screen>
      {header}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {versus}
        {statusCard}
        {duel.status === 'active' && !myReport && (
          <LifePoints myNick={me?.nick ?? 'Você'} opponentNick={opponent?.nick ?? 'Oponente'} />
        )}
      </ScrollView>
      <Footer>{footer}</Footer>

      <AppSheet ref={winnerSheetRef} title="Quem venceu?">
        <WinnerOptions>
          {[me, opponent].filter((p): p is PublicProfile => !!p).map(player => (
            <WinnerOption key={player.uid} onPress={() => chooseWinner(player.uid)}>
              <Avatar name={player.nick} photoUrl={player.photoUrl} size={48} />
              <WinnerText>{player.uid === myUid ? 'Eu venci' : `@${player.nick} venceu`}</WinnerText>
              <Icon name="chevron-right" color={colors.text.muted} />
            </WinnerOption>
          ))}
        </WinnerOptions>
      </AppSheet>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xl}px;
`;

const Message = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
  text-align: center;
  margin-top: ${spacing.sm}px;
`;

const Versus = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Player = styled.View`
  width: 110px;
  align-items: center;
  gap: ${spacing.sm}px;
`;

const PlayerNick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

const Stake = styled.View`
  align-items: center;
`;

const StakeValue = styled.Text`
  color: ${colors.gold.main};
  font-size: 32px;
  font-weight: 900;
`;

const StakeLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;

const toneColors = {
  neutral: { border: colors.border, background: colors.surface },
  gold: { border: colors.gold.dark, background: colors.gold.soft },
  negative: { border: colors.feedback.negative, background: 'rgba(255, 107, 94, 0.1)' },
};

const StatusCard = styled.View<{ tone: keyof typeof toneColors }>`
  flex-direction: row;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ tone }) => toneColors[tone].border};
  background-color: ${({ tone }) => toneColors[tone].background};
`;

const StatusText = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
`;

const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;

const ResultCircle = styled.View<{ won: boolean }>`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  align-items: center;
  justify-content: center;
  background-color: ${({ won }) => (won ? colors.gold.soft : colors.surface)};
  border-width: 2px;
  border-color: ${({ won }) => (won ? colors.gold.main : colors.border)};
  margin-bottom: ${spacing.xl}px;
`;

const ResultTitle = styled.Text`
  color: ${colors.text.primary};
  font-size: 36px;
  font-weight: 900;
`;

const ResultStars = styled.Text<{ won: boolean }>`
  color: ${({ won }) => (won ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.title}px;
  font-weight: 800;
  margin-top: ${spacing.sm}px;
`;

const WinnerOptions = styled.View`
  gap: ${spacing.md}px;
`;

const WinnerOption = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surfaceRaised};
`;

const WinnerText = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export default DuelScreen;
