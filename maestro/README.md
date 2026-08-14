# Maestro E2E Tests

This directory contains Maestro flows for end-to-end testing of the Mobile Restaurant application.

## Flows

### `android/home-to-menu.yaml`
- Launches the app and clears state.
- Waits for the Home screen to load (identified by `testID="cms-page-home"`).
- Taps the Menu link/button (identified by `testID="cms-link-menu"`).
- Waits for the Menu screen to load (identified by `testID="cms-page-menu"`).
- Asserts the Menu screen is visible.

### `android/privacy.yaml`
- Launches the app with a deep link directly to the Privacy screen (`casamaiz://legal/privay`).
- Asserts the Privacy screen is visible (identified by `testID="legal-privacy"`).
This flow tests that the app correctly handles deep links to legal content and displays the privacy screen.

### `android/failure.yaml`
- Launches the app with an invalid CMS endpoint (simulated via environment variable `CMS_URL`).
- Waits for an error screen to appear (identified by `testID="screen-error"`).
- Asserts the error screen is visible.
- Taps the retry button (identified by `testID="retry-button"`).
- Waits for the error screen to reappear (simulating a persistent failure).
- Asserts the error screen is still visible.

## Prerequisites

To run these flows locally, you need:

1. **Maestro CLI** - installed and available in your PATH.
2. **Android Debug Bridge (ADB)** - installed and available in your PATH.
3. **An Android device or emulator** - connected and authorized for debugging.

### Important Note on Local Execution

> **This development machine is a nested virtual machine and does NOT support hardware virtualization (VT-x). Therefore, the Android emulator cannot run locally.**

To execute these flows, you must use one of the following:
- A physical Android device with USB debugging enabled.
- A CI environment that supports hardware acceleration (e.g., GitHub Actions with Android emulator, Bitrise, etc.).

## Second-Platform (iOS) Strategy

The same Maestro flows can be executed on iOS from a macOS machine with the following considerations:

1. **Prerequisites on macOS**:
   - Maestro CLI installed.
   - Xcode command-line tools installed.
   - An iOS simulator connected (via `xcrun simctl`) or a physical iOS device.

2. **Platform Differences**:
   - The flows are written to be platform-agnostic by using `testID` selectors, which are supported on both Android and iOS by Maestro.
   - If any `testID` is not accessible on iOS due to platform-specific rendering, you can fall back to `accessibilityLabel` selectors (which are also cross-platform).
   - In this application, we have ensured that critical elements have `testID` attributes (see below) for reliable selection.

3. **Running on iOS**:
   - Use the same flow files but specify the iOS device when running Maestro:
     ```bash
       maestro test ios/ maestro/android/home-to-menu.yaml
     ```
   - For the privacy flow, the deep link approach uses a URL scheme; iOS also supports the same scheme if configured in the Xcode project (which it is via the `Linking` configuration).
   - Alternatively, you can create platform-specific flow files in `maestro/ios/` if needed, but the current flows are designed to work on both platforms.

## Test ID Selectors

To ensure reliable test execution, the following `testID` attributes have been added to the application (if they were missing):

- **Home screen root**: `testID="cms-page-home"` (in `src/screens/CMSPageScreen.tsx`)
- **Menu button/link**: `testID="cms-link-menu"` (in `src/navigation/RootNavigator.tsx` - tab bar button)
- **Privacy link**: The privacy flow uses a deep link to `casamaiz://legal/privacy`, which routes to the Legal screen with key "privacy". The Legal screen container has `testID="legal-privacy"` (in `src/screens/LegalScreen.tsx`).
- **Error state**: `testID="screen-error"` (in `src/components/ScreenState.tsx`)
- **Retry button**: `testID="retry-button"` (in `src/components/ScreenState.tsx`)

These selectors are used in the Maestro flows above.

## Running the Tests

Helper PowerShell scripts are provided in `scripts/e2e/` to build the app, install it on a connected Android device/emulator, run the Maestro flows, and generate JUnit reports:

- **Live test flow** (home-to-menu and privacy):
  ```powershell
  .\scripts\e2e\run-android-live.ps1
  ```

- **Failure test flow**:
  ```powershell
  .\scripts\e2e\run-android-failure.ps1
  ```

These scripts can also be invoked via npm (after adding to `package.json`):

```bash
npm run test:e2e:android
npm run test:e2e:android:failure
```

Reports are generated in the `reports/maestro/` directory in JUnit XML format.