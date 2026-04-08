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
    Switch,
    Platform,
} from 'react-native';
import {
    User,
    Settings,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Edit2,
    MapPin,
    ShieldCheck,
    FileText,
    Star,
    Gift,
    Crown,
    Share2,
    Moon,
    HelpCircle,
    MessageCircle,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface ProfileProps {
    navigation: any;
}

export default function Profile({ navigation }: ProfileProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const stats = [
        { label: 'Orders', value: '12', icon: FileText, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
        { label: 'Points', value: '2.4k', icon: Star, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
        { label: 'Saves', value: '₹4k', icon: Gift, color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' },
    ];

    const menuItems = [
        { id: 'Addresses', label: 'My Addresses', icon: MapPin, color: '#3b82f6', bgColor: '#eff6ff' },
        { id: 'Notifications', label: 'Notifications', icon: Bell, color: '#f97316', bgColor: '#fff7ed' },
        { id: 'Loyalty', label: 'Refer & Earn', icon: Share2, color: '#14b8a6', bgColor: '#f0fdfa' },
        { id: 'Help', label: 'Help & Support', icon: HelpCircle, color: '#a855f7', bgColor: '#faf5ff' },
        { id: 'PrivacyPolicy', label: 'Privacy Policy', icon: ShieldCheck, color: '#14b8a6', bgColor: '#f0fdfa' },
        { id: 'TermsConditions', label: 'Terms & Conditions', icon: FileText, color: '#64748b', bgColor: '#f8fafc' },
    ];

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        // Navigation will be handled by session listener
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200' }}
                                style={styles.avatar}
                            />
                        </View>
                        <TouchableOpacity style={styles.editBtn}>
                            <Edit2 size={16} color="white" />
                        </TouchableOpacity>
                        <View style={styles.levelBadge}>
                            <Crown size={10} color="white" fill="white" />
                            <Text style={styles.levelText}>GOLD</Text>
                        </View>
                    </View>

                    <Text style={styles.userName}>Sarah Jenkins</Text>
                    <Text style={styles.userSince}>MEMBER SINCE OCT 2022</Text>

                    <View style={styles.statsRow}>
                        {stats.map((s, i) => (
                            <View key={i} style={styles.statBox}>
                                <View style={[styles.statIconBox, { backgroundColor: s.bgColor }]}>
                                    <s.icon size={20} color={s.color} />
                                </View>
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label.toUpperCase()}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Menu Section */}
                <View style={styles.menuContainer}>
                    <View style={styles.darkModeRow}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#f1f5f9' }]}>
                                <Moon size={20} color="#0f172a" />
                            </View>
                            <Text style={styles.menuLabel}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: '#cbd5e1', true: '#14b8a6' }}
                            thumbColor="white"
                        />
                    </View>

                    <View style={styles.divider} />

                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => navigation.navigate(item.id)}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconBox, { backgroundColor: item.bgColor }]}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <ChevronRight size={18} color="#cbd5e1" />
                        </TouchableOpacity>
                    ))}

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                        <LogOut size={18} color="#ef4444" />
                        <Text style={styles.signOutText}>SIGN OUT ACCOUNT</Text>
                    </TouchableOpacity>
                </View>

                {/* Promo Section */}
                <View style={styles.promoCard}>
                    <Gift size={36} color="rgba(255,255,255,0.2)" style={styles.promoBgIcon} />
                    <Text style={styles.promoTitle}>Refer a Pet Parent</Text>
                    <Text style={styles.promoSubtitle}>Share the love! Get ₹500 credits for every friend who books their first service.</Text>
                    <View style={styles.referralRow}>
                        <View style={styles.referralCodeBox}>
                            <Text style={styles.referralCode}>PAWBER500</Text>
                        </View>
                        <TouchableOpacity style={styles.shareButton}>
                            <Share2 size={24} color="#14b8a6" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Help Card */}
                <View style={styles.helpCard}>
                    <View style={styles.helpIconBox}>
                        <MessageCircle size={28} color="#3b82f6" />
                    </View>
                    <View style={styles.helpContent}>
                        <Text style={styles.helpTitle}>Need Help?</Text>
                        <Text style={styles.helpSubtitle}>Our pet experts are available 24/7 for you.</Text>
                        <TouchableOpacity>
                            <Text style={styles.contactLink}>CONTACT SUPPORT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#0f172a',
        paddingTop: 40,
        paddingBottom: 40,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    editBtn: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 36,
        height: 36,
        backgroundColor: '#14b8a6',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#0f172a',
    },
    levelBadge: {
        position: 'absolute',
        top: -10,
        left: -10,
        backgroundColor: '#f97316',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#0f172a',
        gap: 4,
    },
    levelText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    userSince: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    statBox: {
        alignItems: 'center',
        gap: 6,
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    menuContainer: {
        backgroundColor: 'white',
        marginHorizontal: 24,
        marginTop: -24,
        borderRadius: 40,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 24,
    },
    darkModeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        backgroundColor: '#fff1f2',
        borderRadius: 20,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ffe4e6',
    },
    signOutText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#ef4444',
        letterSpacing: 1,
    },
    promoCard: {
        backgroundColor: '#14b8a6',
        marginHorizontal: 24,
        borderRadius: 40,
        padding: 32,
        marginBottom: 24,
        overflow: 'hidden',
    },
    promoBgIcon: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    promoTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    promoSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 20,
        marginBottom: 24,
        fontWeight: '500',
    },
    referralRow: {
        flexDirection: 'row',
        gap: 12,
    },
    referralCodeBox: {
        flex: 1,
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    referralCode: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    shareButton: {
        width: 56,
        height: 56,
        backgroundColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 20,
    },
    helpIconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    helpSubtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 8,
    },
    contactLink: {
        fontSize: 11,
        fontWeight: '900',
        color: '#3b82f6',
        letterSpacing: 1,
    },
});
