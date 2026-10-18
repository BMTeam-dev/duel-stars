import { MD3DarkTheme } from 'react-native-paper';
import { colors } from './colors';

// Se o app é dark por padrão (fundo escuro em toda tela), parta de um tema
// MD3 dark de verdade (`MD3DarkTheme`) em vez de passar overrides parciais
// de `theme` só em componentes individuais - o Paper calcula vários tokens
// de cor inter-relacionados (ex: o "corte" no contorno atrás do rótulo
// flutuante de um TextInput outlined) a partir do tema inteiro, não só da
// cor isolada que você vê na tela. Overrides parciais deixam esses tokens
// interdependentes inconsistentes entre si.
export const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.gold.main,
    onPrimary: colors.gold.on,
    background: colors.background,
    surface: colors.background,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    outline: colors.border,
    error: colors.feedback.negative,
  },
};
