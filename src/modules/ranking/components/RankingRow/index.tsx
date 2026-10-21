import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { RankingEntry } from '../../../../services/ranking/ranking.types';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon } from '../../../../shared/ui/Icon';
import { Body, Card, Meta, Nick, Position, Stars, StarsText } from './styles';

type Props = {
  entry: RankingEntry;
  mine: boolean;
  // No Geral mostra de onde a pessoa é; na cidade isso é redundante.
  showCity: boolean;
};

export function RankingRow({ entry, mine, showCity }: Props) {
  return (
    <Card mine={mine}>
      <Position mine={mine}>{entry.position}º</Position>
      <Avatar name={entry.nick} photoUrl={entry.photoUrl} size={40} />
      <Body>
        <Nick numberOfLines={1}>
          @{entry.nick}
          {mine ? ' (você)' : ''}
        </Nick>
        <Meta numberOfLines={1}>
          {entry.wins}V {entry.losses}D
          {showCity ? ` · ${entry.cityName} · ${entry.stateId}` : ''}
        </Meta>
      </Body>
      <Stars>
        <Icon name="star-four-points" size={14} color={colors.gold.main} />
        <StarsText>{entry.stars}</StarsText>
      </Stars>
    </Card>
  );
}
