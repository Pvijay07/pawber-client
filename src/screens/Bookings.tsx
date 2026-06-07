import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    
    Image,
    Dimensions,
    TextInput,
    FlatList,
    ActivityIndicator,
    Platform,
    StatusBar,
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
    Calendar,
    Clock,
    MapPin,
    Scissors,
    Stethoscope,
    ChevronRight,
    MoreVertical,
    FileText,
    AlertCircle,
    MessageSquare,
    RefreshCcw,
    XCircle,
    CheckCircle2,
    Search,
    Filter,
    Phone,
    Trash2,
    ShieldCheck,
} from 'lucide-react-native';
import { bookingsApi } from '../services/bookings.service';
import { Booking } from '../shared/types';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Bookings({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchBookings();
    }, [activeTab]);

    React.useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            console.log('📡 Listening for Booking updates for client:', user.id);
            
            const channel = supabase
                .channel(`client_bookings:${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${user.id}`
                }, (payload: any) => {
                    console.log('🔄 Booking change detected:', payload.eventType, payload.new?.status);
                    fetchBookings(); // Simple refresh for now to handle complex joins
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtime();
    }, []);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const statuses = activeTab === 'upcoming' 
                ? 'pending,confirmed,in_progress' 
                : 'completed,cancelled';
            
            const res = await bookingsApi.list({ status: statuses });
            if (res.success && res.data) {
                setBookings(res.data.bookings || []);
            }
        } catch (err) {
            console.error('Failed to load bookings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getServiceIconVisual = (serviceName: string) => {
        const name = (serviceName || '').toLowerCase();
        if (name.includes('groom')) return { icon: Scissors, color: 'rgba(29, 158, 134, 0.1)', iconColor: '#1D9E86' };
        if (name.includes('vet') || name.includes('medic')) return { icon: Stethoscope, color: 'rgba(255, 122, 61, 0.1)', iconColor: '#FF7A3D' };
        if (name.includes('walk')) return { icon: MapPin, color: 'rgba(139, 92, 246, 0.1)', iconColor: '#8b5cf6' };
        return { icon: Calendar, color: 'rgba(148, 163, 184, 0.1)', iconColor: '#94A3B8' };
    };

    const renderBookingItem = ({ item }: { item: Booking }) => {
        const serviceName = item.service?.name || 'Service';
        const visuals = getServiceIconVisual(serviceName);
        
        return (
            <BlurView intensity={80} tint="light" style={styles.bookingCardBlur}>
                <View style={StyleSheet.flatten([styles.bookingCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.5)' }])}>
                    <View style={styles.cardHeader}>
                        <View style={styles.serviceInfo}>
                            <View style={StyleSheet.flatten([styles.iconBox, { backgroundColor: visuals.color }])}>
                                <visuals.icon size={24} color={visuals.iconColor} />
                            </View>
                            <View>
                                <Text style={StyleSheet.flatten([styles.serviceText, { color: colors.text }])}>{serviceName}</Text>
                                <View style={styles.petRow}>
                                    <Text style={styles.petLabel}>REF: {item.id ? item.id.substring(0, 6) : 'Unknown'}</Text>
                                    <View style={StyleSheet.flatten([styles.dot, { backgroundColor: colors.borderSecondary }])} />
                                    <Text style={StyleSheet.flatten([styles.statusLabel, { color: colors.textSecondary }])}>{item.status.toUpperCase()}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.moreBtn}>
                            <MoreVertical size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardMeta}>
                        <View style={StyleSheet.flatten([styles.metaItem, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.5)' }])}>
                            <Calendar size={14} color="#64748B" />
                            <Text style={StyleSheet.flatten([styles.metaText, { color: '#64748B' }])}>
                                {item.booking_date 
                                    ? new Date(item.booking_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
                                    : 'TBD'}
                            </Text>
                        </View>
                        <View style={StyleSheet.flatten([styles.metaItem, { backgroundColor: 'rgba(79, 70, 229, 0.05)', borderColor: 'rgba(79, 70, 229, 0.1)' }])}>
                            <ShieldCheck size={14} color="#4f46e5" />
                            <Text style={StyleSheet.flatten([styles.metaText, { color: '#4f46e5' }])}>Escrow Protected</Text>
                        </View>
                    </View>

                    <View style={StyleSheet.flatten([styles.divider, { backgroundColor: 'rgba(245, 230, 216, 0.3)' }])} />

                    {activeTab === 'upcoming' ? (
                        <View style={styles.cardFooter}>
                            <View style={styles.securityBox}>
                                <View style={styles.securityHeader}>
                                    <Text style={styles.securityLabel}>FUNDS ESCROWED</Text>
                                    <Text style={styles.priceLabel}>₹{(item.total_amount || 0).toFixed(2)}</Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <LinearGradient
                                        colors={['#4f46e5', '#6366f1']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.flatten([styles.progressFill, { width: '100%' }])}
                                    />
                                </View>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.mainBtn}
                                    onPress={() => navigation.navigate('LiveTracking', { bookingId: item.id })}
                                >
                                    <LinearGradient
                                        colors={['#1A1612', '#2D2824']}
                                        style={StyleSheet.absoluteFill}
                                        borderRadius={18}
                                    />
                                    <Text style={styles.mainBtnText}>TRACK ORDER</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.chatBtn}
                                    onPress={() => navigation.navigate('Chat', { bookingId: item.id })}
                                >
                                    <BlurView intensity={20} tint="light" style={styles.chatBtnBlur}>
                                        <MessageSquare size={18} color="white" />
                                    </BlurView>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.pastFooter}>
                            <TouchableOpacity style={styles.rebookBtn}>
                                <RefreshCcw size={16} color="#4f46e5" />
                                <Text style={styles.rebookText}>REBOOK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rateBtn}>
                                <Text style={styles.rateText}>RATE PROVIDER</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </BlurView>
        );
    };

    return (
        <View style={StyleSheet.flatten([styles.safeArea, { backgroundColor: colors.background }])}>
            {/* Background Decorative Elements */}
            <View style={[styles.bgBlob, { top: -50, right: -50, backgroundColor: 'rgba(255, 122, 61, 0.08)' }]} />
            <View style={[styles.bgBlob, { bottom: 100, left: -80, backgroundColor: 'rgba(29, 158, 134, 0.05)' }]} />

            <View style={styles.container}>
                {/* Header */}
                <View style={StyleSheet.flatten([styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }])}>
                    <View style={styles.headerTop}>
                        <Text style={StyleSheet.flatten([styles.headerTitle, { color: colors.text }])}>My Bookings</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={StyleSheet.flatten([styles.roundBtn, { backgroundColor: 'white', borderColor: '#F1F5F9' }])}><Search size={20} color="#64748B" /></TouchableOpacity>
                            <TouchableOpacity style={StyleSheet.flatten([styles.roundBtn, { backgroundColor: 'white', borderColor: '#F1F5F9' }])}><Filter size={20} color="#64748B" /></TouchableOpacity>
                        </View>
                    </View>

                    <BlurView intensity={80} tint="light" style={styles.tabContainerBlur}>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                onPress={() => setActiveTab('upcoming')}
                                style={StyleSheet.flatten([styles.tab, activeTab === 'upcoming' && styles.activeTab])}
                            >
                                <Text style={StyleSheet.flatten([styles.tabText, activeTab === 'upcoming' && styles.activeTabText])}>UPCOMING</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setActiveTab('past')}
                                style={StyleSheet.flatten([styles.tab, activeTab === 'past' && styles.activeTab])}
                            >
                                <Text style={StyleSheet.flatten([styles.tabText, activeTab === 'past' && styles.activeTabText])}>PAST</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={bookings}
                            renderItem={renderBookingItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <View style={StyleSheet.flatten([styles.emptyIconBox, { backgroundColor: colors.surfaceSecondary }])}>
                                        <Calendar size={48} color={colors.borderSecondary} />
                                    </View>
                                    <Text style={StyleSheet.flatten([styles.emptyTitle, { color: colors.text }])}>No bookings yet</Text>
                                    <Text style={StyleSheet.flatten([styles.emptyDesc, { color: colors.textMuted }])}>Your {activeTab} bookings will appear here once you book a service.</Text>
                                </View>
                            }
                        />
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => navigation.navigate('BookingFlow')}
                        >
                            <LinearGradient
                                colors={[colors.primary, '#FF9D6C']}
                                style={StyleSheet.absoluteFill}
                                borderRadius={22}
                            />
                            <RefreshCcw size={24} color="white" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    bgBlob: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingBottom: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', gap: 12 },
    roundBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tabContainerBlur: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.7)', padding: 6 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
    activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 } },
    tabText: { fontSize: 10, fontWeight: '900', color: '#B09080', letterSpacing: 1 },
    activeTabText: { color: '#4f46e5' },
    listContent: { padding: 24, paddingTop: 0, gap: 16, paddingBottom: 100 },
    bookingCardBlur: { borderRadius: 32, overflow: 'hidden', elevation: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
    bookingCard: { padding: 24, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    serviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
    iconBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    serviceText: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
    petRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    petLabel: { fontSize: 11, fontWeight: '900', color: '#4f46e5', textTransform: 'uppercase' },
    dot: { width: 3, height: 3, borderRadius: 1.5 },
    statusLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    moreBtn: { padding: 4 },
    cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    metaText: { fontSize: 11, fontWeight: '900' },
    divider: { height: 1, marginBottom: 20 },
    cardFooter: { gap: 20 },
    securityBox: { backgroundColor: 'rgba(79, 70, 229, 0.05)', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.1)' },
    securityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    securityLabel: { fontSize: 9, fontWeight: '900', color: '#4f46e5', letterSpacing: 1 },
    priceLabel: { fontSize: 14, fontWeight: '900', color: '#4f46e5' },
    progressBar: { height: 6, backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: 3 },
    progressFill: { height: '100%', borderRadius: 3 },
    actionButtons: { flexDirection: 'row', gap: 12 },
    mainBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    mainBtnText: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    chatBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#3b82f6', overflow: 'hidden' },
    chatBtnBlur: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pastFooter: { flexDirection: 'row', gap: 12 },
    rebookBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: 16 },
    rebookText: { fontSize: 11, fontWeight: '900', color: '#4f46e5', letterSpacing: 0.5 },
    rateBtn: { flex: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 230, 216, 0.5)' },
    rateText: { fontSize: 11, fontWeight: '900', color: '#1A1612', letterSpacing: 0.5 },
    emptyState: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
    emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 12, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 15 }
});
