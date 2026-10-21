import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { Icon } from '../../../../shared/ui/Icon';
import { Bar, Label, Position, Right, StarsText } from './styles';

type Props = {
  position: number | null;
  ranked: boolean;
  stars: number;
  scopeLabel: string;
  categoryLabel: string;
};

// Fixa embaixo da lista: a pessoa sempre sabe onde está, mesmo fora do top.
export function MyPositionBar({ position, ranked, stars, scopeLabel, categoryLabel }: Props) {
  if (!ranked) {
    return (
      <Bar>
        <Icon name="trophy-outline" size={24} color={colors.gold.main} />
        <Label numberOfLines={2}>Jogue seu primeiro duelo de {categoryLabel} para entrar no ranking.</Label>
      </Bar>
    );
  }
  return (
    <Bar>
      <Position>{position ? `${position}º` : '–'}</Position>
      <Label numberOfLines={1}>Sua posição · {scopeLabel}</Label>
      <Right>
        <Icon name="star-four-points" size={16} color={colors.gold.main} />
        <StarsText>{stars}</StarsText>
      </Right>
    </Bar>
  );
}
