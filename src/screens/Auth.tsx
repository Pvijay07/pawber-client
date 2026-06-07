import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Modal,
    FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
    Mail,
    Lock,
    ArrowRight,
    Github,
    Chrome,
    AlertCircle,
    CheckCircle2,
    PawPrint,
    ChevronLeft,
    ChevronDown,
    Phone,
    Clock,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

interface AuthProps {
    navigation: any;
}

const COUNTRIES = [
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
];

export default function Auth({ navigation }: AuthProps) {
    const insets = useSafeAreaInsets();
    
    // Auth mode & method
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    
    // Phone state
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [countryModalVisible, setCountryModalVisible] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(60);
    
    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    
    // General UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Validation state
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [nameError, setNameError] = useState('');

    // OTP refs
    const otpRefs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];

    // OTP Timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (otpSent && otpCountdown > 0) {
            timer = setTimeout(() => {
                setOtpCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [otpSent, otpCountdown]);

    const handleSendOTP = async () => {
        setError(null);
        setSuccess(null);
        setPhoneError('');

        if (!phone || phone.trim().length < 8) {
            setPhoneError('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        try {
            const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://pawber.onrender.com';
            const fullPhone = `${selectedCountry.code}${phone.replace(/\D/g, '')}`;
            const res = await fetch(`${API_BASE}/api/auth/phone/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, role: 'client' }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.error?.message || body?.error || 'Failed to send OTP');
            
            const otpCodeReceived = body?.data?.otp || body?.otp;
            setOtpSent(true);
            setOtpCountdown(60);
            setSuccess(`Verification code sent! (Your OTP is: ${otpCodeReceived})`);
        } catch (err: any) {
            setPhoneError(err.message || 'An error occurred while sending OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setError(null);
        setSuccess(null);
        const enteredOtp = otpCode.join('');

        if (enteredOtp.length < 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://pawber.onrender.com';
            const fullPhone = `${selectedCountry.code}${phone.replace(/\D/g, '')}`;
            const res = await fetch(`${API_BASE}/api/auth/phone/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, code: enteredOtp, role: 'client' }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.error?.message || body?.error || 'Verification failed');
            
            const session = body?.data?.session || body?.session;
            if (!session?.access_token) throw new Error('No session returned from server');
            
            // Set session on supabase client
            await supabase.auth.setSession({ 
                access_token: session.access_token, 
                refresh_token: session.refresh_token 
            });
        } catch (err: any) {
            setError(err.message || 'An error occurred during verification');
        } finally {
            setIsLoading(false);
        }
    };

    const validateEmail = (val: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) return 'Email is required';
        if (!regex.test(val)) return 'Please enter a valid email';
        return '';
    };

    const validatePassword = (val: string) => {
        if (!val) return 'Password is required';
        if (val.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const handleEmailAuth = async () => {
        setError(null);
        setSuccess(null);
        setEmailError('');
        setPasswordError('');
        setNameError('');

        const eErr = validateEmail(email);
        const pErr = validatePassword(password);
        const nErr = mode === 'signup' && !fullName.trim() ? 'Full name is required' : '';

        if (eErr || pErr || nErr) {
            setEmailError(eErr);
            setPasswordError(pErr);
            if (nErr) setNameError(nErr);
            return;
        }

        setIsLoading(true);
        try {
            const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://pawber.onrender.com';
            if (mode === 'login') {
                const res = await fetch(`${API_BASE}/api/auth/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: 'client' }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body?.error?.message || body?.error || 'Login failed');
                
                const session = body?.data?.session || body?.session;
                if (!session?.access_token) throw new Error('No session returned from server');
                await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
            } else {
                const res = await fetch(`${API_BASE}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name: fullName, role: 'client' }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body?.error?.message || body?.error || 'Signup failed');
                
                setSuccess('Account created! Please check your email for verification.');
                setTimeout(() => {
                    setMode('login');
                    setAuthMethod('email');
                }, 3000);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        try {
            setIsLoading(true);
            setError(null);

            const redirectUrl = Linking.createURL('/auth/callback');
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: false,
                }
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                
                if (result.type === 'success' && result.url) {
                    const getParam = (str: string, label: string) => {
                        const match = str.match(new RegExp(`[#&?]${label}=([^&]+)`));
                        return match ? decodeURIComponent(match[1]) : null;
                    };

                    const access_token = getParam(result.url, 'access_token');
                    const refresh_token = getParam(result.url, 'refresh_token');

                    if (access_token && refresh_token) {
                        const { error: sessionError } = await supabase.auth.setSession({ 
                            access_token, 
                            refresh_token 
                        });
                        
                        if (sessionError) throw sessionError;
                    } else {
                        throw new Error('Authentication failed: No tokens received');
                    }
                }
            }
        } catch (err: any) {
            console.error(`OAuth error (${provider}):`, err);
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otpCode];
        newOtp[index] = text;
        setOtpCode(newOtp);

        if (text && index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    const handleOtpKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    const renderCountryItem = ({ item }: { item: typeof COUNTRIES[0] }) => (
        <TouchableOpacity 
            style={styles.countryItem} 
            onPress={() => {
                setSelectedCountry(item);
                setCountryModalVisible(false);
            }}
        >
            <Text style={styles.countryFlagText}>{item.flag}</Text>
            <Text style={styles.countryNameText}>{item.name}</Text>
            <Text style={styles.countryCodeText}>{item.code}</Text>
        </TouchableOpacity>
    );

    const isPhoneValid = phone.trim().length >= 8;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF9F5" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={StyleSheet.flatten([
                        styles.container, 
                        { paddingTop: Math.max(insets.top, 20) + 10 }
                    ])}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header: Back Button & Logo */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => {
                                if (otpSent) {
                                    setOtpSent(false);
                                    setError(null);
                                } else if (authMethod === 'email') {
                                    setAuthMethod('phone');
                                    setError(null);
                                } else {
                                    navigation.goBack();
                                }
                            }}
                            style={styles.backBtn}
                        >
                            <ChevronLeft size={24} color="#1A1612" />
                        </TouchableOpacity>

                        <View style={styles.logoWrapper}>
                            <PawPrint size={18} color="#FF7A3D" style={styles.logoIcon} />
                            <Text style={styles.logoText}>
                                paw<Text style={styles.logoAccent}>ber</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Notification Alerts */}
                    {error && (
                        <View style={styles.alertError}>
                            <AlertCircle size={16} color="#ef4444" />
                            <Text style={styles.alertText}>{error}</Text>
                        </View>
                    )}
                    {success && (
                        <View style={styles.alertSuccess}>
                            <CheckCircle2 size={16} color="#1D9E86" />
                            <Text style={styles.alertText}>{success}</Text>
                        </View>
                    )}

                    {/* Dynamic Auth Views */}
                    {authMethod === 'phone' ? (
                        !otpSent ? (
                            /* 1. Phone Input View */
                            <View style={styles.contentBody}>
                                <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                                <Text style={styles.welcomeSubtitle}>Access your account through your phone number</Text>

                                <View style={styles.inputSection}>
                                    <Text style={styles.inputLabel}>Enter Your Phone Number</Text>
                                    <View style={StyleSheet.flatten([
                                        styles.phoneInputContainer,
                                        phoneError ? styles.inputErrorBorder : null
                                    ])}>
                                        <TouchableOpacity 
                                            style={styles.countryPicker}
                                            onPress={() => setCountryModalVisible(true)}
                                        >
                                            <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                                            <ChevronDown size={14} color="#7A5540" />
                                        </TouchableOpacity>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.phoneCodePrefix}>{selectedCountry.code}</Text>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="EX: 3834 3939 393"
                                            placeholderTextColor="#B09080"
                                            keyboardType="phone-pad"
                                            value={phone}
                                            onChangeText={(val) => {
                                                setPhone(val);
                                                setPhoneError('');
                                            }}
                                        />
                                    </View>
                                    {phoneError ? <Text style={styles.fieldErrorText}>{phoneError}</Text> : null}
                                </View>

                                <TouchableOpacity 
                                    style={StyleSheet.flatten([
                                        styles.continueBtn,
                                        !isPhoneValid ? styles.continueBtnDisabled : null
                                    ])}
                                    onPress={handleSendOTP}
                                    disabled={isLoading || !isPhoneValid}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.continueBtnText}>Continue</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.toggleAuthBtn}
                                    onPress={() => {
                                        setAuthMethod('email');
                                        setError(null);
                                    }}
                                >
                                    <Text style={styles.toggleAuthText}>Sign in with Email Address</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* 2. OTP Verification View */
                            <View style={styles.contentBody}>
                                <Text style={styles.welcomeTitle}>Enter Code</Text>
                                <Text style={styles.welcomeSubtitle}>
                                    We've sent a 6-digit verification code to {selectedCountry.code} {phone}
                                </Text>

                                <View style={styles.otpGridContainer}>
                                    <View style={styles.otpGrid}>
                                        {otpCode.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={otpRefs[index]}
                                                style={styles.otpInput}
                                                maxLength={1}
                                                keyboardType="number-pad"
                                                value={digit}
                                                onChangeText={(text) => handleOtpChange(text, index)}
                                                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                                                selectTextOnFocus
                                            />
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={styles.continueBtn}
                                    onPress={handleVerifyOTP}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.continueBtnText}>Verify & Continue</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.resendContainer}>
                                    <Clock size={16} color="#B09080" />
                                    {otpCountdown > 0 ? (
                                        <Text style={styles.resendText}>Resend code in 00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}</Text>
                                    ) : (
                                        <TouchableOpacity onPress={handleSendOTP}>
                                            <Text style={styles.resendLinkText}>Resend OTP Code</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )
                    ) : (
                        /* 3. Traditional Email Login/Signup View */
                        <View style={styles.contentBody}>
                            <Text style={styles.welcomeTitle}>
                                {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
                            </Text>
                            <Text style={styles.welcomeSubtitle}>
                                {mode === 'login' 
                                    ? 'Access your account using your email address' 
                                    : 'Sign up to start booking premium pet services'
                                }
                            </Text>

                            <View style={styles.formContainer}>
                                {mode === 'signup' && (
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>Full Name</Text>
                                        <View style={StyleSheet.flatten([
                                            styles.emailInputContainer,
                                            nameError ? styles.inputErrorBorder : null
                                        ])}>
                                            <TextInput
                                                placeholder="John Doe"
                                                placeholderTextColor="#B09080"
                                                style={styles.emailInput}
                                                value={fullName}
                                                onChangeText={(val) => {
                                                    setFullName(val);
                                                    setNameError('');
                                                }}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                        {nameError ? <Text style={styles.fieldErrorText}>{nameError}</Text> : null}
                                    </View>
                                )}

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <View style={StyleSheet.flatten([
                                        styles.emailInputContainer,
                                        emailError ? styles.inputErrorBorder : null
                                    ])}>
                                        <Mail size={16} color="#B09080" />
                                        <TextInput
                                            placeholder="sarah@example.com"
                                            placeholderTextColor="#B09080"
                                            style={styles.emailInput}
                                            value={email}
                                            onChangeText={(val) => {
                                                setEmail(val);
                                                setEmailError('');
                                            }}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={StyleSheet.flatten([
                                        styles.emailInputContainer,
                                        passwordError ? styles.inputErrorBorder : null
                                    ])}>
                                        <Lock size={16} color="#B09080" />
                                        <TextInput
                                            placeholder="••••••••"
                                            placeholderTextColor="#B09080"
                                            style={styles.emailInput}
                                            value={password}
                                            onChangeText={(val) => {
                                                setPassword(val);
                                                setPasswordError('');
                                            }}
                                            secureTextEntry
                                        />
                                    </View>
                                    {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
                                </View>

                                {mode === 'login' && (
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('ForgotPassword')} 
                                        style={styles.forgotBtn}
                                    >
                                        <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity 
                                    style={styles.continueBtn}
                                    onPress={handleEmailAuth}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <View style={styles.btnInner}>
                                            <Text style={styles.continueBtnText}>
                                                {mode === 'login' ? 'Sign In' : 'Create Account'}
                                            </Text>
                                            <ArrowRight size={16} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.dividerText}>SOCIAL CONNECT</Text>
                                <View style={styles.line} />
                            </View>

                            <View style={styles.socialGrid}>
                                <TouchableOpacity onPress={() => handleOAuth('google')} style={styles.socialBtn}>
                                    <Chrome size={18} color="#ef4444" />
                                    <Text style={styles.socialBtnText}>Google</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleOAuth('github')} style={styles.socialBtn}>
                                    <Github size={18} color="#1A1612" />
                                    <Text style={styles.socialBtnText}>Github</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.toggleAuthBtn}
                                onPress={() => {
                                    setAuthMethod('phone');
                                    setError(null);
                                }}
                            >
                                <Text style={styles.toggleAuthText}>Sign in with Phone Number</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Bottom Toggler for Login / Signup */}
                    {!otpSent && (
                        <TouchableOpacity
                            style={styles.footer}
                            onPress={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError(null);
                            }}
                        >
                            <Text style={styles.footerText}>
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                <Text style={styles.footerAction}> {mode === 'login' ? "Signup" : "Login"}</Text>
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Country Selector Modal */}
            <Modal
                visible={countryModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={COUNTRIES}
                            keyExtractor={(item) => item.code}
                            renderItem={renderCountryItem}
                            ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF9F5', // Snow from brand guide
    },
    container: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 36,
        height: 48,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F5E6D8', // Linen
        shadowColor: '#1A1612',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    logoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    logoIcon: {
        marginRight: 6,
    },
    logoText: {
        fontFamily: Platform.OS === 'ios' ? 'Nunito-Black' : 'System',
        fontWeight: '900',
        fontSize: 16,
        color: '#1A1612', // Noir
        letterSpacing: -0.5,
    },
    logoAccent: {
        color: '#FF7A3D', // Warm Orange
    },
    contentBody: {
        flex: 1,
    },
    welcomeTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Nunito-Black' : 'System',
        fontWeight: '900',
        fontSize: 28,
        color: '#1A1612',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'System',
        fontSize: 14,
        color: '#7A5540', // Umber
        marginBottom: 32,
        lineHeight: 20,
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'System',
        fontWeight: '600',
        fontSize: 12,
        color: '#7A5540',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DEC9B5', // Sand
        height: 56,
        paddingHorizontal: 16,
    },
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingRight: 8,
    },
    flagText: {
        fontSize: 20,
    },
    dividerLine: {
        width: 1,
        height: 24,
        backgroundColor: '#DEC9B5',
        marginHorizontal: 12,
    },
    phoneCodePrefix: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1612',
        marginRight: 6,
    },
    phoneInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1A1612',
    },
    inputErrorBorder: {
        borderColor: '#ef4444',
    },
    fieldErrorText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ef4444',
        marginTop: 6,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    continueBtn: {
        height: 56,
        backgroundColor: '#1A1612', // Noir (active button in mockup)
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 4,
        marginTop: 8,
    },
    continueBtnDisabled: {
        backgroundColor: '#F5E6D8', // Linen
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleAuthBtn: {
        alignItems: 'center',
        marginTop: 24,
        paddingVertical: 8,
    },
    toggleAuthText: {
        fontSize: 14,
        color: '#FF7A3D', // Warm Orange
        fontWeight: 'bold',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
    },
    resendText: {
        fontSize: 14,
        color: '#7A5540',
        fontWeight: '500',
    },
    resendLinkText: {
        fontSize: 14,
        color: '#FF7A3D',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    otpGridContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    otpGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    otpInput: {
        width: 44,
        height: 54,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DEC9B5',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    formContainer: {
        gap: 16,
        marginBottom: 20,
    },
    inputWrapper: {
        gap: 6,
    },
    emailInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DEC9B5',
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 16,
        gap: 12,
    },
    emailInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1612',
        fontWeight: '500',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FF7A3D',
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#F5E6D8',
    },
    dividerText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#B09080',
        letterSpacing: 2,
    },
    socialGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F5E6D8',
        backgroundColor: '#FFFFFF',
    },
    socialBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 14,
        color: '#7A5540',
        fontWeight: '500',
    },
    footerAction: {
        color: '#FF7A3D',
        fontWeight: 'bold',
    },
    alertError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 14,
        borderRadius: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: '#fee2e2',
        marginBottom: 20,
    },
    alertSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F5F0', // Mint
        padding: 14,
        borderRadius: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: '#ccfbf1',
        marginBottom: 20,
    },
    alertText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
        flex: 1,
        lineHeight: 16,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(26, 22, 18, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderColor: '#F5E6D8',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    modalCloseText: {
        fontSize: 14,
        color: '#FF7A3D',
        fontWeight: 'bold',
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    countryFlagText: {
        fontSize: 24,
        marginRight: 16,
    },
    countryNameText: {
        flex: 1,
        fontSize: 15,
        color: '#1A1612',
        fontWeight: '500',
    },
    countryCodeText: {
        fontSize: 15,
        color: '#7A5540',
        fontWeight: 'bold',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#FFF9F5',
    },
});

