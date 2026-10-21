import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, spacing } from '../../../configs/theme';

export const Overlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  elevation: 1000;
  justify-content: center;
  padding: ${spacing.xl}px;
  background-color: ${colors.background};
`;

export const Content = styled.View`
  align-items: stretch;
  gap: ${spacing.lg}px;
`;

export const IconCircle = styled.View`
  align-self: center;
  width: 104px;
  height: 104px;
  border-radius: 52px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.gold.soft};
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
  text-align: center;
`;

export const Message = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
  line-height: 22px;
  text-align: center;
  margin-bottom: ${spacing.md}px;
`;
