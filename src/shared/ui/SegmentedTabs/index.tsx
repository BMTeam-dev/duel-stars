import * as React from 'react';
import { Badge, BadgeText, Row, Tab, TabText } from './styles';

type Option<T extends string> = { value: T; label: string; badge?: number };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Abas dentro de uma tela (ex.: Info / Jogadores / Rodadas do torneio).
export function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <Row>
      {options.map(option => {
        const active = option.value === value;
        return (
          <Tab
            key={option.value}
            active={active}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <TabText active={active} numberOfLines={1}>
              {option.label}
            </TabText>
            {!!option.badge && (
              <Badge active={active}>
                <BadgeText active={active}>{option.badge}</BadgeText>
              </Badge>
            )}
          </Tab>
        );
      })}
    </Row>
  );
}
