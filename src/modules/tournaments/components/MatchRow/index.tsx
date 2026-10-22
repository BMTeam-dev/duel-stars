import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { PublicProfile } from '../../../../services/duels/duels.types';
import { TournamentMatch } from '../../../../services/tournaments/tournaments.types';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon } from '../../../../shared/ui/Icon';
import { Card, Nick, Side, Status, StatusText } from './styles';

type Props = {
  match: TournamentMatch;
  profiles: Record<string, PublicProfile>;
  myUid: string;
  // Sem onPress a linha não é tocável (partida sem duelo, ou de outros).
  onPress?: () => void;
};

type Tone = 'gold' | 'negative' | 'muted';

function status(match: TournamentMatch): { text: string; tone: Tone } {
  if (match.status === 'active') {
    if (match.duelStatus === 'disputed') return { text: 'Em disputa', tone: 'negative' };
    if (match.duelStatus === 'awaiting') return { text: 'Aguardando confirmação', tone: 'gold' };
    return { text: 'Em jogo', tone: 'gold' };
  }
  return { text: statusText(match), tone: 'muted' };
}

function statusText(match: TournamentMatch): string {
  if (match.status === 'pending') return 'Aguardando';
  if (match.status === 'ready') return 'Aguardando início da rodada';
  if (match.result === 'bye') return 'Passou direto';
  if (match.result === 'double_loss') return 'Derrota dupla';
  return 'Encerrada';
}

export function MatchRow({ match, profiles, myUid, onPress }: Props) {
  const mine = match.players.includes(myUid);
  const renderSide = (uid: string | null) => {
    if (!uid) {
      return (
        <Side>
          <Nick muted>{match.status === 'done' ? '—' : 'A definir'}</Nick>
        </Side>
      );
    }
    const profile = profiles[uid];
    const won = match.status === 'done' && match.winnerUid === uid;
    const lost = match.status === 'done' && match.winnerUid !== uid;
    return (
      <Side>
        <Avatar name={profile?.nick ?? '?'} photoUrl={profile?.photoUrl ?? null} size={28} />
        <Nick numberOfLines={1} won={won} muted={lost} mine={uid === myUid}>
          @{profile?.nick ?? '...'}
        </Nick>
        {won && <Icon name="check-circle" size={16} color={colors.gold.main} />}
      </Side>
    );
  };
  return (
    <Card mine={mine} onPress={onPress} disabled={!onPress}>
      {renderSide(match.players[0] ?? null)}
      {renderSide(match.players[1] ?? null)}
      <Status>
        <StatusText tone={status(match).tone}>{status(match).text}</StatusText>
        {!!onPress && <Icon name="chevron-right" size={16} color={colors.text.muted} />}
      </Status>
    </Card>
  );
}
