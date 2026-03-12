import tw from '@/assets/lib/tailwind';
import { theme } from '@/constants/theme';
import { typography } from '@/constants/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Crown } from 'lucide-react-native';
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

const FEATURES = ['Advanced Analytics', 'Premium Reports', 'Unlimited Exports', 'Ad-free Experience', 'Unlimited Data Backups'];

const PaywallCard = ({ billingCycle, onChangeBillingCycle, plans, selectedPlan }: Props) => {
  return (
    <View style={tw`w-full h-full px-6 justify-center`}>
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.06)']}
        style={tw`rounded-3xl p-5 border border-white/20`}
      >
        {/* Header */}
        <View style={tw`flex-row items-center mb-4`}>
          <View
            style={[
              tw`w-10 h-10 rounded-xl items-center justify-center`,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <Crown size={20} color={theme.colors.text} strokeWidth={2.5} />
          </View>
          <View style={tw`ml-3`}>
            <Text style={[tw`text-white text-lg`, { fontFamily: typography.heading, fontWeight: '700' }]}>
              Money Master Pro
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={tw`mb-5`}>
          {FEATURES.map((feature) => (
            <View key={feature} style={tw`flex-row items-center mb-2`}>
              <BadgeCheck size={16} color={theme.colors.lightSuccess} />
              <Text style={tw`text-white/90 text-sm ml-2`}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plan Cards */}
        <View style={tw`flex-row mb-4`}>
          {(Object.keys(plans) as BillingCycle[]).map((planKey, idx) => {
            const plan = plans[planKey];
            const isActive = billingCycle === planKey;
            const isYearly = planKey === 'yearly';

            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.85}
                onPress={() => onChangeBillingCycle(planKey)}
                style={[
                  tw`flex-1 rounded-2xl p-3 border-2`,
                  idx === 0 ? tw`mr-2` : tw`ml-2`,
                  {
                    backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    borderColor: isActive ? theme.colors.lightMint : 'rgba(255,255,255,0.15)',
                  },
                ]}
              >
                {isYearly && (
                  <View
                    style={[
                      tw`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full`,
                      { backgroundColor: theme.colors.success },
                    ]}
                  >
                    <Text style={tw`text-white text-[9px] font-bold`}>SAVE</Text>
                  </View>
                )}
                <Text style={[tw`text-white text-xs font-semibold`, { fontFamily: typography.heading }]}>
                  {plan.label}
                </Text>
                <Text style={[tw`text-white text-xl font-bold mt-1`, { fontFamily: typography.heading }]}>
                  {plan.headlinePrice}
                </Text>
                <Text style={tw`text-white/60 text-[11px]`}>{plan.subPrice}</Text>
                {isYearly && (
                  <Text style={[tw`text-[10px] mt-1`, { color: theme.colors.lightSuccess }]}>{plan.badge}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Summary */}
        <View style={tw`bg-white/10 rounded-2xl p-4`}>
          <Text style={tw`text-white/60 text-xs`}>Selected</Text>
          <Text style={[tw`text-white text-xl font-bold mt-0.5`, { fontFamily: typography.heading }]}>
            {selectedPlan.selectedSummary}
          </Text>
          <Text style={tw`text-white/50 text-xs mt-0.5`}>{selectedPlan.billingNote}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default PaywallCard;
