/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { setupGlobalErrorHandler } from './src/services/crashReporting/setupGlobalErrorHandler';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Antes de tudo (até antes do App importar seus próprios módulos) - queremos
// capturar até um erro que aconteça durante a inicialização.
setupGlobalErrorHandler();

// As notificações do backend já são exibidas pelo sistema com o app fechado;
// o handler só precisa existir (sem ele o Firebase avisa no log a cada push).
setBackgroundMessageHandler(getMessaging(), async () => {});

AppRegistry.registerComponent(appName, () => App);
