import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image, ScrollView, RefreshControl } from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useDriverProfile, useUpdateDriverStatus, useDriverStats } from '../../hooks/useDriver';
import { usePendingOffers, useAcceptRide, useRejectRide } from '../../hooks/useRide';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { Skeleton } from '../../components/ui/Skeleton';

export const DashboardScreen = ({ driverPhone, onLogout }: { driverPhone: string, onLogout: () => void }) => {
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useDriverProfile();
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useDriverStats();
  const { mutate: updateStatus } = useUpdateDriverStatus();

  // Update location every 5s if online
  useLocationTracking(profile?.is_online || false);

  const { data: pendingOffers, refetch: refetchOffers } = usePendingOffers();
  const { mutate: acceptRide } = useAcceptRide();
  const { mutate: rejectRide } = useRejectRide();

  const [refreshing, setRefreshing] = useState(false);

  const isOnline = !!profile?.is_online;

  const handleToggleStatus = (val: boolean) => {
    updateStatus(val);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchStats(),
        refetchOffers()
      ]);
    } catch (error) {
      console.error("Failed to refresh dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const incomingOffer = pendingOffers?.[0]; // Show the first pending offer if any

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profilePic}>
            <Ionicons name="person" size={20} color="white" />
          </View>
          {isProfileLoading ? (
            <Skeleton width={100} height={24} borderRadius={4} />
          ) : (
            <Text style={styles.brandName}>Hi, {profile?.first_name || "Driver"}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleStatus}
              trackColor={{ false: "#ccc", true: THEME.PRIMARY }}
              thumbColor={"#fff"}
            />
          </View>
          <TouchableOpacity style={styles.bellIcon}>
            <Ionicons name="notifications" size={24} color={THEME.TEXT_DARK_SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.PRIMARY]}
            tintColor={THEME.PRIMARY}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TODAY'S EARNINGS</Text>
            {isStatsLoading ? (
              <Skeleton width={80} height={32} borderRadius={4} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.statValue}>${stats?.earningsToday?.toFixed(2) || "0.00"}</Text>
            )}
            <Text style={styles.statGrowth}>↗ Updated today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL RIDES</Text>
            {isStatsLoading ? (
              <Skeleton width={60} height={32} borderRadius={4} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.statValue}>{stats?.totalDeliveries || "0"}</Text>
            )}
            <Text style={styles.statTime}>Lifetime total</Text>
          </View>
        </View>

        {/* High Demand Banner */}
        <View style={styles.demandBanner}>
          <View style={styles.demandIcon}>
            <Ionicons name="flash" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.demandTitle}>High Demand Zone</Text>
            <Text style={styles.demandDesc}>Head to Chelsea for 1.5x boost</Text>
          </View>
          <TouchableOpacity style={styles.goBtn}>
            <Text style={styles.goBtnText}>GO</Text>
          </TouchableOpacity>
        </View>

        {/* Incoming Request Popup */}
        {incomingOffer && (
          <View style={styles.requestPopup}>
            <View style={styles.requestHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NEW REQUEST</Text>
              </View>
              <Text style={styles.timerText}>Expiring in 14s</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.fareAmount}>${incomingOffer.fare?.toFixed(2) || "12.40"}</Text>
                <Text style={styles.fareTip}>INCL. TIP</Text>
              </View>
            </View>

            <Text style={styles.requestTitle}>
              {incomingOffer.storeDetails?.name || "Artisanal Bakery Delivery"}
            </Text>

            <View style={styles.routeContainer}>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.dot, { borderColor: THEME.PRIMARY }]} />
                <View>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routeAddress}>{incomingOffer.pickup?.address || "742 Evergreen Terrace (0.8 mi)"}</Text>
                </View>
              </View>
              <View style={[styles.routeRow, { marginTop: 16 }]}>
                <View style={[styles.square, { backgroundColor: THEME.PRIMARY }]} />
                <View>
                  <Text style={styles.routeLabel}>DROPOFF</Text>
                  <Text style={styles.routeAddress}>{incomingOffer.dropoff?.address || "West Side Plaza (2.4 mi)"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => rejectRide(incomingOffer._id)}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptRide(incomingOffer._id)}
              >
                <Text style={styles.acceptText}>Accept Order</Text>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2ff', // Behind map
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e6e8eaff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.PRIMARY,
    marginRight: 8,
  },
  bellIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginVertical: 8,
  },
  statGrowth: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.PRIMARY,
  },
  statTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
  },
  demandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.PRIMARY,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  demandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  demandTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  demandDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  goBtn: {
    marginLeft: 'auto',
    backgroundColor: THEME.SUCCESS,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goBtnText: {
    color: THEME.PRIMARY,
    fontWeight: 'bold',
  },
  requestPopup: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#6EE7B7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.PRIMARY,
  },
  timerText: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    fontStyle: 'italic',
    marginTop: 2,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.PRIMARY,
  },
  fareTip: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: 'right',
  },
  requestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginBottom: 20,
  },
  routeContainer: {
    position: 'relative',
    marginLeft: 8,
    marginBottom: 24,
  },
  routeLine: {
    position: 'absolute',
    left: 7,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    backgroundColor: 'white',
    marginRight: 16,
  },
  square: {
    width: 14,
    height: 14,
    marginRight: 17,
    marginLeft: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
    letterSpacing: 1,
  },
  routeAddress: {
    fontSize: 16,
    color: THEME.TEXT_DARK,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
  },
  acceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: THEME.PRIMARY,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  }
});
