import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
    X,
    CalendarDays,
    ArrowRightCircle,
    WalletCards,
    Banknote,
    AlertCircle
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { bookingsApi } from '../services/bookings.service';

interface ResolutionModalProps {
    visible: boolean;
    bookingId: string | null;
    onClose: () => void;
    onResolved: () => void;
}

export default function ResolutionModal({ visible, bookingId, onClose, onResolved }: ResolutionModalProps) {
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    const handleResolve = async (type: 'reschedule' | 'extend' | 'refund' | 'credits') => {
        if (!bookingId) return;

        // Mock getting a new date if reschedule/extend
        let newDate;
        if (type === 'reschedule' || type === 'extend') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            newDate = tomorrow.toISOString().split('T')[0]; // Simple mock
        }

        setLoading(true);
        try {
            const res = await bookingsApi.resolveMissedWalk(bookingId, type, newDate);
            if (res.success) {
                Alert.alert('Success', res.data?.message || 'Walk resolved successfully.');
                onResolved();
                onClose();
            } else {
                Alert.alert('Error', res.error?.message || 'Failed to resolve walk.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Network error occurred while resolving walk.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <BlurView intensity={isDark ? 80 : 40} tint={isDark ? "dark" : "light"} style={styles.container}>
                <View style={[styles.content, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <AlertCircle color="#ef4444" size={24} />
                            <Text style={[styles.title, { color: colors.text }]}>Resolve Missed Walk</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color={colors.text} size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Your provider reported missing this scheduled walk. Please select how you would like to proceed.
                    </Text>

                    <View style={styles.optionsList}>
                        <TouchableOpacity 
                            style={[styles.optionCard, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                            onPress={() => handleResolve('reschedule')}
                            disabled={loading}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <CalendarDays color="#3b82f6" size={24} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>Reschedule Walk</Text>
                                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Pick a new date and time for a make-up walk</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.optionCard, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                            onPress={() => handleResolve('extend')}
                            disabled={loading}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                                <ArrowRightCircle color="#a855f7" size={24} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>Extend Package</Text>
                                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Add the missed walk to the end of your package</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.optionCard, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                            onPress={() => handleResolve('credits')}
                            disabled={loading}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <WalletCards color="#10b981" size={24} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>Wallet Credits</Text>
                                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Instantly receive credits for future bookings</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.optionCard, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                            onPress={() => handleResolve('refund')}
                            disabled={loading}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Banknote color="#ef4444" size={24} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>Refund to Bank</Text>
                                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Receive money to original payment method (3-5 days)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
        minHeight: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    optionsList: {
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 13,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    }
});
