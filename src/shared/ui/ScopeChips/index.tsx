import * as React from 'react';
import { Chip, ChipText, Row } from './styles';

export type Scope = 'city' | 'global';

type Props = {
  value: Scope;
  cityName: string | undefined;
  onChange: (scope: Scope) => void;
};

// Sempre dois chips: a cidade do jogador e "Geral" (o Brasil todo). Outras
// cidades não viram chip - os duelos delas aparecem no Geral.
export function ScopeChips({ value, cityName, onChange }: Props) {
  const options: { scope: Scope; label: string }[] = [
    { scope: 'city', label: cityName ?? 'Minha cidade' },
    { scope: 'global', label: 'Geral' },
  ];
  return (
    <Row>
      {options.map(({ scope, label }) => (
        <Chip
          key={scope}
          active={value === scope}
          onPress={() => onChange(scope)}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === scope }}
        >
          <ChipText active={value === scope}>{label}</ChipText>
        </Chip>
      ))}
    </Row>
  );
}
