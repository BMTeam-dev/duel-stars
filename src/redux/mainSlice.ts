import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MainSlice } from './types';

// Exemplo de slice NÃO persistido (não entra na whitelist de store.ts) -
// reseta toda vez que o app abre. Use um slice assim pra estado de sessão
// que não faz sentido sobreviver a fechar o app.
const initialState: MainSlice = {
  name: '',
};

export const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setName: (state: MainSlice, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
  },
});

export const mainSliceActions = mainSlice.actions;

export const mainReducer = mainSlice.reducer;
