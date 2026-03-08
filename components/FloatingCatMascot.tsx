import { theme } from '@/constants/theme';
import { Cat, Heart, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc';

type MascotVariant = 'cat' | 'spark' | 'heart';
type MascotPosition = 'topRight' | 'bottomRight' | 'bottomLeft';

const getVariant = (variant: MascotVariant) => {
  if (variant === 'spark') return { Icon: Sparkles, label: 'Track' };
  if (variant === 'heart') return { Icon: Heart, label: 'Save' };
  return { Icon: Cat, label: 'Meow' };
};

const getPosition = (position: MascotPosition) => {
  if (position === 'bottomLeft') return tw`absolute left-4 bottom-28 z-40`;
  if (position === 'bottomRight') return tw`absolute right-4 bottom-28 z-40`;
  return tw`absolute right-4 top-16 z-40`;
};

const FloatingCatMascot = ({
  variant = 'cat',
  position = 'bottomRight',
}: {
  variant?: MascotVariant;
  position?: MascotPosition;
}) => {
  const { Icon, label } = getVariant(variant);

  return (
    <View
      pointerEvents="none"
      style={getPosition(position)}
    >
      <View style={[tw`px-3 py-2 rounded-2xl shadow-lg`, { backgroundColor: theme.colors.card }]}> 
        <View style={tw`flex-row items-center`}>
          <Icon size={18} color={theme.colors.primary} />
          <Text style={[tw`text-xs font-bold ml-1`, { color: theme.colors.primary }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
};

export default FloatingCatMascot;
