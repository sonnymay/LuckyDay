import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { getStoredProfile } from '../src/lib/storage';
import { colors } from '../src/styles/theme';

export default function WelcomeScreen() {
  useEffect(() => {
    getStoredProfile()
      .then((profile) => {
        router.replace(profile ? '/detail' : '/onboarding');
      })
      .catch(() => router.replace('/onboarding'));
  }, []);

  return <View style={styles.loading} />;
}

const styles = StyleSheet.create({
  loading: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
