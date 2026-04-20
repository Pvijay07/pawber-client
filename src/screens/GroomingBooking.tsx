import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Check,
  Scissors,
  ChevronRight,
} from 'lucide-react-native';
export default function GroomingBooking({ navigation }: any) {
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
    { id: '2', label: 'Office', address: 'PetCare HQ, BKC, Mumbai 400051' }
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GROOMING</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Visit Type */}
          <Text style={styles.sectionTitle}>WHERE SHOULD WE MEET?</Text>
          <View style={styles.visitTabs}>
            <TouchableOpacity
              onPress={() => setVisitType('home')}
              style={[styles.visitTab, visitType === 'home' && styles.visitTabActive]}
            >
              <Text style={[styles.visitTabText, visitType === 'home' && styles.visitTabTextActive]}>AT HOME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVisitType('center')}
              style={[styles.visitTab, visitType === 'center' && styles.visitTabActive]}
            >
              <Text style={[styles.visitTabText, visitType === 'center' && styles.visitTabTextActive]}>AT CENTER</Text>
            </TouchableOpacity>
          </View>

          {/* Pet Selection */}
          <Text style={styles.sectionTitle}>WHICH PETS?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petList}>
            {pets.map(pet => (
              <TouchableOpacity
                key={pet.id}
                onPress={() => togglePet(pet.id)}
                style={[styles.petCard, selectedPets.includes(pet.id) && styles.petCardActive]}
              >
                <Image source={{ uri: pet.image }} style={styles.petImage} />
                <Text style={[styles.petName, selectedPets.includes(pet.id) && styles.petNameActive]}>{pet.name}</Text>
                {selectedPets.includes(pet.id) && (
                  <View style={styles.checkIcon}>
                    <Check size={12} color="white" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Package Selection */}
          <Text style={styles.sectionTitle}>CHOOSE PACKAGE</Text>
          <View style={styles.packageList}>
            {serviceData.packages.map(pkg => (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPackage(pkg.id)}
                style={[styles.packageCard, selectedPackage === pkg.id && styles.packageCardActive]}
              >
                <View style={styles.packageInfo}>
                  <Text style={[styles.packageName, selectedPackage === pkg.id && styles.textWhite]}>{pkg.name}</Text>
                  <Text style={[styles.packageDesc, selectedPackage === pkg.id && styles.textWhiteMuted]}>{pkg.features.join(' • ')}</Text>
                </View>
                <Text style={[styles.packagePrice, selectedPackage === pkg.id && styles.textWhite]}>₹{pkg.price}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Address Selection (only if home) */}
          {visitType === 'home' && (
            <>
              <Text style={styles.sectionTitle}>SELECT ADDRESS</Text>
              <View style={styles.addressList}>
                {addresses.map(addr => (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => setSelectedAddress(addr.id)}
                    style={[styles.addressCard, selectedAddress === addr.id && styles.addressCardActive]}
                  >
                    <MapPin size={20} color={selectedAddress === addr.id ? '#14b8a6' : '#94a3b8'} />
                    <View style={styles.addrInfo}>
                      <Text style={styles.addrLabel}>{addr.label}</Text>
                      <Text style={styles.addrText} numberOfLines={1}>{addr.address}</Text>
                    </View>
                    <View style={[styles.radio, selectedAddress === addr.id && styles.radioActive]}>
                      {selectedAddress === addr.id && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!isFormValid}
            style={[styles.confirmBtn, !isFormValid && styles.confirmBtnDisabled]}
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
  safeArea: { flex: 1, backgroundColor: 'white' },
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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 2 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 16,
  },
  visitTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 16,
    gap: 4,
  },
  visitTab: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  visitTabActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  visitTabText: { fontSize: 11, fontWeight: '900', color: '#64748b' },
  visitTabTextActive: { color: '#14b8a6' },
  petList: { flexDirection: 'row', gap: 12 },
  petCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    marginRight: 12,
  },
  petCardActive: { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#14b8a6' },
  petImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  petName: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  petNameActive: { color: '#0f172a' },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageList: { gap: 12 },
  packageCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageCardActive: { backgroundColor: '#0f172a' },
  packageInfo: { flex: 1, marginRight: 16 },
  packageName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  packageDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  packagePrice: { fontSize: 18, fontWeight: '900', color: '#14b8a6' },
  textWhite: { color: 'white' },
  textWhiteMuted: { color: 'rgba(255,255,255,0.6)' },
  addressList: { gap: 12 },
  addressCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 12,
  },
  addressCardActive: { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#14b8a6' },
  addrInfo: { flex: 1 },
  addrLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  addrText: { fontSize: 12, color: '#64748b' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#14b8a6' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#14b8a6' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  confirmBtn: {
    height: 56,
    backgroundColor: '#14b8a6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  confirmBtnDisabled: { backgroundColor: '#cbd5e1' },
  confirmBtnText: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
