import React, { useState, useEffect, useRef } from 'react';
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
    KeyboardAvoidingView,
    Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
    Search,
    Crosshair,
    Check,
    Navigation,
    Info,
    ArrowLeft,
    X,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// Brand color from screenshot
const BRAND_PINK = '#FF1B5E';

interface Address {
    id: string;
    type: 'home' | 'work' | 'other';
    label: string;
    address: string;
    details?: {
        houseNo: string;
        building: string;
        landmark: string;
    };
    isDefault?: boolean;
    latitude?: number;
    longitude?: number;
}

type ViewState = 'list' | 'map-picker' | 'details-form';

export default function Addresses({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [viewState, setViewState] = useState<ViewState>('list');
    const [addresses, setAddresses] = useState<Address[]>([]);

    // Map State
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState({
        latitude: 19.0760,
        longitude: 72.8777,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });
    const [isLocating, setIsLocating] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [selectedFullAddress, setSelectedFullAddress] = useState('');
    const [locationSummary, setLocationSummary] = useState({ main: '', sub: '' });

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Form State
    const [type, setType] = useState<'home' | 'work' | 'other'>('home');
    const [label, setLabel] = useState('');
    const [houseNo, setHouseNo] = useState('');
    const [building, setBuilding] = useState('');
    const [landmark, setLandmark] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadAddresses();
        getUserLocationInitial();
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

    const getUserLocationInitial = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const newRegion = {
                    ...region,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setRegion(newRegion);
                reverseGeocode(location.coords.latitude, location.coords.longitude);
            }
        } catch (e) {}
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        setIsReverseGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
                { headers: { 'User-Agent': 'PawberPetCareApp' } }
            );
            const data = await response.json();
            if (data && data.address) {
                const { road, suburb, city, town, village, house_number, state, postcode } = data.address;
                const main = road || suburb || city || 'Unknown Road';
                const cityName = city || town || village || '';
                const sub = [suburb, cityName, state, postcode].filter(Boolean).join(', ');
                
                const full = [house_number, road, suburb, cityName, state, postcode].filter(Boolean).join(', ');
                
                setLocationSummary({ main, sub });
                setSelectedFullAddress(full);
            }
        } catch (error) {
            console.error('Reverse Geocode Error:', error);
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                { headers: { 'User-Agent': 'PawberPetCareApp' } }
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (e) {}
    };

    const selectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const newRegion = { ...region, latitude: lat, longitude: lon };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        setSearchQuery('');
        setSearchResults([]);
        reverseGeocode(lat, lon);
    };

    const handleUseMyLocation = async () => {
        setIsLocating(true);
        try {
            const location = await Location.getCurrentPositionAsync({});
            const newRegion = { ...region, latitude: location.coords.latitude, longitude: location.coords.longitude };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            reverseGeocode(location.coords.latitude, location.coords.longitude);
        } finally {
            setIsLocating(false);
        }
    };

    const handleRegionChangeComplete = (newRegion: any) => {
        setRegion(newRegion);
        reverseGeocode(newRegion.latitude, newRegion.longitude);
    };

    const resetFlow = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewState('list');
        setEditingId(null);
        setHouseNo('');
        setBuilding('');
        setLandmark('');
        setLabel('');
    };

    const handleSubmit = () => {
        const fullAddress = [houseNo, building, selectedFullAddress].filter(Boolean).join(', ');
        
        if (editingId) {
            saveAddresses(addresses.map(a => a.id === editingId ? { 
                ...a, 
                type, 
                label: label || (type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'Other'),
                address: fullAddress,
                details: { houseNo, building, landmark }
            } : a));
        } else {
            const newAddr: Address = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                label: label || (type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'Other'),
                address: fullAddress,
                details: { houseNo, building, landmark },
                isDefault: addresses.length === 0,
                latitude: region.latitude,
                longitude: region.longitude
            };
            saveAddresses([...addresses, newAddr]);
        }
        resetFlow();
    };

    const renderHeader = (title: string, backAction: () => void) => (
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10, backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={backAction} style={styles.backBtn}>
                <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        </View>
    );

    // --- VIEW 1: ADDRESS LIST ---
    const renderList = () => (
        <View style={styles.flexOne}>
            {renderHeader("My Addresses", () => navigation.goBack())}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.listContainer}>
                    {addresses.map((addr) => (
                        <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                                {addr.type === 'home' ? <Home size={20} color={colors.primary} /> : 
                                 addr.type === 'work' ? <Briefcase size={20} color={colors.primary} /> : 
                                 <MapIcon size={20} color={colors.primary} />}
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
                                <Text style={[styles.addressTextList, { color: colors.textSecondary }]} numberOfLines={2}>{addr.address}</Text>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity onPress={() => {
                                        setEditingId(addr.id);
                                        setType(addr.type);
                                        setLabel(addr.label);
                                        setHouseNo(addr.details?.houseNo || '');
                                        setBuilding(addr.details?.building || '');
                                        setLandmark(addr.details?.landmark || '');
                                        // Navigate to map to confirm location or skip to details
                                        setViewState('map-picker');
                                    }} style={styles.actionBtn}>
                                        <Edit2 size={12} color={colors.primary} />
                                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>EDIT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        saveAddresses(addresses.filter(a => a.id !== addr.id));
                                    }} style={styles.actionBtn}>
                                        <Trash2 size={12} color={colors.danger} />
                                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>DELETE</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setViewState('map-picker');
                        }}
                        style={[styles.addNewBtn, { borderColor: colors.border }]}
                    >
                        <Plus size={20} color={colors.primary} />
                        <Text style={[styles.addNewText, { color: colors.primary }]}>Add New Address</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    // --- VIEW 2: MAP PICKER ---
    const renderMapPicker = () => (
        <View style={styles.flexOne}>
            <View style={styles.absoluteHeader}>
                <View style={[styles.headerFloating, { marginTop: Math.max(insets.top, 20) }]}>
                    <TouchableOpacity onPress={() => setViewState('list')} style={styles.backBtnRound}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleMap}>Select Your Location</Text>
                </View>

                {/* Search Overlay */}
                <View style={styles.searchOverlay}>
                    <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
                        <Search size={18} color={colors.textMuted} />
                        <TextInput
                            placeholder="Search for apartment, street name..."
                            style={[styles.searchField, { color: colors.text }]}
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {searchResults.length > 0 && (
                        <View style={[styles.searchResultsContainer, { backgroundColor: colors.background }]}>
                            {searchResults.map((res: any, idx: number) => (
                                <TouchableOpacity 
                                    key={idx} 
                                    style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                                    onPress={() => selectSearchResult(res)}
                                >
                                    <MapPin size={16} color={colors.textMuted} />
                                    <Text style={[styles.searchResultText, { color: colors.text }]} numberOfLines={1}>{res.display_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation={true}
                showsMyLocationButton={false}
                provider={PROVIDER_GOOGLE}
            />

            {/* Fixed Center Pin */}
            <View style={styles.centerPinContainer} pointerEvents="none">
                <View style={styles.pinTooltip}>
                    <Text style={styles.pinTooltipText}>Order will be delivered here</Text>
                    <Text style={styles.pinTooltipSubtext}>Place the pin to your exact location</Text>
                </View>
                <View style={styles.pinIconContainer}>
                    <View style={styles.pinDot} />
                    <View style={styles.pinLine} />
                    <MapPin size={32} color={BRAND_PINK} fill={BRAND_PINK} fillOpacity={0.4} />
                </View>
            </View>

            {/* Floating Actions */}
            <TouchableOpacity 
                style={[styles.myLocationBtn, { bottom: 180 }]}
                onPress={handleUseMyLocation}
            >
                {isLocating ? <ActivityIndicator color={BRAND_PINK} /> : <Crosshair size={22} color={BRAND_PINK} />}
            </TouchableOpacity>

            {/* Bottom Address Summary */}
            <View style={[styles.mapFooter, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
                <View style={styles.locationInfo}>
                    <Text style={[styles.locationMain, { color: colors.text }]}>
                        {isReverseGeocoding ? 'Fetching address...' : locationSummary.main}
                    </Text>
                    <Text style={[styles.locationSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {locationSummary.sub}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.confirmBtn}
                    onPress={() => setViewState('details-form')}
                >
                    <Text style={styles.confirmBtnText}>Confirm Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // --- VIEW 3: DETAILS FORM ---
    const renderForm = () => (
        <View style={styles.flexOne}>
            {renderHeader("Add Address Details", () => setViewState('map-picker'))}
            <ScrollView style={styles.flexOne} showsVerticalScrollIndicator={false}>
                {/* Map Preview */}
                <View style={styles.mapPreviewContainer}>
                    <MapView
                        style={styles.mapPreview}
                        region={region}
                        liteMode={true}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        <Marker coordinate={region} pinColor={BRAND_PINK} />
                    </MapView>
                    <View style={styles.previewAddressRow}>
                        <View style={styles.flexOne}>
                            <Text style={[styles.previewMain, { color: colors.text }]}>{locationSummary.main}</Text>
                            <Text style={[styles.previewSub, { color: colors.textSecondary }]} numberOfLines={1}>{locationSummary.sub}</Text>
                        </View>
                        <TouchableOpacity style={styles.changeBtn} onPress={() => setViewState('map-picker')}>
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.formSectionLabel}>Add Address</Text>
                    <View style={styles.inputStack}>
                        <View style={styles.formInputGroup}>
                            <Text style={styles.fieldLabel}>House No. & Floor *</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface }]}
                                value={houseNo}
                                onChangeText={setHouseNo}
                                placeholder="e.g. 402, 4th Floor"
                            />
                        </View>
                        <View style={styles.formInputGroup}>
                            <Text style={styles.fieldLabel}>Building & Block No. (Optional)</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface }]}
                                value={building}
                                onChangeText={setBuilding}
                                placeholder="e.g. Sunrise Apartments"
                            />
                        </View>
                        <View style={styles.formInputGroup}>
                            <Text style={styles.fieldLabel}>Landmark & Area Name (Optional)</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface }]}
                                value={landmark}
                                onChangeText={setLandmark}
                                placeholder="e.g. Near St. Pauls School"
                            />
                        </View>
                    </View>

                    <Text style={[styles.formSectionLabel, { marginTop: 30 }]}>Add Address Label</Text>
                    <View style={styles.labelChips}>
                        {(['home', 'work', 'other'] as const).map((chip) => (
                            <TouchableOpacity 
                                key={chip}
                                style={[
                                    styles.chip, 
                                    type === chip && styles.chipActive,
                                    { borderColor: type === chip ? BRAND_PINK : colors.border }
                                ]}
                                onPress={() => setType(chip)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    type === chip && styles.chipTextActive,
                                    { color: type === chip ? BRAND_PINK : colors.textSecondary }
                                ]}>
                                    {chip.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {type === 'other' && (
                        <TextInput
                            style={[styles.formInput, { marginTop: 12, backgroundColor: colors.surface }]}
                            placeholder="e.g. Grandma's House"
                            value={label}
                            onChangeText={setLabel}
                        />
                    )}

                    <TouchableOpacity 
                        style={[
                            styles.saveBtnBig, 
                            { 
                                marginTop: 40, 
                                marginBottom: 50,
                                backgroundColor: houseNo ? BRAND_PINK : '#f3f4f6' 
                            }
                        ]}
                        onPress={handleSubmit}
                        disabled={!houseNo}
                    >
                        <Text style={[
                            styles.saveBtnTextBig, 
                            { color: houseNo ? 'white' : '#9ca3af' }
                        ]}>SAVE ADDRESS</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            {viewState === 'list' && renderList()}
            {viewState === 'map-picker' && renderMapPicker()}
            {viewState === 'details-form' && renderForm()}
        </View>
    );
}

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    container: { flex: 1, backgroundColor: 'white' },
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
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 24 },
    listContainer: { gap: 16 },
    addressCard: {
        borderRadius: 24, padding: 20, borderWidth: 1, flexDirection: 'row', gap: 16,
        shadowColor: '#000', shadowOpacity: 0.02, shadowOffset: { width: 0, height: 4 },
    },
    iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    addressInfo: { flex: 1 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    addressLabel: { fontSize: 16, fontWeight: 'bold' },
    defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    defaultText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    addressTextList: { fontSize: 13, lineHeight: 18, marginBottom: 16, fontWeight: '500' },
    cardActions: { flexDirection: 'row', gap: 20 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    addNewBtn: {
        height: 60, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8,
    },
    addNewText: { fontSize: 14, fontWeight: 'bold' },

    // Map Specific
    absoluteHeader: { position: 'absolute', top: 0, width: '100%', zIndex: 10 },
    headerFloating: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
    backBtnRound: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 4 },
    headerTitleMap: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    searchOverlay: { paddingHorizontal: 24, marginTop: 16 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56,
        borderRadius: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
    },
    searchField: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '500' },
    searchResultsContainer: { marginTop: 4, borderRadius: 12, overflow: 'hidden', elevation: 8 },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    searchResultText: { marginLeft: 12, fontSize: 13, fontWeight: '500' },

    map: { flex: 1 },
    centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginTop: -60, marginLeft: -100, width: 200, alignItems: 'center' },
    pinTooltip: { 
        backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, 
        alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8
    },
    pinTooltipText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    pinTooltipSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
    pinIconContainer: { marginTop: 4, alignItems: 'center' },
    pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)', marginBottom: 2 },
    pinLine: { width: 2, height: 15, backgroundColor: BRAND_PINK },
    
    myLocationBtn: { 
        position: 'absolute', right: 24, width: 50, height: 50, borderRadius: 25, 
        backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 6 
    },
    mapFooter: { 
        position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', 
        borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, elevation: 20,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20
    },
    locationInfo: { marginBottom: 20 },
    locationMain: { fontSize: 18, fontWeight: 'bold' },
    locationSub: { fontSize: 13, marginTop: 4 },
    confirmBtn: { backgroundColor: BRAND_PINK, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    // Form Specific
    mapPreviewContainer: { padding: 24, backgroundColor: '#f8fafc' },
    mapPreview: { height: 160, borderRadius: 20, marginBottom: 16 },
    previewAddressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    previewMain: { fontSize: 16, fontWeight: 'bold' },
    previewSub: { fontSize: 12, marginTop: 2 },
    changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
    changeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
    formSection: { padding: 24 },
    formSectionLabel: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 16 },
    inputStack: { gap: 20 },
    formInputGroup: { gap: 8 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    formInput: { height: 56, borderRadius: 12, paddingHorizontal: 16, fontSize: 14, fontWeight: '500' },
    labelChips: { flexDirection: 'row', gap: 12 },
    chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, pointerEvents: 'auto' },
    chipActive: { backgroundColor: '#fff1f2' },
    chipText: { fontSize: 12, fontWeight: '800' },
    chipTextActive: { color: BRAND_PINK },
    saveBtnBig: { backgroundColor: '#f3f4f6', height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    saveBtnTextBig: { color: '#9ca3af', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
