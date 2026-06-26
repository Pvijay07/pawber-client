import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import {
    ArrowLeft,
    MapPin,
    Check,
    ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function GroomingBooking({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const [visitType, setVisitType] = useState<'home' | 'center'>('home');
    const [selectedPets, setSelectedPets] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    const serviceData = {
        packages: [
            { id: 'bath', name: 'Bath & Brush', price: 500, features: ['Cleaning', 'Brushing'] },
            { id: 'full', name: 'Full Grooming', price: 1200, features: ['Haircut', 'Nails', 'Bath'] }
        ]
    };

    const pets = [
        { id: 1, name: 'Max', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200' },
        { id: 2, name: 'Luna', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200' }
    ];

    const addresses = [
        { id: '1', label: 'Home', address: '123 Pet Lane, Mumbai 400001' },
        { id: '2', label: 'Office', address: 'Pawber HQ, BKC, Mumbai 400051' }
    ];

    const togglePet = (id: number) => {
        setSelectedPets(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const isFormValid = visitType && selectedPets.length > 0 && selectedPackage && (visitType === 'center' || selectedAddress);

    const handleConfirm = () => {
        navigation.navigate('ServiceBidding', {
            serviceId: 'grooming',
            selectedPets,
            visitType,
            selectedPackage,
            selectedAddress
        });
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>GROOMING</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Visit Type */}
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WHERE SHOULD WE MEET?</Text>
                    <View style={[styles.visitTabs, { backgroundColor: colors.border }]}>
                        <TouchableOpacity
                            onPress={() => setVisitType('home')}
                            style={[styles.visitTab, visitType === 'home' && [styles.visitTabActive, { backgroundColor: colors.surface }]]}
                        >
                            <Text style={[styles.visitTabText, { color: colors.textSecondary }, visitType === 'home' && { color: colors.primary }]}>AT HOME</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setVisitType('center')}
                            style={[styles.visitTab, visitType === 'center' && [styles.visitTabActive, { backgroundColor: colors.surface }]]}
                        >
                            <Text style={[styles.visitTabText, { color: colors.textSecondary }, visitType === 'center' && { color: colors.primary }]}>AT CENTER</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Pet Selection */}
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WHICH PETS?</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petList}>
                        {pets.map(pet => (
                            <TouchableOpacity
                                key={pet.id}
                                onPress={() => togglePet(pet.id)}
                                style={[
                                    styles.petCard,
                                    { backgroundColor: colors.surface },
                                    selectedPets.includes(pet.id) && { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary }
                                ]}
                            >
                                <Image source={{ uri: pet.image }} style={styles.petImage} />
                                <Text style={[styles.petName, { color: colors.textSecondary }, selectedPets.includes(pet.id) && { color: colors.text }]}>{pet.name}</Text>
                                {selectedPets.includes(pet.id) && (
                                    <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                                        <Check size={12} color="white" strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Package Selection */}
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CHOOSE PACKAGE</Text>
                    <View style={styles.packageList}>
                        {serviceData.packages.map(pkg => (
                            <TouchableOpacity
                                key={pkg.id}
                                onPress={() => setSelectedPackage(pkg.id)}
                                style={[
                                    styles.packageCard,
                                    { backgroundColor: colors.surface },
                                    selectedPackage === pkg.id && [styles.packageCardActive, { backgroundColor: colors.text }]
                                ]}
                            >
                                <View style={styles.packageInfo}>
                                    <Text style={[
                                        styles.packageName, 
                                        { color: colors.text },
                                        selectedPackage === pkg.id && styles.textWhite
                                    ]}>{pkg.name}</Text>
                                    <Text style={[
                                        styles.packageDesc, 
                                        { color: colors.textSecondary },
                                        selectedPackage === pkg.id && styles.textWhiteMuted
                                    ]}>{pkg.features.join(' • ')}</Text>
                                </View>
                                <Text style={[
                                    styles.packagePrice, 
                                    { color: colors.primary },
                                    selectedPackage === pkg.id && styles.textWhite
                                ]}>₹{pkg.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Address Selection (only if home) */}
                    {visitType === 'home' && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SELECT ADDRESS</Text>
                            <View style={styles.addressList}>
                                {addresses.map(addr => (
                                    <TouchableOpacity
                                        key={addr.id}
                                        onPress={() => setSelectedAddress(addr.id)}
                                        style={[
                                            styles.addressCard,
                                            { backgroundColor: colors.surface },
                                            selectedAddress === addr.id && { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary }
                                        ]}
                                    >
                                        <MapPin size={20} color={selectedAddress === addr.id ? colors.primary : colors.textMuted} />
                                        <View style={styles.addrInfo}>
                                            <Text style={[styles.addrLabel, { color: colors.text }]}>{addr.label}</Text>
                                            <Text style={[styles.addrText, { color: colors.textSecondary }]} numberOfLines={1}>{addr.address}</Text>
                                        </View>
                                        <View style={[styles.radio, { borderColor: colors.borderSecondary }, selectedAddress === addr.id && { borderColor: colors.primary }]}>
                                            {selectedAddress === addr.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={handleConfirm}
                        disabled={!isFormValid}
                        style={[
                            styles.confirmBtn, 
                            { backgroundColor: colors.primary },
                            !isFormValid && { backgroundColor: colors.border }
                        ]}
                    >
                        <Text style={styles.confirmBtnText}>CONFIRM BOOKING</Text>
                        <ChevronRight size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginTop: 24,
        marginBottom: 16,
    },
    visitTabs: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
        gap: 4,
    },
    visitTab: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    visitTabActive: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    visitTabText: { fontSize: 11, fontWeight: '900' },
    visitTabTextActive: {},
    petList: { flexDirection: 'row', gap: 12 },
    petCard: {
        width: 100,
        alignItems: 'center',
        padding: 12,
        borderRadius: 24,
        marginRight: 12,
    },
    petImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
    petName: { fontSize: 12, fontWeight: 'bold' },
    petNameActive: {},
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packageList: { gap: 12 },
    packageCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    packageCardActive: {},
    packageInfo: { flex: 1, marginRight: 16 },
    packageName: { fontSize: 16, fontWeight: 'bold' },
    packageDesc: { fontSize: 11, marginTop: 2 },
    packagePrice: { fontSize: 18, fontWeight: '900' },
    textWhite: { color: 'white' },
    textWhiteMuted: { color: 'rgba(255,255,255,0.6)' },
    addressList: { gap: 12 },
    addressCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
    },
    addrInfo: { flex: 1 },
    addrLabel: { fontSize: 14, fontWeight: 'bold' },
    addrText: { fontSize: 12 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    footer: { padding: 20, borderTopWidth: 1 },
    confirmBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    confirmBtnText: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
