# Set environment variables for failure scenario (e.g., .env.failure).
# Start a local mock server (if needed) returning 503.
# Install the app.
# Run the failure.yaml flow.
# Generate JUnit reports and capture failure artifacts.

$ErrorActionPreference = 'Stop'
$reportsDirectory = "reports/maestro/failure"
New-Item -ItemType Directory -Force -Path $reportsDirectory | Out-Null

# Set environment variable for failure scenario
$env:CMS_URL = "http://invalid-endpoint.local"

# Build and install app
Push-Location android
./gradlew app:installDebug
Pop-Location

# Run Maestro flow for failure scenario
& "$HOME/.maestro/bin/maestro" test --format junit --output "$reportsDirectory/failure-junit.xml" maestro/android/failure.yaml