import * as React from 'react';
import { forwardRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';
import { LEVEL_TITLES, XP_PER_LOSS, XP_PER_WIN } from '../../../services/profile/level';
import { AppSheet } from '../../../shared/ui/AppSheet';
import { Icon } from '../../../shared/ui/Icon';

type Props = {
  currentLevel: number;
};

export const LevelInfoSheet = forwardRef<BottomSheetModal, Props>(({ currentLevel }, ref) => (
  <AppSheet ref={ref} title="Como funcionam os níveis">
    <Text>
      Cada duelo dá experiência (XP): <Strong>{XP_PER_WIN} XP por vitória</Strong> e{' '}
      <Strong>{XP_PER_LOSS} XP por derrota</Strong>. O nível só sobe, nunca cai, e não tem limite.
    </Text>
    <Text>Estrelas são outra coisa: são o que você aposta e o que define o ranking.</Text>
    <List>
      {LEVEL_TITLES.map((item, index) => {
        const next = LEVEL_TITLES[index + 1];
        const range = next ? `Nível ${item.minLevel} a ${next.minLevel - 1}` : `Nível ${item.minLevel}+`;
        const current =
          currentLevel >= item.minLevel && (!next || currentLevel < next.minLevel);
        return (
          <Row key={item.title} current={current}>
            <Icon
              name={next ? 'star' : 'crown'}
              size={20}
              color={current ? colors.gold.main : colors.text.muted}
            />
            <RowTitle current={current}>{item.title}</RowTitle>
            <RowRange>{range}</RowRange>
          </Row>
        );
      })}
    </List>
  </AppSheet>
));

const Text = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
  margin-bottom: ${spacing.md}px;
`;

const Strong = styled.Text`
  color: ${colors.text.primary};
  font-weight: 700;
`;

const List = styled.View`
  gap: ${spacing.xs}px;
  margin-top: ${spacing.sm}px;
`;

const Row = styled.View<{ current: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ current }) => (current ? colors.gold.soft : 'transparent')};
`;

const RowTitle = styled.Text<{ current: boolean }>`
  flex: 1;
  color: ${({ current }) => (current ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

const RowRange = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;
