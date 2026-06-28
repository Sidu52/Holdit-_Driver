import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { BottomTabBar, TabScreen } from "./BottomTabBar";
import { DashboardScreen } from "../../screens/Dashboard/DashboardScreen";
import { EarningsScreen } from "../../screens/Earnings/EarningsScreen";
import { HistoryScreen } from "../../screens/History/HistoryScreen";
import { ProfileScreen } from "../../screens/Profile/ProfileScreen";
import { THEME } from "../../theme/theme";
import { SignupBottomSheet } from "../bottomSheet/SignupBottomSheet";

interface MainLayoutProps {
  driverPhone: string;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ driverPhone, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabScreen>("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <DashboardScreen driverPhone={driverPhone} onLogout={onLogout} />;
      case "earnings":
        return <EarningsScreen />;
      case "history":
        return <HistoryScreen />;
      case "profile":
        return <ProfileScreen onLogout={onLogout} />;
      default:
        return <DashboardScreen driverPhone={driverPhone} onLogout={onLogout} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <SignupBottomSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  content: {
    flex: 1,
  },
});
