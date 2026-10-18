// Identidade do Duel Stars: tema escuro como padrão (clima de mesa de card
// game) e dourado como cor de destaque - dourado = estrelas, então é
// reservado pro que é ação principal ou valor em jogo; não use em
// decoração, senão perde o peso.
export const colors = {
  background: '#0E0F14',
  surface: '#171922',
  surfaceRaised: '#20232F',
  border: '#2C3040',

  text: {
    primary: '#F4F1E8',
    secondary: '#A3A7B7',
    muted: '#6B7084',
  },

  gold: {
    main: '#E8B931',
    dark: '#B88A12',
    // Texto/ícone em cima de um fundo dourado - branco some no dourado.
    on: '#1A1405',
    soft: 'rgba(232, 185, 49, 0.14)',
  },

  feedback: {
    positive: '#4BD07A',
    negative: '#FF6B5E',
    warning: '#FCD753',
  },

  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#FFFFFF',
};
