// Paleta placeholder (não é identidade visual definitiva) - troque pelas
// cores da sua marca. A estrutura (base/auxiliary/transparency) é o que
// vale reaproveitar: cores "base" pra fundo/superfícies, "auxiliary" pra
// feedback semântico (erro, sucesso, aviso), "transparency" pra overlays
// derivados de uma única cor (evita cores soltas inconsistentes entre si).
export const colors = {
  base: {
    primary: '#3B4B5C',
    secondary: '#6B7B8C',
    tertiary: '#1B2530',
    darkest: '#0F151C',
  },
  auxiliary: {
    neutral: '#869AB2',
    positive: '#4BD070',
    warning: '#FCD753',
    negative: '#FF8578',
    negativeIntense: '#AC392E',
    white: '#F5F5F5',
    black: '#000000',
    alternativeBlack: '#2E2E2E',
  },
  transparency: {
    invisible: 'rgba(59, 75, 92, 0.04)',
    semiTransparent: 'rgba(59, 75, 92, 0.16)',
    opaque: 'rgba(59, 75, 92, 0.4)',
  },
};
