import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { CHALLENGE_BUTTON_AREA, fontSize, radius, spacing } from '../../configs/theme';

export const Container = styled.View`
  flex: 1;
  background-color: ${colors.background};
`;

export const Header = styled.View`
  padding: ${spacing.lg}px ${spacing.lg}px ${spacing.md}px;
`;

export const ScopeRow = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

export const ScopeChip = styled.Pressable<{ active: boolean }>`
  padding: ${spacing.sm}px ${spacing.lg}px;
  border-radius: ${radius.pill}px;
  border-width: 1px;
  border-color: ${({ active }) => (active ? colors.gold.main : colors.border)};
  background-color: ${({ active }) => (active ? colors.gold.soft : 'transparent')};
`;

export const ScopeChipText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;

// Fixo acima da tab bar, por cima da lista - continua visível mesmo
// rolando o feed (decisão de produto: desafiar a no máximo 2 toques).
export const ChallengeButtonArea = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${CHALLENGE_BUTTON_AREA}px;
  justify-content: center;
  padding: 0 ${spacing.lg}px;
  background-color: ${colors.background};
  border-top-width: 1px;
  border-top-color: ${colors.border};
`;

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
