import { QueryClient } from "@tanstack/react-query";
import { showError } from "../utils/toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (cache)
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // important for mobile
    },
    mutations: {
      retry: 0,
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || error?.message || "Something";

        showError(message);
      },
    },
  },
});
