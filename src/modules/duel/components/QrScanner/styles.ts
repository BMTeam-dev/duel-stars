import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

export const NoCamera = styled.Text`
  position: absolute;
  top: ${spacing.xl}px;
  left: ${spacing.xl}px;
  right: ${spacing.xl}px;
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
`;
