import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MapPin } from 'lucide-react-native';
export const PROVIDER_GOOGLE = null;

/**
 * Web-compatible MapView shim to prevent crashes in browser.
 */
export const MapWrapper = forwardRef((props: any, ref: any) => {
    // Shim common MapView methods to prevent "undefined is not a function"
    useImperativeHandle(ref, () => ({
        animateToRegion: () => console.log('Map animation not supported on web placeholder'),
        fitToCoordinates: () => {},
    }));

    return (
        <View style={StyleSheet.flatten([styles.placeholder, props.style])}>
            <View style={styles.content}>
                <MapPin size={48} color="#FF1B5E" />
                <Text style={styles.title}>Interactive Map</Text>
                <Text style={styles.subtitle}>
                    Full location picking is available on our iOS and Android apps.
                </Text>
                {props.initialRegion && (
                    <Text style={styles.coords}>
                        Lat: {props.initialRegion.latitude.toFixed(4)}, Lon: {props.initialRegion.longitude.toFixed(4)}
                    </Text>
                )}
            </View>
        </View>
    );
});

export const MapMarker = () => null;
export const MapPolyline = () => null;

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: '#F5E6D8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DEC9B5',
        borderRadius: 20,
        overflow: 'hidden',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1612',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#7A5540',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 250,
    },
    coords: {
        fontSize: 12,
        color: '#B09080',
        marginTop: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    }
});

export default MapWrapper;
