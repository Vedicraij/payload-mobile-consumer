# Set environment variables for failure scenario (e.g., .env.failure).
# Start a local mock server (if needed) returning 503.
# Install the app.
# Run the failure.yaml flow.
# Generate JUnit reports and capture failure artifacts.
# Exit with non-zero code if test fails.

$ErrorActionPreference = 'Stop'
$reportsDirectory = "reports/maestro/failure"
New-Item -ItemType Directory -Force -Path $reportsDirectory | Out-Null

# Set environment variable for failure scenario
$env:CMS_URL = "http://invalid-endpoint.local"

# Build and install app
Push-Location android
./gradlew app:installDebug
Pop-Location

# Run failure flow with artifact collection
Write-Host "Running failure flow..."
& "/c/Maestro/bin/maestro" test `
    --format junit `
    --output "$reportsDirectory/junit-failure.xml" `
    --debug-output "$reportsDirectory/failure/" `
    maestro/android/failure.yaml
$exitCode = $LASTEXITCODE

if ($LASTEXITCODE -ne 0) {
    Write-Error "Maestro failure test failed with exit code $LASTEXITCODE"
}

# Capture ADB logs
try {
    Write-Host "Capturing ADB logs..."
    adb logcat -d > "$reportsDirectory/adb-log.txt" 2>$null
} catch {
    Write-Warning "Could not capture ADB logs: $_"
}

# Capture device screenshot on failure
if ($LASTEXITCODE -ne 0) {
    try {
        Write-Host "Capturing failure screenshot..."
        adb exec-out screencap -p > "$reportsDirectory/failure-screenshot.png" 2>$null
    } catch {
        Write-Warning "Could not capture failure screenshot: $_"
    }
}

# Generate JSON summary
$summary = @{
    date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    flow = @{
        name = "failure"
        status = if ($LASTEXITCODE -eq 0) { "passed" } else { "failed" }
    }
    environmentVariable = "CMS_URL=$env:CMS_URL"
}
$summary | ConvertTo-Json -Depth 3 | Out-File "$reportsDirectory/summary.json"

# Exit with the same code as Maestro
if ($LASTEXITCODE -ne 0) {
    Write-Error "Maestro failure test failed. Exit code: $LASTEXITCODE"
    exit $LASTEXITCODE
} else {
    Write-Host "Maestro failure test passed successfully."
    exit 0
}