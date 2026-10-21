import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Card = styled.Pressable`
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
  margin-bottom: ${spacing.md}px;
`;

export const Top = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  margin-bottom: ${spacing.md}px;
`;

export const LevelBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 2px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${colors.gold.main};
`;

export const LevelBadgeText = styled.Text`
  color: ${colors.gold.on};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

export const Title = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const Track = styled.View`
  height: 8px;
  border-radius: 4px;
  background-color: ${colors.surfaceRaised};
  overflow: hidden;
`;

export const Fill = styled.View<{ ratio: number }>`
  width: ${({ ratio }) => Math.max(0, Math.min(1, ratio)) * 100}%;
  height: 100%;
  border-radius: 4px;
  background-color: ${colors.gold.main};
`;

export const Caption = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  margin-top: ${spacing.sm}px;
`;
