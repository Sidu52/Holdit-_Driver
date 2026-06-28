import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { THEME } from '../../theme/theme';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export const VerificationScreen = ({ phone, onChangePhone, onVerify }: { phone: string, onChangePhone: () => void, onVerify: (otp: string) => void }) => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const { verifyOtp, isVerifying, login } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const OTP_LENGTH = 4; // Typical test length, adjust if backend needs 6

  useEffect(() => {
    let intvl: NodeJS.Timeout;
    if (timer > 0) {
      intvl = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(intvl);
  }, [timer]);

  // Focus softly on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
  }, []);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setOtp(cleaned);

    // Auto verify once exactly filled!
    if (cleaned.length === OTP_LENGTH) {
      Keyboard.dismiss();
      verifyOtp(
        { phone, otp: cleaned },
        {
          onSuccess: () => {
            onVerify(cleaned);
          }
        }
      );
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    setOtp('');
    inputRef.current?.focus();
    // Re-trigger the login mutation to dispatch another OTP
    login(phone, {
      onSuccess: () => setTimer(30)
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter OTP</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>Sent to +91 {phone}</Text>
          <TouchableOpacity onPress={onChangePhone} style={styles.changeBtn}>
            <Text style={styles.changeText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        {/* Invisible exact-length Input catching strokes & Auto-Fill code from SMS */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={handleChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp" // Android autofill
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
        />

        {/* Visual Boxes */}
        <View style={styles.otpDisplay}>
          {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
            <View key={idx} style={[
              styles.otpBox,
              otp.length === idx && styles.otpBoxActive,
              otp.length > idx && styles.otpBoxFilled
            ]}>
              <Text style={styles.otpText}>{otp[idx] || ''}</Text>
            </View>
          ))}
        </View>
      </View>

      {isVerifying ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={THEME.PRIMARY} />
          <Text style={styles.loadingText}>Verifying code...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP now'}
          </Text>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: '600',
  },
  changeBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(61, 122, 138, 0.1)',
    borderRadius: 10,
  },
  changeText: {
    color: THEME.PRIMARY,
    fontWeight: '800',
    fontSize: 14,
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 60,
    height: 70,
    borderWidth: 2,
    borderColor: THEME.BORDER_LIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  otpBoxActive: {
    borderColor: THEME.PRIMARY,
    borderWidth: 3,
  },
  otpBoxFilled: {
    backgroundColor: 'rgba(61, 122, 138, 0.05)',
    borderColor: THEME.PRIMARY_LIGHT,
  },
  otpText: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.TEXT_DARK,
  },
  resendBtn: {
    alignSelf: 'center',
    padding: 10,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.PRIMARY,
  },
  resendTextDisabled: {
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: '600',
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: THEME.PRIMARY,
    fontWeight: '700',
    fontSize: 16,
  }
});
