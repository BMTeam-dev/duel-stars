import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const OptionsList = styled.View`
  gap: ${spacing.md}px;
`;

export const OptionCard = styled.Pressable`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surfaceRaised};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const OptionIcon = styled.View`
  width: 48px;
  height: 48px;
  border-radius: ${radius.md}px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.gold.soft};
  margin-right: ${spacing.md}px;
`;

export const OptionTexts = styled.View`
  flex: 1;
`;

export const OptionTitle = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const OptionSubtitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  margin-top: 2px;
`;
