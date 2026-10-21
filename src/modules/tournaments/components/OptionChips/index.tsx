import * as React from 'react';
import { Chip, ChipText, Row } from './styles';

type Option<T> = { value: T; label: string };

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Escolha única entre poucas opções, em chips que quebram linha.
export function OptionChips<T extends string | number | boolean | null>({ options, value, onChange }: Props<T>) {
  return (
    <Row>
      {options.map(option => {
        const active = option.value === value;
        return (
          <Chip
            key={String(option.value)}
            active={active}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <ChipText active={active}>{option.label}</ChipText>
          </Chip>
        );
      })}
    </Row>
  );
}
