import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions,
    TextInput,
    FlatList,
    ActivityIndicator,
} from 'react-native';
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

const { width } = Dimensions.get('window');

export default function Bookings({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchBookings();
    }, [activeTab]);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            // 'upcoming' status maps conceptually. If 'past' you probably want 'completed', 'cancelled'
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
        if (name.includes('groom')) return { icon: Scissors, color: '#fff7ed', iconColor: '#f97316' };
        if (name.includes('vet') || name.includes('medic')) return { icon: Stethoscope, color: '#f0fdfa', iconColor: '#14b8a6' };
        if (name.includes('walk')) return { icon: MapPin, color: '#f5f3ff', iconColor: '#8b5cf6' };
        return { icon: Calendar, color: '#f8fafc', iconColor: '#64748b' };
    };

    const renderBookingItem = ({ item }: { item: Booking }) => {
        // Fallback for mock-like data mapping since backend might differ in output mapping depending on relationships pulled.
        const serviceName = (item as any).services?.name || 'Service';
        const visuals = getServiceIconVisual(serviceName);
        
        return (
            <View style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.serviceInfo}>
                        <View style={[styles.iconBox, { backgroundColor: visuals.color }]}>
                            <visuals.icon size={24} color={visuals.iconColor} />
                        </View>
                        <View>
                            <Text style={styles.serviceText}>{serviceName}</Text>
                            <View style={styles.petRow}>
                                <Text style={styles.petLabel}>REF: {item.id ? item.id.substring(0, 6) : 'Unknown'}</Text>
                                <View style={styles.dot} />
                                <Text style={styles.statusLabel}>{item.status.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.moreBtn}>
                        <MoreVertical size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Calendar size={14} color="#64748b" />
                        <Text style={styles.metaText}>
                            {item.booking_date 
                                ? new Date(item.booking_date).toLocaleDateString() 
                                : 'TBD'}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <ShieldCheck size={14} color="#4f46e5" />
                        <Text style={[styles.metaText, { color: '#4f46e5' }]}>Escrow Held</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {activeTab === 'upcoming' ? (
                    <View style={styles.cardFooter}>
                        <View style={styles.securityBox}>
                            <View style={styles.securityHeader}>
                                <Text style={styles.securityLabel}>PAYMENT SECURITY</Text>
                                <Text style={styles.priceLabel}>₹{(item.total_amount || 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: '65%' }]} />
                            </View>
                            <Text style={styles.securityDesc}>Funds held safely in escrow.</Text>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.mainBtn}
                                onPress={() => navigation.navigate('LiveTracking')}
                            >
                                <Text style={styles.mainBtnText}>TRACK NOW</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.chatBtn}
                                onPress={() => navigation.navigate('Chat')}
                            >
                                <MessageSquare size={18} color="white" />
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
                            <Text style={styles.rateText}>RATE</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>Bookings</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.roundBtn}><Search size={20} color="#64748b" /></TouchableOpacity>
                            <TouchableOpacity style={styles.roundBtn}><Filter size={20} color="#64748b" /></TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('upcoming')}
                            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>UPCOMING</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('past')}
                            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>PAST</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderBookingItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconBox}>
                                    <Calendar size={48} color="#cbd5e1" />
                                </View>
                                <Text style={styles.emptyTitle}>No bookings yet</Text>
                                <Text style={styles.emptyDesc}>Your {activeTab} bookings will appear here once you book a service.</Text>
                            </View>
                        }
                    />
                )}

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('BookingFlow')}
                >
                    <RefreshCcw size={24} color="white" />
                </TouchableOpacity>
            </View>
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
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    roundBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 6,
        borderRadius: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
    },
    tabText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#4f46e5',
    },
    listContent: {
        padding: 24,
        paddingTop: 0,
        gap: 16,
    },
    bookingCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 10 },
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    petRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    petLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#4f46e5',
        textTransform: 'uppercase',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#cbd5e1',
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
    },
    moreBtn: {
        padding: 4,
    },
    cardMeta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    metaText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 20,
    },
    cardFooter: {
        gap: 20,
    },
    securityBox: {
        backgroundColor: '#f5f3ff',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#ede9fe',
    },
    securityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    securityLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#4f46e5',
        letterSpacing: 1,
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4f46e5',
        borderRadius: 3,
    },
    securityDesc: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    mainBtn: {
        flex: 1,
        height: 56,
        backgroundColor: '#0f172a',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
    },
    mainBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    chatBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
    },
    pastFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    rebookBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        backgroundColor: '#f5f3ff',
        borderRadius: 16,
    },
    rebookText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#4f46e5',
        letterSpacing: 0.5,
    },
    rateBtn: {
        flex: 1,
        height: 52,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    rateText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 0.5,
    },
    emptyState: {
        paddingVertical: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
    },
    emptyDesc: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 10 },
    },
});
