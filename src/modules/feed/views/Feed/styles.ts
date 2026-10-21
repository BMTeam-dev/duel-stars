import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { CHALLENGE_BUTTON_AREA, fontSize, radius, spacing } from '../../../../configs/theme';

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
  margin-top: ${spacing.md}px;
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
