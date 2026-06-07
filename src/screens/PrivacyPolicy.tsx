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

export default function PrivacyPolicy({ navigation }: any) {
    const sections = [
        {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us."
        },
        {
            title: "2. How We Use Information",
            content: "We use the information we collect to provide, maintain, and improve our services, such as to facilitate payments, send receipts, and provide customer support."
        },
        {
            title: "3. Sharing of Information",
            content: "We may share the information we collect about you as described in this statement or as described at the time of collection or sharing, including sharing with third-party service providers."
        },
        {
            title: "4. Your Choices",
            content: "You may update, correct, or delete information about you at any time by logging into your online account or emailing us at support@pawber.com."
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#1A1612" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy Policy</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.lastUpdated}>
                            Last Updated: January 2024
                        </Text>
                        <Text style={styles.introText}>
                            At Pawber, we take your privacy seriously. Please read this Privacy Policy carefully to understand how we collect, use, and protect your personal data.
                        </Text>

                        <View style={styles.sectionsContainer}>
                            {sections.map((section, index) => (
                                <View key={index} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                    <Text style={styles.sectionContent}>{section.content}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Questions? Contact us at legal@pawber.com
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
        borderColor: '#F5E6D8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1612',
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
        borderColor: '#F5E6D8',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
    },
    lastUpdated: {
        fontSize: 12,
        color: '#B09080',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    introText: {
        fontSize: 14,
        color: '#7A5540',
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '500',
    },
    sectionsContainer: {
        gap: 32,
    },
    section: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1A1612',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionContent: {
        fontSize: 13,
        color: '#7A5540',
        lineHeight: 20,
        fontWeight: '500',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#B09080',
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
});
