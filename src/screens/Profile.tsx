import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTheme } from '../theme/ThemeContext';
import { authApi } from '../services/auth.service';
import { loyaltyApi } from '../services/loyalty.service';
import { walletApi } from '../services/wallet.service';
import { bookingsApi } from '../services/bookings.service';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface ProfileProps {
    navigation: any;
}

export default function Profile({ navigation }: ProfileProps) {
    const insets = useSafeAreaInsets();
    const { colors, isDark, toggleTheme } = useTheme();
    const isFocused = useIsFocused();
    
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: 'Orders', value: '0', icon: FileText, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
        { label: 'Points', value: '0', icon: Star, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
        { label: 'Saves', value: '₹0', icon: Gift, color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' },
    ]);

    React.useEffect(() => {
        if (isFocused) {
            fetchProfileData();
        }
    }, [isFocused]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const profileRes = await authApi.getProfile();
            if (profileRes?.success && profileRes.data?.user) {
                setUserData(profileRes.data.user);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { id: 'Addresses', label: 'My Addresses', icon: MapPin, color: '#3b82f6', bgColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
        { id: 'Notifications', label: 'Notifications', icon: Bell, color: '#f97316', bgColor: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed' },
        { id: 'ReferralHub', label: 'Refer & Earn', icon: Share2, color: colors.primary, bgColor: colors.primaryLight },
        { id: 'AIChatScreen', label: 'AI Support Chat', icon: MessageCircle, color: '#3b82f6', bgColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
        { id: 'Help', label: 'Help & Knowledge Base', icon: HelpCircle, color: '#a855f7', bgColor: isDark ? 'rgba(168,85,247,0.1)' : '#faf5ff' },
        { id: 'PrivacyPolicy', label: 'Privacy Policy', icon: ShieldCheck, color: colors.primary, bgColor: colors.primaryLight },
        { id: 'TermsConditions', label: 'Terms & Conditions', icon: FileText, color: colors.textSecondary, bgColor: colors.surfaceSecondary },
    ];

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        // Navigation will be handled by session listener
    };

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 16, backgroundColor: isDark ? colors.surface : '#0f172a' }]}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: userData?.avatar_url || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200' }}
                                style={styles.avatar}
                            />
                        </View>
                        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
                            <Edit2 size={14} color="white" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{userData?.full_name || 'Loading...'}</Text>
                    <Text style={styles.userSince}>
                        MEMBER SINCE {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : '...'}
                    </Text>

                    <View style={styles.statsRow}>
                        {stats.map((s, i) => (
                            <View key={i} style={styles.statBox}>
                                <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                    <s.icon size={18} color="white" />
                                </View>
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label.toUpperCase()}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Menu Section */}
                <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.darkModeRow}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceSecondary }]}>
                                <Moon size={20} color={colors.text} />
                            </View>
                            <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.borderSecondary, true: colors.primary }}
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
                                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                            </View>
                            <ChevronRight size={18} color={colors.borderSecondary} />
                        </TouchableOpacity>
                    ))}

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                        <LogOut size={18} color="#ef4444" />
                        <Text style={styles.signOutText}>SIGN OUT ACCOUNT</Text>
                    </TouchableOpacity>
                </View>

                {/* Promo Section */}
                <TouchableOpacity 
                    style={styles.promoCard} 
                    onPress={() => navigation.navigate('ReferralHub')}
                >
                    <Gift size={36} color="rgba(255,255,255,0.2)" style={styles.promoBgIcon} />
                    <Text style={styles.promoTitle}>Refer a Pet Parent</Text>
                    <Text style={styles.promoSubtitle}>Share the love! Get ₹200 for every friend who books their first service.</Text>
                    <View style={styles.referralRow}>
                        <View style={styles.referralCodeBox}>
                            <Text style={styles.referralCode}>REFER & EARN</Text>
                        </View>
                        <View style={styles.shareButton}>
                            <Share2 size={24} color="#14b8a6" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Help Card */}
                <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.helpIconBox, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' }]}>
                        <MessageCircle size={28} color="#3b82f6" />
                    </View>
                    <View style={styles.helpContent}>
                        <Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
                        <Text style={[styles.helpSubtitle, { color: colors.textSecondary }]}>Our pet experts are available 24/7 for you.</Text>
                        <TouchableOpacity>
                            <Text style={styles.contactLink}>CONTACT SUPPORT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#0f172a',
        paddingBottom: 48,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 108,
        height: 108,
        borderRadius: 44,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        backgroundColor: '#1e293b',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    editBtn: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 32,
        height: 32,
        backgroundColor: '#14b8a6',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#0f172a',
        shadowColor: '#14b8a6',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    levelBadge: {
        position: 'absolute',
        top: -6,
        left: -12,
        backgroundColor: '#f97316',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0f172a',
        gap: 4,
        shadowColor: '#f97316',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    levelText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    userName: {
        fontSize: 26,
        fontWeight: '900',
        color: 'white',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    userSince: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 36,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 10,
    },
    statBox: {
        alignItems: 'center',
        gap: 8,
    },
    statIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 19,
        fontWeight: '900',
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
        marginTop: -32,
        borderRadius: 36,
        padding: 24,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 10,
        marginBottom: 24,
    },
    darkModeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 4,
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
        fontWeight: '800',
        color: '#0f172a',
    },
    divider: {
        height: 1.5,
        backgroundColor: '#f8fafc',
        marginVertical: 12,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 58,
        backgroundColor: '#fff1f2',
        borderRadius: 20,
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: '#ffe4e6',
    },
    signOutText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#ef4444',
        letterSpacing: 1.2,
    },
    promoCard: {
        backgroundColor: '#14b8a6',
        marginHorizontal: 24,
        borderRadius: 36,
        padding: 28,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#14b8a6',
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 6,
    },
    promoBgIcon: {
        position: 'absolute',
        top: -10,
        right: -10,
        opacity: 0.2,
    },
    promoTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
        marginBottom: 8,
    },
    promoSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
        marginBottom: 24,
        fontWeight: '600',
    },
    referralRow: {
        flexDirection: 'row',
        gap: 12,
    },
    referralCodeBox: {
        flex: 1,
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    referralCode: {
        color: 'white',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 2,
    },
    shareButton: {
        width: 56,
        height: 56,
        backgroundColor: 'white',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        backgroundColor: 'white',
        borderRadius: 36,
        padding: 24,
        borderWidth: 2,
        borderColor: '#f8fafc',
        gap: 16,
        marginBottom: 20,
    },
    helpIconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 4,
    },
    helpSubtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 10,
    },
    contactLink: {
        fontSize: 11,
        fontWeight: '900',
        color: '#3b82f6',
        letterSpacing: 1.2,
    },
});
