import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, Animated, Dimensions, Platform, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    ArrowLeft, Star, ShieldCheck, MapPin, 
    MessageSquare, CheckCircle, Award, Calendar, Image as ImageIcon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Mock data to provide a rich UI experience
const MOCK_REVIEWS = [
    { id: '1', name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=sarah', rating: 5, date: '2 days ago', comment: 'Absolutely wonderful! Took great care of my golden retriever. Sent photos during the walk and was very professional.' },
    { id: '2', name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?u=mike', rating: 5, date: '1 week ago', comment: 'Very punctual and my cat loved them. Will definitely book again.' },
    { id: '3', name: 'Emily R.', avatar: 'https://i.pravatar.cc/150?u=emily', rating: 4, date: '2 weeks ago', comment: 'Good service, came highly recommended and did not disappoint.' }
];

const MOCK_PORTFOLIO = [
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400',
];

export default function ProviderProfile({ route, navigation }: any) {
    const { provider, onChat } = route.params || {};
    const insets = useSafeAreaInsets();
    
    // Fallback data if navigated without params
    const providerData = provider || {
        provider_name: 'Premium Provider',
        provider_image: 'https://i.pravatar.cc/300',
        rating: 4.9,
        completed_jobs: 120,
        is_gold: true,
    };

    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Dynamic Sticky Header */}
            <Animated.View style={[
                styles.stickyHeader, 
                { 
                    paddingTop: insets.top,
                    opacity: headerOpacity,
                    zIndex: 10
                }
            ]}>
                <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                <View style={styles.stickyHeaderContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.stickyHeaderTitle}>{providerData.provider_name}</Text>
                    <View style={styles.headerBtnPlaceholder} />
                </View>
            </Animated.View>

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Hero Header */}
                <View style={styles.heroSection}>
                    <Image 
                        source={{ uri: providerData.provider_image }} 
                        style={StyleSheet.absoluteFillObject}
                        blurRadius={10}
                    />
                    <LinearGradient
                        colors={['rgba(15, 20, 25, 0.2)', '#0F1419']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    
                    <View style={[styles.heroContent, { paddingTop: insets.top + 60 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroBackBtn}>
                            <ArrowLeft size={20} color="white" />
                        </TouchableOpacity>
                        
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: providerData.provider_image }} style={styles.avatar} />
                            {providerData.is_gold && (
                                <View style={styles.goldBadge}>
                                    <Award size={14} color="#FFF" />
                                </View>
                            )}
                        </View>
                        
                        <Text style={styles.name}>{providerData.provider_name}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.verifyBadge}>
                                <ShieldCheck size={14} color="#10B981" />
                                <Text style={styles.verifyText}>Verified Background</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Stats Row */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Star size={24} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.statValue}>{providerData.rating.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <CheckCircle size={24} color="#3B82F6" />
                            <Text style={styles.statValue}>{providerData.completed_jobs}+</Text>
                            <Text style={styles.statLabel}>Jobs Done</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Calendar size={24} color="#8B5CF6" />
                            <Text style={styles.statValue}>2 yrs</Text>
                            <Text style={styles.statLabel}>Experience</Text>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About Me</Text>
                        <Text style={styles.aboutText}>
                            Hi! I'm {providerData.provider_name.split(' ')[0]}. I have a deep passion for animals and have been caring for pets professionally for over 2 years. Whether it's a long energetic walk or a relaxing grooming session, I treat every pet like my own.
                        </Text>
                    </View>

                    {/* Portfolio / Past Work */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Past Services</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll} contentContainerStyle={styles.portfolioContainer}>
                            {MOCK_PORTFOLIO.map((img, i) => (
                                <View key={i} style={styles.portfolioItem}>
                                    <Image source={{ uri: img }} style={styles.portfolioImage} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Reviews */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Client Reviews</Text>
                            <View style={styles.ratingOverall}>
                                <Star size={16} color="#FBBF24" fill="#FBBF24" />
                                <Text style={styles.ratingOverallText}>{providerData.rating.toFixed(1)} ({MOCK_REVIEWS.length})</Text>
                            </View>
                        </View>
                        
                        {MOCK_REVIEWS.map(review => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                                    <View style={styles.reviewMeta}>
                                        <Text style={styles.reviewName}>{review.name}</Text>
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                    <View style={styles.reviewRatingBox}>
                                        <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                                    </View>
                                </View>
                                <Text style={styles.reviewText}>{review.comment}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                {onChat && (
                    <TouchableOpacity 
                        style={styles.chatBtn}
                        onPress={() => onChat(providerData.provider_id)}
                    >
                        <MessageSquare size={20} color="#FF7A3D" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.goBack()}
                >
                    <LinearGradient
                        colors={['#FF7A3D', '#FF9D6C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.actionBtnText}>Return to Bidding</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F1419' },
    stickyHeader: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: Platform.OS === 'ios' ? 100 : 80,
    },
    stickyHeaderContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    headerBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerBtnPlaceholder: { width: 40 },
    stickyHeaderTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    scrollView: { flex: 1 },
    heroSection: {
        height: 320,
        position: 'relative',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 30,
    },
    heroBackBtn: {
        position: 'absolute',
        top: 0, left: 16,
        width: 44, height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
    },
    heroContent: {
        alignItems: 'center',
        width: '100%',
        position: 'relative',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#0F1419',
    },
    goldBadge: {
        position: 'absolute',
        bottom: 0, right: 0,
        backgroundColor: '#F59E0B',
        width: 30, height: 30,
        borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#0F1419',
    },
    name: {
        fontSize: 26,
        fontWeight: '900',
        color: 'white',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    verifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    verifyText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 20,
        marginTop: -10,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: 'white',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 10,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
        marginBottom: 12,
    },
    aboutText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seeAllText: {
        color: '#FF7A3D',
        fontSize: 13,
        fontWeight: '700',
    },
    portfolioScroll: {
        marginHorizontal: -20,
    },
    portfolioContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    portfolioItem: {
        width: 140,
        height: 140,
        borderRadius: 16,
        overflow: 'hidden',
    },
    portfolioImage: {
        width: '100%',
        height: '100%',
    },
    ratingOverall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingOverallText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    reviewCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    reviewMeta: {
        flex: 1,
    },
    reviewName: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    reviewDate: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
    },
    reviewRatingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    reviewRatingText: {
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: '800',
    },
    reviewText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        lineHeight: 22,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(15, 20, 25, 0.95)',
        paddingHorizontal: 20,
        paddingTop: 16,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    chatBtn: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 122, 61, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 122, 61, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
