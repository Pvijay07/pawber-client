import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

export default function TermsConditions({ navigation }: any) {
    const terms = [
        {
            title: "1. Acceptance of Terms",
            content: "By accessing and using the PetCare application, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use the service."
        },
        {
            title: "2. Service Description",
            content: "PetCare provides a platform for pet owners to book various pet services, including grooming, vet visits, and walking. We act as an intermediary between users and service providers."
        },
        {
            title: "3. User Responsibilities",
            content: "Users are responsible for providing accurate information about their pets and ensuring that their pets are fit for mortality and the services requested."
        },
        {
            title: "4. Payment and Refunds",
            content: "Payments are processed through our secure gateway. Refunds are subject to our cancellation policy, which can be found in the Help & Support section."
        },
        {
            title: "5. Limitation of Liability",
            content: "PetCare is not liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services."
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Terms & Conditions</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.introText}>
                            Please read these Terms & Conditions carefully before using our platform. Your use of the platform denotes your agreement to these terms.
                        </Text>

                        <View style={styles.termsContainer}>
                            {terms.map((term, index) => (
                                <View key={index} style={styles.termSection}>
                                    <Text style={styles.termTitle}>{term.title}</Text>
                                    <Text style={styles.termContent}>{term.content}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.acknowledgment}>
                        <Text style={styles.acknowledgmentText}>
                            By continuing to use PetCare, you acknowledge that you have read and understood these Terms and Conditions.
                        </Text>
                    </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
    },
    introText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '500',
    },
    termsContainer: {
        gap: 32,
    },
    termSection: {
        gap: 8,
    },
    termTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    termContent: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        fontWeight: '500',
    },
    acknowledgment: {
        marginTop: 24,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    acknowledgmentText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 18,
    },
});
