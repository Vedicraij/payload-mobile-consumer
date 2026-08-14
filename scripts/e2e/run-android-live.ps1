# Install the app on Android (debug or e2e build).
# Run the Maestro flows (home-to-menu.yaml and privacy.yaml).
# Generate JUnit reports.
# Capture failure artifacts (screenshots, logs).

$ErrorActionPreference = 'Stop'
$reportsDirectory = "reports/maestro/live"
New-Item -ItemType Directory -Force -Path $reportsDirectory | Out-Null

# Build and install app
Push-Location android
./gradlew app:installDebug
Pop-Location

# Run Maestro flows
& "/c/Maestro/bin/maestro" test --format junit --output "$reportsDirectory/junit.xml" maestro/android/home-to-menu.yaml
& "/c/Maestro/bin/maestro" test --format junit --output "$reportsDirectory/privacy-junit.xml" maestro/android/privacy.yaml