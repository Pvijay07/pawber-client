import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { PawPrint } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function Splash() {
    const scaleAnim = new Animated.Value(0.8);
    const opacityAnim = new Animated.Value(0);
    const floatAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Background decorative elements (simplified as colored circles) */}
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />
            <View style={[styles.blob, styles.blob3]} />

            <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                <Animated.View style={[styles.iconContainer, { transform: [{ translateY: floatAnim }] }]}>
                    <PawPrint size={64} color="#14b8a6" strokeWidth={2.5} />
                </Animated.View>

                <Text style={styles.title}>Pawber</Text>
                <Text style={styles.subtitle}>Premium care for your best friend</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#14b8a6', // teal-500
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        width: 256,
        height: 256,
        borderRadius: 128,
        opacity: 0.5,
    },
    blob1: {
        top: -height * 0.1,
        left: -width * 0.1,
        backgroundColor: '#2dd4bf', // teal-400
    },
    blob2: {
        top: -height * 0.1,
        right: -width * 0.1,
        backgroundColor: '#fb923c', // orange-400
    },
    blob3: {
        bottom: -height * 0.1,
        left: width * 0.2,
        backgroundColor: '#5eead4', // teal-300
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    iconContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 32,
        marginBottom: 24,
        shadowColor: '#134e4a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#ccfbf1', // teal-100
        fontWeight: '500',
    },
});
