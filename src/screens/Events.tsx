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
    Modal,
    ActivityIndicator,
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

const { width } = Dimensions.get('window');

export default function Events({ navigation }: any) {
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
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {showTicket ? (
                        <View style={styles.ticketView}>
                            <View style={styles.ticketHeader}>
                                <Text style={styles.ticketHeaderTitle}>Your Ticket</Text>
                                <TouchableOpacity onPress={() => setShowTicket(false)} style={styles.closeBtn}>
                                    <X size={20} color="#7A5540" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.ticketCard}>
                                <View style={styles.ticketCutoutLeft} />
                                <View style={styles.ticketCutoutRight} />
                                <Text style={styles.ticketEventTitle}>{selectedEvent?.title}</Text>
                                <Text style={styles.ticketEventSub}>
                                    {selectedEvent?.event_date && new Date(selectedEvent?.event_date).toLocaleDateString()}
                                </Text>

                                <View style={styles.qrContainer}>
                                    <QrCode size={180} color="#1A1612" />
                                </View>

                                <Text style={styles.ticketId}>TICKET #8472910</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeModalBtn}
                                onPress={() => {
                                    setShowTicket(false);
                                    setSelectedEvent(null);
                                }}
                            >
                                <Text style={styles.closeModalBtnText}>DONE</Text>
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
                                        <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
                                        <View style={styles.modalPriceBadge}>
                                            <Text style={styles.modalPriceText}>
                                                {selectedEvent?.price ? `₹${selectedEvent.price}` : 'Free'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalFields}>
                                    <View style={styles.modalField}>
                                        <View style={StyleSheet.flatten([styles.fieldIconBox, { backgroundColor: '#E0F5F0' }])}>
                                            <Calendar size={20} color="#1D9E86" />
                                        </View>
                                        <View>
                                            <Text style={styles.fieldLabel}>
                                                {selectedEvent?.event_date 
                                                    ? new Date(selectedEvent?.event_date).toLocaleDateString() 
                                                    : 'TBD'}
                                            </Text>
                                            <Text style={styles.fieldSub}>
                                                {selectedEvent?.event_date 
                                                    ? new Date(selectedEvent?.event_date).toLocaleTimeString() 
                                                    : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.modalField}>
                                        <View style={StyleSheet.flatten([styles.fieldIconBox, { backgroundColor: '#FFF3EC' }])}>
                                            <MapPin size={20} color="#FF7A3D" />
                                        </View>
                                        <View>
                                            <Text style={styles.fieldLabel}>{selectedEvent?.location}</Text>
                                            <Text style={styles.fieldSub}>Tap to view on map</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalDescContainer}>
                                    <Text style={styles.descTitle}>About Event</Text>
                                    <Text style={styles.descText}>{selectedEvent?.description}</Text>
                                </View>

                                <View style={styles.attendeesRow}>
                                    <View style={styles.attendeeAvatars}>
                                        {[1, 2, 3].map(i => (
                                            <Image
                                                key={i}
                                                source={{ uri: `https://i.pravatar.cc/100?img=${i + 10}` }}
                                                style={StyleSheet.flatten([styles.attendeeAvatar, { marginLeft: i === 0 ? 0 : -10 }])}
                                            />
                                        ))}
                                    </View>
                                    <Text style={styles.attendeesText}>
                                        {selectedEvent?.tickets_sold && selectedEvent.tickets_sold > 3 
                                            ? `+${selectedEvent.tickets_sold - 3} others attending`
                                            : `${selectedEvent?.tickets_sold || 0} attending`}
                                    </Text>
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.ticketBtn} onPress={() => setShowTicket(true)}>
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Pet Events</Text>
                    <View style={styles.searchContainer}>
                        <Search size={20} color="#B09080" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search events..."
                            style={styles.searchInput}
                            placeholderTextColor="#B09080"
                        />
                    </View>
                </View>
                
                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color="#FF7A3D" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                        {events.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                style={styles.eventCard}
                                onPress={() => setSelectedEvent(event)}
                                activeOpacity={0.9}
                            >
                                <Image 
                                    source={{ uri: event.image_url || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400&h=200' }} 
                                    style={styles.eventImage} 
                                />
                                <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>
                                        {event.price > 0 ? `₹${event.price}` : 'Free'}
                                    </Text>
                                </View>

                                <View style={styles.eventInfo}>
                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                    <View style={styles.eventMeta}>
                                        <View style={styles.metaRow}>
                                            <Calendar size={14} color="#1D9E86" />
                                            <Text style={styles.metaText}>
                                                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}
                                            </Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <MapPin size={14} color="#FF7A3D" />
                                            <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.eventFooter}>
                                        <View style={styles.attendeeRowSmall}>
                                            <Users size={14} color="#7A5540" />
                                            <Text style={styles.attendeeCountText}>{event.tickets_sold || 0} attending</Text>
                                        </View>
                                        <TouchableOpacity style={styles.detailsTag}>
                                            <Text style={styles.detailsTagText}>VIEW DETAILS</Text>
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
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        backgroundColor: 'white',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 20,
    },
    searchContainer: {
        position: 'relative',
        backgroundColor: '#FFF9F5',
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
        color: '#1A1612',
    },
    listContainer: {
        padding: 24,
        gap: 20,
    },
    eventCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 10 },
        borderWidth: 1,
        borderColor: '#F5E6D8',
    },
    eventImage: {
        width: '100%',
        height: 180,
    },
    priceBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FF7A3D',
    },
    eventInfo: {
        padding: 24,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1612',
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
        color: '#7A5540',
        fontWeight: '500',
    },
    eventFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F5E6D8',
    },
    attendeeRowSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    attendeeCountText: {
        fontSize: 12,
        color: '#7A5540',
        fontWeight: '600',
    },
    detailsTag: {
        backgroundColor: '#FFF3EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailsTagText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FF7A3D',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
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
        color: '#1A1612',
        flex: 1,
    },
    modalPriceBadge: {
        backgroundColor: '#FFF3EC',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ccfbf1',
    },
    modalPriceText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FF7A3D',
    },
    modalFields: {
        gap: 16,
        marginBottom: 32,
    },
    modalField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFF9F5',
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
        color: '#1A1612',
        marginBottom: 2,
    },
    fieldSub: {
        fontSize: 12,
        color: '#B09080',
        fontWeight: '600',
    },
    modalDescContainer: {
        marginBottom: 32,
    },
    descTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1612',
        marginBottom: 12,
    },
    descText: {
        fontSize: 14,
        color: '#7A5540',
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
        borderColor: 'white',
    },
    attendeesText: {
        fontSize: 13,
        color: '#7A5540',
        fontWeight: '600',
    },
    modalFooter: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F5E6D8',
    },
    ticketBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FF7A3D',
        height: 64,
        borderRadius: 24,
        shadowColor: '#FF7A3D',
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
        color: '#1A1612',
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5E6D8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ticketCard: {
        width: '100%',
        backgroundColor: '#FFF3EC',
        borderRadius: 40,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ccfbf1',
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
        backgroundColor: 'white',
    },
    ticketCutoutRight: {
        position: 'absolute',
        right: -15,
        top: '50%',
        marginTop: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'white',
    },
    ticketEventTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1612',
        textAlign: 'center',
        marginBottom: 8,
    },
    ticketEventSub: {
        fontSize: 14,
        color: '#FF7A3D',
        fontWeight: '600',
        marginBottom: 40,
    },
    qrContainer: {
        backgroundColor: 'white',
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
        color: '#B09080',
        letterSpacing: 2,
    },
    closeModalBtn: {
        width: '100%',
        height: 64,
        backgroundColor: '#1A1612',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    closeModalBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
