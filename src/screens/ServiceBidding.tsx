import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions,
    Animated,
    ActivityIndicator,
    Easing,
} from 'react-native';
import {
    ArrowLeft,
    Search,
    Filter,
    Star,
    ShieldCheck,
    Check,
    MessageSquare,
    TrendingUp,
    Info,
    Clock,
    MapPin,
    Zap,
    CreditCard,
    DollarSign,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { bookingsApi } from '../services/bookings.service';
import { useSocket } from '../hooks/useSocket';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface Bid {
    id: string;
    provider_id: string;
    provider_name: string;
    provider_image: string;
    rating: number;
    amount: number;
    eta: string;
    message: string;
    is_gold?: boolean;
    created_at?: string;
}

// Animated radar/search component
const SearchRadar = () => {
    const ring1 = useRef(new Animated.Value(0)).current;
    const ring2 = useRef(new Animated.Value(0)).current;
    const ring3 = useRef(new Animated.Value(0)).current;
    const opacity1 = useRef(new Animated.Value(1)).current;
    const opacity2 = useRef(new Animated.Value(1)).current;
    const opacity3 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animateRing = (scale: any, opacity: any, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 2, duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0, duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
                    ]),
                ])
            ).start();
        };

        animateRing(ring1, opacity1, 0);
        animateRing(ring2, opacity2, 1000);
        animateRing(ring3, opacity3, 2000);
    }, []);

    return (
        <View style={radarStyles.container}>
            <Animated.View style={[radarStyles.ring, { transform: [{ scale: ring1 }], opacity: opacity1 }]} />
            <Animated.View style={[radarStyles.ring, { transform: [{ scale: ring2 }], opacity: opacity2 }]} />
            <Animated.View style={[radarStyles.ring, { transform: [{ scale: ring3 }], opacity: opacity3 }]} />
            <View style={radarStyles.center}>
                <Search size={20} color="white" />
            </View>
        </View>
    );
};

const radarStyles = StyleSheet.create({
    container: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    ring: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255, 122, 61, 0.4)' },
    center: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF7A3D', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF7A3D', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10, zIndex: 10 },
});

