import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '../../theme/theme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useDriverStats } from '../../hooks/useDriver';
import { Skeleton } from '../../components/ui/Skeleton';

export const EarningsScreen = () => {
  const { data: stats, isLoading } = useDriverStats();
  
  const balance = stats?.availableBalance || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        {isLoading ? (
          <Skeleton width={150} height={48} borderRadius={8} style={{ marginVertical: 8 }} />
        ) : (
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        )}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Bonus Card */}
      <View style={styles.bonusCard}>
        <Text style={styles.bonusLabel}>ACTIVE BONUS</Text>
        <View style={styles.bonusRow}>
          <FontAwesome5 name="medal" size={20} color={THEME.SECONDARY} />
          <Text style={styles.bonusAmount}>+$45.00</Text>
        </View>
        <Text style={styles.bonusDesc}>
          Complete 5 more deliveries tonight to unlock weekend multiplier.
        </Text>
      </View>

      {/* Weekly Performance (Mocked) */}
      <View style={styles.performanceCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Weekly Performance</Text>
            <Text style={styles.dateLabel}>This Week</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {isLoading ? (
              <Skeleton width={80} height={22} borderRadius={4} />
            ) : (
              <Text style={styles.weeklyTotal}>${stats?.earningsThisWeek?.toFixed(2) || "0.00"}</Text>
            )}
            <Text style={styles.weeklyGrowth}>TOTAL EARNED</Text>
          </View>
        </View>
        
        {/* Weekly Bar Chart */}
        <View style={styles.chartPlaceholder}>
          {isLoading ? (
            <Skeleton width={'100%'} height={100} borderRadius={8} />
          ) : (
            <View style={styles.barsRow}>
              {stats?.weeklyChart?.map((entry, i) => {
                // Find max to scale bars
                const maxAmount = Math.max(...(stats.weeklyChart.map(e => e.amount) || [1]));
                const height = entry.amount > 0 ? (entry.amount / maxAmount) * 80 + 20 : 10;
                
                return (
                  <View key={i} style={styles.barColumn}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.dayLabel}>{entry.day}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Incentives */}
      <Text style={styles.sectionHeader}>Incentives & Quests</Text>
      <View style={styles.incentivesRow}>
        <View style={styles.incentiveBox}>
          <Ionicons name="flash" size={24} color={THEME.PRIMARY} />
          <Text style={styles.incentiveTitle}>Weekend Surge</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.incentiveDesc}>15/20 Deliveries</Text>
        </View>
        <View style={[styles.incentiveBox, { backgroundColor: '#e0f2fe' }]}>
          <FontAwesome5 name="check-circle" size={24} color={THEME.SECONDARY} />
          <Text style={styles.incentiveTitle}>Pro Driver Level</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '90%', backgroundColor: THEME.SECONDARY }]} />
          </View>
          <Text style={styles.incentiveDesc}>Elite Status: 4.9/5.0</Text>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  balanceCard: {
    backgroundColor: THEME.PRIMARY,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  withdrawBtn: {
    backgroundColor: THEME.SUCCESS,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  withdrawBtnText: {
    color: THEME.PRIMARY,
    fontWeight: 'bold',
  },
  historyBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  historyBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bonusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  bonusLabel: {
    color: THEME.TEXT_DARK_SECONDARY,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  bonusAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.PRIMARY,
  },
  bonusDesc: {
    color: THEME.TEXT_DARK_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
  },
  dateLabel: {
    color: THEME.TEXT_DARK_SECONDARY,
    fontSize: 13,
    marginTop: 4,
  },
  weeklyTotal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.SUCCESS,
  },
  weeklyGrowth: {
    color: THEME.SUCCESS,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartPlaceholder: {
    height: 120,
    marginTop: 24,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barColumn: {
    alignItems: 'center',
    width: 30,
  },
  bar: {
    width: 8,
    backgroundColor: THEME.PRIMARY,
    borderRadius: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 10,
    color: THEME.TEXT_DARK_SECONDARY,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginBottom: 12,
  },
  incentivesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  incentiveBox: {
    flex: 1,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 16,
  },
  incentiveTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.PRIMARY,
    marginTop: 12,
    marginBottom: 8,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.PRIMARY,
    borderRadius: 2,
  },
  incentiveDesc: {
    fontSize: 11,
    color: THEME.PRIMARY,
  }
});
