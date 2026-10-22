import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

export const Body = styled.View`
  gap: ${spacing.md}px;
`;

export const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

export const RowItem = styled.View`
  flex: 1;
`;

export const Hint = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;
