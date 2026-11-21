import { Linking, NativeModules, Platform } from 'react-native';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import { listenerError } from '../firestore/listenerError';

// Módulo nativo do app (android/.../AppUpdateModule.kt). No iOS ainda não
// existe: lá nada é checado e ninguém é bloqueado.
type AppUpdateNative = {
  versionCode: number;
  check(): Promise<{ available: boolean; availableVersionCode: number }>;
  start(): Promise<boolean>;
};
const native: AppUpdateNative | undefined =
  Platform.OS === 'android' ? NativeModules.AppUpdate : undefined;

const STORE_URL =
  'https://play.google.com/store/apps/details?id=com.bmteam.duelstars';

export const currentVersionCode = (): number | null =>
  native?.versionCode ?? null;

export async function checkStoreUpdate(): Promise<number | null> {
  if (!native) return null;
  const info = await native.check().catch(() => null);
  return info?.available ? info.availableVersionCode : null;
}

// Abre a atualização do Play dentro do app; se não der (app fora da loja,
// Play desatualizado), abre a página do app na loja.
export async function startUpdate() {
  const started = native ? await native.start().catch(() => false) : false;
  if (!started) await Linking.openURL(STORE_URL).catch(() => undefined);
}

// config/app.androidMinVersionCode: versão mínima que ainda funciona. Quem
// estiver abaixo é bloqueado até atualizar. Muda-se direto no console do
// Firestore, sem publicar nada, e vale na hora (é escuta, não leitura única).
export function subscribeMinVersion(
  onChange: (min: number | null) => void,
): () => void {
  if (!native) return () => undefined;
  return onSnapshot(
    doc(db, 'config', 'app'),
    snap => {
      const min = snap.data()?.androidMinVersionCode;
      onChange(typeof min === 'number' ? min : null);
    },
    listenerError('config/app'),
  );
}
