import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    TextInput,
    Animated,
    Platform
} from 'react-native';
import {
    ChevronRight,
    ArrowLeft,
    Dog,
    Cat,
    Bird,
    ShieldCheck,
    Bell,
    MapPin,
    Gift,
    CheckCircle2,
    Scissors,
    Stethoscope,
    Zap,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function Onboarding({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const [step, setStep] = useState(1);
    const [petType, setPetType] = useState<string | null>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [referralCode, setReferralCode] = useState('');

    const services = [
        { id: 'grooming', name: 'Grooming', icon: Scissors },
        { id: 'vet', name: 'Vet Visit', icon: Stethoscope },
        { id: 'walking', name: 'Walking', icon: MapPin },
        { id: 'training', name: 'Training', icon: Zap },
    ];

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
        else navigation.replace('Main');
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const toggleService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {step > 1 ? (
                        <TouchableOpacity 
                            onPress={handleBack} 
                            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 44 }} />}

                    <View style={styles.progressContainer}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={[
                                styles.progressBar,
                                i === step 
                                    ? [styles.activeProgressBar, { backgroundColor: colors.primary }] 
                                    : [styles.inactiveProgressBar, { backgroundColor: colors.border }]
                            ]} />
                        ))}
                    </View>

                    <TouchableOpacity onPress={() => navigation.replace('Main')}>
                        <Text style={[styles.skipText, { color: colors.textMuted }]}>SKIP</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {step === 1 && (
                        <View style={styles.stepContent}>
                            <Text style={[styles.title, { color: colors.text }]}>Tell us about your <Text style={[styles.accentText, { color: colors.primary }]}>pet</Text>.</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select your pet type to personalize your experience.</Text>

                            <View style={styles.grid}>
                                {[
                                    { id: 'dog', name: 'Dog', icon: Dog },
                                    { id: 'cat', name: 'Cat', icon: Cat },
                                    { id: 'bird', name: 'Bird', icon: Bird },
                                    { id: 'other', name: 'Other', icon: ShieldCheck }
                                ].map(type => (
                                    <TouchableOpacity
                                        key={type.id}
                                        onPress={() => setPetType(type.id)}
                                        style={[
                                            styles.petCard,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            petType === type.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                                        ]}
                                    >
                                        <type.icon size={40} color={petType === type.id ? colors.primary : colors.textMuted} />
                                        <Text style={[styles.petCardText, { color: colors.textMuted }, petType === type.id && { color: colors.primary }]}>{type.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepContent}>
                            <Text style={[styles.title, { color: colors.text }]}>What <Text style={[styles.accentText, { color: colors.primary }]}>services</Text> do you need?</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select one or more services you're interested in.</Text>

                            <View style={styles.serviceList}>
                                {services.map(service => (
                                    <TouchableOpacity
                                        key={service.id}
                                        onPress={() => toggleService(service.id)}
                                        style={[
                                            styles.serviceItem,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            selectedServices.includes(service.id) && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                                        ]}
                                    >
                                        <View style={[
                                            styles.serviceIconBox,
                                            selectedServices.includes(service.id) ? { backgroundColor: colors.primary } : { backgroundColor: colors.background }
                                        ]}>
                                            <service.icon size={24} color={selectedServices.includes(service.id) ? 'white' : colors.textMuted} />
                                        </View>
                                        <Text style={[
                                            styles.serviceName,
                                            { color: colors.textMuted },
                                            selectedServices.includes(service.id) && { color: colors.text }
                                        ]}>{service.name}</Text>
                                        <View style={[
                                            styles.checkCircle,
                                            { borderColor: colors.border },
                                            selectedServices.includes(service.id) && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}>
                                            {selectedServices.includes(service.id) && <CheckCircle2 size={16} color="white" />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.stepContent}>
                            <Text style={[styles.title, { color: colors.text }]}>Enable <Text style={[styles.accentText, { color: colors.primary }]}>access</Text>.</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>We need these to provide local services and timely updates.</Text>

                            <View style={styles.accessList}>
                                <View style={[styles.accessItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={[styles.accessIconBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#eff6ff' }]}>
                                        <MapPin size={28} color="#3b82f6" />
                                    </View>
                                    <View style={styles.accessInfo}>
                                        <Text style={[styles.accessTitle, { color: colors.text }]}>Location Access</Text>
                                        <Text style={[styles.accessDesc, { color: colors.textMuted }]}>Find experts near you automatically.</Text>
                                    </View>
                                    <TouchableOpacity><Text style={[styles.enableText, { color: colors.primary }]}>ENABLE</Text></TouchableOpacity>
                                </View>

                                <View style={[styles.accessItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={[styles.accessIconBox, { backgroundColor: isDark ? colors.surfaceSecondary : colors.accentLight }]}>
                                        <Bell size={28} color={colors.accent} />
                                    </View>
                                    <View style={styles.accessInfo}>
                                        <Text style={[styles.accessTitle, { color: colors.text }]}>Notifications</Text>
                                        <Text style={[styles.accessDesc, { color: colors.textMuted }]}>Get updates on your pet's status.</Text>
                                    </View>
                                    <TouchableOpacity><Text style={[styles.enableText, { color: colors.primary }]}>ENABLE</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {step === 4 && (
                        <View style={styles.stepContent}>
                            <Text style={[styles.title, { color: colors.text }]}>Have a <Text style={[styles.accentText, { color: colors.primary }]}>referral</Text>?</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your code below to claim your welcome bonus.</Text>

                            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: colors.primaryLight }]}>
                                    <Gift size={22} color={colors.primary} />
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="ENTER CODE (OPTIONAL)"
                                    placeholderTextColor={colors.textMuted}
                                    value={referralCode}
                                    onChangeText={setReferralCode}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.promoText, { color: colors.textSecondary }]}>Claim a <Text style={{ fontWeight: 'bold', color: colors.text }}>₹250 credit</Text> on your first service with a valid code!</Text>
                            </View>
                        </View>
                    )}

                    {step === 5 && (
                        <View style={[styles.stepContent, { alignItems: 'center' }]}>
                            <View style={[styles.successIconBox, { backgroundColor: colors.primaryLight }]}>
                                <CheckCircle2 size={64} color={colors.primary} />
                            </View>
                            <Text style={[styles.title, { textAlign: 'center', color: colors.text }]}>You're all <Text style={[styles.accentText, { color: colors.primary }]}>set</Text>!</Text>
                            <Text style={[styles.subtitle, { textAlign: 'center', color: colors.textSecondary }]}>Welcome to the Pawber family. We're ready to provide the best care for your buddy.</Text>

                            <View style={[styles.bonusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={[styles.bonusIconBox, { backgroundColor: colors.primary }]}>
                                    <Gift size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={[styles.bonusTitle, { color: colors.text }]}>Welcome Bonus</Text>
                                    <Text style={[styles.bonusValue, { color: colors.textSecondary }]}>₹50 credited to wallet</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.text }]} onPress={handleNext}>
                    <Text style={[styles.nextBtnText, { color: colors.background }]}>{step === 5 ? 'GET STARTED' : 'CONTINUE'}</Text>
                    <ChevronRight size={20} color={colors.background} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        marginBottom: 40,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
    },
    activeProgressBar: {
        width: 32,
    },
    inactiveProgressBar: {
        width: 6,
    },
    skipText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
    stepContent: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 40,
        marginBottom: 12,
    },
    accentText: {
        fontStyle: 'italic',
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
        marginBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    petCard: {
        width: (width - 48 - 16) / 2,
        aspectRatio: 1,
        borderRadius: 32,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    petCardText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    serviceList: {
        gap: 12,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 2,
        gap: 16,
    },
    serviceIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceName: {
        flex: 1,
        fontSize: 15,
        fontWeight: 'bold',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accessList: {
        gap: 16,
    },
    accessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        gap: 16,
    },
    accessIconBox: {
        width: 56,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accessInfo: {
        flex: 1,
    },
    accessTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    accessDesc: {
        fontSize: 12,
        fontWeight: '500',
    },
    enableText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 20,
        height: 72,
        borderWidth: 2,
        marginBottom: 24,
    },
    inputIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    promoCard: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    promoText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    successIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    bonusCard: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 10 },
    },
    bonusIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bonusTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    bonusValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    nextBtn: {
        height: 64,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 10 },
    },
    nextBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
