import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Card = styled.View`
  align-self: stretch;
  margin-top: ${spacing.xl}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  margin-bottom: ${spacing.sm}px;
`;

export const HeaderText = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const Private = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
`;
