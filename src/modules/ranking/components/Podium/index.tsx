import * as React from 'react';
import { RankingEntry } from '../../../../services/ranking/ranking.types';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon } from '../../../../shared/ui/Icon';
import { colors } from '../../../../configs/colors';
import { medalColor } from '../../medalColor';
import { Base, BaseText, Column, Nick, Row, Stars, StarsText } from './styles';

type Props = {
  entries: RankingEntry[];
  myUid: string;
};

// Altura do degrau por lugar no pódio (1º no meio, mais alto).
const STEP_HEIGHT = [88, 64, 48];
const AVATAR_SIZE = [72, 56, 56];

export function Podium({ entries, myUid }: Props) {
  // Ordem visual: 2º, 1º, 3º.
  const slots = [entries[1], entries[0], entries[2]];
  const places = [1, 0, 2];
  return (
    <Row>
      {slots.map((entry, i) => {
        const place = places[i];
        if (!entry) return <Column key={place} />;
        const color = medalColor(entry.position) ?? colors.border;
        return (
          <Column key={entry.uid}>
            {place === 0 && <Icon name="crown" size={28} color={colors.gold.main} />}
            <Avatar name={entry.nick} photoUrl={entry.photoUrl} size={AVATAR_SIZE[place]} />
            <Nick numberOfLines={1} mine={entry.uid === myUid}>
              @{entry.nick}
            </Nick>
            <Stars>
              <Icon name="star-four-points" size={14} color={colors.gold.main} />
              <StarsText>{entry.stars}</StarsText>
            </Stars>
            <Base height={STEP_HEIGHT[place]} color={color}>
              <BaseText color={color}>{entry.position}º</BaseText>
            </Base>
          </Column>
        );
      })}
    </Row>
  );
}
