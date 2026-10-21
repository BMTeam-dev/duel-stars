import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

export const Bar = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-top-width: 1px;
  border-top-color: ${colors.gold.dark};
  background-color: ${colors.surface};
`;

export const Position = styled.Text`
  min-width: 44px;
  color: ${colors.gold.main};
  font-size: ${fontSize.title}px;
  font-weight: 900;
`;

export const Label = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;

export const Right = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

export const StarsText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;
