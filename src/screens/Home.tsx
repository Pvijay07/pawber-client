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
    RefreshControl
} from 'react-native';
import * as Icons from 'lucide-react-native';
import {
    Bell,
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
import { contentService } from '../services/content.service';
import { walletApi as walletService } from '../services/wallet.service';
import { petsApi as petsService } from '../services/pets.service';

import { authApi } from '../services/auth.service';

const { width } = Dimensions.get('window');

interface HomeProps {
    navigation: any;
}

export default function Home({ navigation }: HomeProps) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [homepageContent, setHomepageContent] = useState<any>(null);
    const [walletData, setWalletData] = useState<any>(null);
    const [petsCount, setPetsCount] = useState(0);
    const [user, setUser] = useState<any>(null);

    const isCompact = width < 400;
    const serviceColumns = isCompact ? 3 : 5;
    const serviceItemWidth = isCompact
        ? (width - 48 - 24) / serviceColumns
        : (width - 48 - 48) / serviceColumns;

    const [services] = useState([
        { id: 'grooming', name: 'Grooming', icon: 'Scissors', color: '#f97316', bgColor: '#fff7ed' },
        { id: 'vet', name: 'Vet Visit', icon: 'Stethoscope', color: '#14b8a6', bgColor: '#f0fdfa' },
        { id: 'boarding', name: 'Boarding', icon: 'Home', color: '#3b82f6', bgColor: '#eff6ff' },
        { id: 'walking', name: 'Walking', icon: 'MapPin', color: '#a855f7', bgColor: '#faf5ff' },
        { id: 'training', name: 'Training', icon: 'GraduationCap', color: '#f59e0b', bgColor: '#fffbeb' },
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [content, wallet, pets, profile] = await Promise.all([
                contentService.getHomepageContent(),
                walletService.get(),
                petsService.list(),
                authApi.getProfile()
            ]);

            if ((content as any)?.content) setHomepageContent((content as any).content);
            if (wallet?.success && wallet.data) setWalletData(wallet.data.wallet);
            if (pets?.success && pets.data) setPetsCount(pets.data.pets.length);
            if (profile?.data?.user) setUser(profile.data.user);
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

    const banners = homepageContent?.client_home_banners || [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.container} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#14b8a6']} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTextGroup}>
                        <View style={styles.greetingRow}>
                            <Text style={styles.greetingText}>Hello, </Text>
                            <Text style={styles.nameText}>{user?.full_name?.split(' ')[0] || 'Friend'}</Text>
                        </View>
                        <TouchableOpacity style={styles.addressRow} onPress={() => navigation.navigate('Addresses')}>
                            <MapPin size={12} color="#14b8a6" />
                            <Text style={styles.addressText} numberOfLines={1}>123 Pet Lane, Mumbai 400001</Text>
                            <ChevronRight size={12} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
                        <Bell size={22} color="#0f172a" strokeWidth={2.2} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchWrapper}>
                        <Search size={18} color="#94a3b8" style={styles.searchIcon} />
                        <TextInput
                            placeholder="What does your pet need today?"
                            style={styles.searchInput}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                {/* dynamic Banners */}
                {banners.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={styles.bannerScroll}>
                        {banners.map((banner: any, index: number) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.bannerCard, { width: width - 48 }]}
                                onPress={() => navigation.navigate(banner.action, { serviceId: banner.serviceId })}
                            >
                                <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                                <View style={styles.bannerOverlay}>
                                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}
                        onPress={() => navigation.navigate('BookingFlow', { serviceId: 'vet' })}
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

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.walletCard}>
                        <View style={styles.walletHeader}>
                            <WalletIcon size={14} color="#14b8a6" />
                            <Text style={styles.walletLabel}>BALANCE</Text>
                        </View>
                        <Text style={styles.walletValue}>₹{walletData?.balance || '0.00'}</Text>
                        <TouchableOpacity style={styles.walletDetails} onPress={() => navigation.navigate('Wallet')}>
                            <Text style={styles.walletDetailsText}>Refill Wallet </Text>
                            <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.petsCard} onPress={() => navigation.navigate('Pets')}>
                        <View style={styles.heartIcon}>
                            <Heart size={20} color="#f97316" fill="#f97316" />
                        </View>
                        <Text style={styles.petsCount}>{petsCount}</Text>
                        <Text style={styles.petsLabel}>MY PETS</Text>
                    </TouchableOpacity>
                </View>

                {/* Services Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>EXPLORE SERVICES</Text>
                </View>

                <View style={styles.servicesGrid}>
                    {services.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={[styles.serviceItem, { width: serviceItemWidth }]}
                            onPress={() => navigation.navigate('BookingFlow', { serviceId: service.id })}
                        >
                            <View style={[styles.serviceIcon, { backgroundColor: service.bgColor }]}>
                                {renderIcon(service.icon, 28, service.color)}
                            </View>
                            <Text style={styles.serviceName}>{service.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* How It Works Section */}
                <View style={styles.howItWorksContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
                        <View style={styles.guideBadge}>
                            <Info size={12} color="#14b8a6" />
                            <Text style={styles.guideText}>EASY GUIDE</Text>
                        </View>
                    </View>
                    
                    <View style={styles.stepsWrapper}>
                        {howItWorksSteps.map((step: any, index: number) => (
                            <View key={index} style={styles.stepBlock}>
                                <View style={styles.stepCircleOuter}>
                                    <View style={styles.stepCircleInner}>
                                        {renderIcon(step.icon, 22, '#0f172a')}
                                    </View>
                                    <View style={styles.stepNumberBadge}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                    </View>
                                </View>
                                <Text style={styles.stepTitleText}>{step.title}</Text>
                                <Text style={styles.stepDescText}>{step.description}</Text>
                                {index < howItWorksSteps.length - 1 && (
                                    <View style={styles.stepConnector} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Upcoming */}
                <View style={styles.upcomingSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>UPCOMING SESSION</Text>
                        <View style={styles.timeTag}>
                            <Clock size={12} color="#14b8a6" />
                            <Text style={styles.timeTagText}>Today • 11:30 AM</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.appointmentCard} onPress={() => navigation.navigate('Bookings')}>
                        <View style={styles.appointmentIcon}>
                            <Sparkles size={22} color="#f97316" />
                        </View>
                        <View style={styles.appointmentInfo}>
                            <Text style={styles.appointmentTitle}>Spa & Grooming</Text>
                            <Text style={styles.appointmentDate}>Max • Sector 14, Mumbai</Text>
                        </View>
                        <ChevronRight size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: 'bold' },
    container: { paddingBottom: 60 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTextGroup: { flex: 1 },
    greetingRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
    greetingText: { fontSize: 18, fontWeight: '500', color: '#64748b' },
    nameText: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addressText: { fontSize: 12, color: '#94a3b8', fontWeight: '700', maxWidth: width * 0.6 },
    notificationBtn: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    notificationBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f97316',
        borderWidth: 2,
        borderColor: 'white',
    },
    searchContainer: { paddingHorizontal: 24, marginBottom: 24 },
    searchWrapper: { position: 'relative' },
    searchIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },
    searchInput: {
        height: 52,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingLeft: 48,
        paddingRight: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        fontSize: 14,
        color: '#0f172a',
    },
    bannerScroll: { paddingLeft: 24, marginBottom: 28 },
    bannerCard: {
        height: 160,
        borderRadius: 24,
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
    bannerTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 4 },
    bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
    quickActions: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 28 },
    quickActionBtn: {
        flex: 1,
        height: 120,
        borderRadius: 28,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    quickActionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    quickActionText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
    walletCard: { flex: 2, backgroundColor: '#0f172a', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    walletLabel: { fontSize: 10, fontWeight: 'bold', color: '#14b8a6', letterSpacing: 1.5 },
    walletValue: { fontSize: 26, fontWeight: '900', color: 'white', marginBottom: 12 },
    walletDetails: { flexDirection: 'row', alignItems: 'center' },
    walletDetailsText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
    petsCard: { flex: 1, backgroundColor: '#fff', borderRadius: 32, borderWidth: 1.5, borderColor: '#f1f5f9', padding: 20, alignItems: 'center', justifyContent: 'center' },
    heartIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    petsCount: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
    petsLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 18 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a', letterSpacing: 1.5, textTransform: 'uppercase' },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 36 },
    serviceItem: { alignItems: 'center', gap: 8 },
    serviceIcon: { width: 66, height: 66, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
    serviceName: { fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' },
    howItWorksContainer: { marginBottom: 40, paddingHorizontal: 24 },
    guideBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0fdfa', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#ccfbf1' },
    guideText: { fontSize: 9, fontWeight: '900', color: '#14b8a6', letterSpacing: 1 },
    stepsWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    stepBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
    stepCircleOuter: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    stepCircleInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    stepNumberBadge: { position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    stepNumber: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    stepTitleText: { fontSize: 11, fontWeight: '800', color: '#0f172a', marginBottom: 4, textAlign: 'center' },
    stepDescText: { fontSize: 9, color: '#64748b', textAlign: 'center', fontWeight: '600', lineHeight: 12 },
    stepConnector: { position: 'absolute', right: -15, top: 32, width: 30, height: 2, backgroundColor: '#f1f5f9' },
    upcomingSection: { marginBottom: 32 },
    timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdfa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    timeTagText: { fontSize: 10, fontWeight: '900', color: '#14b8a6' },
    appointmentCard: { marginHorizontal: 24, backgroundColor: 'white', borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
    appointmentIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    appointmentInfo: { flex: 1 },
    appointmentTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
    appointmentDate: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
});
