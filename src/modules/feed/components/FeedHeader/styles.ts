import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Container = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

export const Info = styled.View`
  flex: 1;
`;

export const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

export const LevelRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  margin-top: ${spacing.xs}px;
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

export const LevelTitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const StarsPill = styled.View`
  align-items: center;
  padding: ${spacing.xs}px ${spacing.md}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
`;

export const StarsRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const StarsCategory = styled.Text`
  color: ${colors.gold.main};
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
`;

export const StarsValue = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.title}px;
  font-weight: 900;
`;
