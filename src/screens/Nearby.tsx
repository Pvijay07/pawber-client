import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    
    Image,
    Dimensions,
    Animated,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    MapWrapper as MapView, 
    MapMarker as Marker, 
    PROVIDER_GOOGLE
} from '../components/common/MapViewWrapper';
import {
    Search,
    MapPin,
    Navigation,
    Star,
    Phone,
    Clock,
    ChevronRight,
    Filter
} from 'lucide-react-native';
import { providersApi } from '../services/providers.service';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'MapPin' },
    { id: 'vet', name: 'Veterinary', icon: 'Activity' },
    { id: 'grooming', name: 'Grooming', icon: 'Scissors' },
    { id: 'boarding', name: 'Boarding', icon: 'Home' },
];

const PLACES = [
    {
        id: '1',
        name: 'Pawfect Vet Clinic',
        type: 'vet',
        rating: 4.8,
        reviews: 124,
        distance: '1.2 km',
        address: 'Linking Road, Bandra West',
        coords: { latitude: 19.076, longitude: 72.8777 },
        image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: '2',
        name: 'The Pet Spa',
        type: 'grooming',
        rating: 4.9,
        reviews: 89,
        distance: '0.8 km',
        address: 'Hill Road, Bandra West',
        coords: { latitude: 19.073, longitude: 72.872 },
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: '3',
        name: 'Happy Paws Boarding',
        type: 'boarding',
        rating: 4.7,
        reviews: 56,
        distance: '2.5 km',
        address: 'Carter Road, Bandra West',
        coords: { latitude: 19.070, longitude: 72.880 },
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=200'
    }
];

export default function Nearby({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<any>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [places, setPlaces] = useState<any[]>(PLACES);

    useEffect(() => {
        const fetchNearby = async () => {
            try {
                const res = await providersApi.list({ limit: 50 });
                if (res.success && res.data?.providers?.length > 0) {
                    const mapped = res.data.providers.map((p: any) => {
                        let type = p.category;
                        if (p.category === 'health') type = 'vet';
                        if (p.category === 'stay') type = 'boarding';
                        if (p.category === 'exercise') type = 'walking';
                        return {
                            id: p.id,
                            name: p.business_name || 'Pet Care Expert',
                            type: type || 'grooming',
                            rating: p.rating || 5.0,
                            reviews: p.total_reviews || 0,
                            distance: '1.0 km',
                            address: p.address || 'Bandra West, Mumbai',
                            coords: {
                                latitude: p.latitude || 19.076,
                                longitude: p.longitude || 72.8777
                            },
                            image: p.user?.avatar_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=200'
                        };
                    });
                    setPlaces(mapped);
                }
            } catch (err) {
                console.error('Error fetching nearby providers:', err);
            }
        };
        fetchNearby();
    }, []);

    const filteredPlaces = places.filter(p => selectedCategory === 'all' || p.type === selectedCategory);

    const onPlacePress = (place: any) => {
        setSelectedPlace(place);
        mapRef.current?.animateToRegion({
            ...place.coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 19.076,
                    longitude: 72.8777,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                onMapReady={() => setIsMapReady(true)}
            >
                {filteredPlaces.map(place => (
                    <Marker 
                        key={place.id}
                        coordinate={place.coords}
                        onPress={() => onPlacePress(place)}
                    >
                        <View style={StyleSheet.flatten([
                            styles.marker,
                            selectedPlace?.id === place.id && styles.markerSelected
                        ])}>
                            <View style={StyleSheet.flatten([
                                styles.markerInner,
                                selectedPlace?.id === place.id && styles.markerInnerSelected
                            ])}>
                                <MapPin size={16} color={selectedPlace?.id === place.id ? 'white' : '#FF7A3D'} fill={selectedPlace?.id === place.id ? 'white' : 'transparent'} />
                            </View>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Header / Search */}
            <SafeAreaView style={styles.header}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#64748B" />
                    <Text style={styles.searchText}>Search for vets, groomers...</Text>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={18} color="#FF7A3D" />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.categoryScroll}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={StyleSheet.flatten([
                                styles.catChip,
                                selectedCategory === cat.id && styles.catChipActive
                            ])}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={StyleSheet.flatten([
                                styles.catText,
                                selectedCategory === cat.id && styles.catTextActive
                            ])}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>

            {/* Selected Place Card */}
            {selectedPlace && (
                <View style={styles.placeCardContainer}>
                    <TouchableOpacity 
                        style={styles.placeCard}
                        onPress={() => setSelectedPlace(null)}
                    >
                        <Image source={{ uri: selectedPlace.image }} style={styles.placeImg} />
                        <View style={styles.placeInfo}>
                            <View style={styles.placeHeader}>
                                <Text style={styles.placeName}>{selectedPlace.name}</Text>
                                <View style={styles.ratingBox}>
                                    <Star size={10} color="#FFD700" fill="#FFD700" />
                                    <Text style={styles.ratingText}>{selectedPlace.rating}</Text>
                                </View>
                            </View>
                            <Text style={styles.placeAddress}>{selectedPlace.address}</Text>
                            <View style={styles.placeFooter}>
                                <View style={styles.distBox}>
                                    <Navigation size={12} color="#64748B" />
                                    <Text style={styles.distText}>{selectedPlace.distance}</Text>
                                </View>
                                <TouchableOpacity style={styles.bookBtn}>
                                    <Text style={styles.bookBtnText}>Book Now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    map: { ...StyleSheet.absoluteFillObject },
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        gap: 12
    },
    searchText: { flex: 1, color: '#64748B', fontSize: 14, fontWeight: '500' },
    filterBtn: { padding: 4 },
    categoryScroll: { marginTop: 12 },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 15,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    catChipActive: { backgroundColor: '#FF7A3D', borderColor: '#FF7A3D' },
    catText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    catTextActive: { color: 'white' },
    marker: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#FF7A3D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3
    },
    markerSelected: { width: 44, height: 44 },
    markerInnerSelected: { width: 40, height: 40, backgroundColor: '#FF7A3D' },
    placeCardContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
    },
    placeCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        flexDirection: 'row',
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        gap: 16
    },
    placeImg: { width: 90, height: 90, borderRadius: 16 },
    placeInfo: { flex: 1, justifyContent: 'center' },
    placeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    placeName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    ratingText: { fontSize: 11, fontWeight: '800', color: '#B45309' },
    placeAddress: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 8 },
    placeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    distBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    distText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    bookBtn: { backgroundColor: '#FF7A3D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    bookBtnText: { color: 'white', fontSize: 12, fontWeight: '900' }
});
