import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Container = styled.View`
  flex: 1;
`;

export const SectionLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: ${spacing.sm}px;
`;

export const Chip = styled.Pressable<{ active: boolean }>`
  min-width: 52px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 ${spacing.md}px;
  /* Metade da altura, e não radius.pill: no Android, um raio maior que a
     metade do lado com borda desenha o chip cortado em cima e embaixo. */
  border-radius: 20px;
  border-width: 1px;
  border-color: ${({ active }) => (active ? colors.gold.main : colors.border)};
  background-color: ${({ active }) => (active ? colors.gold.soft : 'transparent')};
`;

export const ChipText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.main : colors.text.secondary)};
  font-weight: 700;
`;

export const Spacer = styled.View`
  height: ${spacing.lg}px;
`;

export const CityRow = styled.Pressable<{ selected: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.md}px ${spacing.md}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ selected }) => (selected ? colors.gold.soft : 'transparent')};
`;

export const CityName = styled.Text<{ selected: boolean }>`
  color: ${({ selected }) => (selected ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: ${({ selected }) => (selected ? 700 : 400)};
`;

export const Retry = styled.View`
  gap: ${spacing.md}px;
  margin-top: ${spacing.lg}px;
`;

export const Message = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
  margin-top: ${spacing.lg}px;
`;
