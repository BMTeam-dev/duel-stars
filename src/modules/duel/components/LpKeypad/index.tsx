import * as React from 'react';
import { forwardRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Icon } from '../../../../shared/ui/Icon';
import {
  Action,
  ActionHint,
  ActionText,
  Actions,
  Amount,
  AmountRow,
  Backspace,
  Current,
  Key,
  KeyText,
  Keys,
} from './styles';

type Props = {
  nick: string;
  current: number;
  // Novo LP e o rótulo da mudança ("−1900", "+500", "metade").
  onApply: (lp: number, label: string) => void;
};

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '000'];
const MAX_DIGITS = 5;

// Dano e ganho de LP no Yu-Gi-Oh vêm em qualquer valor (1900, 2450...):
// teclado numérico em vez de botões fixos, como as calculadoras de mesa.
export const LpKeypad = forwardRef<BottomSheetModal, Props>(({ nick, current, onApply }, ref) => {
  const [digits, setDigits] = useState('');
  const amount = Number(digits || 0);

  const press = (key: string) =>
    setDigits(d => (d === '' && key.startsWith('0') ? d : (d + key).slice(0, MAX_DIGITS)));

  const apply = (lp: number, label: string) => {
    onApply(lp, label);
    setDigits('');
    if (ref && 'current' in ref) ref.current?.dismiss();
  };

  const damaged = Math.max(0, current - amount);
  const healed = current + amount;

  return (
    <AppSheet ref={ref} title={`LP de @${nick}`} onDismiss={() => setDigits('')}>
      <Current>Agora: {current}</Current>
      <AmountRow>
        <Amount empty={amount === 0}>{amount === 0 ? '0' : amount}</Amount>
        <Backspace onPress={() => setDigits(d => d.slice(0, -1))} onLongPress={() => setDigits('')} hitSlop={8}>
          <Icon name="backspace-outline" size={28} color={colors.text.secondary} />
        </Backspace>
      </AmountRow>

      <Keys>
        {KEYS.map(key => (
          <Key key={key} onPress={() => press(key)}>
            <KeyText>{key}</KeyText>
          </Key>
        ))}
      </Keys>

      <Actions>
        <Action tone="neutral" onPress={() => apply(Math.ceil(current / 2), 'metade')}>
          <ActionText tone="neutral">÷2</ActionText>
          <ActionHint>{Math.ceil(current / 2)}</ActionHint>
        </Action>
        <Action tone="negative" disabled={amount === 0} onPress={() => apply(damaged, `−${amount}`)}>
          <ActionText tone="negative">− Dano</ActionText>
          <ActionHint>{amount ? `→ ${damaged}` : ' '}</ActionHint>
        </Action>
        <Action tone="positive" disabled={amount === 0} onPress={() => apply(healed, `+${amount}`)}>
          <ActionText tone="positive">+ Ganho</ActionText>
          <ActionHint>{amount ? `→ ${healed}` : ' '}</ActionHint>
        </Action>
      </Actions>
    </AppSheet>
  );
});
