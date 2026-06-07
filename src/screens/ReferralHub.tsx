import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    
    Share,
    Dimensions,
    ActivityIndicator,
    Clipboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    Gift, 
    Copy, 
    Share2, 
    Users, 
    ArrowLeft, 
    CheckCircle2, 
    ChevronRight,
    Star,
    Sparkles
} from 'lucide-react-native';
import { loyaltyApi } from '../services/loyalty.service';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function ReferralHub({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [referralInfo, setReferralInfo] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchReferralInfo();
    }, []);

    const fetchReferralInfo = async () => {
        setLoading(true);
        try {
            const res = await loyaltyApi.getReferralInfo();
            if (res.success) {
                setReferralInfo(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch referrals:', error);
        } finally {
            setLoading(false);
        }
    };

    const onShare = async () => {
        try {
            await Share.share({
                message: `Hey! Use my referral code ${referralInfo?.code} to get ₹200 off on your first pet service with Pawber! 🐾 Download now: https://pawber.app`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = () => {
        Clipboard.setString(referralInfo?.code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <View style={StyleSheet.flatten([styles.loadingCenter, { backgroundColor: colors.background }])}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
            <View style={StyleSheet.flatten([styles.header, { paddingTop: Math.max(insets.top, 16) }])}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={StyleSheet.flatten([styles.backBtn, { backgroundColor: colors.surface }])}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={StyleSheet.flatten([styles.headerTitle, { color: colors.text }])}>Refer & Earn</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Feature */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIconBg}>
                        <Gift size={40} color="white" />
                        <Sparkles size={20} color="#fbbf24" style={styles.heroSparkle} />
                    </View>
                    <Text style={styles.heroTitle}>Give ₹200, Get ₹200</Text>
                    <Text style={styles.heroSubtitle}>Invite a friend to Pawber. They get ₹200 off their first booking, and you get ₹200 credits too! ✨</Text>
                    
                    <View style={styles.codeContainer}>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                            <Text style={styles.codeValue}>{referralInfo?.code || 'PAWBER500'}</Text>
                        </View>
                        <View style={styles.codeActions}>
                            <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                                <Copy size={20} color={copied ? '#FF7A3D' : '#7A5540'} />
                                <Text style={StyleSheet.flatten([styles.actionText, copied && { color: '#FF7A3D' }])}>{copied ? 'Copied' : 'Copy'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                                <Share2 size={20} color="#FF7A3D" />
                                <Text style={StyleSheet.flatten([styles.actionText, { color: '#FF7A3D' }])}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* How it Works */}
                <Text style={StyleSheet.flatten([styles.sectionTitle, { color: colors.text }])}>HOW IT WORKS</Text>
                <View style={styles.stepList}>
                    {[
                        { icon: Share2, title: 'Share Code', desc: 'Send your referral code to your friends.' },
                        { icon: Users, title: 'Friend Joins', desc: 'They sign up and book their first service.' },
                        { icon: Star, title: 'Both Earn ₹200', desc: 'Credits are added once the service is done!' },
                    ].map((step, i) => (
                        <View key={i} style={styles.stepItem}>
                            <View style={StyleSheet.flatten([styles.stepIconBox, { backgroundColor: isDark ? 'rgba(249,115,22,0.1)' : '#E0F5F0' }])}>
                                <step.icon size={20} color="#1D9E86" />
                            </View>
                            <View style={styles.stepText}>
                                <Text style={StyleSheet.flatten([styles.stepTitle, { color: colors.text }])}>{step.title}</Text>
                                <Text style={StyleSheet.flatten([styles.stepDesc, { color: colors.textSecondary }])}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* My Referrals */}
                <View style={styles.referralsHeader}>
                    <Text style={StyleSheet.flatten([styles.sectionTitle, { color: colors.text }])}>MY REFERRALS</Text>
                    <Text style={StyleSheet.flatten([styles.referralCount, { color: colors.primary }])}>{referralInfo?.referrals?.length || 0} INVITED</Text>
                </View>

                <View style={styles.referralsList}>
                    {referralInfo?.referrals?.length > 0 ? (
                        referralInfo.referrals.map((ref: any) => (
                            <View key={ref.id} style={StyleSheet.flatten([styles.referralItem, { backgroundColor: colors.surface }])}>
                                <View style={styles.refInfo}>
                                    <Text style={StyleSheet.flatten([styles.refName, { color: colors.text }])}>{ref.referee?.full_name || 'Guest User'}</Text>
                                    <Text style={StyleSheet.flatten([styles.refDate, { color: colors.textMuted }])}>{new Date(ref.created_at).toLocaleDateString().toUpperCase()}</Text>
                                </View>
                                <View style={StyleSheet.flatten([styles.refStatus, { backgroundColor: colors.surfaceSecondary }, ref.status === 'completed' && styles.refStatusCompleted])}>
                                    <Text style={StyleSheet.flatten([styles.refStatusText, { color: colors.textSecondary }, ref.status === 'completed' && styles.refStatusTextCompleted])}>
                                        {ref.status === 'completed' ? '+₹200 EARNED' : 'PENDING'}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={StyleSheet.flatten([styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.borderSecondary }])}>
                            <Users size={40} color={colors.borderSecondary} />
                            <Text style={StyleSheet.flatten([styles.emptyText, { color: colors.textMuted }])}>No referrals yet. Spread the word! 🐾</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF9F5', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A1612' },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    heroCard: { backgroundColor: '#1A1612', borderRadius: 40, padding: 32, alignItems: 'center', marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    heroIconBg: { width: 90, height: 90, borderRadius: 32, backgroundColor: '#FF7A3D', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    heroSparkle: { position: 'absolute', top: -5, right: -5 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: 'white', marginBottom: 12 },
    heroSubtitle: { fontSize: 13, color: '#B09080', textAlign: 'center', lineHeight: 22, fontWeight: '600', marginBottom: 32 },
    codeContainer: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
    codeBox: { alignItems: 'center', marginBottom: 20 },
    codeLabel: { fontSize: 10, fontWeight: '900', color: '#FF7A3D', letterSpacing: 2, marginBottom: 8 },
    codeValue: { fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: 5 },
    codeActions: { flexDirection: 'row', gap: 12 },
    copyBtn: { flex: 1, height: 50, backgroundColor: 'white', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    shareBtn: { flex: 1, height: 50, backgroundColor: '#FFF3EC', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    actionText: { fontSize: 12, fontWeight: '900' },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#1A1612', letterSpacing: 1.5, marginBottom: 20 },
    stepList: { gap: 20, marginBottom: 40 },
    stepItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E0F5F0', alignItems: 'center', justifyContent: 'center' },
    stepText: { flex: 1 },
    stepTitle: { fontSize: 15, fontWeight: '800', color: '#1A1612', marginBottom: 2 },
    stepDesc: { fontSize: 12, color: '#7A5540', fontWeight: '600' },
    referralsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    referralCount: { fontSize: 10, fontWeight: '900', color: '#FF7A3D' },
    referralsList: { gap: 12 },
    referralItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF9F5', borderRadius: 24 },
    refInfo: { gap: 4 },
    refName: { fontSize: 15, fontWeight: '800', color: '#1A1612' },
    refDate: { fontSize: 9, fontWeight: '900', color: '#B09080', letterSpacing: 0.5 },
    refStatus: { backgroundColor: '#F5E6D8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    refStatusCompleted: { backgroundColor: '#ccfbf1' },
    refStatusText: { fontSize: 9, fontWeight: '900', color: '#7A5540' },
    refStatusTextCompleted: { color: '#FF7A3D' },
    emptyBox: { padding: 40, alignItems: 'center', gap: 12, backgroundColor: '#FFF9F5', borderRadius: 32, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#DEC9B5' },
    emptyText: { fontSize: 13, fontWeight: '800', color: '#B09080' },
});
