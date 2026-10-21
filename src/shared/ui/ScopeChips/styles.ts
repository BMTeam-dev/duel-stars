import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';

export const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
  margin-top: ${spacing.md}px;
`;

export const Chip = styled.Pressable<{ active: boolean }>`
  padding: ${spacing.sm}px ${spacing.lg}px;
  border-radius: ${radius.pill}px;
  border-width: 1px;
  border-color: ${({ active }) => (active ? colors.gold.main : colors.border)};
  background-color: ${({ active }) => (active ? colors.gold.soft : 'transparent')};
`;

export const ChipText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;
