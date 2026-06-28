import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    ActivityIndicator,
    Easing,
    Alert
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
    DollarSign,
    Trash2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { bookingsApi, api } from '../services';
import { useSocket } from '../hooks/useSocket';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import { useAlert } from '../components/CustomAlertModal';

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
    const { colors } = useTheme();
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
            <Animated.View style={[radarStyles.ring, { borderColor: colors.primaryLight, transform: [{ scale: ring1 }], opacity: opacity1 }]} />
            <Animated.View style={[radarStyles.ring, { borderColor: colors.primaryLight, transform: [{ scale: ring2 }], opacity: opacity2 }]} />
            <Animated.View style={[radarStyles.ring, { borderColor: colors.primaryLight, transform: [{ scale: ring3 }], opacity: opacity3 }]} />
            <View style={[radarStyles.center, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                <Search size={20} color="white" />
            </View>
        </View>
    );
};

const radarStyles = StyleSheet.create({
    container: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    ring: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2 },
    center: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10, zIndex: 10 },
});

// Bid card slide-in animation
const BidCard = ({ bid, index, onAccept, onChat, onProfilePress, isLocking, lockingId }: {
    bid: Bid;
    index: number;
    onAccept: (bidId: string) => void;
    onChat: (providerId: string, bidObj?: any) => void;
    onProfilePress: () => void;
    isLocking: boolean;
    lockingId: string | null;
}) => {
    const { colors, isDark } = useTheme();
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
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.bidCardBlur}>
                <View style={[
                    styles.bidCard, 
                    { backgroundColor: isDark ? 'rgba(42,29,21,0.85)' : 'rgba(255,255,255,0.85)', borderColor: colors.border },
                    isThisLocking && [styles.bidCardLocked, { borderColor: colors.primary }]
                ]}>
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

                    <TouchableOpacity 
                        style={styles.bidHeader}
                        onPress={onProfilePress}
                        activeOpacity={0.7}
                    >
                        <Image source={{ uri: bid.provider_image || 'https://i.pravatar.cc/100' }} style={styles.providerImage as any} />
                        <View style={styles.providerInfo}>
                            <View style={styles.providerNameRow}>
                                <Text style={[styles.providerName, { color: colors.text }]}>{bid.provider_name}</Text>
                                <View style={[styles.ratingBox, { backgroundColor: colors.accentLight }]}>
                                    <Star size={10} color={colors.accent} fill={colors.accent} />
                                    <Text style={[styles.ratingText, { color: colors.accent }]}>{bid.rating.toFixed(1)}</Text>
                                </View>
                            </View>
                            {bid.message ? (
                                <Text style={[styles.bidMessage, { color: colors.textSecondary }]} numberOfLines={2}>"{bid.message}"</Text>
                            ) : null}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <DollarSign size={12} color={colors.primary} />
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>PRICE</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>₹{bid.amount}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <Clock size={12} color={colors.accent} />
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>ETA</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{bid.eta}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <ShieldCheck size={12} color={colors.accent} />
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>VERIFIED</Text>
                            <Text style={[styles.statValue, { color: colors.accent }]}>Pro</Text>
                        </View>
                    </View>

                    <View style={styles.bidActions}>
                        <TouchableOpacity
                            onPress={() => onAccept(bid.id)}
                            disabled={isLocking}
                            style={[
                                styles.acceptBtn,
                                isOtherLocking && styles.acceptBtnDisabled,
                            ]}
                        >
                            {isThisLocking ? (
                                <LinearGradient colors={[colors.primary, '#FF9D6C']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                            ) : (
                                <LinearGradient colors={[colors.text, colors.textSecondary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
                        <TouchableOpacity 
                            style={[styles.messageBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                            onPress={() => onChat((bid as any).provider?.user?.id || bid.provider_id, bid)}
                        >
                            <MessageSquare size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

export default function ServiceBidding({ navigation, route }: any) {
    const { colors, isDark } = useTheme();
    const { showError, showSuccess } = useAlert();
    const bookingId = route?.params?.bookingId;
    const bookingAmount = route?.params?.totalAmount;
    const bookingType = route?.params?.bookingType;
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLocking, setIsLocking] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(bookingType !== 'scheduled');
    const [radiusKm, setRadiusKm] = useState(5);
    const [isCancelling, setIsCancelling] = useState(false);
    const { on, emit, isConnected } = useSocket();

    const handleCancelRequest = () => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel this booking request? This will retract the request and notify providers.",
            [
                { text: "No, Keep Request", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive", 
                    onPress: async () => {
                        setIsCancelling(true);
                        try {
                            const res = await bookingsApi.deleteBooking(bookingId);
                            if (res.success) {
                                Alert.alert("Success", "Request cancelled successfully", [
                                    { text: "OK", onPress: () => navigation.navigate('Main') }
                                ]);
                            } else {
                                Alert.alert("Error", res.error?.message || "Failed to cancel request");
                            }
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "An error occurred");
                        } finally {
                            setIsCancelling(false);
                        }
                    }
                }
            ]
        );
    };

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
                    provider_image: b.provider_image || `https://i.pravatar.cc/100?img=12`,
                    rating: parseFloat(b.provider_rating) || 5.0,
                    amount: parseFloat(b.amount) || 0,
                    eta: b.eta || '15 min',
                    message: b.message || '',
                    is_gold: (parseFloat(b.provider_rating) || 0) >= 4.8,
                    created_at: b.created_at,
                }];
            });
        });

        const unsubBidUpdated = on('BOOKING_BID_UPDATED', (data: any) => {
            const b = data.bid;
            console.log('🔄 Socket: booking bid updated:', b);
            setBids(prev => prev.map(existing => {
                if (existing.id === b.id) {
                    return {
                        ...existing,
                        amount: parseFloat(b.amount) || 0,
                        eta: b.eta || '15 min',
                        message: b.message || '',
                    };
                }
                return existing;
            }));
        });

        const unsubBidDeleted = on('BOOKING_BID_DELETED', (data: any) => {
            const deletedBidId = data.bid_id;
            console.log('🗑️ Socket: booking bid deleted:', deletedBidId);
            setBids(prev => prev.filter(existing => existing.id !== deletedBidId));
        });

        return () => {
            unsubBid();
            unsubBidUpdated();
            unsubBidDeleted();
        };
    }, [bookingId, on]);

    // Poll bids from API as fallback and initial load
    useEffect(() => {
        if (!bookingId) return;

        const fetchBids = async () => {
            try {
                const res = await bookingsApi.getBids(bookingId);
                if (res.success && res.data?.bids) {
                    setIsSearching(false);
                    const formatted = res.data.bids.map((b: any) => ({
                        id: b.id,
                        provider_id: b.provider_id,
                        provider_name: b.provider?.business_name || b.provider?.user?.full_name || 'Provider',
                        provider_image: b.provider?.user?.avatar_url || `https://i.pravatar.cc/100?u=${b.provider_id}`,
                        rating: parseFloat(b.provider?.rating) || 5.0,
                        amount: parseFloat(b.amount) || 0,
                        eta: b.eta || '15 min',
                        message: b.message || '',
                        is_gold: (parseFloat(b.provider?.rating) || 0) >= 4.8,
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
        }, 120000); // Every 2 minutes

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
                bookingsApi.getBids(bookingId).then(res => {
                    if (res.success && res.data?.bids) {
                        setIsSearching(false);
                        const formatted = res.data.bids.map((b: any) => ({
                            id: b.id,
                            provider_id: b.provider_id,
                            provider_name: b.provider?.business_name || b.provider?.user?.full_name || 'Provider',
                            provider_image: b.provider?.user?.avatar_url || `https://i.pravatar.cc/100?u=${b.provider_id}`,
                            rating: parseFloat(b.provider?.rating) || 5.0,
                            amount: parseFloat(b.amount) || 0,
                            eta: b.eta || '15 min',
                            message: b.message || '',
                            is_gold: (parseFloat(b.provider?.rating) || 0) >= 4.8,
                            created_at: b.created_at,
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

    const handleChat = async (providerId: string, bidObj?: any) => {
        try {
            const res: any = await api.post<any>('/chat/threads', {
                booking_id: bookingId,
                provider_user_id: providerId
            });
            const threadId = res?.data?.thread?.id || res?.thread?.id || res?.data?.id || res?.id;
            if (threadId) {
                navigation.navigate('Chat', {
                    threadId: threadId,
                    bookingId: bookingId,
                    providerUserId: providerId,
                    providerName: bidObj?.provider_name || bidObj?.provider?.business_name || bidObj?.business_name || 'Pawber Specialist',
                    provider: bidObj
                });
            } else {
                showError('Chat Error', res?.error?.message || res?.message || 'Failed to open chat thread');
            }
        } catch (error: any) {
            showError('Error', error.message || 'Failed to initiate chat');
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>LIVE BIDDING</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.statusText, { color: colors.primary }]}>
                                {isSearching ? `SEARCHING ${radiusKm}KM RADIUS` : `${bids.length} BIDS RECEIVED`}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={handleCancelRequest} 
                        disabled={isCancelling}
                        style={[styles.cancelBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 226, 226, 0.7)', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(254, 202, 202, 0.8)' }]}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Trash2 size={18} color="#EF4444" />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isSearching && bids.length === 0 ? (
                        <View style={styles.searchingContainer}>
                            <SearchRadar />
                            <Text style={[styles.searchingTitle, { color: colors.text }]}>Finding Experts</Text>
                            <Text style={[styles.searchingSub, { color: colors.textSecondary }]}>
                                Broadcasting to professionals within {radiusKm}km...{'\n'}
                                Expanding radius progressively.
                            </Text>

                            {/* Radius expansion indicator */}
                            <View style={[styles.radiusSteps, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                {[5, 10, 15, 20].map(r => (
                                    <View key={r} style={styles.radiusStep}>
                                        <View style={[
                                            styles.radiusDot,
                                            { backgroundColor: colors.border },
                                            radiusKm >= r && { backgroundColor: colors.primary }
                                        ]} />
                                        <Text style={[
                                            styles.radiusLabel,
                                            { color: colors.textMuted },
                                            radiusKm >= r && { color: colors.primary }
                                        ]}>{r}km</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.bidsContainer}>
                            <View style={styles.bidsHeader}>
                                <Text style={[styles.bidsCount, { color: colors.text }]}>RECEIVED BIDS ({bids.length})</Text>
                                <TouchableOpacity style={styles.filterBtn}>
                                    <Text style={[styles.filterText, { color: colors.primary }]}>SORT BY PRICE</Text>
                                    <Filter size={12} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            {bids.map((bid, index) => (
                                <BidCard
                                    key={bid.id}
                                    bid={bid}
                                    index={index}
                                    onAccept={handleAcceptBid}
                                    onChat={handleChat}
                                    onProfilePress={() => navigation.navigate('ProviderProfile', { provider: bid, onChat: handleChat })}
                                    isLocking={isLocking !== null}
                                    lockingId={isLocking}
                                />
                            ))}

                            {isSearching && (
                                <View style={styles.stillSearching}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.stillSearchingText, { color: colors.textMuted }]}>
                                        Still searching {radiusKm}km radius for more bids...
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={[styles.infoIconBox, { backgroundColor: colors.background }]}>
                                    <TrendingUp size={20} color={colors.primary} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoTitle, { color: colors.text }]}>Better prices coming?</Text>
                                    <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
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
                            colors={[colors.primary, '#FF9D6C']}
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
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    headerTitleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    pulseDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    infoBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    cancelBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },

    // Searching state
    searchingContainer: { alignItems: 'center', paddingTop: 40 },
    searchingTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
    searchingSub: {
        fontSize: 14, textAlign: 'center', maxWidth: 280,
        lineHeight: 22, fontWeight: '500',
    },
    radiusSteps: {
        flexDirection: 'row', gap: 16, marginTop: 32,
        paddingHorizontal: 24, paddingVertical: 16,
        borderRadius: 20, borderWidth: 1,
    },
    radiusStep: { alignItems: 'center', gap: 6 },
    radiusDot: {
        width: 10, height: 10, borderRadius: 5,
    },
    radiusLabel: { fontSize: 10, fontWeight: '800' },

    // Bids
    bidsContainer: { gap: 20 },
    bidsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bidsCount: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    filterText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    bidCardBlur: {
        borderRadius: 32, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20,
        elevation: 4,
    },
    bidCard: {
        borderRadius: 32,
        padding: 24, borderWidth: 1,
        position: 'relative', overflow: 'hidden',
    },
    bidCardLocked: { borderWidth: 2 },
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
    providerName: { fontSize: 16, fontWeight: '900' },
    ratingBox: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    ratingText: { fontSize: 11, fontWeight: '900' },
    bidMessage: {
        fontSize: 12, fontStyle: 'italic', fontWeight: '500', lineHeight: 18,
    },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    statBox: {
        flex: 1, borderRadius: 18, padding: 12,
        alignItems: 'center', gap: 4,
    },
    statLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    statValue: { fontSize: 14, fontWeight: '900' },
    bidActions: { flexDirection: 'row', gap: 10 },
    acceptBtn: {
        flex: 1, height: 52, borderRadius: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 },
    },
    acceptBtnDisabled: { opacity: 0.4 },
    acceptBtnText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    messageBtn: {
        width: 52, height: 52, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },

    stillSearching: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16,
    },
    stillSearchingText: { fontSize: 12, fontWeight: '600' },

    infoCard: {
        flexDirection: 'row', borderRadius: 28,
        padding: 20, borderWidth: 2,
        borderStyle: 'dashed', gap: 14,
    },
    infoIconBox: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 },
    },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 13, fontWeight: '900', marginBottom: 4 },
    infoSub: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

    persistenceBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 32, paddingVertical: 24,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden',
        shadowOpacity: 0.3, shadowOffset: { width: 0, height: -10 },
    },
    persistenceTitle: { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
    persistenceSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
});
