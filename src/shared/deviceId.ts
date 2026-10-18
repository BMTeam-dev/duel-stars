import { createMMKV } from 'react-native-mmkv';

// Identificador anônimo por instalação do app - útil pra limitar uso de uma
// API, A/B testing, ou qualquer coisa que precise distinguir instalações
// sem exigir conta. NÃO é autenticação (ver services/auth/). Persistido
// local (sobrevive a reload/restart, mas some se o app for desinstalado -
// geralmente é o suficiente; não precisa ser à prova de reinstalação).
const storage = createMMKV({ id: 'app-device' });
const DEVICE_ID_KEY = 'deviceId';

function generateId(): string {
  // Não precisa ser criptograficamente seguro (não é segredo) - evita
  // depender de um polyfill de crypto que o RN não tem por padrão.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  let id = storage.getString(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    storage.set(DEVICE_ID_KEY, id);
  }
  return id;
}
