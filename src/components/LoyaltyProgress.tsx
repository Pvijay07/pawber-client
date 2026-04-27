import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Award, CheckCircle2, Circle, Gift, Crown, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface LoyaltyProgressProps {
    currentStreak: number;
    progress: string[];
    isEligible: boolean;
}

export const LoyaltyProgress: React.FC<LoyaltyProgressProps> = ({ currentStreak, progress, isEligible }) => {
    // Current streak is out of 4 for the reward
    const steps = [1, 2, 3, 4];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <Crown size={20} color="#FF7A3D" fill="#FF7A3D" />
                    <Text style={styles.title}>Loyalty streak</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Zap size={14} color="#FF7A3D" fill="#FF7A3D" />
                    <Text style={styles.statusText}>{isEligible ? 'Reward ready' : `${currentStreak} of 4 months complete`}</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <View style={StyleSheet.flatten([styles.progressBarFill, { width: `${Math.min((currentStreak / 4) * 100, 100)}%` }])} />
                </View>
                <View style={StyleSheet.flatten([styles.rewardChip, isEligible && styles.rewardChipActive])}>
                    <Gift size={20} color={isEligible ? "white" : "#94A3B8"} />
                </View>
            </View>

            <View style={StyleSheet.flatten([styles.rewardCard, isEligible && styles.rewardCardActive])}>
                <View style={styles.rewardIconBg}>
                    <Gift size={24} color={isEligible ? '#FF7A3D' : '#94A3B8'} />
                </View>
                <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>5th month reward</Text>
                    <Text style={styles.rewardSubtitle}>
                        {isEligible 
                            ? "Congratulations! Your next service (up to ₹1500) is on us! 🎁" 
                            : "Keep booking! Complete 4 months to unlock a free session."}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginHorizontal: 0, // Padding handled by parent Home scroll
        borderWidth: 2,
        borderColor: '#F5E6D8',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
        marginBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FF7A3D',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        marginRight: -16, // Underlap the reward chip
        zIndex: 1,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FF7A3D',
        borderRadius: 4,
    },
    rewardChip: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8FAFC',
        borderWidth: 3,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    rewardChipActive: {
        backgroundColor: '#FF7A3D',
        borderColor: '#FFF3EC',
        shadowColor: '#FF7A3D',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    rewardCardActive: {
        backgroundColor: '#FFF3EC',
        borderColor: '#ffedd5',
    },
    rewardIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1E293B',
        marginBottom: 4,
    },
    rewardSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '400',
        lineHeight: 18,
    },
});
