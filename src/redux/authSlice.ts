import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthSlice, AuthUserState } from './types';

const initialState: AuthSlice = {
  user: undefined,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state: AuthSlice, action: PayloadAction<AuthUserState | null>) => {
      state.user = action.payload;
    },
  },
});

export const authSliceActions = authSlice.actions;

export const authReducer = authSlice.reducer;
