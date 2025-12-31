import { LanguageProvider } from "@/context/LanguageContext";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
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