// Bid card slide-in animation
const BidCard = ({ bid, index, onAccept, isLocking, lockingId }: {
    bid: Bid;
    index: number;
    onAccept: (bidId: string) => void;
    isLocking: boolean;
    lockingId: string | null;
}) => {
    const slideAnim = useRef(new Animated.Value(60)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 150,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isThisLocking = lockingId === bid.id;
    const isOtherLocking = lockingId !== null && lockingId !== bid.id;

    return (
        <Animated.View style={[{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
            <BlurView intensity={80} tint="light" style={styles.bidCardBlur}>
                <View style={[styles.bidCard, isThisLocking && styles.bidCardLocked]}>
                    {bid.is_gold && (
                        <LinearGradient
                            colors={['#1D9E86', '#34D399']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.goldBadge}
                        >
                            <Text style={styles.goldBadgeText}>TOP RATED</Text>
                        </LinearGradient>
                    )}

                    <View style={styles.bidHeader}>
                        <Image source={{ uri: bid.provider_image || 'https://i.pravatar.cc/100' }} style={styles.providerImage as any} />
                        <View style={styles.providerInfo}>
                            <View style={styles.providerNameRow}>
                                <Text style={styles.providerName}>{bid.provider_name}</Text>
                                <View style={styles.ratingBox}>
                                    <Star size={10} color="#1D9E86" fill="#1D9E86" />
                                    <Text style={styles.ratingText}>{bid.rating.toFixed(1)}</Text>
                                </View>
                            </View>
                            {bid.message ? (
                                <Text style={styles.bidMessage} numberOfLines={2}>"{bid.message}"</Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <DollarSign size={12} color="#FF7A3D" />
                            <Text style={styles.statLabel}>PRICE</Text>
                            <Text style={styles.statValue}>₹{bid.amount}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Clock size={12} color="#1D9E86" />
                            <Text style={styles.statLabel}>ETA</Text>
                            <Text style={styles.statValue}>{bid.eta}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <ShieldCheck size={12} color="#4f46e5" />
                            <Text style={styles.statLabel}>VERIFIED</Text>
                            <Text style={[styles.statValue, { color: '#4f46e5' }]}>Pro</Text>
                        </View>
                    </View>

                    <View style={styles.bidActions}>
                        <TouchableOpacity
                            onPress={() => onAccept(bid.id)}
                            disabled={isLocking}
                            style={[
                                styles.acceptBtn,
                                isThisLocking && styles.acceptBtnLocked,
                                isOtherLocking && styles.acceptBtnDisabled,
                            ]}
                        >
                            {isThisLocking ? (
                                <LinearGradient colors={['#FF7A3D', '#FF9D6C']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                            ) : (
                                <LinearGradient colors={['#1A1612', '#2D2824']} style={StyleSheet.absoluteFill} />
                            )}
                            {isThisLocking ? (
                                <>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={styles.acceptBtnText}>SELECTING...</Text>
                                </>
                            ) : (
                                <>
                                    <Check size={16} color="white" strokeWidth={3} />
                                    <Text style={styles.acceptBtnText}>SELECT BID</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.messageBtn}>
                            <MessageSquare size={18} color="#1A1612" />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

export default function ServiceBidding({ navigation, route }: any) {
    const bookingId = route?.params?.bookingId;
    const bookingAmount = route?.params?.totalAmount;
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLocking, setIsLocking] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(true);
    const [radiusKm, setRadiusKm] = useState(5);
    const { on, emit, isConnected } = useSocket();

    // Join booking room for real-time bid updates
    useEffect(() => {
        if (!bookingId || !isConnected) return;
        emit('join_booking', bookingId);
        return () => {
            emit('leave_booking', bookingId);
        };
    }, [bookingId, isConnected, emit]);

    // Listen for real-time bids via socket
    useEffect(() => {
        if (!bookingId) return;

        const unsubBid = on('BOOKING_BID_RECEIVED', (data: any) => {
            const b = data.bid;
            setIsSearching(false);
            setBids(prev => {
                // Avoid duplicates
                if (prev.find(existing => existing.id === b.id)) return prev;
                return [...prev, {
                    id: b.id,
                    provider_id: b.provider_id,
                    provider_name: b.provider_name || 'Provider',
                    provider_image: b.provider_image || `https://i.pravatar.cc/100?u=${b.provider_id}`,
                    rating: b.provider_rating || 5.0,
                    amount: b.amount,
                    eta: b.eta || '15 min',
                    message: b.message || '',
                    is_gold: b.provider_rating >= 4.8,
                    created_at: b.created_at,
                }];
            });
        });

        return () => {
            unsubBid();
        };
    }, [bookingId, on]);

    // Also poll bids from API as fallback and initial load
    useEffect(() => {
        if (!bookingId) return;

        const fetchBids = async () => {
            try {
                const res = await bookingsApi.getBids(bookingId);
                if (res.success && res.data?.bids && res.data.bids.length > 0) {
                    setIsSearching(false);
                    const formatted = res.data.bids.map((b: any) => ({
                        id: b.id,
                        provider_id: b.provider_id,
                        provider_name: b.provider?.business_name || b.provider?.user?.full_name || 'Provider',
                        provider_image: b.provider?.user?.avatar_url || `https://i.pravatar.cc/100?u=${b.provider_id}`,
                        rating: b.provider?.rating || 5.0,
                        amount: b.amount,
                        eta: b.eta || '15 min',
                        message: b.message || '',
                        is_gold: (b.provider?.rating || 0) >= 4.8,
                        created_at: b.created_at,
                    }));
                    setBids(formatted);
                }
            } catch (err) {
                console.error('Error polling bids:', err);
            }
        };

        fetchBids();
        const pollInterval = setInterval(fetchBids, 8000);
        return () => clearInterval(pollInterval);
    }, [bookingId]);

    // Simulate radius expansion display
    useEffect(() => {
        const expansionTimer = setInterval(() => {
            setRadiusKm(prev => {
                if (prev >= 20) return 20;
                const progression: Record<number, number> = { 5: 10, 10: 15, 15: 20 };
                return progression[prev] || prev;
            });
        }, 120000); // Every 2 minutes for instant, matches backend

        return () => clearInterval(expansionTimer);
    }, []);

    // Supabase realtime subscription as fallback
    useEffect(() => {
        if (!bookingId) return;

        const channel = supabase
            .channel(`bids_for_booking:${bookingId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'booking_bids',
                filter: `booking_id=eq.${bookingId}`
            }, () => {
                // Just re-fetch on new bid insert
                bookingsApi.getBids(bookingId).then(res => {
                    if (res.success && res.data?.bids) {
                        setIsSearching(false);
                        const formatted = res.data.bids.map((b: any) => ({
                            id: b.id,
                            provider_id: b.provider_id,
                            provider_name: b.provider?.business_name || b.provider?.user?.full_name || 'Provider',
                            provider_image: b.provider?.user?.avatar_url || `https://i.pravatar.cc/100?u=${b.provider_id}`,
                            rating: b.provider?.rating || 5.0,
                            amount: b.amount,
                            eta: b.eta || '15 min',
                            message: b.message || '',
                            is_gold: (b.provider?.rating || 0) >= 4.8,
                        }));
                        setBids(formatted);
                    }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [bookingId]);

    const handleAcceptBid = async (bidId: string) => {
        setIsLocking(bidId);
        try {
            const res = await bookingsApi.selectBid(bookingId, bidId);
            if (res.success) {
                // Navigate to payment / confirmation
                const selectedBid = bids.find(b => b.id === bidId);
                navigation.navigate('BookingFlow', {
                    serviceId: route?.params?.serviceId,
                    fromBidding: true,
                    bookingId,
                    selectedBid: selectedBid,
                    totalAmount: selectedBid?.amount,
                });
            }
        } catch (error: any) {
            alert(error.message || 'Failed to select bid');
            setIsLocking(null);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#1A1612" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>LIVE BIDDING</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.statusText}>
                                {isSearching ? `SEARCHING ${radiusKm}KM RADIUS` : `${bids.length} BIDS RECEIVED`}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.infoBtn}>
                        <Info size={18} color="#B09080" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isSearching && bids.length === 0 ? (
                        <View style={styles.searchingContainer}>
                            <SearchRadar />
                            <Text style={styles.searchingTitle}>Finding Experts</Text>
                            <Text style={styles.searchingSub}>
                                Broadcasting to professionals within {radiusKm}km...{'\n'}
                                Expanding radius progressively.
                            </Text>

                            {/* Radius expansion indicator */}
                            <View style={styles.radiusSteps}>
                                {[5, 10, 15, 20].map(r => (
                                    <View key={r} style={styles.radiusStep}>
                                        <View style={[
                                            styles.radiusDot,
                                            radiusKm >= r && styles.radiusDotActive
                                        ]} />
                                        <Text style={[
                                            styles.radiusLabel,
                                            radiusKm >= r && styles.radiusLabelActive
                                        ]}>{r}km</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.bidsContainer}>
                            <View style={styles.bidsHeader}>
                                <Text style={styles.bidsCount}>RECEIVED BIDS ({bids.length})</Text>
                                <TouchableOpacity style={styles.filterBtn}>
                                    <Text style={styles.filterText}>SORT BY PRICE</Text>
                                    <Filter size={12} color="#FF7A3D" />
                                </TouchableOpacity>
                            </View>

                            {bids.map((bid, index) => (
                                <BidCard
                                    key={bid.id}
                                    bid={bid}
                                    index={index}
                                    onAccept={handleAcceptBid}
                                    isLocking={isLocking !== null}
                                    lockingId={isLocking}
                                />
                            ))}

                            {isSearching && (
                                <View style={styles.stillSearching}>
                                    <ActivityIndicator size="small" color="#FF7A3D" />
                                    <Text style={styles.stillSearchingText}>
                                        Still searching {radiusKm}km radius for more bids...
                                    </Text>
                                </View>
                            )}

                            <View style={styles.infoCard}>
                                <View style={styles.infoIconBox}>
                                    <TrendingUp size={20} color="#FF7A3D" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoTitle}>Better prices coming?</Text>
                                    <Text style={styles.infoSub}>
                                        We're expanding the search radius (5→10→15→20km). More bids usually arrive in the first 5-10 minutes.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {isLocking && (
                    <View style={styles.persistenceBar}>
                        <LinearGradient
                            colors={['#FF7A3D', '#FF9D6C']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                        <View>
                            <Text style={styles.persistenceTitle}>BID SELECTED</Text>
                            <Text style={styles.persistenceSub}>Assigning provider & preparing payment...</Text>
                        </View>
                        <ActivityIndicator color="white" />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF9F5' },
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#FFF9F5',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
        borderWidth: 1, borderColor: '#F5E6D8', alignItems: 'center', justifyContent: 'center',
    },
    headerTitleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 12, fontWeight: '900', color: '#1A1612', letterSpacing: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF7A3D' },
    statusText: { fontSize: 9, fontWeight: 'bold', color: '#FF7A3D', letterSpacing: 0.5 },
    infoBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF9F5',
        alignItems: 'center', justifyContent: 'center',
    },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },

    // Searching state
    searchingContainer: { alignItems: 'center', paddingTop: 40 },
    searchingTitle: { fontSize: 22, fontWeight: '900', color: '#1A1612', marginBottom: 8 },
    searchingSub: {
        fontSize: 14, color: '#7A5540', textAlign: 'center', maxWidth: 280,
        lineHeight: 22, fontWeight: '500',
    },
    radiusSteps: {
        flexDirection: 'row', gap: 16, marginTop: 32,
        backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 16,
        borderRadius: 20, borderWidth: 1, borderColor: '#F5E6D8',
    },
    radiusStep: { alignItems: 'center', gap: 6 },
    radiusDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#F5E6D8',
    },
    radiusDotActive: { backgroundColor: '#FF7A3D' },
    radiusLabel: { fontSize: 10, fontWeight: '800', color: '#B09080' },
    radiusLabelActive: { color: '#FF7A3D' },

    // Bids
    bidsContainer: { gap: 20 },
    bidsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bidsCount: { fontSize: 10, fontWeight: '900', color: '#1A1612', letterSpacing: 1.5 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    filterText: { fontSize: 10, fontWeight: '900', color: '#FF7A3D', letterSpacing: 1 },

    bidCardBlur: {
        borderRadius: 32, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20,
        elevation: 4,
    },
    bidCard: {
        backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 32,
        padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
        position: 'relative', overflow: 'hidden',
    },
    bidCardLocked: { borderColor: '#FF7A3D', borderWidth: 2 },
    goldBadge: {
        position: 'absolute', top: 0, right: 0,
        paddingHorizontal: 16, paddingVertical: 6,
        borderBottomLeftRadius: 16,
    },
    goldBadgeText: { fontSize: 8, fontWeight: '900', color: 'white', letterSpacing: 1, fontStyle: 'italic' },
    bidHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    providerImage: {
        width: 56, height: 56, borderRadius: 18,
        borderWidth: 2, borderColor: 'white',
    },
    providerInfo: { flex: 1 },
    providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    providerName: { fontSize: 16, fontWeight: '900', color: '#1A1612' },
    ratingBox: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#E0F5F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    ratingText: { fontSize: 11, fontWeight: '900', color: '#1D9E86' },
    bidMessage: {
        fontSize: 12, color: '#7A5540', fontStyle: 'italic', fontWeight: '500', lineHeight: 18,
    },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    statBox: {
        flex: 1, backgroundColor: '#FFF9F5', borderRadius: 18, padding: 12,
        alignItems: 'center', gap: 4,
    },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#B09080', letterSpacing: 1 },
    statValue: { fontSize: 14, fontWeight: '900', color: '#1A1612' },
    bidActions: { flexDirection: 'row', gap: 10 },
    acceptBtn: {
        flex: 1, height: 52, borderRadius: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 },
    },
    acceptBtnLocked: {},
    acceptBtnDisabled: { opacity: 0.4 },
    acceptBtnText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    messageBtn: {
        width: 52, height: 52, backgroundColor: '#FFF9F5', borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#F5E6D8',
    },

    stillSearching: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16,
    },
    stillSearchingText: { fontSize: 12, color: '#B09080', fontWeight: '600' },

    infoCard: {
        flexDirection: 'row', backgroundColor: '#FFF9F5', borderRadius: 28,
        padding: 20, borderWidth: 2, borderColor: '#F5E6D8',
        borderStyle: 'dashed', gap: 14,
    },
    infoIconBox: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 },
    },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 13, fontWeight: '900', color: '#1A1612', marginBottom: 4 },
    infoSub: { fontSize: 11, color: '#7A5540', fontWeight: '500', lineHeight: 16 },

    persistenceBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 32, paddingVertical: 24,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden',
        shadowColor: '#FF7A3D', shadowOpacity: 0.3, shadowOffset: { width: 0, height: -10 },
    },
    persistenceTitle: { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
    persistenceSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
});
