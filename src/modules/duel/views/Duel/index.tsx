import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { DuelProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import {
  duelErrorMessage,
  reportResult,
  subscribeDuel,
} from '../../../../services/duels/duels.service';
import {
  CATEGORY_LABEL,
  Duel,
  FORMAT_LABEL,
  isOnlineCategory,
  PublicProfile,
} from '../../../../services/duels/duels.types';
import { usePublicProfiles } from '../../../../services/profile/usePublicProfiles';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Button } from '../../../../shared/ui/Button';
import { useDialog } from '../../../../shared/ui/dialog/DialogProvider';
import { GameIdRow } from '../../../../shared/ui/GameIdRow';
import { Icon, IconName } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import { DuelNote } from '../../components/DuelNote';
import { LifePoints } from '../../components/LifePoints';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import {
  Screen,
  Center,
  Message,
  NoteArea,
  Versus,
  Player,
  PlayerNick,
  Stake,
  StakeValue,
  StakeLabel,
  StatusCard,
  StatusText,
  Footer,
  ResultCircle,
  ResultTitle,
  ResultStars,
  WinnerOptions,
  WinnerOption,
  WinnerText,
} from './styles';

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

  const opponentUid =
    duel.players[0] === myUid ? duel.players[1] : duel.players[0];
  const me = profiles[myUid];
  const opponent = profiles[opponentUid];
  const nickOf = (uid: string) =>
    uid === myUid ? 'você' : `@${profiles[uid]?.nick ?? '...'}`;
  // Volta pra onde veio (Feed, Histórico...); aberto por notificação sem
  // nada atrás, cai no Feed.
  const leave = () =>
    navigation.canGoBack()
      ? navigation.goBack()
      : navigation.navigate('MainTabs', { screen: 'Feed' });

  const send = async (winnerUid: string) => {
    setSending(true);
    try {
      const { status } = await reportResult(duel.id, winnerUid);
      if (status === 'awaiting')
        toast('Resultado enviado. Esperando o oponente confirmar.');
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
      title:
        winnerUid === myUid
          ? 'Confirmar sua vitória?'
          : `Confirmar vitória de @${opponent?.nick}?`,
      message:
        'O oponente também precisa confirmar. Se discordarem, o duelo vai para disputa.',
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
      message: `Você vai informar que ${
        realWinner === myUid ? 'você' : nickOf(realWinner)
      } venceu. Com vencedores diferentes, o duelo vai para disputa: as estrelas ficam travadas até um de vocês corrigir o resultado; sem acordo em 48 horas, o duelo é cancelado e as apostas voltam.`,
      confirmLabel: 'Contestar',
      cancelLabel: 'Voltar',
      destructive: true,
    });
    if (confirmed) send(realWinner);
  };

  // Disputa: concordar com a versão do oponente fecha o duelo na hora.
  const agree = async (winnerUid: string) => {
    const iLose = winnerUid !== myUid;
    const confirmed = await showDialog({
      icon: 'handshake',
      title: 'Corrigir o resultado?',
      message: `Você vai concordar que ${
        iLose ? nickOf(winnerUid) : 'você'
      } venceu. O duelo fecha na hora${
        iLose && !duel.tournamentId
          ? ` e você perde ${duel.stake} ${
              duel.stake === 1 ? 'estrela' : 'estrelas'
            }.`
          : '.'
      }`,
      confirmLabel: 'Corrigir',
      cancelLabel: 'Voltar',
      destructive: iLose,
    });
    if (confirmed) send(winnerUid);
  };

  const header = (
    <ScreenHeader
      title={
        duel.tournamentName
          ? `${duel.tournamentName} · ${FORMAT_LABEL[duel.format]}`
          : `${CATEGORY_LABEL[duel.category]} · ${FORMAT_LABEL[duel.format]}`
      }
      onBack={() => navigation.goBack()}
    />
  );

  const versus = (
    <Versus>
      <Player>
        <Avatar
          name={me?.nick ?? '?'}
          photoUrl={me?.photoUrl ?? null}
          size={56}
        />
        <PlayerNick numberOfLines={1}>@{me?.nick ?? '...'}</PlayerNick>
      </Player>
      {duel.tournamentId ? (
        <Stake>
          <Icon name="tournament" size={22} color={colors.gold.main} />
          <StakeLabel>
            {duel.roundLabel ?? 'Torneio'}
          </StakeLabel>
        </Stake>
      ) : (
        <Stake>
          <Icon name="star-four-points" size={22} color={colors.gold.main} />
          <StakeValue>{duel.stake}</StakeValue>
          <StakeLabel>em jogo</StakeLabel>
        </Stake>
      )}
      <Player>
        <Avatar
          name={opponent?.nick ?? '?'}
          photoUrl={opponent?.photoUrl ?? null}
          size={56}
        />
        <PlayerNick numberOfLines={1}>@{opponent?.nick ?? '...'}</PlayerNick>
      </Player>
    </Versus>
  );

  if (duel.status === 'done' || duel.status === 'cancelled') {
    const won = duel.winnerUid === myUid;
    const cancelled = duel.status === 'cancelled';
    const icon: IconName = cancelled
      ? 'undo-variant'
      : won
      ? 'trophy'
      : 'sword-cross';
    return (
      <Screen>
        {header}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <Center>
              <ResultCircle won={won && !cancelled}>
                <Icon
                  name={icon}
                  size={64}
                  color={
                    won && !cancelled ? colors.gold.main : colors.text.secondary
                  }
                />
              </ResultCircle>
              <ResultTitle>
                {cancelled ? 'Duelo cancelado' : won ? 'Vitória!' : 'Derrota'}
              </ResultTitle>
              <ResultStars won={won && !cancelled}>
                {duel.tournamentId
                  ? cancelled
                    ? 'Derrota dupla: os dois saem do torneio.'
                    : won
                    ? 'Você avança no torneio!'
                    : 'Fim da linha neste torneio.'
                  : cancelled
                  ? 'As estrelas apostadas voltaram.'
                  : `${won ? '+' : '−'}${duel.stake} estrelas`}
              </ResultStars>
              {!cancelled && (
                <Message>
                  {won
                    ? `Você venceu @${opponent?.nick ?? ''}.`
                    : `@${opponent?.nick ?? ''} venceu. Bora pra revanche?`}
                </Message>
              )}
              {!cancelled && (
                <NoteArea>
                  <DuelNote uid={myUid} duelId={duel.id} />
                </NoteArea>
              )}
            </Center>
          </ScrollView>
        </KeyboardAvoidingView>
        <Footer>
          <Button label="Voltar" onPress={leave} />
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
          Vocês informaram vencedores diferentes: você disse que{' '}
          {myReport === myUid ? 'venceu' : `${nickOf(myReport)} venceu`}, e{' '}
          {nickOf(opponentUid)} disse que{' '}
          {opponentReport === myUid ? 'você venceu' : 'venceu'}. As estrelas
          ficam travadas. Se alguém se enganou, é só corrigir; sem acordo em 48
          horas, o duelo é cancelado e as apostas voltam.
        </StatusText>
      </StatusCard>
    );
    footer = (
      <>
        <Button
          label={
            opponentReport === myUid
              ? 'Corrigir: na verdade, eu venci'
              : `Corrigir: na verdade, ${nickOf(opponentReport)} venceu`
          }
          icon="handshake"
          loading={sending}
          onPress={() => agree(opponentReport)}
        />
        <Button label="Voltar" variant="ghost" onPress={leave} />
      </>
    );
  } else if (myReport && !opponentReport) {
    statusCard = (
      <StatusCard tone="neutral">
        <Icon name="timer-sand" color={colors.text.secondary} />
        <StatusText>
          {myReport === myUid
            ? 'Você informou que venceu.'
            : `Você informou que @${opponent?.nick ?? ''} venceu.`}{' '}
          Esperando @{opponent?.nick ?? ''} confirmar. Sem resposta em 24 horas,
          vale o seu resultado.
        </StatusText>
      </StatusCard>
    );
    footer = <Button label="Voltar" variant="secondary" onPress={leave} />;
  } else if (opponentReport && !myReport) {
    statusCard = (
      <StatusCard tone="gold">
        <Icon name="flag-checkered" color={colors.gold.main} />
        <StatusText>
          @{opponent?.nick ?? ''} informou que{' '}
          {opponentReport === myUid ? 'você venceu' : 'venceu'} o duelo. Está
          certo?
        </StatusText>
      </StatusCard>
    );
    footer = (
      <>
        <Button
          label="Confirmar resultado"
          icon="check"
          size="lg"
          loading={sending}
          onPress={() => send(opponentReport)}
        />
        <Button
          label="Não foi isso que aconteceu"
          variant="ghost"
          onPress={() => contest(opponentReport)}
        />
      </>
    );
  }

  // A partida acabou (alguém informou o resultado): hora de anotar o deck,
  // com o duelo fresco na cabeça. Durante o jogo o campo só atrapalharia.
  const finished = duel.status === 'disputed' || !!myReport || !!opponentReport;

  return (
    <Screen>
      {header}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {versus}
          {statusCard}
          {finished && <DuelNote uid={myUid} duelId={duel.id} />}
          {duel.status === 'active' &&
            !myReport &&
            !isOnlineCategory(duel.category) && (
              <LifePoints
                myNick={me?.nick ?? 'Você'}
                opponentNick={opponent?.nick ?? 'Oponente'}
              />
            )}
          {/* Online o próprio jogo controla os LP: aqui só o lembrete. */}
          {duel.status === 'active' &&
            !myReport &&
            isOnlineCategory(duel.category) && (
              <>
                <StatusCard tone="neutral">
                  <Icon
                    name={duel.category === 'md' ? 'monitor' : 'cellphone'}
                    color={colors.text.secondary}
                  />
                  <StatusText>
                    Joguem no {CATEGORY_LABEL[duel.category]}. Quando terminar,
                    volte aqui e informe quem venceu.
                  </StatusText>
                </StatusCard>
                {/* Pra se adicionarem no jogo sem sair do app. */}
                <GameIdRow
                  game={duel.category as 'md' | 'dl'}
                  label={`ID de @${opponent?.nick ?? '...'} no ${
                    CATEGORY_LABEL[duel.category]
                  }`}
                  id={opponent?.gameIds[duel.category as 'md' | 'dl']}
                  emptyText={`@${
                    opponent?.nick ?? '...'
                  } ainda não cadastrou o ID`}
                />
              </>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Footer>{footer}</Footer>

      <AppSheet ref={winnerSheetRef} title="Quem venceu?">
        <WinnerOptions>
          {[me, opponent]
            .filter((p): p is PublicProfile => !!p)
            .map(player => (
              <WinnerOption
                key={player.uid}
                onPress={() => chooseWinner(player.uid)}
              >
                <Avatar
                  name={player.nick}
                  photoUrl={player.photoUrl}
                  size={48}
                />
                <WinnerText>
                  {player.uid === myUid ? 'Eu venci' : `@${player.nick} venceu`}
                </WinnerText>
                <Icon name="chevron-right" color={colors.text.muted} />
              </WinnerOption>
            ))}
        </WinnerOptions>
      </AppSheet>
    </Screen>
  );
}

export default DuelScreen;
