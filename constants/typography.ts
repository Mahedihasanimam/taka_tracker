import { Platform } from 'react-native';

export const typography = {
  body: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif',
    default: 'System',
  }) as string,
  heading: Platform.select({
    ios: 'AvenirNext-DemiBold',
    android: 'sans-serif-medium',
    default: 'System',
  }) as string,
  mono: 'SpaceMono-Regular',
};
