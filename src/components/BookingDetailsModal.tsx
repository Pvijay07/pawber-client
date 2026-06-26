import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    TextInput,
    Dimensions,
    Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ShieldCheck,
    Scissors,
    FileText,
    TrendingUp,
    Sparkles,
    User,
    Plus,
    CornerDownRight,
    Star
} from 'lucide-react-native';
import { bookingsApi } from '../services/bookings.service';
import { reviewsApi } from '../services/reviews.service';
import { useTheme } from '../theme/ThemeContext';
import MapWrapper, { MapMarker, MapPolyline } from './common/MapViewWrapper';

const { width } = Dimensions.get('window');

interface BookingDetailsModalProps {
    visible: boolean;
    bookingId: string | null;
    onClose: () => void;
    onStatusChange?: () => void;
}

export default function BookingDetailsModal({ visible, bookingId, onClose, onStatusChange }: BookingDetailsModalProps) {
    const { colors, isDark } = useTheme();
    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Incomplete walk package states
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    // Review states
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        if (visible && bookingId) {
            loadBookingDetails();
        } else {
            setBooking(null);
            setShowRescheduleForm(false);
            setRescheduleDate('');
        }
    }, [visible, bookingId]);

    const loadBookingDetails = async () => {
        if (!bookingId) return;
        setIsLoading(true);
        try {
            const res = await bookingsApi.getById(bookingId);
            if (res.success && res.data) {
                setBooking(res.data.booking);
            } else {
                Alert.alert('Error', res.error?.message || 'Failed to load booking details');
                onClose();
            }
        } catch (error) {
            console.error('Error loading booking details:', error);
            Alert.alert('Error', 'Failed to load booking details');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!booking) return;
        Alert.alert(
            'Cancel Booking Request',
            'Are you sure you want to cancel this booking request? This will remove the request and any active bids.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSubmittingAction(true);
                        try {
                            const res = await bookingsApi.deleteBooking(booking.id);
                            if (res.success) {
                                Alert.alert('Success', 'Booking request cancelled successfully!');
                                onClose();
                                if (onStatusChange) onStatusChange();
                            } else {
                                Alert.alert('Error', res.error?.message || 'Failed to cancel booking request');
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'An error occurred while cancelling the booking request');
                        } finally {
                            setIsSubmittingAction(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReleasePayment = async () => {
        if (!booking) return;
        Alert.alert(
            'Confirm Release',
            'Are you sure you want to release the escrow payment to the provider? This action is irreversible.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Release',
                    onPress: async () => {
                        setIsSubmittingAction(true);
                        try {
                            const isGrooming = (booking.service?.name || '').toLowerCase().includes('groom');
                            const res = isGrooming
                                ? await bookingsApi.approveGrooming(booking.id)
                                : await bookingsApi.releasePayment(booking.id);
                            
                            if (res.success) {
                                Alert.alert('Success', 'Payment released successfully!');
                                loadBookingDetails();
                                if (onStatusChange) onStatusChange();
                            } else {
                                Alert.alert('Error', res.error?.message || 'Failed to release payment');
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'An error occurred while releasing payment');
                        } finally {
                            setIsSubmittingAction(false);
                        }
                    }
                }
            ]
        );
    };

    const handleIncompleteAction = async (option: 'reschedule' | 'extend' | 'refund_cash' | 'refund_credit') => {
        if (!booking) return;
        
        let details: any = {};
        if (option === 'reschedule') {
            if (!rescheduleDate.trim()) {
                Alert.alert('Error', 'Please enter a valid date and time');
                return;
            }
            details.newDate = new Date(rescheduleDate).toISOString();
        } else if (option === 'extend') {
            details.extensionDays = 30;
        }

        setIsSubmittingAction(true);
        try {
            const res = await bookingsApi.handleIncompleteWalkPackage(booking.id, option, details);
            if (res.success) {
                Alert.alert('Success', res.data?.message || 'Action executed successfully!');
                setShowRescheduleForm(false);
                setRescheduleDate('');
                loadBookingDetails();
                if (onStatusChange) onStatusChange();
            } else {
                Alert.alert('Error', res.error?.message || 'Action failed');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred');
        } finally {
            setIsSubmittingAction(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!booking) return;
        setIsSubmittingReview(true);
        try {
            const tagStr = selectedTags.length > 0 ? `Tags: ${selectedTags.join(', ')}. ` : '';
            const fullComment = `${tagStr}${reviewComment}`;
            
            const res = await reviewsApi.create({
                booking_id: booking.id,
                rating: reviewRating,
                comment: fullComment
            });

            if (res.success) {
                Alert.alert('Thank you!', 'Your review has been submitted successfully.');
                loadBookingDetails(); // Refresh details to fetch new review
                if (onStatusChange) onStatusChange();
            } else {
                Alert.alert('Error', res.error?.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Error', 'An error occurred while submitting your review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (!visible) return null;

    const serviceName = booking?.service?.name || 'Service';
    const isWalking = serviceName.toLowerCase().includes('walk');
    const isGrooming = serviceName.toLowerCase().includes('groom');

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <BlurView intensity={95} tint={isDark ? "dark" : "light"} style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Booking Details</Text>
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                ID: #{bookingId?.substring(0, 8).toUpperCase()}
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={onClose}>
                            <X size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading service logs...</Text>
                        </View>
                    ) : booking ? (
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {/* Service Summary Card */}
                            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.summaryHeader}>
                                    <View style={[styles.serviceBadge, { backgroundColor: isGrooming ? 'rgba(29, 158, 134, 0.1)' : 'rgba(139, 92, 246, 0.1)' }]}>
                                        <Text style={{ color: isGrooming ? '#1D9E86' : '#8b5cf6', fontWeight: '900', fontSize: 10 }}>
                                            {serviceName.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: booking.status === 'service_completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 122, 61, 0.1)' }]}>
                                        <Text style={{ color: booking.status === 'service_completed' ? '#10b981' : colors.primary, fontWeight: '900', fontSize: 10 }}>
                                            {booking.status.replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={[styles.petName, { color: colors.text }]}>
                                    Pet: {booking.booking_pets && booking.booking_pets.length > 0
                                        ? booking.booking_pets.map((bp: any) => bp.pet?.name).join(', ')
                                        : 'Your Pet'}
                                </Text>

                                <View style={styles.metaRow}>
                                    <Calendar size={14} color={colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        Booked on: {new Date(booking.booking_date).toLocaleDateString()}
                                    </Text>
                                </View>

                                {booking.provider && (
                                    <View style={[styles.providerRow, { borderTopColor: colors.border }]}>
                                        <View style={[styles.providerAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                                            <User size={18} color="white" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.providerName, { color: colors.text }]}>
                                                {booking.provider.business_name || booking.provider.user?.full_name}
                                            </Text>
                                            <Text style={[styles.providerSub, { color: colors.textSecondary }]}>
                                                ★ {booking.provider.rating || 'New Provider'}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Request Summary Card */}
                            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 13, marginBottom: 12 }]}>
                                    Request Summary
                                </Text>

                                {/* Multiple Pets list */}
                                <View style={[styles.metaRow, { alignItems: 'flex-start' }]}>
                                    <Text style={{ fontSize: 14 }}>🐾</Text>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Pets</Text>
                                        {booking.booking_pets && booking.booking_pets.length > 0 ? (
                                            booking.booking_pets.map((bp: any, idx: number) => (
                                                <Text key={idx} style={{ color: colors.textSecondary, fontSize: 13 }}>
                                                    • {bp.pet?.name} ({bp.pet?.breed || 'Breed'})
                                                </Text>
                                            ))
                                        ) : (
                                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Your Pet</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Time of request */}
                                {booking.booking_time && (
                                    <View style={[styles.metaRow, { marginTop: 10 }]}>
                                        <Clock size={14} color={colors.textSecondary} />
                                        <Text style={[styles.metaText, { color: colors.textSecondary, marginLeft: 8 }]}>
                                            Requested Time: <Text style={{ color: colors.text, fontWeight: '700' }}>{booking.booking_time}</Text>
                                        </Text>
                                    </View>
                                )}

                                {/* Package details */}
                                {booking.package && (
                                    <View style={[styles.metaRow, { marginTop: 10, alignItems: 'flex-start' }]}>
                                        <Text style={{ fontSize: 14 }}>📦</Text>
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Package</Text>
                                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                                {booking.package.package_name} (₹{booking.package.price})
                                            </Text>
                                            {booking.package.features && booking.package.features.length > 0 && (
                                                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                                                    Features: {booking.package.features.join(', ')}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}

                                {/* Addons list */}
                                {booking.booking_addons && booking.booking_addons.length > 0 && (
                                    <View style={[styles.metaRow, { marginTop: 10, alignItems: 'flex-start' }]}>
                                        <Plus size={14} color={colors.textSecondary} />
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Add-ons</Text>
                                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                                {booking.booking_addons.map((ba: any) => ba.addon?.name).join(', ')}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Special instructions */}
                                {(booking.notes || (booking.special_instructions && booking.special_instructions.length > 0)) && (
                                    <View style={[styles.metaRow, { marginTop: 10, alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
                                        <FileText size={14} color={colors.textSecondary} />
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Special Instructions</Text>
                                            {booking.notes ? (
                                                <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
                                                    "{booking.notes}"
                                                </Text>
                                            ) : null}
                                            {Array.isArray(booking.special_instructions) && booking.special_instructions.length > 0 && (
                                                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                                                    Requirements: {booking.special_instructions.map((item: string) => {
                                                        const labelMap: Record<string, string> = {
                                                            leash_required: 'Leash Required',
                                                            avoid_dogs: 'Avoid Other Dogs',
                                                            medication: 'Medication',
                                                            key_pickup: 'Key Pickup',
                                                            emergency_vet: 'Emergency Vet'
                                                        };
                                                        return labelMap[item] || item;
                                                    }).join(', ')}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* WALKING TRACKING & PACKAGES SECTION */}
                            {isWalking && (
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Walking Package Progress</Text>
                                    
                                    <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <Text style={[styles.progressLabel, { color: colors.text }]}>
                                            Completed walks: {booking.completed_walks || 0} of {booking.total_walks || 1}
                                        </Text>
                                        <View style={styles.progressBarBg}>
                                            <View style={[
                                                styles.progressBarFill, 
                                                { 
                                                    backgroundColor: colors.primary, 
                                                    width: `${((booking.completed_walks || 0) / (booking.total_walks || 1)) * 100}%` 
                                                }
                                            ]} />
                                        </View>
                                    </View>

                                    <Text style={[styles.subSectionTitle, { color: colors.text }]}>Walk Sessions Log</Text>
                                    {booking.walk_sessions && booking.walk_sessions.length > 0 ? (
                                        booking.walk_sessions.map((walk: any, idx: number) => {
                                            const hasRouteMap = walk.route_map && Array.isArray(walk.route_map) && walk.route_map.length > 0;
                                            return (
                                                <View key={walk.id} style={[styles.walkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                    <View style={styles.walkHeader}>
                                                        <Text style={[styles.walkNum, { color: colors.text }]}>Walk #{idx + 1}</Text>
                                                        <Text style={[styles.walkStatus, { color: walk.status === 'Completed' ? '#10b981' : colors.primary }]}>
                                                            {walk.status}
                                                        </Text>
                                                    </View>

                                                    <Text style={[styles.walkTime, { color: colors.textSecondary }]}>
                                                        Scheduled: {walk.scheduled_at ? new Date(walk.scheduled_at).toLocaleString() : 'TBD'}
                                                    </Text>

                                                    {walk.started_at && (
                                                        <Text style={[styles.walkTime, { color: colors.textSecondary }]}>
                                                            Duration: {new Date(walk.started_at).toLocaleTimeString()} - {walk.completed_at ? new Date(walk.completed_at).toLocaleTimeString() : 'In Progress'}
                                                        </Text>
                                                    )}

                                                    {walk.notes && (
                                                        <Text style={[styles.walkNotes, { color: colors.textSecondary }]}>
                                                            Note: "{walk.notes}"
                                                        </Text>
                                                    )}

                                                    {walk.photo_url && (
                                                        <Image source={{ uri: walk.photo_url }} style={styles.proofPhoto} />
                                                    )}

                                                    {walk.status === 'Completed' && hasRouteMap && (
                                                        <View style={styles.mapContainer}>
                                                            <MapWrapper
                                                                style={StyleSheet.absoluteFillObject}
                                                                initialRegion={{
                                                                    latitude: walk.start_latitude || walk.route_map[0].lat,
                                                                    longitude: walk.start_longitude || walk.route_map[0].lng,
                                                                    latitudeDelta: 0.01,
                                                                    longitudeDelta: 0.01
                                                                }}
                                                                scrollEnabled={false}
                                                                zoomEnabled={false}
                                                            >
                                                                <MapPolyline
                                                                    coordinates={walk.route_map.map((p: any) => ({
                                                                        latitude: p.lat,
                                                                        longitude: p.lng
                                                                    }))}
                                                                    strokeWidth={4}
                                                                    strokeColor={colors.primary}
                                                                />
                                                                <MapMarker
                                                                    coordinate={{
                                                                        latitude: walk.start_latitude || walk.route_map[0].lat,
                                                                        longitude: walk.start_longitude || walk.route_map[0].lng
                                                                    }}
                                                                    title="Start"
                                                                />
                                                                <MapMarker
                                                                    coordinate={{
                                                                        latitude: walk.end_latitude || walk.route_map[walk.route_map.length - 1].lat,
                                                                        longitude: walk.end_longitude || walk.route_map[walk.route_map.length - 1].lng
                                                                    }}
                                                                    title="End"
                                                                    pinColor="green"
                                                                />
                                                            </MapWrapper>
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })
                                    ) : (
                                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No walks started yet.</Text>
                                    )}

                                    {/* INCOMPLETE PACKAGE HANDLER OPTIONS */}
                                    {booking.total_walks > booking.completed_walks && ['confirmed', 'in_progress'].includes(booking.status) && (
                                        <View style={[styles.incompleteSection, { borderTopColor: colors.border }]}>
                                            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>Manage Unused Walks</Text>
                                            <Text style={[styles.incompleteDesc, { color: colors.textSecondary }]}>
                                                You have {booking.total_walks - booking.completed_walks} unused walks remaining in this package. Choose an option below to manage them:
                                            </Text>

                                            <View style={styles.actionGrid}>
                                                <TouchableOpacity
                                                    style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                    onPress={() => setShowRescheduleForm(!showRescheduleForm)}
                                                >
                                                    <Calendar size={18} color={colors.primary} />
                                                    <Text style={[styles.actionGridBtnText, { color: colors.text }]}>Reschedule</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                    onPress={() => handleIncompleteAction('extend')}
                                                    disabled={isSubmittingAction}
                                                >
                                                    <TrendingUp size={18} color="#3b82f6" />
                                                    <Text style={[styles.actionGridBtnText, { color: colors.text }]}>Extend 30 Days</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                    onPress={() => handleIncompleteAction('refund_credit')}
                                                    disabled={isSubmittingAction}
                                                >
                                                    <Plus size={18} color="#10b981" />
                                                    <Text style={[styles.actionGridBtnText, { color: colors.text }]}>Wallet Refund</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                    onPress={() => handleIncompleteAction('refund_cash')}
                                                    disabled={isSubmittingAction}
                                                >
                                                    <ShieldCheck size={18} color="#e11d48" />
                                                    <Text style={[styles.actionGridBtnText, { color: colors.text }]}>Cash Refund</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {showRescheduleForm && (
                                                <View style={[styles.rescheduleBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                    <Text style={[styles.rescheduleTitle, { color: colors.text }]}>Reschedule Next Session</Text>
                                                    <TextInput
                                                        style={[styles.rescheduleInput, { color: colors.text, borderColor: colors.border }]}
                                                        placeholder="e.g. 2026-06-25 10:00"
                                                        placeholderTextColor={colors.textMuted}
                                                        value={rescheduleDate}
                                                        onChangeText={setRescheduleDate}
                                                    />
                                                    <TouchableOpacity
                                                        style={[styles.rescheduleSubmit, { backgroundColor: colors.primary }]}
                                                        onPress={() => handleIncompleteAction('reschedule')}
                                                        disabled={isSubmittingAction}
                                                    >
                                                        <Text style={styles.rescheduleSubmitText}>CONFIRM DATE</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* GROOMING WORKFLOW SECTION */}
                            {isGrooming && (
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Grooming service details</Text>

                                    {booking.grooming_details ? (
                                        <View style={styles.groomingBox}>
                                            {/* Special instructions */}
                                            {booking.grooming_details.special_instructions && (
                                                <View style={[styles.checklistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                    <Text style={[styles.cardTitle, { color: colors.text }]}>Special Instructions</Text>
                                                    <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                                                        "{booking.grooming_details.special_instructions}"
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Checklist */}
                                            {booking.grooming_details.grooming_checklist && (
                                                <View style={[styles.checklistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                    <Text style={[styles.cardTitle, { color: colors.text }]}>Grooming Checklist</Text>
                                                    {Object.entries(booking.grooming_details.grooming_checklist).map(([item, checked]) => (
                                                        <View key={item} style={styles.checkRow}>
                                                            <CheckCircle2 size={16} color={checked ? "#10b981" : colors.textMuted} fill={checked ? "rgba(16, 185, 129, 0.1)" : "none"} />
                                                            <Text style={[styles.checkText, { color: checked ? colors.text : colors.textSecondary }]}>
                                                                {item.replace(/_/g, ' ')}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Photos Comparison */}
                                            {((booking.grooming_details.before_photos && booking.grooming_details.before_photos.length > 0) || 
                                              (booking.grooming_details.after_photos && booking.grooming_details.after_photos.length > 0)) && (
                                                <View style={styles.photoContainer}>
                                                    <View style={styles.photoColumn}>
                                                        <Text style={[styles.photoColumnTitle, { color: colors.text }]}>BEFORE</Text>
                                                        {booking.grooming_details.before_photos?.[0] ? (
                                                            <Image source={{ uri: booking.grooming_details.before_photos[0] }} style={styles.groomingPhoto} />
                                                        ) : (
                                                            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                                <Text style={{ color: colors.textMuted }}>No photo</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View style={styles.photoColumn}>
                                                        <Text style={[styles.photoColumnTitle, { color: colors.text }]}>AFTER</Text>
                                                        {booking.grooming_details.after_photos?.[0] ? (
                                                            <Image source={{ uri: booking.grooming_details.after_photos[0] }} style={styles.groomingPhoto} />
                                                        ) : (
                                                            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                                <Text style={{ color: colors.textMuted }}>Pending completion</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            )}

                                            {/* Groomer notes & report */}
                                            {(booking.grooming_details.grooming_report || booking.grooming_details.groomer_notes) && (
                                                <View style={[styles.checklistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                    <Text style={[styles.cardTitle, { color: colors.text }]}>Post-Service Report</Text>
                                                    
                                                    {booking.grooming_details.grooming_report && (
                                                        <View style={{ marginBottom: 12 }}>
                                                            <Text style={[styles.reportLabel, { color: colors.textMuted }]}>TREATMENT SUMMARY</Text>
                                                            <Text style={[styles.reportText, { color: colors.text }]}>
                                                                {booking.grooming_details.grooming_report}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {booking.grooming_details.products_used && booking.grooming_details.products_used.length > 0 && (
                                                        <View style={{ marginBottom: 12 }}>
                                                            <Text style={[styles.reportLabel, { color: colors.textMuted }]}>PRODUCTS USED</Text>
                                                            <View style={styles.productsTagContainer}>
                                                                {booking.grooming_details.products_used.map((prod: string) => (
                                                                    <View key={prod} style={[styles.productTag, { backgroundColor: colors.border }]}>
                                                                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>{prod}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}

                                                    {booking.grooming_details.groomer_notes && (
                                                        <View>
                                                            <Text style={[styles.reportLabel, { color: colors.textMuted }]}>GROOMER NOTES</Text>
                                                            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                                                                "{booking.grooming_details.groomer_notes}"
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Grooming report details not uploaded yet.</Text>
                                    )}
                                </View>
                            )}

                            {/* Release Escrow Action button */}
                            {booking.status === 'service_completed' && (
                                <View style={styles.escrowActionSection}>
                                    <Text style={[styles.escrowTitle, { color: colors.text }]}>Escrow Protection Active</Text>
                                    <Text style={[styles.escrowSub, { color: colors.textSecondary }]}>
                                        The service is marked as complete. Check the progress proofs above, and release payment to the service provider. If no action is taken, it will auto-release in 24 hours.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.releaseBtn, { backgroundColor: '#10b981' }]}
                                        onPress={handleReleasePayment}
                                        disabled={isSubmittingAction}
                                    >
                                        {isSubmittingAction ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <ShieldCheck size={20} color="white" />
                                                <Text style={styles.releaseBtnText}>APPROVE & RELEASE FUNDS</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Service Review & Rating section */}
                            {booking.status === 'completed' && (
                                <View style={[styles.section, { borderTopWidth: 1.5, borderTopColor: colors.borderSecondary, paddingTop: 20 }]}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Review & Rating</Text>
                                    
                                    {booking.reviews && booking.reviews.length > 0 ? (
                                        // Read-only review view
                                        <View style={[styles.reviewCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                            <View style={styles.reviewHeader}>
                                                <View style={styles.starsRow}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star 
                                                            key={star} 
                                                            size={18} 
                                                            color={star <= booking.reviews[0].rating ? '#FFB01F' : colors.textMuted} 
                                                            fill={star <= booking.reviews[0].rating ? '#FFB01F' : 'none'} 
                                                        />
                                                    ))}
                                                </View>
                                                <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                                                    {new Date(booking.reviews[0].created_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            {booking.reviews[0].comment && (
                                                <Text style={[styles.reviewText, { color: colors.text }]}>
                                                    {booking.reviews[0].comment}
                                                </Text>
                                            )}
                                        </View>
                                    ) : (
                                        // Interactive review form
                                        <View style={[styles.reviewFormCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <Text style={[styles.reviewFormTitle, { color: colors.text }]}>Rate your experience</Text>
                                            
                                            {/* Stars selector */}
                                            <View style={styles.starsSelectorRow}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <TouchableOpacity 
                                                        key={star} 
                                                        onPress={() => setReviewRating(star)}
                                                        style={{ padding: 4 }}
                                                    >
                                                        <Star 
                                                            size={32} 
                                                            color={star <= reviewRating ? '#FFB01F' : '#CBD5E1'} 
                                                            fill={star <= reviewRating ? '#FFB01F' : 'none'} 
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* Quality tags - only for grooming */}
                                            {isGrooming && (
                                                <View style={{ marginTop: 16 }}>
                                                    <Text style={[styles.tagsLabel, { color: colors.textSecondary }]}>Grooming Quality Tags</Text>
                                                    <View style={styles.tagsContainer}>
                                                        {['Friendly', 'Punctual', 'Great Cut', 'Gentle with Pet', 'Clean Setup', 'Patient'].map(tag => {
                                                            const isSelected = selectedTags.includes(tag);
                                                            return (
                                                                <TouchableOpacity
                                                                    key={tag}
                                                                    onPress={() => {
                                                                        if (isSelected) {
                                                                            setSelectedTags(prev => prev.filter(t => t !== tag));
                                                                        } else {
                                                                            setSelectedTags(prev => [...prev, tag]);
                                                                        }
                                                                    }}
                                                                    style={StyleSheet.flatten([
                                                                        styles.tagChip,
                                                                        { backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary, borderColor: isSelected ? colors.primary : colors.border }
                                                                    ])}
                                                                >
                                                                    <Text style={[styles.tagChipText, { color: isSelected ? 'white' : colors.text }]}>
                                                                        {tag}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )}

                                            {/* Comment TextInput */}
                                            <Text style={[styles.tagsLabel, { color: colors.textSecondary, marginTop: 16 }]}>Leave a comment (Optional)</Text>
                                            <TextInput
                                                style={[styles.commentInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                                                placeholder="Share details of your pet's experience with the groomer..."
                                                placeholderTextColor={colors.textMuted}
                                                multiline={true}
                                                numberOfLines={3}
                                                value={reviewComment}
                                                onChangeText={setReviewComment}
                                            />

                                            {/* Submit Button */}
                                            <TouchableOpacity
                                                style={[styles.submitReviewBtn, { backgroundColor: colors.primary }]}
                                                onPress={handleSubmitReview}
                                                disabled={isSubmittingReview}
                                            >
                                                {isSubmittingReview ? (
                                                    <ActivityIndicator color="white" />
                                                ) : (
                                                    <Text style={styles.submitReviewBtnText}>SUBMIT REVIEW</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                            {/* Cancel Booking Section (for pending, requested, bidding) */}
                            {booking && ['pending', 'requested', 'bidding'].includes(booking.status) && (
                                <View style={styles.cancelActionSection}>
                                    <Text style={[styles.cancelTitle, { color: colors.text }]}>Cancel Booking Request</Text>
                                    <Text style={[styles.cancelSub, { color: colors.textSecondary }]}>
                                        You can cancel this request at any time before it is accepted by a provider. If active bids are present, they will be discarded.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.cancelBtn, { backgroundColor: '#e11d48' }]}
                                        onPress={handleDeleteBooking}
                                        disabled={isSubmittingAction}
                                    >
                                        {isSubmittingAction ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <AlertCircle size={20} color="white" />
                                                <Text style={styles.cancelBtnText}>CANCEL REQUEST</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    ) : null}
                </BlurView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    container: {
        width: '100%',
        height: '90%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 80,
    },
    summaryCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    serviceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    petName: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
    },
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    providerAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerName: {
        fontSize: 14,
        fontWeight: '900',
    },
    providerSub: {
        fontSize: 11,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 12,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 12,
        marginTop: 16,
    },
    progressCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 8,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    walkCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    walkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    walkNum: {
        fontSize: 14,
        fontWeight: '900',
    },
    walkStatus: {
        fontSize: 12,
        fontWeight: '900',
    },
    walkTime: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    walkNotes: {
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    proofPhoto: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        marginTop: 8,
    },
    mapContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '700',
        fontStyle: 'italic',
    },
    incompleteSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    incompleteDesc: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionGridBtn: {
        flex: 1,
        minWidth: '45%',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionGridBtnText: {
        fontSize: 11,
        fontWeight: '900',
    },
    rescheduleBox: {
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    rescheduleTitle: {
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 8,
    },
    rescheduleInput: {
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    rescheduleSubmit: {
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rescheduleSubmitText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    groomingBox: {
        gap: 16,
    },
    checklistCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 12,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    checkText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    notesText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    photoContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    photoColumn: {
        flex: 1,
    },
    photoColumnTitle: {
        fontSize: 11,
        fontWeight: '900',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    groomingPhoto: {
        width: '100%',
        height: 120,
        borderRadius: 12,
    },
    photoPlaceholder: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportLabel: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    reportText: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    productsTagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    productTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    escrowActionSection: {
        marginTop: 16,
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        gap: 8,
    },
    escrowTitle: {
        fontSize: 15,
        fontWeight: '900',
    },
    escrowSub: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 12,
        fontWeight: '600',
    },
    releaseBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    releaseBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    reviewCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 8 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewDate: { fontSize: 11, fontWeight: '700' },
    reviewText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
    reviewFormCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginTop: 8, alignItems: 'center', width: '100%' },
    reviewFormTitle: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
    starsSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    tagsLabel: { fontSize: 12, fontWeight: '900', alignSelf: 'flex-start', marginBottom: 8 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    tagChipText: { fontSize: 11, fontWeight: '800' },
    commentInput: { width: '100%', height: 64, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 13, fontWeight: '600', textAlignVertical: 'top', marginTop: 4 },
    submitReviewBtn: { width: '100%', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    submitReviewBtnText: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    cancelActionSection: {
        marginTop: 16,
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(225, 29, 72, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(225, 29, 72, 0.1)',
        alignItems: 'center',
        gap: 8,
    },
    cancelTitle: {
        fontSize: 15,
        fontWeight: '900',
    },
    cancelSub: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 12,
        fontWeight: '600',
    },
    cancelBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cancelBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
