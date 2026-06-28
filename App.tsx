import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider, useSelector } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "./src/store";
import { queryClient } from "./src/api/reactQuery";
import { SocketProvider } from "./src/sockets/SocketProvider";
import { AnimatedSplash } from "./src/components/AnimatedSplash";
import { LoginScreen } from "./src/screens/Auth/LoginScreen";
import { VerificationScreen } from "./src/screens/Auth/VerificationScreen";
import { DashboardScreen } from "./src/screens/Dashboard/DashboardScreen";
import { CompleteProfileScreen } from "./src/screens/Auth/CompleteProfileScreen";
import { tokenService } from "./src/utils/tokenManager";
import { setTokens, clearAuth } from "./src/features/auth/authSlice";
import Toast from "react-native-toast-message";
import { MainLayout } from "./src/components/layout/MainLayout";

// Prevent the native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {});

function Main() {
  const { isAuthenticated, isSignupComplete } = useSelector((state: any) => state.auth);
  const [screen, setScreen] = useState<"login" | "verify">("login");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const accessToken = await tokenService.getAccessToken();
        const refreshToken = await tokenService.getRefreshToken();
        const signupComplete = await tokenService.getSignupComplete();

        if (isMounted && accessToken && accessToken !== "null" && accessToken !== "undefined") {
          store.dispatch(setTokens({ 
            access: accessToken, 
            refresh: refreshToken || "",
            isSignupComplete: signupComplete
          }));
        } else {
          store.dispatch(clearAuth());
        }
      } catch (error) {
        console.error("Session restore failed:", error);
        store.dispatch(clearAuth());
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendOtp = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setScreen("verify");
  };

  const handleLogout = async () => {
    await tokenService.clear();
    store.dispatch(clearAuth());
    setScreen("login");
  };

  if (loading) {
    return null; // Don't render until token status is resolved
  }

  // If authenticated, render the dashboard main layout directly
  if (isAuthenticated) {
    return <MainLayout driverPhone={phone} onLogout={handleLogout} />;
  }

  if (screen === "login") {
    return <LoginScreen onSendOtp={handleSendOtp} />;
  }

  if (screen === "verify") {
    return (
      <VerificationScreen
        phone={phone}
        onChangePhone={() => setScreen("login")}
        onVerify={(otp: string) => {
          console.log("OTP Verified:", otp);
          // Redux state change will automatically trigger rendering of MainLayout
        }}
      />
    );
  }

  return null;
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Hide the native splash screen safely once the App has mounted, 
    // handing the view seamlessly over to our AnimatedSplash JS component.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <Provider store={store}>
          <QueryClientProvider client={queryClient}>
          <SocketProvider>
            {!appReady ? (
              <AnimatedSplash onFinish={() => setAppReady(true)} />
            ) : (
              <Main />
            )}
          </SocketProvider>
        </QueryClientProvider>
      </Provider>
      <Toast />
    </>
  );
}
