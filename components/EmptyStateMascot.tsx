import { theme } from '@/constants/theme';
import { Cat, PieChart, Wallet } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc';

type Variant = 'transactions' | 'budget' | 'general';

const EmptyStateMascot = ({
  title,
  subtitle,
  variant = 'general',
  compact = false,
}: {
  title: string;
  subtitle?: string;
  variant?: Variant;
  compact?: boolean;
}) => {
  const Icon = variant === 'budget' ? PieChart : variant === 'transactions' ? Wallet : Cat;

  return (
    <View style={tw`items-center ${compact ? 'py-3 px-2' : 'py-8 px-6'}`}>
      <View
        style={[
          tw`${compact ? 'w-12 h-12 rounded-2xl mb-2' : 'w-20 h-20 rounded-3xl mb-4'} items-center justify-center`,
          { backgroundColor: `${theme.colors.primary}20` },
        ]}
      >
        <Icon size={compact ? 20 : 34} color={theme.colors.primary} />
      </View>
      <Text style={[tw`${compact ? 'text-xs' : 'text-base'} font-bold text-center`, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[tw`${compact ? 'text-[10px]' : 'text-sm'} text-center mt-1`, { color: theme.colors.mutedText }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

export default EmptyStateMascot;
