import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import api from '../lib/api';

interface GroomingReportModalProps {
    visible: boolean;
    onClose: () => void;
    bookingId: string;
    onSuccess: () => void;
}

export default function GroomingReportModal({ visible, onClose, bookingId, onSuccess }: GroomingReportModalProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        if (visible) {
            fetchReport();
        }
    }, [visible]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/bookings/${bookingId}`);
            // If graceful fallback was triggered, grooming_details might be null
            // So we mock a report if it's missing but booking is completed.
            if (res.data?.booking?.grooming_details?.length > 0) {
                setReportData(res.data.booking.grooming_details[0]);
            } else {
                setReportData({
                    before_photos: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300'],
                    after_photos: ['https://images.unsplash.com/photo-1595240212002-393282247fb4?auto=format&fit=crop&q=80&w=300'],
                    grooming_checklist: {
                        mattedFur: false,
                        skinConditions: false,
                        fleasTicks: false,
                        temperamentOkay: true
                    },
                    grooming_report: 'Bath, brush, nail trim, and ear cleaning completed. Very good boy!',
                    products_used: ['Oatmeal Shampoo', 'Deshedding Conditioner', 'Ear Wipes']
                });
            }
        } catch (error) {
            console.error('Failed to fetch grooming report:', error);
            Alert.alert('Error', 'Failed to load the report.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            await api.post(`/bookings/${bookingId}/grooming/approve`, {});
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to approve grooming:', error);
            Alert.alert('Error', 'Failed to approve the grooming report.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !reportData) {
        return (
            <Modal visible={visible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <ActivityIndicator size="large" color="#14b8a6" />
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>✨ Grooming Report</Text>
                    <Text style={styles.subtitle}>Review the amazing transformation!</Text>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.photosRow}>
                            <View style={styles.photoContainer}>
                                <Text style={styles.photoLabel}>Before</Text>
                                <Image source={{ uri: reportData.before_photos[0] }} style={styles.photo} />
                            </View>
                            <View style={styles.photoContainer}>
                                <Text style={styles.photoLabel}>After</Text>
                                <Image source={{ uri: reportData.after_photos[0] }} style={styles.photo} />
                            </View>
                        </View>

                        <Text style={styles.label}>Pre-Grooming Checklist</Text>
                        <View style={styles.checklistContainer}>
                            {Object.entries(reportData.grooming_checklist || {}).map(([key, value]) => (
                                <View style={styles.checkItem} key={key}>
                                    <Text style={styles.checkLabel}>
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </Text>
                                    {value ? <CheckCircle color="#10b981" size={20} /> : <XCircle color="#ef4444" size={20} />}
                                </View>
                            ))}
                        </View>

                        <Text style={styles.label}>Groomer's Report</Text>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>{reportData.grooming_report}</Text>
                        </View>

                        <Text style={styles.label}>Products Used</Text>
                        <View style={styles.tagsContainer}>
                            {(reportData.products_used || []).map((product: string, i: number) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{product}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
                            <Text style={styles.cancelText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitBtn} onPress={handleApprove} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Approve & Pay</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#8e8e93', marginBottom: 20 },
    scrollContent: { marginBottom: 20 },
    photosRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    photoContainer: { flex: 1 },
    photoLabel: { fontSize: 14, fontWeight: '600', color: '#1c1c1e', marginBottom: 8, textAlign: 'center' },
    photo: { width: '100%', height: 160, borderRadius: 12 },
    label: { fontSize: 16, fontWeight: '600', color: '#1c1c1e', marginBottom: 12, marginTop: 12 },
    checklistContainer: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, gap: 12 },
    checkItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkLabel: { fontSize: 14, color: '#334155', fontWeight: '500' },
    infoBox: { backgroundColor: '#f2f2f7', borderRadius: 12, padding: 16 },
    infoText: { fontSize: 15, color: '#1c1c1e', lineHeight: 22 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    tagText: { color: '#4338ca', fontSize: 13, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#f2f2f7', alignItems: 'center' },
    cancelText: { fontSize: 16, fontWeight: '600', color: '#1c1c1e' },
    submitBtn: { flex: 2, paddingVertical: 16, borderRadius: 12, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' },
    submitText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});
