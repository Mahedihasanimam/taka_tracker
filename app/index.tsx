import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import React from 'react';

const SplashScreen: React.FC = () => {
  // Keep root route neutral while RootLayoutNav resolves onboarding/auth destination.
  return <AnimatedSplashScreen />;
};

export default SplashScreen;
