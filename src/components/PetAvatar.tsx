import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Dog, Cat, IterationCw as Cow } from 'lucide-react-native';

/**
 * Generates a unique gradient color pair from a string seed (pet name).
 * Produces warm, vibrant colors that look great as avatar backgrounds.
 */
function hashToColors(seed: string): [string, string] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }

    // Warm color palettes keyed by hash
    const palettes: [string, string][] = [
        ['#FF7A3D', '#FFB088'], // warm orange
        ['#1D9E86', '#6DD5C4'], // teal
        ['#6366F1', '#A5B4FC'], // indigo
        ['#EC4899', '#F9A8D4'], // pink
        ['#F59E0B', '#FCD34D'], // amber
        ['#8B5CF6', '#C4B5FD'], // violet
        ['#10B981', '#6EE7B7'], // emerald
        ['#EF4444', '#FCA5A5'], // red
        ['#3B82F6', '#93C5FD'], // blue
        ['#14B8A6', '#5EEAD4'], // teal-bright
        ['#F97316', '#FDBA74'], // orange
        ['#84CC16', '#BEF264'], // lime
    ];

    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
}

/** Get the appropriate icon component for a pet type */
function getPetIcon(type?: string) {
    switch (type?.toLowerCase()) {
        case 'cat':
            return Cat;
        case 'cow':
            return Cow;
        case 'dog':
        default:
            return Dog;
    }
}

/** Get initials from a pet name */
function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

interface PetAvatarProps {
    /** Pet name — used for generating unique colors */
    name: string;
    /** Pet type — 'Dog', 'Cat', 'Cow' */
    type?: string;
    /** If a real image URL exists, it takes priority */
    imageUrl?: string | null;
    /** Size of the avatar (width & height) */
    size?: number;
    /** Show the pet type icon overlay */
    showIcon?: boolean;
    /** Border radius — defaults to rounded */
    borderRadius?: number;
}

/**
 * Dynamic pet avatar component.
 * Shows uploaded image if available, otherwise displays a beautiful
 * gradient background with pet type icon and initials.
 */
export default function PetAvatar({
    name,
    type,
    imageUrl,
    size = 60,
    showIcon = true,
    borderRadius,
}: PetAvatarProps) {
    const computedRadius = borderRadius ?? size * 0.3;
    const [primaryColor, secondaryColor] = useMemo(() => hashToColors(name || 'pet'), [name]);
    const PetIcon = useMemo(() => getPetIcon(type), [type]);
    const initials = useMemo(() => getInitials(name || '?'), [name]);

    // If we have a valid image URL (not a placeholder), show it
    const hasRealImage = imageUrl &&
        !imageUrl.includes('dicebear') &&
        !imageUrl.includes('pravatar') &&
        !imageUrl.includes('placeholder');

    if (hasRealImage) {
        return (
            <View style={[styles.container, { width: size, height: size, borderRadius: computedRadius }]}>
                <Image
                    source={{ uri: imageUrl }}
                    style={[styles.image, { width: size, height: size, borderRadius: computedRadius }]}
                />
                {showIcon && (
                    <View style={[
                        styles.iconBadge,
                        {
                            backgroundColor: primaryColor,
                            width: size * 0.35,
                            height: size * 0.35,
                            borderRadius: size * 0.175,
                            right: -size * 0.05,
                            bottom: -size * 0.05,
                        }
                    ]}>
                        <PetIcon size={size * 0.18} color="white" />
                    </View>
                )}
            </View>
        );
    }

    // Generate a gradient-style avatar with icon
    const iconSize = size * 0.4;
    const fontSize = size * 0.22;

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: computedRadius }]}>
            <View
                style={[
                    styles.gradientContainer,
                    {
                        width: size,
                        height: size,
                        borderRadius: computedRadius,
                        backgroundColor: primaryColor,
                    },
                ]}
            >
                {/* Secondary color accent (diagonal split effect) */}
                <View
                    style={[
                        styles.accentOverlay,
                        {
                            backgroundColor: secondaryColor,
                            width: size,
                            height: size,
                            borderRadius: computedRadius,
                        },
                    ]}
                />

                {/* Pet icon */}
                <PetIcon size={iconSize} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />

                {/* Name initials below icon */}
                <Text
                    style={[
                        styles.initials,
                        { fontSize: fontSize * 0.7, marginTop: -2 },
                    ]}
                >
                    {initials}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'visible',
    },
    image: {
        resizeMode: 'cover',
    },
    iconBadge: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    gradientContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    accentOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.4,
        transform: [{ rotate: '135deg' }, { scale: 1.5 }],
    },
    initials: {
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '900',
        letterSpacing: 1,
    },
});
