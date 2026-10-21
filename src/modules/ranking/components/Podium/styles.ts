import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Row = styled.View`
  flex-direction: row;
  align-items: flex-end;
  gap: ${spacing.sm}px;
  padding: ${spacing.lg}px ${spacing.lg}px ${spacing.xl}px;
`;

export const Column = styled.View`
  flex: 1;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const Nick = styled.Text<{ mine: boolean }>`
  color: ${({ mine }) => (mine ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.body}px;
  font-weight: 800;
  margin-top: ${spacing.xs}px;
`;

export const Stars = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

export const StarsText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;

export const Base = styled.View<{ height: number; color: string }>`
  align-self: stretch;
  height: ${({ height }) => height}px;
  align-items: center;
  justify-content: center;
  margin-top: ${spacing.xs}px;
  border-top-left-radius: ${radius.md}px;
  border-top-right-radius: ${radius.md}px;
  border-top-width: 3px;
  border-color: ${({ color }) => color};
  background-color: ${colors.surfaceRaised};
`;

export const BaseText = styled.Text<{ color: string }>`
  color: ${({ color }) => color};
  font-size: ${fontSize.title}px;
  font-weight: 900;
`;
