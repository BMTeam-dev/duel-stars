import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PersistConfig,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import { createWhitelistFilter } from 'redux-persist-transform-filter';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { persistedReducer } from './persistedSlice';
import { mainReducer } from './mainSlice';
import { authReducer } from './authSlice';
import { profileReducer } from './profileSlice';

import { reduxStorage } from './storage';

const reducers = combineReducers({
  persisted: persistedReducer,
  main: mainReducer,
  auth: authReducer,
  profile: profileReducer,
});

export type AppRootState = ReturnType<typeof reducers>;

// Persistência SELETIVA, não "tudo que está no redux" - evita que estado
// transitório (loading flags, resultado de uma API) sobreviva a reabrir o
// app de um jeito enganoso. `whitelist` decide quais SLICES inteiros
// persistem (aqui, só `persisted`); `createWhitelistFilter` decide quais
// CAMPOS daquele slice persistem (aqui, só `token`, ver persistedSlice.ts).
// Pra persistir um slice INTEIRO sem filtrar campo a campo (como o app de
// origem desse scaffold faz com um slice de histórico de conversa), basta
// incluir o nome do slice em `whitelist` e não adicionar um
// createWhitelistFilter pra ele.
const persistSettings: PersistConfig<AppRootState> = {
  version: 1,
  key: 'root',
  debug: __DEV__,
  storage: reduxStorage,
  stateReconciler: autoMergeLevel2,
  whitelist: ['persisted'],
  transforms: [createWhitelistFilter('persisted', ['token'])],
};

const persistedReducers = persistReducer(persistSettings, reducers);

export const store = configureStore({
  reducer: persistedReducers,
  enhancers: getDefaultEnhancers => getDefaultEnhancers(),
  devTools: __DEV__,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppGetState = () => AppRootState;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppRootState> = useSelector;
