import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import {
    Mail,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    KeyRound,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';

export default function ForgotPassword({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (val: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) return 'Email is required';
        if (!regex.test(val)) return 'Please enter a valid email';
        return '';
    };

    const handleReset = async () => {
        setError(null);
        setSuccess(null);

        const eErr = validateEmail(email);
        if (eErr) {
            setEmailError(eErr);
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setSuccess('Reset link sent! Please check your inbox.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceSecondary }]}>
                        <KeyRound size={40} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>No worries, we'll send you a link to reset your password.</Text>

                    <View style={styles.form}>
                        <View style={[
                            styles.inputContainer,
                            { backgroundColor: colors.surfaceSecondary },
                            emailError ? styles.inputError : undefined,
                            emailError ? { borderColor: colors.danger } : undefined
                        ]}>
                            <Mail size={20} color={emailError ? colors.danger : colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={(val) => { setEmail(val); setEmailError(''); }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        {error && (
                            <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
                                <AlertCircle size={18} color={colors.danger} />
                                <Text style={[styles.alertText, { color: colors.danger }]}>{error}</Text>
                            </View>
                        )}

                        {success && (
                            <View style={StyleSheet.flatten([styles.alertBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }])}>
                                <CheckCircle2 size={18} color={colors.primary} />
                                <Text style={StyleSheet.flatten([styles.alertText, { color: colors.primary }])}>{success}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={StyleSheet.flatten([styles.resetBtn, { backgroundColor: isDark ? colors.primary : '#1A1612' }, (isLoading || !!success) && [styles.resetBtnDisabled, { backgroundColor: colors.surfaceSecondary }]])}
                            onPress={handleReset}
                            disabled={isLoading || !!success}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.resetBtnText}>RESET PASSWORD</Text>
                                    <ArrowRight size={20} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.footer} onPress={() => navigation.goBack()}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Remembered password? <Text style={[styles.footerLink, { color: colors.primary }]}>Go back</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
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
        flex: 1,
        paddingHorizontal: 24,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFF9F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
    },
    iconBox: {
        width: 80,
        height: 80,
        backgroundColor: '#E0F5F0',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#1D9E86',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 10 },
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#7A5540',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    form: {
        width: '100%',
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9F5',
        borderRadius: 20,
        height: 64,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#fee2e2',
        backgroundColor: '#fffafb',
    },
    inputIcon: {
        marginRight: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1612',
    },
    errorText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#ef4444',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 12,
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#fffafb',
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    alertText: {
        flex: 1,
        fontSize: 13,
        color: '#ef4444',
        fontWeight: '600',
        lineHeight: 18,
    },
    successBox: {
        backgroundColor: '#FFF3EC',
        borderColor: '#ccfbf1',
    },
    successText: {
        color: '#FF7A3D',
    },
    resetBtn: {
        backgroundColor: '#1A1612',
        height: 64,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 10 },
    },
    resetBtnDisabled: {
        backgroundColor: '#F5E6D8',
        shadowOpacity: 0,
    },
    resetBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 14,
        color: '#7A5540',
        fontWeight: '500',
    },
    footerLink: {
        color: '#4f46e5',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
