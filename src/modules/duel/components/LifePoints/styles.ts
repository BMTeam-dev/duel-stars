import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Container = styled.View`
  gap: ${spacing.md}px;
`;

export const Panel = styled.Pressable<{ zero: boolean }>`
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
  margin: ${spacing.xs}px 0 ${spacing.sm}px;
`;

export const PanelHint = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const PanelHintText = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
`;

export const LastChange = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
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
