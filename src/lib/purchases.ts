/**
 * purchases.ts
 *
 * RevenueCat subscription wrapper for LuckyDay.
 *
 * Setup required (do once):
 * 1. npm install react-native-purchases
 * 2. Create account at revenuecat.com
 * 3. Create product in App Store Connect:
 *    - Monthly: com.luckyday.premium.monthly  → $4.99/month  ✅ created
 *    - Annual:  com.luckyday.premium.annual   → $19.99/year ✅ created
 * 4. Add entitlement "premium" in RevenueCat dashboard       ✅ done
 * 5. Production iOS SDK key configured                       ✅ done
 *
 * The app works fully without RevenueCat configured —
 * isPremium() returns false and the paywall shows.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

/**
 * RevenueCat iOS public API key.
 * Before release, verify this matches the production RevenueCat app.
 */
const REVENUE_CAT_API_KEY: string = 'appl_NGvyaLeLFXBfpaNUVjaKDGvgSo';

export const ENTITLEMENT_ID = 'premium';

export const PRODUCT_IDS = {
  monthly: 'com.luckyday.premium.monthly',
  annual: 'com.luckyday.premium.annual',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type PurchasePackage = {
  identifier: string;
  productIdentifier: string;
  localizedPriceString: string;
  offeringIdentifier: string;
};

export type PremiumStatus = {
  isPremium: boolean;
  expiresAt: Date | null;
};

type RevenueCatPackage = {
  identifier: string;
  storeProduct: {
    productIdentifier: string;
    localizedPriceString: string;
  };
};

// ─── Lazy RevenueCat import ───────────────────────────────────────────────────

let Purchases: typeof import('react-native-purchases').default | null = null;

async function getRevenueCat() {
  if (Purchases) return Purchases;
  try {
    // Dynamic import so the app doesn't crash if the package isn't installed yet
    const mod = await import('react-native-purchases');
    Purchases = mod.default;
    return Purchases;
  } catch {
    return null;
  }
}

// ─── Initialization ───────────────────────────────────────────────────────────

let initialized = false;

async function ensurePurchasesConfigured(): Promise<typeof import('react-native-purchases').default | null> {
  if (initialized && Purchases) return Purchases;

  const RC = await getRevenueCat();
  if (!RC || REVENUE_CAT_API_KEY === 'YOUR_REVENUECAT_IOS_KEY_HERE') return null;

  try {
    RC.configure({ apiKey: REVENUE_CAT_API_KEY });
    initialized = true;
    return RC;
  } catch (error) {
    console.warn('[LuckyDay] RevenueCat init failed:', error);
    return null;
  }
}

export async function initPurchases(): Promise<void> {
  await ensurePurchasesConfigured();
}

// ─── Premium status ───────────────────────────────────────────────────────────

export async function getPremiumStatus(): Promise<PremiumStatus> {
  const RC = await ensurePurchasesConfigured();
  if (!RC) return { isPremium: false, expiresAt: null };

  try {
    const info = await RC.getCustomerInfo();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return { isPremium: false, expiresAt: null };

    return {
      isPremium: true,
      expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
    };
  } catch {
    return { isPremium: false, expiresAt: null };
  }
}

// ─── Offerings ────────────────────────────────────────────────────────────────

export async function getOfferings(): Promise<PurchasePackage[]> {
  const RC = await ensurePurchasesConfigured();
  if (!RC) return [];

  try {
    const offerings = await RC.getOfferings();
    const current = offerings.current;
    if (!current) return [];

    return current.availablePackages.map((pkg: RevenueCatPackage) => ({
      identifier: pkg.identifier,
      productIdentifier: pkg.storeProduct.productIdentifier,
      localizedPriceString: pkg.storeProduct.localizedPriceString,
      offeringIdentifier: current.identifier,
    }));
  } catch {
    return [];
  }
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export type PurchaseResult =
  | { success: true; isPremium: boolean }
  | { success: false; cancelled: boolean; error?: string };

export async function purchasePackage(pkg: PurchasePackage): Promise<PurchaseResult> {
  const RC = await ensurePurchasesConfigured();
  if (!RC) {
    return { success: false, cancelled: false, error: 'Purchases not configured' };
  }

  try {
    const offerings = await RC.getOfferings();
    const current = offerings.current;
    if (!current) return { success: false, cancelled: false, error: 'No offerings available' };

    const rcPkg = current.availablePackages.find(
      (p: RevenueCatPackage) => p.storeProduct.productIdentifier === pkg.productIdentifier,
    );
    if (!rcPkg) return { success: false, cancelled: false, error: 'Package not found' };

    const result = await RC.purchasePackage(rcPkg);
    const isPremium = !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: true, isPremium };
  } catch (error: unknown) {
    // User cancelled — not an error
    if (
      error &&
      typeof error === 'object' &&
      'userCancelled' in error &&
      (error as { userCancelled: boolean }).userCancelled
    ) {
      return { success: false, cancelled: true };
    }
    return { success: false, cancelled: false, error: String(error) };
  }
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PremiumStatus> {
  const RC = await ensurePurchasesConfigured();
  if (!RC) return { isPremium: false, expiresAt: null };

  try {
    const info = await RC.restorePurchases();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    return {
      isPremium: !!entitlement,
      expiresAt: entitlement?.expirationDate ? new Date(entitlement.expirationDate) : null,
    };
  } catch {
    return { isPremium: false, expiresAt: null };
  }
}
