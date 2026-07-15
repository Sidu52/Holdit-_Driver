import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useDriverProfile, useUpdateDriverStatus, useDriverStats } from '../../hooks/useDriver';
import { 
  usePendingOffers, 
  useAcceptRide, 
  useRejectRide,
  useActiveRide,
  useArriveAtPickup,
  useCompletePickup,
  useArriveAtStore,
  useArriveAtStoreForReturn,
  useArriveAtDelivery,
  useCompleteDelivery,
  useCancelRide
} from '../../hooks/useRide';
import { normalizeRideOffer } from '../../api/endpoints/ride';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { Skeleton } from '../../components/ui/Skeleton';
import { ActiveRideScreen } from './ActiveRideScreen';

// How long a driver has to respond to an incoming offer, in seconds.
// Kept as a named constant instead of a magic number sprinkled through JSX/styles.
const OFFER_TIMEOUT_SECONDS = 15;

type Props = {
  driverPhone: string;
  onLogout: () => void;
};

export const DashboardScreen = ({ driverPhone, onLogout }: Props) => {
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useDriverProfile();
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useDriverStats();
  const { mutate: updateStatus, isPending: isStatusUpdating } = useUpdateDriverStatus();

  const isOnline = !!profile?.is_online;

  // Track location only while online; hook is expected to no-op/clean up internally when the flag flips.
  useLocationTracking(isOnline);

  const { data: pendingOffers, refetch: refetchOffers } = usePendingOffers();
  const { mutate: acceptRide, isPending: isAccepting } = useAcceptRide();
  const { mutate: rejectRide, isPending: isRejecting } = useRejectRide();

  // Active ride states
  const { data: activeRide, refetch: refetchActiveRide } = useActiveRide();
  const { mutate: arriveAtPickup, isPending: isArrivingPickup } = useArriveAtPickup();
  const { mutate: completePickup, isPending: isCompletingPickup } = useCompletePickup();
  const { mutate: arriveAtStore, isPending: isArrivingStore } = useArriveAtStore();
  const { mutate: arriveAtStoreForReturn, isPending: isArrivingStoreForReturn } = useArriveAtStoreForReturn();
  const { mutate: arriveAtDelivery, isPending: isArrivingDelivery } = useArriveAtDelivery();
  const { mutate: completeDelivery, isPending: isCompletingDelivery } = useCompleteDelivery();
  const { mutate: cancelRide, isPending: isCancelling } = useCancelRide();

  const activeRideData = activeRide ? normalizeRideOffer(activeRide) : null;

  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRideScreen, setShowRideScreen] = useState(false);

  const incomingOffer = pendingOffers?.[0];
  const isResponding = isAccepting || isRejecting;

  // ---- Live countdown for the incoming offer ----
  // Resets whenever a *new* offer id arrives, ticks down once per second,
  // and auto-rejects if the driver doesn't respond in time.
  const [secondsLeft, setSecondsLeft] = useState(OFFER_TIMEOUT_SECONDS);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const lastOfferId = useRef<string | null>(null);

  useEffect(() => {
    if (!incomingOffer) {
      lastOfferId.current = null;
      return;
    }

    if (lastOfferId.current !== incomingOffer._id) {
      lastOfferId.current = incomingOffer._id;
      setSecondsLeft(OFFER_TIMEOUT_SECONDS);
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: OFFER_TIMEOUT_SECONDS * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingOffer?._id]);

  useEffect(() => {
    if (incomingOffer && secondsLeft === 0 && !isResponding) {
      rejectRide(incomingOffer._id);
    }
  }, [secondsLeft, incomingOffer, isResponding, rejectRide]);

  const handleToggleStatus = (val: boolean) => {
    updateStatus(val);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchStats(),
        refetchOffers(),
        refetchActiveRide()
      ]);
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchStats, refetchOffers, refetchActiveRide]);

  const renderActiveActionButton = (ride: any) => {
    switch (ride.status) {
      case 'driver_assigned':
      case 'store_assigned':
      case 'created':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => arriveAtPickup(ride._id)}
            disabled={isArrivingPickup}
          >
            {isArrivingPickup ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryActionText}>Arrive at Pickup</Text>
            )}
          </TouchableOpacity>
        );
      case 'driver_arrived':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => setShowRideScreen(true)}
          >
            <Text style={styles.primaryActionText}>Enter OTP & Complete Pickup</Text>
          </TouchableOpacity>
        );
      case 'picked_up':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => arriveAtStore(ride._id)}
            disabled={isArrivingStore}
          >
            {isArrivingStore ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryActionText}>Arrive at Store</Text>
            )}
          </TouchableOpacity>
        );
      case 'at_store':
      case 'stored':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => arriveAtDelivery(ride._id)}
            disabled={isArrivingDelivery}
          >
            {isArrivingDelivery ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryActionText}>Arrive for Delivery</Text>
            )}
          </TouchableOpacity>
        );
      case 'arrived_for_delivery':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => setShowRideScreen(true)}
          >
            <Text style={styles.primaryActionText}>Enter OTP & Complete Delivery</Text>
          </TouchableOpacity>
        );
      case 'return_requested':
      case 'return_driver_assigned':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => arriveAtStoreForReturn(ride._id)}
            disabled={isArrivingStoreForReturn}
          >
            {isArrivingStoreForReturn ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryActionText}>Arrive at Store for Return</Text>
            )}
          </TouchableOpacity>
        );
      case 'out_for_return':
        return (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => arriveAtDelivery(ride._id)}
            disabled={isArrivingDelivery}
          >
            {isArrivingDelivery ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryActionText}>Arrive at User Location</Text>
            )}
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };


  const urgent = secondsLeft <= 5;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => setMenuOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.profilePic}>
            <Ionicons name="person" size={20} color="white" />
          </View>
          {isProfileLoading ? (
            <Skeleton width={110} height={22} borderRadius={4} />
          ) : (
            <View>
              <Text style={styles.greeting}>Hi, {profile?.first_name || 'Driver'}</Text>
              <Text style={styles.greetingSub}>
                {isOnline ? "You're online" : "You're offline"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={styles.toggleContainer}>
            {isStatusUpdating ? (
              <ActivityIndicator size="small" color={THEME.PRIMARY} style={{ marginRight: 8 }} />
            ) : (
              <View style={[styles.statusDot, { backgroundColor: isOnline ? THEME.SUCCESS : '#94A3B8' }]} />
            )}
            <Text style={styles.toggleText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleStatus}
              disabled={isStatusUpdating}
              trackColor={{ false: '#cbd5e1', true: THEME.PRIMARY }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              /* surface notifications panel */
            }}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={THEME.TEXT_DARK_SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lightweight dropdown menu for logout, anchored under the header */}
      {menuOpen && (
        <View style={styles.menuPanel}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={THEME.TEXT_DARK} />
            <Text style={styles.menuItemText}>Log out</Text>
          </TouchableOpacity>
          <Text style={styles.menuPhone}>{driverPhone}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
              <Text style={styles.statValue}>${(stats?.earningsToday ?? 0).toFixed(2)}</Text>
            )}
            <Text style={styles.statGrowth}>↗ Updated today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL RIDES</Text>
            {isStatsLoading ? (
              <Skeleton width={60} height={32} borderRadius={4} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.statValue}>{stats?.totalDeliveries ?? 0}</Text>
            )}
            <Text style={styles.statTime}>Lifetime total</Text>
          </View>
        </View>

        {/* Active Ride Card — tap to open full ride screen */}
        {activeRideData && (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setShowRideScreen(true)}
          >
            <View style={styles.activeRideCard}>
            <View style={styles.activeRideHeader}>
              <View style={styles.activeStatusBadge}>
                <Text style={styles.activeStatusBadgeText}>
                  {activeRideData.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.activeRideFare}>${activeRideData.fare.toFixed(2)}</Text>
            </View>

            <Text style={styles.activeRideTitle}>
              {activeRideData.storeDetails?.name || 'Active Delivery'}
            </Text>

            {/* Stepper showing the delivery steps */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  (activeRideData.status === 'driver_assigned' || activeRideData.status === 'driver_arrived') && styles.stepDotActive,
                  (activeRideData.status !== 'driver_assigned' && activeRideData.status !== 'driver_arrived') && styles.stepDotCompleted
                ]} />
                <Text style={[
                  styles.stepText,
                  (activeRideData.status === 'driver_assigned' || activeRideData.status === 'driver_arrived') && styles.stepTextActive
                ]}>Pickup</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  (activeRideData.status === 'picked_up' || activeRideData.status === 'at_store' || activeRideData.status === 'stored') && styles.stepDotActive,
                  (activeRideData.status === 'arrived_for_delivery' || activeRideData.status === 'delivered') && styles.stepDotCompleted
                ]} />
                <Text style={[
                  styles.stepText,
                  (activeRideData.status === 'picked_up' || activeRideData.status === 'at_store' || activeRideData.status === 'stored') && styles.stepTextActive
                ]}>At Store</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  activeRideData.status === 'arrived_for_delivery' && styles.stepDotActive,
                  activeRideData.status === 'delivered' && styles.stepDotCompleted
                ]} />
                <Text style={[
                  styles.stepText,
                  activeRideData.status === 'arrived_for_delivery' && styles.stepTextActive
                ]}>Delivery</Text>
              </View>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.dot, { borderColor: THEME.PRIMARY }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routeAddress}>{activeRideData.pickup.address}</Text>
                </View>
              </View>
              <View style={[styles.routeRow, { marginTop: 16 }]}>
                <View style={[styles.square, { backgroundColor: THEME.PRIMARY }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>DROPOFF</Text>
                  <Text style={styles.routeAddress}>{activeRideData.dropoff.address}</Text>
                </View>
              </View>
            </View>

            {activeRideData.user && (
              <View style={styles.customerCard}>
                <View style={styles.customerInfo}>
                  <Ionicons name="person-circle-outline" size={32} color={THEME.TEXT_DARK_SECONDARY} style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.customerName}>
                      {activeRideData.user.firstName} {activeRideData.user.lastName}
                    </Text>
                    <Text style={styles.customerPhone}>{activeRideData.user.phone}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons based on status */}
            <View style={styles.activeActions}>
              {renderActiveActionButton(activeRideData)}
              
              <TouchableOpacity
                style={styles.cancelActiveBtn}
                onPress={() => {
                  cancelRide({ bookingId: activeRideData._id, reason: "Driver requested cancellation" });
                }}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.cancelActiveText}>Cancel Ride</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        )}

        {/* Empty / idle states keep the driver oriented when there's nothing active */}
        {!activeRideData && !incomingOffer && !isOnline && (
          <View style={styles.idleCard}>
            <Ionicons name="moon-outline" size={28} color={THEME.TEXT_DARK_SECONDARY} />
            <Text style={styles.idleTitle}>You're offline</Text>
            <Text style={styles.idleDesc}>Go online to start receiving ride requests.</Text>
            <TouchableOpacity
              style={styles.idleBtn}
              onPress={() => handleToggleStatus(true)}
              disabled={isStatusUpdating}
            >
              <Text style={styles.idleBtnText}>Go online</Text>
            </TouchableOpacity>
          </View>
        )}

        {!activeRideData && !incomingOffer && isOnline && (
          <>
            <View style={styles.demandBanner}>
              <View style={styles.demandIcon}>
                <Ionicons name="flash" size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.demandTitle}>High demand zone</Text>
                <Text style={styles.demandDesc}>Head to Chelsea for a 1.5x boost</Text>
              </View>
              <TouchableOpacity
                style={styles.goBtn}
                onPress={() => {
                  /* deep-link to navigation toward the demand zone */
                }}
              >
                <Text style={styles.goBtnText}>GO</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.waitingCard}>
              <View style={styles.waitingPulseRing}>
                <Ionicons name="search" size={20} color={THEME.PRIMARY} />
              </View>
              <Text style={styles.waitingTitle}>Looking for rides nearby…</Text>
              <Text style={styles.waitingDesc}>We'll notify you the moment a request comes in.</Text>
            </View>
          </>
        )}

        {/* Incoming Request Card */}
        {!activeRideData && incomingOffer && (
          <View style={[styles.requestPopup, urgent && styles.requestPopupUrgent]}>
            <View style={styles.requestHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NEW REQUEST</Text>
              </View>

              <View style={styles.countdownWrap}>
                <View style={styles.countdownRingTrack}>
                  <Animated.View
                    style={[
                      styles.countdownRingFill,
                      {
                        borderColor: urgent ? '#F59E0B' : THEME.PRIMARY,
                        opacity: progressAnim,
                      },
                    ]}
                  />
                  <Text style={[styles.countdownNum, urgent && { color: '#F59E0B' }]}>{secondsLeft}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.fareAmount}>${(incomingOffer.fare ?? 12.4).toFixed(2)}</Text>
                <Text style={styles.fareTip}>INCL. TIP</Text>
              </View>
            </View>

            <Text style={styles.requestTitle}>
              {incomingOffer.storeDetails?.name || 'Artisanal Bakery Delivery'}
            </Text>

            <View style={styles.routeContainer}>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.dot, { borderColor: THEME.PRIMARY }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routeAddress}>
                    {incomingOffer.pickup?.address || '742 Evergreen Terrace (0.8 mi)'}
                  </Text>
                </View>
              </View>
              <View style={[styles.routeRow, { marginTop: 16 }]}>
                <View style={[styles.square, { backgroundColor: THEME.PRIMARY }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>DROPOFF</Text>
                  <Text style={styles.routeAddress}>
                    {incomingOffer.dropoff?.address || 'West Side Plaza (2.4 mi)'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.declineBtn, isResponding && styles.btnDisabled]}
                onPress={() => rejectRide(incomingOffer._id)}
                disabled={isResponding}
              >
                {isRejecting ? (
                  <ActivityIndicator size="small" color={THEME.TEXT_DARK} />
                ) : (
                  <Text style={styles.declineText}>Decline</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, isResponding && styles.btnDisabled]}
                onPress={() => acceptRide(incomingOffer._id)}
                disabled={isResponding}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.acceptText}>Accept order</Text>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Full-Screen Active Ride Flow */}
      <Modal
        visible={showRideScreen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <ActiveRideScreen onBack={() => setShowRideScreen(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.TEXT_DARK,
  },
  greetingSub: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.TEXT_DARK_SECONDARY,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuPanel: {
    position: 'absolute',
    top: 70,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 20,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.TEXT_DARK,
  },
  menuPhone: {
    fontSize: 11,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 6,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.TEXT_DARK_SECONDARY,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.TEXT_DARK,
    marginVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  statGrowth: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.SUCCESS,
  },
  statTime: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.TEXT_DARK_SECONDARY,
  },
  idleCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  idleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.TEXT_DARK,
    marginTop: 12,
  },
  idleDesc: {
    fontSize: 13,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  idleBtn: {
    marginTop: 18,
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  idleBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  demandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.PRIMARY,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
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
    fontWeight: '700',
    fontSize: 15,
  },
  demandDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  goBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    marginLeft: 8,
  },
  goBtnText: {
    color: THEME.PRIMARY,
    fontWeight: '800',
    fontSize: 13,
  },
  waitingCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 28,
  },
  waitingPulseRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  waitingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.TEXT_DARK,
  },
  waitingDesc: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 4,
    textAlign: 'center',
  },
  requestPopup: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 26,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  requestPopupUrgent: {
    borderColor: '#FDE68A',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  countdownWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownRingTrack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownRingFill: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  countdownNum: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.TEXT_DARK,
    fontVariant: ['tabular-nums'],
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  fareTip: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: '800',
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
    borderRadius: 3,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.TEXT_DARK_SECONDARY,
    letterSpacing: 1,
  },
  routeAddress: {
    fontSize: 15,
    fontWeight: '500',
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
    fontWeight: '700',
    color: THEME.TEXT_DARK,
  },
  acceptBtn: {
    flex: 1.6,
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
    fontWeight: '700',
    color: 'white',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  activeRideCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 26,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  activeRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activeStatusBadge: {
    backgroundColor: 'rgba(19, 91, 236, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.PRIMARY,
    letterSpacing: 0.5,
  },
  activeRideFare: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.PRIMARY,
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.TEXT_DARK,
    marginBottom: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
  },
  stepDotActive: {
    backgroundColor: THEME.PRIMARY,
    borderWidth: 2,
    borderColor: 'rgba(19, 91, 236, 0.3)',
  },
  stepDotCompleted: {
    backgroundColor: THEME.SUCCESS,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTextActive: {
    color: THEME.PRIMARY,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  customerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.TEXT_DARK,
  },
  customerPhone: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  activeActions: {
    flexDirection: 'column',
    gap: 12,
  },
  primaryActionBtn: {
    backgroundColor: THEME.PRIMARY,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  cancelActiveBtn: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
  },
  cancelActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});