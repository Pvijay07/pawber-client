import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
    ActivityIndicator,
    BackHandler,
    Modal
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
import { useTheme } from '../theme/ThemeContext';
import { walletApi } from '../services/wallet.service';
import { servicesApi } from '../services/services.service';
import { petsApi } from '../services/pets.service';
import { bookingsApi } from '../services/bookings.service';
import { paymentsApi } from '../services/payments.service';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../hooks/useSocket';
import { Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceDetail, Pet } from '../shared/types';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from '../shared/constants';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

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
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const serviceId = route?.params?.serviceId || 'grooming';
    const bookingType = route?.params?.bookingType || 'scheduled';
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [serviceData, setServiceData] = useState<ServiceDetail | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [selectedPets, setSelectedPets] = useState<string[]>(route?.params?.petIds || []);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(route?.params?.packageId || null);
    const [serviceLocation, setServiceLocation] = useState<'home' | 'center'>('home');

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [recurringType, setRecurringType] = useState<'none' | 'weekly' | 'monthly'>('none');

    // Phase 2 walk session wizard states
    const [frequency, setFrequency] = useState<'onetime' | 'daily' | 'weekly'>(route?.params?.frequency || 'onetime');
    const [specificDays, setSpecificDays] = useState<string[]>(route?.params?.specificDays || []);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [durationChoice, setDurationChoice] = useState<'1week' | '2weeks' | '4weeks' | 'custom'>('1week');
    const [walkDuration, setWalkDuration] = useState<number>(route?.params?.walkDuration || 30);
    const [specialChecklist, setSpecialChecklist] = useState<string[]>([]);

    const [selectedAddons, setSelectedAddons] = useState<string[]>(route?.params?.addonIds || []);
    const [instructions, setInstructions] = useState('');

    const [paymentMode, setPaymentMode] = useState<'wallet' | 'gateway' | 'split'>('wallet');
    const [splitWalletPortion, setSplitWalletPortion] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [couponCode, setCouponCode] = useState('');
    const [holdTimer, setHoldTimer] = useState(300);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsBalance, setPointsBalance] = useState(0);
    const [createdBooking, setCreatedBooking] = useState<any>(null);
    const [bookingStatus, setBookingStatus] = useState<string>('pending');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentModalDetails, setPaymentModalDetails] = useState<any>(null);

    const isWalkingService = serviceData?.slug === 'walking' || serviceData?.category?.slug === 'exercise';

    const calculateTotalWalksClient = (start: string | null, end: string | null, freq: string, days: string[]): number => {
        if (freq === 'onetime' || !start) return 1;
        const targetEnd = freq === 'onetime' ? start : end;
        if (!targetEnd) return 1;

        const startDt = new Date(start);
        const endDt = new Date(targetEnd);
        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || startDt > endDt) return 1;

        let count = 0;
        let curr = new Date(startDt);
        const dayMap: Record<string, number> = {
            'sun': 0, 'sunday': 0, 'mon': 1, 'monday': 1, 'tue': 2, 'tuesday': 2,
            'wed': 3, 'wednesday': 3, 'thu': 4, 'thursday': 4, 'fri': 5, 'friday': 5,
            'sat': 6, 'saturday': 6
        };
        const targetDays = days.map(d => dayMap[d.toLowerCase()]).filter(d => d !== undefined);

        while (curr <= endDt) {
            if (freq === 'daily') {
                count++;
            } else if (freq === 'weekly' && targetDays.length > 0) {
                if (targetDays.includes(curr.getDay())) {
                    count++;
                }
            } else {
                count++;
            }
            curr.setDate(curr.getDate() + 1);
            if (curr.getTime() - startDt.getTime() > 365 * 24 * 60 * 60 * 1000) break; // safety limit
        }
        return count || 1;
    };

    const getCustomEndDates = (startStr: string | null) => {
        if (!startStr) return [];
        const dates = [];
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const baseDate = new Date(startStr);
        for (let i = 0; i < 30; i++) {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + i + 1); // start from start date + 1 day
            dates.push({
                full: d.toISOString().split('T')[0],
                day: d.getDate(),
                month: monthNames[d.getMonth()],
                label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
            });
        }
        return dates;
    };

    const toggleSpecialChecklist = (id: string) => {
        setSpecialChecklist(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

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
            if (wallRes.success && wallRes.data) {
                setPointsBalance(wallRes.data.wallet.points_balance || 0);
                setWalletBalance(wallRes.data.wallet.balance || 0);
            }

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

    const loadBooking = async (bookingId: string) => {
        try {
            const res = await bookingsApi.getById(bookingId);
            if (res.success && res.data?.booking) {
                console.log('🔄 Loaded booking details:', res.data.booking);
                setCreatedBooking(res.data.booking);
                setBookingStatus(res.data.booking.status);
            }
        } catch (err) {
            console.error('Failed to load booking details:', err);
        }
    };

    useEffect(() => {
        if (route?.params?.bookingId) {
            console.log('🔄 Re-opening booking screen with ID:', route.params.bookingId);
            loadBooking(route.params.bookingId);
            setStep(3);
        }
    }, [route?.params]);

    useEffect(() => {
        const backAction = () => {
            if (route?.params?.fromBidding && step === 3 && createdBooking?.id) {
                handleBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [route?.params?.fromBidding, step, createdBooking?.id]);

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

    useEffect(() => {
        if (dates.length > 0) {
            if (!startDate) setStartDate(dates[0].full);
            if (!selectedDate) setSelectedDate(dates[0].full);
        }
    }, [dates]);

    useEffect(() => {
        if (!startDate) return;
        const start = new Date(startDate);
        if (durationChoice === '1week') {
            start.setDate(start.getDate() + 6);
            setEndDate(start.toISOString().split('T')[0]);
        } else if (durationChoice === '2weeks') {
            start.setDate(start.getDate() + 13);
            setEndDate(start.toISOString().split('T')[0]);
        } else if (durationChoice === '4weeks') {
            start.setDate(start.getDate() + 27);
            setEndDate(start.toISOString().split('T')[0]);
        }
    }, [startDate, durationChoice]);
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

    const calculateDiscountedSubtotal = () => {
        if (!serviceData) return 0;
        const pkg = serviceData.packages?.find(p => p.id === selectedPackage);
        let base = (pkg?.price || 0) * selectedPets.length;

        selectedAddons.forEach(id => {
            const addon = serviceData.addons?.find(a => a.id === id);
            if (addon) base += addon.price * selectedPets.length;
        });

        // Multiply by walk count if walking service
        if (isWalkingService) {
            let durationMultiplier = 1.0;
            if (walkDuration === 15) durationMultiplier = 0.8;
            else if (walkDuration === 45) durationMultiplier = 1.2;
            else if (walkDuration === 60) durationMultiplier = 1.5;
            base = base * durationMultiplier;

            const walkCount = calculateTotalWalksClient(startDate, endDate, frequency, specificDays);
            base = base * walkCount;
        }

        const isRecurring = isWalkingService ? (frequency !== 'onetime') : (recurringType !== 'none');
        if (isRecurring) base = base * 0.9;
        
        if (couponCode === 'SAVE20') base = base * 0.8;

        if (usePoints) {
            const redeemable = Math.min(pointsBalance, base);
            base -= redeemable;
        }

        return Math.max(0, base);
    };

    const calculateTotal = () => {
        const sub = calculateDiscountedSubtotal();
        const platformFee = Math.round(sub * 0.10 * 100) / 100;
        const gst = Math.round(sub * 0.18 * 100) / 100;
        return sub + platformFee + gst;
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
            const walkCount = isWalkingService ? calculateTotalWalksClient(startDate, endDate, frequency, specificDays) : 1;
            
            const res = await bookingsApi.create({
                service_id: serviceId,
                package_id: selectedPackage!,
                booking_type: bookingType,
                pet_ids: selectedPets,
                addon_ids: selectedAddons,
                booking_date: isWalkingService ? (startDate || new Date().toISOString().split('T')[0]) : (selectedDate || new Date().toISOString().split('T')[0]),
                booking_time: selectedTime || undefined,
                address: addrObj?.address,
                latitude: addrObj?.latitude,
                longitude: addrObj?.longitude,
                notes: instructions,
                coupon_code: '',
                points_to_use: 0,
                frequency: isWalkingService ? frequency : 'onetime',
                specific_days: isWalkingService && frequency === 'weekly' ? specificDays : undefined,
                start_date: isWalkingService ? startDate : undefined,
                end_date: isWalkingService ? (frequency === 'onetime' ? startDate : endDate) : undefined,
                walk_duration_minutes: isWalkingService ? walkDuration : undefined,
                total_walks: walkCount,
                special_instructions: isWalkingService ? specialChecklist : undefined
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

    const calculateFinalPayable = () => {
        if (!createdBooking) return 0;
        let total = createdBooking.total_amount || 0;
        
        if (couponCode === 'SAVE20') total = Math.max(0, total * 0.8);
        else if (couponCode === 'FIRST50') total = Math.max(0, total - 50);
        
        if (usePoints) total = Math.max(0, total - pointsBalance);
        
        return total;
    };

    const getUrlQueryParam = (url: string, param: string): string | null => {
        const match = RegExp('[?&]' + param + '=([^&]*)').exec(url);
        return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
    };

    const handlePay = async () => {
        setIsSubmitting(true);
        try {
            const amount = calculateFinalPayable();
            if (!amount) {
                alert('Invalid booking amount');
                setIsSubmitting(false);
                return;
            }

            // 1. 100% Wallet Payment
            if (paymentMode === 'wallet') {
                const res = await walletApi.pay(createdBooking.id, amount);
                if (res.success) {
                    setBookingStatus('confirmed');
                    loadBooking(createdBooking.id);
                } else {
                    alert('Wallet payment failed: ' + (res.error?.message || 'Insufficient balance'));
                }
                setIsSubmitting(false);
                return;
            }

            // Calculate portions for split/gateway payment
            const walletPortion = paymentMode === 'split' ? splitWalletPortion : 0;
            const gatewayPortion = amount - walletPortion;

            if (gatewayPortion <= 0) {
                // If gateway portion is 0 or negative, it's essentially 100% wallet payment
                const res = await walletApi.pay(createdBooking.id, amount);
                if (res.success) {
                    setBookingStatus('confirmed');
                    loadBooking(createdBooking.id);
                } else {
                    alert('Wallet payment failed: ' + (res.error?.message || 'Insufficient balance'));
                }
                setIsSubmitting(false);
                return;
            }

            // 2. Web Razorpay Payment Flow (Supports Split/Card)
            if (Platform.OS === 'web') {
                const { loadRazorpay, initializeRazorpayPayment } = require('../lib/razorpay');
                const loaded = await loadRazorpay();
                if (loaded) {
                    const orderRes = await paymentsApi.createOrder(createdBooking.id, gatewayPortion, walletPortion);
                    if (orderRes.success && orderRes.data?.order) {
                        const orderData = orderRes.data.order;
                        
                        initializeRazorpayPayment({
                            key: orderData.key_id,
                            amount: orderData.amount,
                            currency: orderData.currency,
                            order_id: orderData.order_id,
                            name: 'Pawber',
                            description: walletPortion > 0 ? `Split Payment (Wallet: ₹${walletPortion})` : 'Service Booking Payment',
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
                                        loadBooking(createdBooking.id);
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

            // 3. Native/Mobile environments: Open Razorpay Native SDK Sheet
            console.log('⚡ Launching Razorpay Native SDK Checkout Sheet');
            setIsSubmitting(true);
            try {
                const orderRes = await paymentsApi.createOrder(createdBooking.id, gatewayPortion, walletPortion);
                if (!orderRes.success || !orderRes.data?.order) {
                    alert('Failed to initialize payment order: ' + (orderRes.error?.message || 'Payment gateway error'));
                    setIsSubmitting(false);
                    return;
                }

                const orderData = orderRes.data.order;
                const sessionRes = await supabase.auth.getSession();
                const userEmail = sessionRes.data?.session?.user?.email || 'customer@pawber.com';

                const options = {
                    description: walletPortion > 0 ? `Split Payment (Wallet: ₹${walletPortion})` : 'Service Booking Payment',
                    image: 'https://razorpay.com/favicon.png',
                    currency: orderData.currency,
                    key: orderData.key_id,
                    amount: orderData.amount, // amount in paise
                    name: 'Pawber',
                    order_id: orderData.order_id,
                    prefill: {
                        email: userEmail,
                        contact: '9999999999',
                        name: 'Pawber Customer'
                    },
                    theme: { color: '#FF7A3D' }
                };

                RazorpayCheckout.open(options)
                    .then(async (data: any) => {
                        try {
                            setIsSubmitting(true);
                            console.log('⚡ Razorpay payment successful. Verifying signature...', data);
                            const verifyRes = await paymentsApi.verify({
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_signature: data.razorpay_signature,
                            });
                            if (verifyRes.success && verifyRes.data?.verified) {
                                setBookingStatus('confirmed');
                                loadBooking(createdBooking.id);
                            } else {
                                alert('Payment verification failed.');
                                await handleCancelOrFailure();
                            }
                        } catch (err: any) {
                            console.error('Payment verification signature error:', err);
                            alert('An error occurred during payment verification.');
                            await handleCancelOrFailure();
                        } finally {
                            setIsSubmitting(false);
                        }
                    })
                    .catch(async (error: any) => {
                        console.log('❌ Razorpay native payment cancelled/failed:', error);
                        alert('Payment Cancelled');
                        await handleCancelOrFailure();
                    });
            } catch (err: any) {
                console.error('[Payment] Native payment launch error:', err);
                alert('Failed to launch payment checkout.');
                setIsSubmitting(false);
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSimulatePaymentSuccess = async () => {
        if (!paymentModalDetails) return;
        setIsSubmitting(true);
        setShowPaymentModal(false);
        try {
            const verifyRes = await paymentsApi.verify({
                razorpay_order_id: paymentModalDetails.orderId,
                razorpay_payment_id: 'pay_mock_' + Date.now(),
                razorpay_signature: 'sig_mock_pass'
            });
            if (verifyRes.success && verifyRes.data?.verified) {
                setBookingStatus('confirmed');
                loadBooking(createdBooking.id);
            } else {
                alert('Mock payment verification failed.');
            }
        } catch (err) {
            console.error('Verify payment error:', err);
            alert('Mock payment verification failed.');
        } finally {
            setIsSubmitting(false);
            setPaymentModalDetails(null);
        }
    };

    const handleSimulatePaymentCancel = () => {
        setShowPaymentModal(false);
        setPaymentModalDetails(null);
        setIsSubmitting(false);
        alert('Payment cancelled by user.');
    };

    const handleBack = async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (route?.params?.fromBidding && createdBooking?.id) {
            try {
                setIsSubmitting(true);
                const res = await bookingsApi.deselectBid(createdBooking.id);
                if (res.success) {
                    navigation.goBack();
                } else {
                    alert(res.error?.message || 'Failed to revert bid selection');
                }
            } catch (err: any) {
                alert(err.message || 'An error occurred');
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        if (step > 1) setStep(step - 1);
        else navigation.goBack();
    };

    const handleCancelOrFailure = async () => {
        setIsSubmitting(true);
        try {
            if (route?.params?.fromBidding && createdBooking?.id) {
                const res = await bookingsApi.deselectBid(createdBooking.id);
                if (res.success) {
                    navigation.goBack();
                } else {
                    console.error('Failed to revert bid selection:', res.error?.message);
                    navigation.goBack(); // fallback
                }
            } else {
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error('Error during handleCancelOrFailure:', err);
            navigation.goBack();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChatWithProvider = async () => {
        if (!createdBooking?.id || !createdBooking?.provider?.user_id) {
            alert('Provider information not loaded yet');
            return;
        }
        try {
            setIsSubmitting(true);
            const providerUserId = createdBooking.provider.user_id;
            const res = await api.post<any>('/chat/threads', {
                booking_id: createdBooking.id,
                provider_user_id: providerUserId
            });
            if (res.success && res.data?.thread?.id) {
                navigation.navigate('Chat', {
                    threadId: res.data.thread.id,
                    bookingId: createdBooking.id,
                    providerUserId: providerUserId
                });
            } else {
                alert(res.error?.message || 'Failed to open chat thread');
            }
        } catch (error: any) {
            alert(error.message || 'Failed to initiate chat');
        } finally {
            setIsSubmitting(false);
        }
    };


    const isNextDisabled = () => {
        if (step === 1) {
            const basicCheck = selectedPets.length === 0 || !selectedPackage || !selectedAddress || !selectedTime;
            if (basicCheck) return true;
            if (isWalkingService) {
                if (!startDate) return true;
                if (frequency !== 'onetime' && !endDate) return true;
                if (frequency === 'weekly' && specificDays.length === 0) return true;
                return false;
            } else {
                return !selectedDate;
            }
        }
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
                        <Text style={styles.headerTitle}>
                            {bookingStatus === 'confirmed' ? 'CONFIRMED' : bookingStatus === 'accepted' || bookingStatus === 'bid_selected' ? 'CHECKOUT' : 'FINDING PRO'}
                        </Text>
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





                                {isWalkingService ? (
                                    <>
                                        {/* Frequency Selection */}
                                        <View style={styles.sectionBlock}>
                                            <Text style={styles.sectionTitle}>FREQUENCY</Text>
                                            <View style={styles.frequencyTabs}>
                                                {(['onetime', 'daily', 'weekly'] as const).map(f => (
                                                    <TouchableOpacity
                                                        key={f}
                                                        onPress={() => setFrequency(f)}
                                                        style={StyleSheet.flatten([styles.freqTab, frequency === f && styles.freqTabActive])}
                                                    >
                                                        <Text style={StyleSheet.flatten([styles.freqTabText, frequency === f && styles.freqTabTextActive])}>
                                                            {f === 'onetime' ? 'ONE-TIME' : f.toUpperCase()}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* Specific Days (if Weekly frequency is chosen) */}
                                            {frequency === 'weekly' && (
                                                <View style={{ marginTop: 12 }}>
                                                    <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>SPECIFIC DAYS OF WEEK</Text>
                                                    <View style={styles.daysContainer}>
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                            const isSelected = specificDays.includes(day);
                                                            return (
                                                                <TouchableOpacity
                                                                    key={day}
                                                                    onPress={() => {
                                                                        if (isSelected) {
                                                                            setSpecificDays(prev => prev.filter(d => d !== day));
                                                                        } else {
                                                                            setSpecificDays(prev => [...prev, day]);
                                                                        }
                                                                    }}
                                                                    style={StyleSheet.flatten([styles.dayChip, isSelected && styles.dayChipActive])}
                                                                >
                                                                    <Text style={StyleSheet.flatten([styles.dayChipText, isSelected && styles.dayChipTextActive])}>
                                                                        {day}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        {/* Start Date */}
                                        <View style={styles.sectionBlock}>
                                            <Text style={styles.sectionTitle}>START DATE</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                                                {dates.map(d => (
                                                    <TouchableOpacity
                                                        key={d.full}
                                                        onPress={() => {
                                                            setStartDate(d.full);
                                                            setSelectedDate(d.full); // sync selectedDate as well
                                                        }}
                                                        style={StyleSheet.flatten([styles.dateCard, startDate === d.full && styles.dateCardActive])}
                                                    >
                                                        <Text style={StyleSheet.flatten([styles.dateMonth, startDate === d.full && styles.textWhite])}>{d.month}</Text>
                                                        <Text style={StyleSheet.flatten([styles.dateDay, startDate === d.full && styles.textWhite])}>{d.day}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>

                                        {/* Duration of Package (only if not one-time) */}
                                        {frequency !== 'onetime' && (
                                            <View style={styles.sectionBlock}>
                                                <Text style={styles.sectionTitle}>DURATION OF PACKAGE</Text>
                                                <View style={styles.durationChoiceGrid}>
                                                    {[
                                                        { id: '1week', label: '1 Week' },
                                                        { id: '2weeks', label: '2 Weeks' },
                                                        { id: '4weeks', label: '4 Weeks' },
                                                        { id: 'custom', label: 'Custom' }
                                                    ].map(item => (
                                                        <TouchableOpacity
                                                            key={item.id}
                                                            onPress={() => setDurationChoice(item.id as any)}
                                                            style={StyleSheet.flatten([
                                                                styles.durationChoiceBtn,
                                                                durationChoice === item.id && styles.durationChoiceBtnActive
                                                            ])}
                                                        >
                                                            <Text style={StyleSheet.flatten([
                                                                styles.durationChoiceText,
                                                                durationChoice === item.id && styles.textWhite
                                                            ])}>{item.label}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>

                                                {/* Custom End Date Selector */}
                                                {durationChoice === 'custom' && (
                                                    <View style={{ marginTop: 16 }}>
                                                        <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>SELECT END DATE</Text>
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                                                            {getCustomEndDates(startDate).map(d => (
                                                                <TouchableOpacity
                                                                    key={d.full}
                                                                    onPress={() => setEndDate(d.full)}
                                                                    style={StyleSheet.flatten([styles.dateCard, endDate === d.full && styles.dateCardActive])}
                                                                >
                                                                    <Text style={StyleSheet.flatten([styles.dateMonth, endDate === d.full && styles.textWhite])}>{d.month}</Text>
                                                                    <Text style={StyleSheet.flatten([styles.dateDay, endDate === d.full && styles.textWhite])}>{d.day}</Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Walk Duration */}
                                        <View style={styles.sectionBlock}>
                                            <Text style={styles.sectionTitle}>WALK DURATION PER WALK</Text>
                                            <View style={styles.durationGrid}>
                                                {[15, 30, 45, 60].map(minutes => (
                                                    <TouchableOpacity
                                                        key={minutes}
                                                        onPress={() => setWalkDuration(minutes)}
                                                        style={StyleSheet.flatten([
                                                            styles.durationBtn,
                                                            walkDuration === minutes && styles.durationBtnActive
                                                        ])}
                                                    >
                                                        <Text style={StyleSheet.flatten([
                                                            styles.durationText,
                                                            walkDuration === minutes && styles.textWhite
                                                        ])}>
                                                            {minutes} min
                                                        </Text>
                                                        <Text style={StyleSheet.flatten([
                                                            styles.durationPriceLabel,
                                                            walkDuration === minutes ? styles.textWhiteMuted : { color: '#94A3B8' }
                                                        ])}>
                                                            {minutes === 15 ? '0.8x price' : minutes === 30 ? 'Standard' : minutes === 45 ? '1.2x price' : '1.5x price'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Walk count indicator badge */}
                                        <View style={styles.walkCountBadgeContainer}>
                                            <LinearGradient
                                                colors={['#E0F5F0', '#F0FDF4']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.walkCountBadge}
                                            >
                                                <Text style={styles.walkCountText}>
                                                    Estimated package size:{' '}
                                                    <Text style={{ fontWeight: '900', color: '#1D9E86' }}>
                                                        {calculateTotalWalksClient(startDate, endDate, frequency, specificDays)} walks
                                                    </Text>
                                                </Text>
                                                {frequency !== 'onetime' && startDate && endDate && (
                                                    <Text style={styles.walkCountSubText}>
                                                        Active from {startDate} to {endDate}
                                                    </Text>
                                                )}
                                            </LinearGradient>
                                        </View>

                                        {/* Select Walk Time */}
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
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
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



                                {/* Instructions checklist and notes */}
                                <View style={styles.sectionBlock}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>COMPLIANCE & SPECIAL CHECKLIST</Text>
                                    <View style={styles.checklistGrid}>
                                        {[
                                            { id: 'leash_required', label: 'Leash Required' },
                                            { id: 'avoid_dogs', label: 'Avoid Other Dogs' },
                                            { id: 'medication', label: 'Medication Administration' },
                                            { id: 'key_pickup', label: 'Key Pickup' },
                                            { id: 'emergency_vet', label: 'Emergency Vet Info' }
                                        ].map(item => {
                                            const isSelected = specialChecklist.includes(item.id);
                                            return (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    onPress={() => toggleSpecialChecklist(item.id)}
                                                    style={StyleSheet.flatten([
                                                        styles.checklistCard,
                                                        isSelected && styles.checklistCardActive
                                                    ])}
                                                >
                                                    <View style={StyleSheet.flatten([
                                                        styles.checklistIconCircle,
                                                        isSelected && styles.checklistIconCircleActive
                                                    ])}>
                                                        {isSelected ? (
                                                            <Check size={10} color="white" strokeWidth={5} />
                                                        ) : (
                                                            <Plus size={10} color="#7A5540" />
                                                        )}
                                                    </View>
                                                    <Text style={StyleSheet.flatten([
                                                        styles.checklistText,
                                                        isSelected && styles.checklistTextActive
                                                    ])}>
                                                        {item.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View style={styles.sectionBlock}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>ADDITIONAL NOTES & INSTRUCTIONS</Text>
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
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.summaryTitle}>{serviceData?.name}</Text>
                                                <Text style={styles.summaryMeta} numberOfLines={1}>
                                                    {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''}: {pets.filter(p => selectedPets.includes(p.id)).map(p => p.name).join(', ')}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => setStep(1)} style={styles.quickEditBtn}>
                                                <Text style={styles.quickEditText}>Edit</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.summaryDetails}>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Package Selected</Text>
                                                <Text style={styles.summaryVal}>
                                                    {serviceData?.packages?.find(p => p.id === selectedPackage)?.package_name || 'Standard Plan'}
                                                </Text>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Service Address</Text>
                                                <Text style={styles.summaryVal} numberOfLines={1}>
                                                    {addresses.find(a => a.id === selectedAddress)?.label || 'Selected Location'}
                                                </Text>
                                            </View>

                                            {isWalkingService ? (
                                                <>
                                                    <View style={styles.summaryRow}>
                                                        <Text style={styles.summaryLabel}>Frequency</Text>
                                                        <Text style={styles.summaryVal}>
                                                            {frequency === 'onetime' ? 'One-time walk' : frequency === 'daily' ? 'Daily walks' : `Weekly walks`}
                                                        </Text>
                                                    </View>
                                                    {frequency === 'weekly' && specificDays.length > 0 && (
                                                        <View style={styles.summaryRow}>
                                                            <Text style={styles.summaryLabel}>Selected Days</Text>
                                                            <Text style={styles.summaryVal}>{specificDays.join(', ')}</Text>
                                                        </View>
                                                    )}
                                                    <View style={styles.summaryRow}>
                                                        <Text style={styles.summaryLabel}>Date Range</Text>
                                                        <Text style={styles.summaryVal}>
                                                            {frequency === 'onetime' ? startDate : `${startDate} to ${endDate}`}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.summaryRow}>
                                                        <Text style={styles.summaryLabel}>Walk Duration</Text>
                                                        <Text style={styles.summaryVal}>{walkDuration} mins</Text>
                                                    </View>
                                                    <View style={styles.summaryRow}>
                                                        <Text style={styles.summaryLabel}>Total Walks</Text>
                                                        <Text style={styles.summaryVal}>
                                                            {calculateTotalWalksClient(startDate, endDate, frequency, specificDays)} walks
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={styles.summaryRow}>
                                                        <Text style={styles.summaryLabel}>Scheduled Date</Text>
                                                        <Text style={styles.summaryVal}>{selectedDate}</Text>
                                                    </View>
                                                    <View style={styles.summaryRow}>
                                                        <Text style={styles.summaryLabel}>Scheduled Time</Text>
                                                        <Text style={styles.summaryVal}>{selectedTime}</Text>
                                                    </View>
                                                </>
                                            )}

                                            {specialChecklist.length > 0 && (
                                                <View style={[styles.summaryRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginTop: 4 }]}>
                                                    <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Compliance Requirements</Text>
                                                    <View style={styles.summaryChecklistItems}>
                                                        {specialChecklist.map(item => {
                                                            const labelMap: Record<string, string> = {
                                                                leash_required: 'Leash Required',
                                                                avoid_dogs: 'Avoid Other Dogs',
                                                                medication: 'Medication',
                                                                key_pickup: 'Key Pickup',
                                                                emergency_vet: 'Emergency Vet'
                                                            };
                                                            return (
                                                                <View key={item} style={styles.summaryChecklistItem}>
                                                                    <Check size={10} color="#1D9E86" strokeWidth={5} />
                                                                    <Text style={styles.summaryChecklistText}>{labelMap[item] || item}</Text>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        <View style={styles.summaryDetails}>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Base Fare</Text>
                                                <Text style={styles.summaryVal}>
                                                    ₹{(() => {
                                                        if (!serviceData) return 0;
                                                        const pkg = serviceData.packages?.find(p => p.id === selectedPackage);
                                                        let val = (pkg?.price || 0) * selectedPets.length;
                                                        if (isWalkingService) {
                                                            let durationMultiplier = 1.0;
                                                            if (walkDuration === 15) durationMultiplier = 0.8;
                                                            else if (walkDuration === 45) durationMultiplier = 1.2;
                                                            else if (walkDuration === 60) durationMultiplier = 1.5;
                                                            val = val * durationMultiplier;
                                                        }
                                                        return val;
                                                    })().toFixed(0)}
                                                </Text>
                                            </View>
                                            {isWalkingService && (
                                                <View style={styles.summaryRow}>
                                                    <Text style={styles.summaryLabel}>Walk Package ({calculateTotalWalksClient(startDate, endDate, frequency, specificDays)} walks)</Text>
                                                    <Text style={styles.summaryVal}>
                                                        x {calculateTotalWalksClient(startDate, endDate, frequency, specificDays)}
                                                    </Text>
                                                </View>
                                            )}
                                            {selectedAddons.length > 0 && (
                                                <View style={styles.summaryRow}>
                                                    <Text style={styles.summaryLabel}>Addons ({selectedAddons.length})</Text>
                                                    <Text style={styles.summaryVal}>Included</Text>
                                                </View>
                                            )}
                                            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#DEC9B5', paddingTop: 8, marginTop: 4 }]}>
                                                <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Subtotal</Text>
                                                <Text style={[styles.summaryVal, { fontWeight: '700' }]}>₹{calculateDiscountedSubtotal().toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Platform Fee (10%)</Text>
                                                <Text style={styles.summaryVal}>₹{(calculateDiscountedSubtotal() * 0.10).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Estimated GST (18%)</Text>
                                                <Text style={styles.summaryVal}>₹{(calculateDiscountedSubtotal() * 0.18).toFixed(2)}</Text>
                                            </View>
                                        </View>
                                </View>

                                <View style={styles.totalBanner}>
                                    <View>
                                        <Text style={styles.totalLabel}>ESTIMATED TOTAL</Text>
                                        <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.gstLabel}>GST (18%) & platform fee (10%)</Text>
                                        <Text style={styles.gstStatus}>ADDED ON TOP</Text>
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
                                {(!createdBooking && route?.params?.fromBidding) ? (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                                        <ActivityIndicator size="large" color="#FF7A3D" />
                                        <Text style={{ marginTop: 16, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Preparing checkout...</Text>
                                    </View>
                                ) : (bookingStatus === 'pending' && !route?.params?.fromBidding) ? (
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
                                ) : (bookingStatus === 'accepted' || bookingStatus === 'bid_selected') ? (
                                    <View style={{ alignItems: 'center', width: '100%' }}>
                                        {/* Assigned Provider Details Card */}
                                        <View style={styles.providerMatchCard}>
                                            <Image
                                                source={{ uri: createdBooking?.provider?.user?.avatar_url || 'https://i.pravatar.cc/100' }}
                                                style={styles.providerAvatar}
                                            />
                                            <Text style={styles.matchTitle}>ASSIGNED PROVIDER</Text>
                                            <Text style={styles.providerName}>{createdBooking?.provider?.business_name}</Text>
                                            <View style={styles.ratingRow}>
                                                <Star size={14} color="#1D9E86" fill="#1D9E86" />
                                                <Text style={styles.ratingText}>{createdBooking?.provider?.rating || '4.9'}</Text>
                                            </View>
                                            {createdBooking?.provider?.user?.phone && (
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 4 }}>
                                                    📞 {createdBooking.provider.user.phone}
                                                </Text>
                                            )}
                                            {createdBooking?.provider?.user_id && (
                                                <TouchableOpacity
                                                    onPress={handleChatWithProvider}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        marginTop: 16,
                                                        paddingVertical: 10,
                                                        paddingHorizontal: 20,
                                                        borderRadius: 16,
                                                        backgroundColor: colors.surfaceSecondary,
                                                        borderWidth: 1.5,
                                                        borderColor: colors.border,
                                                    }}
                                                >
                                                    <MessageSquare size={16} color={colors.text} />
                                                    <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text, letterSpacing: 0.5 }}>CHAT WITH PROVIDER</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Booking Summary Card */}
                                        <View style={[styles.summaryCard, { width: '90%', marginBottom: 24, alignSelf: 'stretch', marginHorizontal: 24 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                                <Receipt size={22} color={colors.primary} />
                                                <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>Booking Details</Text>
                                            </View>
                                            
                                            <View style={{ gap: 12 }}>
                                                {/* Service & Package */}
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>Service & Package</Text>
                                                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800' }}>
                                                        {createdBooking?.service?.name || serviceData?.name} - {createdBooking?.package?.package_name || serviceData?.packages?.find(p => p.id === selectedPackage)?.package_name || 'Standard Plan'}
                                                    </Text>
                                                </View>

                                                {/* Date & Time */}
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>Schedule</Text>
                                                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800' }}>
                                                        {createdBooking?.booking_date || selectedDate} @ {createdBooking?.booking_time || selectedTime || 'Flexible'}
                                                    </Text>
                                                </View>

                                                {/* Frequency & Walks */}
                                                {(createdBooking?.frequency || frequency) && (createdBooking?.frequency || frequency) !== 'onetime' && (
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>Frequency & Walks</Text>
                                                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800' }}>
                                                            {(createdBooking?.frequency || frequency).toUpperCase()} ({createdBooking?.total_walks || calculateTotalWalksClient(startDate, endDate, frequency, specificDays)} walks)
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* Walk Duration */}
                                                {(createdBooking?.walk_duration_minutes || walkDuration) && (createdBooking?.walk_duration_minutes || walkDuration) > 0 && isWalkingService && (
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>Walk Duration</Text>
                                                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800' }}>
                                                            {createdBooking?.walk_duration_minutes || walkDuration} mins
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* Pets */}
                                                {createdBooking?.booking_pets && createdBooking.booking_pets.length > 0 && (
                                                    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 6 }}>Pets</Text>
                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                            {createdBooking.booking_pets.map((bp: any) => (
                                                                <View key={bp.pet?.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                                                    <Image source={{ uri: bp.pet?.image_url || 'https://i.pravatar.cc/100?img=12' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                                                                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                                                                        {bp.pet?.name} ({bp.pet?.breed || bp.pet?.type || 'Pet'})
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Addons */}
                                                {createdBooking?.booking_addons && createdBooking.booking_addons.length > 0 && (
                                                    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 6 }}>Addons</Text>
                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                            {createdBooking.booking_addons.map((ba: any) => (
                                                                <View key={ba.addon?.id} style={{ backgroundColor: colors.accentLight, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSecondary }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.accent }}>
                                                                        {ba.addon?.name}
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Address */}
                                                {(createdBooking?.address || addresses.find(a => a.id === selectedAddress)?.address) && (
                                                    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}>
                                                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 }}>Address</Text>
                                                        <Text style={{ fontSize: 12, color: colors.text, fontWeight: '700' }} numberOfLines={2}>
                                                            {createdBooking?.address || addresses.find(a => a.id === selectedAddress)?.address}
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* Special Instructions / Notes */}
                                                {(createdBooking?.notes || instructions) && (
                                                    <View style={{ paddingBottom: 4 }}>
                                                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 }}>Instructions</Text>
                                                        <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', fontWeight: '500' }}>
                                                            "{createdBooking?.notes || instructions}"
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        <Text style={styles.successSubtitle}>
                                            Please confirm payment to finalize the booking. Your expert is ready to start!
                                        </Text>

                                        <View style={{ width: '100%', marginTop: 24, alignSelf: 'stretch', paddingHorizontal: 24 }}>
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
                                            
                                            {paymentMode === 'split' && (
                                                <View style={styles.splitPaymentContainer}>
                                                    <Text style={styles.splitTitle}>SPLIT AMOUNT SETTINGS</Text>
                                                    <Text style={styles.splitSub}>Available Wallet Balance: <Text style={{ fontWeight: 'bold', color: '#1D9E86' }}>₹{walletBalance.toFixed(2)}</Text></Text>
                                                    
                                                    <View style={styles.splitRow}>
                                                        <View style={styles.splitCol}>
                                                            <Text style={styles.splitInputLabel}>Wallet Portion</Text>
                                                            <View style={styles.splitInputWrapper}>
                                                                <Text style={styles.splitPrefix}>₹</Text>
                                                                <TextInput
                                                                    keyboardType="numeric"
                                                                    value={String(splitWalletPortion)}
                                                                    onChangeText={(val) => {
                                                                        const amt = parseFloat(val) || 0;
                                                                        const maxRedeem = Math.min(walletBalance, calculateFinalPayable());
                                                                        setSplitWalletPortion(Math.max(0, Math.min(amt, maxRedeem)));
                                                                    }}
                                                                    style={styles.splitInput}
                                                                />
                                                            </View>
                                                        </View>
                                                        <View style={styles.splitCol}>
                                                            <Text style={styles.splitInputLabel}>Card/Gateway Portion</Text>
                                                            <View style={styles.splitInputWrapper}>
                                                                <Text style={styles.splitPrefix}>₹</Text>
                                                                <Text style={styles.splitPortionVal}>
                                                                    {Math.max(0, calculateFinalPayable() - splitWalletPortion).toFixed(2)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View style={styles.splitChips}>
                                                        <TouchableOpacity 
                                                            style={styles.splitChip} 
                                                            onPress={() => {
                                                                const half = Math.round((calculateFinalPayable() / 2) * 100) / 100;
                                                                setSplitWalletPortion(Math.min(walletBalance, half));
                                                            }}
                                                        >
                                                            <Text style={styles.splitChipText}>50/50 Split</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={styles.splitChip} 
                                                            onPress={() => {
                                                                const max = Math.min(walletBalance, calculateFinalPayable());
                                                                setSplitWalletPortion(max);
                                                            }}
                                                        >
                                                            <Text style={styles.splitChipText}>Use Max Wallet</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={styles.splitChip} 
                                                            onPress={() => setSplitWalletPortion(0)}
                                                        >
                                                            <Text style={styles.splitChipText}>Reset</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        <TouchableOpacity
                                            style={StyleSheet.flatten([styles.continueBtn, { width: '90%', marginTop: 30 }])}
                                            onPress={handlePay}
                                            disabled={isSubmitting}
                                        >
                                            <Text style={styles.continueBtnText}>
                                                {isSubmitting ? 'PROCESSING...' : `CONFIRM & PAY ₹${calculateFinalPayable().toFixed(2)}`}
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
                                    <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
                                        <View style={styles.successIconOuter}>
                                            <View style={styles.successIconInner}>
                                                <CheckCircle2 size={64} color="#FF7A3D" strokeWidth={2.5} />
                                            </View>
                                        </View>
                                        
                                        <Text style={styles.successTitle}>Booking Confirmed!</Text>
                                        <Text style={[styles.successSubtitle, { marginBottom: 20 }]}>
                                            Your payment was successful and your booking is secured. Get ready for premium care!
                                        </Text>

                                        {/* Copyable Booking ID */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceSecondary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>BOOKING ID:</Text>
                                            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text }}>{createdBooking?.id}</Text>
                                        </View>

                                        {/* Timeline Stepper */}
                                        <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: colors.border }}>
                                            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 16 }}>BOOKING TIMELINE</Text>
                                            
                                            {/* Step 1 */}
                                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#48BB78', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Check size={10} color="white" strokeWidth={4} />
                                                    </View>
                                                    <View style={{ width: 2, height: 24, backgroundColor: '#48BB78' }} />
                                                </View>
                                                <View style={{ flex: 1, paddingTop: 1 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>Request Submitted</Text>
                                                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 }}>Booking request broadcasted & received</Text>
                                                </View>
                                            </View>

                                            {/* Step 2 */}
                                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#48BB78', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Check size={10} color="white" strokeWidth={4} />
                                                    </View>
                                                    <View style={{ width: 2, height: 24, backgroundColor: '#48BB78' }} />
                                                </View>
                                                <View style={{ flex: 1, paddingTop: 1 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>Provider Assigned</Text>
                                                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 }}>{createdBooking?.provider?.business_name || 'Service Professional'}</Text>
                                                </View>
                                            </View>

                                            {/* Step 3 */}
                                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#48BB78', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Check size={10} color="white" strokeWidth={4} />
                                                    </View>
                                                    <View style={{ width: 2, height: 24, backgroundColor: colors.border }} />
                                                </View>
                                                <View style={{ flex: 1, paddingTop: 1 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>Payment Received</Text>
                                                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 }}>Payment securely verified</Text>
                                                </View>
                                            </View>

                                            {/* Step 4 */}
                                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.borderSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted }} />
                                                </View>
                                                <View style={{ flex: 1, paddingTop: 1 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textMuted }}>Service Commencing</Text>
                                                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 }}>Awaiting schedule time to begin service</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Assigned Provider Contact details Card */}
                                        <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 28, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' }}>
                                            <Image
                                                source={{ uri: createdBooking?.provider?.user?.avatar_url || 'https://i.pravatar.cc/100' }}
                                                style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 12 }}
                                            />
                                            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.accent, letterSpacing: 1.5, marginBottom: 4 }}>YOUR PET CARE EXPERT</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{createdBooking?.provider?.business_name}</Text>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 4 }}>📞 {createdBooking?.provider?.user?.phone || 'Contact via Chat'}</Text>
                                        </View>

                                        {/* Success Buttons */}
                                        <View style={{ width: '100%', gap: 12, marginBottom: 20 }}>
                                            {createdBooking?.provider?.user_id && (
                                                <TouchableOpacity
                                                    style={{ height: 60, borderRadius: 20, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                                    onPress={handleChatWithProvider}
                                                >
                                                    <MessageSquare size={20} color="white" />
                                                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>CHAT WITH PROVIDER</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                style={{ height: 56, borderRadius: 20, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}
                                                onPress={() => navigation.navigate('LiveTracking', { bookingId: createdBooking?.id })}
                                            >
                                                <Text style={{ color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 1 }}>TRACK LIVE</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity 
                                                style={{ height: 56, borderRadius: 20, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} 
                                                onPress={() => navigation.navigate('Main')}
                                            >
                                                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>BACK TO HOME</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Simulated Payment Sheet Modal */}
                <Modal
                    visible={showPaymentModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={handleSimulatePaymentCancel}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: '#1A202C', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                            {/* Razorpay Brand Header */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#2D3748', paddingBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Image source={{ uri: 'https://razorpay.com/favicon.png' }} style={{ width: 24, height: 24 }} defaultSource={{ uri: 'https://razorpay.com/favicon.png' }} />
                                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>razorpay</Text>
                                </View>
                                <View style={{ backgroundColor: '#ECC94B', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }}>
                                    <Text style={{ color: '#1A202C', fontSize: 10, fontWeight: '900' }}>TEST MODE</Text>
                                </View>
                            </View>

                            {/* Order & Amount */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: '#A0AEC0', fontSize: 12, fontWeight: '700' }}>ORDER ID</Text>
                                <Text style={{ color: 'white', fontSize: 14, fontWeight: '800', marginTop: 2 }}>{paymentModalDetails?.orderId}</Text>
                                
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, backgroundColor: '#2D3748', padding: 16, borderRadius: 16 }}>
                                    <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '800' }}>Amount to Pay</Text>
                                    <Text style={{ color: '#63B3ED', fontSize: 20, fontWeight: '900' }}>₹{paymentModalDetails?.amount?.toFixed(2)}</Text>
                                </View>
                            </View>

                            {/* Simulation Notice */}
                            <View style={{ backgroundColor: '#2C5282', padding: 16, borderRadius: 16, marginBottom: 28, flexDirection: 'row', gap: 12 }}>
                                <Info size={20} color="#90CDF4" style={{ marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>Simulated Razorpay Gateway</Text>
                                    <Text style={{ color: '#EBF8FF', fontSize: 12, fontWeight: '600', marginTop: 2, lineHeight: 18 }}>
                                        This modal simulates Razorpay's native checkout SDK sheet. Choose to succeed or cancel the payment below.
                                    </Text>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={handleSimulatePaymentSuccess}
                                    style={{ height: 56, borderRadius: 16, backgroundColor: '#48BB78', alignItems: 'center', justifyContent: 'center', shadowColor: '#48BB78', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
                                >
                                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>SUCCESS (CONFIRM PAYMENT)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSimulatePaymentCancel}
                                    style={{ height: 56, borderRadius: 16, backgroundColor: '#E53E3E', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>CANCEL PAYMENT</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

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
                                        {step === 2 ? 'SUBMIT REQUEST' : 'CONTINUE'}
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    headerTitles: { alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 2 },
    stepIndicator: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: 2 },
    infoBtn: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    progressTrack: { height: 6, backgroundColor: colors.border, marginHorizontal: 24, borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
    progressBar: { height: '100%', borderRadius: 3 },

    scrollContainer: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    stepView: { paddingHorizontal: 24, paddingTop: 10 },
    textGroup: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1 },
    italic: { color: colors.primary, fontStyle: 'italic' },
    subtitle: { fontSize: 15, color: colors.textSecondary, fontWeight: '600', marginTop: 8 },

    sectionBlock: { marginBottom: 36 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5 },
    selectionCount: { fontSize: 12, fontWeight: '800', color: colors.primary },

    petScroll: { marginHorizontal: -24, paddingLeft: 24 },
    petCard: { width: 90, alignItems: 'center', marginRight: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent' },
    petCardActive: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
    petImageWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceSecondary, padding: 3, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    petImage: { width: '100%', height: '100%', borderRadius: 32 },
    petName: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
    petNameActive: { color: colors.primary },
    petCheckBadge: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
    petCardAdd: { width: 90, height: 110, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderRadius: 24, backgroundColor: colors.primaryLight, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary },
    addIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    addText: { fontSize: 9, fontWeight: '900', color: colors.primary },

    locationTabs: { flexDirection: 'row', gap: 12, marginTop: 12 },
    locationTab: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    locationTabActive: { backgroundColor: colors.text },
    locationTabText: { fontSize: 11, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1 },
    locationTabTextActive: { color: colors.background },

    addressList: { gap: 12, marginTop: 4 },
    addressCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    addressCardActive: { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    addrIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    addrIconCircleActive: { backgroundColor: colors.accent },
    addrInfo: { flex: 1 },
    addrLabel: { fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: 2 },
    addrText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    selectionCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    selectionCircleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    addressAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 20, backgroundColor: colors.primaryLight, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary, marginTop: 4 },
    addressAddBtnText: { fontSize: 12, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 },

    packageList: { gap: 12, marginTop: 4 },
    planCard: { padding: 20, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
    planCardActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planTitleBox: { flex: 1, marginRight: 16 },
    planName: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 4 },
    planFeatures: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    planPrice: { fontSize: 22, fontWeight: '900', color: colors.text },
    planSelectionIndicator: { position: 'absolute', top: -10, right: 20, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
    planSelectionIndicatorActive: { backgroundColor: colors.accent },

    footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16, backgroundColor: colors.surface },
    continueBtn: { height: 64, borderRadius: 24, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    continueBtnDisabled: { backgroundColor: colors.border, shadowOpacity: 0 },
    continueBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    frequencyTabs: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    freqTab: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: 'center' },
    freqTabActive: { backgroundColor: colors.text },
    freqTabText: { fontSize: 11, fontWeight: '900', color: colors.textSecondary },
    freqTabTextActive: { color: colors.background },
    dateList: { marginHorizontal: -24, paddingLeft: 24, marginBottom: 24 },
    dateCard: { width: 70, height: 90, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
    dateCardActive: { backgroundColor: colors.text, borderColor: colors.text },
    dateMonth: { fontSize: 10, fontWeight: '900', color: colors.textMuted },
    dateDay: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 2 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    timeBtn: { width: (width - 68) / 3, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    timeBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
    timeBtnDisabled: { opacity: 0.4 },
    timeText: { fontSize: 12, fontWeight: '800', color: colors.text },
    timerBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.accentLight, borderRadius: 20 },
    timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timerLabel: { fontSize: 13, fontWeight: '800', color: colors.accent },
    timerValue: { fontSize: 18, fontWeight: '900', color: colors.accent },
    addonList: { gap: 12, marginBottom: 24 },
    addonCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    addonCardActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
    addonInfo: { flex: 1 },
    addonTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
    addonMeta: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    instructionBox: { flexDirection: 'row', padding: 16, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.border },
    instructionIcon: { marginTop: 4, marginRight: 12 },
    instructionInput: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', height: 80, textAlignVertical: 'top' },
    summaryCard: { padding: 24, backgroundColor: colors.surface, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
    summaryHeader: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    summaryTitle: { fontSize: 17, fontWeight: '900', color: colors.text },
    summaryMeta: { fontSize: 13, color: colors.textMuted, fontWeight: '700', marginTop: 2 },
    summaryDetails: { borderTopWidth: 1.5, borderTopColor: colors.border, paddingTop: 20, gap: 12, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    summaryVal: { fontSize: 14, color: colors.text, fontWeight: '800' },
    couponInput: { height: 54, backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 20, fontSize: 12, fontWeight: '900', color: colors.text, letterSpacing: 1, marginBottom: 20, borderWidth: 1.5, borderColor: colors.border },
    pointsRedeem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.accentLight, borderRadius: 20, marginBottom: 24 },
    pointsRedeemActive: { backgroundColor: colors.accent },
    pointsInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    pointsTitle: { fontSize: 14, fontWeight: '900', color: colors.accent },
    pointsSubtitle: { fontSize: 11, fontWeight: '700', color: colors.accent },
    redeemToggle: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
    redeemToggleActive: { backgroundColor: 'white' },
    paymentMethods: { flexDirection: 'row', gap: 10 },
    paymentBtn: { flex: 1, height: 70, backgroundColor: colors.background, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border },
    paymentBtnActive: { backgroundColor: colors.surface, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
    paymentLabelText: { fontSize: 10, fontWeight: '900', color: colors.textSecondary, letterSpacing: 0.5 },
    totalBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginTop: 32 },
    totalLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5 },
    totalValue: { fontSize: 32, fontWeight: '900', color: colors.text },
    gstLabel: { fontSize: 9, fontWeight: '900', color: colors.textMuted },
    gstStatus: { fontSize: 11, fontWeight: '900', color: colors.accent, marginTop: 2 },
    successView: { alignItems: 'center', paddingTop: 40 },
    successIconOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    successIconInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    successTitle: { fontSize: 26, fontWeight: '900', color: colors.text, textAlign: 'center' },
    successSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginTop: 12, paddingHorizontal: 20 },
    successButtons: { width: '100%', gap: 12, marginTop: 48 },
    homeBtn: { height: 64, borderRadius: 24, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
    homeBtnText: { color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    trackBtn: { height: 60, borderRadius: 24, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    trackBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    providerMatchCard: { width: '100%', padding: 24, backgroundColor: colors.surface, borderRadius: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, marginBottom: 24 },
    providerAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceSecondary, marginBottom: 16 },
    matchTitle: { fontSize: 12, fontWeight: '900', color: colors.accent, letterSpacing: 1.5, marginBottom: 8 },
    providerName: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 6 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingText: { fontSize: 14, fontWeight: '800', color: colors.text },
    textWhite: { color: 'white' },
    textWhiteMuted: { color: 'rgba(255,255,255,0.7)' },
    textPrimary: { color: colors.primary },
    daysContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: 'transparent' },
    dayChipActive: { backgroundColor: colors.text, borderColor: colors.text },
    dayChipText: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
    dayChipTextActive: { color: colors.background },
    durationChoiceGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
    durationChoiceBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 2, borderColor: colors.border },
    durationChoiceBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
    durationChoiceText: { fontSize: 12, fontWeight: '800', color: colors.text },
    durationGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
    durationBtn: { flex: 1, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 2, borderColor: colors.border },
    durationBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
    durationText: { fontSize: 12, fontWeight: '900', color: colors.text },
    durationPriceLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },
    walkCountBadgeContainer: { marginTop: 8, marginBottom: 24 },
    walkCountBadge: { padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colors.borderSecondary },
    walkCountText: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
    walkCountSubText: { fontSize: 11, fontWeight: '700', color: colors.accent, marginTop: 4 },
    checklistGrid: { gap: 10, marginTop: 4 },
    checklistCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: colors.border },
    checklistCardActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
    checklistIconCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderSecondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checklistIconCircleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    checklistText: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
    checklistTextActive: { color: colors.accent },
    quickEditBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primaryLight },
    quickEditText: { fontSize: 12, fontWeight: '900', color: colors.primary },
    summaryChecklistItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    summaryChecklistItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentLight, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSecondary },
    summaryChecklistText: { fontSize: 11, fontWeight: '800', color: colors.accent },
    splitPaymentContainer: { marginTop: 24, padding: 16, borderRadius: 24, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border },
    splitTitle: { fontSize: 11, fontWeight: '900', color: colors.primary, letterSpacing: 1.5, marginBottom: 4 },
    splitSub: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 16 },
    splitRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    splitCol: { flex: 1 },
    splitInputLabel: { fontSize: 11, fontWeight: '900', color: colors.textMuted, marginBottom: 6 },
    splitInputWrapper: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    splitPrefix: { fontSize: 16, fontWeight: '900', color: colors.primary, marginRight: 4 },
    splitInput: { flex: 1, fontSize: 16, fontWeight: '900', color: colors.text, padding: 0 },
    splitPortionVal: { fontSize: 16, fontWeight: '900', color: colors.text },
    splitChips: { flexDirection: 'row', gap: 8 },
    splitChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    splitChipText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
});
