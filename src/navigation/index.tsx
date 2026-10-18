import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ScreensTypes } from './screensTypes';
import { useAppSelector } from '../redux/store';

// Screens
import HomeScreen from '../features/home/HomeScreen';
import LoginScreen from '../features/auth/LoginScreen';
import SignupScreen from '../features/auth/SignupScreen';

const Stack = createNativeStackNavigator<ScreensTypes>();

export function Routes() {
  const user = useAppSelector(state => state.auth.user);

  // `undefined` = Firebase ainda não terminou de restaurar a sessão salva
  // (useAuthListener.ts) - espera resolver antes de montar o navigator, pra
  // decidir a tela inicial certa de primeira (sessão existente -> direto
  // pra Home; sem sessão -> Login) em vez de montar sempre em Login e ter
  // que "corrigir" depois com reset() (ficaria com cara de bug - pulava de
  // tela sozinho). Flash em branco é breve, o Firebase resolve isso quase
  // instantaneamente.
  if (user === undefined) {
    return null;
  }

  return (
    <Stack.Navigator initialRouteName={user ? 'Home' : 'Login'}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
