import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Search,
    AlertTriangle,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { walletApi } from '../services/wallet.service';
import { servicesApi } from '../services/services.service';
import { petsApi } from '../services/pets.service';
import { bookingsApi } from '../services/bookings.service';
import { paymentsApi } from '../services/payments.service';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../hooks/useSocket';
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceDetail, Pet } from '../shared/types';

// LayoutAnimation is disabled on Android to prevent native crashes during layout changes

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
            <Animated.View style={StyleSheet.flatten([radarStyles.circle, { transform: [{ scale: scale1 }], opacity: opacity1 }])} />
            <Animated.View style={StyleSheet.flatten([radarStyles.circle, { transform: [{ scale: scale2 }], opacity: opacity2 }])} />
            <View style={radarStyles.center}>
                <Search size={32} color="white" />
            </View>
        </View>
    );
};

const radarStyles = StyleSheet.create({
    container: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
    circle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(20, 184, 166, 0.4)' },
    center: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF7A3D', alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#FF7A3D', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 }
});

export default function BookingFlow({ navigation, route }: BookingFlowProps) {
    const serviceId = route?.params?.serviceId || 'grooming';
    const bookingType = route?.params?.bookingType || 'scheduled';
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [serviceData, setServiceData] = useState<ServiceDetail | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [selectedPets, setSelectedPets] = useState<string[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(route?.params?.packageId || null);
    const [serviceLocation, setServiceLocation] = useState<'home' | 'center'>('home');

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [recurringType, setRecurringType] = useState<'none' | 'weekly' | 'monthly'>('none');

    const [selectedAddons, setSelectedAddons] = useState<string[]>(route?.params?.addonIds || []);
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
                AsyncStorage.getItem('@pawber_addresses'),
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
        if (route?.params?.fromBidding && route?.params?.bookingId) {
            console.log('🔄 Coming back from bidding screen, setting state for payment');
            setCreatedBooking({
                id: route.params.bookingId,
                total_amount: route.params.totalAmount,
                provider: {
                    business_name: route.params.selectedBid?.provider_name,
                    rating: route.params.selectedBid?.rating,
                    user: {
                        avatar_url: route.params.selectedBid?.provider_image
                    }
                }
            });
            setBookingStatus('accepted');
            setStep(3);
        } else if (route?.params?.bookingId && !route?.params?.fromBidding) {
            console.log('🔄 Re-opening active search screen for booking:', route.params.bookingId);
            setCreatedBooking({
                id: route.params.bookingId,
                total_amount: route.params.totalAmount || 0,
            });
            setBookingStatus('pending');
            setStep(3);
        }
    }, [route?.params]);

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
        if (step < 2) setStep(step + 1);
        else if (step === 2) {
            submitBooking();
        } else {
            navigation.navigate('Main');
        }
    };

        const submitBooking = async () => {
        setIsSubmitting(true);
        try {
            const addrObj = addresses.find(a => a.id === selectedAddress);
            const res = await bookingsApi.create({
                service_id: serviceId,
                package_id: selectedPackage!,
                booking_type: bookingType,
                pet_ids: selectedPets,
                addon_ids: selectedAddons,
                booking_date: selectedDate!,
                address: addrObj?.address,
                latitude: addrObj?.latitude,
                longitude: addrObj?.longitude,
                notes: instructions,
                coupon_code: couponCode,
                points_to_use: usePoints ? Math.min(pointsBalance, calculateTotal()) : 0
            });

            if (res.success && res.data) {
                setCreatedBooking(res.data.booking);
                if (bookingType === 'scheduled') {
                    // Navigate to ServiceBidding for scheduled bookings
                    navigation.navigate('ServiceBidding', {
                        bookingId: res.data.booking.id,
                        serviceId: serviceId,
                        totalAmount: calculateTotal()
                    });
                } else {
                    // For instant bookings, show radar step 3
                    setStep(3);
                }
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
            const amount = createdBooking?.total_amount;
            if (!amount) {
                alert('Invalid booking amount');
                setIsSubmitting(false);
                return;
            }

            // Attempt Razorpay Payment if on Web
            if (Platform.OS === 'web') {
                const { loadRazorpay, initializeRazorpayPayment } = require('../lib/razorpay');
                const loaded = await loadRazorpay();
                if (loaded) {
                    const orderRes = await paymentsApi.createOrder(createdBooking.id, amount);
                    if (orderRes.success && orderRes.data?.order) {
                        const orderData = orderRes.data.order;
                        
                        initializeRazorpayPayment({
                            amount: orderData.amount,
                            currency: orderData.currency,
                            order_id: orderData.order_id,
                            name: 'Pawber',
                            description: 'Service Booking Payment',
                            handler: async (response: any) => {
                                try {
                                    setIsSubmitting(true);
                                    const verifyRes = await paymentsApi.verify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                    });
                                    if (verifyRes.success && verifyRes.data?.verified) {
                                        setBookingStatus('confirmed');
                                    } else {
                                        alert('Payment verification failed.');
                                    }
                                } catch (err) {
                                    console.error('Verify payment error:', err);
                                    alert('Payment verification error.');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            },
                            modal: {
                                ondismiss: () => {
                                    setIsSubmitting(false);
                                }
                            }
                        });
                        return; // Wait for Razorpay handler callback
                    }
                }
            }

            // Fallback for native/mock environments
            console.log('⚡ Using Mock Payment confirmation fallback');
            const res = await bookingsApi.confirmPayment(createdBooking.id);
            if (res.success) {
                setBookingStatus('confirmed');
            } else {
                alert('Payment failed. Please try again.');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
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
        if (step === 1) return selectedPets.length === 0 || !selectedPackage || !selectedAddress || !selectedDate || !selectedTime;
        if (step === 2) return false;
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
                <View style={StyleSheet.flatten([styles.container, { justifyContent: 'center', alignItems: 'center' }])}>
                    <ActivityIndicator size="large" color="#FF7A3D" />
                    <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#7A5540' }}>Loading Service Details...</Text>
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
                        <ArrowLeft size={20} color="#1A1612" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>{step === 3 ? 'CONFIRMED' : 'BOOKING'}</Text>
                        {step < 3 && <Text style={styles.stepIndicator}>Step {step + 1} of 3</Text>}
                    </View>
                    <TouchableOpacity style={styles.infoBtn}>
                        <Info size={20} color="#7A5540" />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                {step < 3 && (
                    <View style={styles.progressTrack}>
                        <LinearGradient
                            colors={['#FF7A3D', '#FFB088']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.flatten([styles.progressBar, { width: `${((step + 1) / 3) * 100}%` }])}
                        />
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
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petScroll} contentContainerStyle={{ paddingRight: 24 }}>
                                        {pets.map(pet => (
                                            <TouchableOpacity
                                                key={pet.id}
                                                onPress={() => togglePet(pet.id)}
                                                style={StyleSheet.flatten([styles.petCard, selectedPets.includes(pet.id) && styles.petCardActive])}
                                            >
                                                <View style={styles.petImageWrapper}>
                                                    <Image source={{ uri: pet.image_url || 'https://i.pravatar.cc/100?img=12' }} style={styles.petImage} />
                                                </View>
                                                <Text style={StyleSheet.flatten([styles.petName, selectedPets.includes(pet.id) && styles.petNameActive])}>{pet.name}</Text>
                                                {selectedPets.includes(pet.id) && (
                                                    <View style={styles.petCheckBadge}>
                                                        <Check size={8} color="white" strokeWidth={5} />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Pets', { forceAdd: true })}
                                            style={styles.petCardAdd}
                                        >
                                            <View style={styles.addIconCircle}>
                                                <Plus size={24} color="#FF7A3D" />
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
                                                style={StyleSheet.flatten([styles.locationTab, serviceLocation === 'home' && styles.locationTabActive])}
                                            >
                                                <Text style={StyleSheet.flatten([styles.locationTabText, serviceLocation === 'home' && styles.locationTabTextActive])}>AT HOME</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setServiceLocation('center')}
                                                style={StyleSheet.flatten([styles.locationTab, serviceLocation === 'center' && styles.locationTabActive])}
                                            >
                                                <Text style={StyleSheet.flatten([styles.locationTabText, serviceLocation === 'center' && styles.locationTabTextActive])}>AT CENTER</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}





                                {/* Frequency */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>FREQUENCY</Text>
                                    <View style={styles.frequencyTabs}>
                                        {(['none', 'weekly', 'monthly'] as const).map(t => (
                                            <TouchableOpacity
                                                key={t}
                                                onPress={() => setRecurringType(t)}
                                                style={StyleSheet.flatten([styles.freqTab, recurringType === t && styles.freqTabActive])}
                                            >
                                                <Text style={StyleSheet.flatten([styles.freqTabText, recurringType === t && styles.freqTabTextActive])}>
                                                    {t === 'none' ? 'ONCE' : t.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Date */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>SELECT DATE</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                                        {dates.map(d => (
                                            <TouchableOpacity
                                                key={d.full}
                                                onPress={() => setSelectedDate(d.full)}
                                                style={StyleSheet.flatten([styles.dateCard, selectedDate === d.full && styles.dateCardActive])}
                                            >
                                                <Text style={StyleSheet.flatten([styles.dateMonth, selectedDate === d.full && styles.textWhite])}>{d.month}</Text>
                                                <Text style={StyleSheet.flatten([styles.dateDay, selectedDate === d.full && styles.textWhite])}>{d.day}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Time */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>SELECT TIME</Text>
                                    <View style={styles.timeGrid}>
                                        {times.map(t => (
                                            <TouchableOpacity
                                                key={t.time}
                                                onPress={() => t.available && setSelectedTime(t.time)}
                                                disabled={!t.available}
                                                style={StyleSheet.flatten([
                                                    styles.timeBtn,
                                                    !t.available && styles.timeBtnDisabled,
                                                    selectedTime === t.time && styles.timeBtnActive
                                                ])}
                                            >
                                                <Text style={StyleSheet.flatten([styles.timeText, selectedTime === t.time && styles.textWhite])}>{t.time}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                {/* Address Selection */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>ADDRESS</Text>
                                    <View style={styles.addressList}>
                                        {addresses.map(addr => (
                                            <TouchableOpacity
                                                key={addr.id}
                                                onPress={() => setSelectedAddress(addr.id)}
                                                style={StyleSheet.flatten([styles.addressCard, selectedAddress === addr.id && styles.addressCardActive])}
                                            >
                                                <View style={StyleSheet.flatten([styles.addrIconCircle, selectedAddress === addr.id && styles.addrIconCircleActive])}>
                                                    <MapPin size={18} color={selectedAddress === addr.id ? "white" : "#94A3B8"} />
                                                </View>
                                                <View style={styles.addrInfo}>
                                                    <Text style={StyleSheet.flatten([styles.addrLabel, selectedAddress === addr.id && { color: '#1D9E86' }])}>{addr.label}</Text>
                                                    <Text style={styles.addrText} numberOfLines={1}>{addr.address}</Text>
                                                </View>
                                                <View style={StyleSheet.flatten([styles.selectionCircle, selectedAddress === addr.id && styles.selectionCircleActive])}>
                                                    {selectedAddress === addr.id && <Check size={12} color="white" strokeWidth={4} />}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Addresses')}
                                            style={styles.addressAddBtn}
                                        >
                                            <Plus size={18} color="#FF7A3D" />
                                            <Text style={styles.addressAddBtnText}>ADD NEW ADDRESS</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {step === 2 && (
                            <View style={styles.stepView}>
                                <View style={styles.textGroup}>
                                    <Text style={styles.title}>Review & <Text style={styles.italic}>Pay</Text>.</Text>
                                    <Text style={styles.subtitle}>Finalize your instructions and complete payment.</Text>
                                </View>



                                {/* Instructions moved from step 3 */}
                                <View style={styles.sectionBlock}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>SPECIAL INSTRUCTIONS</Text>
                                    <View style={styles.instructionBox}>
                                        <MessageSquare size={20} color="#B09080" style={styles.instructionIcon} />
                                        <TextInput
                                            placeholder="Tell us about your pet's temperament, specific needs, or where to find the key..."
                                            style={styles.instructionInput}
                                            multiline
                                            numberOfLines={4}
                                            value={instructions}
                                            onChangeText={setInstructions}
                                            placeholderTextColor="#B09080"
                                        />
                                    </View>
                                </View>

                                {/* Review & Checkout merged into step 2 */}
                                <View style={styles.sectionBlock}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>REVIEW & CHECKOUT</Text>
                                    <View style={styles.summaryCard}>
                                        <View style={styles.summaryHeader}>
                                        <Receipt size={24} color="#FF7A3D" />
                                        <View>
                                            <Text style={styles.summaryTitle}>{serviceData?.name} ({selectedPets.length} Pets)</Text>
                                            <Text style={styles.summaryMeta}>{selectedDate}, {selectedTime}</Text>
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
                                            style={StyleSheet.flatten([styles.pointsRedeem, usePoints && styles.pointsRedeemActive])}
                                            onPress={() => setUsePoints(!usePoints)}
                                        >
                                            <View style={styles.pointsInfo}>
                                                <Star size={20} color={usePoints ? 'white' : '#1D9E86'} fill={usePoints ? 'white' : '#1D9E86'} />
                                                <View>
                                                    <Text style={StyleSheet.flatten([styles.pointsTitle, usePoints && { color: 'white' }])}>Use Loyalty Points</Text>
                                                    <Text style={StyleSheet.flatten([styles.pointsSubtitle, usePoints && { color: 'rgba(255,255,255,0.8)' }])}>Balance: {pointsBalance} pts (₹1 = 1 pt)</Text>
                                                </View>
                                            </View>
                                            <View style={StyleSheet.flatten([styles.redeemToggle, usePoints && styles.redeemToggleActive])}>
                                                {usePoints && <Check size={12} color="#FF7A3D" />}
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
                                                style={StyleSheet.flatten([styles.paymentBtn, paymentMode === mode.id && styles.paymentBtnActive])}
                                            >
                                                <mode.icon size={20} color={paymentMode === mode.id ? "#FF7A3D" : "#7A5540"} />
                                                <Text style={StyleSheet.flatten([styles.paymentLabelText, paymentMode === mode.id && styles.textPrimary])}>{mode.label}</Text>
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
                                <View style={[styles.timerBanner, { marginTop: 32 }]}>
                                    <View style={styles.timerLeft}>
                                        <Timer size={18} color="#1D9E86" />
                                        <Text style={styles.timerLabel}>Slot Held For</Text>
                                    </View>
                                    <Text style={styles.timerValue}>{formatTimer(holdTimer)}</Text>
                                </View>
                            </View>
                        )}

                        {step === 3 && (
                            <View style={styles.successView}>
                                {bookingStatus === 'pending' ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <BookingRadar />
                                        <Text style={styles.successTitle}>Finding Your Expert...</Text>
                                        <Text style={styles.successSubtitle}>
                                            Broadcasting your request to professionals within 20km. This usually takes 2-5 minutes.
                                        </Text>
                                        <TouchableOpacity
                                            style={StyleSheet.flatten([styles.trackBtn, { marginTop: 40, backgroundColor: '#F5E6D8' }])}
                                            onPress={() => navigation.navigate('Main')}
                                        >
                                            <Text style={StyleSheet.flatten([styles.trackBtnText, { color: '#1A1612' }])}>WAIT IN BACKGROUND</Text>
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
                                                <Star size={14} color="#1D9E86" fill="#1D9E86" />
                                                <Text style={styles.ratingText}>{createdBooking?.provider?.rating || '4.9'}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.successSubtitle}>
                                            Please confirm payment to finalize the booking. Your expert is ready to start!
                                        </Text>
                                        <TouchableOpacity
                                            style={StyleSheet.flatten([styles.continueBtn, { width: '100%', marginTop: 30 }])}
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
                                        <AlertTriangle size={64} color="#ef4444" />
                                        <Text style={styles.successTitle}>No Experts Found</Text>
                                        <Text style={styles.successSubtitle}>
                                            We couldn't find a professional nearby at this time. Please try scheduling for later.
                                        </Text>
                                        <TouchableOpacity
                                            style={StyleSheet.flatten([styles.trackBtn, { marginTop: 40 }])}
                                            onPress={() => setStep(2)}
                                        >
                                            <Text style={styles.trackBtnText}>CHANGE SLOT</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <View style={styles.successIconOuter}>
                                            <View style={styles.successIconInner}>
                                                <CheckCircle2 size={64} color="#FF7A3D" strokeWidth={2.5} />
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
                                            <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('Main')}>
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
                {step < 3 && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={isNextDisabled() || isSubmitting}
                            style={StyleSheet.flatten([
                                styles.continueBtn,
                                isNextDisabled() && styles.continueBtnDisabled
                            ])}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.continueBtnText}>
                                        {step === 2 ? `PAY ₹${calculateTotal().toFixed(0)}` : 'CONTINUE'}
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
    safeArea: { flex: 1, backgroundColor: '#FFF9F5' },
    container: { flex: 1, backgroundColor: '#FFF9F5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#F5E6D8', alignItems: 'center', justifyContent: 'center' },
    headerTitles: { alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#B09080', letterSpacing: 2 },
    stepIndicator: { fontSize: 18, fontWeight: '900', color: '#1A1612', marginTop: 2 },
    infoBtn: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    progressTrack: { height: 6, backgroundColor: '#F5E6D8', marginHorizontal: 24, borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
    progressBar: { height: '100%', borderRadius: 3 },

    scrollContainer: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    stepView: { paddingHorizontal: 24, paddingTop: 10 },
    textGroup: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '900', color: '#1A1612', letterSpacing: -1 },
    italic: { color: '#FF7A3D', fontStyle: 'italic' },
    subtitle: { fontSize: 15, color: '#7A5540', fontWeight: '600', marginTop: 8 },

    sectionBlock: { marginBottom: 36 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#B09080', letterSpacing: 1.5 },
    selectionCount: { fontSize: 12, fontWeight: '800', color: '#FF7A3D' },

    petScroll: { marginHorizontal: -24, paddingLeft: 24 },
    petCard: { width: 90, alignItems: 'center', marginRight: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: 'white', borderWidth: 2, borderColor: 'transparent' },
    petCardActive: { borderColor: '#FF7A3D', shadowColor: '#FF7A3D', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
    petImageWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5E6D8', padding: 3, marginBottom: 8, borderWidth: 1, borderColor: '#F5E6D8' },
    petImage: { width: '100%', height: '100%', borderRadius: 32 },
    petName: { fontSize: 12, fontWeight: '800', color: '#7A5540' },
    petNameActive: { color: '#FF7A3D' },
    petCheckBadge: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF7A3D', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
    petCardAdd: { width: 90, height: 110, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderRadius: 24, backgroundColor: '#FFF3EC', borderStyle: 'dashed', borderWidth: 2, borderColor: '#FFB088' },
    addIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    addText: { fontSize: 9, fontWeight: '900', color: '#FF7A3D' },

    locationTabs: { flexDirection: 'row', gap: 12, marginTop: 12 },
    locationTab: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#F5E6D8', alignItems: 'center', justifyContent: 'center' },
    locationTabActive: { backgroundColor: '#1A1612' },
    locationTabText: { fontSize: 11, fontWeight: '900', color: '#7A5540', letterSpacing: 1 },
    locationTabTextActive: { color: 'white' },

    addressList: { gap: 12, marginTop: 4 },
    addressCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    addressCardActive: { borderColor: '#1D9E86', shadowColor: '#1D9E86', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    addrIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    addrIconCircleActive: { backgroundColor: '#1D9E86' },
    addrInfo: { flex: 1 },
    addrLabel: { fontSize: 15, fontWeight: '900', color: '#1A1612', marginBottom: 2 },
    addrText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    selectionCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    selectionCircleActive: { backgroundColor: '#1D9E86', borderColor: '#1D9E86' },
    addressAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 20, backgroundColor: '#FFF3EC', borderStyle: 'dashed', borderWidth: 2, borderColor: '#FFB088', marginTop: 4 },
    addressAddBtnText: { fontSize: 12, fontWeight: '900', color: '#FF7A3D', letterSpacing: 0.5 },

    packageList: { gap: 12, marginTop: 4 },
    planCard: { padding: 20, backgroundColor: 'white', borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
    planCardActive: { borderColor: '#1D9E86', backgroundColor: '#FAFFFE' },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planTitleBox: { flex: 1, marginRight: 16 },
    planName: { fontSize: 17, fontWeight: '900', color: '#1A1612', marginBottom: 4 },
    planFeatures: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    planPrice: { fontSize: 22, fontWeight: '900', color: '#1A1612' },
    planSelectionIndicator: { position: 'absolute', top: -10, right: 20, width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
    planSelectionIndicatorActive: { backgroundColor: '#1D9E86' },

    footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16, backgroundColor: 'rgba(255,255,255,0.9)' },
    continueBtn: { height: 64, borderRadius: 24, backgroundColor: '#1D9E86', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#1D9E86', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    continueBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
    continueBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    frequencyTabs: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    freqTab: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#F5E6D8', alignItems: 'center' },
    freqTabActive: { backgroundColor: '#1A1612' },
    freqTabText: { fontSize: 11, fontWeight: '900', color: '#7A5540' },
    freqTabTextActive: { color: 'white' },
    dateList: { marginHorizontal: -24, paddingLeft: 24, marginBottom: 24 },
    dateCard: { width: 70, height: 90, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
    dateCardActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
    dateMonth: { fontSize: 10, fontWeight: '900', color: '#B09080' },
    dateDay: { fontSize: 24, fontWeight: '900', color: '#1A1612', marginTop: 2 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    timeBtn: { width: (width - 68) / 3, paddingVertical: 14, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    timeBtnActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
    timeBtnDisabled: { opacity: 0.4 },
    timeText: { fontSize: 12, fontWeight: '800', color: '#1A1612' },
    timerBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#E0F5F0', borderRadius: 20 },
    timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timerLabel: { fontSize: 13, fontWeight: '800', color: '#1D9E86' },
    timerValue: { fontSize: 18, fontWeight: '900', color: '#1D9E86' },
    addonList: { gap: 12, marginBottom: 24 },
    addonCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    addonCardActive: { borderColor: '#1D9E86', backgroundColor: '#FAFFFE' },
    addonInfo: { flex: 1 },
    addonTitle: { fontSize: 15, fontWeight: '800', color: '#1A1612', marginBottom: 4 },
    addonMeta: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    instructionBox: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderRadius: 20, borderWidth: 2, borderColor: '#F5E6D8' },
    instructionIcon: { marginTop: 4, marginRight: 12 },
    instructionInput: { flex: 1, fontSize: 14, color: '#1A1612', fontWeight: '500', height: 80, textAlignVertical: 'top' },
    summaryCard: { padding: 24, backgroundColor: 'white', borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
    summaryHeader: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    summaryTitle: { fontSize: 17, fontWeight: '900', color: '#1A1612' },
    summaryMeta: { fontSize: 13, color: '#B09080', fontWeight: '700', marginTop: 2 },
    summaryDetails: { borderTopWidth: 1.5, borderTopColor: '#F5E6D8', paddingTop: 20, gap: 12, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 14, color: '#7A5540', fontWeight: '600' },
    summaryVal: { fontSize: 14, color: '#1A1612', fontWeight: '800' },
    couponInput: { height: 54, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 20, fontSize: 12, fontWeight: '900', color: '#1A1612', letterSpacing: 1, marginBottom: 20, borderWidth: 1.5, borderColor: '#E2E8F0' },
    pointsRedeem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#E0F5F0', borderRadius: 20, marginBottom: 24 },
    pointsRedeemActive: { backgroundColor: '#1D9E86' },
    pointsInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    pointsTitle: { fontSize: 14, fontWeight: '900', color: '#1D9E86' },
    pointsSubtitle: { fontSize: 11, fontWeight: '700', color: 'rgba(29, 158, 134, 0.7)' },
    redeemToggle: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
    redeemToggleActive: { backgroundColor: 'white' },
    paymentMethods: { flexDirection: 'row', gap: 10 },
    paymentBtn: { flex: 1, height: 70, backgroundColor: '#F8FAFC', borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#E2E8F0' },
    paymentBtnActive: { backgroundColor: 'white', borderColor: '#FF7A3D', shadowColor: '#FF7A3D', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
    paymentLabelText: { fontSize: 10, fontWeight: '900', color: '#7A5540', letterSpacing: 0.5 },
    totalBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginTop: 32 },
    totalLabel: { fontSize: 10, fontWeight: '900', color: '#B09080', letterSpacing: 1.5 },
    totalValue: { fontSize: 32, fontWeight: '900', color: '#1A1612' },
    gstLabel: { fontSize: 9, fontWeight: '900', color: '#B09080' },
    gstStatus: { fontSize: 11, fontWeight: '900', color: '#1D9E86', marginTop: 2 },
    successView: { alignItems: 'center', paddingTop: 40 },
    successIconOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255, 122, 61, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    successIconInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF7A3D', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    successTitle: { fontSize: 26, fontWeight: '900', color: '#1A1612', textAlign: 'center' },
    successSubtitle: { fontSize: 15, color: '#7A5540', textAlign: 'center', lineHeight: 24, marginTop: 12, paddingHorizontal: 20 },
    successButtons: { width: '100%', gap: 12, marginTop: 48 },
    homeBtn: { height: 64, borderRadius: 24, backgroundColor: '#1A1612', alignItems: 'center', justifyContent: 'center' },
    homeBtnText: { color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    trackBtn: { height: 60, borderRadius: 24, borderWidth: 2, borderColor: '#F5E6D8', alignItems: 'center', justifyContent: 'center' },
    trackBtnText: { color: '#B09080', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    providerMatchCard: { width: '100%', padding: 24, backgroundColor: 'white', borderRadius: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, marginBottom: 24 },
    providerAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5E6D8', marginBottom: 16 },
    matchTitle: { fontSize: 12, fontWeight: '900', color: '#1D9E86', letterSpacing: 1.5, marginBottom: 8 },
    providerName: { fontSize: 20, fontWeight: '900', color: '#1A1612', marginBottom: 6 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingText: { fontSize: 14, fontWeight: '800', color: '#1A1612' },
    textWhite: { color: 'white' },
    textWhiteMuted: { color: 'rgba(255,255,255,0.7)' },
    textPrimary: { color: '#FF7A3D' },
});
