import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Dimensions,
    Keyboard,
    Animated,
    Platform,
    Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "../../theme/theme";
import { useAuth } from "../../hooks/useAuth";
import { showSuccess, showError } from "../../utils/toast";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const MOBILE_MIN_LENGTH = 10;
const MOBILE_MAX_LENGTH = 15;

interface LoginScreenProps {
  onSendOtp: (phone: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSendOtp }) => {
    const [mobile, setMobile] = useState<string>("");
    const { login, isLoggingIn } = useAuth();
    
    const isPending = isLoggingIn;

    // Animation Refs
    const kbdAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showListener = Keyboard.addListener(showEvent, () => {
            Animated.timing(kbdAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }).start();
        });

        const hideListener = Keyboard.addListener(hideEvent, () => {
            Animated.timing(kbdAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.quad),
            }).start();
        });

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    const handleMobileChange = (text: string) => {
        const sanitized = text.replace(/[^0-9]/g, "");
        if (sanitized.length <= MOBILE_MAX_LENGTH) {
            setMobile(sanitized);
        }
    };

    const isValidMobile = (number: string): boolean => {
        return (
            number.length >= MOBILE_MIN_LENGTH &&
            number.length <= MOBILE_MAX_LENGTH &&
            /^[0-9]+$/.test(number)
        );
    };

    const handleLogin = () => {
        const trimmedMobile = mobile.trim();
        if (isPending) return;
        if (!trimmedMobile) {
            showError("Please enter your mobile number");
            return;
        }
        if (!isValidMobile(trimmedMobile)) {
            showError(`Please enter a valid mobile number (${MOBILE_MIN_LENGTH}-${MOBILE_MAX_LENGTH} digits)`);
            return;
        }

        login(trimmedMobile, {
            onSuccess: () => {
                onSendOtp(trimmedMobile);
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={THEME.PRIMARY} />

            <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* HERO / HEADER SECTION */}
                <LinearGradient
                    colors={[THEME.PRIMARY, THEME.PRIMARY_DARK]}
                    style={styles.header}
                >
                    <SafeAreaView edges={["top"]} style={styles.safeTop}>
                        <Animated.View style={[styles.headerContent]}>
                            <Text style={styles.headerTitle}>Holdit Driver</Text>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.headerText}>Ready to pick up and deliver luggage fast?</Text>
                            </View>
                        </Animated.View>
                    </SafeAreaView>
                </LinearGradient>

                {/* SIMPLE IMAGE SECTION (Replacement for infinite grid) */}
                <View style={styles.gridSection}>
                     <Image 
                        source={require('../../../assets/images/splash_screen_delivery_boy.webp')} 
                        style={styles.heroImage} 
                        resizeMode="contain" 
                     />
                </View>

                {/* FORM SECTION */}
                <Animated.View style={[
                    styles.formContainer,
                    {
                        transform: [{
                            translateY: kbdAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -100], // Slide up when keyboard opens
                            })
                        }]
                    }
                ]}>
                    <LinearGradient
                        colors={["rgba(255,255,255,0)", "#ffffff"]}
                        style={styles.topShadow}
                    />
                    <Text style={styles.formTitle}>Driver Login</Text>

                    <View style={[styles.inputWrapper, mobile.length > 0 && styles.inputWrapperActive]}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <TextInput
                            keyboardType="phone-pad"
                            placeholder="Enter mobile number"
                            value={mobile}
                            onChangeText={handleMobileChange}
                            style={styles.input}
                            placeholderTextColor={THEME.TEXT_DARK_SECONDARY}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, !isValidMobile(mobile) && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isPending}
                    >
                        <Text style={styles.loginButtonText}>
                            {isPending ? "Sending OTP..." : "Continue"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footerWrap}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to our{" "}
                            <Text style={styles.footerLink}>Terms of Service</Text> &{" "}
                            <Text style={styles.footerLink}>Privacy Policy</Text>
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND_LIGHT,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
        paddingBottom: 40,
        paddingTop: 50,
        zIndex: 10,
    },
    safeTop: {
        width: "100%",
    },
    headerContent: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 20,
        paddingHorizontal: 32,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 42,
        fontWeight: "900",
        color: "white",
        letterSpacing: -1,
    },
    headerTextWrap: {
        marginTop: 12,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "800",
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        lineHeight: 28,
    },
    gridSection: {
        height: 250,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    heroImage: {
        width: 200,
        height: 200,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: "center",
        backgroundColor: "#fff",
        marginTop: -40,
        zIndex: 30,
    },
    topShadow: {
        position: "absolute",
        top: -60,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 25,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: THEME.TEXT_DARK,
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 64,
        borderWidth: 1.5,
        borderColor: THEME.BORDER_LIGHT,
        borderRadius: 16,
        backgroundColor: "white",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputWrapperActive: {
        borderColor: THEME.PRIMARY,
    },
    countryCode: {
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: THEME.BORDER_LIGHT,
        marginRight: 12,
    },
    countryCodeText: {
        fontSize: 18,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    loginButton: {
        width: "100%",
        height: 60,
        backgroundColor: THEME.PRIMARY,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    loginButtonDisabled: {
        backgroundColor: "#eee",
    },
    loginButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "800",
    },
    footerWrap: {
        marginTop: "auto",
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: THEME.TEXT_DARK_SECONDARY,
        textAlign: "center",
        lineHeight: 18,
    },
    footerLink: {
        fontWeight: "800",
        textDecorationLine: "underline",
    },
});
