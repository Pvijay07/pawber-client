export const palette = {
    // Light Palette — Pawber Brand
    light: {
        background: '#FFF9F5',
        surface: '#FFFFFF',
        surfaceSecondary: '#F5E6D8',
        text: '#1A1612',
        textSecondary: '#7A5540',
        textMuted: '#B09080',
        border: '#F5E6D8',
        borderSecondary: '#DEC9B5',
        primary: '#FF7A3D',
        primaryLight: '#FFF3EC',
        accent: '#1D9E86',
        accentLight: '#E0F5F0',
        danger: '#ef4444',
        dangerLight: '#fef2f2',
        warning: '#f59e0b',
        success: '#1D9E86',
        cardShadow: 'rgba(26, 22, 18, 0.06)',
    },
    // Dark Palette (Premium Earth Dark)
    dark: {
        background: '#1A1612',
        surface: '#2A1D15',
        surfaceSecondary: '#3D2A1E',
        text: '#F5E6D8',
        textSecondary: '#B09080',
        textMuted: '#7A5540',
        border: '#3D2A1E',
        borderSecondary: '#7A5540',
        primary: '#FF7A3D',
        primaryLight: 'rgba(255, 122, 61, 0.12)',
        accent: '#4DBFAB',
        accentLight: 'rgba(77, 191, 171, 0.1)',
        danger: '#f87171',
        dangerLight: 'rgba(248, 113, 113, 0.1)',
        warning: '#fbbf24',
        success: '#4DBFAB',
        cardShadow: 'rgba(0, 0, 0, 0.4)',
    }
};

export type ThemeColors = typeof palette.light;
