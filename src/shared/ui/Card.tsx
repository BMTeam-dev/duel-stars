import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { radius, spacing } from '../../configs/theme';

export const Card = styled.View`
  background-color: ${colors.surface};
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  padding: ${spacing.lg}px;
`;
