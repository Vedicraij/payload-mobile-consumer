# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Casa Maiz mobile restaurant app. PostHog is initialized via `react-native-config` (env vars embedded at build time), wrapped with `PostHogProvider` inside `NavigationContainer` for React Navigation v7 compatibility, and 15 business-critical events are captured across 10 source files. Autocapture of touch events is enabled, and screen views are tracked manually via `NavigationContainer.onStateChange`.

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `reservation_started` | User tapped "Find a table" — top of reservation funnel | `src/screens/ReservationsScreen.tsx` |
| `content_alert_impression` | A CMS content alert (top bar or modal) was shown | `src/screens/CMSPageScreen.tsx` |
| `content_alert_action_tapped` | User tapped an action button inside a content alert | `src/screens/CMSPageScreen.tsx` |
| `content_alert_dismissed` | User dismissed a dismissible content alert | `src/screens/CMSPageScreen.tsx` |
| `content_refresh_triggered` | User pull-to-refreshed a CMS page | `src/screens/CMSPageScreen.tsx` |
| `hero_cta_tapped` | User tapped a CTA button inside a hero block | `src/components/blocks/HeroBlock.tsx` |
| `cta_tapped` | User tapped a CTA button inside a restaurant CTA or shared CTA block | `src/components/blocks/ContentBlocks.tsx` |
| `promo_cta_tapped` | User tapped the CTA on a promo rail item | `src/components/blocks/PromoRailBlock.tsx` |
| `form_submitted` | User successfully submitted a CMS-driven form | `src/components/blocks/SharedBlocks.tsx` |
| `form_submission_failed` | A CMS form submission failed | `src/components/blocks/SharedBlocks.tsx` |
| `archive_item_tapped` | User tapped a post item in a CMS archive block | `src/components/blocks/SharedBlocks.tsx` |
| `app_update_prompted` | App update modal was shown (required or recommended) | `src/components/OperationalGate.tsx` |
| `app_update_started` | User tapped "Update now" in the update modal | `src/components/OperationalGate.tsx` |
| `external_link_opened` | User tapped a CMS link that opened an external URL | `src/components/blocks/contentLinks.ts` |
| `legal_document_viewed` | User opened and loaded a legal document screen | `src/screens/LegalScreen.tsx` |

## Files created

- **`src/config/posthog.ts`** — PostHog client instance, reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from `.env` via `react-native-config`. Fails loudly in dev if unconfigured; no-ops silently in production.
- **`src/types/env.d.ts`** — TypeScript module declaration for `react-native-config` env vars.
- **`.env`** — PostHog token and host added (gitignored).

## Files modified

- **`src/navigation/RootNavigator.tsx`** — Added `PostHogProvider` inside `NavigationContainer`, refs for screen tracking, and `onReady`/`onStateChange` handlers for manual screen capture.
- **`src/screens/ReservationsScreen.tsx`** — Added `reservation_started` event on "Find a table" press.
- **`src/screens/CMSPageScreen.tsx`** — Wired `onAlertEvent` callback to capture alert impression / action / dismiss events and `content_refresh_triggered` on pull-to-refresh.
- **`src/screens/LegalScreen.tsx`** — Added `legal_document_viewed` event after successful content load.
- **`src/components/blocks/HeroBlock.tsx`** — Added `hero_cta_tapped` event on hero action button press.
- **`src/components/blocks/ContentBlocks.tsx`** — Added `cta_tapped` event on CTA block button press.
- **`src/components/blocks/PromoRailBlock.tsx`** — Added `promo_cta_tapped` event on promo CTA press.
- **`src/components/blocks/SharedBlocks.tsx`** — Added `archive_item_tapped`, `form_submitted`, and `form_submission_failed` events.
- **`src/components/blocks/contentLinks.ts`** — Added `external_link_opened` event before opening external URLs.
- **`src/components/OperationalGate.tsx`** — Added `app_update_prompted` (via `useEffect`) and `app_update_started` (on button press) events.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics (wizard)](https://us.posthog.com/project/524076/dashboard/1889598)
- **Reservations started**: [https://us.posthog.com/project/524076/insights/axPZjXRW](https://us.posthog.com/project/524076/insights/axPZjXRW)
- **Content alert engagement funnel**: [https://us.posthog.com/project/524076/insights/4kn6AJBI](https://us.posthog.com/project/524076/insights/4kn6AJBI)
- **CTA clicks by type**: [https://us.posthog.com/project/524076/insights/jzJtIe5v](https://us.posthog.com/project/524076/insights/jzJtIe5v)
- **Form submissions**: [https://us.posthog.com/project/524076/insights/oxcjxujy](https://us.posthog.com/project/524076/insights/oxcjxujy)
- **App update conversion**: [https://us.posthog.com/project/524076/insights/0v9YE9PY](https://us.posthog.com/project/524076/insights/0v9YE9PY)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] For iOS: run `cd ios && pod install` to link `posthog-react-native`, `react-native-svg`, and `react-native-config` native modules.
- [ ] For Android: verify `react-native-config` Gradle setup per its README (add `apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"` to `android/app/build.gradle`).

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-native/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
