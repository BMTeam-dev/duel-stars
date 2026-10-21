import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const Body = styled.View`
  flex: 1;
`;

export const Label = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;

export const Id = styled.Text<{ empty: boolean }>`
  color: ${({ empty }) => (empty ? colors.text.muted : colors.text.primary)};
  font-size: ${({ empty }) => (empty ? fontSize.body : fontSize.bodyLarge + 2)}px;
  font-weight: ${({ empty }) => (empty ? 400 : 800)};
  font-variant: tabular-nums;
  letter-spacing: ${({ empty }) => (empty ? 0 : 1)}px;
  margin-top: 2px;
`;

export const Copy = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  border-radius: ${radius.pill}px;
  background-color: ${colors.gold.soft};
`;

export const CopyText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;
