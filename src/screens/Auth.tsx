import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
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
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

interface AuthProps {
    navigation: any;
}

export default function Auth({ navigation }: AuthProps) {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

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

    const handleAuth = async () => {
        setError(null);
        setSuccess(null);


        const eErr = validateEmail(email);
        const pErr = validatePassword(password);

        if (eErr || pErr) {
            setEmailError(eErr);
            setPasswordError(pErr);
            return;
        }

        setIsLoading(true);
        try {
            const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
            if (mode === 'login') {
                const res = await fetch(`${API_BASE}/api/auth/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: 'client' }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body?.error?.message || body?.error || 'Login failed');
                // set client-side supabase session so app recognizes logged-in user
                const session = body?.data?.session || body?.session;
                if (!session?.access_token) throw new Error('No session returned from server');
                await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
            } else {
                const res = await fetch(`${API_BASE}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name: email.split('@')[0], role: 'client' }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body?.error?.message || body?.error || 'Signup failed');
                setSuccess('Account created! Please check your email for verification.');
                setTimeout(() => setMode('login'), 3000);
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
                    skipBrowserRedirect: false, // Set to false to allow browser redirect or handle via AuthSession
                }
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                
                if (result.type === 'success' && result.url) {
                    // Extract tokens from URL (Supabase appends them as fragments)
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
                        
                        // User is now logged in. The App.tsx listener will handle navigation.
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={StyleSheet.flatten([styles.container, { paddingTop: Math.max(insets.top, 20) + 20 }])}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <PawPrint size={32} color="white" />
                        </View>
                        <Text style={styles.title}>Pawber</Text>
                        <Text style={styles.subtitle}>Your pet's best friend</Text>
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            onPress={() => { setMode('login'); setError(null); }}
                            style={StyleSheet.flatten([styles.tab, mode === 'login' && styles.activeTab])}
                        >
                            <Text style={StyleSheet.flatten([styles.tabText, mode === 'login' && styles.activeTabText])}>LOGIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { setMode('signup'); setError(null); }}
                            style={StyleSheet.flatten([styles.tab, mode === 'signup' && styles.activeTab])}
                        >
                            <Text style={StyleSheet.flatten([styles.tabText, mode === 'signup' && styles.activeTabText])}>SIGN UP</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <View style={StyleSheet.flatten([styles.inputContainer, emailError ? styles.inputError : null])}>
                                <Mail size={18} color={emailError ? "#ef4444" : "#7A5540"} />
                                <TextInput
                                    placeholder="Email Address"
                                    style={styles.input}
                                    value={email}
                                    onChangeText={(val) => { setEmail(val); setEmailError(''); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#B09080"
                                />
                            </View>
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={StyleSheet.flatten([styles.inputContainer, passwordError ? styles.inputError : null])}>
                                <Lock size={18} color={passwordError ? "#ef4444" : "#7A5540"} />
                                <TextInput
                                    placeholder="Password"
                                    style={styles.input}
                                    value={password}
                                    onChangeText={(val) => { setPassword(val); setPasswordError(''); }}
                                    secureTextEntry
                                    placeholderTextColor="#B09080"
                                />
                            </View>
                            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                        </View>

                        {mode === 'login' && (
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
                            </TouchableOpacity>
                        )}

                        {error && (
                            <View style={styles.alertError}>
                                <AlertCircle size={16} color="#ef4444" />
                                <Text style={styles.alertText}>{error}</Text>
                            </View>
                        )}

                        {success && (
                            <View style={styles.alertSuccess}>
                                <CheckCircle2 size={16} color="#FF7A3D" />
                                <Text style={styles.alertText}>{success}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            disabled={isLoading}
                            onPress={handleAuth}
                            style={styles.submitBtn}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View style={styles.submitInner}>
                                    <Text style={styles.submitBtnText}>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    </Text>
                                    <ArrowRight size={18} color="white" />
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
                        style={styles.footer}
                        onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                    >
                        <Text style={styles.footerText}>
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                            <Text style={styles.footerAction}> {mode === 'login' ? "Sign Up" : "Log In"}</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#FF7A3D',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF7A3D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#7A5540',
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF9F5',
        padding: 6,
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#7A5540',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#1A1612',
    },
    form: {
        gap: 16,
        marginBottom: 32,
    },
    inputWrapper: {
        gap: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DEC9B5',
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 16,
        gap: 12,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1612',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 10,
        color: '#ef4444',
        fontWeight: 'bold',
        marginLeft: 4,
        letterSpacing: 0.5,
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
    alertError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    alertSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3EC',
        padding: 16,
        borderRadius: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: '#ccfbf1',
    },
    alertText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
        flex: 1,
    },
    submitBtn: {
        height: 56,
        backgroundColor: '#1A1612',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 4,
    },
    submitInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
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
        marginBottom: 32,
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
        backgroundColor: 'white',
    },
    socialBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: '#7A5540',
        fontWeight: '500',
    },
    footerAction: {
        color: '#FF7A3D',
        fontWeight: 'bold',
    },
});
