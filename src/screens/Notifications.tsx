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
} from 'react-native';
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

const { width } = Dimensions.get('window');

interface NotificationsProps {
    navigation: any;
}

export default function Notifications({ navigation }: NotificationsProps) {
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
            case 'booking': return '#f0fdfa';
            case 'payment': return '#fff7ed';
            case 'promo': return '#fdf2f8';
            default: return '#eff6ff';
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <TouchableOpacity style={styles.headerActionBtn}>
                        <Bell size={20} color="#14b8a6" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#14b8a6" />
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>No notifications yet!</Text>
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {notifications.map((item) => (
                                <TouchableOpacity key={item.id} onPress={() => handleMarkAsRead(item.id, item.isNew)} style={[styles.card, item.isNew && styles.cardNew]}>
                                    {item.isNew && <View style={styles.newDot} />}

                                    <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                                        <item.icon size={20} color={item.color} />
                                    </View>

                                    <View style={styles.content}>
                                        <Text style={[styles.title, item.isNew && styles.titleNew]}>{item.title}</Text>
                                        <Text style={styles.message}>{item.message}</Text>
                                        <Text style={styles.time}>{item.time.toUpperCase()}</Text>
                                    </View>

                                    <ChevronRight size={16} color="#cbd5e1" />
                                </TouchableOpacity>
                            ))}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>That's all for now!</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },
    listContainer: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        position: 'relative',
        gap: 16,
    },
    cardNew: {
        borderColor: '#ccfbf1',
        backgroundColor: '#f0fdfa',
    },
    newDot: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f97316',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    titleNew: {
        color: '#0f172a',
    },
    message: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 18,
        fontWeight: '500',
    },
    time: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
        marginTop: 4,
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
});
