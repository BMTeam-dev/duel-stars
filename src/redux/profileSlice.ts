import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProfileSlice } from './types';
import { UserProfile } from '../services/profile/profile.types';

const initialState: ProfileSlice = {
  profile: undefined,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state: ProfileSlice, action: PayloadAction<UserProfile | null | undefined>) => {
      state.profile = action.payload;
    },
  },
});

export const profileSliceActions = profileSlice.actions;

export const profileReducer = profileSlice.reducer;
