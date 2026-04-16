import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "./src/store/store";
import { queryClient } from "./src/api/queryClient";
import { SocketProvider } from "./src/sockets/SocketProvider";
import { AnimatedSplash } from "./src/components/AnimatedSplash";
import { LoginScreen } from "./src/screens/Auth/LoginScreen";
import { VerificationScreen } from "./src/screens/Auth/VerificationScreen";
import { DashboardScreen } from "./src/screens/Dashboard/DashboardScreen";
import { tokenService } from "./src/api/services/token";
import { setToken } from "./src/store/slices/driverSlice";

// Prevent the native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {});

function Main() {
  const [screen, setScreen] = useState<"login" | "verify" | "dashboard">(
    "login",
  );
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const accessToken = await tokenService.getAccessToken();

      if (isMounted && accessToken) {
        store.dispatch(setToken(accessToken));
        setScreen("dashboard");
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
    // Actual API integration will go here later
  };

  if (screen === "login") {
    return <LoginScreen onSendOtp={handleSendOtp} />;
  }

  if (screen === "verify") {
    return (
      <VerificationScreen
        phone={phone}
        onChangePhone={() => setScreen("login")}
        onVerify={(otp) => {
          console.log("OTP Verified:", otp);
          setScreen("dashboard");
        }}
      />
    );
  }

  return <DashboardScreen driverPhone={phone} />;
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Hide the native splash screen safely once the App has mounted, 
    // handing the view seamlessly over to our AnimatedSplash JS component.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
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
  );
}
