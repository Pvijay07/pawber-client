export const palette = {
    // Light Palette
    light: {
        background: '#ffffff',
        surface: '#f8fafc',
        surfaceSecondary: '#f1f5f9',
        text: '#0f172a',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        border: '#f1f5f9',
        borderSecondary: '#e2e8f0',
        primary: '#14b8a6',
        primaryLight: '#f0fdfa',
        accent: '#f97316',
        accentLight: '#fff7ed',
        danger: '#ef4444',
        dangerLight: '#fef2f2',
        warning: '#f59e0b',
        success: '#22c55e',
        cardShadow: 'rgba(15, 23, 42, 0.06)',
    },
    // Dark Palette (Premium Midnight)
    dark: {
        background: '#020617',
        surface: '#0f172a',
        surfaceSecondary: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        border: '#1e293b',
        borderSecondary: '#334155',
        primary: '#2dd4bf',
        primaryLight: 'rgba(45, 212, 191, 0.1)',
        accent: '#fb923c',
        accentLight: 'rgba(251, 146, 60, 0.1)',
        danger: '#f87171',
        dangerLight: 'rgba(248, 113, 113, 0.1)',
        warning: '#fbbf24',
        success: '#4ade80',
        cardShadow: 'rgba(0, 0, 0, 0.4)',
    }
};

export type ThemeColors = typeof palette.light;
