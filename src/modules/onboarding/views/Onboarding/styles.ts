import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.md}px ${spacing.lg}px;
  gap: ${spacing.md}px;
`;

export const BackButton = styled.Pressable`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

export const ProgressTrack = styled.View`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background-color: ${colors.surfaceRaised};
  overflow: hidden;
  margin-right: 32px;
`;

export const ProgressFill = styled.View<{ progress: number }>`
  width: ${({ progress }) => Math.round(progress * 100)}%;
  height: 100%;
  border-radius: 3px;
  background-color: ${colors.gold.main};
`;

export const Body = styled.View`
  flex: 1;
  padding: ${spacing.xl}px ${spacing.xl}px 0;
`;

export const StepTitle = styled.Text<{ center?: boolean }>`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
  margin-bottom: ${spacing.sm}px;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
`;

export const StepSubtitle = styled.Text<{ center?: boolean }>`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
  line-height: 22px;
  margin-bottom: ${spacing.xl}px;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
`;

export const PhotoPreview = styled.View`
  align-items: center;
  margin-bottom: ${spacing.xl}px;
`;

export const ChoiceCard = styled.Pressable<{ selected: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ selected }) => (selected ? colors.gold.main : colors.border)};
  background-color: ${({ selected }) => (selected ? colors.gold.soft : colors.surface)};
  margin-bottom: ${spacing.md}px;
`;

export const ChoiceText = styled.Text<{ selected: boolean }>`
  flex: 1;
  color: ${({ selected }) => (selected ? colors.text.primary : colors.text.secondary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 600;
`;

export const StarCircle = styled.View`
  width: 112px;
  height: 112px;
  border-radius: 56px;
  align-self: center;
  align-items: center;
  justify-content: center;
  background-color: ${colors.gold.soft};
  margin: ${spacing.xxl}px 0 ${spacing.xl}px;
`;

export const StarsNumber = styled.Text`
  color: ${colors.gold.main};
  font-size: 40px;
  font-weight: 900;
  text-align: center;
  margin-bottom: ${spacing.lg}px;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;
