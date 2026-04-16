import { api } from "../client";

export const authEndpoints = {
  login: (phone: string) => api.post("/diver/auth/login", { phone }),
  resendOtp: (phone: string) => api.post("/diver/auth/resend-otp", { phone }),
  verifyOtp: (data: { phone: string; otp: string }) =>
    api.post("/diver/auth/verify-otp", data),
  completeProfile: (data: any) => api.put("/diver/auth/complete-profile", data),
  logout: () => api.post("/diver/auth/logout"),
};
