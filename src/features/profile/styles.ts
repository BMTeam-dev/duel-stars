import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';

export const TopBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.lg}px;
`;

export const TopTitle = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
`;

export const EditButton = styled.Pressable`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceRaised};
`;

export const Identity = styled.View`
  align-items: center;
  margin-bottom: ${spacing.xl}px;
`;

export const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title}px;
  font-weight: 800;
  margin-top: ${spacing.md}px;
`;

export const LevelText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: ${spacing.xs}px;
`;

export const CityRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  margin-top: ${spacing.xs}px;
`;

export const CityText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const StarsCard = styled.View`
  align-items: center;
  padding: ${spacing.xl}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
  margin-bottom: ${spacing.md}px;
`;

export const StarsRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
`;

export const StarsNumber = styled.Text`
  color: ${colors.gold.main};
  font-size: 56px;
  font-weight: 900;
`;

export const StarsLabel = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

export const StarsCaption = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
  margin-top: ${spacing.sm}px;
`;

export const StatsRow = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
  margin-bottom: ${spacing.xl}px;
`;

export const StatTile = styled.View`
  flex: 1;
  align-items: center;
  padding: ${spacing.lg}px ${spacing.sm}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const StatValue = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
`;

export const StatLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;

export const SectionTitle = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
  margin-bottom: ${spacing.sm}px;
`;

export const SectionEmpty = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.body}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-style: dashed;
  border-color: ${colors.border};
  text-align: center;
  margin-bottom: ${spacing.xl}px;
`;
