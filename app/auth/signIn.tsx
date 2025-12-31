import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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
  const { lang, switchLanguage, t } = useLanguage();
  const router = useRouter();

  // Local state
  const [secureText, setSecureText] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

      {/* --- HEADER SECTION --- */}
      <View style={tw`bg-[#e2136e] h-52 px-6 pt-12 relative`}>
        <View style={tw`flex-row justify-between items-start`}>
          {/* App Name in Header */}
          <View>
            <Text style={tw`text-white text-2xl font-bold tracking-wide`}>
              {lang === 'bn' ? 'টাকাট্র্যাক' : 'TakaTrack'}
            </Text>
            <Text style={tw`text-white text-xl font-medium opacity-90`}>
              {lang === 'bn' ? 'TakaTrack' : 'টাকাট্র্যাক'}
            </Text>
          </View>

          {/* Language Toggle */}
          <View style={tw`flex-row bg-[#be125a] rounded-full p-1 border border-[#a3124a]`}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => switchLanguage('bn')}
              style={tw`px-3 py-1.5 rounded-full ${lang === 'bn' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
            >
              <Text style={tw`text-[12px] font-bold ${lang === 'bn' ? 'text-[#e2136e]' : 'text-white/70'}`}>
                বাংলা
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => switchLanguage('en')}
              style={tw`px-3 py-1.5 rounded-full ${lang === 'en' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
            >
              <Text style={tw`text-[12px] font-bold ${lang === 'en' ? 'text-[#e2136e]' : 'text-white/70'}`}>
                ENG
              </Text>
            </TouchableOpacity>
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
              <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus:border-[#e2136e]`}>
                <Phone size={20} color="#9ca3af" />
                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                <TextInput
                  placeholder={t('phonePlaceholder')}
                  placeholderTextColor="#9ca3af"
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
              <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus:border-[#e2136e]`}>
                <Lock size={20} color="#9ca3af" />
                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                <TextInput
                  placeholder={t('passPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  style={tw`flex-1 text-gray-800 text-base font-medium`}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  {secureText ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#e2136e" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={() => router.push('/auth/forgotPasswrod')} style={tw`items-end mb-10`}>
              <Text style={tw`text-gray-500 text-sm font-medium`}>
                {t('forgotPass')}
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
              style={tw`bg-[#e2136e] rounded-2xl py-4 shadow-lg shadow-[#e2136e]/40`}
            >
              <Text style={tw`text-white text-center font-bold text-lg tracking-wide`}>
                {t('loginBtn')}
              </Text>
            </TouchableOpacity>

            {/* Footer Sign Up Link */}
            <View style={tw`flex-row justify-center mt-auto pt-10`}>
              <Text style={tw`text-gray-500 text-base`}>
                {t('noAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signUp')}>
                <Text style={tw`text-[#e2136e] font-bold text-base underline`}>
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