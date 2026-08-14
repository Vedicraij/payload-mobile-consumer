# Casa Maíz mobile

Native React Native application for iOS and Android, powered by the versioned
Payload CMS content API.

## Quality Strategy & Risk Model

This document defines the automation strategy, risk priorities, and test layers for the mobile application. The goal is to build a maintainable, reliable, and executable quality solution across API, component/integration, and end-to-end layers.

### Risk identification (ordered by criticality)

| Risk | Impact | Primary test layer | Mitigation strategy |
|------|--------|---------------------|----------------------|
| **Content contract version mismatch** | Client may consume an incompatible API version without detection. | API / Contract (separate repository) | Contract tests validate the envelope, detect additive fields safely, and fail on breaking changes. |
| **Dynamic CMS block rendering** | An unknown or malformed block can crash the UI or cause blank sections. | Component / Integration (React Native Testing Library) | Tests ensure known blocks render correctly; unknown blocks fall back without crashing. |
| **Navigation and destination resolution** | CMS links may point to undefined or incorrectly resolved destinations. | Integration (React Native Testing Library) | Interaction tests simulate clicks and verify navigation using mocked routers, avoiding hardcoded IDs. |
| **Platform-specific behavior (iOS/Android)** | Differences in rendering, styles, or effect handling. | Component / Integration | Tests mock `Platform.OS` to validate platform-specific logic without duplicating whole suites. |
| **Cache and `nextChangeAt` staleness** | Stale cached content may be served beyond its validity window. | Integration (effects and timers) | Time-controlled tests (`jest.useFakeTimers`) simulate expiration and verify refresh or stale display. |
| **Network failures / degradation** | App must gracefully handle timeouts, 404s, or incompatible contracts. | Mobile E2E (Maestro/Detox) | Degradation scenario mocks slow or failing requests and verifies error messages and retry paths. |
| **Accessibility** | CMS blocks may lack labels, roles, or alternative text. | Component (RTNL) + Web E2E (Playwright) | Assertions for `accessible`, `role`, `label`; web uses `getByRole` and axe audits. |
| **iOS/Android behavioral differences** | Platform-specific variations in touch handling, navigation, or performance. | Component / Integration + Mobile E2E | Platform-specific assertions in tests and dual-platform E2E validation. |
| **Mobile E2E reliability** | Flaky tests reducing confidence in test suite. | Mobile E2E | Stable selectors, no fixed sleeps, proper wait strategies, and deterministic test data. |

### Test layer distribution

- **API / Contract** (separate repository): ~30% effort – endpoint validation, contract shape, error handling.
- **React Native Component / Integration** (this repository): ~40% effort – rendering logic, navigation, cache, platform differences.
- **Mobile E2E** (this repository): ~20% effort – critical journeys and degradation scenarios.
- **Playwright Web** (separate repository): ~10% effort – web consumer validation and accessibility.

### Guiding principles

- **Avoid coupling to IDs or editorial content**: Use semantic assertions (titles, roles, visible text) and compare against contract structure, not hardcoded database values.
- **Isolate state**: Each test must be reproducible and order-independent.
- **Mock external dependencies**: In integration tests, intercept CMS requests with deterministic mocks.
- **Control time**: Use fake timers to avoid sleeps and ensure fast, reliable tests.

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

## E2E Execution (Maestro)

End-to-end tests are executed using Maestro on Android devices. The tests
validate critical user journeys and capture failure artifacts for debugging.

### Running E2E Tests

```bash
# Live test flow (home-to-menu and privacy)
npm run test:e2e:android

# Failure test flow (error handling simulation)
npm run test:e2e:android:failure
```

### Reports and Artifacts

After execution, reports and artifacts are stored in:
- `reports/maestro/live/` - Live test results (home-to-menu, privacy)
- `reports/maestro/failure/` - Failure test results

Each directory contains:
- JUnit XML reports (e.g., `junit-home-to-menu.xml`)
- Maestro debug output directories
- ADB logs (`adb-log.txt`)
- Failure screenshots (`failure-screenshot.png` in failure directory)
- JSON summary files (`summary.json`)

### Test Architecture

The E2E test suite consists of three Maestro flows:
1. **home-to-menu.yaml**: Tests navigation from Home to Menu screen
2. **privacy.yaml**: Tests deep linking to Privacy screen via URL scheme
3. **failure.yaml**: Tests error handling when CMS endpoint is unavailable

All flows use `testID` selectors for stable element identification and
include proper timeout handling (30 seconds) for CI environment compatibility.

## AI Usage

The following AI tools were used during this assessment:

- **Claude (via VS Code)** – Used to generate test skeletons, refactor code, and assist with debugging. Specifically, Claude helped:
  - Refactor large test files into smaller, focused files.
  - Debug issues with `SafeAreaProvider` and mocks.
  - Generate PowerShell scripts.
  - Review code and suggest improvements.

All AI-generated code and suggestions were reviewed, tested, and validated against the project's standards before being committed.

See [docs/AI_USAGE.md](docs/AI_USAGE.md) for more details.

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