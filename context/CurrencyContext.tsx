import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  CURRENCY_OPTIONS,
  CurrencyCode,
  formatCurrency,
  getCurrencySymbol,
  isSupportedCurrency,
} from '@/utils/currency';

type CurrencyContextType = {
  currency: CurrencyCode;
  currencySymbol: string;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (amount: number) => string;
  currencyOptions: typeof CURRENCY_OPTIONS;
};

const CURRENCY_KEY = 'appCurrency';
const DEFAULT_CURRENCY: CurrencyCode = 'USD';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENCY_KEY);
        if (stored && isSupportedCurrency(stored)) {
          setCurrencyState(stored);
        } else {
          await AsyncStorage.setItem(CURRENCY_KEY, DEFAULT_CURRENCY);
        }
      } catch (error) {
        console.error('Failed to load currency:', error);
      }
    };

    loadCurrency();
  }, []);

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    AsyncStorage.setItem(CURRENCY_KEY, nextCurrency).catch((error) => {
      console.error('Failed to save currency:', error);
    });
  };

  const value = useMemo(
    () => ({
      currency,
      currencySymbol: getCurrencySymbol(currency),
      setCurrency,
      formatAmount: (amount: number) => formatCurrency(amount, currency),
      currencyOptions: CURRENCY_OPTIONS,
    }),
    [currency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
