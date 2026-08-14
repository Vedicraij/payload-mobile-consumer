# Install the app on Android (debug or e2e build).
# Run the Maestro flows (home-to-menu.yaml and privacy.yaml).
# Generate JUnit reports.
# Capture failure artifacts (screenshots, logs).
# Exit with non-zero code if any test fails.

$ErrorActionPreference = 'Stop'
$reportsDirectory = "reports/maestro/live"
New-Item -ItemType Directory -Force -Path $reportsDirectory | Out-Null

# Build and install app
Push-Location android
./gradlew app:installDebug
Pop-Location

# Array to track exit codes
$exitCodes = @()

# Run home-to-menu flow with artifact collection
Write-Host "Running home-to-menu flow..."
& "/c/Maestro/bin/maestro" test `
    --format junit `
    --output "$reportsDirectory/junit-home-to-menu.xml" `
    --debug-output "$reportsDirectory/home-to-menu/" `
    maestro/android/home-to-menu.yaml
$exitCodes += $LASTEXITCODE

if ($LASTEXITCODE -ne 0) {
    Write-Error "Maestro home-to-menu test failed with exit code $LASTEXITCODE"
}

# Run privacy flow with artifact collection
Write-Host "Running privacy flow..."
& "/c/Maestro/bin/maestro" test `
    --format junit `
    --output "$reportsDirectory/junit-privacy.xml" `
    --debug-output "$reportsDirectory/privacy/" `
    maestro/android/privacy.yaml
$exitCodes += $LASTEXITCODE

if ($LASTEXITCODE -ne 0) {
    Write-Error "Maestro privacy test failed with exit code $LASTEXITCODE"
}

# Capture ADB logs before exiting
try {
    Write-Host "Capturing ADB logs..."
    adb logcat -d > "$reportsDirectory/adb-log.txt" 2>$null
} catch {
    Write-Warning "Could not capture ADB logs: $_"
}

# Generate JSON summary for live tests
$liveSummary = @{
    date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    flows = @(
        @{ name = "home-to-menu"; status = if ($exitCodes[0] -eq 0) { "passed" } else { "failed" } },
        @{ name = "privacy"; status = if ($exitCodes[1] -eq 0) { "passed" } else { "failed" } }
    )
}
$liveSummary | ConvertTo-Json | Out-File "$reportsDirectory/summary.json"

# Determine overall exit code (fail if any test failed)
$overallExitCode = 0
foreach ($code in $exitCodes) {
    if ($code -ne 0) {
        $overallExitCode = $code
        break
    }
}

if ($overallExitCode -ne 0) {
    Write-Error "One or more Maestro tests failed. Exit code: $overallExitCode"
    exit $overallExitCode
} else {
    Write-Host "All Maestro tests passed successfully."
    exit 0
}