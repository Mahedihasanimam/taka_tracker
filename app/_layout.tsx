import { LanguageProvider } from "@/context/LanguageContext";
import { initDB } from "@/services/db";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

export default function RootLayout() {

  useEffect(() => {
    initDB()
      .then(() => console.log('Database initialized successfully'))
      .catch((err) => console.log('Database failed to connect', err));
  }, []);
  return <LanguageProvider>
    <StatusBar backgroundColor="#e2136e" barStyle="light-content" />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding/firstOnboarding" />
      <Stack.Screen name="onboarding/secondOnboarding" />
      <Stack.Screen name="onboarding/thirdOnboarding" />
      <Stack.Screen name="auth/signIn" />
      <Stack.Screen name="auth/signUp" />
      <Stack.Screen name="auth/forgotPasswrod" />
      <Stack.Screen name="auth/otpVerify" />
      <Stack.Screen name="auth/CreateNewPassword" />


    </Stack>
  </LanguageProvider>
}
