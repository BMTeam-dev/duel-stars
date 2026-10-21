import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { TournamentProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { duelErrorMessage } from '../../../../services/duels/duels.service';
import { CATEGORY_ICON, CATEGORY_LABEL, FORMAT_LABEL } from '../../../../services/duels/duels.types';
import { usePublicProfiles } from '../../../../services/profile/usePublicProfiles';
import {
  cancelTournament,
  checkInTournament,
  getTournamentPassword,
  joinTournament,
  leaveTournament,
  needsGameId,
  resolveMatch,
  setPlayerPaid,
  startTournament,
  subscribeMatches,
  subscribeTournament,
  subscribeTournamentPlayers,
} from '../../../../services/tournaments/tournaments.service';
import {
  CHECKIN_WINDOW_MS,
  formatMoney,
  formatStart,
  roundLabel,
  roundDeadlineLabel,
  Tournament,
  TOURNAMENT_FORMAT_LABEL,
  TournamentMatch,
  TournamentPlayer,
} from '../../../../services/tournaments/tournaments.types';
import { MatchRow } from '../../components/MatchRow';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Button } from '../../../../shared/ui/Button';
import { useDialog } from '../../../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../../../shared/ui/Icon';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { TextField } from '../../../../shared/ui/TextField';
import { toast } from '../../../../shared/ui/toast';
import {
  Center,
  Champion,
  ChampionName,
  ChampionLabel,
  Rounds,
  RoundTitle,
  CopyChip,
  CopyChipText,
  Description,
  Empty,
  Footer,
  Info,
  InfoLabel,
  InfoRow,
  InfoValue,
  Meta,
  MetaRow,
  Name,
  OrganizerBox,
  OrganizerTitle,
  PaidChip,
  PaidChipText,
  PlayerNick,
  PlayerRow,
  Screen,
  SectionTitle,
  StatusBadge,
  StatusText,
} from './styles';

const STATUS_LABEL: Record<Tournament['status'], string> = {
  open: 'Inscrições abertas',
  checkin: 'Check-in',
  running: 'Em andamento',
  finished: 'Encerrado',
  cancelled: 'Cancelado',
};

function copy(value: string, what: string) {
  Clipboard.setString(value);
  toast.success(`${what} copiado`);
}

