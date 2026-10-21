import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Card = styled.View<{ mine: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ mine }) => (mine ? colors.gold.dark : colors.border)};
  background-color: ${({ mine }) => (mine ? colors.gold.soft : colors.surface)};
`;

export const Position = styled.Text<{ mine: boolean }>`
  width: 36px;
  color: ${({ mine }) => (mine ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

export const Body = styled.View`
  flex: 1;
`;

export const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const Meta = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;

export const Stars = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${colors.gold.soft};
`;

export const StarsText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;
