import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ScreensTypes } from './screensTypes';
import { useAppSelector } from '../redux/store';
import { MainTabs } from './MainTabs';

// Screens
import LoginScreen from '../modules/auth/views/Login';
import SignupScreen from '../modules/auth/views/Signup';
import OnboardingScreen from '../modules/onboarding/views/Onboarding';
import EditProfileScreen from '../modules/profile/views/EditProfile';
import DuelHistoryScreen from '../modules/profile/views/DuelHistory';
import CreateChallengeScreen from '../modules/duel/views/CreateChallenge';
import ScanChallengeScreen from '../modules/duel/views/ScanChallenge';
import DuelScreen from '../modules/duel/views/Duel';

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
          <Stack.Screen name="DuelHistory" component={DuelHistoryScreen} />
          <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
          <Stack.Screen name="ScanChallenge" component={ScanChallengeScreen} />
          <Stack.Screen name="Duel" component={DuelScreen} options={{ gestureEnabled: false }} />
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
