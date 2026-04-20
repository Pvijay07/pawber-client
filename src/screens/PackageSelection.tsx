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
    Platform,
    ActivityIndicator,
} from 'react-native';
import {
    ArrowLeft,
    Check,
    Clock,
    Zap,
    Calendar as CalendarIcon,
    Info,
} from 'lucide-react-native';
import { servicesApi } from '../services/services.service';
import { ServiceDetail } from '../shared/types';

const { width } = Dimensions.get('window');

export default function PackageSelection({ navigation, route }: any) {
    const serviceId = route?.params?.serviceId || 'grooming';
    
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [bookingType, setBookingType] = useState<'instant' | 'scheduled'>('scheduled');
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    const packages = service?.packages || [];
    const addons = service?.addons || [];

    useEffect(() => {
        const fetchDynamicData = async () => {
            setLoading(true);
            try {
                const response = await servicesApi.getById(serviceId);
                if (response.success && response.data?.service) {
                    const svc = response.data.service;
                    const mappedSvc = {
                        ...svc,
                        description: svc.description || '',
                        image: svc.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400',
                        packages: svc.packages.map((p: any) => ({
                            id: p.id,
                            name: p.package_name,
                            price: p.price,
                            duration: `${p.duration_minutes} mins`,
                            features: p.features || [],
                            isPopular: p.is_popular
                        })),
                        addons: svc.addons.map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            price: a.price,
                            duration: `${a.duration_minutes} mins`
                        }))
                    };
                    setService(mappedSvc);
                    if (mappedSvc.packages.length > 0) {
                        setSelectedPackage(mappedSvc.packages.find((p: any) => p.isPopular)?.id || mappedSvc.packages[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch dynamic service data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDynamicData();
    }, [serviceId]);

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const calculateTotal = () => {
        const pkg = packages.find((p: any) => p.id === selectedPackage);
        let total = pkg ? pkg.price : 0;

        selectedAddons.forEach(addonId => {
            const addon = addons.find((a: any) => a.id === addonId);
            if (addon) total += addon.price;
        });

        if (bookingType === 'instant') {
            total = total * 1.15; // 15% surge fee
        }

        return total;
    };

    return (
        <View style={styles.container}>
            {(loading || !service) ? (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text style={{ marginTop: 12, fontWeight: 'bold', color: '#64748b' }}>Loading Service...</Text>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Banner */}
                        <View style={styles.bannerContainer}>
                            <Image source={{ uri: service.image }} style={styles.bannerImage} />
                            <View style={styles.bannerOverlay} />
                            <View style={styles.bannerContent}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>
                                        {service.id.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.serviceName}>{service.name}</Text>
                                <View style={styles.durationRow}>
                                    <Clock size={14} color="#e2e8f0" />
                                    <Text style={styles.durationText}>15 - 150 MINS</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <ArrowLeft size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mainContent}>
                            {/* Booking Type Toggle */}
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                    onPress={() => setBookingType('scheduled')}
                                    style={[styles.toggleBtn, bookingType === 'scheduled' && styles.toggleBtnActive]}
                                >
                                    <CalendarIcon size={14} color={bookingType === 'scheduled' ? 'white' : '#64748b'} />
                                    <Text style={[styles.toggleBtnText, bookingType === 'scheduled' && styles.toggleBtnTextActive]}>
                                        SCHEDULED
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setBookingType('instant')}
                                    style={[styles.toggleBtn, bookingType === 'instant' && styles.toggleBtnActiveInstant]}
                                >
                                    <Zap size={14} color={bookingType === 'instant' ? 'white' : '#64748b'} />
                                    <Text style={[styles.toggleBtnText, bookingType === 'instant' && styles.toggleBtnTextActive]}>
                                        INSTANT (+15%)
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Packages */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Select Package</Text>
                                <View style={styles.packagesContainer}>
                                    {packages.map((pkg: any) => (
                                        <TouchableOpacity
                                            key={pkg.id}
                                            onPress={() => setSelectedPackage(pkg.id)}
                                            style={[
                                                styles.packageCard,
                                                selectedPackage === pkg.id && styles.packageCardSelected
                                            ]}
                                        >
                                            {pkg.isPopular && (
                                                <View style={styles.popularBadge}>
                                                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                                                </View>
                                            )}
                                            <View style={styles.packageHeader}>
                                                <View style={styles.packageNameBox}>
                                                    <Text style={styles.packageName}>{pkg.name}</Text>
                                                    <View style={styles.pkgDurationRow}>
                                                        <Clock size={12} color="#94a3b8" />
                                                        <Text style={styles.pkgDurationText}>{pkg.duration}</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.packagePrice}>₹{pkg.price}</Text>
                                            </View>

                                            <View style={styles.featuresList}>
                                                {pkg.features.map((feature: string, idx: number) => (
                                                    <View key={idx} style={styles.featureItem}>
                                                        <View style={styles.checkIconBox}>
                                                            <Check size={10} color="#f97316" strokeWidth={4} />
                                                        </View>
                                                        <Text style={styles.featureText}>{feature}</Text>
                                                    </View>
                                                ))}
                                            </View>

                                            <View style={[
                                                styles.radioCircle,
                                                selectedPackage === pkg.id && styles.radioCircleSelected
                                            ]}>
                                                {selectedPackage === pkg.id && <View style={styles.radioInner} />}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Add-ons */}
                            <View style={styles.section}>
                                <View style={styles.addonsHeader}>
                                    <Text style={styles.sectionTitle}>Add-ons</Text>
                                    <Info size={16} color="#94a3b8" />
                                </View>
                                <View style={styles.addonsContainer}>
                                    {addons.map((addon: any) => (
                                        <View key={addon.id} style={styles.addonCard}>
                                            <View>
                                                <Text style={styles.addonName}>{addon.name}</Text>
                                                <Text style={styles.addonPriceText}>
                                                    +₹{addon.price} • {addon.duration}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => toggleAddon(addon.id)}
                                                style={[
                                                    styles.toggleSwitch,
                                                    selectedAddons.includes(addon.id) && styles.toggleSwitchOn
                                                ]}
                                            >
                                                <View style={[
                                                    styles.toggleCircle,
                                                    selectedAddons.includes(addon.id) && styles.toggleCircleOn
                                                ]} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Sticky Bottom Bar */}
                    <View style={styles.bottomBar}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.totalLabel}>TOTAL PRICE</Text>
                            <View style={styles.totalPriceRow}>
                                <Text style={styles.totalPrice}>₹{calculateTotal().toFixed(0)}</Text>
                                {bookingType === 'instant' && (
                                    <View style={styles.surgeBadge}>
                                        <Zap size={10} color="#f97316" />
                                        <Text style={styles.surgeText}>SURGE APPLIED</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('BookingFlow', { serviceId, packageId: selectedPackage, addonIds: selectedAddons })}
                            style={styles.bookBtn}
                        >
                            <Text style={styles.bookBtnText}>BOOK NOW</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 140,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerContainer: {
        height: 280,
        width: '100%',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    bannerContent: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
    },
    categoryBadge: {
        backgroundColor: '#f97316',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    categoryText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    serviceName: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginBottom: 4,
    },
    durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    durationText: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainContent: {
        padding: 24,
        gap: 32,
    },
    toggleContainer: {
        backgroundColor: 'white',
        padding: 6,
        borderRadius: 20,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
    },
    toggleBtnActive: {
        backgroundColor: '#0f172a',
    },
    toggleBtnActiveInstant: {
        backgroundColor: '#f97316',
    },
    toggleBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
    },
    toggleBtnTextActive: {
        color: 'white',
    },
    section: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    packagesContainer: {
        gap: 16,
    },
    packageCard: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 24,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 10 },
    },
    packageCardSelected: {
        borderColor: '#f97316',
        shadowOpacity: 0.08,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        left: '50%',
        marginLeft: -60,
        width: 120,
        backgroundColor: '#f97316',
        paddingVertical: 4,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#f97316',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
    },
    popularBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    packageNameBox: {
        gap: 4,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    pkgDurationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pkgDurationText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
    },
    packagePrice: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },
    featuresList: {
        gap: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkIconBox: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    radioCircle: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        borderColor: '#f97316',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#f97316',
    },
    addonsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addonsContainer: {
        gap: 12,
    },
    addonCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    addonName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    addonPriceText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
    },
    toggleSwitch: {
        width: 48,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        padding: 2,
    },
    toggleSwitchOn: {
        backgroundColor: '#f97316',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
    },
    toggleCircleOn: {
        alignSelf: 'flex-end',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -10 },
    },
    priceContainer: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    totalPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
    },
    surgeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    surgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#f97316',
        letterSpacing: 0.5,
    },
    bookBtn: {
        backgroundColor: '#f97316',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 18,
        shadowColor: '#f97316',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 10 },
    },
    bookBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
