import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

// Fora da tela, mas desenhada: a captura lê a view, não os pixels da tela.
export const Offscreen = styled.View`
  position: absolute;
  top: 0;
  left: -10000px;
`;

export const Body = styled.View`
  gap: ${spacing.md}px;
`;

export const Hint = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;
