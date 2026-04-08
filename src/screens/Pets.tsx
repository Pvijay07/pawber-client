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
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
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
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

interface Pet {
    id: number;
    name: string;
    breed: string;
    age: string;
    weight: string;
    gender: 'Male' | 'Female';
    image: string;
    medicalHistory: { id: string, date: string, type: string, note: string }[];
    vaccinations: { id: string, name: string, date: string, status: 'Completed' | 'Upcoming' }[];
}

interface PetsProps {
    navigation: any;
}

export default function Pets({ navigation }: PetsProps) {
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'health' | 'docs'>('info');

    const [pets, setPets] = useState<Pet[]>([
        {
            id: 1,
            name: 'Max',
            breed: 'Golden Retriever',
            age: '2 Years',
            weight: '28 kg',
            gender: 'Male',
            image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400&h=400',
            medicalHistory: [
                { id: '1', date: 'Oct 12, 2023', type: 'Checkup', note: 'Healthy weight and coat.' },
                { id: '2', date: 'Aug 05, 2023', type: 'Fever', note: 'Recovered after 3 days of rest.' }
            ],
            vaccinations: [
                { id: '1', name: 'Rabies', date: 'Jan 2023', status: 'Completed' },
                { id: '2', name: 'DHPP', date: 'Dec 2023', status: 'Upcoming' }
            ]
        },
        {
            id: 2,
            name: 'Luna',
            breed: 'Persian Cat',
            age: '1 Year',
            weight: '4 kg',
            gender: 'Female',
            image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400&h=400',
            medicalHistory: [],
            vaccinations: [
                { id: '1', name: 'FVRCP', date: 'Mar 2023', status: 'Completed' }
            ]
        }
    ]);

    const [formData, setFormData] = useState({
        name: '',
        breed: '',
        age: '',
        weight: '',
        gender: 'Male' as 'Male' | 'Female',
        image: '',
    });

    const handleSave = () => {
        const newPet: Pet = {
            id: Date.now(),
            ...formData,
            image: formData.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200&h=200',
            medicalHistory: [],
            vaccinations: []
        };
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setPets([...pets, newPet]);
        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({ name: '', breed: '', age: '', weight: '', gender: 'Male', image: '' });
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
                        style={styles.detailBackBtn}
                    >
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.petCardDetailed}>
                        <View style={styles.petCardHeader}>
                            <View>
                                <View style={styles.nameRow}>
                                    <Text style={styles.detailPetName}>{selectedPet.name}</Text>
                                    <View style={[styles.genderTag, selectedPet.gender === 'Male' ? styles.maleTag : styles.femaleTag]}>
                                        <Text style={[styles.genderSymbol, selectedPet.gender === 'Male' ? styles.maleText : styles.femaleText]}>
                                            {selectedPet.gender === 'Male' ? '♂' : '♀'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.detailPetBreed}>{selectedPet.breed}</Text>
                            </View>
                            <TouchableOpacity style={styles.editIconBtn}>
                                <Edit2 size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconBox, { backgroundColor: '#fff7ed' }]}>
                                    <Calendar size={16} color="#f97316" />
                                </View>
                                <View>
                                    <Text style={styles.statItemLabel}>AGE</Text>
                                    <Text style={styles.statItemValue}>{selectedPet.age}</Text>
                                </View>
                            </View>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconBox, { backgroundColor: '#f0fdfa' }]}>
                                    <Weight size={16} color="#14b8a6" />
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
                                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                            >
                                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
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
                                <Activity size={14} color="#14b8a6" />
                                <Text style={styles.sectionTitle}>VACCINATION TRACKER</Text>
                            </View>
                            <View style={styles.vaccineList}>
                                {selectedPet.vaccinations.map(v => (
                                    <View key={v.id} style={styles.vaccineCard}>
                                        <View>
                                            <Text style={styles.vaccineName}>{v.name}</Text>
                                            <Text style={styles.vaccineDate}>{v.date}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, v.status === 'Completed' ? styles.statusCompleted : styles.statusUpcoming]}>
                                            <Text style={[styles.statusText, v.status === 'Completed' ? styles.statusTextCompleted : styles.statusTextUpcoming]}>
                                                {v.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
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
                                    <Plus size={24} color="#14b8a6" />
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
                <View style={styles.listHeader}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn}>
                            <ArrowLeft size={20} color="#0f172a" />
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
                            <TouchableOpacity style={styles.imageUpload}>
                                <View style={styles.uploadPlaceholder}>
                                    <Camera size={40} color="#cbd5e1" />
                                    <Text style={styles.uploadLabel}>PHOTO</Text>
                                </View>
                            </TouchableOpacity>

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
                                <Text style={styles.inputLabel}>BREED</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Golden Retriever"
                                    value={formData.breed}
                                    onChangeText={(val) => setFormData({ ...formData, breed: val })}
                                    placeholderTextColor="#cbd5e1"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>AGE</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="2 Years"
                                        value={formData.age}
                                        onChangeText={(val) => setFormData({ ...formData, age: val })}
                                        placeholderTextColor="#cbd5e1"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>WEIGHT</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="12 kg"
                                        value={formData.weight}
                                        onChangeText={(val) => setFormData({ ...formData, weight: val })}
                                        placeholderTextColor="#cbd5e1"
                                    />
                                </View>
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
                                            <View style={[styles.genderLabel, pet.gender === 'Male' ? styles.maleLabel : styles.femaleLabel]}>
                                                <Text style={[styles.genderLabelText, pet.gender === 'Male' ? styles.maleText : styles.femaleText]}>
                                                    {pet.gender === 'Male' ? 'BOY' : 'GIRL'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.listPetBreed}>{pet.breed}</Text>
                                        <View style={styles.listMeta}>
                                            <View style={styles.metaBadge}>
                                                <Text style={styles.metaBadgeText}>{pet.age.toUpperCase()}</Text>
                                            </View>
                                            <View style={styles.metaBadge}>
                                                <Text style={styles.metaBadgeText}>{pet.weight.toUpperCase()}</Text>
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
                                    <Plus size={24} color="#64748b" />
                                </View>
                                <Text style={styles.addAnotherText}>ADD ANOTHER PET</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
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
        paddingVertical: 20,
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
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    addPetBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#14b8a6',
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
        borderColor: '#f1f5f9',
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
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    uploadLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
    },
    formGroup: {
        marginBottom: 20,
        gap: 8,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    input: {
        height: 56,
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        paddingHorizontal: 20,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
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
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
    },
    saveBtn: {
        flex: 1.5,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#14b8a6',
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
        borderColor: '#f1f5f9',
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
        color: '#0f172a',
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
        color: '#64748b',
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
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    metaBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    addAnotherBtn: {
        height: 100,
        backgroundColor: 'white',
        borderRadius: 36,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    plusBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addAnotherText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748b',
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
        top: 50,
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
        color: '#0f172a',
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
    detailPetBreed: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 4,
    },
    editIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
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
        color: '#64748b',
        letterSpacing: 1,
    },
    statItemValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 24,
        backgroundColor: '#f1f5f9',
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
        color: '#64748b',
        letterSpacing: 1,
    },
    tabBtnTextActive: {
        color: '#14b8a6',
    },
    tabContent: {
        paddingHorizontal: 24,
    },
    recommendationCard: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    recoTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1,
    },
    recoText: {
        fontSize: 13,
        color: '#64748b',
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
        color: '#64748b',
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
        borderColor: '#f1f5f9',
    },
    vaccineName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    vaccineDate: {
        fontSize: 11,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusCompleted: { backgroundColor: '#f0fdfa' },
    statusUpcoming: { backgroundColor: '#fff7ed' },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statusTextCompleted: { color: '#14b8a6' },
    statusTextUpcoming: { color: '#f97316' },
    historyTimeline: {
        paddingLeft: 16,
        gap: 24,
    },
    timelineItem: {
        position: 'relative',
        paddingLeft: 24,
        borderLeftWidth: 2,
        borderLeftColor: '#f1f5f9',
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
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    timelineNote: {
        fontSize: 13,
        color: '#0f172a',
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
        borderColor: '#f1f5f9',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    uploadIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1.5,
    },
    docItem: {
        flex: 1,
        height: 140,
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 20,
        justifyContent: 'space-between',
    },
    docName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    docSize: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    emptyText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
