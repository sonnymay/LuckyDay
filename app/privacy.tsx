import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { AppButton } from '../src/components/AppButton';
import { colors, spacing, radii } from '../src/styles/theme';

const PRIVACY_URL = 'https://luckyday-privacy.tiiny.site';

export default function PrivacyScreen() {
  return (
    <Screen>
      <Card style={styles.heroCard}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.copy}>
          LuckyDay is built with your privacy in mind. Your profile, readings, and photos stay on your device — nothing is uploaded to our servers.
        </Text>
      </Card>

      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>The short version</Text>
        <View style={styles.bulletList}>
          <BulletRow emoji="📱" text="All data is stored locally on your device only." />
          <BulletRow emoji="🚫" text="We don't collect or sell your personal information." />
          <BulletRow emoji="💳" text="Subscriptions are handled by Apple — we never see your payment details." />
          <BulletRow emoji="📸" text="Optional photos stay on-device and are never uploaded." />
          <BulletRow emoji="🌙" text="Readings are generated on-device using your local profile." />
        </View>
      </Card>

      <AppButton
        label="Read full privacy policy →"
        onPress={() => Linking.openURL(PRIVACY_URL)}
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
