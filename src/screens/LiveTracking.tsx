import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    Platform,
    ActivityIndicator,
    StatusBar,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import MapView dynamically to avoid web errors
let MapView: any = View;
let Marker: any = View;
let Polyline: any = View;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = null;
}
import {
    ArrowLeft,
    Navigation,
    Phone,
    MessageCircle,
    Clock,
    Footprints,
    Star,
    ShieldCheck,
    Zap,
    Route,
    MapPin,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useSocket } from '../hooks/useSocket';
import EmergencyModal from '../components/EmergencyModal';
import GroomingReportModal from '../components/GroomingReportModal';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface LocationPoint {
    latitude: number;
    longitude: number;
    status?: string;
    created_at?: string;
}

export default function LiveTracking({ navigation, route }: any) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const bookingId = route?.params?.bookingId;
    const mapRef = useRef<any>(null);
    const [providerPosition, setProviderPosition] = useState<LocationPoint | null>(null);
    const [pathPoints, setPathPoints] = useState<LocationPoint[]>([]);
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('Heading to you');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [distance, setDistance] = useState(0);
    const [isMapReady, setIsMapReady] = useState(false);
    const [sosVisible, setSosVisible] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [isGroomingCompleted, setIsGroomingCompleted] = useState(false);

    const panelHeight = useRef(new Animated.Value(280)).current;

    // Demo coordinates (Mumbai area)
    const demoCenter = { latitude: 19.076, longitude: 72.8777 };
    const demoHome = { latitude: 19.073, longitude: 72.872 };

    const { on, emit, isConnected } = useSocket();

    useEffect(() => {
        if (bookingId && isConnected) {
            // Fetch initial path
            const fetchPath = async () => {
                const { data } = await supabase
                    .from('location_updates')
                    .select('latitude, longitude, status, created_at')
                    .eq('booking_id', bookingId)
                    .order('created_at', { ascending: true });

                if (data && data.length > 0) {
                    setPathPoints(data);
                    setProviderPosition(data[data.length - 1]);
                }
            };
            fetchPath();

            // Join the booking room
            emit('join_booking', bookingId);

            // Listen for location updates via WebSockets
            const cleanup = on('location_update', (newPoint: LocationPoint) => {
                setProviderPosition(newPoint);
                setPathPoints(prev => [...prev, newPoint]);
            });

            // In a real app we'd fetch the booking details to check if it's grooming
            // For demo, we can just randomly decide or check a parameter
            // We'll add a listener for grooming completed
            on('booking_status_updated', (data: any) => {
                if (data.status === 'service_completed') {
                    setIsGroomingCompleted(true);
                    setCurrentStatus('Grooming Completed');
                }
            });

            return () => {
                cleanup();
                emit('leave_booking', bookingId);
            };
        } else if (!bookingId) {
            // Demo logic
            let step = 0;
            const updates = [
                { latitude: 19.076, longitude: 72.8777, status: 'Heading to you' },
                { latitude: 19.075, longitude: 72.876, status: 'Heading to you' },
                { latitude: 19.074, longitude: 72.874, status: 'Arrived at your location' },
                { latitude: 19.073, longitude: 72.872, status: 'Service In Progress' },
            ];
            setProviderPosition(updates[0]);
            setPathPoints([updates[0]]);

            const interval = setInterval(() => {
                if (step < updates.length - 1) {
                    step++;
                    setProviderPosition(updates[step]);
                    setPathPoints(prev => [...prev, updates[step]]);
                    setCurrentStatus(updates[step].status);
                } else {
                    clearInterval(interval);
                }
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [bookingId, isConnected, emit, on]);

    useEffect(() => {
        if (providerPosition && isMapReady) {
            mapRef.current?.animateToRegion({
                ...providerPosition,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    }, [providerPosition, isMapReady]);

    useEffect(() => {
        const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pathPoints.length < 2) return;
        let total = 0;
        for (let i = 1; i < pathPoints.length; i++) {
            total += haversine(
                pathPoints[i - 1].latitude, pathPoints[i - 1].longitude,
                pathPoints[i].latitude, pathPoints[i].longitude
            );
        }
        setDistance(total);
    }, [pathPoints]);

    const togglePanel = () => {
        Animated.spring(panelHeight, {
            toValue: isPanelExpanded ? 280 : 450,
            useNativeDriver: false,
        }).start();
        setIsPanelExpanded(!isPanelExpanded);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    ...demoCenter,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                onMapReady={() => setIsMapReady(true)}
            >
                {/* Home Marker */}
                <Marker coordinate={demoHome} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={[styles.homeMarker, { borderColor: colors.primary }]}>
                        <MapPin size={18} color={colors.primary} fill={colors.primary} fillOpacity={0.1} />
                    </View>
                </Marker>

                {/* Provider Marker */}
                {providerPosition && (
                    <Marker coordinate={providerPosition} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={styles.providerMarker}>
                            <View style={[styles.providerMarkerInner, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                                <Navigation size={18} color="white" fill="white" />
                            </View>
                            <View style={[styles.pingAnimation, { backgroundColor: colors.accentLight }]} />
                        </View>
                    </Marker>
                )}

                {/* Path Polyline */}
                <Polyline
                    coordinates={pathPoints}
                    strokeColor={colors.accent}
                    strokeWidth={4}
                    lineDashPattern={[10, 10]}
                />
            </MapView>

            {/* Header Overlay */}
            <View style={[styles.header, { top: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
                    <ArrowLeft size={20} color={colors.text} />
                </TouchableOpacity>

                <View style={[styles.statusBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=100&h=100' }}
                        style={styles.statusAvatar}
                    />
                    <View>
                        <Text style={[styles.statusType, { color: colors.text }]}>LIVE SESSION</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.pulseDot, { backgroundColor: colors.accent }]} />
                            <Text style={[styles.statusText, { color: colors.accent }]}>{currentStatus.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={() => setSosVisible(true)}
                        style={[styles.sosBtn, { backgroundColor: colors.danger, shadowColor: colors.danger }]}
                    >
                        <Text style={styles.sosText}>SOS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => providerPosition && mapRef.current?.animateToRegion({ ...providerPosition, latitudeDelta: 0.01, longitudeDelta: 0.01 })}
                        style={[styles.recenterBtn, { backgroundColor: colors.surface }]}
                    >
                        <Navigation size={20} color={colors.accent} fill={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Panel */}
            <Animated.View style={[styles.panel, { height: panelHeight, backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                <TouchableOpacity onPress={togglePanel} style={styles.panelHandleBtn}>
                    <View style={[styles.panelHandle, { backgroundColor: colors.border }]} />
                </TouchableOpacity>

                <View style={styles.panelContent}>
                    <View style={styles.providerRow}>
                        <View style={styles.providerLeft}>
                            <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={[styles.providerAvatar, { borderColor: colors.surface }]} />
                            <View>
                                <Text style={[styles.providerName, { color: colors.text }]}>David Miller</Text>
                                <View style={styles.providerMeta}>
                                    <View style={[styles.ratingBox, { backgroundColor: colors.primaryLight }]}>
                                        <Star size={10} color={colors.primary} fill={colors.primary} />
                                        <Text style={[styles.ratingText, { color: colors.primary }]}>4.9</Text>
                                    </View>
                                    <Text style={[styles.partnerText, { color: colors.textMuted }]}>GOLD PARTNER</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={() => navigation.navigate('Chat')} style={[styles.panelActionBtn, { backgroundColor: colors.background }]}>
                                <MessageCircle size={20} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.panelActionBtn, { backgroundColor: colors.background }]}>
                                <Phone size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <View style={[styles.statIconBox, { backgroundColor: colors.accentLight }]}>
                                <Clock size={16} color={colors.accent} />
                            </View>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>TIME</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{formatTime(elapsedTime)}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <View style={[styles.statIconBox, { backgroundColor: colors.primaryLight }]}>
                                <Footprints size={16} color={colors.primary} />
                            </View>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>DISTANCE</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{distance.toFixed(1)} km</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <View style={[styles.statIconBox, { backgroundColor: colors.primaryLight }]}>
                                <Route size={16} color={colors.primary} />
                            </View>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>STATUS</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{currentStatus.split(' ')[0]}</Text>
                        </View>
                    </View>

                    {isPanelExpanded && (
                        <View style={styles.expandedContent}>
                            <View style={[styles.insuranceCard, { backgroundColor: colors.accentLight }]}>
                                <ShieldCheck size={20} color={colors.accent} />
                                <Text style={[styles.insuranceText, { color: colors.accent }]}>Insurance covered for this session. Funds held in escrow.</Text>
                            </View>

                            <View style={styles.timeline}>
                                <Text style={[styles.timelineTitle, { color: colors.textMuted }]}>SESSION TIMELINE</Text>
                                <View style={styles.timelineItem}>
                                    <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                                    <Text style={[styles.timelineText, { color: colors.text }]}>Started {formatTime(elapsedTime)} ago</Text>
                                </View>
                                <View style={styles.timelineItem}>
                                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.timelineText, { color: colors.text }]}>{pathPoints.length} location updates received</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.endBtn, { backgroundColor: colors.text }, isGroomingCompleted && { backgroundColor: '#3b82f6' }]}
                                onPress={() => isGroomingCompleted ? setReportVisible(true) : null}
                            >
                                <Zap size={16} color={colors.background} fill={colors.background} />
                                <Text style={[styles.endBtnText, { color: colors.background }]}>
                                    {isGroomingCompleted ? 'VIEW GROOMING REPORT' : 'END SESSION & PAY'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!isPanelExpanded && (
                        <TouchableOpacity 
                            style={[styles.endBtnSmall, { backgroundColor: colors.text }, isGroomingCompleted && { backgroundColor: '#3b82f6' }]}
                            onPress={() => isGroomingCompleted ? setReportVisible(true) : null}
                        >
                            <Zap size={16} color={colors.background} fill={colors.background} />
                            <Text style={[styles.endBtnText, { color: colors.background }]}>
                                {isGroomingCompleted ? 'VIEW GROOMING REPORT' : 'END SESSION & PAY'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            <EmergencyModal 
                visible={sosVisible} 
                onClose={() => setSosVisible(false)} 
                bookingId={bookingId} 
            />

            <GroomingReportModal
                visible={reportVisible}
                onClose={() => setReportVisible(false)}
                bookingId={bookingId}
                onSuccess={() => {
                    Alert.alert('Success', 'Payment Released!');
                }}
            />
        </View>
    );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    homeMarker: {
        width: 36,
        height: 36,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
    },
    providerMarker: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerMarkerInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    pingAnimation: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        zIndex: 1,
    },
    header: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
    },
    statusAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(20, 184, 166, 0.2)',
    },
    statusType: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    recenterBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    sosBtn: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    sosText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    panel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -10 },
        elevation: 10,
    },
    panelHandleBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    panelHandle: {
        width: 48,
        height: 6,
        borderRadius: 3,
    },
    panelContent: {
        paddingHorizontal: 24,
    },
    providerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    providerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    providerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 2,
    },
    providerName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    providerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
    },
    partnerText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    panelActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        borderRadius: 24,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },
    statIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    expandedContent: {
        gap: 20,
    },
    insuranceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 20,
    },
    insuranceText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500',
    },
    timeline: {
        gap: 12,
    },
    timelineTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    timelineText: {
        fontSize: 12,
        fontWeight: '500',
    },
    endBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 20,
        gap: 10,
        marginTop: 10,
    },
    endBtnSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 20,
        gap: 10,
    },
    endBtnText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
