import { createMMKV } from 'react-native-mmkv';
import { Storage } from 'redux-persist';

// react-native-mmkv v4 usa a factory `createMMKV()` (arquitetura Nitro
// Modules) em vez do antigo `new MMKV()`. Troque o `id` pelo nome do seu
// projeto antes de ir pra produção - evita colidir com outro app que também
// use MMKV no mesmo aparelho (improvável, mas é de graça evitar).
export const MMKVStorage = createMMKV({
  id: 'duel-stars-redux-storage-v1',
});

export const reduxStorage: Storage = {
  setItem: (key, value) => {
    MMKVStorage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: key => {
    const value = MMKVStorage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: key => {
    MMKVStorage.remove(key);
    return Promise.resolve();
  },
};
