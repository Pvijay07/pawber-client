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
    StatusBar,
    Alert,
    Modal,
    FlatList,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Plus,
    Camera,
    Edit2,
    Trash2,
    Heart,
    ChevronRight,
    Activity,
    ShieldCheck,
    FileText,
    Calendar,
    Weight,
    User,
    Check,
    Search,
    Dog,
    Cat,
    IterationCw as Cow,
    X,
} from 'lucide-react-native';

import { petsApi } from '../services/pets.service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

interface Pet {
    id: string | number;
    name: string;
    type: 'Dog' | 'Cat' | 'Cow';
    breed: string;
    age: string;
    weight?: string;
    gender: 'Male' | 'Female';
    image: string;
    hasInsurance: boolean;
    isAggressive: boolean;
    medicalHistory: { id: string, date: string, type: string, note: string }[];
    vaccinations: { id: string, name: string, date: string, status: 'Completed' | 'Upcoming' }[];
}

const PET_TYPES = [
    { id: 'Dog', label: 'Dog', icon: Dog },
    { id: 'Cat', label: 'Cat', icon: Cat },
    { id: 'Cow', label: 'Cow', icon: Cow },
];

const AGE_RANGES = ["0-1 Year", "1-2 Years", "2-3 Years", "3-5 Years", "5+ Years"];

const BREEDS: Record<string, string[]> = {
    Dog: ["Golden Retriever", "German Shepherd", "Labrador", "Poodle", "Bulldog", "Beagle", "Indie / Mixed"],
    Cat: ["Persian", "Siamese", "Maine Coon", "Bengal", "British Shorthair", "Indie / Mixed"],
    Cow: ["Gir", "Sahiwal", "Red Sindhi", "Tharparkar", "Holstein Friesian", "Jersey"],
};

interface PetsProps {
    navigation: any;
}

