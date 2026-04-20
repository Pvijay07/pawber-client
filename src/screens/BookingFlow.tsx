import React, { useState, useEffect, useCallback } from 'react';
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
    LayoutAnimation,
    Platform,
    UIManager,
    ActivityIndicator,
} from 'react-native';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Wallet,
    Check,
    Zap,
    Info,
    Timer,
    Receipt,
    Percent,
    MessageSquare,
    Star,
    Crown,
    Repeat,
    Plus,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { walletApi } from '../services/wallet.service';
import { servicesApi } from '../services/services.service';
import { petsApi } from '../services/pets.service';
import { bookingsApi } from '../services/bookings.service';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../hooks/useSocket';
import { Animated, Easing } from 'react-native';
import { ServiceDetail, Pet } from '../shared/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

interface BookingFlowProps {
    navigation: any;
    route: any;
}

const BookingRadar = () => {
    const scale1 = useRef(new Animated.Value(0)).current;
    const opacity1 = useRef(new Animated.Value(1)).current;
    const scale2 = useRef(new Animated.Value(0)).current;
    const opacity2 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animate = (scale: any, opacity: any, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 1.5, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true })
                    ])
                ])
            ).start();
        };

        animate(scale1, opacity1, 0);
        animate(scale2, opacity2, 1250);
    }, []);

    return (
        <View style={radarStyles.container}>
            <Animated.View style={[radarStyles.circle, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
            <Animated.View style={[radarStyles.circle, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
            <View style={radarStyles.center}>
                <Icons.Search size={32} color="white" />
            </View>
        </View>
    );
};

const radarStyles = StyleSheet.create({
    container: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
    circle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(20, 184, 166, 0.4)' },
    center: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#14b8a6', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 }
});

export default function BookingFlow({ navigation, route }: BookingFlowProps) {
    const serviceId = route?.params?.serviceId || 'grooming';
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [serviceData, setServiceData] = useState<ServiceDetail | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [selectedPets, setSelectedPets] = useState<string[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [serviceLocation, setServiceLocation] = useState<'home' | 'center'>('home');
    
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [recurringType, setRecurringType] = useState<'none' | 'weekly' | 'monthly'>('none');
    
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [instructions, setInstructions] = useState('');
    
    const [paymentMode, setPaymentMode] = useState<'wallet' | 'gateway' | 'split'>('wallet');
    const [couponCode, setCouponCode] = useState('');
    const [holdTimer, setHoldTimer] = useState(300);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsBalance, setPointsBalance] = useState(0);
    const [createdBooking, setCreatedBooking] = useState<any>(null);
    const [bookingStatus, setBookingStatus] = useState<string>('pending');

    const fetchInitialData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoadingData(true);
        try {
            const [svcRes, petsRes, addrJson, wallRes] = await Promise.all([
                servicesApi.getById(serviceId),
                petsApi.list(),
                AsyncStorage.getItem('@petcare_addresses'),
                walletApi.get()
            ]);

            if (svcRes.success && svcRes.data) setServiceData(svcRes.data.service);
            if (petsRes.success && petsRes.data) setPets(petsRes.data.pets);
            if (addrJson) setAddresses(JSON.parse(addrJson));
            if (wallRes.success && wallRes.data) setPointsBalance(wallRes.data.wallet.points_balance || 0);

        } catch (error) {
            console.error('Failed to load booking data:', error);
        } finally {
            if (showLoading) setIsLoadingData(false);
        }
    }, [serviceId]);

    useFocusEffect(
        useCallback(() => {
            fetchInitialData(false); // Silent refresh on focus
        }, [fetchInitialData])
    );

    useEffect(() => {
        fetchInitialData(true); // Full loading on mount
    }, [fetchInitialData]);

    useEffect(() => {
        if (step === 2 && holdTimer > 0) {
            const timer = setInterval(() => setHoldTimer(t => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [step, holdTimer]);

    const getNextDates = () => {
        const dates = [];
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i + 1);
            dates.push({
                full: d.toISOString().split('T')[0],
                day: d.getDate(),
                month: monthNames[d.getMonth()],
                label: i === 0 ? 'TOMORROW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
            });
        }
        return dates;
    };

    const dates = getNextDates();
    const times = [
        { time: '09:00 AM', available: true },
        { time: '10:30 AM', available: false },
        { time: '01:00 PM', available: true },
        { time: '03:30 PM', available: true },
        { time: '05:00 PM', available: true }
    ];

    const togglePet = (id: string) => {
        setSelectedPets(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const calculateTotal = () => {
        if (!serviceData) return 0;
        const pkg = serviceData.packages?.find(p => p.id === selectedPackage);
        let base = (pkg?.price || 0) * selectedPets.length;

        selectedAddons.forEach(id => {
            const addon = serviceData.addons?.find(a => a.id === id);
            if (addon) base += addon.price * selectedPets.length;
        });

        if (recurringType !== 'none') base = base * 0.9;
        if (couponCode === 'SAVE20') base = base * 0.8;

        if (usePoints) {
            const redeemable = Math.min(pointsBalance, base);
            base -= redeemable;
        }

        return Math.max(0, base);
    };

    const handleNext = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (step < 4) setStep(step + 1);
        else if (step === 4) {
            submitBooking();
        } else {
            navigation.navigate('Home');
        }
    };

    const submitBooking = async () => {
        setIsSubmitting(true);
        try {
            const res = await bookingsApi.create({
                service_id: serviceId,
                package_id: selectedPackage!,
                booking_type: 'scheduled',
                pet_ids: selectedPets,
                booking_date: selectedDate!,
                address: addresses.find(a => a.id === selectedAddress)?.address,
                notes: instructions,
                coupon_code: couponCode,
                points_to_use: usePoints ? Math.min(pointsBalance, calculateTotal()) : 0
            });

            if (res.success && res.data) {
                setCreatedBooking(res.data.booking);
                setStep(5);
            } else {
                alert('Booking failed: ' + ((res as any).error?.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Submit booking error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const { on } = useSocket();

    useEffect(() => {
        if (!createdBooking?.id) return;

        console.log('📡 Tracking Booking Status (Socket + DB):', createdBooking.id);
        
        // 1. Database Subscription (Fallback)
        const channel = supabase
            .channel(`booking_status:${createdBooking.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bookings',
                filter: `id=eq.${createdBooking.id}`
            }, (payload: any) => {
                console.log('🔄 Booking Status Updated (DB):', payload.new.status);
                setBookingStatus(payload.new.status);
            })
            .subscribe();

        // 2. Real-time Socket Listener (Uber-style)
        const unsubAccepted = on('BOOKING_ACCEPTED', (data: any) => {
            console.log('✨ Booking Accepted by Provider!', data);
            setBookingStatus('accepted');
            setCreatedBooking(data.booking);
            // Optional: Vibrate
        });

        const unsubTimeout = on('booking_timeout', (data: any) => {
            console.log('❌ Booking expansion timed out');
            setBookingStatus('timeout');
        });

        return () => {
            supabase.removeChannel(channel);
            unsubAccepted();
            unsubTimeout();
        };
    }, [createdBooking, on]);

    const handlePay = async () => {
        setIsSubmitting(true);
        try {
            const res = await bookingsApi.confirmPayment(createdBooking.id);
            if (res.success) {
                setBookingStatus('confirmed');
            }
        } catch (error) {
            alert('Payment failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (step > 1) setStep(step - 1);
        else navigation.goBack();
    };

    const isNextDisabled = () => {
        if (step === 1) return selectedPets.length === 0 || !selectedPackage || !selectedAddress;
        if (step === 2) return !selectedDate || !selectedTime;
        return false;
    };

    const formatTimer = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (isLoadingData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#14b8a6" />
                    <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#64748b' }}>Loading Service Details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>{step === 5 ? 'CONFIRMED' : 'BOOKING'}</Text>
                        {step < 5 && <Text style={styles.stepIndicator}>Step {step} of 4</Text>}
                    </View>
                    <TouchableOpacity style={styles.infoBtn}>
                        <Info size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                {step < 5 && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBase, { width: `${(step / 4) * 100}%` } ]} />
                    </View>
                )}

                <View style={styles.scrollContainer}>
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {step === 1 && (
                            <View style={styles.stepView}>
                                <View style={styles.textGroup}>
                                    <Text style={styles.title}>Selection <Text style={styles.italic}>Hub</Text>.</Text>
                                    <Text style={styles.subtitle}>Let's finalize your booking details.</Text>
                                </View>

                                {/* Pet Selection */}
                                <View style={styles.sectionBlock}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>WHICH PETS?</Text>
                                        <Text style={styles.selectionCount}>{selectedPets.length} Selected</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petScroll}>
                                        {pets.map(pet => (
                                            <TouchableOpacity
                                                key={pet.id}
                                                onPress={() => togglePet(pet.id)}
                                                style={[styles.petCard, selectedPets.includes(pet.id) && styles.petCardActive]}
                                            >
                                                <View style={styles.petImageWrapper}>
                                                    <Image source={{ uri: pet.image_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200' }} style={styles.petImage} />
                                                </View>
                                                <Text style={[styles.petName, selectedPets.includes(pet.id) && styles.petNameActive]}>{pet.name}</Text>
                                                {selectedPets.includes(pet.id) && (
                                                    <View style={styles.checkIcon}>
                                                        <Check size={10} color="white" strokeWidth={4} />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Pets')}
                                            style={[styles.petCard, styles.petCardAdd]}
                                        >
                                            <View style={styles.addIconCircle}>
                                                <Plus size={20} color="#14b8a6" />
                                            </View>
                                            <Text style={styles.addText}>ADD PET</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>

                                {/* Visit Type - Grooming Only */}
                                {serviceId === 'grooming' && (
                                    <View style={styles.sectionBlock}>
                                        <Text style={styles.sectionTitle}>VISIT TYPE</Text>
                                        <View style={styles.locationTabs}>
                                            <TouchableOpacity
                                                onPress={() => setServiceLocation('home')}
                                                style={[styles.locationTab, serviceLocation === 'home' && styles.locationTabActive]}
                                            >
                                                <Text style={[styles.locationTabText, serviceLocation === 'home' && styles.locationTabTextActive]}>AT HOME</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setServiceLocation('center')}
                                                style={[styles.locationTab, serviceLocation === 'center' && styles.locationTabActive]}
                                            >
                                                <Text style={[styles.locationTabText, serviceLocation === 'center' && styles.locationTabTextActive]}>AT CENTER</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* Address Selection */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>ADDRESS</Text>
                                    <View style={styles.addressList}>
                                        {addresses.map(addr => (
                                            <TouchableOpacity
                                                key={addr.id}
                                                onPress={() => setSelectedAddress(addr.id)}
                                                style={[styles.addressCard, selectedAddress === addr.id && styles.addressCardActive]}
                                            >
                                                <View style={[styles.addrIconBox, selectedAddress === addr.id && styles.addrIconBoxActive]}>
                                                    <MapPin size={18} color={selectedAddress === addr.id ? "white" : "#cbd5e1"} />
                                                </View>
                                                <View style={styles.addrInfo}>
                                                    <Text style={styles.addrLabel}>{addr.label}</Text>
                                                    <Text style={styles.addrText} numberOfLines={1}>{addr.address}</Text>
                                                </View>
                                                <View style={[styles.radioCircle, selectedAddress === addr.id && styles.radioCircleActive]}>
                                                    {selectedAddress === addr.id && <Check size={12} color="white" />}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Addresses')}
                                            style={[styles.addressCard, styles.addressCardAdd]}
                                        >
                                            <View style={styles.addIconBox}>
                                                <Plus size={18} color="#14b8a6" />
                                            </View>
                                            <Text style={styles.addTextSmall}>ADD NEW ADDRESS</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Package Selection */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>THE PLAN</Text>
                                    <View style={styles.packageList}>
                                        {serviceData?.packages?.map(pkg => (
                                            <TouchableOpacity
                                                key={pkg.id}
                                                onPress={() => setSelectedPackage(pkg.id)}
                                                style={[styles.packageCard, selectedPackage === pkg.id && styles.packageCardActive]}
                                            >
                                                <View style={styles.packageHeader}>
                                                    <Text style={[styles.packageName, selectedPackage === pkg.id && styles.textWhite]}>{pkg.package_name}</Text>
                                                    <Text style={[styles.packagePrice, selectedPackage === pkg.id && styles.textPrimary]}>₹{pkg.price}</Text>
                                                </View>
                                                <Text style={[styles.packageDesc, selectedPackage === pkg.id && styles.textWhiteMuted]}>{pkg.features?.join(' • ') || (pkg as any).duration}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {step === 2 && (
                            <View style={styles.stepView}>
                                <View style={styles.textGroup}>
                                    <Text style={styles.title}>When & <Text style={styles.italic}>How</Text>.</Text>
                                    <Text style={styles.subtitle}>Set your preferred schedule and frequency.</Text>
                                </View>

                                {/* Frequency */}
                                <Text style={styles.sectionTitle}>FREQUENCY</Text>
                                <View style={styles.frequencyTabs}>
                                    {(['none', 'weekly', 'monthly'] as const).map(t => (
                                        <TouchableOpacity
                                            key={t}
                                            onPress={() => setRecurringType(t)}
                                            style={[styles.freqTab, recurringType === t && styles.freqTabActive]}
                                        >
                                            <Text style={[styles.freqTabText, recurringType === t && styles.freqTabTextActive]}>
                                                {t === 'none' ? 'ONCE' : t.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Date */}
                                <Text style={styles.sectionTitle}>SELECT DATE</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                                    {dates.map(d => (
                                        <TouchableOpacity
                                            key={d.full}
                                            onPress={() => setSelectedDate(d.full)}
                                            style={[styles.dateCard, selectedDate === d.full && styles.dateCardActive]}
                                        >
                                            <Text style={[styles.dateMonth, selectedDate === d.full && styles.textWhite]}>{d.month}</Text>
                                            <Text style={[styles.dateDay, selectedDate === d.full && styles.textWhite]}>{d.day}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Time */}
                                <Text style={styles.sectionTitle}>SELECT TIME</Text>
                                <View style={styles.timeGrid}>
                                    {times.map(t => (
                                        <TouchableOpacity
                                            key={t.time}
                                            onPress={() => t.available && setSelectedTime(t.time)}
                                            disabled={!t.available}
                                            style={[
                                                styles.timeBtn,
                                                !t.available && styles.timeBtnDisabled,
                                                selectedTime === t.time && styles.timeBtnActive
                                            ]}
                                        >
                                            <Text style={[styles.timeText, selectedTime === t.time && styles.textWhite]}>{t.time}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.timerBanner}>
                                    <View style={styles.timerLeft}>
                                        <Timer size={18} color="#f97316" />
                                        <Text style={styles.timerLabel}>Slot Held For</Text>
                                    </View>
                                    <Text style={styles.timerValue}>{formatTimer(holdTimer)}</Text>
                                </View>
                            </View>
                        )}

                        {step === 3 && (
                            <View style={styles.stepView}>
                                <View style={styles.textGroup}>
                                    <Text style={styles.title}>Extra <Text style={styles.italic}>Care</Text>.</Text>
                                    <Text style={styles.subtitle}>Add dynamic services and specific instructions.</Text>
                                </View>

                                {/* Addons */}
                                <Text style={styles.sectionTitle}>ADDONS</Text>
                                <View style={styles.addonList}>
                                    {serviceData?.addons?.map(addon => (
                                        <TouchableOpacity
                                            key={addon.id}
                                            onPress={() => toggleAddon(addon.id)}
                                            style={[styles.addonCard, selectedAddons.includes(addon.id) && styles.addonCardActive]}
                                        >
                                            <View style={styles.addonInfo}>
                                                <Text style={styles.addonTitle}>{addon.name}</Text>
                                                <Text style={styles.addonMeta}>₹{addon.price} • {addon.duration_minutes || (addon as any).duration}m</Text>
                                            </View>
                                            <View style={[styles.radioCircle, selectedAddons.includes(addon.id) && styles.radioCircleActive]}>
                                                {selectedAddons.includes(addon.id) && <Check size={14} color="white" />}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Instructions */}
                                <Text style={styles.sectionTitle}>SPECIAL INSTRUCTIONS</Text>
                                <View style={styles.instructionBox}>
                                    <MessageSquare size={20} color="#94a3b8" style={styles.instructionIcon} />
                                    <TextInput
                                        placeholder="Tell us about your pet's temperament, specific needs, or where to find the key..."
                                        style={styles.instructionInput}
                                        multiline
                                        numberOfLines={4}
                                        value={instructions}
                                        onChangeText={setInstructions}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>
                        )}

                        {step === 4 && (
                            <View style={styles.stepView}>
                                <View style={styles.textGroup}>
                                    <Text style={styles.title}>Review & <Text style={styles.italic}>Checkout</Text>.</Text>
                                    <Text style={styles.subtitle}>Apply coupons and select payment mode.</Text>
                                </View>

                                <View style={styles.summaryCard}>
                                    <View style={styles.summaryHeader}>
                                        <Receipt size={24} color="#14b8a6" />
                                        <View>
                                            <Text style={styles.summaryTitle}>{serviceData?.name} ({selectedPets.length} Pets)</Text>
                                            <Text style={styles.summaryMeta}>Oct {selectedDate}, {selectedTime}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.summaryDetails}>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Base Price</Text>
                                            <Text style={styles.summaryVal}>₹{calculateTotal().toFixed(0)}</Text>
                                        </View>
                                        {selectedAddons.length > 0 && (
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Addons ({selectedAddons.length})</Text>
                                                <Text style={styles.summaryVal}>Included</Text>
                                            </View>
                                        )}
                                    </View>

                                    <TextInput
                                        placeholder="APPLY COUPON (SAVE20)"
                                        style={styles.couponInput}
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                    />

                                    {pointsBalance > 0 && (
                                        <TouchableOpacity 
                                            style={[styles.pointsRedeem, usePoints && styles.pointsRedeemActive]} 
                                            onPress={() => setUsePoints(!usePoints)}
                                        >
                                            <View style={styles.pointsInfo}>
                                                <Star size={20} color={usePoints ? 'white' : '#f97316'} fill={usePoints ? 'white' : '#f97316'} />
                                                <View>
                                                    <Text style={[styles.pointsTitle, usePoints && { color: 'white' }]}>Use Loyalty Points</Text>
                                                    <Text style={[styles.pointsSubtitle, usePoints && { color: 'rgba(255,255,255,0.8)' }]}>Balance: {pointsBalance} pts (₹1 = 1 pt)</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.redeemToggle, usePoints && styles.redeemToggleActive]}>
                                                {usePoints && <Check size={12} color="#14b8a6" />}
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.paymentMethods}>
                                        {[
                                            { id: 'wallet', icon: Wallet, label: 'WALLET' },
                                            { id: 'gateway', icon: CreditCard, label: 'PAY' },
                                            { id: 'split', icon: Repeat, label: 'SPLIT' }
                                        ].map(mode => (
                                            <TouchableOpacity
                                                key={mode.id}
                                                onPress={() => setPaymentMode(mode.id as any)}
                                                style={[styles.paymentBtn, paymentMode === mode.id && styles.paymentBtnActive]}
                                            >
                                                <mode.icon size={20} color={paymentMode === mode.id ? "#14b8a6" : "#64748b"} />
                                                <Text style={[styles.paymentLabelText, paymentMode === mode.id && styles.textPrimary]}>{mode.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.totalBanner}>
                                    <View>
                                        <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
                                        <Text style={styles.totalValue}>₹{calculateTotal().toFixed(0)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.gstLabel}>ESTIMATED GST</Text>
                                        <Text style={styles.gstStatus}>INCLUDED</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {step === 5 && (
                            <View style={styles.successView}>
                                {bookingStatus === 'pending' ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <BookingRadar />
                                        <Text style={styles.successTitle}>Finding Your Expert...</Text>
                                        <Text style={styles.successSubtitle}>
                                            Broadcasting your request to professionals within 20km. This usually takes 2-5 minutes.
                                        </Text>
                                        <TouchableOpacity 
                                            style={[styles.trackBtn, { marginTop: 40, backgroundColor: '#f1f5f9' }]} 
                                            onPress={() => navigation.navigate('Home')}
                                        >
                                            <Text style={[styles.trackBtnText, { color: '#0f172a' }]}>WAIT IN BACKGROUND</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : bookingStatus === 'accepted' ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <View style={styles.providerMatchCard}>
                                            <Image 
                                                source={{ uri: createdBooking?.provider?.user?.avatar_url || 'https://i.pravatar.cc/100' }} 
                                                style={styles.providerAvatar} 
                                            />
                                            <Text style={styles.matchTitle}>Expert Found!</Text>
                                            <Text style={styles.providerName}>{createdBooking?.provider?.business_name}</Text>
                                            <View style={styles.ratingRow}>
                                                <Icons.Star size={14} color="#f97316" fill="#f97316" />
                                                <Text style={styles.ratingText}>{createdBooking?.provider?.rating || '4.9'}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.successSubtitle}>
                                            Please confirm payment to finalize the booking. Your expert is ready to start!
                                        </Text>
                                        <TouchableOpacity 
                                            style={[styles.continueBtn, { width: '100%', marginTop: 30 }]} 
                                            onPress={handlePay}
                                            disabled={isSubmitting}
                                        >
                                            <Text style={styles.continueBtnText}>
                                                {isSubmitting ? 'PROCESSING...' : `CONFIRM & PAY ₹${createdBooking?.total_amount}`}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : bookingStatus === 'timeout' ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <Icons.AlertTriangle size={64} color="#ef4444" />
                                        <Text style={styles.successTitle}>No Experts Found</Text>
                                        <Text style={styles.successSubtitle}>
                                            We couldn't find a professional nearby at this time. Please try scheduling for later.
                                        </Text>
                                        <TouchableOpacity 
                                            style={[styles.trackBtn, { marginTop: 40 }]} 
                                            onPress={() => setStep(2)}
                                        >
                                            <Text style={styles.trackBtnText}>CHANGE SLOT</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <View style={styles.successIconOuter}>
                                            <View style={styles.successIconInner}>
                                                <CheckCircle2 size={64} color="#14b8a6" strokeWidth={2.5} />
                                            </View>
                                        </View>
                                        <Text style={styles.successTitle}>Booking Confirmed!</Text>
                                        <Text style={styles.successSubtitle}>
                                            Your dedicated expert is now assigned. Get ready for premium care!
                                        </Text>
                                        <View style={styles.successButtons}>
                                            <TouchableOpacity 
                                                style={styles.homeBtn} 
                                                onPress={() => navigation.navigate('LiveTracking', { bookingId: createdBooking?.id })}
                                            >
                                                <Text style={styles.homeBtnText}>TRACK LIVE</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('Home')}>
                                                <Text style={styles.trackBtnText}>BACK TO HOME</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Footer Navigation */}
                {step < 5 && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={isNextDisabled() || isSubmitting}
                            style={[
                                styles.continueBtn,
                                isNextDisabled() && styles.continueBtnDisabled
                            ]}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.continueBtnText}>
                                        {step === 4 ? `PAY ₹${calculateTotal().toFixed(0)}` : 'CONTINUE'}
                                    </Text>
                                    <ChevronRight size={18} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitles: { alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#0f172a', letterSpacing: 2 },
    stepIndicator: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
    infoBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 20,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBase: { height: '100%', backgroundColor: '#14b8a6', borderRadius: 3 },
    scrollContainer: {
        flex: 1, // Crucial for taking up available space
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingBottom: 40, // Reduced from 100 to avoid excessive empty space after layout fix
        flexGrow: 1,
    },
    stepView: { paddingVertical: 10 },
    textGroup: { marginBottom: 24, gap: 4 },
    title: { fontSize: 30, fontWeight: 'bold', color: '#0f172a', lineHeight: 38 },
    italic: { color: '#14b8a6', fontStyle: 'italic' },
    subtitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    sectionBlock: { marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 2,
    },
    selectionCount: { fontSize: 10, fontWeight: 'bold', color: '#14b8a6' },
    petScroll: { flexDirection: 'row', gap: 12 },
    petCard: {
        width: 82, // Further decreased size for better alignment
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 10,
        borderWidth: 2,
        borderColor: '#f8fafc',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    petCardActive: { borderColor: '#14b8a6', backgroundColor: '#f0fdfa' },
    petImageWrapper: { 
        width: 48, // Compact profile size
        height: 48, 
        borderRadius: 24, 
        overflow: 'hidden', 
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    petImage: { width: '100%', height: '100%' },
    petName: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
    petNameActive: { color: '#0f172a' },
    petCardAdd: {
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: 'transparent',
    },
    addIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    addText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 1,
    },
    checkIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationTabs: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 16,
    },
    locationTab: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    locationTabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    locationTabText: { fontSize: 11, fontWeight: '900', color: '#64748b' },
    locationTabTextActive: { color: '#14b8a6' },
    addressList: { gap: 12 },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 22,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#f8fafc',
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    addressCardActive: { borderColor: '#14b8a6', backgroundColor: '#f0fdfa' },
    addressCardAdd: {
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    addIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addTextSmall: {
        fontSize: 12,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 1,
    },
    addrIconBox: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        backgroundColor: '#f8fafc', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    addrIconBoxActive: { backgroundColor: '#14b8a6' },
    addrInfo: { flex: 1 },
    addrLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
    addrText: { fontSize: 12, color: '#64748b' },
    radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    radioCircleActive: { backgroundColor: '#14b8a6', borderColor: '#14b8a6' },
    packageList: { gap: 12 },
    packageCard: {
        padding: 22,
        borderRadius: 28,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#f8fafc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    packageCardActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    packageName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    packagePrice: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
    packageDesc: { fontSize: 11, color: '#64748b', lineHeight: 16 },
    textPrimary: { color: '#14b8a6' },
    textWhite: { color: 'white' },
    textWhiteMuted: { color: 'rgba(255,255,255,0.6)' },
    frequencyTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 16, gap: 4 },
    freqTab: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    freqTabActive: { backgroundColor: 'white', elevation: 2 },
    freqTabText: { fontSize: 11, fontWeight: '900', color: '#64748b' },
    freqTabTextActive: { color: '#14b8a6' },
    dateList: { flexDirection: 'row', paddingVertical: 8 },
    dateCard: { width: 70, height: 90, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    dateCardActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    dateMonth: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
    dateDay: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeBtn: { width: (width - 60) / 3, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    timeBtnActive: { backgroundColor: '#14b8a6', borderColor: '#14b8a6' },
    timeBtnDisabled: { opacity: 0.3 },
    timeText: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
    timerBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff7ed', padding: 12, borderRadius: 16, marginTop: 24 },
    timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerLabel: { fontSize: 12, fontWeight: 'bold', color: '#9a3412' },
    timerValue: { fontSize: 12, fontWeight: '900', color: '#c2410c' },
    addonList: { gap: 12 },
    addonCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: '#f8fafc', gap: 12 },
    addonCardActive: { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#14b8a6' },
    addonInfo: { flex: 1 },
    addonTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
    addonMeta: { fontSize: 12, color: '#64748b' },
    instructionBox: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 20, padding: 16, gap: 12 },
    instructionIcon: { marginTop: 4 },
    instructionInput: { flex: 1, fontSize: 14, color: '#0f172a', textAlignVertical: 'top' },
    summaryCard: { padding: 20, borderRadius: 24, backgroundColor: '#f8fafc', gap: 16 },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    summaryMeta: { fontSize: 12, color: '#64748b' },
    summaryDetails: { gap: 8, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 14, color: '#64748b' },
    summaryVal: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
    paymentMethods: { flexDirection: 'row', gap: 8 },
    paymentBtn: { flex: 1, height: 70, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#f1f5f9' },
    paymentBtnActive: { borderColor: '#14b8a6', backgroundColor: '#f0fdfa' },
    paymentLabelText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
    totalBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 24, marginTop: 24 },
    totalLabel: { fontSize: 10, fontWeight: 'bold', color: '#14b8a6' },
    totalValue: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    gstLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
    gstStatus: { fontSize: 10, fontWeight: 'bold', color: '#14b8a6' },
    successView: { alignItems: 'center', paddingTop: 40 },
    successIconOuter: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
    successIconInner: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 24 },
    successSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 12, paddingHorizontal: 40 },
    successButtons: { width: '100%', gap: 12, marginTop: 40 },
    trackBtn: { height: 56, backgroundColor: '#0f172a', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    trackBtnText: { color: 'white', fontSize: 14, fontWeight: '900' },
    homeBtn: { height: 56, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    homeBtnText: { color: '#0f172a', fontSize: 14, fontWeight: '900' },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: 'white' },
    continueBtn: { height: 56, backgroundColor: '#0f172a', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    continueBtnDisabled: { backgroundColor: '#cbd5e1' },
    continueBtnText: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    couponInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pointsRedeem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff7ed',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#ffedd5',
        marginBottom: 16,
    },
    pointsRedeemActive: {
        backgroundColor: '#f97316',
        borderColor: '#f97316',
    },
    pointsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pointsTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
    },
    pointsSubtitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#f97316',
    },
    redeemToggle: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ffedd5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    redeemToggleActive: {
        borderColor: white,
    },
    providerMatchCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#14b8a6',
        shadowColor: '#14b8a6',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
        marginBottom: 20,
    },
    providerAvatar: {
        width: 80,
        height: 80,
        borderRadius: 30,
        marginBottom: 15,
    },
    matchTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 2,
        marginBottom: 5,
    },
    providerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#f97316',
    },
});
