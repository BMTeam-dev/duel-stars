import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Banner = styled.Pressable<{ urgent: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  margin: 0 ${spacing.lg}px ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ urgent }) => (urgent ? colors.gold.main : colors.gold.dark)};
  background-color: ${colors.gold.soft};
`;

export const Texts = styled.View`
  flex: 1;
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

export const Subtitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;
