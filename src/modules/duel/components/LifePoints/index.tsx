import * as React from 'react';
import { useRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { Icon } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import {
  Container,
  Panel,
  PanelNick,
  LpValue,
  LastChange,
  PanelHint,
  PanelHintText,
  Tools,
  Tool,
  ToolText,
} from './styles';
import { LpKeypad } from '../LpKeypad';

const STARTING_LP = 8000;

type Props = {
  myNick: string;
  opponentNick: string;
};

type Side = 'me' | 'opponent';

// Contador de mesa, só local (não sincroniza entre os celulares): cada um
// usa o seu, como já fazem com app de calculadora de LP hoje. O resultado
// que vale é o que os dois informam no fim.
export function LifePoints({ myNick, opponentNick }: Props) {
  const [lp, setLp] = useState<Record<Side, number>>({ me: STARTING_LP, opponent: STARTING_LP });
  const [history, setHistory] = useState<{ lp: Record<Side, number>; last: string | null }[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const [editing, setEditing] = useState<Side>('opponent');
  const keypadRef = useRef<BottomSheetModal>(null);
  const nicks: Record<Side, string> = { me: myNick, opponent: opponentNick };

  const open = (side: Side) => {
    setEditing(side);
    keypadRef.current?.present();
  };

  const apply = (value: number, label: string) => {
    setHistory(h => [...h, { lp, last }]);
    setLp(current => ({ ...current, [editing]: value }));
    setLast(`@${nicks[editing]} ${label} → ${value}`);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setLp(previous.lp);
    setLast(previous.last);
    setHistory(h => h.slice(0, -1));
  };

  const reset = () => {
    setHistory(h => [...h, { lp, last }]);
    setLp({ me: STARTING_LP, opponent: STARTING_LP });
    setLast(null);
  };

  const renderSide = (side: Side) => (
    <Panel zero={lp[side] === 0} onPress={() => open(side)} accessibilityLabel={`Alterar LP de ${nicks[side]}`}>
      <PanelNick numberOfLines={1}>@{nicks[side]}</PanelNick>
      <LpValue zero={lp[side] === 0}>{lp[side]}</LpValue>
      <PanelHint>
        <Icon name="calculator-variant-outline" size={14} color={colors.text.muted} />
        <PanelHintText>Toque para alterar</PanelHintText>
      </PanelHint>
    </Panel>
  );

  return (
    <Container>
      {renderSide('opponent')}
      {renderSide('me')}
      {!!last && <LastChange numberOfLines={1}>Última: {last}</LastChange>}
      <Tools>
        <Tool onPress={undo} disabled={history.length === 0}>
          <Icon name="undo" size={20} color={colors.text.secondary} />
          <ToolText>Desfazer</ToolText>
        </Tool>
        <Tool onPress={reset}>
          <Icon name="restart" size={20} color={colors.text.secondary} />
          <ToolText>Nova partida</ToolText>
        </Tool>
        <Tool onPress={() => toast(Math.random() < 0.5 ? 'Moeda: Cara' : 'Moeda: Coroa')}>
          <Icon name="circle-multiple" size={20} color={colors.text.secondary} />
          <ToolText>Moeda</ToolText>
        </Tool>
        <Tool onPress={() => toast(`Dado: ${1 + Math.floor(Math.random() * 6)}`)}>
          <Icon name="dice-5" size={20} color={colors.text.secondary} />
          <ToolText>Dado</ToolText>
        </Tool>
      </Tools>
      <LpKeypad ref={keypadRef} nick={nicks[editing]} current={lp[editing]} onApply={apply} />
    </Container>
  );
}