export default function Pets({ navigation, route }: any) {
    const insets = useSafeAreaInsets();
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'health' | 'docs'>('info');

    const [pets, setPets] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadPets();
    }, []);

    useEffect(() => {
        if (route?.params?.forceAdd) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsAdding(true);
            // Clear the param so it doesn't trigger again on re-focus
            navigation.setParams({ forceAdd: undefined });
        }
    }, [route?.params?.forceAdd]);

    const loadPets = async () => {
        setIsLoading(true);
        try {
            const res = await petsApi.list();
            if (res.success && res.data?.pets) {
                const mappedPets = res.data.pets.map(p => ({
                    id: p.id,
                    name: p.name || 'Unnamed',
                    breed: p.breed || 'Mixed',
                    age: p.age || 'Unknown',
                    weight: p.weight ? `${p.weight} kg` : 'N/A',
                    gender: (p.gender || 'Male') as 'Male' | 'Female',
                    image: p.image_url || `https://api.dicebear.com/7.x/adventurer/png?seed=${p.name || Date.now()}`,
                    hasInsurance: p.has_insurance || false,
                    isAggressive: p.is_aggressive || false,
                    medicalHistory: p.medical_notes ? [{ id: '1', date: 'N/A', type: 'Note', note: p.medical_notes }] : [],
                    vaccinations: []
                }));
                setPets(mappedPets as any);
                if (mappedPets.length === 0) {
                    setIsAdding(true);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        type: 'Dog' as 'Dog' | 'Cat' | 'Cow',
        breed: '',
        age: '1-2 Years',
        weight: '',
        gender: 'Male' as 'Male' | 'Female',
        image: '',
        hasInsurance: false,
        isAggressive: false,
    });

    const [breedModalVisible, setBreedModalVisible] = useState(false);
    const [breedSearch, setBreedSearch] = useState('');

    const handleSave = async () => {
        setIsLoading(true);
        const newPetData = {
            name: formData.name,
            type: formData.type,
            breed: formData.breed,
            age: formData.age,
            weight: (formData.weight && !isNaN(parseFloat(formData.weight))) ? parseFloat(formData.weight) : null,
            image_url: formData.image || `https://api.dicebear.com/7.x/adventurer/png?seed=${formData.name || Date.now()}`,
            has_insurance: formData.hasInsurance,
            is_aggressive: formData.isAggressive,
            gender: formData.gender,
        };
        const res = await petsApi.create(newPetData);
        if (res.success && res.data?.pet) {
            await loadPets();
        } else {
            // Provide feedback on failure
            Alert.alert(
                'Save Failed',
                res.error?.message || 'We could not save your pet. Please check your connection and try again.',
                [{ text: 'OK' }]
            );
            console.error('Pet create failed:', res.error);
        }
        setIsLoading(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsAdding(false);
        resetForm();
        
        // If we were forced to add from booking flow, go back automatically
        if (route?.params?.forceAdd) {
            navigation.goBack();
        }
    };

    const resetForm = () => {
        setFormData({ 
            name: '', 
            type: 'Dog',
            breed: '', 
            age: '1-2 Years', 
            weight: '', 
            gender: 'Male', 
            image: '', 
            hasInsurance: false, 
            isAggressive: false 
        });
    };

    const handleDelete = async (id: string | number) => {
        setIsLoading(true);
        try {
            const res = await petsApi.delete(id.toString());
            if (res.success) {
                await loadPets();
                setSelectedPet(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedPet) {
        return (
            <View style={styles.detailContainer}>
                <View style={styles.heroContainer}>
                    <Image source={{ uri: selectedPet.image }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />
                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedPet(null);
                        }}
                        style={StyleSheet.flatten([styles.detailBackBtn, { top: Math.max(insets.top, 20) + 10 }])}
                    >
                        <ArrowLeft size={20} color="#1A1612" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.petCardDetailed}>
                        <View style={styles.petCardHeader}>
                            <View>
                                <View style={styles.nameRow}>
                                    <Text style={styles.detailPetName}>{selectedPet.name}</Text>
                                    <View style={StyleSheet.flatten([styles.genderTag, selectedPet.gender === 'Male' ? styles.maleTag : styles.femaleTag])}>
                                        <Text style={StyleSheet.flatten([styles.genderSymbol, selectedPet.gender === 'Male' ? styles.maleText : styles.femaleText])}>
                                            {selectedPet.gender === 'Male' ? '♂' : '♀'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.detailPetBreed}>{selectedPet.breed}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity 
                                    style={styles.editIconBtn}
                                    onPress={() => {
                                        setFormData({
                                            name: selectedPet.name,
                                            type: selectedPet.type,
                                            breed: selectedPet.breed,
                                            age: selectedPet.age,
                                            weight: selectedPet.weight?.replace(' kg', '') || '',
                                            gender: selectedPet.gender,
                                            image: selectedPet.image,
                                            hasInsurance: selectedPet.hasInsurance,
                                            isAggressive: selectedPet.isAggressive,
                                        });
                                        setIsAdding(true);
                                        setSelectedPet(null);
                                    }}
                                >
                                    <Edit2 size={16} color="#7A5540" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={StyleSheet.flatten([styles.editIconBtn, { backgroundColor: '#FEE2E2' }])}
                                    onPress={() => handleDelete(selectedPet.id)}
                                >
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <View style={StyleSheet.flatten([styles.statIconBox, { backgroundColor: '#E0F5F0' }])}>
                                    <Calendar size={16} color="#1D9E86" />
                                </View>
                                <View>
                                    <Text style={styles.statItemLabel}>AGE</Text>
                                    <Text style={styles.statItemValue}>{selectedPet.age}</Text>
                                </View>
                            </View>
                            <View style={styles.statItem}>
                                <View style={StyleSheet.flatten([styles.statIconBox, { backgroundColor: '#FFF3EC' }])}>
                                    <Weight size={16} color="#FF7A3D" />
                                </View>
                                <View>
                                    <Text style={styles.statItemLabel}>WEIGHT</Text>
                                    <Text style={styles.statItemValue}>{selectedPet.weight}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {(['info', 'health', 'docs'] as const).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setActiveTab(tab);
                                }}
                                style={StyleSheet.flatten([styles.tabBtn, activeTab === tab && styles.tabBtnActive])}
                            >
                                <Text style={StyleSheet.flatten([styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive])}>
                                    {tab.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {activeTab === 'info' && (
                        <View style={styles.tabContent}>
                            <View style={styles.recommendationCard}>
                                <Text style={styles.recoTitle}>Recommended for {selectedPet.breed}</Text>
                                <Text style={styles.recoText}>
                                    {selectedPet.breed === 'Golden Retriever'
                                        ? 'Golden Retrievers need regular exercise and joint supplements as they age. Brush their coat twice a week to prevent matting.'
                                        : 'Persian cats require daily grooming to prevent tangles and health checks for their flat faces. Keep them indoors for safety.'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {activeTab === 'health' && (
                        <View style={styles.tabContent}>
                            <View style={styles.sectionHeader}>
                                <Activity size={14} color="#FF7A3D" />
                                <Text style={styles.sectionTitle}>VACCINATION TRACKER</Text>
                            </View>
                            <View style={styles.vaccineList}>
                                {selectedPet.vaccinations.map(v => (
                                    <View key={v.id} style={styles.vaccineCard}>
                                        <View>
                                            <Text style={styles.vaccineName}>{v.name}</Text>
                                            <Text style={styles.vaccineDate}>{v.date}</Text>
                                        </View>
                                        <View style={StyleSheet.flatten([styles.statusBadge, v.status === 'Completed' ? styles.statusCompleted : styles.statusUpcoming])}>
                                            <Text style={StyleSheet.flatten([styles.statusText, v.status === 'Completed' ? styles.statusTextCompleted : styles.statusTextUpcoming])}>
                                                {v.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={StyleSheet.flatten([styles.sectionHeader, { marginTop: 32 }])}>
                                <Heart size={14} color="#ef4444" />
                                <Text style={styles.sectionTitle}>MEDICAL HISTORY</Text>
                            </View>
                            <View style={styles.historyTimeline}>
                                {selectedPet.medicalHistory.length > 0 ? selectedPet.medicalHistory.map(h => (
                                    <View key={h.id} style={styles.timelineItem}>
                                        <View style={styles.timelineDot} />
                                        <Text style={styles.timelineMeta}>{h.date.toUpperCase()} • {h.type.toUpperCase()}</Text>
                                        <Text style={styles.timelineNote}>{h.note}</Text>
                                    </View>
                                )) : (
                                    <Text style={styles.emptyText}>No records found.</Text>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'docs' && (
                        <View style={styles.docsGrid}>
                            <TouchableOpacity style={styles.uploadCard}>
                                <View style={styles.uploadIconBox}>
                                    <Plus size={24} color="#FF7A3D" />
                                </View>
                                <Text style={styles.uploadText}>UPLOAD DOC</Text>
                            </TouchableOpacity>
                            <View style={styles.docItem}>
                                <FileText size={32} color="#3b82f6" style={{ marginBottom: 12 }} />
                                <View>
                                    <Text style={styles.docName}>Birth_Cert.pdf</Text>
                                    <Text style={styles.docSize}>1.2 MB</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={StyleSheet.flatten([styles.listHeader, { paddingTop: Math.max(insets.top, 20) + 10 }])}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn}>
                            <ArrowLeft size={20} color="#1A1612" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Pets</Text>
                    </View>
                    {!isAdding && (
                        <TouchableOpacity
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setIsAdding(true);
                            }}
                            style={styles.addPetBtn}
                        >
                            <Plus size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
                    {isAdding ? (
                        <View style={styles.addForm}>
                            <TouchableOpacity 
                                style={styles.imageUpload}
                                onPress={() => {
                                    // Simulate image upload
                                    const seed = formData.name || 'default';
                                    const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}_${Date.now()}`;
                                    setFormData({ ...formData, image: newAvatar });
                                }}
                            >
                                <View style={styles.uploadPlaceholder}>
                                    {formData.image ? (
                                        <Image source={{ uri: formData.image }} style={styles.uploadedImg} />
                                    ) : (
                                        <>
                                            <Camera size={40} color="#cbd5e1" />
                                            <Text style={styles.uploadLabel}>GENERATE AVATAR</Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>PET TYPE</Text>
                                <View style={styles.typeRow}>
                                    {PET_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={StyleSheet.flatten([
                                                styles.typeCard,
                                                formData.type === type.id && styles.typeCardActive
                                            ])}
                                            onPress={() => setFormData({ ...formData, type: type.id as any, breed: '' })}
                                        >
                                            <type.icon size={24} color={formData.type === type.id ? 'white' : '#7A5540'} />
                                            <Text style={StyleSheet.flatten([
                                                styles.typeLabelText,
                                                formData.type === type.id && styles.typeLabelTextActive
                                            ])}>{type.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>PET NAME</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Bella"
                                    value={formData.name}
                                    onChangeText={(val) => setFormData({ ...formData, name: val })}
                                    placeholderTextColor="#cbd5e1"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>GENDER</Text>
                                <View style={styles.genderToggleRow}>
                                    <TouchableOpacity 
                                        style={StyleSheet.flatten([styles.genderToggle, formData.gender === 'Male' && styles.genderToggleActiveMale])}
                                        onPress={() => setFormData({ ...formData, gender: 'Male' })}
                                    >
                                        <Text style={StyleSheet.flatten([styles.genderToggleText, formData.gender === 'Male' && styles.genderToggleTextActive])}>BOY</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={StyleSheet.flatten([styles.genderToggle, formData.gender === 'Female' && styles.genderToggleActiveFemale])}
                                        onPress={() => setFormData({ ...formData, gender: 'Female' })}
                                    >
                                        <Text style={StyleSheet.flatten([styles.genderToggleText, formData.gender === 'Female' && styles.genderToggleTextActive])}>GIRL</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>BREED</Text>
                                <TouchableOpacity 
                                    style={styles.selectInput}
                                    onPress={() => setBreedModalVisible(true)}
                                >
                                    <Text style={StyleSheet.flatten([
                                        styles.selectInputText,
                                        !formData.breed && { color: '#cbd5e1' }
                                    ])}>
                                        {formData.breed || 'Select Breed'}
                                    </Text>
                                    <Search size={18} color="#cbd5e1" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>AGE</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ageRow}>
                                    {AGE_RANGES.map(range => (
                                        <TouchableOpacity
                                            key={range}
                                            style={StyleSheet.flatten([
                                                styles.ageChip,
                                                formData.age === range && styles.ageChipActive
                                            ])}
                                            onPress={() => setFormData({ ...formData, age: range })}
                                        >
                                            <Text style={StyleSheet.flatten([
                                                styles.ageChipText,
                                                formData.age === range && styles.ageChipTextActive
                                            ])}>{range}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>WEIGHT (OPTIONAL)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 12"
                                    keyboardType="numeric"
                                    value={formData.weight}
                                    onChangeText={(val) => setFormData({ ...formData, weight: val })}
                                    placeholderTextColor="#cbd5e1"
                                />
                            </View>

                            <View style={styles.switchGroup}>
                                <TouchableOpacity 
                                    style={styles.checkboxItem}
                                    onPress={() => setFormData({ ...formData, hasInsurance: !formData.hasInsurance })}
                                >
                                    <View style={StyleSheet.flatten([
                                        styles.checkbox,
                                        formData.hasInsurance && styles.checkboxActive
                                    ])}>
                                        {formData.hasInsurance && <Check size={14} color="white" strokeWidth={4} />}
                                    </View>
                                    <View style={styles.switchLabelCol}>
                                        <Text style={styles.switchTitle}>Insurance Coverage</Text>
                                        <Text style={styles.switchSub}>Does your pet have health insurance?</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.checkboxItem}
                                    onPress={() => setFormData({ ...formData, isAggressive: !formData.isAggressive })}
                                >
                                    <View style={StyleSheet.flatten([
                                        styles.checkbox,
                                        formData.isAggressive && styles.checkboxActive
                                    ])}>
                                        {formData.isAggressive && <Check size={14} color="white" strokeWidth={4} />}
                                    </View>
                                    <View style={styles.switchLabelCol}>
                                        <Text style={styles.switchTitle}>Aggressive Behavior</Text>
                                        <Text style={styles.switchSub}>Does your pet show aggression to others?</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formButtons}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setIsAdding(false);
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                    <Text style={styles.saveBtnText}>SAVE PET</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.petList}>
                            {pets.map((pet) => (
                                <TouchableOpacity
                                    key={pet.id}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setSelectedPet(pet);
                                    }}
                                    style={styles.petListItem}
                                >
                                    <View style={styles.listAvatarWrapper}>
                                        <Image source={{ uri: pet.image }} style={styles.listAvatar} />
                                        <View style={styles.avatarOverlay} />
                                    </View>
                                    <View style={styles.listInfo}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.listPetName}>{pet.name}</Text>
                                            <View style={StyleSheet.flatten([styles.genderLabel, pet.gender === 'Male' ? styles.maleLabel : styles.femaleLabel])}>
                                                <Text style={StyleSheet.flatten([styles.genderLabelText, pet.gender === 'Male' ? styles.maleText : styles.femaleText])}>
                                                    {pet.gender === 'Male' ? 'BOY' : 'GIRL'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.listPetBreed}>{pet.breed}</Text>
                                        <View style={styles.listMeta}>
                                            <View style={styles.metaBadge}>
                                                <Text style={styles.metaBadgeText}>{(pet.age || 'N/A').toString().toUpperCase()}</Text>
                                            </View>
                                            <View style={styles.metaBadge}>
                                                <Text style={styles.metaBadgeText}>{(pet.weight || 'N/A').toString().toUpperCase()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <ChevronRight size={20} color="#cbd5e1" />
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={styles.addAnotherBtn}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setIsAdding(true);
                                }}
                            >
                                <View style={styles.plusBox}>
                                    <Plus size={24} color="#7A5540" />
                                </View>
                                <Text style={styles.addAnotherText}>ADD ANOTHER PET</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Breed Selection Modal */}
                <Modal
                    visible={breedModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setBreedModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Breed</Text>
                                <TouchableOpacity onPress={() => setBreedModalVisible(false)}>
                                    <X size={24} color="#1A1612" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.modalSearchBox}>
                                <Search size={20} color="#cbd5e1" />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="Search breeds..."
                                    value={breedSearch}
                                    onChangeText={setBreedSearch}
                                    placeholderTextColor="#cbd5e1"
                                />
                            </View>

                            <FlatList
                                data={BREEDS[formData.type].filter(b => b.toLowerCase().includes(breedSearch.toLowerCase()))}
                                keyExtractor={item => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.breedItem}
                                        onPress={() => {
                                            setFormData({ ...formData, breed: item });
                                            setBreedModalVisible(false);
                                            setBreedSearch('');
                                        }}
                                    >
                                        <Text style={styles.breedItemText}>{item}</Text>
                                        {formData.breed === item && <Check size={18} color="#FF7A3D" />}
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 40 }}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </View>
                </Modal>
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
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#F5E6D8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    addPetBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FF7A3D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF7A3D',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 15,
        elevation: 4,
    },
    mainScroll: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    addForm: {
        backgroundColor: 'white',
        borderRadius: 40,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F5E6D8',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
    },
    imageUpload: {
        alignSelf: 'center',
        marginBottom: 32,
    },
    uploadPlaceholder: {
        width: 112,
        height: 112,
        borderRadius: 40,
        backgroundColor: '#FFF9F5',
        borderWidth: 2,
        borderColor: '#DEC9B5',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    uploadLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#B09080',
        letterSpacing: 1.5,
    },
    formGroup: {
        marginBottom: 20,
        gap: 8,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    input: {
        height: 56,
        backgroundColor: '#FFF9F5',
        borderRadius: 18,
        paddingHorizontal: 20,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#F5E6D8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1,
    },
    saveBtn: {
        flex: 1.5,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#FF7A3D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF7A3D',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
    },
    saveBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
    },
    petList: {
        gap: 16,
    },
    petListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 36,
        borderWidth: 1,
        borderColor: '#F5E6D8',
        gap: 16,
    },
    listAvatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    listAvatar: {
        width: '100%',
        height: '100%',
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    listInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    listPetName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    genderLabel: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    maleLabel: { backgroundColor: '#eff6ff' },
    femaleLabel: { backgroundColor: '#fdf2f8' },
    genderLabelText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    listPetBreed: {
        fontSize: 12,
        color: '#7A5540',
        fontWeight: '500',
        marginBottom: 8,
    },
    listMeta: {
        flexDirection: 'row',
        gap: 4,
    },
    metaBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFF9F5',
        borderRadius: 8,
    },
    metaBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 0.5,
    },
    addAnotherBtn: {
        height: 100,
        backgroundColor: 'white',
        borderRadius: 36,
        borderWidth: 2,
        borderColor: '#F5E6D8',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    plusBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF9F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addAnotherText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1.5,
    },
    detailContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    heroContainer: {
        height: height * 0.4,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    detailBackBtn: {
        position: 'absolute',
        left: 24,
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
    },
    detailScroll: {
        paddingBottom: 40,
    },
    petCardDetailed: {
        backgroundColor: 'white',
        marginTop: -40,
        marginHorizontal: 24,
        borderRadius: 40,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 15 },
        shadowRadius: 25,
        elevation: 8,
        marginBottom: 24,
    },
    petCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    detailPetName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    genderTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
    },
    maleTag: { backgroundColor: '#eff6ff' },
    femaleTag: { backgroundColor: '#fdf2f8' },
    maleText: { color: '#3b82f6' },
    femaleText: { color: '#ec4899' },
    genderSymbol: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    switchSub: {
        fontSize: 11,
        color: '#7A5540',
        fontWeight: '500',
        marginTop: 2,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    typeCard: {
        flex: 1,
        height: 80,
        backgroundColor: '#FFF9F5',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#F5E6D8',
    },
    typeCardActive: {
        backgroundColor: '#FF7A3D',
        borderColor: '#FF7A3D',
    },
    typeLabelText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#7A5540',
    },
    typeLabelTextActive: {
        color: 'white',
    },
    selectInput: {
        height: 56,
        backgroundColor: '#FFF9F5',
        borderRadius: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#F5E6D8',
    },
    selectInputText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    ageRow: {
        gap: 10,
        paddingVertical: 4,
    },
    ageChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFF9F5',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#F5E6D8',
    },
    ageChipActive: {
        backgroundColor: '#FF7A3D',
        borderColor: '#FF7A3D',
    },
    ageChipText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#7A5540',
    },
    ageChipTextActive: {
        color: 'white',
    },
    genderToggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    genderToggle: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderToggleActiveMale: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    genderToggleActiveFemale: {
        borderColor: '#EC4899',
        backgroundColor: '#FDF2F8',
    },
    genderToggleText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    genderToggleTextActive: {
        color: '#1A1612',
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 4,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#F5E6D8',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    checkboxActive: {
        backgroundColor: '#FF7A3D',
        borderColor: '#FF7A3D',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        height: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1A1612',
    },
    modalSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9F5',
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#F5E6D8',
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    breedItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FFF9F5',
    },
    breedItemText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1612',
    },
    detailPetBreed: {
        fontSize: 14,
        color: '#7A5540',
        fontWeight: '500',
        marginTop: 4,
    },
    editIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF9F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#FFF9F5',
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9F5',
        padding: 12,
        borderRadius: 20,
        gap: 12,
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statItemLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1,
    },
    statItemValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1A1612',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 24,
        backgroundColor: '#F5E6D8',
        padding: 4,
        borderRadius: 20,
        marginBottom: 24,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 16,
    },
    tabBtnActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
    },
    tabBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1,
    },
    tabBtnTextActive: {
        color: '#FF7A3D',
    },
    tabContent: {
        paddingHorizontal: 24,
    },
    recommendationCard: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#F5E6D8',
        gap: 12,
    },
    recoTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1A1612',
        letterSpacing: 1,
    },
    recoText: {
        fontSize: 13,
        color: '#7A5540',
        lineHeight: 20,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1.5,
    },
    vaccineList: {
        gap: 12,
    },
    vaccineCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    vaccineName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 4,
    },
    vaccineDate: {
        fontSize: 11,
        color: '#7A5540',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusCompleted: { backgroundColor: '#FFF3EC' },
    statusUpcoming: { backgroundColor: '#E0F5F0' },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statusTextCompleted: { color: '#FF7A3D' },
    statusTextUpcoming: { color: '#1D9E86' },
    historyTimeline: {
        paddingLeft: 16,
        gap: 24,
    },
    timelineItem: {
        position: 'relative',
        paddingLeft: 24,
        borderLeftWidth: 2,
        borderLeftColor: '#F5E6D8',
        paddingBottom: 8,
    },
    timelineDot: {
        position: 'absolute',
        left: -6,
        top: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#cbd5e1',
        borderWidth: 2,
        borderColor: 'white',
    },
    timelineMeta: {
        fontSize: 9,
        fontWeight: '900',
        color: '#B09080',
        letterSpacing: 1,
        marginBottom: 4,
    },
    timelineNote: {
        fontSize: 13,
        color: '#1A1612',
        fontWeight: '500',
        lineHeight: 18,
    },
    docsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
    },
    uploadCard: {
        flex: 1,
        height: 140,
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#F5E6D8',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    uploadIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFF3EC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7A5540',
        letterSpacing: 1.5,
    },
    docItem: {
        flex: 1,
        height: 140,
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#F5E6D8',
        padding: 20,
        justifyContent: 'space-between',
    },
    docName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 4,
    },
    docSize: {
        fontSize: 10,
        fontWeight: '900',
        color: '#B09080',
        letterSpacing: 0.5,
    },
    emptyText: {
        fontSize: 12,
        color: '#B09080',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
