import * as React from 'react';
import { useState } from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { Icon } from '../../shared/ui/Icon';
import { toast } from '../../shared/ui/toast';

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

const Container = styled.View`
  gap: ${spacing.md}px;
`;

const Panel = styled.View<{ zero: boolean }>`
  align-items: center;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${({ zero }) => (zero ? colors.feedback.negative : colors.border)};
  background-color: ${colors.surface};
`;

const PanelNick = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;

const LpValue = styled.Text<{ zero: boolean }>`
  color: ${({ zero }) => (zero ? colors.feedback.negative : colors.text.primary)};
  font-size: 56px;
  font-weight: 900;
  font-variant: tabular-nums;
  margin: ${spacing.xs}px 0 ${spacing.md}px;
`;

const Steps = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

const StepChip = styled.Pressable<{ negative: boolean }>`
  min-width: 64px;
  align-items: center;
  padding: ${spacing.sm}px ${spacing.md}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ negative }) => (negative ? 'rgba(255, 107, 94, 0.12)' : 'rgba(75, 208, 122, 0.12)')};
`;

const StepText = styled.Text<{ negative: boolean }>`
  color: ${({ negative }) => (negative ? colors.feedback.negative : colors.feedback.positive)};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;

const Tools = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const Tool = styled.Pressable<{ disabled?: boolean }>`
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

const ToolText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;
