import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

const OtpVerify = () => {
  const { t } = useLanguage();
  const router = useRouter();

  // State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Refs for auto-focus handling
  const inputs = useRef<(TextInput | null)[]>([]);

  // Timer Countdown Logic
  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Input Change
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // UX: Auto-focus next input if value is entered
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // UX: Dismiss keyboard if last digit entered
    if (value && index === 5) {
      inputs.current[index]?.blur();
    }
  };

  // UX: Handle Backspace to move to previous input
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isButtonDisabled = otp.some((digit) => digit === '');

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <StatusBar backgroundColor="#be125a" barStyle="light-content" />

      {/* --- HEADER --- */}
      {/* Increased height to prevent text overlap */}
      <LinearGradient
        colors={['#e2136e', '#be125a']}
        style={tw`h-80 px-6 pt-12 pb-12 rounded-b-[36px] shadow-lg relative z-0 justify-start`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`bg-white/20 w-10 h-10 rounded-full items-center justify-center mb-6`}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text style={tw`text-white text-3xl font-extrabold tracking-wide mb-1`}>
          {t('otpTitle')}
        </Text>
        <Text style={tw`text-white/80 text-base font-medium`}>
          {t('otpSub')}
        </Text>
        <Text style={tw`text-white font-bold text-lg mt-1 tracking-wider`}>
          +880 1712 345 678
        </Text>
      </LinearGradient>

      {/* --- BODY --- */}
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
                <View style={tw`w-20 h-20 bg-pink-50 rounded-full items-center justify-center border-4 border-white shadow-sm mb-4`}>
                  <MessageCircle size={32} color="#e2136e" />
                </View>
                <Text style={tw`text-gray-500 text-sm font-bold uppercase tracking-widest`}>
                  {t('otpLabel')}
                </Text>
              </View>

              {/* OTP Inputs (6 Boxes) */}
              <View style={tw`flex-row justify-between mb-8`}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputs.current[index] = ref)}
                    style={tw`w-11 h-14 border-2 rounded-xl text-center text-xl font-bold text-gray-800 
                    ${focusedIndex === index || digit ? 'border-[#e2136e] bg-pink-50/20' : 'border-gray-200 bg-gray-50'}`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    onChangeText={(v) => handleOtpChange(v, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                disabled={isButtonDisabled}
                onPress={() => router.push('/auth/CreateNewPassword')}
                activeOpacity={0.8}
                style={tw`rounded-2xl py-4 items-center mb-6 
                ${isButtonDisabled ? 'bg-gray-200' : 'bg-[#10b981] shadow-lg shadow-green-200'}`}
              >
                <Text style={tw`font-bold text-lg tracking-wide ${isButtonDisabled ? 'text-gray-400' : 'text-white'}`}>
                  {t('otpVerifyBtn')}
                </Text>
              </TouchableOpacity>

              {/* Resend Timer */}
              <View style={tw`flex-row justify-center items-center bg-gray-50 py-3 rounded-xl`}>
                <Text style={tw`text-gray-500 text-sm mr-1 font-medium`}>
                  {t('otpResend')}
                </Text>
                {timer > 0 ? (
                  <Text style={tw`text-[#e2136e] font-bold text-sm`}>
                    00:{timer < 10 ? `0${timer}` : timer}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={() => setTimer(30)}>
                    <Text style={tw`text-[#e2136e] font-bold text-sm underline`}>
                      {t('otpResendLink')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export default OtpVerify;