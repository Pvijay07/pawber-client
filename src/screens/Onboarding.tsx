import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    TextInput,
    Animated,
    Platform,
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

const { width } = Dimensions.get('window');

export default function Onboarding({ navigation }: any) {
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
        else navigation.replace('Home');
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {step > 1 ? (
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                            <ArrowLeft size={20} color="#0f172a" />
                        </TouchableOpacity>
                    ) : <View style={{ width: 44 }} />}

                    <View style={styles.progressContainer}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={[
                                styles.progressBar,
                                i === step ? styles.activeProgressBar : styles.inactiveProgressBar
                            ]} />
                        ))}
                    </View>

                    <TouchableOpacity onPress={() => navigation.replace('Home')}>
                        <Text style={styles.skipText}>SKIP</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {step === 1 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.title}>Tell us about your <Text style={styles.accentText}>pet</Text>.</Text>
                            <Text style={styles.subtitle}>Select your pet type to personalize your experience.</Text>

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
                                            petType === type.id && styles.activePetCard
                                        ]}
                                    >
                                        <type.icon size={40} color={petType === type.id ? '#4f46e5' : '#cbd5e1'} />
                                        <Text style={[styles.petCardText, petType === type.id && styles.activePetCardText]}>{type.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.title}>What <Text style={styles.accentText}>services</Text> do you need?</Text>
                            <Text style={styles.subtitle}>Select one or more services you're interested in.</Text>

                            <View style={styles.serviceList}>
                                {services.map(service => (
                                    <TouchableOpacity
                                        key={service.id}
                                        onPress={() => toggleService(service.id)}
                                        style={[
                                            styles.serviceItem,
                                            selectedServices.includes(service.id) && styles.activeServiceItem
                                        ]}
                                    >
                                        <View style={[
                                            styles.serviceIconBox,
                                            selectedServices.includes(service.id) ? { backgroundColor: '#4f46e5' } : { backgroundColor: '#f8fafc' }
                                        ]}>
                                            <service.icon size={24} color={selectedServices.includes(service.id) ? 'white' : '#94a3b8'} />
                                        </View>
                                        <Text style={[
                                            styles.serviceName,
                                            selectedServices.includes(service.id) && { color: '#0f172a' }
                                        ]}>{service.name}</Text>
                                        <View style={[
                                            styles.checkCircle,
                                            selectedServices.includes(service.id) && styles.activeCheckCircle
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
                            <Text style={styles.title}>Enable <Text style={styles.accentText}>access</Text>.</Text>
                            <Text style={styles.subtitle}>We need these to provide local services and timely updates.</Text>

                            <View style={styles.accessList}>
                                <View style={styles.accessItem}>
                                    <View style={[styles.accessIconBox, { backgroundColor: '#eff6ff' }]}>
                                        <MapPin size={28} color="#3b82f6" />
                                    </View>
                                    <View style={styles.accessInfo}>
                                        <Text style={styles.accessTitle}>Location Access</Text>
                                        <Text style={styles.accessDesc}>Find experts near you automatically.</Text>
                                    </View>
                                    <TouchableOpacity><Text style={styles.enableText}>ENABLE</Text></TouchableOpacity>
                                </View>

                                <View style={styles.accessItem}>
                                    <View style={[styles.accessIconBox, { backgroundColor: '#fff7ed' }]}>
                                        <Bell size={28} color="#f97316" />
                                    </View>
                                    <View style={styles.accessInfo}>
                                        <Text style={styles.accessTitle}>Notifications</Text>
                                        <Text style={styles.accessDesc}>Get updates on your pet's status.</Text>
                                    </View>
                                    <TouchableOpacity><Text style={styles.enableText}>ENABLE</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {step === 4 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.title}>Have a <Text style={styles.accentText}>referral</Text>?</Text>
                            <Text style={styles.subtitle}>Enter your code below to claim your welcome bonus.</Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconBox}>
                                    <Gift size={22} color="#4f46e5" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ENTER CODE (OPTIONAL)"
                                    placeholderTextColor="#94a3b8"
                                    value={referralCode}
                                    onChangeText={setReferralCode}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={styles.promoCard}>
                                <Text style={styles.promoText}>Claim a <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>₹250 credit</Text> on your first service with a valid code!</Text>
                            </View>
                        </View>
                    )}

                    {step === 5 && (
                        <View style={[styles.stepContent, { alignItems: 'center' }]}>
                            <View style={styles.successIconBox}>
                                <CheckCircle2 size={64} color="#4f46e5" />
                            </View>
                            <Text style={[styles.title, { textAlign: 'center' }]}>You're all <Text style={styles.accentText}>set</Text>!</Text>
                            <Text style={[styles.subtitle, { textAlign: 'center' }]}>Welcome to the PetCare family. We're ready to provide the best care for your buddy.</Text>

                            <View style={styles.bonusCard}>
                                <View style={styles.bonusIconBox}>
                                    <Gift size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={styles.bonusTitle}>Welcome Bonus</Text>
                                    <Text style={styles.bonusValue}>₹50 credited to wallet</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>{step === 5 ? 'GET STARTED' : 'CONTINUE'}</Text>
                    <ChevronRight size={20} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
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
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
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
        backgroundColor: '#4f46e5',
    },
    inactiveProgressBar: {
        width: 6,
        backgroundColor: '#f1f5f9',
    },
    skipText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
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
        color: '#0f172a',
        lineHeight: 40,
        marginBottom: 12,
    },
    accentText: {
        fontStyle: 'italic',
        color: '#4f46e5',
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
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
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    activePetCard: {
        borderColor: '#4f46e5',
        backgroundColor: '#f5f3ff',
        shadowColor: '#4f46e5',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 10 },
    },
    petCardText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    activePetCardText: {
        color: '#4f46e5',
    },
    serviceList: {
        gap: 12,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#f1f5f9',
        gap: 16,
    },
    activeServiceItem: {
        borderColor: '#4f46e5',
        backgroundColor: '#f5f3ff',
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
        color: '#94a3b8',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeCheckCircle: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    accessList: {
        gap: 16,
    },
    accessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#f1f5f9',
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
        color: '#0f172a',
        marginBottom: 2,
    },
    accessDesc: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    enableText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#4f46e5',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        paddingHorizontal: 20,
        height: 72,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    inputIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        letterSpacing: 2,
    },
    promoCard: {
        padding: 24,
        backgroundColor: '#f8fafc',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderStyle: 'dashed',
    },
    promoText: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    successIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f5f3ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    bonusCard: {
        padding: 24,
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#f1f5f9',
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
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bonusTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    bonusValue: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    nextBtn: {
        backgroundColor: '#0f172a',
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
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
