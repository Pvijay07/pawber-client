import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    
    Dimensions,
    LayoutAnimation,
    Switch,
    Platform,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    FileText,
    Filter,
    RefreshCcw,
    ShieldCheck,
    Zap,
    ArrowRight,
    Star,
    Crown,
    History as HistoryIcon,
} from 'lucide-react-native';
import { walletApi } from '../services/wallet.service';
import { useTheme } from '../theme/ThemeContext';
import { Wallet as WalletType, WalletTransaction } from '../shared/types';

const { width } = Dimensions.get('window');

interface WalletProps {
    navigation: any;
}

export default function Wallet({ navigation }: WalletProps) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [tab, setTab] = useState<'cash' | 'points'>('cash');
    const [filter, setFilter] = useState<'all' | 'services' | 'topups' | 'refunds' | 'rewards'>('all');
    const [autoRecharge, setAutoRecharge] = useState(false);
    
    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchWalletData();
    }, [filter]);

    const fetchWalletData = async () => {
        setIsLoading(true);
        try {
            const [walletRes, txRes] = await Promise.all([
                walletApi.get(),
                walletApi.getTransactions({ type: filter === 'all' ? undefined : filter })
            ]);
            
            if (walletRes.success && walletRes.data) {
                setWallet(walletRes.data.wallet);
                setAutoRecharge(walletRes.data.wallet.auto_recharge || false);
            }
            if (txRes.success && txRes.data) {
                setTransactions(txRes.data.transactions);
            }
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTxVisuals = (type: string) => {
        switch (type) {
            case 'credit': return { icon: ArrowDownLeft, color: colors.primary, bgColor: 'rgba(255, 122, 61, 0.1)' };
            case 'debit': return { icon: ArrowUpRight, color: colors.accent, bgColor: 'rgba(29, 158, 134, 0.1)' };
            case 'refund': return { icon: RefreshCcw, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' };
            default: return { icon: ArrowUpRight, color: colors.textSecondary, bgColor: 'rgba(148, 163, 184, 0.1)' };
        }
    };

    return (
        <View style={{ ...styles.safeArea, backgroundColor: colors.background }}>
            {/* Background Decorative Elements */}
            <View style={[styles.bgBlob, { top: -50, right: -50, backgroundColor: 'rgba(255, 122, 61, 0.08)' }]} />
            <View style={[styles.bgBlob, { bottom: 100, left: -80, backgroundColor: 'rgba(29, 158, 134, 0.05)' }]} />

            <View style={styles.container}>
                {/* Header */}
                <View style={{ ...styles.header, paddingTop: Math.max(insets.top, 20) + 10 }}>
                    <Text style={{ ...styles.headerTitle, color: colors.text }}>Wallet</Text>
                    <TouchableOpacity style={{ ...styles.headerBtn, backgroundColor: colors.surface }}>
                        <Filter size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
                    {/* Main Card */}
                    <LinearGradient
                        colors={isDark ? ['#2D2824', '#1A1612'] : ['#1A1612', '#2D2824']}
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceHeader}>
                            <View style={styles.balanceSection}>
                                <Text style={{ ...styles.totalBalanceLabel, color: colors.primary }}>WALLET CASH</Text>
                                <Text style={styles.balanceAmount}>₹{wallet?.balance?.toFixed(0) || '0'}</Text>
                            </View>
                            <View style={styles.dividerVertical} />
                            <View style={styles.balanceSection}>
                                <Text style={{ ...styles.totalBalanceLabel, color: colors.accent }}>LOYALTY POINTS</Text>
                                <View style={styles.pointsRow}>
                                    <Star size={18} color={colors.accent} fill={colors.accent} />
                                    <Text style={styles.balanceAmount}>{wallet?.points_balance || '0'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.addFundsBtn}>
                                <LinearGradient
                                    colors={['#FF7A3D', '#FF9D6C']}
                                    style={StyleSheet.absoluteFill}
                                    borderRadius={16}
                                />
                                <Plus size={18} color="white" />
                                <Text style={styles.addFundsText}>ADD FUNDS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.invoiceBtn}>
                                <FileText size={18} color="white" />
                                <Text style={styles.invoiceText}>INVOICES</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Settings Row */}
                    <BlurView intensity={80} tint="light" style={styles.rechargeRowBlur}>
                        <View style={{ ...styles.rechargeRow, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 122, 61, 0.05)', borderColor: 'rgba(255, 122, 61, 0.1)' }}>
                            <View style={styles.rechargeInfo}>
                                <View style={{ ...styles.rechargeIconBox, backgroundColor: colors.primary }}>
                                    <Zap size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={{ ...styles.rechargeTitle, color: colors.text }}>Auto Recharge</Text>
                                    <Text style={{ ...styles.rechargeSubtitle, color: colors.primary }}>ACTIVE AT ₹200</Text>
                                </View>
                            </View>
                            <Switch
                                value={autoRecharge}
                                onValueChange={setAutoRecharge}
                                trackColor={{ false: colors.borderSecondary, true: colors.primary }}
                                thumbColor="white"
                            />
                        </View>
                    </BlurView>

                    {/* Security Banner */}
                    <BlurView intensity={80} tint="light" style={styles.securityBannerBlur}>
                        <View style={{ ...styles.securityBanner, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.5)' }}>
                            <View style={{ ...styles.securityIconBox, backgroundColor: colors.background }}>
                                <ShieldCheck size={28} color={isDark ? colors.primary : '#3b82f6'} />
                            </View>
                            <View style={styles.securityTextGroup}>
                                <Text style={{ ...styles.securityTitle, color: colors.text }}>Safe & Secure</Text>
                                <Text style={{ ...styles.securitySubtitle, color: colors.textSecondary }}>All transactions are encrypted and protected by Pawber Guarantee.</Text>
                            </View>
                        </View>
                    </BlurView>

                    {/* Transactions Header */}
                    <View style={styles.transactionsHeader}>
                        <Text style={{ ...styles.sectionTitle, color: colors.text }}>TRANSACTIONS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {(['all', 'services', 'topups', 'refunds', 'rewards'] as const).map(f => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setFilter(f);
                                    }}
                                    style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}), backgroundColor: filter === f ? colors.text : colors.surface, borderColor: colors.border }}
                                >
                                    <Text style={{ ...styles.filterBtnText, ...(filter === f ? styles.filterBtnTextActive : {}), color: filter === f ? colors.background : colors.textSecondary }}>
                                        {f.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Transactions List */}
                    <View style={styles.transactionsList}>
                        {isLoading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator color="#FF7A3D" />
                            </View>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => {
                                const visuals = getTxVisuals(tx.type);
                                const isPositive = Number(tx.amount) > 0 || tx.type === 'credit' || tx.type === 'refund';
                                return (
                                    <BlurView key={tx.id} intensity={80} tint="light" style={styles.txItemBlur}>
                                        <TouchableOpacity style={{ ...styles.txItem, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.5)' }}>
                                            <View style={styles.txLeft}>
                                                <View style={{ ...styles.txIconBox, backgroundColor: visuals.bgColor }}>
                                                    <visuals.icon size={20} color={visuals.color} />
                                                </View>
                                                <View>
                                                    <Text style={{ ...styles.txTitle, color: colors.text }}>{tx.description || tx.type}</Text>
                                                    <Text style={{ ...styles.txDate, color: colors.textMuted }}>{new Date(tx.created_at).toLocaleDateString().toUpperCase()}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.txRight}>
                                                <Text style={{ ...styles.txAmount, color: isPositive ? colors.primary : colors.text }}>
                                                    {isPositive ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                                                </Text>
                                                <View style={styles.receiptRow}>
                                                    <Text style={{ ...styles.receiptText, color: colors.primary }}>Receipt</Text>
                                                    <ArrowRight size={10} color={colors.primary} />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </BlurView>
                                );
                            })
                        ) : (
                            <View style={styles.emptyTransactions}>
                                <HistoryIcon size={40} color="#DEC9B5" />
                                <Text style={styles.emptyText}>No transactions found</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    bgBlob: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    listScroll: { paddingHorizontal: 24, paddingBottom: 100 },
    balanceCard: { borderRadius: 32, padding: 24, marginBottom: 24, elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
    totalBalanceLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    balanceAmount: { fontSize: 28, fontWeight: '900', color: 'white' },
    balanceSection: { flex: 1 },
    dividerVertical: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
    pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardActions: { flexDirection: 'row', gap: 12 },
    addFundsBtn: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    addFundsText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    invoiceBtn: { flex: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    invoiceText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    rechargeRowBlur: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    rechargeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1 },
    rechargeInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    rechargeIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    rechargeTitle: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
    rechargeSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    securityBannerBlur: { borderRadius: 32, overflow: 'hidden', marginBottom: 32, elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
    securityBanner: { flexDirection: 'row', alignItems: 'center', padding: 24, borderWidth: 1, gap: 20 },
    securityIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.03 },
    securityTextGroup: { flex: 1 },
    securityTitle: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
    securitySubtitle: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
    transactionsHeader: { marginBottom: 20, gap: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    filterScroll: { flexDirection: 'row' },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
    filterBtnActive: { },
    filterBtnText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    filterBtnTextActive: { },
    transactionsList: { gap: 12 },
    txItemBlur: { borderRadius: 24, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
    txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1 },
    txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    txIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    txTitle: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
    txDate: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
    receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    receiptText: { fontSize: 10, fontWeight: '900' },
    emptyTransactions: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 32, borderStyle: 'dashed', borderWidth: 1, borderColor: '#DEC9B5', gap: 12 },
    emptyText: { fontSize: 13, fontWeight: '900', color: '#7A5540' }
});
