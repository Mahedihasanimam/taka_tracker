import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { theme } from "@/constants/theme";
import { registerUser } from '@/services/db';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import tw from 'twrnc';


const SignUpScreen = () => {
  const { lang, switchLanguage, t } = useLanguage();
  const { showSuccess } = useSuccessModal();

  // State variables
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Toggles for password visibility
  const [secureText, setSecureText] = useState(true);
  const [secureConfirmText, setSecureConfirmText] = useState(true);

  // Validation and Registration Handler
  const handleSignUp = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t('Opps') || 'Opps', t('nameRequired') || 'Name is required');
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      Alert.alert(t('Opps') || 'Opps', t('validPhone') || 'Enter a valid phone number');
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('Opps') || 'Opps', t('passwordLength') || 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('Opps') || 'Opps', t('passwordMismatch') || 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(name.trim(), phone.trim(), password);

      if (result.success && result.userId) {
        showSuccess({
          title: t('success') || 'Success',
          message: t('registrationSuccess') || 'Registration successful!',
          onConfirm: () => router.replace('/auth/signIn'),
        });
      } else {
        Alert.alert(
          t('Opps') || 'Opps',
          result.message || t('registrationFailed') || 'Registration failed'
        );
      }
    } catch (error) {
      Alert.alert(t('Opps') || 'Opps', t('somethingWrong') || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>

      {/* --- HEADER SECTION (Consistent with Login) --- */}
      <View style={[tw`h-52 px-6 pt-12 relative`, { backgroundColor: theme.colors.primary }]}>
        <View style={tw`flex-row justify-between items-start`}>
          <View>
            <Text style={tw`text-white text-2xl font-bold tracking-wide`}>
              {lang === 'bn' ? 'টাকাট্র্যাক' : 'TakaTrack'}
            </Text>
            <Text style={tw`text-white text-xl font-medium opacity-90`}>
              {lang === 'bn' ? 'TakaTrack' : 'টাকাট্র্যাক'}
            </Text>
          </View>

          {/* Language Toggle */}
          <View
            style={[
              tw`flex-row rounded-full p-1 border`,
              { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => switchLanguage('bn')}
              style={tw`px-3 py-1.5 rounded-full ${lang === 'bn' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
            >
              <Text style={[tw`text-[12px] font-bold`, { color: lang === 'bn' ? theme.colors.primary : `${theme.colors.white}B3` }]}>বাংলা</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => switchLanguage('en')}
              style={tw`px-3 py-1.5 rounded-full ${lang === 'en' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
            >
              <Text style={[tw`text-[12px] font-bold`, { color: lang === 'en' ? theme.colors.primary : `${theme.colors.white}B3` }]}>ENG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- FORM SECTION --- */}
      <View style={tw`flex-1 bg-white rounded-t-[32px] -mt-12 shadow-xl overflow-hidden`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView
            contentContainerStyle={tw`px-8 pt-10 pb-8 flex-grow`}
            showsVerticalScrollIndicator={false}
          >

            {/* Page Title */}
            <Text style={tw`text-3xl font-bold text-center text-gray-900 mb-8`}>
              {t('signUpTitle')}
            </Text>

            {/* 1. Name Input */}
            <View style={tw`mb-5`}>
              <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('nameLabel')}</Text>
              <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus:border-teal-600`}>
                <User size={20} color={theme.colors.gray400} />
                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                <TextInput
                  placeholder={t('namePlaceholder')}
                  placeholderTextColor={theme.colors.gray400}
                  value={name}
                  onChangeText={setName}
                  style={tw`flex-1 text-gray-800 text-base font-medium`}
                />
              </View>
            </View>

            {/* 2. Phone Input */}
            <View style={tw`mb-5`}>
              <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('phoneLabel')}</Text>
              <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus:border-teal-600`}>
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

            {/* 3. Password Input */}
            <View style={tw`mb-5`}>
              <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('passLabel')}</Text>
              <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus:border-teal-600`}>
                <Lock size={20} color={theme.colors.gray400} />
                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                <TextInput
                  placeholder={t('passPlaceholder')}
                  placeholderTextColor={theme.colors.gray400}
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  style={tw`flex-1 text-gray-800 text-base font-medium`}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  {secureText ? <EyeOff size={20} color={theme.colors.gray400} /> : <Eye size={20} color={theme.colors.primary} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Confirm Password Input */}
            <View style={tw`mb-8`}>
              <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('confirmPassLabel')}</Text>
              <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus:border-teal-600`}>
                <Lock size={20} color={theme.colors.gray400} />
                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                <TextInput
                  placeholder={t('confirmPassPlaceholder')}
                  placeholderTextColor={theme.colors.gray400}
                  secureTextEntry={secureConfirmText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={tw`flex-1 text-gray-800 text-base font-medium`}
                />
                <TouchableOpacity onPress={() => setSecureConfirmText(!secureConfirmText)}>
                  {secureConfirmText ? <EyeOff size={20} color={theme.colors.gray400} /> : <Eye size={20} color={theme.colors.primary} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSignUp}
              disabled={isLoading}
              style={[
                tw`rounded-2xl py-4 shadow-lg mb-4 ${isLoading ? 'opacity-70' : ''}`,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={tw`text-white text-center font-bold text-lg tracking-wide`}>
                  {t('signUpBtn')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={tw`flex-row justify-center pb-8`}>
              <Text style={tw`text-gray-500 text-base`}>
                {t('haveAccount')}
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/auth/signIn')}>
                <Text style={[tw`font-bold text-base underline`, { color: theme.colors.primary }]}>
                  {t('logInLink')}
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export default SignUpScreen;
