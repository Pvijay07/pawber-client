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
} from 'lucide-react-native';
import { walletApi } from '../services/wallet.service';
import { getServiceById } from '../data/services';
import { bookingsApi } from '../services/bookings.service';
import { supabase } from '../lib/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

interface BookingFlowProps {
    navigation: any;
    route: any;
}

export default function BookingFlow({ navigation, route }: BookingFlowProps) {
    const serviceId = route?.params?.serviceId || 'grooming';
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [selectedPets, setSelectedPets] = useState<number[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [serviceLocation, setServiceLocation] = useState<'home' | 'center'>('home');
    
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
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

    const serviceData = getServiceById(serviceId);

    useEffect(() => {
        fetchWalletData();
        if (step === 2 && holdTimer > 0) {
            const timer = setInterval(() => setHoldTimer(t => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [step, holdTimer]);

    const fetchWalletData = async () => {
        try {
            const res = await walletApi.get();
            if (res.success && res.data) {
                setPointsBalance(res.data.wallet.points_balance || 0);
            }
        } catch (e) {}
    };

    const pets = [
        { id: 1, name: 'Max', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200' },
        { id: 2, name: 'Luna', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200' }
    ];

    const addresses = [
        { id: '1', label: 'Home', address: '123 Pet Lane, Mumbai 400001' },
        { id: '2', label: 'Office', address: 'PetCare HQ, BKC, Mumbai 400051' }
    ];

    const dates = [12, 13, 14, 15, 16];
    const times = [
        { time: '09:00 AM', available: true },
        { time: '10:30 AM', available: false },
        { time: '01:00 PM', available: true },
        { time: '03:30 PM', available: true },
        { time: '05:00 PM', available: true }
    ];

    const togglePet = (id: number) => {
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
        const pkg = serviceData.packages.find(p => p.id === selectedPackage);
        let base = (pkg?.price || 0) * selectedPets.length;

        selectedAddons.forEach(id => {
            const addon = serviceData.addons.find(a => a.id === id);
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
                pet_ids: selectedPets.map(id => String(id)),
                booking_date: '2026-04-12', // Simplified for now
                address: addresses.find(a => a.id === selectedAddress)?.address,
                notes: instructions,
                coupon_code: couponCode,
                points_to_use: usePoints ? Math.min(pointsBalance, calculateTotal() + (usePoints ? Math.min(pointsBalance, calculateTotal() * 2) : 0)) : 0 // Simplified: Backend checks limit
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

    useEffect(() => {
        if (!createdBooking?.id) return;

        console.log('📡 Tracking Booking Status:', createdBooking.id);
        
        const channel = supabase
            .channel(`booking_status:${createdBooking.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bookings',
                filter: `id=eq.${createdBooking.id}`
            }, (payload: any) => {
                console.log('🔄 Booking Status Updated:', payload.new.status);
                setBookingStatus(payload.new.status);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [createdBooking]);

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
                                                    <Image source={{ uri: pet.image }} style={styles.petImage} />
                                                </View>
                                                <Text style={[styles.petName, selectedPets.includes(pet.id) && styles.petNameActive]}>{pet.name}</Text>
                                                {selectedPets.includes(pet.id) && (
                                                    <View style={styles.checkIcon}>
                                                        <Check size={10} color="white" strokeWidth={4} />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
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
                                    </View>
                                </View>

                                {/* Package Selection */}
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>THE PLAN</Text>
                                    <View style={styles.packageList}>
                                        {serviceData.packages.map(pkg => (
                                            <TouchableOpacity
                                                key={pkg.id}
                                                onPress={() => setSelectedPackage(pkg.id)}
                                                style={[styles.packageCard, selectedPackage === pkg.id && styles.packageCardActive]}
                                            >
                                                <View style={styles.packageHeader}>
                                                    <Text style={[styles.packageName, selectedPackage === pkg.id && styles.textWhite]}>{pkg.name}</Text>
                                                    <Text style={[styles.packagePrice, selectedPackage === pkg.id && styles.textPrimary]}>₹{pkg.price}</Text>
                                                </View>
                                                <Text style={[styles.packageDesc, selectedPackage === pkg.id && styles.textWhiteMuted]}>{pkg.features.join(' • ')}</Text>
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
                                            key={d}
                                            onPress={() => setSelectedDate(d)}
                                            style={[styles.dateCard, selectedDate === d && styles.dateCardActive]}
                                        >
                                            <Text style={[styles.dateMonth, selectedDate === d && styles.textWhite]}>OCT</Text>
                                            <Text style={[styles.dateDay, selectedDate === d && styles.textWhite]}>{d}</Text>
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
                                    {serviceData.addons.map(addon => (
                                        <TouchableOpacity
                                            key={addon.id}
                                            onPress={() => toggleAddon(addon.id)}
                                            style={[styles.addonCard, selectedAddons.includes(addon.id) && styles.addonCardActive]}
                                        >
                                            <View style={styles.addonInfo}>
                                                <Text style={styles.addonTitle}>{addon.name}</Text>
                                                <Text style={styles.addonMeta}>₹{addon.price} • {addon.duration}</Text>
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
                                            <Text style={styles.summaryTitle}>{serviceData.name} ({selectedPets.length} Pets)</Text>
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
                                <View style={styles.successIconOuter}>
                                    <View style={styles.successIconInner}>
                                        {bookingStatus === 'confirmed' ? (
                                            <CheckCircle2 size={64} color="#14b8a6" strokeWidth={2.5} />
                                        ) : (
                                            <ActivityIndicator size="large" color="#14b8a6" />
                                        )}
                                    </View>
                                </View>
                                <Text style={styles.successTitle}>
                                    {bookingStatus === 'confirmed' ? 'Expert Assigned!' : 'Finding Expert...'}
                                </Text>
                                <Text style={styles.successSubtitle}>
                                    {bookingStatus === 'confirmed' 
                                        ? 'Your booking is confirmed. You can track status in the bookings tab.' 
                                        : 'We are matching you with the best available professional.'}
                                </Text>
                                <View style={styles.successButtons}>
                                    <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('Home')}>
                                        <Text style={styles.trackBtnText}>BACK TO HOME</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.homeBtn} 
                                        onPress={() => navigation.navigate('LiveTracking', { bookingId: createdBooking?.id })}
                                    >
                                        <Text style={styles.homeBtnText}>TRACK LIVE</Text>
                                    </TouchableOpacity>
                                </View>
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
        borderColor: 'white',
    },
});
