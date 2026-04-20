import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import {
    MapPin,
    Plus,
    Trash2,
    Edit2,
    ChevronLeft,
    Home,
    Briefcase,
    Map as MapIcon,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

interface Address {
    id: string;
    type: 'home' | 'work' | 'other';
    label: string;
    address: string;
    isDefault?: boolean;
}

export default function Addresses({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [addresses, setAddresses] = useState<Address[]>([]);

    React.useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            const saved = await AsyncStorage.getItem('@petcare_addresses');
            if (saved) {
                setAddresses(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load addresses', e);
        }
    };

    const saveAddresses = async (newAddresses: Address[]) => {
        try {
            setAddresses(newAddresses);
            await AsyncStorage.setItem('@petcare_addresses', JSON.stringify(newAddresses));
        } catch (e) {
            console.error('Failed to save addresses', e);
        }
    };

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [type, setType] = useState<'home' | 'work' | 'other'>('home');
    const [label, setLabel] = useState('');
    const [addressValue, setAddressValue] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const handleUseCurrentLocation = async () => {
        setIsLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // Use Nominatim (OSM) as a free alternative to the removed Expo Geocoding API
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
                {
                    headers: {
                        'User-Agent': 'PawberPetCareApp' // Required by Nominatim policy
                    }
                }
            );
            const data = await response.json();

            if (data && data.address) {
                const {
                    road,
                    suburb,
                    city,
                    town,
                    village,
                    state,
                    postcode,
                    house_number
                } = data.address;

                const cityName = city || town || village || '';
                const mainAddr = [house_number, road].filter(Boolean).join(' ');
                const secondary = [suburb, cityName].filter(Boolean).join(', ');
                
                const addrStr = [mainAddr, secondary, state, postcode].filter(Boolean).join(', ');
                
                setAddressValue(addrStr);
                if (!label) setLabel(suburb || cityName || '');
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Could not fetch your current location.');
        } finally {
            setIsLocating(false);
        }
    };

    const handleDelete = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        saveAddresses(addresses.filter(a => a.id !== id));
    };

    const resetForm = () => {
        setType('home');
        setLabel('');
        setAddressValue('');
        setEditingId(null);
        setIsAdding(false);
    };

    const handleEdit = (addr: Address) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setType(addr.type);
        setLabel(addr.label);
        setAddressValue(addr.address);
        setEditingId(addr.id);
        setIsAdding(true);
    };

    const handleSubmit = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (editingId) {
            saveAddresses(addresses.map(a => a.id === editingId ? { ...a, type, label, address: addressValue } : a));
        } else {
            const newAddr: Address = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                label: label || (type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'Other'),
                address: addressValue,
                isDefault: addresses.length === 0,
            };
            saveAddresses([...addresses, newAddr]);
        }
        resetForm();
    };

    const getIcon = (addrType: string) => {
        switch (addrType) {
            case 'home': return Home;
            case 'work': return Briefcase;
            default: return MapIcon;
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10, borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={() => isAdding ? resetForm() : navigation.goBack()}
                        style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>My Addresses</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {!isAdding ? (
                        <View style={styles.listContainer}>
                            {addresses.map((addr) => {
                                const Icon = getIcon(addr.type);
                                return (
                                    <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                                            <Icon size={20} color={colors.primary} />
                                        </View>
                                        <View style={styles.addressInfo}>
                                            <View style={styles.labelRow}>
                                                <Text style={[styles.addressLabel, { color: colors.text }]}>{addr.label}</Text>
                                                {addr.isDefault && (
                                                    <View style={[styles.defaultBadge, { backgroundColor: colors.primaryLight }]}>
                                                        <Text style={[styles.defaultText, { color: colors.primary }]}>DEFAULT</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.addressText, { color: colors.textSecondary }]}>{addr.address}</Text>

                                            <View style={styles.cardActions}>
                                                <TouchableOpacity
                                                    onPress={() => handleEdit(addr)}
                                                    style={styles.actionBtn}
                                                >
                                                    <Edit2 size={12} color={colors.primary} />
                                                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>EDIT</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDelete(addr.id)}
                                                    style={[styles.actionBtn, styles.deleteBtn]}
                                                >
                                                    <Trash2 size={12} color={colors.danger} />
                                                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>DELETE</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}

                            <TouchableOpacity
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setIsAdding(true);
                                }}
                                style={[styles.addNewBtn, { borderColor: colors.border }]}
                            >
                                <Plus size={20} color={colors.textSecondary} />
                                <Text style={[styles.addNewText, { color: colors.textSecondary }]}>Add New Address</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.formTitle, { color: colors.text }]}>
                                {editingId ? 'Edit Address' : 'Add New Address'}
                            </Text>

                            <View style={styles.typeSelector}>
                                {(['home', 'work', 'other'] as const).map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setType(t)}
                                        style={[styles.typeBtn, type === t && styles.typeBtnActive, { backgroundColor: colors.background, borderColor: type === t ? colors.primary : 'transparent' }]}
                                    >
                                        <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive, { color: type === t ? colors.primary : colors.textSecondary }]}>
                                            {t.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Location Shortcut */}
                            {!editingId && (
                                <TouchableOpacity 
                                    style={[styles.locationShortcut, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '22' }]}
                                    onPress={handleUseCurrentLocation}
                                    disabled={isLocating}
                                >
                                    {isLocating ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <MapPin size={18} color={colors.primary} />
                                    )}
                                    <Text style={[styles.locationShortcutText, { color: colors.primary }]}>
                                        {isLocating ? 'Locating...' : 'Use Current Location'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>LABEL (OPTIONAL)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    placeholder="e.g. Grandma's House"
                                    value={label}
                                    onChangeText={setLabel}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>FULL ADDRESS</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                                    placeholder="Enter street name, building, city..."
                                    value={addressValue}
                                    onChangeText={setAddressValue}
                                    multiline
                                    numberOfLines={4}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.formFooter}>
                                <TouchableOpacity
                                    onPress={resetForm}
                                    style={[styles.cancelActionBtn, { backgroundColor: colors.surfaceSecondary }]}
                                >
                                    <Text style={[styles.cancelActionText, { color: colors.textSecondary }]}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    style={[styles.saveActionBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                                >
                                    <Text style={styles.saveActionText}>
                                        {editingId ? 'SAVE CHANGES' : 'SAVE ADDRESS'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
    },
    locationShortcut: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    locationShortcutText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        gap: 16,
    },
    backBtn: {
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    listContainer: {
        gap: 16,
    },
    addressCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressInfo: {
        flex: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    addressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    defaultBadge: {
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    defaultText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 0.5,
    },
    addressText: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 16,
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deleteBtn: {
        opacity: 0.9,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 1,
    },
    deleteBtnText: {
        color: '#ef4444',
    },
    addNewBtn: {
        height: 60,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    addNewText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 24,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    typeBtn: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeBtnActive: {
        backgroundColor: '#f0fdfa',
        borderColor: '#14b8a6',
    },
    typeBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
    },
    typeBtnTextActive: {
        color: '#14b8a6',
    },
    inputGroup: {
        marginBottom: 20,
        gap: 8,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    input: {
        height: 56,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
        color: '#0f172a',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    formFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    cancelActionBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelActionText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
    },
    saveActionBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#14b8a6',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
    },
    saveActionText: {
        fontSize: 12,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
    },
});
