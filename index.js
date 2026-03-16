import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { ensureAndroidWidgetTaskRegistered } = require('./widgets/androidBudgetWidget');
  ensureAndroidWidgetTaskRegistered();
}

import 'expo-router/entry';
