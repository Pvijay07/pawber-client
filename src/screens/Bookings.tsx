import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    ActivityIndicator,
    Platform,
    Animated,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Scissors,
    Stethoscope,
    Calendar,
    Clock,
    MessageSquare,
    CheckCircle2,
    Search,
    ShieldCheck,
    Repeat,
    FileText,
    Zap,
    Dog,
    Navigation2,
    Star,
    ArrowRight,
    Package,
    Sparkles,
    CircleDot,
} from 'lucide-react-native';
import { bookingsApi } from '../services/bookings.service';
import { Booking } from '../shared/types';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import BookingDetailsModal from '../components/BookingDetailsModal';
import ResolutionModal from '../components/ResolutionModal';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    requested: { label: 'AWAITING BIDS', color: '#FF7A3D', bg: 'rgba(255, 122, 61, 0.12)', icon: Zap },
    bidding: { label: 'BIDS OPEN', color: '#FF7A3D', bg: 'rgba(255, 122, 61, 0.12)', icon: Zap },
    bid_selected: { label: 'BID ACCEPTED', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', icon: CheckCircle2 },
    pending: { label: 'PENDING PAYMENT', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', icon: Clock },
    confirmed: { label: 'CONFIRMED', color: '#1D9E86', bg: 'rgba(29, 158, 134, 0.12)', icon: CheckCircle2 },
    in_progress: { label: 'IN PROGRESS', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: Navigation2 },
    service_completed: { label: 'APPROVAL NEEDED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: Sparkles },
    completed: { label: 'COMPLETED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: CheckCircle2 },
    cancelled: { label: 'CANCELLED', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: CircleDot },
};

const getServiceVisuals = (serviceName: string) => {
    const name = (serviceName || '').toLowerCase();
    if (name.includes('groom')) return { icon: Scissors, gradient: ['#1D9E86', '#0D8C73'] as [string, string], accent: '#1D9E86', emoji: '✂️' };
    if (name.includes('vet') || name.includes('medic')) return { icon: Stethoscope, gradient: ['#ef4444', '#dc2626'] as [string, string], accent: '#ef4444', emoji: '🩺' };
    if (name.includes('walk')) return { icon: Dog, gradient: ['#8b5cf6', '#7c3aed'] as [string, string], accent: '#8b5cf6', emoji: '🐕' };
    if (name.includes('train')) return { icon: Star, gradient: ['#f59e0b', '#d97706'] as [string, string], accent: '#f59e0b', emoji: '⭐' };
    return { icon: Package, gradient: ['#FF7A3D', '#FF5C26'] as [string, string], accent: '#FF7A3D', emoji: '🐾' };
};

const isServiceDateStarted = (bookingDateStr: string) => {
    if (!bookingDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const serviceDate = new Date(bookingDateStr);
    serviceDate.setHours(0, 0, 0, 0);
    return today.getTime() >= serviceDate.getTime();
};

const formatBookingDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Top-Level Component: StatusBadge
const StatusBadge = React.memo(({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isLive = ['in_progress', 'confirmed'].includes(status);

    useEffect(() => {
        if (isLive) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            );
            animation.start();
            return () => {
                animation.stop();
            };
        }
    }, [isLive]);

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            {isLive && (
                <Animated.View style={[styles.statusDot, { backgroundColor: config.color, opacity: pulseAnim }]} />
            )}
            <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
});

// Top-Level Component: BookingCard
interface BookingCardProps {
    item: Booking;
    index: number;
    colors: any;
    isDark: boolean;
    navigation: any;
    onPress: () => void;
    onResolvePress: () => void;
}

const BookingCard = React.memo(({ item, index, colors, isDark, navigation, onPress, onResolvePress }: BookingCardProps) => {
    const serviceName = item.service?.name || 'Service';
    const visuals = getServiceVisuals(serviceName);
    const petNames = item.booking_pets?.map(bp => bp.pet?.name).filter(Boolean).join(', ') || 'Pet';
    const isUpcoming = !['completed', 'cancelled'].includes(item.status);

    const cardAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(cardAnim, {
            toValue: 1,
            duration: 500,
            delay: index * 60,
            useNativeDriver: true,
        }).start();
    }, [index]);

    return (
        <Animated.View style={{
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }]
        }}>
            <TouchableOpacity
                activeOpacity={0.92}
                style={[styles.bookingCard, {
                    backgroundColor: isDark ? '#261F1A' : 'white',
                    borderColor: isDark ? 'rgba(255, 122, 61, 0.12)' : '#F5E6D8',
                }]}
                onPress={onPress}
            >
                {/* Visual left accent bar matching service gradient */}
                <LinearGradient
                    colors={visuals.gradient}
                    style={styles.cardAccentBar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />

                <View style={styles.cardMainContent}>
                    {/* Top: Service Name + Status */}
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.serviceTagGroup}>
                            <Text style={styles.serviceEmoji}>{visuals.emoji}</Text>
                            <Text style={[styles.serviceTitleText, { color: colors.text }]}>{serviceName}</Text>
                        </View>
                        <StatusBadge status={item.status} />
                    </View>

                    {/* Pet info & Booking ID */}
                    <View style={styles.petInfoRow}>
                        <Text style={[styles.petTextLabel, { color: colors.textSecondary }]}>For:</Text>
                        <Text style={[styles.petTextName, { color: colors.text }]}>🐾 {petNames}</Text>
                        <View style={[styles.dotSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                        <Text style={[styles.bookingIdText, { color: colors.textSecondary }]}>
                            #{item.id?.substring(0, 6).toUpperCase()}
                        </Text>
                    </View>

                    {/* Middle: Details (Date & Booking Type & Escrow) */}
                    <View style={styles.cardDetailsRow}>
                        <View style={[styles.detailBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFF5EE' }]}>
                            <Calendar size={12} color={colors.primary} />
                            <Text style={[styles.detailBadgeText, { color: colors.primary }]}>
                                {isUpcoming ? formatBookingDate(item.booking_date) : getTimeAgo(item.completed_at || item.created_at)}
                            </Text>
                        </View>

                        {item.booking_type && (
                            <View style={[styles.detailBadge, {
                                backgroundColor: item.booking_type === 'instant' ? 'rgba(255, 122, 61, 0.08)' : 'rgba(139, 92, 246, 0.08)'
                            }]}>
                                {item.booking_type === 'instant' ? <Zap size={12} color="#FF7A3D" /> : <Clock size={12} color="#8b5cf6" />}
                                <Text style={[styles.detailBadgeText, { color: item.booking_type === 'instant' ? '#FF7A3D' : '#8b5cf6' }]}>
                                    {item.booking_type === 'instant' ? 'Instant' : 'Scheduled'}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.detailBadge, { backgroundColor: 'rgba(29, 158, 134, 0.08)' }]}>
                            <ShieldCheck size={12} color="#1D9E86" />
                            <Text style={[styles.detailBadgeText, { color: '#1D9E86' }]}>Escrow Protected</Text>
                        </View>
                    </View>

                    {/* Divider line */}
                    <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5E6D8' }]} />

                    {/* Bottom: Price + Action Button */}
                    <View style={styles.cardFooterRow}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>TOTAL AMOUNT</Text>
                            <Text style={[styles.priceValue, { color: colors.text }]}>₹{(item.total_amount || 0).toLocaleString('en-IN')}</Text>
                        </View>

                        <View style={styles.actionButtonContainer}>
                            {isUpcoming ? (
                                <View style={styles.actionRow}>
                                    {(() => {
                                        if (item.status === 'requested' || item.status === 'bidding') {
                                            return (
                                                <TouchableOpacity
                                                    style={styles.premiumActionBtn}
                                                    onPress={() => navigation.navigate('ServiceBidding', {
                                                        bookingId: item.id,
                                                        totalAmount: item.total_amount,
                                                        serviceId: item.service_id,
                                                        bookingType: item.booking_type
                                                    })}
                                                >
                                                    <LinearGradient
                                                        colors={['#FF9D6C', '#FF7A3D']}
                                                        style={StyleSheet.absoluteFill}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                    />
                                                    <Zap size={13} color="white" fill="white" />
                                                    <Text style={styles.premiumActionText}>VIEW BIDS ({item.booking_bids?.length || 0})</Text>
                                                </TouchableOpacity>
                                            );
                                        }

                                        if (item.status === 'bid_selected' || item.status === 'pending') {
                                            return (
                                                <TouchableOpacity
                                                    style={styles.premiumActionBtn}
                                                    onPress={() => navigation.navigate('BookingFlow', {
                                                        serviceId: item.service_id,
                                                        fromBidding: item.booking_type === 'scheduled',
                                                        bookingId: item.id,
                                                        totalAmount: item.total_amount,
                                                    })}
                                                >
                                                    <LinearGradient
                                                        colors={['#1D9E86', '#0D8C73']}
                                                        style={StyleSheet.absoluteFill}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                    />
                                                    <Text style={styles.premiumActionText}>PAY NOW</Text>
                                                    <ArrowRight size={13} color="white" />
                                                </TouchableOpacity>
                                            );
                                        }

                                        if (item.status === 'service_completed') {
                                            return (
                                                <TouchableOpacity
                                                    style={styles.premiumActionBtn}
                                                    onPress={onPress}
                                                >
                                                    <LinearGradient
                                                        colors={['#10b981', '#059669']}
                                                        style={StyleSheet.absoluteFill}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                    />
                                                    <Sparkles size={13} color="white" />
                                                    <Text style={styles.premiumActionText}>APPROVE</Text>
                                                </TouchableOpacity>
                                            );
                                        }

                                        if (item.status === 'cancelled' && (item as any).tracking_missed) {
                                            return (
                                                <TouchableOpacity
                                                    style={[styles.premiumActionBtn, { backgroundColor: '#ef4444' }]}
                                                    onPress={onResolvePress}
                                                >
                                                    <Text style={styles.premiumActionText}>RESOLVE</Text>
                                                </TouchableOpacity>
                                            );
                                        }

                                        return isServiceDateStarted(item.booking_date) ? (
                                            <TouchableOpacity
                                                style={styles.premiumActionBtn}
                                                onPress={() => navigation.navigate('LiveTracking', { bookingId: item.id })}
                                            >
                                                <LinearGradient
                                                    colors={['#1A1612', '#2D2824']}
                                                    style={StyleSheet.absoluteFill}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                />
                                                <Navigation2 size={13} color="white" />
                                                <Text style={styles.premiumActionText}>TRACK LIVE</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={[styles.premiumActionBtn, {
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF9F5',
                                                borderWidth: 1,
                                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5E6D8',
                                            }]}>
                                                <Clock size={13} color={colors.textMuted} />
                                                <Text style={[styles.premiumActionText, { color: colors.textMuted }]}>UPCOMING</Text>
                                            </View>
                                        );
                                    })()}

                                    {/* Chat button */}
                                    {['pending', 'requested', 'bidding', 'confirmed', 'in_progress', 'service_completed'].includes(item.status) && (
                                        <TouchableOpacity
                                            style={[styles.chatBtnRound, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#FFF3EC', borderColor: '#F5E6D8' }]}
                                            onPress={() => {
                                                if (item.status === 'bidding' || item.status === 'requested') {
                                                    navigation.navigate('ServiceBidding', { bookingId: item.id, totalAmount: item.total_amount, bookingType: item.booking_type });
                                                } else {
                                                    navigation.navigate('Chat', { bookingId: item.id });
                                                }
                                            }}
                                        >
                                            <MessageSquare size={15} color={colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[styles.pastBtn, { backgroundColor: isDark ? 'rgba(29, 158, 134, 0.12)' : '#EBFDF9', borderColor: '#1D9E86' }]}
                                        onPress={() => navigation.navigate('BookingFlow', {
                                            serviceId: item.service_id,
                                            packageId: item.package_id,
                                            petIds: (item as any).pet_ids,
                                            addonIds: (item as any).addons,
                                            frequency: (item as any).booking_parameters?.frequency,
                                            specificDays: (item as any).booking_parameters?.specificDays,
                                            walkDuration: (item as any).booking_parameters?.walkDuration
                                        })}
                                    >
                                        <Repeat size={12} color="#1D9E86" />
                                        <Text style={[styles.pastBtnText, { color: '#1D9E86' }]}>Rebook</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.pastBtn, { backgroundColor: isDark ? 'rgba(122, 85, 64, 0.15)' : '#FFFBF7', borderColor: '#DEC9B5' }]}
                                        onPress={onPress}
                                    >
                                        <FileText size={12} color="#7A5540" />
                                        <Text style={[styles.pastBtnText, { color: '#7A5540' }]}>Details</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

// Top-Level Component: EmptyState
interface EmptyStateProps {
    activeTab: 'upcoming' | 'past';
    colors: any;
    isDark: boolean;
    navigation: any;
}

const EmptyState = React.memo(({ activeTab, colors, isDark, navigation }: EmptyStateProps) => {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -8, duration: 1200, useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => {
            animation.stop();
        };
    }, []);

    return (
        <View style={styles.emptyState}>
            <Animated.View style={[styles.emptyIconOuter, { transform: [{ translateY: bounceAnim }] }]}>
                <LinearGradient
                    colors={isDark ? ['rgba(255,122,61,0.15)', 'rgba(255,122,61,0.05)'] : ['#FFF3EC', '#FFFDFB']}
                    style={styles.emptyIconGradient}
                >
                    <View style={[styles.emptyIconInner, { backgroundColor: isDark ? 'rgba(255,122,61,0.2)' : '#FFF3EC' }]}>
                        <Calendar size={36} color={colors.primary} strokeWidth={1.5} />
                    </View>
                </LinearGradient>
            </Animated.View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {activeTab === 'upcoming'
                    ? 'Book a premium service and your upcoming\nappointments will appear right here.'
                    : 'Your completed booking history\nwill be documented here.'}
            </Text>

            {activeTab === 'upcoming' && (
                <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => navigation.navigate('Home')}
                >
                    <LinearGradient
                        colors={['#FF7A3D', '#FF9D6C']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                    <Text style={styles.emptyBtnText}>EXPLORE SERVICES</Text>
                    <ArrowRight size={16} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
});

export default function Bookings({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedMissedId, setSelectedMissedId] = useState<string | null>(null);

    const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    useEffect(() => {
        Animated.spring(tabIndicatorAnim, {
            toValue: activeTab === 'upcoming' ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
        }).start();
    }, [activeTab]);

    React.useEffect(() => {
        fetchBookings();
    }, [activeTab]);

    React.useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel(`client_bookings:${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${user.id}`
                }, () => {
                    fetchBookings();
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
                ? 'requested,bidding,bid_selected,pending,confirmed,in_progress,service_completed'
                : 'completed,cancelled';

            const res = await bookingsApi.list({ status: statuses });
            if (res.success && res.data) {
                setBookings(res.data.bookings || []);
            }
        } catch (err) {
            console.error('Failed to load bookings:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const handleCardPress = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        setIsDetailsVisible(true);
    };

    const handleResolvePress = (bookingId: string) => {
        setSelectedMissedId(bookingId);
    };

    const renderBookingCard = ({ item, index }: { item: Booking; index: number }) => (
        <BookingCard
            item={item}
            index={index}
            colors={colors}
            isDark={isDark}
            navigation={navigation}
            onPress={() => handleCardPress(item.id)}
            onResolvePress={() => handleResolvePress(item.id)}
        />
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Background Decorative Blobs */}
            <View style={[styles.bgBlob, { top: -60, right: -60, backgroundColor: isDark ? 'rgba(255,122,61,0.03)' : 'rgba(255,122,61,0.05)' }]} />
            <View style={[styles.bgBlob, { bottom: 80, left: -90, backgroundColor: isDark ? 'rgba(29,158,134,0.02)' : 'rgba(29,158,134,0.03)' }]} />

            {/* Header */}
            <Animated.View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8, opacity: headerOpacity }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.headerLabel, { color: '#B09080' }]}>MY APPOINTMENTS</Text>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Bookings</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.headerBtn, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF9F5',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5E6D8',
                        }]}>
                            <Search size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Modern Segmented Tab Control */}
                <View style={[styles.tabBar, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF9F5',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5E6D8',
                }]}>
                    <Animated.View
                        style={[styles.tabIndicator, {
                            backgroundColor: colors.primary,
                            transform: [{
                                translateX: tabIndicatorAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [4, (width - 56) / 2],
                                })
                            }],
                            width: (width - 64) / 2,
                        }]}
                    />
                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text style={[styles.tabText, activeTab === 'upcoming' ? styles.tabTextActive : { color: '#B09080' }]}>
                            Upcoming
                        </Text>
                        {!isLoading && activeTab === 'upcoming' && bookings.length > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{bookings.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => setActiveTab('past')}
                    >
                        <Text style={[styles.tabText, activeTab === 'past' ? styles.tabTextActive : { color: '#B09080' }]}>
                            History
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Content List */}
            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Fetching bookings...</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState 
                            activeTab={activeTab} 
                            colors={colors} 
                            isDark={isDark} 
                            navigation={navigation} 
                        />
                    }
                />
            )}

            {/* Floating Action Button (FAB) */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('BookingFlow')}
                activeOpacity={0.88}
            >
                <LinearGradient
                    colors={['#FF7A3D', '#FF9D6C']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Detail and Resolution Modals */}
            <BookingDetailsModal
                visible={isDetailsVisible}
                bookingId={selectedBookingId}
                onClose={() => setIsDetailsVisible(false)}
                onStatusChange={fetchBookings}
            />
            <ResolutionModal
                visible={!!selectedMissedId}
                bookingId={selectedMissedId}
                onClose={() => setSelectedMissedId(null)}
                onResolved={() => {
                    setSelectedMissedId(null);
                    fetchBookings();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    bgBlob: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },

    // Header
    header: { paddingHorizontal: 24, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', gap: 10 },
    headerBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },

    // Tabs
    tabBar: {
        flexDirection: 'row', borderRadius: 20, padding: 4,
        borderWidth: 1.5, position: 'relative',
    },
    tabIndicator: {
        position: 'absolute', top: 4, height: '100%',
        borderRadius: 16,
        shadowColor: '#FF7A3D',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 2,
    },
    tab: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        justifyContent: 'center', flexDirection: 'row', gap: 8, zIndex: 1,
    },
    tabText: { fontSize: 13, fontWeight: '800' },
    tabTextActive: { color: 'white' },
    tabBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        minWidth: 18, height: 18, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    tabBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },

    // Loading
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingText: { fontSize: 14, fontWeight: '700' },

    // List
    listContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120, gap: 16 },

    // Booking Card
    bookingCard: {
        borderRadius: 24, borderWidth: 1.5, position: 'relative', overflow: 'hidden',
        shadowColor: '#7A5540', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20, elevation: 3,
    },
    cardAccentBar: {
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
    },
    cardMainContent: {
        flex: 1, padding: 20, paddingLeft: 22,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    serviceTagGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    serviceEmoji: { fontSize: 18 },
    serviceTitleText: { fontSize: 16, fontWeight: 'bold' },

    petInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    petTextLabel: { fontSize: 12, fontWeight: '600' },
    petTextName: { fontSize: 12, fontWeight: 'bold' },
    dotSeparator: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 4 },
    bookingIdText: { fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    // Status Badge
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    // Details Row
    cardDetailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    detailBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    detailBadgeText: { fontSize: 11, fontWeight: 'bold' },

    // Divider
    cardDivider: { height: 1.5, width: '100%', marginBottom: 16 },

    // Bottom Footer Row
    cardDividerColor: { height: 1.5, width: '100%', marginBottom: 16 },
    cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceContainer: { gap: 2 },
    priceLabel: { fontSize: 9, fontWeight: '900', color: '#B09080', letterSpacing: 1 },
    priceValue: { fontSize: 20, fontWeight: '900' },

    // Action buttons inside card
    actionButtonContainer: {},
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    premiumActionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, height: 42, paddingHorizontal: 18, borderRadius: 14,
        overflow: 'hidden', position: 'relative',
        shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8, elevation: 2,
    },
    premiumActionText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    chatBtnRound: {
        width: 42, height: 42, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },
    pastBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, height: 38, paddingHorizontal: 16, borderRadius: 12,
        borderWidth: 1.5,
    },
    pastBtnText: { fontSize: 12, fontWeight: '800' },

    // Empty State
    emptyState: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 },
    emptyIconOuter: { marginBottom: 24 },
    emptyIconGradient: {
        width: 112, height: 112, borderRadius: 56,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyIconInner: {
        width: 76, height: 76, borderRadius: 38,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, letterSpacing: -0.3 },
    emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '600', marginBottom: 28 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 52, paddingHorizontal: 28, borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#FF7A3D', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16,
    },
    emptyBtnText: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    // FAB
    fab: {
        position: 'absolute', bottom: 28, right: 24,
        width: 56, height: 56, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: '#FF7A3D', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16, elevation: 10,
    },
    fabText: { color: 'white', fontSize: 32, fontWeight: '200', marginTop: -4 },
});
