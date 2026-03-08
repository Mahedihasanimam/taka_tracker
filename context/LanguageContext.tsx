// context/LanguageContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { translations } from '../constants/translations';

// Define the shape of our Context
type TranslationKey = keyof (typeof translations)['en'] | keyof (typeof translations)['bn'];
type LanguageContextType = {
    lang: 'bn' | 'en';
    switchLanguage: (lang: 'bn' | 'en') => void;
    t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_KEY = 'appLanguage';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<'bn' | 'en'>('en');

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
                if (stored === 'bn' || stored === 'en') {
                    setLang(stored);
                }
            } catch (error) {
                console.error('Failed to load language:', error);
            }
        };

        loadLanguage();
    }, []);

    const switchLanguage = (language: 'bn' | 'en') => {
        setLang(language);
        AsyncStorage.setItem(LANGUAGE_KEY, language).catch((error) => {
            console.error('Failed to save language:', error);
        });
    };

    const t = (key: TranslationKey) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
