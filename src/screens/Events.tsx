import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    TextInput,
    Modal,
    ActivityIndicator
} from 'react-native';
import {
    Calendar,
    MapPin,
    Ticket,
    Search,
    X,
    QrCode,
    Users,
} from 'lucide-react-native';
import { eventsApi, PetEvent } from '../services/events.service';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function Events({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const [selectedEvent, setSelectedEvent] = useState<PetEvent | null>(null);
    const [showTicket, setShowTicket] = useState(false);
    
    const [events, setEvents] = useState<PetEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await eventsApi.list({ upcoming_only: true });
            if (res.success && res.data) {
                setEvents(res.data.events || []);
            }
        } catch (err) {
            console.error('Failed to load events:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderEventDetails = () => (
        <Modal
            visible={!!selectedEvent}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setSelectedEvent(null)}
        >
            <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    {showTicket ? (
                        <View style={styles.ticketView}>
                            <View style={styles.ticketHeader}>
                                <Text style={[styles.ticketHeaderTitle, { color: colors.text }]}>Your Ticket</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowTicket(false)} 
                                    style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
                                >
                                    <X size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.borderSecondary }]}>
                                <View style={[styles.ticketCutoutLeft, { backgroundColor: colors.background }]} />
                                <View style={[styles.ticketCutoutRight, { backgroundColor: colors.background }]} />
                                <Text style={[styles.ticketEventTitle, { color: colors.text }]}>{selectedEvent?.title}</Text>
                                <Text style={[styles.ticketEventSub, { color: colors.primary }]}>
                                    {selectedEvent?.event_date && new Date(selectedEvent?.event_date).toLocaleDateString()}
                                </Text>

                                <View style={[styles.qrContainer, { backgroundColor: 'white' }]}>
                                    <QrCode size={180} color="#1A1612" />
                                </View>

                                <Text style={[styles.ticketId, { color: colors.textMuted }]}>TICKET #8472910</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.closeModalBtn, { backgroundColor: colors.text }]}
                                onPress={() => {
                                    setShowTicket(false);
                                    setSelectedEvent(null);
                                }}
                            >
                                <Text style={[styles.closeModalBtnText, { color: colors.background }]}>DONE</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={styles.modalBanner}>
                                <Image source={{ uri: selectedEvent?.image_url || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400&h=200' }} style={styles.modalImage} />
                                <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.modalCloseBtn}>
                                    <X size={20} color="white" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalInfoScroll}>
                                <View style={styles.modalInfoHeader}>
                                    <View style={styles.modalTitleBox}>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedEvent?.title}</Text>
                                        <View style={[styles.modalPriceBadge, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
                                            <Text style={[styles.modalPriceText, { color: colors.primary }]}>
                                                {selectedEvent?.price ? `₹${selectedEvent.price}` : 'Free'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalFields}>
                                    <View style={[styles.modalField, { backgroundColor: colors.surface }]}>
                                        <View style={[styles.fieldIconBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#E0F5F0' }]}>
                                            <Calendar size={20} color={isDark ? colors.accent : '#1D9E86'} />
                                        </View>
                                        <View>
                                            <Text style={[styles.fieldLabel, { color: colors.text }]}>
                                                {selectedEvent?.event_date 
                                                    ? new Date(selectedEvent?.event_date).toLocaleDateString() 
                                                    : 'TBD'}
                                            </Text>
                                            <Text style={[styles.fieldSub, { color: colors.textMuted }]}>
                                                {selectedEvent?.event_date 
                                                    ? new Date(selectedEvent?.event_date).toLocaleTimeString() 
                                                    : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.modalField, { backgroundColor: colors.surface }]}>
                                        <View style={[styles.fieldIconBox, { backgroundColor: colors.primaryLight }]}>
                                            <MapPin size={20} color={colors.primary} />
                                        </View>
                                        <View>
                                            <Text style={[styles.fieldLabel, { color: colors.text }]}>{selectedEvent?.location}</Text>
                                            <Text style={[styles.fieldSub, { color: colors.textMuted }]}>Tap to view on map</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalDescContainer}>
                                    <Text style={[styles.descTitle, { color: colors.text }]}>About Event</Text>
                                    <Text style={[styles.descText, { color: colors.textSecondary }]}>{selectedEvent?.description}</Text>
                                </View>

                                <View style={styles.attendeesRow}>
                                    <View style={styles.attendeeAvatars}>
                                        {[1, 2, 3].map(i => (
                                            <Image
                                                key={i}
                                                source={{ uri: `https://i.pravatar.cc/100?img=${i + 10}` }}
                                                style={[styles.attendeeAvatar, { marginLeft: i === 0 ? 0 : -10, borderColor: colors.background }]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.attendeesText, { color: colors.textSecondary }]}>
                                        {selectedEvent?.tickets_sold && selectedEvent.tickets_sold > 3 
                                            ? `+${selectedEvent.tickets_sold - 3} others attending`
                                            : `${selectedEvent?.tickets_sold || 0} attending`}
                                    </Text>
                                </View>
                            </ScrollView>

                            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                                <TouchableOpacity style={[styles.ticketBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => setShowTicket(true)}>
                                    <Ticket size={20} color="white" />
                                    <Text style={styles.ticketBtnText}>GET TICKET</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Pet Events</Text>
                    <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
                        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search events..."
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>
                
                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                        {events.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => setSelectedEvent(event)}
                                activeOpacity={0.9}
                            >
                                <Image 
                                    source={{ uri: event.image_url || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400&h=200' }} 
                                    style={styles.eventImage} 
                                />
                                <View style={[styles.priceBadge, { backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.9)' }]}>
                                    <Text style={[styles.priceText, { color: colors.primary }]}>
                                        {event.price > 0 ? `₹${event.price}` : 'Free'}
                                    </Text>
                                </View>

                                <View style={styles.eventInfo}>
                                    <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                                    <View style={styles.eventMeta}>
                                        <View style={styles.metaRow}>
                                            <Calendar size={14} color={isDark ? colors.accent : '#1D9E86'} />
                                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}
                                            </Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <MapPin size={14} color={colors.primary} />
                                            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{event.location}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.eventFooter, { borderTopColor: colors.border }]}>
                                        <View style={styles.attendeeRowSmall}>
                                            <Users size={14} color={colors.textSecondary} />
                                            <Text style={[styles.attendeeCountText, { color: colors.textSecondary }]}>{event.tickets_sold || 0} attending</Text>
                                        </View>
                                        <TouchableOpacity style={[styles.detailsTag, { backgroundColor: colors.primaryLight }]}>
                                            <Text style={[styles.detailsTagText, { color: colors.primary }]}>VIEW DETAILS</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {renderEventDetails()}
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
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchContainer: {
        position: 'relative',
        borderRadius: 20,
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    searchIcon: {
        position: 'absolute',
        left: 20,
    },
    searchInput: {
        fontSize: 16,
        paddingLeft: 32,
    },
    listContainer: {
        padding: 24,
        gap: 20,
    },
    eventCard: {
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
        borderWidth: 1,
    },
    eventImage: {
        width: '100%',
        height: 180,
    },
    priceBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '900',
    },
    eventInfo: {
        padding: 24,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    eventMeta: {
        gap: 8,
        marginBottom: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
    eventFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    attendeeRowSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    attendeeCountText: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailsTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailsTagText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        height: '85%',
        overflow: 'hidden',
    },
    modalBanner: {
        height: 240,
        position: 'relative',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalInfoScroll: {
        flex: 1,
        padding: 24,
    },
    modalInfoHeader: {
        marginBottom: 4,
    },
    modalTitleBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
    },
    modalPriceBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
    },
    modalPriceText: {
        fontSize: 16,
        fontWeight: '900',
    },
    modalFields: {
        gap: 16,
        marginBottom: 32,
    },
    modalField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 24,
    },
    fieldIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    fieldSub: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalDescContainer: {
        marginBottom: 32,
    },
    descTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    descText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    attendeesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 40,
    },
    attendeeAvatars: {
        flexDirection: 'row',
    },
    attendeeAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
    },
    attendeesText: {
        fontSize: 13,
        fontWeight: '600',
    },
    modalFooter: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    ticketBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 64,
        borderRadius: 24,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 10 },
    },
    ticketBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    ticketView: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    ticketHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    ticketHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ticketCard: {
        width: '100%',
        borderRadius: 40,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        position: 'relative',
    },
    ticketCutoutLeft: {
        position: 'absolute',
        left: -15,
        top: '50%',
        marginTop: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    ticketCutoutRight: {
        position: 'absolute',
        right: -15,
        top: '50%',
        marginTop: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    ticketEventTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    ticketEventSub: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 40,
    },
    qrContainer: {
        padding: 20,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 10 },
        marginBottom: 32,
    },
    ticketId: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    closeModalBtn: {
        width: '100%',
        height: 64,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    closeModalBtnText: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
