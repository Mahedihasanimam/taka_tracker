import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { loginWithGoogleIdentity, loginUser } from '@/services/db';
import { signInWithGoogleViaSupabase } from '@/services/googleAuth';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

const LoginScreen = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const { showSuccess } = useSuccessModal();
  const router = useRouter();

  // Local state
  const [secureText, setSecureText] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Handle Login
  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert(t('Opps'), t('validPhone'));
      return;
    }
    if (!password.trim()) {
      Alert.alert(t('Opps'), t('passwordRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(phone.trim(), password);

      if (result.success && result.user && result.token) {
        showSuccess({
          title: t('success'),
          message: t('loginSuccess'),
        });
        await login(result.user, result.token);

      } else {
        Alert.alert(t('Opps'), result.message || t('loginFailed'));
      }
    } catch (error) {
      Alert.alert(t('Opps'), t('somethingWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;

    setIsGoogleLoading(true);
    try {
      const oauthResult = await signInWithGoogleViaSupabase();
      if (!oauthResult.success || !oauthResult.profile) {
        Alert.alert(t('Opps'), oauthResult.message || t('somethingWrong'));
        return;
      }

      const appLoginResult = await loginWithGoogleIdentity(oauthResult.profile);
      if (appLoginResult.success && appLoginResult.user && appLoginResult.token) {
        showSuccess({
          title: t('success'),
          message: t('loginSuccess'),
        });
        await login(appLoginResult.user, appLoginResult.token);
      } else {
        Alert.alert(t('Opps'), appLoginResult.message || t('loginFailed'));
      }
    } catch {
      Alert.alert(t('Opps'), t('somethingWrong'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

      {/* --- HEADER SECTION --- */}
      <View style={[tw`h-52 px-6 pt-12 relative`, { backgroundColor: theme.colors.primary }]}>
        <View style={tw`flex-row justify-between items-start`}>
          {/* App Name in Header */}
          <View>
            <Text style={tw`text-white text-2xl font-bold tracking-wide`}>
              TakaTrack
            </Text>
            <Text style={tw`text-white text-xl font-medium opacity-90`}>
              Expense Tracker
            </Text>
          </View>
        </View>
      </View>

      {/* --- MAIN CARD SECTION --- */}
      <View style={tw`flex-1 bg-white rounded-t-[32px] -mt-12 shadow-xl overflow-hidden`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView
            contentContainerStyle={tw`px-8 pt-8 pb-8 flex-grow`}
            showsVerticalScrollIndicator={false}
          >

            {/* --- LOGO SECTION --- */}
            <View style={tw`items-center mb-6`}>
              {/* REPLACE THIS VIEW WITH YOUR IMAGE */}
              {/* <Image source={require('../../assets/logo.png')} style={tw`w-20 h-20`} resizeMode="contain" /> */}

              {/* Placeholder Logo Icon */}
              <View style={tw`w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-white shadow-sm`}>
                <Image source={require('../../assets/images/logo.png')} style={tw`w-16 h-14`} resizeMode="contain" />
              </View>
            </View>

            {/* Page Title */}
            <Text style={tw`text-3xl font-bold text-center text-gray-900 mb-8`}>
              {t('title')}
            </Text>

            {/* Phone Input Field */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                {t('phoneLabel')}
              </Text>
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

            {/* Password Input Field */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                {t('passLabel')}
              </Text>
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

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={() => router.push('/auth/forgotPassword')} style={tw`items-end mb-10`}>
              <Text style={tw`text-gray-500 text-sm font-medium`}>
                {t('forgotPass')}
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
              style={[
                tw`rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`,
                { backgroundColor: theme.colors.primary }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={tw`text-white text-center font-bold text-lg tracking-wide`}>
                  {t('loginBtn')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading}
              activeOpacity={0.8}
              style={[
                tw`rounded-2xl py-4 mt-3 border border-gray-200 bg-white ${isGoogleLoading ? 'opacity-70' : ''}`,
              ]}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <Text style={tw`text-gray-800 text-center font-bold text-base tracking-wide`}>
                  Continue with Google
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer Sign Up Link */}
            <View style={tw`flex-row justify-center mt-auto pt-10`}>
              <Text style={tw`text-gray-500 text-base`}>
                {t('noAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signUp')}>
                <Text style={[tw`font-bold text-base underline`, { color: theme.colors.primary }]}>
                  {t('signUp')}
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export default LoginScreen;
