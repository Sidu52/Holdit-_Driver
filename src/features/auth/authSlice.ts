import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isSignupComplete: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isSignupComplete: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ access: string; refresh: string; isSignupComplete: boolean }>) => {
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isSignupComplete = action.payload.isSignupComplete;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isSignupComplete = false;
    },
    setSignupComplete: (state, action: PayloadAction<boolean>) => {
      state.isSignupComplete = action.payload;
    },
  },
});

export const { setTokens, clearAuth, setSignupComplete } = authSlice.actions;
export default authSlice.reducer;
