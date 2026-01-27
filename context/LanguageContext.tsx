// context/LanguageContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { translations } from '../constants/translations';

// Define the shape of our Context
type TranslationKey = keyof (typeof translations)['en'] | keyof (typeof translations)['bn'];
type LanguageContextType = {
    lang: 'bn' | 'en';
    switchLanguage: (lang: 'bn' | 'en') => void;
    t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<'bn' | 'en'>('bn');

    const switchLanguage = (language: 'bn' | 'en') => {
        setLang(language);
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
