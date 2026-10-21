import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Container = styled.View`
  gap: ${spacing.md}px;
`;

export const Panel = styled.View<{ zero: boolean }>`
  align-items: center;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${({ zero }) => (zero ? colors.feedback.negative : colors.border)};
  background-color: ${colors.surface};
`;

export const PanelNick = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;

export const LpValue = styled.Text<{ zero: boolean }>`
  color: ${({ zero }) => (zero ? colors.feedback.negative : colors.text.primary)};
  font-size: 56px;
  font-weight: 900;
  font-variant: tabular-nums;
  margin: ${spacing.xs}px 0 ${spacing.md}px;
`;

export const Steps = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

export const StepChip = styled.Pressable<{ negative: boolean }>`
  min-width: 64px;
  align-items: center;
  padding: ${spacing.sm}px ${spacing.md}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ negative }) => (negative ? 'rgba(255, 107, 94, 0.12)' : 'rgba(75, 208, 122, 0.12)')};
`;

export const StepText = styled.Text<{ negative: boolean }>`
  color: ${({ negative }) => (negative ? colors.feedback.negative : colors.feedback.positive)};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;

export const Tools = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

export const Tool = styled.Pressable<{ disabled?: boolean }>`
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const ToolText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;
