import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    LayoutAnimation,
    Switch,
    Platform,
    ActivityIndicator,
} from 'react-native';
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
    History,
    ArrowRight,
} from 'lucide-react-native';
import { walletApi } from '../services/wallet.service';
import { Wallet as WalletType, WalletTransaction } from '../shared/types';

const { width } = Dimensions.get('window');

interface WalletProps {
    navigation: any;
}

export default function Wallet({ navigation }: WalletProps) {
    const [filter, setFilter] = useState<'all' | 'services' | 'topups' | 'refunds'>('all');
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
            case 'credit': return { icon: ArrowDownLeft, color: '#14b8a6', bgColor: '#f0fdfa' };
            case 'debit': return { icon: ArrowUpRight, color: '#f97316', bgColor: '#fff7ed' };
            case 'refund': return { icon: RefreshCcw, color: '#3b82f6', bgColor: '#eff6ff' };
            default: return { icon: ArrowUpRight, color: '#64748b', bgColor: '#f1f5f9' };
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Wallet</Text>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Filter size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
                    {/* Main Card */}
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceHeader}>
                            <View>
                                <Text style={styles.totalBalanceLabel}>TOTAL BALANCE</Text>
                                {isLoading && !wallet ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.balanceAmount}>₹{wallet?.balance?.toFixed(2) || '0.00'}</Text>
                                )}
                            </View>
                            <View style={styles.walletIconBox}>
                                <WalletIcon size={28} color="#14b8a6" />
                            </View>
                        </View>

                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.addFundsBtn}>
                                <Plus size={18} color="white" />
                                <Text style={styles.addFundsText}>ADD FUNDS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.invoiceBtn}>
                                <FileText size={18} color="white" />
                                <Text style={styles.invoiceText}>INVOICES</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Settings Row */}
                    <View style={styles.rechargeRow}>
                        <View style={styles.rechargeInfo}>
                            <View style={styles.rechargeIconBox}>
                                <Zap size={24} color="white" />
                            </View>
                            <View>
                                <Text style={styles.rechargeTitle}>Auto Recharge</Text>
                                <Text style={styles.rechargeSubtitle}>ACTIVE AT ₹200</Text>
                            </View>
                        </View>
                        <Switch
                            value={autoRecharge}
                            onValueChange={setAutoRecharge}
                            trackColor={{ false: '#cbd5e1', true: '#14b8a6' }}
                            thumbColor="white"
                        />
                    </View>

                    {/* Security Banner */}
                    <View style={styles.securityBanner}>
                        <View style={styles.securityIconBox}>
                            <ShieldCheck size={28} color="#3b82f6" />
                        </View>
                        <View style={styles.securityTextGroup}>
                            <Text style={styles.securityTitle}>Safe & Secure</Text>
                            <Text style={styles.securitySubtitle}>All transactions are encrypted and protected by PetCare Guarantee.</Text>
                        </View>
                    </View>

                    {/* Transactions Header */}
                    <View style={styles.transactionsHeader}>
                        <Text style={styles.sectionTitle}>TRANSACTIONS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {(['all', 'services', 'topups', 'refunds'] as const).map(f => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setFilter(f);
                                    }}
                                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                                >
                                    <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
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
                                <ActivityIndicator color="#14b8a6" />
                            </View>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => {
                                const visuals = getTxVisuals(tx.type);
                                const isPositive = Number(tx.amount) > 0 || tx.type === 'credit' || tx.type === 'refund';
                                return (
                                    <TouchableOpacity key={tx.id} style={styles.txItem}>
                                        <View style={styles.txLeft}>
                                            <View style={[styles.txIconBox, { backgroundColor: visuals.bgColor }]}>
                                                <visuals.icon size={20} color={visuals.color} />
                                            </View>
                                            <View>
                                                <Text style={styles.txTitle}>{tx.description || tx.type}</Text>
                                                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString().toUpperCase()}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.txRight}>
                                            <Text style={[styles.txAmount, isPositive && styles.txAmountPositive]}>
                                                {isPositive ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                                            </Text>
                                            <View style={styles.receiptRow}>
                                                <Text style={styles.receiptText}>Receipt</Text>
                                                <ArrowRight size={10} color="#14b8a6" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.emptyTransactions}>
                                <History size={40} color="#e2e8f0" />
                                <Text style={styles.emptyText}>No transactions found</Text>
                            </View>
                        )}
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
        paddingHorizontal: 24,
        paddingVertical: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listScroll: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    balanceCard: {
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
        elevation: 8,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40,
    },
    totalBalanceLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 2,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    walletIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    addFundsBtn: {
        flex: 1,
        height: 52,
        backgroundColor: '#14b8a6',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addFundsText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    invoiceBtn: {
        flex: 1,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    invoiceText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    rechargeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0fdfa',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#ccfbf1',
        marginBottom: 16,
    },
    rechargeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    rechargeIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rechargeTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    rechargeSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 1,
    },
    securityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 20,
        marginBottom: 32,
    },
    securityIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 4 },
    },
    securityTextGroup: {
        flex: 1,
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    securitySubtitle: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 18,
        fontWeight: '500',
    },
    transactionsHeader: {
        marginBottom: 20,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1.5,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginRight: 8,
        backgroundColor: 'white',
    },
    filterBtnActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    filterBtnText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
    },
    filterBtnTextActive: {
        color: 'white',
    },
    transactionsList: {
        gap: 12,
    },
    txItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    txIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    txRight: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 4,
    },
    txAmountPositive: {
        color: '#14b8a6',
    },
    receiptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    receiptText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#14b8a6',
    },
    emptyTransactions: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 32,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748b',
    },
});
