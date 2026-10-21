import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { Category, CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL } from '../../../../services/duels/duels.types';
import { Icon } from '../../../../shared/ui/Icon';
import { Row, Tab, TabText } from './styles';

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
