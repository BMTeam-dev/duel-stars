import * as React from 'react';
import { useEffect, useRef } from 'react';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { Routes } from './navigation';
import { store, persistor } from './redux/store';
import { useAuthListener } from './services/auth/useAuthListener';
import { paperTheme } from './configs/paperTheme';
import { analyticsService } from './services/analytics/analytics.service';
import { ScreensTypes } from './navigation/screensTypes';

function AuthListener() {
  useAuthListener();
  return null;
}

export default function App() {
  // Tipado com ScreensTypes explicitamente (o mesmo usado em
  // createNativeStackNavigator em navigation/index.tsx) - sem isso,
  // getCurrentRoute() infere um tipo genérico que quebra em `.name`.
  const navigationRef = useNavigationContainerRef<ScreensTypes>();
  const routeNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    analyticsService.logAppOpened();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                routeNameRef.current = navigationRef.getCurrentRoute()?.name;
                // Splash nativa (gerada por react-native-bootsplash) fica
                // visível até chamarmos hide() explicitamente - aqui é o
                // primeiro momento em que sabemos pra qual tela ir (Login
                // vs Home, ver navigation/index.tsx), então é quando some,
                // com um fade suave em vez de corte seco.
                BootSplash.hide({ fade: true });
              }}
              onStateChange={() => {
                // Firebase Analytics não rastreia telas sozinho com React
                // Navigation (diferente de apps nativos puros) - precisa
                // disparar "screen_view" manualmente a cada troca de rota.
                const previousRouteName = routeNameRef.current;
                const currentRouteName = navigationRef.getCurrentRoute()?.name;
                if (currentRouteName && previousRouteName !== currentRouteName) {
                  analyticsService.logScreenView(currentRouteName);
                }
                routeNameRef.current = currentRouteName;
              }}
            >
              <PaperProvider theme={paperTheme}>
                <AuthListener />
                <Routes />
              </PaperProvider>
            </NavigationContainer>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
