import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';

export const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surface};
`;

export const Tab = styled.Pressable<{ active: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${spacing.xs}px;
  height: 40px;
  border-radius: ${radius.sm}px;
  background-color: ${({ active }) => (active ? colors.gold.main : 'transparent')};
`;

export const TabText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.on : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;
