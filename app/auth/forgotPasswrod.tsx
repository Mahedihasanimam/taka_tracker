

import { useLanguage } from '@/context/LanguageContext';
import { theme } from "@/constants/theme";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, KeyRound, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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
  const { t } = useLanguage();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSendCode = () => {
    if (phone.length < 11) return;
    router.push('/auth/otpVerify');
  };

  const isButtonDisabled = phone.length < 11;

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <StatusBar backgroundColor={theme.colors.primaryDark} barStyle="light-content" />

      {/* --- HEADER --- */}
      {/* FIXED: Increased height to h-80 so text doesn't get covered */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={tw`h-80 px-6 pt-12 pb-12 rounded-b-[36px] shadow-lg relative z-0 justify-start`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`bg-white/20 w-10 h-10 rounded-full items-center justify-center mb-6`}
        >
          <ArrowLeft size={24} color={theme.colors.white} />
        </TouchableOpacity>

        <Text style={tw`text-white text-3xl font-extrabold tracking-wide mb-2 pt-1`}>
          {t('forgotTitle')}
        </Text>
        <Text style={tw`text-white/80 text-base font-medium pr-8 leading-6`}>
          {t('forgotSub')}
        </Text>
      </LinearGradient>

      {/* --- BODY --- */}
      {/* FIXED: Adjusted margin to overlap nicely without hiding header text */}
      <View style={tw`flex-1 -mt-24 px-6`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-10`}
          >

            {/* White Card */}
            <View style={tw`bg-white rounded-[32px] p-8 shadow-xl shadow-gray-200 mb-6`}>

              {/* Icon */}
              <View style={tw`items-center mb-8`}>
                <View style={tw`w-20 h-20 bg-teal-50 rounded-full items-center justify-center border-4 border-white shadow-sm`}>
                  <KeyRound size={32} color={theme.colors.primary} />
                </View>
              </View>

              {/* Input */}
              <View style={tw`mb-8`}>
                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>
                  {t('phoneLabel')}
                </Text>
                <View
                  style={tw`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 
                  ${isFocused ? 'border-teal-600 bg-teal-50/30' : 'border-gray-200'}`}
                >
                  <Phone
                    size={20}
                    color={isFocused ? theme.colors.primary : theme.colors.gray400}
                  />
                  <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                  <TextInput
                    placeholder={t('phonePlaceholder')}
                    placeholderTextColor={theme.colors.gray400}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                  />
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
                style={tw`rounded-2xl py-4 items-center mb-6 
                ${isButtonDisabled ? 'bg-gray-200' : 'bg-teal-600 shadow-lg shadow-teal-200'}`}
              >
                <Text style={tw`font-bold text-lg tracking-wide ${isButtonDisabled ? 'text-gray-400' : 'text-white'}`}>
                  {t('sendCodeBtn')}
                </Text>
              </TouchableOpacity>

              {/* Back Link */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={tw`items-center py-2`}
              >
                <Text style={tw`text-gray-500 font-semibold`}>
                  {t('backToLogin')}
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export default ForgotPasswordScreen;
