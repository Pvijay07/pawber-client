import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { analyticsApi } from '../services';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Activity } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function Analytics() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const result = await analyticsApi.getClientAnalytics();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxSpend = data?.spendingTrends?.reduce((max: number, item: any) => Math.max(max, item.amount), 0) || 1;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : data ? (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Spending Trends Chart */}
                    <View style={[styles.card, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
                        <View style={styles.cardHeader}>
                            <TrendingUp color={colors.primary} size={20} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Trends</Text>
                        </View>
                        
                        {data.spendingTrends?.length > 0 ? (
                            <View style={styles.chartContainer}>
                                {data.spendingTrends.map((item: any, index: number) => {
                                    const heightRatio = item.amount / maxSpend;
                                    const barHeight = Math.max(heightRatio * 150, 4); // min 4px
                                    const monthLabel = new Date(item.month + '-01').toLocaleString('default', { month: 'short' });
                                    
                                    return (
                                        <View key={index} style={styles.barGroup}>
                                            <Text style={[styles.barLabelTop, { color: colors.textSecondary }]}>
                                                ${item.amount.toFixed(0)}
                                            </Text>
                                            <View style={styles.barTrack}>
                                                <View style={[styles.barFill, { height: barHeight, backgroundColor: colors.primary }]} />
                                            </View>
                                            <Text style={[styles.barLabelBottom, { color: colors.textSecondary }]}>{monthLabel}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No spending data available yet.</Text>
                        )}
                    </View>

                    {/* Pet Stats */}
                    <View style={[styles.card, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
                        <View style={styles.cardHeader}>
                            <Activity color={colors.primary} size={20} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Pet Activity</Text>
                        </View>
                        
                        {data.petStats?.length > 0 ? (
                            data.petStats.map((pet: any, idx: number) => (
                                <View key={idx} style={[styles.listItem, { borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                                    <View>
                                        <Text style={[styles.itemName, { color: colors.text }]}>{pet.name}</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{pet.walkCount} sessions recorded</Text>
                                    </View>
                                    <Text style={[styles.itemValue, { color: colors.primary }]}>${pet.totalSpent.toFixed(2)}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pet activity yet.</Text>
                        )}
                    </View>

                    {/* Provider History */}
                    <View style={[styles.card, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', marginBottom: 40 }]}>
                        <View style={styles.cardHeader}>
                            <Calendar color={colors.primary} size={20} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Provider History</Text>
                        </View>
                        
                        {data.providerHistory?.length > 0 ? (
                            data.providerHistory.map((provider: any, idx: number) => (
                                <View key={idx} style={[styles.listItem, { borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                                    <View>
                                        <Text style={[styles.itemName, { color: colors.text }]}>{provider.providerName}</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{provider.bookingCount} bookings</Text>
                                    </View>
                                    <Text style={[styles.itemValue, { color: colors.primary }]}>${provider.totalSpent.toFixed(2)}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No providers hired yet.</Text>
                        )}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.centerContainer}>
                    <Text style={{ color: colors.textSecondary }}>Failed to load data</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 200,
        marginTop: 10,
        paddingHorizontal: 10,
    },
    barGroup: {
        alignItems: 'center',
        width: 40,
    },
    barTrack: {
        height: 150,
        width: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 6,
        justifyContent: 'flex-end',
        marginVertical: 10,
    },
    barFill: {
        width: 12,
        borderRadius: 6,
    },
    barLabelTop: {
        fontSize: 10,
        fontWeight: '600',
    },
    barLabelBottom: {
        fontSize: 12,
        fontWeight: '500',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemSub: {
        fontSize: 13,
    },
    itemValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic'
    }
});
