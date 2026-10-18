import { getFirestore } from '@react-native-firebase/firestore';

// O banco do app é o nomeado `duel-start`, não o `(default)` - o `(default)`
// deste projeto é um banco legado em modo Datastore, que o SDK não usa. Todo
// acesso ao Firestore passa por aqui pra ninguém cair no banco errado.
export const DATABASE_ID = 'duel-start';

export const db = getFirestore(DATABASE_ID);
