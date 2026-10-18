import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PersistedSlice } from './types';

const initialState: PersistedSlice = {
  token: '',
};

export const persistedSlice = createSlice({
  name: 'persisted',
  initialState,
  reducers: {
    setToken: (state: PersistedSlice, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    // Adicione um reducer aqui pra cada novo campo persistido - e lembre de
    // incluir o nome do campo na whitelist em store.ts, senão ele nunca sai
    // da memória (não sobrevive a fechar o app).
  },
});

export const persistedSliceActions = persistedSlice.actions;

export const persistedReducer = persistedSlice.reducer;
