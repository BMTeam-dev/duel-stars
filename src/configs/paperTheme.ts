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
    primary: colors.base.secondary,
    onPrimary: colors.auxiliary.white,
    background: colors.base.darkest,
    surface: colors.base.darkest,
    onSurface: colors.auxiliary.white,
    onSurfaceVariant: colors.auxiliary.neutral,
    outline: colors.transparency.opaque,
  },
};
