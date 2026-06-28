import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CheckCircle2, AlertTriangle, Info, XCircle, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const globalAlertRef: {
    show?: (title: string, message?: string, buttons?: any[]) => void;
} = {};

const originalRNAlert = Alert.alert;
Alert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
    if (globalAlertRef.show) {
        globalAlertRef.show(title, message, buttons);
    } else {
        originalRNAlert(title, message, buttons, options);
    }
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { colors, isDark } = useTheme();
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<AlertOptions>({ title: '', message: '' });

    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const iconScaleAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        globalAlertRef.show = (title: string, message?: string, buttons?: any[]) => {
            const fullStr = `${title} ${message || ''}`.toLowerCase();
            let type: AlertType = 'info';

            if (fullStr.includes('error') || fullStr.includes('fail') || fullStr.includes('denied') || fullStr.includes('cannot') || fullStr.includes('invalid') || fullStr.includes('exception')) {
                type = 'error';
            } else if (fullStr.includes('success') || fullStr.includes('confirm') || fullStr.includes('paid') || fullStr.includes('released') || fullStr.includes('done') || fullStr.includes('✨') || fullStr.includes('🎉')) {
                type = 'success';
            } else if (fullStr.includes('warn') || fullStr.includes('require') || fullStr.includes('incomplete') || fullStr.includes('delete') || fullStr.includes('cancel')) {
                type = 'warning';
            }

            let confirmText = 'Got It';
            let cancelText: string | undefined = undefined;
            let onConfirm: (() => void) | undefined = undefined;
            let onCancel: (() => void) | undefined = undefined;

            if (buttons && buttons.length > 0) {
                if (buttons.length === 1) {
                    confirmText = buttons[0].text || 'OK';
                    onConfirm = buttons[0].onPress;
                } else {
                    const cancelBtn = buttons.find(b => b.style === 'cancel' || (b.text && b.text.toLowerCase() === 'cancel'));
                    const confirmBtn = buttons.find(b => b !== cancelBtn) || buttons[1];

                    if (cancelBtn) {
                        cancelText = cancelBtn.text || 'Cancel';
                        onCancel = cancelBtn.onPress;
                    }
                    if (confirmBtn) {
                        confirmText = confirmBtn.text || 'Confirm';
                        onConfirm = confirmBtn.onPress;
                    }
                }
            }

            showAlert({
                title,
                message: message || '',
                type,
                confirmText,
                cancelText,
                onConfirm,
                onCancel
            });
        };
        return () => {
            globalAlertRef.show = undefined;
        };
    }, []);

    const showAlert = (opts: AlertOptions) => {
        setOptions(opts);
        setVisible(true);
        scaleAnim.setValue(0.6);
        opacityAnim.setValue(0);
        backdropAnim.setValue(0);
        slideAnim.setValue(30);
        iconScaleAnim.setValue(0);

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 250,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 7,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.spring(iconScaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 120,
                delay: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const hideAlert = () => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 180,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.85,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
        });
    };

    const showSuccess = (title: string, message = '') => showAlert({ title, message, type: 'success' });
    const showError = (title: string, message = '') => showAlert({ title, message, type: 'error' });
    const showWarning = (title: string, message = '') => showAlert({ title, message, type: 'warning' });
    const showInfo = (title: string, message = '') => showAlert({ title, message, type: 'info' });

    const handleConfirm = () => {
        hideAlert();
        if (options.onConfirm) options.onConfirm();
    };

    const handleCancel = () => {
        hideAlert();
        if (options.onCancel) options.onCancel();
    };

    const type = options.type || 'info';

    const getIcon = () => {
        const size = 36;
        switch (type) {
            case 'success': return <CheckCircle2 size={size} color="#10B981" />;
            case 'error': return <XCircle size={size} color="#EF4444" />;
            case 'warning': return <AlertTriangle size={size} color="#F59E0B" />;
            default: return <Info size={size} color="#6366F1" />;
        }
    };

    const getGradientColors = (): [string, string] => {
        switch (type) {
            case 'success': return ['#10B981', '#059669'];
            case 'error': return ['#EF4444', '#DC2626'];
            case 'warning': return ['#F59E0B', '#D97706'];
            default: return ['#6366F1', '#8B5CF6'];
        }
    };

    const getIconBgColors = (): [string, string] => {
        switch (type) {
            case 'success': return ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.04)'];
            case 'error': return ['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)'];
            case 'warning': return ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)'];
            default: return ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.04)'];
        }
    };

    const getAccentGlow = (): string => {
        switch (type) {
            case 'success': return '#10B981';
            case 'error': return '#EF4444';
            case 'warning': return '#F59E0B';
            default: return '#6366F1';
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo, hideAlert }}>
            {children}
            <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
                <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                    <BlurView intensity={isDark ? 40 : 25} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={styles.backdropOverlay} />
                </Animated.View>

                <View style={styles.centeredContainer} pointerEvents="box-none">
                    <Animated.View style={[
                        styles.alertBox,
                        {
                            backgroundColor: isDark ? 'rgba(30,30,35,0.95)' : 'rgba(255,255,255,0.97)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim },
                            ],
                            opacity: opacityAnim,
                            shadowColor: getAccentGlow(),
                        }
                    ]}>
                        {/* Accent line at top */}
                        <LinearGradient
                            colors={getGradientColors()}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.accentLine}
                        />

                        {/* Icon */}
                        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScaleAnim }] }]}>
                            <LinearGradient
                                colors={getIconBgColors()}
                                style={styles.iconGradientBg}
                            />
                            {getIcon()}
                        </Animated.View>

                        {/* Title */}
                        <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                            {options.title}
                        </Text>

                        {/* Message */}
                        {!!options.message && (
                            <Text style={[styles.message, { color: isDark ? 'rgba(248,250,252,0.6)' : 'rgba(15,23,42,0.55)' }]}>
                                {options.message}
                            </Text>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            {!!options.cancelText && (
                                <TouchableOpacity
                                    style={[styles.btn, styles.cancelBtn, {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                    }]}
                                    onPress={handleCancel}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.btnText, { color: isDark ? 'rgba(248,250,252,0.7)' : 'rgba(15,23,42,0.6)' }]}>
                                        {options.cancelText}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.btn, styles.confirmBtn]}
                                onPress={handleConfirm}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={getGradientColors()}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                                <Text style={styles.confirmText}>{options.confirmText || 'Got It'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
    },
    alertBox: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 28,
        paddingTop: 0,
        paddingHorizontal: 24,
        paddingBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 16,
        overflow: 'hidden',
    },
    accentLine: {
        width: '100%',
        height: 4,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginBottom: 24,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    iconGradientBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: '500',
        paddingHorizontal: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cancelBtn: {
        borderWidth: 1,
    },
    confirmBtn: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
    },
    confirmText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
