import { theme } from '@/constants/theme';
import { Audio } from 'expo-av'; // ✅ import expo-av
import { Cat, Heart, Sparkles } from 'lucide-react-native';
import React, { useRef } from 'react';
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

  // Ref for audio sound
  const soundRef = useRef<Audio.Sound | null>(null);

  const handleMeow = async () => {
    try {
      // Load the sound
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/images/catsound.wav') // ✅ your audio file
      );
      soundRef.current = sound;

      // Play it
      await soundRef.current.playAsync();

      // Unload when done
      soundRef.current.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          soundRef.current?.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  return (
    <View pointerEvents="none" style={getPosition(position)}>
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