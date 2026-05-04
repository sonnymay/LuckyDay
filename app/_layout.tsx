import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initPurchases } from '../src/lib/purchases';
import { colors } from '../src/styles/theme';

export default function RootLayout() {
  // Initialize RevenueCat once at app startup so isPremium() works correctly.
  // This is safe to call multiple times — purchases.ts guards with an `initialized` flag.
  useEffect(() => {
    initPurchases().catch(() => {
      // Initialization failure is non-fatal — app runs in free mode
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '800' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Your LuckyDay ✨' }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="detail" options={{ title: "Today's Reading" }} />
        <Stack.Screen name="feedback" options={{ title: 'Rate Today' }} />
        <Stack.Screen name="history" options={{ title: 'Reading History' }} />
        <Stack.Screen name="paywall" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings ✨' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
