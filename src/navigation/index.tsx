import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ScreensTypes } from './screensTypes';
import { useAppSelector } from '../redux/store';
import { MainTabs } from './MainTabs';

// Screens
import LoginScreen from '../features/auth/LoginScreen';
import SignupScreen from '../features/auth/SignupScreen';

const Stack = createNativeStackNavigator<ScreensTypes>();

export function Routes() {
  const user = useAppSelector(state => state.auth.user);

  // `undefined` = Firebase ainda não terminou de restaurar a sessão salva
  // (useAuthListener.ts) - espera resolver antes de montar o navigator, pra
  // abrir direto na tela certa em vez de piscar no Login.
  if (user === undefined) {
    return null;
  }

  // Telas de login e do app em grupos separados, escolhidos pelo estado de
  // auth: ao logar ou sair, o React Navigation troca de grupo sozinho -
  // ninguém precisa chamar reset(), e não dá pra "voltar" pro Login logado.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
