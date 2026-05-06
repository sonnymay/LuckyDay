import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { colors, radii, spacing } from '../src/styles/theme';

const APPLE_SUBSCRIPTION_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export default function TermsScreen() {
  return (
    <Screen>
      <Card style={styles.heroCard}>
        <Text style={styles.emoji}>📜</Text>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.copy}>
          LuckyDay is a daily reflection and entertainment guide. It offers qualitative guidance, not professional, financial, medical, or legal advice.
        </Text>
      </Card>

      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>The short version</Text>
        <View style={styles.bulletList}>
          <BulletRow emoji="🍀" text="Use LuckyDay as a gentle ritual, not as a guarantee of outcomes." />
          <BulletRow emoji="📱" text="Your profile is saved locally on this device unless you delete it." />
          <BulletRow emoji="💳" text="Premium subscriptions are billed and managed by Apple." />
          <BulletRow emoji="↩️" text="You can restore purchases from the paywall or manage subscriptions in Apple ID settings." />
        </View>
      </Card>

      <AppButton
        label="Read Apple's standard subscription terms"
        onPress={() => Linking.openURL(APPLE_SUBSCRIPTION_URL)}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.backLinkText}>← Back</Text>
      </Pressable>
    </Screen>
  );
}

function BulletRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletEmoji}>{emoji}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 48,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.mauve,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
  },
  sectionTitle: {
    color: colors.mauve,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  bulletList: {
    gap: spacing.md,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletEmoji: {
    fontSize: 16,
    lineHeight: 22,
    width: 24,
  },
  bulletText: {
    color: '#3D2D80',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    color: colors.mauve,
    fontSize: 15,
    fontWeight: '700',
  },
});
