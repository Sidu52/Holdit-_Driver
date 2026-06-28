import { api } from "../client";

export const authEndpoints = {
  login: (phone: string) => api.post("/driver/auth/login", { phone }),
  resendOtp: (phone: string) => api.post("/driver/auth/resend-otp", { phone }),
  verifyOtp: (data: { phone: string; otp: string }) =>
    api.post("/driver/auth/verify-otp", data),
  completeProfile: (data: any) => api.put("/driver/auth/complete-profile", data),
  logout: () => api.post("/driver/auth/logout"),
};
