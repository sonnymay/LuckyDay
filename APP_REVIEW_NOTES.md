# App Review Notes — paste into App Store Connect

Location: App Store Connect → LuckyDay → App Information → App Review Information → Notes

---

LuckyDay is a daily luck-and-mood ritual app blending Chinese almanac, lunar phase, and birthday-based zodiac context. It is positioned as a gentle reflection ritual — never as medical, financial, or predictive advice.

**No account required.** All user data is stored locally on device.

**How to test the full app (no sign-up needed):**
1. Launch app → tap through onboarding (enter any nickname, any birth date, pick any focus)
2. The Today screen renders the daily reading immediately
3. Tap "History" tab to see prior readings (will be empty on first launch)
4. Tap "You" tab → Settings screen for preferences

**How to test In-App Purchase (auto-renewing subscription):**
1. From Settings, scroll to "Unlock Premium" section, tap "View premium"
2. Paywall opens with Monthly ($4.99/mo) and Annual ($19.99/yr) options
3. Tap either to trigger Apple's StoreKit purchase sheet (sandbox)
4. "Restore Purchases" button is at the bottom of the paywall
5. Subscription, terms, and privacy policy links are visible on the paywall

**Subscriptions:**
- Monthly: com.luckyday.premium.monthly — $4.99/month, auto-renewing
- Annual: com.luckyday.premium.annual — $19.99/year, auto-renewing
- Both unlock the same "premium" entitlement (extended insights and personalization)

**Permissions used:**
- Camera (optional, onboarding only — face/palm photos for personalization, stored locally)
- Photo library (optional — saving daily luck card to share)
- Notifications (optional — daily reminder)

All permissions are optional; the app works fully without granting any.

**iPad note:** This version is iPhone-optimized. iPad users will run it in iPhone-compatibility mode. iPad-native layout is planned for v1.1.

**Contact for review questions:** thesan_555@hotmail.com
