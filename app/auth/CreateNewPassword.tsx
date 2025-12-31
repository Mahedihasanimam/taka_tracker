import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, Lock, ShieldCheck, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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

const CreateNewPassword = () => {
  const { t } = useLanguage();
  const router = useRouter();

  // State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Focus States
  const [focusPass, setFocusPass] = useState(false);
  const [focusConfirm, setFocusConfirm] = useState(false);

  // Validation Logic
  const isLengthValid = password.length >= 6;
  const isMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isLengthValid && isMatch;

  const handleReset = () => {
    // --- Success Logic ---
    // In a real app, you would make an API call here first
    Alert.alert('Success', t('successMsg'), [
      { text: 'OK', onPress: () => router.push('/auth/signIn') }
    ]);
  };

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <StatusBar backgroundColor="#be125a" barStyle="light-content" />

      {/* --- HEADER --- */}
      {/* Consistent Height and Padding with previous screens */}
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

        <Text style={tw`text-white text-3xl font-extrabold tracking-wide mb-2`}>
          {t('newPassTitle')}
        </Text>
        <Text style={tw`text-white/80 text-base font-medium pr-10 leading-6`}>
          {t('newPassSub')}
        </Text>
      </LinearGradient>

      {/* --- BODY --- */}
      <View style={tw`flex-1 -mt-24 px-6`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-10`}>

            {/* Card */}
            <View style={tw`bg-white rounded-[32px] p-8 shadow-xl shadow-gray-200 mb-6`}>

              {/* Hero Icon */}
              <View style={tw`items-center mb-8`}>
                <View style={tw`w-20 h-20 bg-green-50 rounded-full items-center justify-center border-4 border-white shadow-sm`}>
                  <ShieldCheck size={32} color="#10b981" />
                </View>
              </View>

              {/* 1. New Password Input */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>
                  {t('newPassLabel')}
                </Text>
                <View
                  style={tw`flex-row items-center border rounded-2xl px-4 py-3.5 bg-gray-50 
                  ${focusPass ? 'border-[#e2136e] bg-pink-50/20' : 'border-gray-200'}`}
                >
                  <Lock size={20} color={focusPass ? '#e2136e' : '#9ca3af'} />
                  <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                  <TextInput
                    placeholder="Min 6 characters"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusPass(true)}
                    onBlur={() => setFocusPass(false)}
                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    {showPass ? <Eye size={20} color="#e2136e" /> : <EyeOff size={20} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>
                {/* Length Hint */}
                {password.length > 0 && !isLengthValid && (
                  <Text style={tw`text-orange-500 text-[10px] mt-1 ml-1`}>Password must be at least 6 characters</Text>
                )}
              </View>

              {/* 2. Confirm Password Input */}
              <View style={tw`mb-8`}>
                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>
                  {t('confirmPassLabel')}
                </Text>
                <View
                  style={tw`flex-row items-center border rounded-2xl px-4 py-3.5 bg-gray-50 
                  ${confirmPassword.length > 0 && isMatch ? 'border-green-500 bg-green-50/30' :
                      confirmPassword.length > 0 && !isMatch ? 'border-red-400 bg-red-50/30' :
                        focusConfirm ? 'border-[#e2136e] bg-pink-50/20' : 'border-gray-200'}`}
                >
                  <Lock size={20} color={focusConfirm ? '#e2136e' : '#9ca3af'} />
                  <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                  <TextInput
                    placeholder="Re-enter password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPass}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusConfirm(true)}
                    onBlur={() => setFocusConfirm(false)}
                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                  />

                  {/* Visual Validation Icon */}
                  {confirmPassword.length > 0 && (
                    <View style={tw`ml-2`}>
                      {isMatch ? <Check size={18} color="#10b981" /> : <X size={18} color="#ef4444" />}
                    </View>
                  )}

                  <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={tw`ml-2`}>
                    {showConfirmPass ? <Eye size={20} color="#e2136e" /> : <EyeOff size={20} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                onPress={handleReset}
                disabled={!canSubmit}
                activeOpacity={0.8}
                style={tw`rounded-2xl py-4 items-center mb-4 
                ${canSubmit ? 'bg-[#10b981] shadow-lg shadow-green-200' : 'bg-gray-200'}`}
              >
                <Text style={tw`font-bold text-lg tracking-wide ${canSubmit ? 'text-white' : 'text-gray-400'}`}>
                  {t('resetBtn')}
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export default CreateNewPassword;