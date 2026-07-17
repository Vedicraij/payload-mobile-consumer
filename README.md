# Casa Maiz mobile

React Native 0.86 application for iOS and Android, powered by the versioned Payload content API.

## Features

- CMS-driven home and menu pages
- Channel-aware blocks for iOS and Android
- Navigation and deep links controlled by Payload
- Promotions, legal content, feature flags, maintenance, and app-update controls
- Persistent AsyncStorage fallback when the network is unavailable
- Pull-to-refresh and accessible native controls
- New Architecture, Hermes, native stack, and bottom tabs

## Local development

Start Payload first from `../luis-webpage` on port `3000`.

```bash
npm install
npm start
```

In a second terminal:

```bash
npm run ios
# or
npm run android
```

The iOS simulator uses `http://localhost:3000`. The Android emulator uses `http://10.0.2.2:3000`. For a physical device, change `CMS_URL` in `src/api/config.ts` to the development machine's LAN address or a secure tunnel.

Install iOS dependencies after changing native packages:

```bash
bundle install
cd ios && bundle exec pod install
```

## Content targeting

Every API request sends the native platform, market, authentication state, and installed app version. Payload filters documents, page blocks, promotions, and destinations before the response reaches the app.

The `casamaiz://` scheme supports `/`, `/menu`, `/reservas`, `/reorder`, and `/legal/:key`.

## Verification

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
cd android && ./gradlew assembleDebug
```
