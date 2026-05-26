import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Image,
    RefreshControl,
    Platform,
    StatusBar
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import {
    Bell,
    Bot,
    Search,
    MapPin,
    ChevronRight,
    Zap,
    ShieldAlert,
    Heart,
    Star,
    Sparkles,
    Clock,
    Info,
    Calendar,
    Wallet as WalletIcon
} from 'lucide-react-native';
import { LoyaltyProgress } from '../components/LoyaltyProgress';
import { contentService } from '../services/content.service';
import { walletApi as walletService } from '../services/wallet.service';
import { petsApi as petsService } from '../services/pets.service';

import { authApi } from '../services/auth.service';
import { loyaltyApi, LoyaltyStatus } from '../services/loyalty.service';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { servicesApi } from '../services/services.service';
import { bookingsApi } from '../services/bookings.service';
import { ServiceCategory } from '../shared/types';

const { width } = Dimensions.get('window');

interface HomeProps {
    navigation: any;
}

const CUTE_PET_VIDEOS = [
    { id: '1', title: 'Funny Paws', url: 'https://assets.mixkit.co/videos/preview/mixkit-funny-cat-licking-its-paws-on-the-bed-34354-large.mp4', category: 'Funny', poster: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400' },
    { id: '2', title: 'Bath Time', url: 'https://assets.mixkit.co/videos/preview/mixkit-owner-grooming-her-cat-with-a-brush-34358-large.mp4', category: 'Grooming', poster: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400' },
    { id: '3', title: 'Park Fun', url: 'https://assets.mixkit.co/videos/preview/mixkit-golden-retriever-dog-running-in-the-park-34356-large.mp4', category: 'Walking', poster: 'https://images.unsplash.com/photo-1551730459-92db2a308d6a?q=80&w=400' },
    { id: '4', title: 'Sleepy Head', url: 'https://assets.mixkit.co/videos/preview/mixkit-cat-sleeping-on-the-sofa-34352-large.mp4', category: 'Cute', poster: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=400' }
];

const SafeVideo = ({ url, poster, style }: { url: string, poster: string, style: any }) => {
    // Temporarily disabled video to debug crash
    return <Image source={{ uri: poster }} style={style} />;
};

export default function Home({ navigation }: HomeProps) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
    const [homepageContent, setHomepageContent] = useState<any>(null);
    const [walletData, setWalletData] = useState<any>(null);
    const [petsCount, setPetsCount] = useState(0);
    const [user, setUser] = useState<any>(null);
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    const isCompact = width < 400;
    const serviceColumns = isCompact ? 3 : 5;
    const serviceItemWidth = isCompact
        ? (width - 48 - 24) / serviceColumns
        : (width - 48 - 48) / serviceColumns;

    const [services, setServices] = useState<ServiceCategory[]>([]);
    const [upcomingBooking, setUpcomingBooking] = useState<any>(null);
    const [currentAddress, setCurrentAddress] = useState('Set your location');

    const getServiceVisuals = (catName: string): { icon: string; color: string; bgColor: string } => {
        const name = catName.toLowerCase();
        if (name.includes('groom')) return { icon: 'Scissors', color: '#f97316', bgColor: '#fff7ed' };
        if (name.includes('vet') || name.includes('medic')) return { icon: 'Stethoscope', color: '#14b8a6', bgColor: '#f0fdfa' };
        if (name.includes('board') || name.includes('hostel')) return { icon: 'Home', color: '#3b82f6', bgColor: '#eff6ff' };
        if (name.includes('walk')) return { icon: 'MapPin', color: '#a855f7', bgColor: '#faf5ff' };
        if (name.includes('train')) return { icon: 'GraduationCap', color: '#f59e0b', bgColor: '#fffbeb' };
        return { icon: 'Sparkles', color: '#6366f1', bgColor: '#f5f3ff' };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const DISABLED_SERVICES: string[] = [];

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                contentService.getHomepageContent(),
                walletService.get(),
                petsService.list(),
                authApi.getProfile(),
                loyaltyApi.getStatus(),
                servicesApi.listCategories(),
                bookingsApi.list({ status: 'confirmed,in_progress', limit: 1 })
            ]);

            // Helper to get result data
            const getRes = (idx: number) => results[idx].status === 'fulfilled' ? (results[idx] as any).value : null;

            const content = getRes(0);
            const wallet = getRes(1);
            const pets = getRes(2);
            const profile = getRes(3);
            const loyalty = getRes(4);
            const categoriesRes = getRes(5);
            const bookingsRes = getRes(6);

            if (content?.content) setHomepageContent(content.content);
            if (wallet?.success && wallet.data) setWalletData(wallet.data.wallet);
            if (pets?.success && pets.data) setPetsCount(pets.data.pets.length);
            if (profile?.data?.user) setUser(profile.data.user);
            if (loyalty?.success && loyalty.data) setLoyaltyStatus(loyalty.data);

            // Handle Categories (Final Dynamic Services)
            if (categoriesRes?.success && categoriesRes.data?.categories) {
                const mapped = categoriesRes.data.categories.map((c: any) => {
                    const isManualDisabled = DISABLED_SERVICES.includes(c.id) || 
                                           DISABLED_SERVICES.includes(c.slug) || 
                                           DISABLED_SERVICES.includes(c.name.toLowerCase());
                    return {
                        ...c,
                        is_active: isManualDisabled ? false : c.is_active,
                        is_coming_soon: isManualDisabled ? true : c.is_coming_soon
                    };
                });
                setServices(mapped);
            }

            // Handle Upcoming Booking
            if (bookingsRes?.success && bookingsRes.data?.bookings?.[0]) {
                setUpcomingBooking(bookingsRes.data.bookings[0]);
            }

            // Load Address from AsyncStorage
            const savedAddresses = await AsyncStorage.getItem('@petcare_addresses');
            if (savedAddresses) {
                const parsed = JSON.parse(savedAddresses);
                if (parsed.length > 0) {
                    const active = parsed.find((a: any) => a.isDefault) || parsed[0];
                    setCurrentAddress(active.label || active.address);
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderIcon = (iconName: string, size: number, color: string) => {
        const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
        return <IconComponent size={size} color={color} strokeWidth={2.2} />;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text style={styles.loadingText}>Loading PetCare...</Text>
            </View>
        );
    }

    const howItWorksSteps = homepageContent?.client_how_it_works || [
        { title: 'Pick Service', icon: 'Scissors', description: 'Choose your need' },
        { title: 'Choose Time', icon: 'Calendar', description: 'Schedule it' },
        { title: 'Expert Arrives', icon: 'Heart', description: 'Pro at door' },
    ];

    const banners = (homepageContent?.client_home_banners && homepageContent.client_home_banners.length > 0) 
        ? homepageContent.client_home_banners 
        : [
            { title: 'Premium Grooming', subtitle: '30% Off this weekend', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800', action: 'bookingFlow', serviceId: 'grooming' },
            { title: 'Expert Veterinary', subtitle: 'Certified vets at your door', image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800', action: 'bookingFlow', serviceId: 'health' }
        ];

    return (
        <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10, borderBottomColor: colors.border }]}>
                    <View style={styles.headerTextGroup}>
                        <View style={styles.greetingRow}>
                            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Hello, </Text>
                            <Text style={[styles.nameText, { color: colors.text }]}>{user?.full_name?.split(' ')[0] || 'Friend'}</Text>
                        </View>
                        <TouchableOpacity style={styles.addressRow} onPress={() => navigation.navigate('Addresses')}>
                            <View style={[styles.pinBg, { backgroundColor: colors.primaryLight }]}>
                                <MapPin size={10} color={colors.primary} fill={colors.primary} fillOpacity={0.1} />
                            </View>
                            <Text style={[styles.addressText, { color: colors.textMuted }]} numberOfLines={1}>{currentAddress}</Text>
                            <ChevronRight size={12} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Notifications')}>
                        <Bell size={22} color={colors.text} strokeWidth={2} />
                        <View style={[styles.notificationBadge, { borderColor: colors.surface }]} />
                    </TouchableOpacity>
                </View>




                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchWrapper}>
                        <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
                        <TextInput
                            placeholder="What does your pet need today?"
                            style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>

                {/* Commented out per User Request: Loyalty, Emergency, Stats */}
                {/* 
                <View style={{ paddingHorizontal: 24 }}>
                    <LoyaltyProgress 
                        currentStreak={loyaltyStatus?.currentStreak || 0} 
                        progress={loyaltyStatus?.progress || ['M1', 'M2', 'M3', 'M4']} 
                        isEligible={loyaltyStatus?.isEligible || false} 
                    />
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}
                        onPress={() => navigation.navigate('PackageSelection', { categoryId: 'vet' })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#ef4444' }]}>
                            <ShieldAlert size={20} color="white" />
                        </View>
                        <Text style={[styles.quickActionText, { color: '#ef4444' }]}>EMERGENCY</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#f0fdfa', borderColor: '#ccfbf1' }]}
                        onPress={() => navigation.navigate('Events')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#14b8a6' }]}>
                            <Zap size={20} color="white" />
                        </View>
                        <Text style={[styles.quickActionText, { color: '#14b8a6' }]}>EVENTS</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.walletCard, { backgroundColor: isDark ? colors.surface : '#0f172a' }]}>
                        <View style={styles.walletHeader}>
                            <View style={[styles.statIconCircle, { backgroundColor: colors.primaryLight }]}>
                                <WalletIcon size={16} color={colors.primary} />
                            </View>
                            <Text style={[styles.walletLabel, { color: colors.primary }]}>BALANCE</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={[styles.currencySymbol, { color: colors.primary }]}>₹</Text>
                            <Text style={styles.walletValue}>{walletData?.balance || '0.00'}</Text>
                        </View>
                        <TouchableOpacity style={styles.walletDetails} onPress={() => navigation.navigate('Wallet')}>
                            <Text style={styles.walletDetailsText}>Refill Wallet </Text>
                            <ChevronRight size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.petsCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Pets')}>
                        <View style={[styles.statIconCircleOrange, { backgroundColor: isDark ? colors.surfaceSecondary : '#fff7ed' }]}>
                            <Heart size={20} color={colors.accent} fill={colors.accent} />
                        </View>
                        <View style={styles.petsCountRow}>
                            <Text style={[styles.petsCount, { color: colors.text }]}>{petsCount}</Text>
                        </View>
                        <Text style={styles.petsLabel}>MY PETS</Text>
                    </TouchableOpacity>
                </View>
                */}

                {/* dynamic Banners - Above Explore Services */}
                <View style={{ marginBottom: 32 }}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        pagingEnabled 
                        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
                    >
                        {banners.map((banner: any, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.bannerCard, { width: width - 48 }]}
                                onPress={() => {
                                    const isDisabled = DISABLED_SERVICES.includes(banner.serviceId?.toLowerCase());
                                    if (!isDisabled) {
                                        navigation.navigate('PackageSelection', { serviceId: banner.serviceId });
                                    }
                                }}
                            >
                                <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                                <View style={styles.bannerOverlay}>
                                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                    {DISABLED_SERVICES.includes(banner.serviceId?.toLowerCase()) && (
                                        <View style={[styles.comingSoonBadge, { position: 'relative', top: 0, right: 0, alignSelf: 'flex-start', marginTop: 8 }]}>
                                            <Text style={styles.comingSoonText}>COMING SOON</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Services Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>EXPLORE SERVICES</Text>
                </View>

                <View style={styles.servicesGrid}>
                    {(services.length > 0 ? services : [
                        { id: 'grooming', name: 'Grooming', is_active: true },
                        { id: 'exercise', name: 'Dog Walking', is_active: true },
                        { id: 'stay', name: 'Boarding', is_active: false, is_coming_soon: true },
                        { id: 'training', name: 'Training', is_active: false, is_coming_soon: true },
                        { id: 'health', name: 'Veterinary', is_active: false, is_coming_soon: true },
                    ]).map((service) => {
                        const visuals = getServiceVisuals(service.name);
                        const isDisabled = service.is_coming_soon || !service.is_active;
                        return (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.serviceItem, { width: serviceItemWidth, opacity: isDisabled ? 0.7 : 1 }]}
                                onPress={() => {
                                    if (isDisabled) return;
                                    navigation.navigate('PackageSelection', { categoryId: service.id });
                                }}
                            >
                                <View style={[styles.serviceIcon, { backgroundColor: isDark ? colors.surface : visuals.bgColor }]}>
                                    {renderIcon(visuals.icon, 28, visuals.color)}
                                </View>
                                <Text style={[styles.serviceName, { color: colors.textSecondary }]}>{service.name}</Text>
                                {isDisabled && (
                                    <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.comingSoonText}>COMING SOON</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Pet Cute and Funny Videos Section */}
                <View style={styles.videosSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>PAWBER MOMENTS</Text>
                        <TouchableOpacity>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Watch More</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 24, gap: 16 }}
                    >
                        {CUTE_PET_VIDEOS.map((video) => (
                            <View key={video.id} style={[styles.videoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <SafeVideo
                                    url={video.url}
                                    poster={video.poster}
                                    style={styles.videoPlayer}
                                />
                                <View style={styles.videoOverlay}>
                                    <View style={styles.videoCategoryBadge}>
                                        <Text style={styles.videoCategoryText}>{video.category}</Text>
                                    </View>
                                    <Text style={styles.videoTitle}>{video.title}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* How It Works Section */}
                <View style={styles.howItWorksContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>HOW IT WORKS</Text>
                    </View>

                    <View style={styles.stepsWrapper}>
                        {howItWorksSteps.map((step: any, index: number) => (
                            <View key={index} style={styles.stepBlock}>
                                <View style={[styles.stepCircleOuter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={[styles.stepCircleInner, { backgroundColor: colors.background }]}>
                                        {renderIcon(step.icon, 22, colors.text)}
                                    </View>
                                </View>
                                <Text style={[styles.stepTitleText, { color: colors.text }]}>{step.title}</Text>
                                <Text style={[styles.stepDescText, { color: colors.textSecondary }]}>{step.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Restore Upcoming Session per User Context */}
                {upcomingBooking && (
                    <View style={styles.upcomingSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>UPCOMING SESSION</Text>
                            <View style={[styles.timeTag, { backgroundColor: colors.primaryLight }]}>
                                <Icons.Clock size={12} color={colors.primary} />
                                <Text style={[styles.timeTagText, { color: colors.primary }]}>
                                    {new Date(upcomingBooking.booking_date).toLocaleDateString()} • {new Date(upcomingBooking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.appointmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Bookings')}>
                            <View style={[styles.appointmentIcon, { backgroundColor: isDark ? colors.surfaceSecondary : '#fff7ed' }]}>
                                <Icons.Sparkles size={22} color={colors.accent} />
                            </View>
                            <View style={styles.appointmentInfo}>
                                <Text style={[styles.appointmentTitle, { color: colors.text }]}>{upcomingBooking.service?.name || 'Pet Service'}</Text>
                                <Text style={styles.appointmentDate}>{upcomingBooking.booking_pets?.[0]?.pet?.name || 'Your Pet'} • {upcomingBooking.address || 'Your Location'}</Text>
                            </View>
                            <Icons.ChevronRight size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Floating AI Assistant Button */}
            <TouchableOpacity
                style={styles.aiFab}
                onPress={() => navigation.navigate('AIChatScreen')}
            >
                <Bot size={28} color="white" />
                <View style={styles.aiPing} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: 'bold' },
    container: { paddingBottom: 100 },
    aiFab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    aiPing: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#14b8a6',
        borderWidth: 2,
        borderColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTextGroup: { flex: 1 },
    greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    greetingText: { fontSize: 16, fontWeight: '600', color: '#64748b', lineHeight: 32 },
    nameText: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, lineHeight: 32 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pinBg: { width: 22, height: 22, borderRadius: 6, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
    addressText: { fontSize: 12, color: '#94a3b8', fontWeight: '700', maxWidth: width * 0.6 },
    notificationBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    notificationBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: '#f97316',
        borderWidth: 2,
        borderColor: 'white',
    },
    searchContainer: { paddingHorizontal: 24, marginBottom: 28 },
    searchWrapper: { position: 'relative' },
    searchIcon: { position: 'absolute', left: 16, top: 18, zIndex: 1 },
    searchInput: {
        height: 56,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingLeft: 48,
        paddingRight: 16,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        fontSize: 14,
        color: '#0f172a',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 0.5,
    },
    bannerScroll: { paddingLeft: 24, marginBottom: 32 },
    bannerCard: {
        height: 170,
        borderRadius: 28,
        overflow: 'hidden',
        marginRight: 16,
        backgroundColor: '#f1f5f9',
    },
    bannerImage: { width: '100%', height: '100%', position: 'absolute' },
    bannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 24,
        justifyContent: 'flex-end',
    },
    bannerTitle: { color: 'white', fontSize: 19, fontWeight: '900', marginBottom: 6 },
    bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
    quickActions: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 32 },
    quickActionBtn: {
        flex: 1,
        height: 128,
        borderRadius: 32,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    quickActionIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    quickActionText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 36 },
    walletCard: {
        flex: 1.6,
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 20,
        paddingBottom: 24,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8
    },
    statIconCircle: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(20, 184, 166, 0.1)', alignItems: 'center', justifyContent: 'center' },
    statIconCircleOrange: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    walletLabel: { fontSize: 10, fontWeight: '900', color: '#14b8a6', letterSpacing: 1.5 },
    priceRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 8 },
    currencySymbol: { color: '#14b8a6', fontSize: 18, fontWeight: '900', marginTop: 4, marginRight: 2 },
    walletValue: { fontSize: 32, fontWeight: '900', color: 'white' },
    walletDetails: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    walletDetailsText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
    petsCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1
    },
    petsCountRow: { marginBottom: 4 },
    petsCount: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
    petsLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#0f172a', letterSpacing: 1.8, textTransform: 'uppercase' },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 16, marginBottom: 40 },
    serviceItem: { alignItems: 'center', gap: 10 },
    serviceIcon: { width: 70, height: 70, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
    serviceName: { fontSize: 11, fontWeight: '800', color: '#475569', textAlign: 'center' },
    howItWorksContainer: { marginBottom: 44, paddingHorizontal: 24 },
    guideBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdfa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#ccfbf1' },
    guideText: { fontSize: 9, fontWeight: '900', color: '#14b8a6', letterSpacing: 1.2 },
    stepsWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, position: 'relative' },
    stepBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
    stepCircleOuter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    stepCircleInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    stepNumberBadge: { position: 'absolute', top: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
    stepNumber: { color: 'white', fontSize: 11, fontWeight: 'bold' },
    stepTitleText: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginBottom: 6, textAlign: 'center' },
    stepDescText: { fontSize: 9.5, color: '#64748b', textAlign: 'center', fontWeight: '700', lineHeight: 13 },
    stepConnector: { position: 'absolute', right: -25, top: 36, width: 50, height: 2, backgroundColor: '#f1f5f9', zIndex: -1 },
    upcomingSection: { marginBottom: 40 },
    timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdfa', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, gap: 8 },
    timeTagText: { fontSize: 11, fontWeight: '900', color: '#14b8a6' },
    appointmentCard: { marginHorizontal: 24, backgroundColor: 'white', borderRadius: 32, padding: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
    appointmentIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 20 },
    appointmentInfo: { flex: 1 },
    appointmentTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
    appointmentDate: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
    comingSoonBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
        zIndex: 10,
    },
    comingSoonText: {
        color: 'white',
        fontSize: 8,
        fontWeight: '900',
    },
    videosSection: {
        marginBottom: 40,
    },
    videoCard: {
        width: 160,
        height: 240,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoCategoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 4,
    },
    videoCategoryText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    videoTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
