import { useAuth } from '@/context/AuthContext';
import { theme } from "@/constants/theme";
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { changeUserPassword } from '@/services/db';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from 'lucide-react-native';
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

const ChangePasswordScreen = () => {
    const { t } = useLanguage();
    const { showSuccess } = useSuccessModal();
    const { user, logout } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength indicator
    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return { level: 0, text: '', color: theme.colors.gray200 };
        if (password.length < 6) return { level: 1, text: t('weak'), color: theme.colors.danger };
        if (password.length < 8) return { level: 2, text: t('medium'), color: theme.colors.warning };
        if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
            return { level: 4, text: t('strong'), color: theme.colors.success };
        }
        return { level: 3, text: t('good'), color: theme.colors.secondary };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword) {
            Alert.alert(t('Opps'), t('currentPasswordRequired'));
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            Alert.alert(t('Opps'), t('passwordLength'));
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert(t('Opps'), t('passwordMismatch'));
            return;
        }
        if (currentPassword === newPassword) {
            Alert.alert(t('Opps'), t('samePasswordError'));
            return;
        }

        setIsLoading(true);
        try {
            const result = await changeUserPassword(user!.id, currentPassword, newPassword);
            if (result.success) {
                showSuccess({
                    title: t('success'),
                    message: t('passwordChangeSuccess'),
                    buttonText: t('loginAgain'),
                    onConfirm: async () => {
                        await logout();
                    },
                });
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
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={tw`bg-teal-600 h-28 px-6 pt-12`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                    <ArrowLeft size={24} color={theme.colors.white} />
                    <Text style={tw`text-white text-lg font-bold ml-2`}>{t('changePassword')}</Text>
                </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={tw`flex-1 bg-white rounded-t-[32px] -mt-4`}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={tw`flex-1`}
                >
                    <ScrollView contentContainerStyle={tw`px-6 pt-8 pb-8`}>

                        {/* Security Icon */}
                        <View style={tw`items-center mb-8`}>
                            <View style={tw`w-20 h-20 bg-teal-50 rounded-full items-center justify-center mb-3`}>
                                <Shield size={40} color={theme.colors.primary} />
                            </View>
                            <Text style={tw`text-gray-600 text-center text-sm px-4`}>
                                {t('changePasswordDesc')}
                            </Text>
                        </View>

                        {/* Current Password */}
                        <View style={tw`mb-5`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('currentPassword')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <Lock size={20} color={theme.colors.gray400} />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('currentPasswordPlaceholder')}
                                    placeholderTextColor={theme.colors.gray400}
                                    secureTextEntry={!showCurrentPassword}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    {showCurrentPassword ? (
                                        <EyeOff size={20} color={theme.colors.gray400} />
                                    ) : (
                                        <Eye size={20} color={theme.colors.gray400} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('newPassword')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <Lock size={20} color={theme.colors.gray400} />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('newPasswordPlaceholder')}
                                    placeholderTextColor={theme.colors.gray400}
                                    secureTextEntry={!showNewPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    {showNewPassword ? (
                                        <EyeOff size={20} color={theme.colors.gray400} />
                                    ) : (
                                        <Eye size={20} color={theme.colors.gray400} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Strength Indicator */}
                        {newPassword.length > 0 && (
                            <View style={tw`mb-5`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <View style={tw`flex-1 flex-row h-1.5 rounded-full overflow-hidden bg-gray-200`}>
                                        {[1, 2, 3, 4].map((level) => (
                                            <View
                                                key={level}
                                                style={[
                                                    tw`flex-1 mx-0.5 rounded-full`,
                                                    {
                                                        backgroundColor: level <= passwordStrength.level
                                                            ? passwordStrength.color
                                                            : theme.colors.gray200
                                                    }
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[tw`ml-3 text-xs font-bold`, { color: passwordStrength.color }]}>
                                        {passwordStrength.text}
                                    </Text>
                                </View>
                                <Text style={tw`text-gray-400 text-xs ml-1`}>
                                    {t('passwordHint')}
                                </Text>
                            </View>
                        )}

                        {/* Confirm Password */}
                        <View style={tw`mb-8`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('confirmPassLabel')}
                            </Text>
                            <View style={tw`flex-row items-center border ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : 'border-gray-200'} rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <Lock size={20} color={theme.colors.gray400} />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('confirmPassPlaceholder')}
                                    placeholderTextColor={theme.colors.gray400}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color={theme.colors.gray400} />
                                    ) : (
                                        <Eye size={20} color={theme.colors.gray400} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {confirmPassword && confirmPassword !== newPassword && (
                                <Text style={tw`text-red-500 text-xs mt-1 ml-1`}>
                                    {t('passwordMismatch')}
                                </Text>
                            )}
                            {confirmPassword && confirmPassword === newPassword && newPassword.length > 0 && (
                                <Text style={tw`text-green-500 text-xs mt-1 ml-1`}>
                                    {t('passwordMatch')}
                                </Text>
                            )}
                        </View>

                        {/* Change Password Button */}
                        <TouchableOpacity
                            onPress={handleChangePassword}
                            disabled={isLoading}
                            activeOpacity={0.8}
                            style={tw`bg-teal-600 rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={theme.colors.white} />
                            ) : (
                                <Text style={tw`text-white text-center font-bold text-lg`}>
                                    {t('updatePassword')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Security Note */}
                        <View style={tw`mt-6 bg-amber-50 p-4 rounded-2xl`}>
                            <Text style={tw`text-amber-700 text-xs text-center`}>
                                {t('securityNote')}
                            </Text>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

export default ChangePasswordScreen;
