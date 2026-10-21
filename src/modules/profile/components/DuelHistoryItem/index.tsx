import * as React from 'react';
import { colors } from '../../../../configs/colors';
import {
  CATEGORY_LABEL,
  Duel,
  DuelStatus,
  FORMAT_LABEL,
  PublicProfile,
} from '../../../../services/duels/duels.types';
import { timeAgo } from '../../../../shared/timeAgo';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon } from '../../../../shared/ui/Icon';
import { Body, Card, Meta, NoteRow, NoteText, Result, ResultText, Stars, StarsText, Title } from './styles';

type Props = {
  duel: Duel;
  myUid: string;
  opponent: PublicProfile | undefined;
  // Anotação privada do jogador sobre esse duelo (deck etc.), se tiver.
  note?: string;
  onPress: () => void;
};

export type Outcome = 'won' | 'lost' | 'open' | 'cancelled';

const OPEN: DuelStatus[] = ['active', 'awaiting', 'disputed'];

function outcomeOf(duel: Duel, myUid: string): Outcome {
  if (duel.status === 'cancelled') return 'cancelled';
  if (OPEN.includes(duel.status)) return 'open';
  return duel.winnerUid === myUid ? 'won' : 'lost';
}

const RESULT_LABEL: Record<Outcome, string> = { won: 'V', lost: 'D', open: '…', cancelled: '–' };

export function DuelHistoryItem({ duel, myUid, opponent, note, onPress }: Props) {
  const outcome = outcomeOf(duel, myUid);
  const status =
    outcome === 'open'
      ? duel.status === 'disputed'
        ? 'Em disputa'
        : 'Em andamento'
      : outcome === 'cancelled'
      ? 'Cancelado'
      : null;
  return (
    <Card onPress={onPress}>
      <Result outcome={outcome}>
        <ResultText outcome={outcome}>{RESULT_LABEL[outcome]}</ResultText>
      </Result>
      <Avatar name={opponent?.nick ?? '?'} photoUrl={opponent?.photoUrl ?? null} size={40} />
      <Body>
        <Title numberOfLines={1}>vs @{opponent?.nick ?? '...'}</Title>
        <Meta numberOfLines={1}>
          {CATEGORY_LABEL[duel.category]} · {FORMAT_LABEL[duel.format]}
          {status ? ` · ${status}` : duel.createdAt ? ` · ${timeAgo(duel.createdAt)}` : ''}
        </Meta>
        {!!note && (
          <NoteRow>
            <Icon name="note-text-outline" size={12} color={colors.text.secondary} />
            <NoteText numberOfLines={2}>{note}</NoteText>
          </NoteRow>
        )}
      </Body>
      <Stars outcome={outcome}>
        <Icon
          name="star-four-points"
          size={14}
          color={outcome === 'lost' ? colors.feedback.negative : outcome === 'won' ? colors.gold.main : colors.text.muted}
        />
        <StarsText outcome={outcome}>
          {outcome === 'won' ? '+' : outcome === 'lost' ? '−' : ''}
          {duel.stake}
        </StarsText>
      </Stars>
    </Card>
  );
}
