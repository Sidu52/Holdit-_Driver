import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenService } from "../utils/tokenManager";
import { store } from "../store";
import { clearAuth, setTokens } from "../features/auth/authSlice";

// TYPES
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

// REFRESH STATE
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
};

const handleAuthFailure = async () => {
  await tokenService.clear();
  store.dispatch(clearAuth());
};

// AXIOS INSTANCE
const API_URL = (process.env.EXPO_PUBLIC_API_URL).replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Separate instance for refresh to avoid interceptor loop
const refreshApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    // Read token synchronously from Redux Store instead of async SecureStore
    // which is more reliable for interceptors in production
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
    console.log(`REQUEST: ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log("=== API DEBUG ===");
    console.log("Redux Token State:", accessToken ? "PRESENT" : "MISSING");
    
    if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
      const masked = `${accessToken.substring(0, 10)}...${accessToken.slice(-4)}`;
      console.log("Authorization Header Set: Bearer", masked);
    } else {
      console.log("Authorization Header: NOT SET (Token invalid or missing in Redux)");
      // Diagnostic: Check SecureStore directly as well
      tokenService.getAccessToken().then(token => {
        console.log("Diagnostic SecureStore check:", token ? "Token exists in SecureStore" : "SecureStore is EMPTY");
      });
    }

    if (config.data) {
      console.log("Data:", JSON.stringify(config.data));
    }
    console.log("==================");
    return config;
  },
  (error) => Promise.reject(error),
);


// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE ===');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data));
    console.log('=================');
    return response;
  },
  async (error: AxiosError) => {
    console.log('=== API ERROR ===');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Request made?', !!error.request);
    console.log('Got response?', !!error.response);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', JSON.stringify(error.response?.data));
    console.log('=================');
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401) {
      return Promise.reject(formatError(error));
    }

    if (originalRequest._retry) {
      await handleAuthFailure();
      return Promise.reject(formatError(error));
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await refreshApi.post("/user/auth/refresh", {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      await tokenService.setTokens(newAccessToken, newRefreshToken);
      store.dispatch(setTokens({ access: newAccessToken, refresh: newRefreshToken }));
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      await handleAuthFailure();
      return Promise.reject(formatError(refreshError as AxiosError));
    } finally {
      isRefreshing = false;
    }
  },
);

const formatError = (error: AxiosError): ApiError => {
  const responseData = error.response?.data as { message?: string } | undefined;

  return {
    message: responseData?.message || error.message || "Something went wrong",
    status: error.response?.status || 500,
    data: error.response?.data || null,
  };
};
