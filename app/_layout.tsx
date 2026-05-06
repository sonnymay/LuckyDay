import { useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { initPurchases } from '../src/lib/purchases';
import { colors } from '../src/styles/theme';

// Keep the splash screen up while fonts load.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load Nunito — requires: npx expo install @expo-google-fonts/nunito
  // If the package isn't installed yet, the app falls back to system font gracefully.
  const [fontsLoaded, fontError] = useFonts(loadFonts());

  useEffect(() => {
    initPurchases().catch(() => {
      // Initialization failure is non-fatal — app runs in free mode
    });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts resolve (either loaded or errored — both are fine)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.mauve,
          headerTitleStyle: {
            color: colors.ink,
            fontSize: 17,
            fontWeight: '800',
          },
        }}
      >
        <Stack.Screen name="index"      options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Create your profile ✨' }} />
        {/* Tab screens — home/history/settings all live inside this group */}
        <Stack.Screen name="home"       options={{ headerShown: false }} />
        <Stack.Screen name="history"    options={{ headerShown: false }} />
        <Stack.Screen name="settings"   options={{ headerShown: false }} />
        {/* Detail is now the primary Today screen — no header, tab bar handles nav */}
        <Stack.Screen name="detail"     options={{ headerShown: false }} />
        <Stack.Screen name="feedback"   options={{ title: 'How was your luck today? 🍀' }} />
        <Stack.Screen name="paywall"    options={{ headerShown: false }} />
        <Stack.Screen name="privacy"    options={{ title: 'Privacy & data 🧿' }} />
        <Stack.Screen name="terms"      options={{ title: 'Terms of Service' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

/**
 * Load Nunito font variants.
 * Wrapped in a function so the try/catch handles the case where
 * @expo-google-fonts/nunito isn't installed yet — app still launches
 * using the system font rather than crashing.
 */
function loadFonts(): Record<string, any> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      Nunito_400Regular,
      Nunito_700Bold,
      Nunito_900Black,
    } = require('@expo-google-fonts/nunito');
    return {
      'Nunito-Regular': Nunito_400Regular,
      'Nunito-Bold':    Nunito_700Bold,
      'Nunito-Black':   Nunito_900Black,
    };
  } catch {
    // Package not installed — run: npx expo install @expo-google-fonts/nunito
    return {};
  }
}