function TournamentScreen({ navigation, route }: TournamentProps) {
  const { tournamentId } = route.params;
  const uid = useAppSelector(state => state.profile.profile?.uid) ?? '';
  const { showDialog } = useDialog();
  const [t, setT] = useState<Tournament | null | undefined>(undefined);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [password, setPassword] = useState<string | null>(null);
  const [typedPassword, setTypedPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [resolving, setResolving] = useState<TournamentMatch | null>(null);
  const passwordSheetRef = useRef<BottomSheetModal>(null);
  const resolveSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => subscribeTournament(tournamentId, setT), [tournamentId]);
  useEffect(() => subscribeTournamentPlayers(tournamentId, setPlayers), [tournamentId]);
  useEffect(() => subscribeMatches(tournamentId, setMatches), [tournamentId]);

  const isOrganizer = !!t && t.organizerUid === uid;
  const isPrivate = t?.visibility === 'private';
  useEffect(() => {
    if (isOrganizer && isPrivate) getTournamentPassword(tournamentId).then(setPassword).catch(() => undefined);
  }, [isOrganizer, isPrivate, tournamentId]);

  const uids = useMemo(
    () => [
      ...players.map(p => p.uid),
      ...matches.flatMap(m => m.players.filter((p): p is string => !!p)),
      ...(t ? [t.organizerUid] : []),
    ],
    [players, matches, t],
  );
  const profiles = usePublicProfiles(uids);

  if (t === undefined) {
    return (
      <Screen>
        <ScreenHeader title="Torneio" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.gold.main} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }
  if (t === null) {
    return (
      <Screen>
        <ScreenHeader title="Torneio" onBack={() => navigation.goBack()} />
        <Center>
          <Empty>Torneio não encontrado.</Empty>
        </Center>
      </Screen>
    );
  }

  const joined = t.playerUids.includes(uid);
  const open = t.status === 'open' && t.startsAt > Date.now();
  const checkinOpen = t.status === 'open' && Date.now() >= t.startsAt - CHECKIN_WINDOW_MS;
  const me = players.find(p => p.uid === uid);
  const checkedInCount = players.filter(p => p.checkedIn).length;
  const myMatch = matches.find(m => m.status === 'active' && m.players.includes(uid));
  const rounds = t.rounds ?? 0;
  const full = t.playerCount >= t.maxPlayers;
  const organizer = profiles[t.organizerUid];

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      return true;
    } catch (error) {
      const game = needsGameId(error);
      if (game) {
        const go = await showDialog({
          icon: CATEGORY_ICON[game],
          title: `Cadastre seu ID do ${CATEGORY_LABEL[game]}`,
          message: 'Nos torneios online, o oponente usa o seu ID para te adicionar no jogo.',
          confirmLabel: 'Cadastrar agora',
          cancelLabel: 'Depois',
        });
        if (go) navigation.navigate('EditProfile');
      } else {
        toast.error(duelErrorMessage(error));
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  const join = async (pw?: string) => {
    const details = [
      t.entryFeeCents ? `Inscrição de ${formatMoney(t.entryFeeCents)} paga por Pix ao organizador.` : null,
      t.starsEntry ? `${t.starsEntry} estrelas do ${CATEGORY_LABEL[t.category]} ficam travadas até o fim.` : null,
    ].filter(Boolean);
    if (details.length) {
      const ok = await showDialog({
        icon: 'tournament',
        title: 'Confirmar inscrição?',
        message: details.join(' '),
        confirmLabel: 'Inscrever-me',
        cancelLabel: 'Voltar',
      });
      if (!ok) return;
    }
    if (await run(() => joinTournament(t.id, pw), 'Inscrição feita')) {
      passwordSheetRef.current?.dismiss();
      setTypedPassword('');
    }
  };

  const leave = async () => {
    const ok = await showDialog({
      icon: 'exit-run',
      title: 'Sair do torneio?',
      message: t.starsEntry ? 'As estrelas da inscrição voltam para a sua carteira.' : undefined,
      confirmLabel: 'Sair',
      cancelLabel: 'Ficar',
      destructive: true,
    });
    if (ok) run(() => leaveTournament(t.id), 'Você saiu do torneio');
  };

  const cancel = async () => {
    const ok = await showDialog({
      icon: 'close-octagon',
      title: 'Cancelar o torneio?',
      message: 'Todos os inscritos saem e as estrelas da inscrição voltam. Isso não pode ser desfeito.',
      confirmLabel: 'Cancelar torneio',
      cancelLabel: 'Voltar',
      destructive: true,
    });
    if (ok) run(() => cancelTournament(t.id), 'Torneio cancelado');
  };

  const share = () =>
    Share.share({
      message: `Torneio "${t.name}" no Duel Stars (${CATEGORY_LABEL[t.category]}, ${formatStart(t.startsAt)}). Abra o app, vá em Torneios → Código e digite ${t.code}${
        password ? `. Senha: ${password}` : ''
      }`,
    }).catch(() => undefined);

  const info: [string, string][] = [
    ['Formato', `${TOURNAMENT_FORMAT_LABEL[t.format]} · ${FORMAT_LABEL[t.matchFormat]}`],
    ['Vagas', `${t.playerCount} de ${t.maxPlayers}`],
    ['Prazo da rodada', roundDeadlineLabel(t.roundMinutes)],
    ['Inscrição', t.entryFeeCents ? formatMoney(t.entryFeeCents) : 'Grátis'],
  ];
  if (t.starsEntry) info.push(['Estrelas', `${t.starsEntry} por jogador · bolo de ${t.starsEntry * t.playerCount}`]);
  if (t.minStars) info.push(['Mínimo para entrar', `${t.minStars} estrelas`]);

  let footer: React.ReactNode = null;
  if (open && !joined) {
    footer = (
      <Button
        label={full ? 'Torneio lotado' : 'Inscrever-se'}
        icon={isPrivate ? 'lock' : 'tournament'}
        size="lg"
        disabled={full}
        loading={busy}
        onPress={() => (isPrivate && !isOrganizer ? passwordSheetRef.current?.present() : join(password ?? undefined))}
      />
    );
  } else if (t.status === 'open' && joined) {
    footer = (
      <>
        {checkinOpen && !me?.checkedIn && (
          <Button
            label="Fazer check-in"
            icon="check-circle"
            size="lg"
            loading={busy}
            onPress={() => run(() => checkInTournament(t.id), 'Check-in feito')}
          />
        )}
        {checkinOpen && me?.checkedIn && (
          <Button label="Check-in feito · aguardando o início" icon="check-circle" variant="secondary" disabled onPress={() => undefined} />
        )}
        <Button label="Sair do torneio" variant="ghost" loading={busy} onPress={leave} />
      </>
    );
  } else if (myMatch?.duelId) {
    footer = (
      <Button
        label="Ir para minha partida"
        icon="sword-cross"
        size="lg"
        onPress={() => navigation.navigate('Duel', { duelId: myMatch.duelId! })}
      />
    );
  }

  const start = async () => {
    const ok = await showDialog({
      icon: 'play-circle',
      title: 'Iniciar o torneio?',
      message: `${checkedInCount} ${
        checkedInCount === 1 ? 'jogador fez' : 'jogadores fizeram'
      } check-in. Quem não fez sai do torneio e recebe as estrelas de volta.`,
      confirmLabel: 'Iniciar',
      cancelLabel: 'Voltar',
    });
    if (ok) run(() => startTournament(t.id), 'Torneio iniciado');
  };

  const openMatch = (match: TournamentMatch) => {
    if (match.players.includes(uid) && match.duelId) {
      navigation.navigate('Duel', { duelId: match.duelId });
    } else if (isOrganizer && match.status === 'active') {
      setResolving(match);
      resolveSheetRef.current?.present();
    }
  };

  const resolve = async (winnerUid: string | null) => {
    if (!resolving) return;
    resolveSheetRef.current?.dismiss();
    await run(() => resolveMatch(t.id, resolving.id, winnerUid), 'Partida decidida');
  };

  const roundNumbers = [...new Set(matches.map(m => m.round))];

  return (
    <Screen>
      <ScreenHeader title="Torneio" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {t.status === 'finished' && (
          <Champion>
            <Icon name="crown" size={32} color={colors.gold.main} />
            <ChampionLabel>Campeão</ChampionLabel>
            <ChampionName>
              {t.championUid ? `@${profiles[t.championUid]?.nick ?? '...'}` : 'Sem campeão'}
            </ChampionName>
            {t.pot > 0 && !!t.championUid && <Meta>Bolo de {t.pot} estrelas dividido entre os primeiros.</Meta>}
          </Champion>
        )}

        <Info>
          <MetaRow>
            <Icon name={CATEGORY_ICON[t.category]} size={16} color={colors.text.secondary} />
            <Meta>{CATEGORY_LABEL[t.category]}</Meta>
            {isPrivate && <Icon name="lock" size={16} color={colors.text.muted} />}
            <StatusBadge tone={t.status === 'cancelled' ? 'negative' : open ? 'gold' : 'neutral'}>
              <StatusText tone={t.status === 'cancelled' ? 'negative' : open ? 'gold' : 'neutral'}>
                {checkinOpen ? 'Check-in aberto' : STATUS_LABEL[t.status]}
              </StatusText>
            </StatusBadge>
          </MetaRow>
          <Name>{t.name}</Name>
          <Meta>
            {formatStart(t.startsAt)} · organizado por @{organizer?.nick ?? '...'}
          </Meta>
          {!!t.description && <Description>{t.description}</Description>}
        </Info>

        <Info>
          {info.map(([label, value]) => (
            <InfoRow key={label}>
              <InfoLabel>{label}</InfoLabel>
              <InfoValue>{value}</InfoValue>
            </InfoRow>
          ))}
          {!!t.pixKey && (
            <InfoRow>
              <InfoLabel>Chave Pix</InfoLabel>
              <CopyChip onPress={() => copy(t.pixKey!, 'Pix')}>
                <CopyChipText numberOfLines={1}>{t.pixKey}</CopyChipText>
                <Icon name="content-copy" size={14} color={colors.gold.main} />
              </CopyChip>
            </InfoRow>
          )}
          {!!t.contact && (
            <InfoRow>
              <InfoLabel>Contato</InfoLabel>
              <CopyChip onPress={() => copy(t.contact!, 'Contato')}>
                <CopyChipText numberOfLines={1}>{t.contact}</CopyChipText>
                <Icon name="content-copy" size={14} color={colors.gold.main} />
              </CopyChip>
            </InfoRow>
          )}
        </Info>

        {isOrganizer && t.status !== 'cancelled' && (
          <OrganizerBox>
            <OrganizerTitle>Você organiza este torneio</OrganizerTitle>
            <InfoRow>
              <InfoLabel>Código</InfoLabel>
              <CopyChip onPress={() => copy(t.code, 'Código')}>
                <CopyChipText>{t.code}</CopyChipText>
                <Icon name="content-copy" size={14} color={colors.gold.main} />
              </CopyChip>
            </InfoRow>
            {!!password && (
              <InfoRow>
                <InfoLabel>Senha</InfoLabel>
                <CopyChip onPress={() => copy(password, 'Senha')}>
                  <CopyChipText>{password}</CopyChipText>
                  <Icon name="content-copy" size={14} color={colors.gold.main} />
                </CopyChip>
              </InfoRow>
            )}
            {t.status === 'open' &&
              (checkinOpen ? (
                <Button
                  label={`Iniciar torneio (${checkedInCount} com check-in)`}
                  icon="play"
                  loading={busy}
                  disabled={checkedInCount < 2}
                  onPress={start}
                />
              ) : (
                <Meta>O check-in abre 30 minutos antes; aí você inicia o torneio.</Meta>
              ))}
            {t.status === 'running' && (
              <Meta>Toque numa partida em andamento para dar W.O. ou derrota dupla.</Meta>
            )}
            <Button label="Compartilhar" icon="share-variant" variant="secondary" onPress={share} />
            {t.status === 'open' && (
              <Button label="Cancelar torneio" variant="ghost" loading={busy} onPress={cancel} />
            )}
          </OrganizerBox>
        )}

        <SectionTitle>Inscritos ({t.playerCount})</SectionTitle>
        {players.length === 0 ? (
          <Empty>Ninguém inscrito ainda.</Empty>
        ) : (
          players.map(player => {
            const profile = profiles[player.uid];
            return (
              <PlayerRow key={player.uid}>
                <Avatar name={profile?.nick ?? '?'} photoUrl={profile?.photoUrl ?? null} size={36} />
                <PlayerNick numberOfLines={1}>
                  @{profile?.nick ?? '...'}
                  {player.uid === uid ? ' (você)' : ''}
                </PlayerNick>
                {checkinOpen && player.checkedIn && (
                  <Icon name="check-circle" size={18} color={colors.feedback.positive} />
                )}
                {!!t.entryFeeCents && (
                  <PaidChip
                    paid={player.paid}
                    disabled={!isOrganizer}
                    onPress={() => run(() => setPlayerPaid(t.id, player.uid, !player.paid), 'Pagamento atualizado')}
                  >
                    <PaidChipText paid={player.paid}>{player.paid ? 'Pago' : 'Pendente'}</PaidChipText>
                  </PaidChip>
                )}
              </PlayerRow>
            );
          })
        )}

        <SectionTitle>Rodadas</SectionTitle>
        {matches.length === 0 ? (
          <Empty>As rodadas e o pareamento aparecem aqui quando o torneio começar.</Empty>
        ) : (
          roundNumbers.map(round => (
            <Rounds key={round}>
              <RoundTitle>{roundLabel(round, rounds)}</RoundTitle>
              {matches
                .filter(m => m.round === round)
                .map(match => {
                  const tappable =
                    (match.players.includes(uid) && !!match.duelId) || (isOrganizer && match.status === 'active');
                  return (
                    <MatchRow
                      key={match.id}
                      match={match}
                      profiles={profiles}
                      myUid={uid}
                      onPress={tappable ? () => openMatch(match) : undefined}
                    />
                  );
                })}
            </Rounds>
          ))
        )}
      </ScrollView>

      {!!footer && <Footer>{footer}</Footer>}

      <AppSheet ref={resolveSheetRef} title="Decidir partida">
        <Meta>Use quando a partida travou: alguém não apareceu ou os dois não se acertaram.</Meta>
        {(resolving?.players ?? [])
          .filter((p): p is string => !!p)
          .map(p => (
            <Button
              key={p}
              label={`@${profiles[p]?.nick ?? '...'} venceu`}
              variant="secondary"
              onPress={() => resolve(p)}
            />
          ))}
        <Button label="Derrota dupla (os dois saem)" variant="ghost" onPress={() => resolve(null)} />
      </AppSheet>

      <AppSheet ref={passwordSheetRef} title="Torneio privado">
        <TextField
          label="Senha"
          value={typedPassword}
          onChangeText={setTypedPassword}
          autoCapitalize="none"
          helper={t.contact ? `Não tem a senha? Peça ao organizador: ${t.contact}` : 'Peça a senha ao organizador.'}
        />
        <Button label="Entrar no torneio" disabled={!typedPassword} loading={busy} onPress={() => join(typedPassword)} />
      </AppSheet>
    </Screen>
  );
}

export default TournamentScreen;
