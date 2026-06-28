// services/token.ts

import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const IS_SIGNUP_COMPLETE_KEY = "is_signup_complete";

export const tokenService = {
  // GET TOKENS
  getAccessToken: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token === "null" || token === "undefined") return null;
      return token;
    } catch {
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (token === "null" || token === "undefined") return null;
      return token;
    } catch {
      return null;
    }
  },

  getSignupComplete: async (): Promise<boolean> => {
    try {
      const value = await SecureStore.getItemAsync(IS_SIGNUP_COMPLETE_KEY);
      return value === "true";
    } catch {
      return false;
    }
  },

  // SET TOKENS
  setTokens: async (
    accessToken: string,
    refreshToken: string,
    isSignupComplete: boolean = false
  ): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(IS_SIGNUP_COMPLETE_KEY, String(isSignupComplete)),
    ]);
  },

  setAccessToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  setSignupComplete: async (isComplete: boolean): Promise<void> => {
    await SecureStore.setItemAsync(IS_SIGNUP_COMPLETE_KEY, String(isComplete));
  },

  // CLEAR TOKENS
  clear: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(IS_SIGNUP_COMPLETE_KEY),
    ]);
  },

  // CHECK IF TOKENS EXIST
  hasTokens: async (): Promise<boolean> => {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    return !!(access || refresh);
  },
};
