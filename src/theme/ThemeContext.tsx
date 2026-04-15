import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { palette, ThemeColors } from './colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeMode;
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeMode>((systemColorScheme === 'dark' ? 'dark' : 'light'));

    // Update theme when system preference changes
    useEffect(() => {
        if (systemColorScheme === 'dark' || systemColorScheme === 'light') {
            setThemeState(systemColorScheme);
        }
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (mode: ThemeMode) => {
        setThemeState(mode);
    };

    const colors = palette[theme];
    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
