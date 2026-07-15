import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface OtpInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  title?: string;
  subtitle?: string;
}

const OTP_LENGTH = 4;

export const OtpInputModal = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  title = "Verify OTP",
  subtitle = "Ask the customer for the OTP to confirm this step."
}: OtpInputModalProps) => {
  const [otp, setOtp] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setOtp('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
    }
  }, [visible]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setOtp(cleaned);

    if (cleaned.length === OTP_LENGTH && !isLoading) {
      onSubmit(cleaned);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={isLoading}>
            <Ionicons name="close" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              style={styles.hiddenInput}
              editable={!isLoading}
            />

            <View style={styles.otpDisplay}>
              {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={1}
                  onPress={() => inputRef.current?.focus()}
                  style={[
                    styles.otpBox,
                    otp.length === idx && styles.otpBoxActive,
                    otp.length > idx && styles.otpBoxFilled,
                  ]}
                >
                  <Text style={styles.otpText}>{otp[idx] || ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.PRIMARY} />
              <Text style={styles.loadingText}>Verifying...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.submitBtn,
                otp.length !== OTP_LENGTH && styles.submitBtnDisabled
              ]} 
              onPress={() => onSubmit(otp)}
              disabled={otp.length !== OTP_LENGTH}
            >
              <Text style={styles.submitBtnText}>Verify Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    marginBottom: 24,
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    width: 65,
    height: 75,
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
    fontSize: 32,
    fontWeight: '900',
    color: THEME.TEXT_DARK,
  },
  submitBtn: {
    backgroundColor: THEME.PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: THEME.BORDER_LIGHT,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: THEME.PRIMARY,
    fontWeight: 'bold',
  }
});
