import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { Category, CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL } from '../../services/duels/duels.types';
import { Icon } from '../../shared/ui/Icon';

type Props = {
  value: Category;
  onChange: (category: Category) => void;
};

// Seletor da categoria "da vez": trocar aqui troca saldo, feed e desafio.
export function CategoryTabs({ value, onChange }: Props) {
  return (
    <Row>
      {CATEGORIES.map(category => {
        const active = category === value;
        return (
          <Tab
            key={category}
            active={active}
            onPress={() => onChange(category)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Icon
              name={CATEGORY_ICON[category]}
              size={16}
              color={active ? colors.gold.on : colors.text.secondary}
            />
            <TabText active={active} numberOfLines={1}>
              {CATEGORY_LABEL[category]}
            </TabText>
          </Tab>
        );
      })}
    </Row>
  );
}

const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surface};
`;

const Tab = styled.Pressable<{ active: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${spacing.xs}px;
  height: 40px;
  border-radius: ${radius.sm}px;
  background-color: ${({ active }) => (active ? colors.gold.main : 'transparent')};
`;

const TabText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.on : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;
