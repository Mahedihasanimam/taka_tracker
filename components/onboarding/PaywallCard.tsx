import tw from '@/assets/lib/tailwind';
import { theme } from '@/constants/theme';
import { typography } from '@/constants/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, PiggyBank } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type BillingCycle = 'monthly' | 'yearly';

export type PaywallPlan = {
  key: BillingCycle;
  label: string;
  headlinePrice: string;
  subPrice: string;
  badge: string;
  selectedSummary: string;
  billingNote: string;
};

type Props = {
  billingCycle: BillingCycle;
  onChangeBillingCycle: (cycle: BillingCycle) => void;
  plans: Record<BillingCycle, PaywallPlan>;
  selectedPlan: PaywallPlan;
};

const PaywallCard = ({ billingCycle, onChangeBillingCycle, plans, selectedPlan }: Props) => {
  return (
    <View style={tw`w-full h-full px-8 justify-center`}>
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
        style={tw`rounded-3xl p-6 border border-white/22`}
      >
        <View style={tw`flex-row items-center mb-4`}>
          <PiggyBank size={22} color={theme.colors.white} />
          <Text style={tw`text-white text-lg font-extrabold ml-2`}>TakaTrack Pro</Text>
        </View>

        <View style={tw`mb-5`}>
          {[
            'Premium analytics for deep spending insights',
            'Beautiful PDF/CSV reports for monthly reviews',
            'Priority updates and advanced planning tools',
          ].map((feature) => (
            <View key={feature} style={tw`flex-row items-start mb-2`}>
              <BadgeCheck size={16} color={theme.colors.lightSuccess} style={tw`mt-0.5 mr-2`} />
              <Text style={tw`text-white/90 text-sm flex-1`}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={tw`flex-row mb-4`}>
          {(Object.keys(plans) as BillingCycle[]).map((planKey, idx) => {
            const plan = plans[planKey];
            const active = billingCycle === planKey;
            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.85}
                onPress={() => onChangeBillingCycle(planKey)}
                style={[
                  tw`flex-1 rounded-2xl p-3 border`,
                  idx === 0 ? tw`mr-2` : tw`ml-2`,
                  active
                    ? { backgroundColor: 'rgba(255,255,255,0.20)', borderColor: 'rgba(255,255,255,0.60)' }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.22)' },
                ]}
              >
                <Text style={[tw`text-white text-xs font-bold`, { fontFamily: typography.heading }]}>{plan.label}</Text>
                <Text style={[tw`text-white text-lg font-extrabold mt-1`, { fontFamily: typography.heading }]}>{plan.headlinePrice}</Text>
                <Text style={tw`text-white/75 text-[11px]`}>{plan.subPrice}</Text>
                <Text style={[tw`text-[10px] font-bold mt-1`, { color: planKey === 'yearly' ? '#BBF7D0' : 'rgba(255,255,255,0.75)' }]}>
                  {plan.badge}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={tw`bg-white/14 rounded-2xl p-4`}>
          <Text style={tw`text-white/75 text-xs`}>Selected Plan</Text>
          <Text style={[tw`text-white text-2xl font-extrabold mt-1`, { fontFamily: typography.heading }]}>{selectedPlan.selectedSummary}</Text>
          <Text style={tw`text-white/75 text-xs mt-1`}>{selectedPlan.billingNote}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default PaywallCard;
