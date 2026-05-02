declare module 'react-native-purchases' {
  const Purchases: {
    configure(options: { apiKey: string }): void;
    getCustomerInfo(): Promise<{
      entitlements: {
        active: Record<string, { expirationDate?: string | null }>;
      };
    }>;
    getOfferings(): Promise<{
      current?: {
        identifier: string;
        availablePackages: Array<{
          identifier: string;
          storeProduct: {
            productIdentifier: string;
            localizedPriceString: string;
          };
        }>;
      } | null;
    }>;
    purchasePackage(pkg: unknown): Promise<{
      customerInfo: {
        entitlements: {
          active: Record<string, unknown>;
        };
      };
    }>;
    restorePurchases(): Promise<{
      entitlements: {
        active: Record<string, { expirationDate?: string | null }>;
      };
    }>;
  };

  export default Purchases;
}
