import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { addTransaction, getCategories } from '@/services/db';
import { parseVoiceTransaction } from '@/services/voiceTransaction';
import { router, useFocusEffect } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { ArrowLeft, Check, Mic, MicOff, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

type Category = {
    id?: number | string;
    name: string;
    icon: string;
    color: string;
    type?: string;
};

const fallbackExpenseCategories: Category[] = [
    { name: 'Food & Dining', icon: 'Utensils', color: theme.colors.categoryFood, type: 'expense' },
    { name: 'Transport', icon: 'Car', color: theme.colors.categoryTransport, type: 'expense' },
    { name: 'Shopping', icon: 'Shirt', color: theme.colors.categoryShopping, type: 'expense' },
    { name: 'Rent', icon: 'Home', color: theme.colors.categoryRent, type: 'expense' },
    { name: 'Utilities', icon: 'Zap', color: theme.colors.categoryBills, type: 'expense' },
    { name: 'Other', icon: 'MoreHorizontal', color: theme.colors.categoryOther, type: 'expense' },
];

const fallbackIncomeCategories: Category[] = [
    { name: 'Salary', icon: 'Briefcase', color: theme.colors.success, type: 'income' },
    { name: 'Freelance', icon: 'Smartphone', color: theme.colors.primary, type: 'income' },
    { name: 'Business', icon: 'Briefcase', color: theme.colors.successDark, type: 'income' },
    { name: 'Bonus', icon: 'Gift', color: theme.colors.lightSuccess, type: 'income' },
    { name: 'Investment', icon: 'Zap', color: theme.colors.secondary, type: 'income' },
    { name: 'Other Income', icon: 'MoreHorizontal', color: theme.colors.categoryOther, type: 'income' },
];

export default function VoiceAddScreen() {
    const { t } = useLanguage();
    const { currencySymbol } = useCurrency();
    const { user } = useAuth();
    const { showSuccess } = useSuccessModal();

    const [transcript, setTranscript] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
    const [isRecognitionAvailable, setIsRecognitionAvailable] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expenseCategories, setExpenseCategories] = useState<Category[]>(fallbackExpenseCategories);
    const [incomeCategories, setIncomeCategories] = useState<Category[]>(fallbackIncomeCategories);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            const loadCategories = async () => {
                try {
                    const [expense, income] = await Promise.all([
                        getCategories('expense', user?.id || 0),
                        getCategories('income', user?.id || 0),
                    ]);

                    if (!active) return;
                    if (expense?.length) setExpenseCategories(expense as Category[]);
                    if (income?.length) setIncomeCategories(income as Category[]);
                } catch (error) {
                    console.error('Failed to load voice categories:', error);
                }
            };

            loadCategories();

            return () => {
                active = false;
            };
        }, [user?.id])
    );

    useEffect(() => {
        let active = true;

        const checkAvailability = async () => {
            try {
                const available = await Promise.resolve(ExpoSpeechRecognitionModule.isRecognitionAvailable());
                if (active) setIsRecognitionAvailable(!!available);
            } catch (error) {
                console.error('Speech recognition availability check failed:', error);
                if (active) setIsRecognitionAvailable(false);
            } finally {
                if (active) setIsCheckingAvailability(false);
            }
        };

        checkAvailability();

        return () => {
            active = false;
            try {
                ExpoSpeechRecognitionModule.abort();
            } catch {
                // noop
            }
        };
    }, []);

    useSpeechRecognitionEvent('start', () => {
        setErrorMessage('');
        setIsRecognizing(true);
    });

    useSpeechRecognitionEvent('end', () => {
        setIsRecognizing(false);
    });

    useSpeechRecognitionEvent('speechstart', () => {
        setErrorMessage('');
    });

    useSpeechRecognitionEvent('soundstart', () => {
        setErrorMessage('');
    });

    useSpeechRecognitionEvent('result', (event: any) => {
        const nextTranscript =
            event?.results?.[0]?.transcript ||
            event?.results?.[0]?.value ||
            event?.transcript ||
            '';

        if (!nextTranscript) return;
        setLiveTranscript(nextTranscript);
        setTranscript(nextTranscript);
        if (event?.isFinal || event?.results?.[0]?.isFinal) {
            setTranscript(nextTranscript);
        }
    });

    useSpeechRecognitionEvent('error', (event: any) => {
        setIsRecognizing(false);
        const code = event?.error;
        const fallbackTranscript = (liveTranscript || transcript).trim();

        if ((code === 'no-speech' || code === 'speech-timeout') && fallbackTranscript) {
            setTranscript(fallbackTranscript);
            setLiveTranscript(fallbackTranscript);
            setErrorMessage('');
            return;
        }

        if (code === 'no-speech' || code === 'speech-timeout') {
            setErrorMessage('No speech was detected. Hold the phone closer and speak clearly, then tap again.');
            return;
        }

        if (code === 'service-not-allowed') {
            setErrorMessage(
                Platform.OS === 'android'
                    ? 'No speech recognition service is available. Install or enable Google voice typing on this device.'
                    : 'Speech recognition is disabled on this device. Enable Siri & Dictation, then try again.'
            );
            return;
        }

        if (code === 'not-allowed') {
            setErrorMessage('Microphone or speech permission was denied. Enable it in system settings and try again.');
            return;
        }

        setErrorMessage(event?.message || 'Voice input failed. Please try again.');
    });

    useSpeechRecognitionEvent('nomatch', () => {
        if ((liveTranscript || transcript).trim()) {
            setErrorMessage('');
            return;
        }
        setErrorMessage('I could not understand that. Try again with amount and category.');
    });

    const spokenText = transcript || liveTranscript;

    const parsed = useMemo(() => parseVoiceTransaction({
        transcript: spokenText,
        expenseCategories,
        incomeCategories,
    }), [expenseCategories, incomeCategories, spokenText]);

    const contextualStrings = useMemo(
        () => [...expenseCategories, ...incomeCategories].map((item) => item.name).slice(0, 20),
        [expenseCategories, incomeCategories]
    );

    const currentStep = !spokenText ? 1 : 2;

    const resetVoiceState = useCallback(() => {
        setTranscript('');
        setLiveTranscript('');
        setErrorMessage('');
        setIsRecognizing(false);
    }, []);

    const handleStartListening = useCallback(async () => {
        try {
            const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
            if (!available) {
                setIsRecognitionAvailable(false);
                setErrorMessage(
                    Platform.OS === 'android'
                        ? 'Voice recognition is unavailable on this device. Enable Google voice typing, then try again.'
                        : 'Voice recognition is unavailable on this device. Enable Siri & Dictation, then try again.'
                );
                return;
            }

            const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!permission.granted) {
                setErrorMessage(
                    permission.canAskAgain
                        ? 'Microphone and speech permission are required for voice add.'
                        : 'Voice permission is blocked for this app. Enable microphone and speech access in system settings.'
                );
                return;
            }

            resetVoiceState();
            ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                continuous: false,
                maxAlternatives: 1,
                addsPunctuation: true,
                contextualStrings,
                iosVoiceProcessingEnabled: true,
                volumeChangeEventOptions: {
                    enabled: true,
                    intervalMillis: 120,
                },
                androidIntentOptions: {
                    EXTRA_LANGUAGE_MODEL: 'web_search',
                    EXTRA_ENABLE_BIASING_DEVICE_CONTEXT: true,
                },
            });
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setErrorMessage('Unable to start voice recognition on this device.');
        }
    }, [contextualStrings, resetVoiceState]);

    const handleStopListening = useCallback(() => {
        try {
            ExpoSpeechRecognitionModule.stop();
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
        }
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!parsed.amount || parsed.amount <= 0) {
            Alert.alert(t('Opps'), 'Please say an amount like spent 500 on groceries.');
            return;
        }

        if (!parsed.category) {
            Alert.alert(t('Opps'), 'Please say a category like groceries, rent, salary, or transport.');
            return;
        }

        setIsSaving(true);
        try {
            await addTransaction(
                user?.id || 0,
                parsed.amount,
                parsed.type,
                parsed.category.name,
                new Date().toISOString(),
                parsed.note,
                parsed.category.icon,
                parsed.category.color,
            );

            showSuccess({
                title: t('success'),
                message: `${parsed.type === 'income' ? t('income') : t('expense')} added from voice.`,
                onConfirm: () => router.replace('/(tabs)/transactions'),
            });
        } catch (error) {
            console.error('Failed to save voice transaction:', error);
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsSaving(false);
        }
    }, [parsed.amount, parsed.category, parsed.note, parsed.type, showSuccess, t, user?.id]);

    return (
        <View style={[tw`flex-1`, { backgroundColor: '#F4FBF9' }]}>
            <StatusBar backgroundColor="#F4FBF9" barStyle="dark-content" />

            <View style={tw`px-6 pt-14 pb-4  flex-row items-center justify-between`}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`w-11 h-11 rounded-full items-center justify-center bg-white`}
                >
                    <ArrowLeft size={20} color={theme.colors.darkSlate} />
                </TouchableOpacity>
                <Text style={tw`text-slate-900 text-lg font-extrabold`}>Expense Add</Text>
                <View style={tw`w-11 h-11`} />
            </View>

            <View style={tw`flex-1 px-6 pb-10 justify-between`}>
                <View style={tw`items-center pt-10`}>
                    <View style={tw`flex-row items-center mb-8`}>
                        <View style={[tw`w-8 h-1 rounded-full mr-2`, { backgroundColor: theme.colors.primary }]} />
                        <View style={[tw`w-8 h-1 rounded-full`, { backgroundColor: currentStep === 2 ? theme.colors.primary : theme.colors.gray300 }]} />
                    </View>

                    {!spokenText ? (
                        <>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                disabled={isCheckingAvailability || !isRecognitionAvailable}
                                onPress={isRecognizing ? handleStopListening : handleStartListening}
                                style={[
                                    tw`w-40 h-40 rounded-full items-center justify-center`,
                                    { backgroundColor: isRecognizing ? '#DDF7F0' : '#FFFFFF' }
                                ]}
                            >
                                {isCheckingAvailability ? (
                                    <ActivityIndicator color={theme.colors.primary} />
                                ) : isRecognizing ? (
                                    <MicOff size={58} color={theme.colors.primary} />
                                ) : (
                                    <Mic size={58} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>

                            <Text style={tw`text-slate-900 text-2xl font-extrabold mt-8`}>
                                {isRecognizing ? 'Listening...' : 'Tap to speak'}
                            </Text>
                            <Text style={tw`text-slate-500 text-center text-sm leading-6 mt-3 max-w-[270px]`}>
                                {isRecognizing
                                    ? 'Speak now. Tap the mic again when you finish.'
                                    : 'Say something like spent 500 on groceries or received 20000 salary.'}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-[2px] mb-4`}>
                                Detected Text
                            </Text>
                            <Text style={tw`text-slate-900 text-center text-4xl font-extrabold leading-[52px]`}>
                                {spokenText}
                            </Text>

                            <View style={tw`w-full bg-white rounded-[28px] p-5 mt-10`}>
                                <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-[2px] mb-4`}>
                                    Confirm Preview
                                </Text>

                                <View style={tw`flex-row justify-between mb-4`}>
                                    <View>
                                        <Text style={tw`text-slate-400 text-xs mb-1`}>Type</Text>
                                        <Text style={tw`text-slate-900 text-lg font-bold`}>
                                            {parsed.type === 'income' ? t('income') : t('expense')}
                                        </Text>
                                    </View>
                                    <View style={tw`items-end`}>
                                        <Text style={tw`text-slate-400 text-xs mb-1`}>Amount</Text>
                                        <Text style={tw`text-slate-900 text-lg font-bold`}>
                                            {parsed.amount ? `${currencySymbol}${parsed.amount}` : 'Not detected'}
                                        </Text>
                                    </View>
                                </View>

                                <View>
                                    <Text style={tw`text-slate-400 text-xs mb-1`}>Category</Text>
                                    <Text style={tw`text-slate-900 text-lg font-bold`}>
                                        {parsed.category?.name || 'Not detected'}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}

                    {errorMessage ? (
                        <Text style={tw`text-red-600 text-center text-sm mt-6 max-w-[300px]`}>
                            {errorMessage}
                        </Text>
                    ) : null}
                </View>

                <View>
                    {spokenText ? (
                        <>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={isSaving}
                                onPress={handleConfirm}
                                style={[
                                    tw`rounded-2xl py-4 items-center flex-row justify-center mb-3`,
                                    { backgroundColor: theme.colors.primary }
                                ]}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={theme.colors.white} style={tw`mr-2`} />
                                ) : (
                                    <Check size={20} color={theme.colors.white} style={tw`mr-2`} />
                                )}
                                <Text style={tw`text-white text-base font-bold`}>
                                    {isSaving ? t('loading') : 'Confirm and Add'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleStartListening}
                                style={tw`rounded-2xl py-4 items-center flex-row justify-center bg-white`}
                            >
                                <RotateCcw size={18} color={theme.colors.darkSlate} style={tw`mr-2`} />
                                <Text style={tw`text-slate-900 text-base font-bold`}>
                                    Try Again
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={tw`text-center text-slate-400 text-xs`}>
                            Fast voice entry with one tap and one confirm.
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}
