import { useLanguage } from '@/context/LanguageContext';
import { theme } from "@/constants/theme";
import { checkPhoneExists } from '@/services/db';
import { router } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const ForgotPasswordScreen = () => {
    const { lang, t } = useLanguage();
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!phone.trim() || phone.length < 11) {
            Alert.alert(t('Opps'), t('validPhone'));
            return;
        }

        setIsLoading(true);
        try {
            const exists = await checkPhoneExists(phone.trim());
            if (exists) {
                // Navigate to reset password with phone
                router.push({
                    pathname: '/auth/resetPassword',
                    params: { phone: phone.trim() }
                });
            } else {
                Alert.alert(t('Opps'), t('phoneNotFound'));
            }
        } catch (error) {
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={tw`bg-teal-600 h-44 px-6 pt-12`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                    <ArrowLeft size={24} color={theme.colors.white} />
                    <Text style={tw`text-white text-lg font-medium ml-2`}>{t('back')}</Text>
                </TouchableOpacity>
                <Text style={tw`text-white text-2xl font-bold mt-4`}>
                    {lang === 'bn' ? 'টাকাট্র্যাক' : 'TakaTrack'}
                </Text>
            </View>

            {/* Form */}
            <View style={tw`flex-1 bg-white rounded-t-[32px] -mt-8 shadow-xl`}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={tw`flex-1`}
                >
                    <ScrollView contentContainerStyle={tw`px-8 pt-10 pb-8`}>
                        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                            {t('forgotPasswordTitle')}
                        </Text>
                        <Text style={tw`text-gray-500 mb-8`}>
                            {t('forgotPasswordDesc')}
                        </Text>

                        {/* Phone Input */}
                        <View style={tw`mb-6`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('phoneLabel')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <Phone size={20} color={theme.colors.gray400} />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('phonePlaceholder')}
                                    placeholderTextColor={theme.colors.gray400}
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading}
                            activeOpacity={0.8}
                            style={tw`bg-teal-600 rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={theme.colors.white} />
                            ) : (
                                <Text style={tw`text-white text-center font-bold text-lg`}>
                                    {t('continueBtn')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity onPress={() => router.back()} style={tw`mt-6`}>
                            <Text style={tw`text-center text-teal-600 font-semibold`}>
                                {t('backToLogin')}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

export default ForgotPasswordScreen;
