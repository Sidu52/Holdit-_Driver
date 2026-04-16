// services/token.ts

import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

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


  // SET TOKENS
  setTokens: async (
    accessToken: string,
    refreshToken: string,
  ): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  setAccessToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  // CLEAR TOKENS
  clear: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
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
