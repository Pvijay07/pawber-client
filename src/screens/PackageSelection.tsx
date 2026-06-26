import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    Platform,
    ActivityIndicator
} from 'react-native';
import {
    ArrowLeft,
    Check,
    Clock,
    Zap,
    Calendar as CalendarIcon,
    Info,
    AlertCircle
} from 'lucide-react-native';
import { servicesApi } from '../services/services.service';
import { ServiceDetail } from '../shared/types';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function PackageSelection({ navigation, route }: any) {
    const { colors, isDark } = useTheme();
    const serviceId = route?.params?.serviceId;
    const categoryId = route?.params?.categoryId;
    
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
                let targetServiceId = serviceId;
                console.log('🔍 Fetching PackageSelection data for:', { serviceId, categoryId });

                // If we only have a category, fetch the first service in that category
                if (!targetServiceId && categoryId) {
                    const servicesRes = await servicesApi.list(categoryId);
                    if (servicesRes.success && servicesRes.data && servicesRes.data.services && servicesRes.data.services.length > 0) {
                        // Prefer the service with a slug (the main/canonical one with packages)
                        const withSlug = servicesRes.data.services.find((s: any) => s.slug);
                        targetServiceId = withSlug?.id || servicesRes.data.services[0].id;
                    }
                }

                if (!targetServiceId) {
                    // Try fallback if categoryId is a slug itself (sometimes passed this way)
                    if (categoryId) {
                        targetServiceId = categoryId;
                    } else {
                        throw new Error('No service specified');
                    }
                }

                const response = await servicesApi.getById(targetServiceId);
                console.log('📦 API Response for service:', { 
                    targetServiceId,
                    success: response.success, 
                    hasService: !!response.data?.service,
                    packageCount: response.data?.service?.packages?.length,
                    error: response.error?.message
                });

                if (response.success && response.data?.service) {
                    const svc = response.data.service;
                    const mapped = mapServiceData(svc);
                    console.log('✨ Mapped Service Data:', {
                        name: mapped.name,
                        packages: mapped.packages.map((p: any) => p.name)
                    });
                    
                    // Defensive check for packages - if empty, maybe try to fetch by category
                    if ((!mapped.packages || mapped.packages.length === 0) && svc.category_id) {
                        console.log('⚠️ Service has no packages, trying to find another service in same category');
                        const catServices = await servicesApi.list(svc.category_id);
                        if (catServices.success && catServices.data && catServices.data.services && catServices.data.services.length > 1) {
                            const otherService = catServices.data.services.find((s: any) => s.id !== svc.id && s.slug);
                            if (otherService) {
                                console.log('🔍 Checking other service in category:', otherService.name);
                                const otherRes = await servicesApi.getById(otherService.id);
                                if (otherRes.success && otherRes.data && otherRes.data.service && otherRes.data.service.packages && otherRes.data.service.packages.length > 0) {
                                    console.log('✅ Found packages in other service!');
                                    setService(mapServiceData(otherRes.data.service));
                                    return;
                                }
                            }
                        }
                    }

                    setService(mapped);
                }
            } catch (err) {
                console.error('Failed to fetch dynamic service data:', err);
            } finally {
                setLoading(false);
            }
        };

        const mapServiceData = (svc: any) => {
            const mapped = {
                ...svc,
                description: svc.description || '',
                image: svc.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400',
                packages: (svc.packages || []).map((p: any) => ({
                    id: p.id,
                    name: p.package_name || p.name,
                    price: p.price,
                    duration: `${p.duration_minutes || 0} mins`,
                    features: p.features || [],
                    isPopular: p.is_popular
                })),
                addons: (svc.addons || []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    price: a.price,
                    duration: `${a.duration_minutes || 0} mins`
                }))
            };
            
            if (mapped.packages.length > 0) {
                setSelectedPackage(mapped.packages.find((p: any) => p.isPopular)?.id || mapped.packages[0].id);
            }
            return mapped;
        };

        fetchDynamicData();
    }, [serviceId, categoryId]);

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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {loading ? (
                <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 12, fontWeight: 'bold', color: colors.textSecondary }}>Loading Service...</Text>
                </View>
            ) : !service ? (
                <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                    <AlertCircle size={48} color={colors.textMuted} />
                    <Text style={[styles.errorTitle, { color: colors.text }]}>Service Not Available</Text>
                    <Text style={[styles.errorSub, { color: colors.textSecondary }]}>This service is coming soon to your area.</Text>
                    <TouchableOpacity style={[styles.backBtnError, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Banner */}
                        <View style={styles.bannerContainer}>
                            <Image source={{ uri: service.image }} style={styles.bannerImage} />
                            <View style={styles.bannerOverlay} />
                            <View style={styles.bannerContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.categoryText}>
                                            {(service.category?.name || 'Service').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>STEP 1 OF 3</Text>
                                    </View>
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
                            <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <TouchableOpacity
                                    onPress={() => setBookingType('scheduled')}
                                    style={[styles.toggleBtn, bookingType === 'scheduled' && [styles.toggleBtnActive, { backgroundColor: colors.text }]]}
                                >
                                    <CalendarIcon size={14} color={bookingType === 'scheduled' ? colors.background : colors.textMuted} />
                                    <Text style={[styles.toggleBtnText, { color: colors.textMuted }, bookingType === 'scheduled' && { color: colors.background }]}>
                                        SCHEDULED
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setBookingType('instant')}
                                    style={[styles.toggleBtn, bookingType === 'instant' && [styles.toggleBtnActiveInstant, { backgroundColor: colors.primary }]]}
                                >
                                    <Zap size={14} color={bookingType === 'instant' ? 'white' : colors.textMuted} />
                                    <Text style={[styles.toggleBtnText, { color: colors.textMuted }, bookingType === 'instant' && { color: 'white' }]}>
                                        INSTANT (+15%)
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Packages */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Package</Text>
                                <View style={styles.packagesContainer}>
                                    {packages.length > 0 ? (
                                        packages.map((pkg: any) => (
                                            <TouchableOpacity
                                                key={pkg.id}
                                                onPress={() => setSelectedPackage(pkg.id)}
                                                style={[
                                                    styles.packageCard,
                                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                                    selectedPackage === pkg.id && [styles.packageCardSelected, { borderColor: colors.primary }]
                                                ]}
                                            >
                                                {pkg.isPopular && (
                                                    <View style={[styles.popularBadge, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                                                        <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                                                    </View>
                                                )}
                                                <View style={styles.packageHeader}>
                                                    <View style={styles.packageNameBox}>
                                                        <Text style={[styles.packageName, { color: colors.text }]}>{pkg.name}</Text>
                                                        <View style={styles.pkgDurationRow}>
                                                            <Clock size={12} color={colors.textMuted} />
                                                            <Text style={[styles.pkgDurationText, { color: colors.textMuted }]}>{pkg.duration}</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.packagePrice, { color: colors.text }]}>₹{pkg.price}</Text>
                                                </View>

                                                <View style={styles.featuresList}>
                                                    {pkg.features.map((feature: string, idx: number) => (
                                                        <View key={idx} style={styles.featureItem}>
                                                            <View style={[styles.checkIconBox, { backgroundColor: colors.primaryLight }]}>
                                                                <Check size={10} color={colors.primary} strokeWidth={4} />
                                                            </View>
                                                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                                                        </View>
                                                    ))}
                                                </View>

                                                <View style={[
                                                    styles.radioCircle,
                                                    { borderColor: colors.borderSecondary },
                                                    selectedPackage === pkg.id && { borderColor: colors.primary }
                                                ]}>
                                                    {selectedPackage === pkg.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={[styles.emptyPackages, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <AlertCircle size={32} color={colors.textMuted} />
                                            <Text style={[styles.emptyPackagesText, { color: colors.textSecondary }]}>No packages found for this service.</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Add-ons Section */}
                            {addons.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.addonsHeader}>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Customize Your Session</Text>
                                        <Info size={16} color={colors.textMuted} />
                                    </View>
                                    <View style={styles.addonsContainer}>
                                        {addons.map((addon: any) => (
                                            <TouchableOpacity
                                                key={addon.id}
                                                style={[
                                                    styles.addonCard,
                                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                                    selectedAddons.includes(addon.id) && [styles.addonCardSelected, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]
                                                ]}
                                                onPress={() => toggleAddon(addon.id)}
                                            >
                                                <View style={styles.addonInfo}>
                                                    <Text style={[styles.addonName, { color: colors.text }]}>{addon.name}</Text>
                                                    <Text style={[styles.addonPriceText, { color: colors.textMuted }]}>
                                                        +₹{addon.price} • {addon.duration}
                                                    </Text>
                                                </View>
                                                <View style={[
                                                    styles.addonCheck,
                                                    { borderColor: colors.borderSecondary },
                                                    selectedAddons.includes(addon.id) && [styles.addonCheckActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                                                ]}>
                                                    {selectedAddons.includes(addon.id) && <Check size={12} color="white" strokeWidth={4} />}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Sticky Bottom Bar */}
                    <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                        <View style={styles.priceContainer}>
                            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL PRICE</Text>
                            <View style={styles.totalPriceRow}>
                                <Text style={[styles.totalPrice, { color: colors.text }]}>₹{calculateTotal().toFixed(0)}</Text>
                                {bookingType === 'instant' && (
                                    <View style={styles.surgeBadge}>
                                        <Zap size={10} color={colors.primary} />
                                        <Text style={[styles.surgeText, { color: colors.primary }]}>SURGE APPLIED</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('BookingFlow', { 
                                serviceId: service?.id || serviceId, 
                                packageId: selectedPackage, 
                                addonIds: selectedAddons,
                                bookingType: bookingType 
                            })}
                            style={[styles.bookBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
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
    },
    scrollContent: {
        paddingBottom: 140,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16
    },
    errorSub: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22
    },
    backBtnError: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12
    },
    backBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
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
        padding: 6,
        borderRadius: 20,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
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
    },
    toggleBtnActiveInstant: {
    },
    toggleBtnText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    section: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    packagesContainer: {
        gap: 16,
    },
    packageCard: {
        borderRadius: 28,
        padding: 24,
        borderWidth: 2,
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 10 },
    },
    packageCardSelected: {
        shadowOpacity: 0.08,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        left: '50%',
        marginLeft: -60,
        width: 120,
        paddingVertical: 4,
        borderRadius: 20,
        alignItems: 'center',
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
    },
    pkgDurationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pkgDurationText: {
        fontSize: 11,
        fontWeight: '700',
    },
    packagePrice: {
        fontSize: 22,
        fontWeight: '900',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 13,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    addonsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    addonsContainer: {
        gap: 12,
    },
    addonCard: {
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
    },
    addonCardSelected: {
    },
    addonInfo: {
        flex: 1,
    },
    addonName: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    addonPriceText: {
        fontSize: 12,
        fontWeight: '700',
    },
    addonCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addonCheckActive: {
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
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
    },
    surgeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    surgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    bookBtn: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 18,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 10 },
    },
    bookBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptyPackages: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 2,
        borderStyle: 'dashed'
    },
    emptyPackagesText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    }
});
