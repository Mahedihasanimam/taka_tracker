import { Redirect } from 'expo-router';
import React from 'react';

const SplashScreen: React.FC = () => {
  return <Redirect href="/onboarding" />;
};

export default SplashScreen;
