import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar
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
} from 'lucide-react-native';
import { notificationsApi, Notification } from '../services/notifications.service';
import { useTheme } from '../theme/ThemeContext';

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
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationsApi.list();
            if (response?.data?.notifications) {
                const mapped = response.data.notifications.map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    time: new Date(n.created_at).toLocaleDateString(),
                    icon: getIconForType(n.type),
                    color: getColorForType(n.type),
                    bgColor: getBgColorForType(n.type),
                    isNew: !n.is_read,
                }));
                setNotifications(mapped);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, isNew: boolean) => {
        if (!isNew) return;
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
        } catch(error) {
            console.error(error);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'booking': return Calendar;
            case 'payment': return CheckCircle2;
            case 'promo': return Gift;
            default: return Info;
        }
    };
    
    const getColorForType = (type: string) => {
        switch (type) {
            case 'booking': return '#14b8a6';
            case 'payment': return '#f97316';
            case 'promo': return '#ec4899';
            default: return '#3b82f6';
        }
    };
    
    const getBgColorForType = (type: string) => {
        switch (type) {
            case 'booking': return isDark ? 'rgba(20,184,166,0.1)' : '#f0fdfa';
            case 'payment': return isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed';
            case 'promo': return isDark ? 'rgba(236,72,153,0.1)' : '#fdf2f8';
            default: return isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff';
        }
    };

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10, backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                    <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: colors.primaryLight, borderColor: isDark ? colors.border : '#ccfbf1' }]}>
                        <Bell size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View style={{ padding: 80, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textMuted }]}>No notifications yet!</Text>
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {notifications.map((item: any) => (
                                <TouchableOpacity 
                                    key={item.id} 
                                    onPress={() => handleMarkAsRead(item.id, item.isNew)} 
                                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, item.isNew && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: item.isNew ? (isDark ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.8)') : item.bgColor }]}>
                                        <item.icon size={20} color={item.color} strokeWidth={2.5} />
                                    </View>

                                    <View style={styles.content}>
                                        <View style={styles.titleRow}>
                                            <Text style={[styles.title, { color: colors.textSecondary }, item.isNew && { color: colors.text }]}>{item.title}</Text>
                                            {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                                        </View>
                                        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                                        <View style={styles.timeRow}>
                                            <Calendar size={10} color={colors.textMuted} />
                                            <Text style={[styles.time, { color: colors.textMuted }]}>{item.time.toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <ChevronRight size={16} color={colors.borderSecondary} />
                                </TouchableOpacity>
                            ))}
                            <View style={styles.footer}>
                                <Text style={[styles.footerText, { color: colors.textMuted }]}>That's all for now!</Text>
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
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    headerActionBtn: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#f0fdfa',
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
        borderColor: '#f1f5f9',
        position: 'relative',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    cardNew: {
        borderColor: '#14b8a6',
        backgroundColor: '#f0fdfa',
    },
    newBadge: {
        backgroundColor: '#f97316',
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
        color: '#64748b',
    },
    titleNew: {
        color: '#0f172a',
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
        color: '#94a3b8',
        letterSpacing: 1.2,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '800',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
});
