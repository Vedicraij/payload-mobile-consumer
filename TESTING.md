# Testing Guide – Casa Maíz Mobile

This document describes how to run all automated quality checks for the mobile application. All commands must be executed from the project root.

## Prerequisites

- Node.js 22.11 or newer
- npm 10 or newer
- iOS simulator (macOS only) or Android emulator for E2E tests

## Installation

```bash
npm ci
```

## Quality Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit and integration tests (Jest + React Native Testing Library)
npm test -- --runInBand

# CI mode with coverage
npm run test:ci

# Mobile E2E tests (Maestro) - to be implemented
# npm run e2e:android
# npm run e2e:ios

# Generate machine-readable reports
# Jest already outputs JSON with --json --outputFile=reports/unit-tests.json flag
# E2E framework will provide additional reporting
```

## Reports and Failure Artifacts

- Unit test reports: `./coverage/` and `./test-results/`
- E2E screenshots: `./e2e/screenshots/` (on failure)
- E2E videos: `./e2e/videos/` (on failure)
- Test metadata: `./test-metadata/`

## Second-Platform Strategy

While primary E2E development will focus on Android (emulator accessibility), the test architecture is designed for dual-platform execution:
- Platform-specific tests mocked via `Platform.OS` in unit/integration layer
- E2E test scripts will use platform-agnostic selectors where possible
- Device farm or CI configuration will validate both platforms pre-merge