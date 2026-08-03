# Casa Maíz mobile

Native React Native application for iOS and Android, powered by the versioned
Payload CMS content API.

## What the app demonstrates

- CMS-driven home, menu, promotions, legal content, and forms
- Server-side targeting by platform, market, audience, and app version
- Feature flags, maintenance mode, notices, and app-update policies
- Persistent AsyncStorage fallback when the network is unavailable
- Content alerts triggered on load, delay, or scroll position
- CMS-controlled navigation and the `casamaiz://` deep-link scheme
- Optional PostHog analytics that is disabled by default
- Accessible loading, error, retry, offline, form, and navigation states

## Requirements

- Node.js 22.11 or newer
- npm 10 or newer
- Android Studio with SDK 36 and a Java version supported by React Native 0.86
- macOS with Xcode and CocoaPods for iOS development
- Ruby and Bundler versions compatible with the checked-in `Gemfile.lock`

## Installation

```bash
npm ci
cp .env.example .env
```

The sample environment points both platforms and all build types to the public,
read-only CMS:

- CMS: `https://payload-cms-poc-seven.vercel.app`
- API documentation: `https://payload-cms-poc-seven.vercel.app/api/docs`
- Website consumer: `https://payload-website-consumer.vercel.app`

Mobile environment variables are compiled into the application. They are
configuration values, not a safe place for secrets.

### Optional local CMS

Override `CMS_URL` in the untracked `.env` file when developing against a local
Payload instance:

```dotenv
# iOS simulator
CMS_URL=http://localhost:3000

# Android emulator
CMS_URL=http://10.0.2.2:3000
```

Physical devices need the development computer's LAN address or an HTTPS tunnel.

## Run the application

Start Metro:

```bash
npm start
```

Then run one native target in a second terminal:

```bash
npm run ios
npm run android
```

Install iOS native dependencies after changing native packages:

```bash
bundle install
cd ios
bundle exec pod install
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `CMS_URL` | Public Payload CMS | Versioned content and form API |
| `WEBSITE_URL` | Public website consumer | Web fallback and reservations |
| `CMS_REQUEST_TIMEOUT_MS` | `10000` | Network timeout in milliseconds |
| `DEFAULT_MARKET` | `MX` | Market sent to the targeting API |
| `ENABLE_ANALYTICS` | `false` | Enables PostHog only when a token is also present |
| `POSTHOG_PROJECT_TOKEN` | Empty | Public PostHog project token |
| `POSTHOG_HOST` | US PostHog cloud | PostHog ingestion host |

The app remains fully usable when analytics is disabled or unconfigured.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:ci
```

The baseline suite covers CMS contracts, cache behavior, alert frequency,
rendered blocks, form requests, validation, accessibility, and external
navigation. React Native Testing Library is available for additional
component and integration tests.

## Deep links

The `casamaiz://` scheme supports:

- `casamaiz://`
- `casamaiz://menu`
- `casamaiz://reservas`
- `casamaiz://reorder`
- `casamaiz://legal/:key`

CMS paths supported natively are routed inside the application. Other internal
CMS paths open on the public website so links never fail silently.

## Offline behavior

Successful CMS responses are cached with their next scheduled visibility
transition. If a request fails, valid cached content is returned and marked as
offline. Expired or malformed entries are discarded. Fresh network content is
still rendered if the device cannot write to local storage.

## Troubleshooting

- If native environment variables change, stop Metro and rebuild the app.
- If iOS native modules are missing, run `bundle exec pod install` in `ios/`.
- If an Android emulator cannot reach a local CMS, use `10.0.2.2`, not
  `localhost`.
- If Metro serves stale code, restart it with `npm start -- --reset-cache`.
