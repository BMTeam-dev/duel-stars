import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { FeedPost, FORMAT_LABEL, PublicProfile } from '../../services/duels/duels.types';
import { timeAgo } from '../../shared/timeAgo';
import { Avatar } from '../../shared/ui/Avatar';
import { Icon } from '../../shared/ui/Icon';

type Props = {
  post: FeedPost;
  winner: PublicProfile | undefined;
  loser: PublicProfile | undefined;
};

export function FeedPostItem({ post, winner, loser }: Props) {
  return (
    <Card>
      <Avatar name={winner?.nick ?? '?'} photoUrl={winner?.photoUrl ?? null} size={44} />
      <Body>
        <Line numberOfLines={2}>
          <Strong>@{winner?.nick ?? '...'}</Strong> venceu <Strong>@{loser?.nick ?? '...'}</Strong>
        </Line>
        <Meta>
          {FORMAT_LABEL[post.format]} · {timeAgo(post.createdAt)}
          {winner ? ` · ${winner.cityName}` : ''}
        </Meta>
      </Body>
      <Stars>
        <Icon name="star-four-points" size={14} color={colors.gold.main} />
        <StarsText>+{post.stars}</StarsText>
      </Stars>
    </Card>
  );
}

const Card = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

const Body = styled.View`
  flex: 1;
`;

const Line = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
`;

const Strong = styled.Text`
  color: ${colors.text.primary};
  font-weight: 800;
`;

const Meta = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;

const Stars = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${colors.gold.soft};
`;

const StarsText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;
