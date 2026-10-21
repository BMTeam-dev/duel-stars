import * as React from 'react';
import { useState } from 'react';
import { colors } from '../../../../configs/colors';
import { Icon } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import {
  Container,
  Panel,
  PanelNick,
  LpValue,
  Steps,
  StepChip,
  StepText,
  Tools,
  Tool,
  ToolText,
} from './styles';

const STARTING_LP = 8000;
const STEPS = [-1000, -500, -100, 500];

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
  const [history, setHistory] = useState<Record<Side, number>[]>([]);

  const change = (side: Side, delta: number) => {
    setHistory(h => [...h, lp]);
    setLp(current => ({ ...current, [side]: Math.max(0, current[side] + delta) }));
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setLp(previous);
    setHistory(h => h.slice(0, -1));
  };

  const reset = () => {
    setHistory(h => [...h, lp]);
    setLp({ me: STARTING_LP, opponent: STARTING_LP });
  };

  const renderSide = (side: Side, nick: string) => (
    <Panel zero={lp[side] === 0}>
      <PanelNick numberOfLines={1}>@{nick}</PanelNick>
      <LpValue zero={lp[side] === 0}>{lp[side]}</LpValue>
      <Steps>
        {STEPS.map(step => (
          <StepChip key={step} negative={step < 0} onPress={() => change(side, step)}>
            <StepText negative={step < 0}>{step > 0 ? `+${step}` : step}</StepText>
          </StepChip>
        ))}
      </Steps>
    </Panel>
  );

  return (
    <Container>
      {renderSide('opponent', opponentNick)}
      {renderSide('me', myNick)}
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
    </Container>
  );
}
