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
                    <Crown size={20} color="#f97316" fill="#f97316" />
                    <Text style={styles.title}>LOYALTY <Text style={styles.streakText}>STREAK</Text></Text>
                </View>
                <View style={styles.statusBadge}>
                    <Zap size={12} color="#14b8a6" fill="#14b8a6" />
                    <Text style={styles.statusText}>{isEligible ? 'REWARD READY' : `${currentStreak}/4 MONTHS`}</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                {steps.map((step, index) => (
                    <React.Fragment key={step}>
                        <View style={styles.stepWrapper}>
                            <View style={[
                                styles.stepIcon,
                                currentStreak >= step ? styles.stepActive : styles.stepInactive
                            ]}>
                                {currentStreak >= step ? (
                                    <CheckCircle2 size={24} color="white" />
                                ) : (
                                    <Text style={styles.stepNumber}>{step}</Text>
                                )}
                            </View>
                            <Text style={styles.monthLabel}>{progress[index]?.split(' ')[0] || `M${step}`}</Text>
                        </View>
                        {step < 4 && <View style={[styles.connector, currentStreak > step && styles.connectorActive]} />}
                    </React.Fragment>
                ))}
            </View>

            <View style={[styles.rewardCard, isEligible && styles.rewardCardActive]}>
                <View style={styles.rewardIconBg}>
                    <Gift size={24} color={isEligible ? '#14b8a6' : '#94a3b8'} />
                </View>
                <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>5th Month Reward</Text>
                    <Text style={styles.rewardSubtitle}>
                        {isEligible 
                            ? "Congratulations! Your next service (up to ₹1500) is on us! 🎁" 
                            : "Keep booking! Complete 4 months to unlock a FREE session."}
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
        borderColor: '#f1f5f9',
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
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1.5,
    },
    streakText: {
        color: '#f97316',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#14b8a6',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 24,
    },
    stepWrapper: {
        alignItems: 'center',
        gap: 8,
        zIndex: 5,
    },
    stepIcon: {
        width: 48,
        height: 48,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    stepActive: {
        backgroundColor: '#f97316',
        borderColor: '#f97316',
        shadowColor: '#f97316',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    stepInactive: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: '900',
        color: '#94a3b8',
    },
    monthLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
    },
    connector: {
        flex: 1,
        height: 3,
        backgroundColor: '#f1f5f9',
        marginHorizontal: -15,
        marginTop: -18,
    },
    connectorActive: {
        backgroundColor: '#f97316',
    },
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    rewardCardActive: {
        backgroundColor: '#f0fdfa',
        borderColor: '#ccfbf1',
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
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    rewardSubtitle: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
        lineHeight: 16,
    },
});
