import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Bell,
    Calendar,
    CheckCircle2,
    Gift,
    Info,
    ChevronRight,
    AlertTriangle,
    CreditCard,
    Scissors,
    MapPin,
    MessageSquare,
    Star,
    ShieldAlert
} from 'lucide-react-native';
import { notificationsApi, Notification } from '../services/notifications.service';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToNotifications } from '../hooks/useSocket';

const { width } = Dimensions.get('window');

interface NotificationsProps {
    navigation: any;
}

export default function Notifications({ navigation }: NotificationsProps) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
        // Subscribe to real-time notification updates via socket
        const unsubscribe = subscribeToNotifications(() => {
            loadNotifications(true);
        });
        return () => { unsubscribe(); };
    }, []);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadNotifications = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await notificationsApi.list();
            if (response?.data?.notifications) {
                const mapped = response.data.notifications.map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    time: new Date(n.created_at).toLocaleDateString(),
                    icon: getIconForType(n.subcategory || n.type),
                    color: getColorForPriority(n.priority || 'normal'),
                    bgColor: getBgColorForPriority(n.priority || 'normal'),
                    isNew: !n.is_read,
                    data: (n as any).data || {},
                    rawType: n.type,
                    priority: n.priority || 'normal',
                }));
                setNotifications(mapped);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleItemPress = async (item: any) => {
        if (item.isNew) {
            try {
                await notificationsApi.markAsRead(item.id);
                setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isNew: false } : n));
            } catch(error) {
                console.error(error);
            }
        }

        const data = item.data;
        if (data?.type === 'booking' || item.rawType === 'booking' || data?.type === 'booking_accepted') {
            navigation.navigate('Main', { screen: 'BookingsTab' });
        } else if (data?.type === 'chat' || item.rawType === 'chat') {
            if (data.thread_id) {
                navigation.navigate('Chat', { threadId: data.thread_id });
            }
        } else if (data?.type === 'payment' || item.rawType === 'payment') {
            navigation.navigate('Main', { screen: 'WalletTab' });
        } else if (data?.bookingId) {
            navigation.navigate('LiveTracking', { bookingId: data.bookingId });
        }
    };

    const getIconForType = (subcat: string) => {
        switch (subcat) {
            case 'booking': return Calendar;
            case 'walking': return MapPin;
            case 'grooming': return Scissors;
            case 'payments':
            case 'earnings':
            case 'payment':
                return CreditCard;
            case 'communication':
            case 'chat':
                return MessageSquare;
            case 'reviews': return Star;
            case 'safety': return ShieldAlert;
            case 'promo': return Gift;
            default: return Info;
        }
    };
    
    const getColorForPriority = (priority: string) => {
        switch (priority) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'normal': return '#3b82f6';
            case 'low': return '#10b981';
            default: return '#3b82f6';
        }
    };
    
    const getBgColorForPriority = (priority: string) => {
        switch (priority) {
            case 'critical': return isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2';
            case 'high': return isDark ? 'rgba(249, 115, 22, 0.15)' : '#ffedd5';
            case 'normal': return isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe';
            case 'low': return isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5';
            default: return isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff';
        }
    };

    return (
        <View style={StyleSheet.flatten([styles.safeArea, { backgroundColor: colors.background }])}>
            <View style={styles.container}>
                {/* Header */}
                <View style={StyleSheet.flatten([styles.header, { paddingTop: Math.max(insets.top, 20) + 10, backgroundColor: colors.surface }])}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={StyleSheet.flatten([styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }])}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={StyleSheet.flatten([styles.headerTitle, { color: colors.text }])}>Notifications</Text>
                    <TouchableOpacity style={StyleSheet.flatten([styles.headerActionBtn, { backgroundColor: colors.primaryLight, borderColor: isDark ? colors.border : '#ccfbf1' }])}>
                        <Bell size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadNotifications(true)} colors={[colors.primary]} />
                    }
                >
                    {isLoading ? (
                        <View style={{ padding: 80, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.footer}>
                            <Text style={StyleSheet.flatten([styles.footerText, { color: colors.textMuted }])}>No notifications yet!</Text>
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {notifications.map((item: any) => (
                                <TouchableOpacity 
                                    key={item.id} 
                                    onPress={() => handleItemPress(item)} 
                                    style={StyleSheet.flatten([
                                        styles.card, 
                                        { backgroundColor: colors.surface, borderColor: colors.border }, 
                                        item.isNew && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                                        { borderLeftWidth: 4, borderLeftColor: item.color }
                                    ])}
                                >
                                    <View style={StyleSheet.flatten([styles.iconBox, { backgroundColor: item.isNew ? (isDark ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.8)') : item.bgColor }])}>
                                        <item.icon size={20} color={item.color} strokeWidth={2.5} />
                                    </View>

                                    <View style={styles.content}>
                                        <View style={styles.titleRow}>
                                            <Text style={StyleSheet.flatten([styles.title, { color: colors.textSecondary }, item.isNew && { color: colors.text }])}>{item.title}</Text>
                                            {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                                        </View>
                                        <Text style={StyleSheet.flatten([styles.message, { color: colors.textSecondary }])} numberOfLines={2}>{item.message}</Text>
                                        <View style={styles.timeRow}>
                                            <Calendar size={10} color={colors.textMuted} />
                                            <Text style={StyleSheet.flatten([styles.time, { color: colors.textMuted }])}>{item.time.toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <ChevronRight size={16} color={colors.borderSecondary} />
                                </TouchableOpacity>
                            ))}
                            <View style={styles.footer}>
                                <Text style={StyleSheet.flatten([styles.footerText, { color: colors.textMuted }])}>That's all for now!</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: 'white',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
        elevation: 3,
        zIndex: 10,
    },
    backBtn: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#FFF9F5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#1A1612',
        letterSpacing: -0.5,
    },
    headerActionBtn: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#FFF3EC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ccfbf1',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 40,
    },
    listContainer: {
        gap: 18,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#F5E6D8',
        position: 'relative',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    cardNew: {
        borderColor: '#FF7A3D',
        backgroundColor: '#FFF3EC',
    },
    newBadge: {
        backgroundColor: '#1D9E86',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    newBadgeText: {
        color: 'white',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        color: '#7A5540',
    },
    titleNew: {
        color: '#1A1612',
    },
    message: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 19,
        fontWeight: '600',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    time: {
        fontSize: 9,
        fontWeight: '900',
        color: '#B09080',
        letterSpacing: 1.2,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#B09080',
        fontWeight: '800',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
});
