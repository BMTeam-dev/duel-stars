module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 (usado por @gorhom/bottom-sheet e sonner-native) roda
  // animações em worklets - esse plugin precisa ser o ÚLTIMO da lista.
  plugins: ['react-native-worklets/plugin'],
};
