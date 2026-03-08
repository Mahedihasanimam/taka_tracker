import FloatingCatMascot from '@/components/FloatingCatMascot';
import { ONBOARDING_DONE_KEY } from '@/constants/storageKeys';
import { theme } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { initDB } from '@/services/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
        setHasSeenOnboarding(seen === 'true');
      } finally {
        setOnboardingChecked(true);
      }
    };
    loadOnboardingState();
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      if (!hasSeenOnboarding && !inOnboarding && !inAuthGroup) {
        router.replace('/onboarding');
        return;
      }
      if (hasSeenOnboarding && !inAuthGroup && !inOnboarding) {
        router.replace('/auth/signIn');
        return;
      }
      if (inOnboarding && hasSeenOnboarding) {
        router.replace('/auth/signIn');
      }
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [
    hasSeenOnboarding,
    isAuthenticated,
    isLoading,
    onboardingChecked,
    router,
    segments,
  ]);

  if (isLoading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === 'auth';
  const inOnboarding = segments[0] === 'onboarding';
  const showMascot = isAuthenticated && !inAuthGroup && !inOnboarding;
  const mascotVariant = pathname.includes('budget')
    ? 'heart'
    : pathname.includes('transactions')
      ? 'spark'
      : 'cat';

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {/* Tabs root: fade — no slide since tabs handle their own navigation */}
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        {/* Onboarding: clean fade in */}
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        {/* Auth flow: push-forward slide */}
        <Stack.Screen name="auth/signIn" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signUp" options={{ animation: 'simple_push' }} />
        <Stack.Screen name="auth/forgotPassword" options={{ animation: 'simple_push' }} />
        <Stack.Screen name="auth/resetPassword" options={{ animation: 'simple_push' }} />
        {/* Modals: slide up from bottom like a sheet */}
        <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile/changePassword" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="transaction/add" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="screens/categories" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="screens/export" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      {showMascot && (
        <FloatingCatMascot variant={mascotVariant} position="bottomRight" />
      )}
    </View>
  );
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupDB = async () => {
      try {
        await initDB();
        if (mounted) {
          setDbReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        if (mounted) {
          setDbError('Failed to initialize database. Please restart the app.');
          setDbReady(true); // Allow app to continue
        }
      }
    };

    setupDB();

    return () => {
      mounted = false;
    };
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 16, textAlign: 'center' }}>{dbError}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
