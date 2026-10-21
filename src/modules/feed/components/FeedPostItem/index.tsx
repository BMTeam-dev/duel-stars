import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { FeedPost, FORMAT_LABEL, PublicProfile } from '../../../../services/duels/duels.types';
import { timeAgo } from '../../../../shared/timeAgo';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon } from '../../../../shared/ui/Icon';
import { Card, Body, Line, Strong, Meta, Stars, StarsText } from './styles';

type Props = {
  post: FeedPost;
  myUid: string;
  winner: PublicProfile | undefined;
  loser: PublicProfile | undefined;
};

export function FeedPostItem({ post, myUid, winner, loser }: Props) {
  // No post em que eu perdi, mostra o que EU perdi (−N, vermelho); nos
  // outros, o que o vencedor ganhou.
  const lost = post.loserUid === myUid;
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
      <Stars lost={lost}>
        <Icon name="star-four-points" size={14} color={lost ? colors.feedback.negative : colors.gold.main} />
        <StarsText lost={lost}>
          {lost ? '−' : '+'}
          {post.stars}
        </StarsText>
      </Stars>
    </Card>
  );
}
