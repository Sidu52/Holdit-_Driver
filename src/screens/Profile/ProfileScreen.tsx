import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useDriverProfile } from '../../hooks/useDriver';
import { Skeleton } from '../../components/ui/Skeleton';

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { data: profile, isLoading } = useDriverProfile();

  const driverName = profile ? `${profile.first_name} ${profile.last_name}` : "";

  return (
    <ScrollView style={styles.container}>
      {/* Header Profile Info */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileHeaderContent}>
          {isLoading ? (
            <Skeleton width={180} height={28} borderRadius={4} />
          ) : (
            <Text style={styles.name}>{driverName}</Text>
          )}
          <Ionicons name="checkmark-circle" size={20} color={THEME.SECONDARY} />
        </View>
        {isLoading ? (
          <Skeleton width={140} height={18} borderRadius={4} style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.rating}>★ 4.9 Rating • Gold Partner</Text>
        )}
      </View>

      {/* KYC Badge */}
      <View style={styles.kycBadge}>
        <Ionicons name="shield-checkmark" size={24} color={THEME.PRIMARY} />
        <Text style={styles.kycText}>KYC VERIFIED</Text>
      </View>

      <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="call" size={20} color={THEME.PRIMARY} />
          </View>
          <View>
            <Text style={styles.infoLabel}>Phone Number</Text>
            {isLoading ? (
              <Skeleton width={130} height={20} borderRadius={4} style={{ marginTop: 2 }} />
            ) : (
              <Text style={styles.infoValue}>{profile?.phone || "N/A"}</Text>
            )}
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="bicycle" size={20} color={THEME.PRIMARY} />
          </View>
          <View>
            <Text style={styles.infoLabel}>Vehicle</Text>
            {isLoading ? (
              <Skeleton width={110} height={20} borderRadius={4} style={{ marginTop: 2 }} />
            ) : (
              <Text style={styles.infoValue}>{profile?.vehicle_type || "Standard"}</Text>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT MANAGEMENT</Text>
      
      <TouchableOpacity style={styles.actionCard}>
        <Ionicons name="document-text" size={20} color={THEME.TEXT_DARK_SECONDARY} />
        <Text style={styles.actionText}>Document Uploads</Text>
        <Ionicons name="chevron-forward" size={20} color={THEME.TEXT_DARK_SECONDARY} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard}>
        <Ionicons name="settings-sharp" size={20} color={THEME.TEXT_DARK_SECONDARY} />
        <Text style={styles.actionText}>App Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={THEME.TEXT_DARK_SECONDARY} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard}>
        <Ionicons name="language" size={20} color={THEME.TEXT_DARK_SECONDARY} />
        <Text style={styles.actionText}>Language Selection</Text>
        <Text style={styles.actionValue}>English</Text>
        <Ionicons name="chevron-forward" size={20} color={THEME.TEXT_DARK_SECONDARY} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={20} color={THEME.ERROR} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    paddingTop: 60,
  },
  profileHeaderCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
  },
  rating: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 8,
  },
  kycBadge: {
    backgroundColor: '#6EE7B7', // Light green
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  kycText: {
    color: THEME.PRIMARY,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: THEME.TEXT_DARK,
    marginLeft: 16,
  },
  actionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.SUCCESS,
    marginRight: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.ERROR,
    marginLeft: 16,
  }
});
