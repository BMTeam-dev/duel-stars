import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ScreensTypes } from './screensTypes';
import { useAppSelector } from '../redux/store';
import { MainTabs } from './MainTabs';

// Screens
import LoginScreen from '../features/auth/LoginScreen';
import SignupScreen from '../features/auth/SignupScreen';
import OnboardingScreen from '../features/onboarding/OnboardingScreen';
import EditProfileScreen from '../features/profile/EditProfileScreen';

const Stack = createNativeStackNavigator<ScreensTypes>();

export function Routes() {
  const user = useAppSelector(state => state.auth.user);
  const profile = useAppSelector(state => state.profile.profile);

  // `undefined` = Firebase ainda não terminou de restaurar a sessão salva
  // (useAuthListener.ts) - espera resolver antes de montar o navigator, pra
  // abrir direto na tela certa em vez de piscar no Login.
  // Mesmo raciocínio pro perfil: logado, espera o Firestore dizer se o
  // perfil existe antes de decidir entre cadastro e app.
  if (user === undefined || (user && profile === undefined)) {
    return null;
  }

  // Três grupos de telas, escolhidos pelo estado: sem login -> Login;
  // logado sem perfil -> cadastro; com perfil -> app. Ao mudar o estado, o
  // React Navigation troca de grupo sozinho - ninguém chama reset(), e não
  // dá pra "voltar" pro Login ou pro cadastro depois de concluído.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && profile ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </>
      ) : user ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
