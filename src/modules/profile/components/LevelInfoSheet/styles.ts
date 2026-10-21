import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Text = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
  margin-bottom: ${spacing.md}px;
`;

export const Strong = styled.Text`
  color: ${colors.text.primary};
  font-weight: 700;
`;

export const List = styled.View`
  gap: ${spacing.xs}px;
  margin-top: ${spacing.sm}px;
`;

export const Row = styled.View<{ current: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ current }) => (current ? colors.gold.soft : 'transparent')};
`;

export const RowTitle = styled.Text<{ current: boolean }>`
  flex: 1;
  color: ${({ current }) => (current ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const RowRange = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;
