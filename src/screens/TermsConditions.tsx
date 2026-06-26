import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function TermsConditions({ navigation }: any) {
    const { colors } = useTheme();

    const terms = [
        {
            title: "1. Acceptance of Terms",
            content: "By accessing and using the Pawber application, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use the service."
        },
        {
            title: "2. Service Description",
            content: "Pawber provides a platform for pet owners to book various pet services, including grooming, vet visits, and walking. We act as an intermediary between users and service providers."
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
            content: "Pawber is not liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services."
        }
    ];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Conditions</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.introText, { color: colors.textSecondary }]}>
                            Please read these Terms & Conditions carefully before using our platform. Your use of the platform denotes your agreement to these terms.
                        </Text>

                        <View style={styles.termsContainer}>
                            {terms.map((term, index) => (
                                <View key={index} style={styles.termSection}>
                                    <Text style={[styles.termTitle, { color: colors.text }]}>{term.title}</Text>
                                    <Text style={[styles.termContent, { color: colors.textSecondary }]}>{term.content}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.acknowledgment, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                        <Text style={[styles.acknowledgmentText, { color: colors.textMuted }]}>
                            By continuing to use Pawber, you acknowledge that you have read and understood these Terms and Conditions.
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
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
    },
    introText: {
        fontSize: 14,
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
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    termContent: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
    },
    acknowledgment: {
        marginTop: 24,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    acknowledgmentText: {
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 18,
    },
});
