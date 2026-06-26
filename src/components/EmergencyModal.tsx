import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface EmergencyModalProps {
    visible: boolean;
    onClose: () => void;
    bookingId?: string;
    providerId?: string;
}

export default function EmergencyModal({ visible, onClose, bookingId, providerId }: EmergencyModalProps) {
    const [caseType, setCaseType] = useState<string>('lost_pet');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const EMERGENCY_TYPES = [
        { id: 'lost_pet', label: 'Lost Pet', icon: 'paw', color: '#ff3b30' },
        { id: 'medical_emergency', label: 'Medical Emergency', icon: 'medical', color: '#ff9500' },
        { id: 'safety_concerns', label: 'Safety Concern', icon: 'warning', color: '#ffcc00' },
        { id: 'provider_no_show', label: 'Provider No-Show', icon: 'time', color: '#5856d6' }
    ];

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Required', 'Please provide a brief description of the emergency.');
            return;
        }

        setLoading(true);
        try {
            // Send SOS to backend
            await api.post('/emergencies', {
                caseType,
                description,
                bookingId,
                providerId
            });

            Alert.alert(
                'SOS Triggered', 
                'Our support team has been notified and will contact you immediately. Please stay safe.',
                [
                    { 
                        text: 'Call Emergency Support (911)', 
                        onPress: () => Linking.openURL('tel:911'),
                        style: 'destructive'
                    },
                    {
                        text: 'Close',
                        onPress: () => {
                            setDescription('');
                            onClose();
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('Failed to trigger SOS:', error);
            Alert.alert('Error', 'Failed to submit emergency ticket. Please try calling instead.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="alert-circle" size={32} color="#ff3b30" />
                        </View>
                        <Text style={styles.title}>Emergency SOS</Text>
                        <Text style={styles.subtitle}>Triggering an SOS will immediately alert the Pawber Support team.</Text>
                    </View>

                    <Text style={styles.label}>What is the emergency?</Text>
                    <View style={styles.typesContainer}>
                        {EMERGENCY_TYPES.map(type => (
                            <TouchableOpacity
                                key={type.id}
                                style={[styles.typeOption, caseType === type.id && { borderColor: type.color, backgroundColor: `${type.color}15` }]}
                                onPress={() => setCaseType(type.id)}
                            >
                                <Ionicons name={type.icon as any} size={24} color={caseType === type.id ? type.color : '#8e8e93'} />
                                <Text style={[styles.typeText, caseType === type.id && { color: type.color, fontWeight: '600' }]}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Description & Location Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Please describe what happened..."
                        placeholderTextColor="#a1a1aa"
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="warning" size={20} color="#fff" />
                                    <Text style={styles.submitText}>Trigger SOS</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40
    },
    header: {
        alignItems: 'center',
        marginBottom: 24
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ff3b3015',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1c1c1e',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 15,
        color: '#8e8e93',
        textAlign: 'center',
        lineHeight: 20
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1c1e',
        marginBottom: 12,
        marginTop: 8
    },
    typesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e5ea',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: '48%'
    },
    typeText: {
        fontSize: 14,
        color: '#8e8e93',
        marginLeft: 8
    },
    input: {
        backgroundColor: '#f2f2f7',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1c1c1e',
        textAlignVertical: 'top',
        height: 100,
        marginBottom: 24
    },
    actions: {
        flexDirection: 'row',
        gap: 12
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f2f2f7',
        alignItems: 'center'
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1c1e'
    },
    submitBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#ff3b30',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    submitText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff'
    }
});
