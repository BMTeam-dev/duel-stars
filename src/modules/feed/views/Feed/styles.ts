import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { CHALLENGE_BUTTON_AREA, spacing } from '../../../../configs/theme';

export const Container = styled.View`
  flex: 1;
  background-color: ${colors.background};
`;

export const Header = styled.View`
  padding: ${spacing.lg}px ${spacing.lg}px ${spacing.md}px;
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
