import { Redirect } from 'expo-router';
import React from 'react';

const SplashScreen: React.FC = () => {
  return <Redirect href="/(tabs)" />;
};

export default SplashScreen;
