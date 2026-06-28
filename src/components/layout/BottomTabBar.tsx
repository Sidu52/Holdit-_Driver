import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { THEME } from "../../theme/theme";

export type TabScreen = "home" | "earnings" | "history" | "profile";

interface BottomTabBarProps {
  activeTab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: TabScreen; label: string; iconLib: "Ionicons" | "FontAwesome5"; iconName: string }[] = [
    { key: "home", label: "HOME", iconLib: "FontAwesome5", iconName: "motorcycle" },
    { key: "earnings", label: "EARNINGS", iconLib: "Ionicons", iconName: "wallet-outline" },
    { key: "history", label: "HISTORY", iconLib: "Ionicons", iconName: "time-outline" },
    { key: "profile", label: "PROFILE", iconLib: "Ionicons", iconName: "person-outline" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive ? THEME.SUCCESS : THEME.TEXT_DARK_SECONDARY;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => onTabChange(tab.key)}
            >
              {tab.iconLib === "Ionicons" ? (
                <Ionicons name={tab.iconName as any} size={24} color={color} />
              ) : (
                <FontAwesome5 name={tab.iconName} size={22} color={color} />
              )}
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  container: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 60 : 65,
    backgroundColor: "#F8F9FA",
    paddingBottom: Platform.OS === "ios" ? 0 : 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
  },
});
