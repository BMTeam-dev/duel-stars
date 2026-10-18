import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  requestPermission,
} from '@react-native-firebase/messaging';
import { crashReportingService } from '../crashReporting/crashReporting.service';

const messaging = getMessaging();

// Pede permissão e devolve o token FCM (null se a pessoa negou ou se o
// aparelho não conseguiu gerar token). No Android 13+ a permissão é a
// POST_NOTIFICATIONS do sistema; no iOS é o pedido do próprio Firebase.
export async function enableNotifications(): Promise<{ granted: boolean; token: string | null }> {
  let granted: boolean;
  if (Platform.OS === 'android') {
    granted =
      Platform.Version < 33 ||
      (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) ===
        PermissionsAndroid.RESULTS.GRANTED;
  } else {
    const status = await requestPermission(messaging);
    granted =
      status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  }
  if (!granted) return { granted, token: null };

  try {
    return { granted, token: await getToken(messaging) };
  } catch (error) {
    // No iOS sem APNs configurado o token falha - a permissão continua
    // valendo e o token é salvo numa próxima abertura do app.
    crashReportingService.recordError(error, 'enableNotifications - getToken');
    return { granted, token: null };
  }
}
