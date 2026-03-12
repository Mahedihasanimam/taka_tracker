import tw from '@/assets/lib/tailwind';
import { theme } from '@/constants/theme';
import { useCurrency } from '@/context/CurrencyContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

const CurrencyScreen = () => {
  const router = useRouter();
  const { currency, setCurrency, currencyOptions } = useCurrency();

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={tw`px-5 pt-14 pb-8 rounded-b-[28px]`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3`}>
            <ChevronLeft size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-white text-xl font-bold`}>Currency</Text>
            <Text style={tw`text-white/75 text-xs`}>Choose default currency for the app</Text>
          </View>
        </View>
      </LinearGradient>

      <SafeAreaView style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`p-5 pb-24`} showsVerticalScrollIndicator={false}>
          <View style={tw`bg-white rounded-2xl overflow-hidden border border-slate-100`}>
            {currencyOptions.map((option, index) => {
              const active = option.code === currency;
              return (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => setCurrency(option.code)}
                  style={tw`px-4 py-4 flex-row items-center justify-between ${index < currencyOptions.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <View>
                    <Text style={tw`text-slate-800 font-semibold`}>{option.code}</Text>
                    <Text style={tw`text-slate-500 text-xs mt-0.5`}>{option.label}</Text>
                  </View>
                  {active ? <Check size={18} color={theme.colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default CurrencyScreen;
