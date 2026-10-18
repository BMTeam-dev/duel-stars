/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { setupGlobalErrorHandler } from './src/services/crashReporting/setupGlobalErrorHandler';

// Antes de tudo (até antes do App importar seus próprios módulos) - queremos
// capturar até um erro que aconteça durante a inicialização.
setupGlobalErrorHandler();

AppRegistry.registerComponent(appName, () => App);
