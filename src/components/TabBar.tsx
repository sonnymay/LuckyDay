import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../styles/theme';

async function triggerTabHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

type TabDef = {
  path: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { path: '/detail',   label: 'Today',   icon: 'home-outline',          iconActive: 'home'          },
  { path: '/history',  label: 'History', icon: 'journal-outline',       iconActive: 'journal'       },
  { path: '/settings', label: 'You', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

export function TabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Pressable
            key={tab.path}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) {
                triggerTabHaptic();
                router.replace(tab.path as any);
              }
            }}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={24}
                color={isActive ? colors.mauve : colors.faint}
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(253, 240, 246, 0.96)',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingTop: 10,
    ...Platform.select({
      web: { boxShadow: `0 -4px 20px rgba(192, 58, 120, 0.08)` },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    paddingBottom: 4,
  },
  tabPressed: {
    opacity: 0.65,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 52,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(192, 58, 120, 0.10)',
  },
  label: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeLabel: {
    color: colors.mauve,
    fontWeight: '900',
  },
});
