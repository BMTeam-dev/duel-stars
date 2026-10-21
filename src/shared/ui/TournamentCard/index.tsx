import * as React from 'react';
import { colors } from '../../../configs/colors';
import { CATEGORY_ICON, CATEGORY_LABEL, FORMAT_LABEL } from '../../../services/duels/duels.types';
import {
  formatMoney,
  formatStart,
  Tournament,
  TOURNAMENT_FORMAT_LABEL,
} from '../../../services/tournaments/tournaments.types';
import { Icon } from '../Icon';
import { Badge, BadgeText, Badges, Card, Footer, Meta, Name, Slots, SlotsText, Top } from './styles';

type Props = {
  tournament: Tournament;
  onPress: () => void;
  // Na faixa do Feed os cards têm largura fixa e rolam pro lado.
  width?: number;
};

export function TournamentCard({ tournament: t, onPress, width }: Props) {
  const full = t.playerCount >= t.maxPlayers;
  return (
    <Card onPress={onPress} width={width}>
      <Top>
        <Icon name={CATEGORY_ICON[t.category]} size={16} color={colors.text.secondary} />
        <Meta numberOfLines={1}>
          {CATEGORY_LABEL[t.category]} · {TOURNAMENT_FORMAT_LABEL[t.format]} · {FORMAT_LABEL[t.matchFormat]}
        </Meta>
        {t.visibility === 'private' && <Icon name="lock" size={16} color={colors.text.muted} />}
      </Top>
      <Name numberOfLines={1}>{t.name}</Name>
      <Meta>{formatStart(t.startsAt)}</Meta>
      <Footer>
        <Slots full={full}>
          <Icon name="account-group" size={14} color={full ? colors.feedback.negative : colors.text.secondary} />
          <SlotsText full={full}>
            {t.playerCount}/{t.maxPlayers}
          </SlotsText>
        </Slots>
        <Badges>
          {!!t.entryFeeCents && (
            <Badge>
              <BadgeText>{formatMoney(t.entryFeeCents)}</BadgeText>
            </Badge>
          )}
          {t.starsEntry > 0 && (
            <Badge gold>
              <Icon name="star-four-points" size={12} color={colors.gold.main} />
              <BadgeText gold>{t.starsEntry}</BadgeText>
            </Badge>
          )}
          {t.status === 'cancelled' && (
            <Badge>
              <BadgeText>Cancelado</BadgeText>
            </Badge>
          )}
        </Badges>
      </Footer>
    </Card>
  );
}
