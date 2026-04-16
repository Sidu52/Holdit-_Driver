import { api } from "./client";
import type {
  ApiResponse,
  LoginResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
  CompleteProfilePayload,
  CompleteProfileResponse,
} from "../features/auth/authTypes";

export const authApi = {
  login: async (phone: string): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<null>>("/user/auth/login", {
      phone,
    });
    return { success: true, message: res.data.message };
  },

  resendOtp: async (phone: string): Promise<ResendOtpResponse> => {
    const res = await api.post<ApiResponse<null>>("/user/auth/resend-otp", {
      phone,
    });
    return { success: true, message: res.data.message };
  },

  verifyOtp: async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
    const res = await api.post<ApiResponse<VerifyOtpResponse>>(
      "/user/auth/verify-otp",
      { phone, otp },
    );
    return res.data.data;
  },

  completeProfile: async (
    data: CompleteProfilePayload,
  ): Promise<CompleteProfileResponse> => {
    const res = await api.put<ApiResponse<CompleteProfileResponse>>(
      "/user/auth/complete-profile",
      data,
    );
    return res.data.data;
  },

  refreshToken: async (): Promise<ApiResponse> => {
    const res = await api.post<ApiResponse>("/user/auth/refresh");
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/user/auth/logout");
  },
};
