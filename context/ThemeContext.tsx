import { PRO_STATUS_KEY, THEME_SELECTION_KEY } from '@/constants/storageKeys';
import { applyThemePreset, DEFAULT_THEME_ID, getThemePreset, ThemePreset, themePresets } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeChangeResult = {
    applied: boolean;
    reason?: 'locked' | 'missing';
    preset?: ThemePreset;
};

type ThemeContextValue = {
    themes: ThemePreset[];
    activeThemeId: string;
    activeTheme: ThemePreset;
    isPro: boolean;
    isReady: boolean;
    selectTheme: (themeId: string) => Promise<ThemeChangeResult>;
    unlockPro: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeThemeId, setActiveThemeId] = useState(DEFAULT_THEME_ID);
    const [isPro, setIsPro] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let mounted = true;

        const hydrate = async () => {
            try {
                const [storedThemeId, storedPro] = await Promise.all([
                    AsyncStorage.getItem(THEME_SELECTION_KEY),
                    AsyncStorage.getItem(PRO_STATUS_KEY),
                ]);

                const preset = storedThemeId ? getThemePreset(storedThemeId) : getThemePreset(DEFAULT_THEME_ID);
                applyThemePreset(preset);

                if (mounted) {
                    setActiveThemeId(preset.id);
                    setIsPro(storedPro === 'true');
                }
            } catch (error) {
                console.warn('Failed to hydrate theme selection', error);
            } finally {
                if (mounted) {
                    setHydrated(true);
                }
            }
        };

        hydrate();

        return () => {
            mounted = false;
        };
    }, []);

    const persistTheme = useCallback(async (preset: ThemePreset) => {
        applyThemePreset(preset);
        setActiveThemeId(preset.id);
        try {
            await AsyncStorage.setItem(THEME_SELECTION_KEY, preset.id);
        } catch (error) {
            console.warn('Failed to persist theme selection', error);
        }
    }, []);

    const selectTheme = useCallback<ThemeContextValue['selectTheme']>(
        async (themeId) => {
            const preset = getThemePreset(themeId);
            const locked = preset.tier === 'premium' && !isPro;
            if (locked) {
                return { applied: false, reason: 'locked', preset };
            }

            await persistTheme(preset);
            return { applied: true, preset };
        },
        [isPro, persistTheme],
    );

    const unlockPro = useCallback(async () => {
        setIsPro(true);
        try {
            await AsyncStorage.setItem(PRO_STATUS_KEY, 'true');
        } catch (error) {
            console.warn('Failed to persist pro status', error);
        }
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        themes: themePresets,
        activeThemeId,
        activeTheme: getThemePreset(activeThemeId),
        isPro,
        isReady: hydrated,
        selectTheme,
        unlockPro,
    }), [activeThemeId, hydrated, isPro, selectTheme, unlockPro]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemePreferences = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useThemePreferences must be used within a ThemeProvider');
    }
    return ctx;
};
