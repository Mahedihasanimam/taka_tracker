// context/LanguageContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { TranslationKeys, translations } from '../constants/translations';

// Define the shape of our Context
type LanguageContextType = {
    lang: 'bn' | 'en';
    switchLanguage: (lang: 'bn' | 'en') => void;
    t: (key: TranslationKeys) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<'bn' | 'en'>('bn');

    const switchLanguage = (language: 'bn' | 'en') => {
        setLang(language);
        // You can add AsyncStorage logic here to save preference
    };

    // The 't' function gets the string based on the current language
    const t = (key: TranslationKeys) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom Hook
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};