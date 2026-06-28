import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRideHistory } from '../../hooks/useRide';
import { useDriverStats } from '../../hooks/useDriver';
import { Skeleton } from '../../components/ui/Skeleton';

export const HistoryScreen = () => {
  const { data: historyData, isLoading: isHistoryLoading } = useRideHistory();
  const { data: stats, isLoading: isStatsLoading } = useDriverStats();

  const history = historyData?.rides || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History Period</Text>
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>Total Lifetime</Text>
          <Ionicons name="chevron-down" size={20} color={THEME.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: THEME.PRIMARY }]}>
            <Text style={styles.statLabel}>TOTAL EARNINGS</Text>
            {isStatsLoading ? (
              <Skeleton width={100} height={32} borderRadius={4} style={{ marginVertical: 8, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            ) : (
              <Text style={styles.statValueWhite}>${stats?.availableBalance?.toFixed(2) || "0.00"}</Text>
            )}
            <Text style={styles.statSubText}>All time earnings</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'white' }]}>
            <Text style={[styles.statLabel, { color: THEME.TEXT_DARK_SECONDARY }]}>DELIVERIES</Text>
            {isStatsLoading ? (
              <Skeleton width={60} height={32} borderRadius={4} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.statValueDark}>{stats?.totalDeliveries || "0"}</Text>
            )}
            <Text style={[styles.statSubText, { color: THEME.TEXT_DARK_SECONDARY }]}>Completed rides</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DELIVERY LOG</Text>
        
        {isHistoryLoading ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={[styles.historyCard, { height: 80 }]}>
              <Skeleton width={48} height={48} borderRadius={12} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Skeleton width="60%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={16} borderRadius={4} />
              </View>
              <Skeleton width={60} height={20} borderRadius={4} />
            </View>
          ))
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No delivery history yet</Text>
          </View>
        ) : (
          history.map((ride) => (
            <View key={ride._id} style={styles.historyCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="bag-handle" size={20} color={THEME.PRIMARY} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {ride.storeDetails?.name || "Market Delivery"}
                </Text>
                <Text style={styles.deliveryMeta}>
                  {ride.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.amount}>${ride.fare?.toFixed(2) || "0.00"}</Text>
                <Ionicons name="checkmark-circle" size={16} color={THEME.SUCCESS} />
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    color: THEME.TEXT_DARK_SECONDARY,
    fontSize: 14,
    marginBottom: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginRight: 8,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  statValueWhite: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statValueDark: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginVertical: 8,
  },
  statSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginBottom: 4,
  },
  deliveryMeta: {
    fontSize: 13,
    color: THEME.TEXT_DARK_SECONDARY,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.SUCCESS,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: '500',
  }
});
