import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/styles/theme';
import { track } from '../src/lib/analytics';
import { installGlobalErrorHandler } from '../src/lib/errorHandler';
import { initSentryAsync } from '../src/lib/sentry';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Install at module load time so the very first render of any child
// component is already covered. Idempotent — safe to run on hot reload.
installGlobalErrorHandler();

export default function RootLayout() {
  useEffect(() => {
    // Fire after first paint — both calls lazy-load native modules so they
    // stay off the iOS 26 launch crash path.
    void initSentryAsync();
    track('app_opened');
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
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
    </ErrorBoundary>
  );
}
