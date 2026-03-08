import { useLanguage } from '@/context/LanguageContext';
import { resetPassword } from '@/services/db';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
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

const ResetPasswordScreen = () => {
    const { lang, t } = useLanguage();
    const { phone } = useLocalSearchParams<{ phone: string }>();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [secureText, setSecureText] = useState(true);
    const [secureConfirmText, setSecureConfirmText] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (password.length < 6) {
            Alert.alert(t('Opps'), t('passwordLength'));
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert(t('Opps'), t('passwordMismatch'));
            return;
        }

        setIsLoading(true);
        try {
            const result = await resetPassword(phone!, password);
            if (result.success) {
                Alert.alert(
                    t('success'),
                    t('passwordResetSuccess'),
                    [{ text: 'OK', onPress: () => router.replace('/auth/signIn') }]
                );
            } else {
                Alert.alert(t('Opps'), result.message || t('somethingWrong'));
            }
        } catch (error) {
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor="#0D9488" barStyle="light-content" />

            {/* Header */}
            <View style={tw`bg-[#0D9488] h-44 px-6 pt-12`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                    <ArrowLeft size={24} color="#fff" />
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
                            {t('resetPasswordTitle')}
                        </Text>
                        <Text style={tw`text-gray-500 mb-8`}>
                            {t('resetPasswordDesc')}
                        </Text>

                        {/* New Password */}
                        <View style={tw`mb-5`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('newPassword')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <Lock size={20} color="#9ca3af" />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('newPasswordPlaceholder')}
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={secureText}
                                    value={password}
                                    onChangeText={setPassword}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                                    {secureText ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#0D9488" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={tw`mb-8`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('confirmPassLabel')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <Lock size={20} color="#9ca3af" />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('confirmPassPlaceholder')}
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={secureConfirmText}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                                <TouchableOpacity onPress={() => setSecureConfirmText(!secureConfirmText)}>
                                    {secureConfirmText ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#0D9488" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleReset}
                            disabled={isLoading}
                            activeOpacity={0.8}
                            style={tw`bg-[#0D9488] rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={tw`text-white text-center font-bold text-lg`}>
                                    {t('resetPasswordBtn')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

export default ResetPasswordScreen;
