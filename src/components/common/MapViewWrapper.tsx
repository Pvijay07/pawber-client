import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
let MapView: any = View;
let Marker: any = View;
let Polyline: any = View;
let PROVIDER_GOOGLE: any = null;

// Only load native maps on iOS (Apple Maps, no API key needed) or on Android if the Google Maps key is provided
const shouldLoadNativeMap = Platform.OS === 'ios' || Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

if (shouldLoadNativeMap) {
    try {
        const Maps = require('react-native-maps');
        MapView = Maps.default || Maps;
        Marker = Maps.Marker;
        Polyline = Maps.Polyline;
    } catch (e) {
        console.warn('react-native-maps failed to load:', e);
    }
}

export { PROVIDER_GOOGLE };

export const MapWrapper = forwardRef((props: any, ref: any) => {
    if (MapView === View) {
        return (
            <View style={StyleSheet.flatten([styles.placeholder, props.style])}>
                <Text style={styles.text}>Map not available in this environment</Text>
            </View>
        );
    }
    return <MapView ref={ref} provider={PROVIDER_GOOGLE} {...props} />;
});

export const MapMarker = (props: any) => <Marker {...props} />;
export const MapPolyline = (props: any) => <Polyline {...props} />;

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: '#F5E6D8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#7A5540',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default MapWrapper;
