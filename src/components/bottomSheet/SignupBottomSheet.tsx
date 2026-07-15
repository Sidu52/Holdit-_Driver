import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setSignupComplete } from '../../features/auth/authSlice';
import { authEndpoints } from '../../api/endpoints/auth';
import { useMutation } from '@tanstack/react-query';
import { showError, showSuccess } from '../../utils/toast';
import { tokenService } from '../../utils/tokenManager';
import { CustomBottomSheet } from '../ui/CustomBottomSheet';
import { useDriverProfile } from '../../hooks/useDriver';
import * as Location from 'expo-location';

const VEHICLE_OPTIONS = [
  { label: 'Scooter', value: 'scooter', icon: 'bicycle-outline' },
  { label: 'Bike', value: 'bike', icon: 'bicycle-outline' },
  { label: 'Auto', value: 'auto', icon: 'car-outline' },
  { label: 'Car', value: 'car', icon: 'car-sport-outline' },
];

const GENDER_OPTIONS = ['male', 'female', 'other'];

export const SignupBottomSheet = () => {
  const dispatch = useDispatch();
  const isSignupComplete = useSelector((state: any) => state.auth.isSignupComplete);
  const { data: user } = useDriverProfile();
  
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: 'male',
    date_of_birth: '',
    address: '',
    vehicle_type: 'scooter',
    license_number: '',
    lat: 19.076,
    lng: 72.877,
  });

  useEffect(() => {
    if (!isSignupComplete) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isSignupComplete]);

  useEffect(() => {
    if (user && user.is_signup && !isSignupComplete) {
      tokenService.setSignupComplete(true);
      dispatch(setSignupComplete(true));
      setVisible(false);
    }
  }, [user, isSignupComplete, dispatch]);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (visible && !form.address) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          
          const location = await Location.getCurrentPositionAsync({});
          setForm(prev => ({
            ...prev,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          }));

          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          if (geocode.length > 0) {
            const addr = geocode[0];
            const addressString = [addr.street, addr.city, addr.region, addr.country].filter(Boolean).join(', ');
            setForm(prev => ({ ...prev, address: addressString }));
          }
        } catch (err) {
          console.warn("Failed to get location for signup", err);
        }
      })();
    }
  }, [visible]);

  const completeProfileMutation = useMutation({
    mutationFn: authEndpoints.completeProfile,
    onSuccess: async () => {
      showSuccess("Profile updated successfully!");
      await tokenService.setSignupComplete(true);
      dispatch(setSignupComplete(true));
      setVisible(false);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "Failed to update profile");
    }
  });

  const handleSubmit = () => {
    const required = ['first_name', 'last_name', 'email', 'address', 'date_of_birth', 'license_number'];
    const missing = required.filter(f => !form[f as keyof typeof form]);
    
    if (missing.length > 0) {
      showError(`Please fill all required fields`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      showError('Please enter a valid email address');
      return;
    }

    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(form.date_of_birth)) {
      showError('DOB must be in YYYY-MM-DD format');
      return;
    }

    completeProfileMutation.mutate(form);
  };

  return (
    <CustomBottomSheet visible={visible}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Complete Profile 👋</Text>
            <Text style={styles.subtitle}>
              We need a few more details to get you on the road.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={form.first_name}
                  onChangeText={(t) => setForm({ ...form, first_name: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={form.last_name}
                  onChangeText={(t) => setForm({ ...form, last_name: t })}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
              />
            </View>

            {/* Gender & DOB Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.toggleContainer}>
                  {GENDER_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.toggleBtn, form.gender === opt && styles.toggleBtnActive]}
                      onPress={() => setForm({ ...form, gender: opt })}
                    >
                      <Text style={[styles.toggleText, form.gender === opt && styles.toggleTextActive]}>
                        {opt.charAt(0).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.label}>DOB (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1995-01-01"
                  value={form.date_of_birth}
                  onChangeText={(t) => setForm({ ...form, date_of_birth: t })}
                />
              </View>
            </View>

            {/* Vehicle Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.vehicleRow}>
                {VEHICLE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.vehicleCard, form.vehicle_type === opt.value && styles.vehicleCardActive]}
                    onPress={() => setForm({ ...form, vehicle_type: opt.value })}
                  >
                    <Ionicons 
                      name={opt.icon as any} 
                      size={20} 
                      color={form.vehicle_type === opt.value ? 'white' : THEME.PRIMARY} 
                    />
                    <Text style={[styles.vehicleLabel, form.vehicle_type === opt.value && styles.vehicleLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* License Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driving License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="DL-XXXXXXXXXXXX"
                autoCapitalize="characters"
                value={form.license_number}
                onChangeText={(t) => setForm({ ...form, license_number: t })}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Permanent Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your full address"
                multiline
                numberOfLines={3}
                value={form.address}
                onChangeText={(t) => setForm({ ...form, address: t })}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton, completeProfileMutation.isPending && styles.disabledButton]}
              disabled={completeProfileMutation.isPending}
            >
              {completeProfileMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Save & Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              By completing your profile, you agree to our <Text style={styles.link}>Terms of Service</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.TEXT_DARK,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: THEME.TEXT_DARK,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    padding: 4,
    height: 50,
  },
  toggleBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: THEME.PRIMARY,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK_SECONDARY,
  },
  toggleTextActive: {
    color: 'white',
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  vehicleCardActive: {
    backgroundColor: THEME.PRIMARY,
    borderColor: THEME.PRIMARY,
  },
  vehicleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.TEXT_DARK,
  },
  vehicleLabelActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: THEME.PRIMARY,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
    elevation: 4,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyNote: {
    fontSize: 11,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: 'center',
    marginTop: 10,
  },
  link: {
    color: THEME.PRIMARY,
    fontWeight: '700',
  },
});
