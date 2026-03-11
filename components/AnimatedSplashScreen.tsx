import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StatusBar, Text, View } from 'react-native';

const AnimatedSplashScreen = () => {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(220),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [logoOpacity, logoScale, textOpacity, textTranslateY]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primaryDeep, theme.colors.primaryTeal, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            backgroundColor: 'rgba(255,255,255,0.14)',
            padding: 18,
            borderRadius: 28,
          }}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 192, height: 192 }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={{
            marginTop: 18,
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <Text style={{ color: theme.colors.white, fontSize: 30, fontWeight: '800', letterSpacing: 0.4 }}>
            Money Master
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

export default AnimatedSplashScreen;
