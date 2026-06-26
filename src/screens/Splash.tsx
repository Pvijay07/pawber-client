import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function Splash() {
    const { colors } = useTheme();
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;
    const bgScale = useRef(new Animated.Value(1.1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(bgScale, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.delay(800),
                Animated.parallel([
                    Animated.timing(textOpacity, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(textTranslateY, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ])
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}>
                <LinearGradient
                    colors={[colors.primary, '#FF9D6C', '#FF7A3D']}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Decorative Paw Pattern */}
            <View style={styles.patternOverlay}>
                <View style={styles.patternRow}>
                    {/* Add subtle paw icons or dots for texture */}
                </View>
            </View>

            <View style={styles.content}>
                <Animated.View style={[
                    styles.logoContainer,
                    { transform: [{ scale: logoScale }], opacity: logoOpacity }
                ]}>
                    <View style={styles.logoCircle}>
                        <Image 
                            source={require('../../assets/images/service_grooming_premium.png')} // Temporarily using an existing high-quality image
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], alignItems: 'center' }}>
                    <Text style={styles.brandName}>Pawber</Text>
                    <View style={styles.taglineContainer}>
                        <Text style={styles.tagline}>Premium Care for Every Paw</Text>
                    </View>
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Made with ❤️ for Pets</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF7A3D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    logoCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'white',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 100,
        height: 100,
    },
    brandName: {
        fontSize: 52,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    taglineContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    tagline: {
        fontSize: 16,
        color: 'white',
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    patternRow: {
        flexDirection: 'row',
    }
});
