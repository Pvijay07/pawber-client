import React, { useState, useEffect } from 'react';
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
    Loader2,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface Bid {
    id: string;
    provider_name: string;
    provider_image: string;
    rating: number;
    price: number;
    eta: string;
    message: string;
    is_gold?: boolean;
}

export default function ServiceBidding({ navigation, route }: any) {
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLocking, setIsLocking] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(true);
    const requestId = route?.params?.requestId || 'demo-request';

    useEffect(() => {
        let isMounted = true;
        const fetchBids = async () => {
            if (requestId === 'demo-request') {
                if (isMounted && bids.length === 0) {
                    setIsSearching(false);
                    setBids([
                        {
                            id: '1', provider_name: 'David Miller', provider_image: 'https://i.pravatar.cc/100?img=12',
                            rating: 4.9, price: 1999, eta: '15 min', message: 'I specialize in large breeds and spa treatments.', is_gold: true
                        },
                        {
                            id: '2', provider_name: 'Sarah Chen', provider_image: 'https://i.pravatar.cc/100?img=32',
                            rating: 4.7, price: 1750, eta: '25 min', message: 'Certified vet technician giving extra care to senior pets.'
                        }
                    ]);
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('bids')
                    .select('*, provider:profiles(full_name, avatar_url)')
                    .eq('request_id', requestId);
                
                if (error) throw error;
                
                if (data && isMounted) {
                    setIsSearching(false);
                    const formattedBids = data.map((b: any) => ({
                        id: b.id.toString(),
                        provider_name: b.provider?.full_name || 'Provider',
                        provider_image: b.provider?.avatar_url || 'https://i.pravatar.cc/100',
                        rating: 5.0,
                        price: b.amount,
                        eta: b.eta || '15 min',
                        message: b.message || 'I am available for this job.',
                        is_gold: false,
                    }));
                    setBids(formattedBids);
                }
            } catch (err) {
                console.error('Error polling bids:', err);
            }
        };

        fetchBids();
        const pollInterval = setInterval(fetchBids, 5000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [requestId, bids.length]);

    const handleAccept = (bidId: string) => {
        setIsLocking(bidId);
        setTimeout(() => {
            navigation.navigate('Home');
        }, 2000);
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
                            <Text style={styles.statusText}>DIRECT REQUESTS ACTIVE</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.infoBtn}>
                        <Info size={18} color="#B09080" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isSearching ? (
                        <View style={styles.searchingContainer}>
                            <View style={styles.loaderWrapper}>
                                <ActivityIndicator size="large" color="#FF7A3D" />
                                <View style={styles.searchIconOverlay}>
                                    <Search size={14} color="#FF7A3D" />
                                </View>
                            </View>
                            <Text style={styles.searchingTitle}>Finding Experts</Text>
                            <Text style={styles.searchingSub}>Nearby professionals are reviewing your request details...</Text>
                        </View>
                    ) : (
                        <View style={styles.bidsContainer}>
                            <View style={styles.bidsHeader}>
                                <Text style={styles.bidsCount}>RECEIVED BIDS ({bids.length})</Text>
                                <TouchableOpacity style={styles.filterBtn}>
                                    <Text style={styles.filterText}>COMPARE ALL</Text>
                                    <Filter size={12} color="#FF7A3D" />
                                </TouchableOpacity>
                            </View>

                            {bids.map((bid) => (
                                <View key={bid.id} style={StyleSheet.flatten([styles.bidCard, isLocking === bid.id && styles.bidCardLocked])}>
                                    {bid.is_gold && (
                                        <View style={styles.goldBadge}>
                                            <Text style={styles.goldBadgeText}>GOLD PARTNER</Text>
                                        </View>
                                    )}

                                    <View style={styles.bidHeader}>
                                        <Image source={{ uri: bid.provider_image }} style={styles.providerImage as any} />
                                        <View style={styles.providerInfo}>
                                            <View style={styles.providerNameRow}>
                                                <Text style={styles.providerName}>{bid.provider_name}</Text>
                                                <View style={styles.ratingBox}>
                                                    <Star size={10} color="#1D9E86" fill="#1D9E86" />
                                                    <Text style={styles.ratingText}>{bid.rating}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.bidMessage}>"{bid.message}"</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statsGrid}>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>PRICE</Text>
                                            <Text style={styles.statValue}>₹{bid.price}</Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>ETA</Text>
                                            <Text style={styles.statValue}>{bid.eta}</Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>TOOLS</Text>
                                            <View style={styles.statValueRow}>
                                                <Text style={StyleSheet.flatten([styles.statValue, { color: '#FF7A3D' }])}>Pro</Text>
                                                <ShieldCheck size={10} color="#FF7A3D" />
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.bidActions}>
                                        <TouchableOpacity
                                            onPress={() => handleAccept(bid.id)}
                                            disabled={isLocking !== null}
                                            style={StyleSheet.flatten([
                                                styles.acceptBtn,
                                                isLocking === bid.id && styles.acceptBtnLocked,
                                                isLocking !== null && isLocking !== bid.id && styles.acceptBtnDisabled
                                            ])}
                                        >
                                            {isLocking === bid.id ? (
                                                <>
                                                    <ActivityIndicator size="small" color="white" />
                                                    <Text style={styles.acceptBtnText}>LOCKING...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={16} color="white" strokeWidth={3} />
                                                    <Text style={styles.acceptBtnText}>ACCEPT BID</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.messageBtn}>
                                            <MessageSquare size={18} color="#1A1612" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.infoCard}>
                                <View style={styles.infoIconBox}>
                                    <TrendingUp size={20} color="#FF7A3D" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoTitle}>Better prices coming?</Text>
                                    <Text style={styles.infoSub}>Bids usually improve in the first 5-10 minutes. Feel free to wait for more experts.</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {isLocking && (
                    <View style={styles.persistenceBar}>
                        <View>
                            <Text style={styles.persistenceTitle}>BID LOCKED</Text>
                            <Text style={styles.persistenceSub}>Closing other proposals & creating booking...</Text>
                        </View>
                        <ActivityIndicator color="white" />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FFF9F5',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#F5E6D8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1A1612',
        letterSpacing: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF7A3D',
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FF7A3D',
        letterSpacing: 0.5,
    },
    infoBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF9F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 100,
    },
    searchingContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    loaderWrapper: {
        width: 96,
        height: 96,
        backgroundColor: '#FFF3EC',
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    searchIconOverlay: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 32,
        height: 32,
        backgroundColor: 'white',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    searchingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 8,
    },
    searchingSub: {
        fontSize: 14,
        color: '#7A5540',
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 20,
        fontWeight: '500',
    },
    bidsContainer: {
        gap: 24,
    },
    bidsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bidsCount: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1A1612',
        letterSpacing: 1.5,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    filterText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FF7A3D',
        letterSpacing: 1,
    },
    bidCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F5E6D8',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
        position: 'relative',
        overflow: 'hidden',
    },
    bidCardLocked: {
        borderColor: '#FF7A3D',
    },
    goldBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#1D9E86',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderBottomLeftRadius: 16,
    },
    goldBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    bidHeader: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    providerImage: {
        width: 64,
        height: 64,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'white',
    },
    providerInfo: {
        flex: 1,
    },
    providerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    providerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#E0F5F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1D9E86',
    },
    bidMessage: {
        fontSize: 11,
        color: '#7A5540',
        fontStyle: 'italic',
        fontWeight: '500',
        lineHeight: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FFF9F5',
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        gap: 2,
    },
    statLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#B09080',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bidActions: {
        flexDirection: 'row',
        gap: 10,
    },
    acceptBtn: {
        flex: 1,
        height: 56,
        backgroundColor: '#1A1612',
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
    },
    acceptBtnLocked: {
        backgroundColor: '#FF7A3D',
    },
    acceptBtnDisabled: {
        backgroundColor: '#F5E6D8',
        shadowOpacity: 0,
    },
    acceptBtnText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    messageBtn: {
        width: 56,
        height: 56,
        backgroundColor: '#FFF9F5',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF9F5',
        borderRadius: 32,
        padding: 24,
        borderWidth: 2,
        borderColor: '#F5E6D8',
        borderStyle: 'dashed',
        gap: 16,
    },
    infoIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 2,
    },
    infoSub: {
        fontSize: 10,
        color: '#7A5540',
        fontWeight: '500',
        lineHeight: 14,
    },
    persistenceBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FF7A3D',
        paddingHorizontal: 32,
        paddingVertical: 24,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#FF7A3D',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: -10 },
    },
    persistenceTitle: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    persistenceSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
