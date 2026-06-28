import { useMutation } from '@tanstack/react-query';
import { authEndpoints } from '../api/endpoints/auth';
import { useDispatch } from 'react-redux';
import { setTokens } from '../features/auth/authSlice';
import { tokenService } from '../utils/tokenManager';
import { showError, showSuccess } from '../utils/toast';

export const useAuth = () => {
  const dispatch = useDispatch();

  const loginMutation = useMutation({
    mutationFn: authEndpoints.login,
    onSuccess: () => {
      showSuccess("OTP sent to your phone");
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "Login failed");
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: authEndpoints.verifyOtp,
    onSuccess: async (response: any) => {
       const accessToken = response?.data?.data?.accessToken;
       const refreshToken = response?.data?.data?.refreshToken;
       const isSignupComplete = response?.data?.data?.driver?.is_signup || false;
       
       if (accessToken) {
           dispatch(setTokens({ 
             access: accessToken, 
             refresh: refreshToken || "",
             isSignupComplete: isSignupComplete
           }));
           await tokenService.setTokens(accessToken, refreshToken || "", isSignupComplete);
           showSuccess("Login Successful!");
       }
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "OTP Verification failed");
    }
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    verifyOtp: verifyOtpMutation.mutate,
    isVerifying: verifyOtpMutation.isPending,
  };
};
