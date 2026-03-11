import { theme } from '@/constants/theme';
import { Audio } from 'expo-av';
import { Cat, Heart, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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

  const soundRef = useRef<Audio.Sound | null>(null);

  const handleMeow = async () => {
    if (variant !== 'cat') return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/images/meow.wav')
      );
      soundRef.current = sound;

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          soundRef.current?.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  return (
    <View pointerEvents="box-none" style={getPosition(position)}>
      <TouchableOpacity
        onPress={handleMeow}
        style={[tw`px-3 py-2 rounded-2xl shadow-lg`, { backgroundColor: theme.colors.card }]}
      >
        <View style={tw`flex-row items-center`}>
          <Icon size={18} color={theme.colors.primary} />
          <Text style={[tw`text-xs font-bold ml-1`, { color: theme.colors.primary }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default FloatingCatMascot;
