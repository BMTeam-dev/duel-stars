import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';

export const Row = styled.View`
  flex-direction: row;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

export const Tab = styled.Pressable<{ active: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.md}px ${spacing.xs}px;
  border-bottom-width: 2px;
  border-bottom-color: ${({ active }) => (active ? colors.gold.main : 'transparent')};
  margin-bottom: -1px;
`;

export const TabText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const Badge = styled.View<{ active: boolean }>`
  min-width: 20px;
  padding: 0 ${spacing.xs}px;
  border-radius: ${radius.pill}px;
  align-items: center;
  background-color: ${({ active }) => (active ? colors.gold.soft : colors.surfaceRaised)};
`;

export const BadgeText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;
