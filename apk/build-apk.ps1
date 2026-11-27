# StaySphere Automated APK Collector & Builder Script
param (
    [switch]$BuildWithGradle = $false
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = Resolve-Path "$PSScriptRoot\.."
$AndroidDir = Join-Path $WorkspaceRoot "android"
$ApkDir = $PSScriptRoot
$GradleApkPath = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
$DestinationApk = Join-Path $ApkDir "StaySphere-debug.apk"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   StaySphere APK Manager & Exporter      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Sync latest assets to Android native project
Write-Host "`n[1/3] Syncing latest web assets with Capacitor..." -ForegroundColor Yellow
Set-Location $WorkspaceRoot
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Capacitor sync encountered a notice. Continuing..."
}

# 2. Attempt Gradle build if requested and gradlew is present
if ($BuildWithGradle) {
    Write-Host "`n[2/3] Building APK using Gradle wrapper..." -ForegroundColor Yellow
    if (Test-Path "$AndroidDir\gradlew.bat") {
        Set-Location $AndroidDir
        & .\gradlew.bat assembleDebug
    } else {
        Write-Error "gradlew.bat not found in $AndroidDir"
    }
} else {
    Write-Host "`n[2/3] Checking for compiled APK in Android build output..." -ForegroundColor Yellow
}

# 3. Check and copy APK to apk/ folder
if (Test-Path $GradleApkPath) {
    Copy-Item -Path $GradleApkPath -Destination $DestinationApk -Force
    Write-Host "`n[SUCCESS] APK successfully exported!" -ForegroundColor Green
    Write-Host "Location: $DestinationApk" -ForegroundColor Green
    Write-Host "Size: $((Get-Item $DestinationApk).Length / 1MB | ForEach-Object { '{0:N2} MB' -f $_ })" -ForegroundColor Gray
} else {
    Write-Host "`n[Notice] No compiled APK found at $GradleApkPath yet." -ForegroundColor Yellow
    Write-Host "To generate it:" -ForegroundColor Cyan
    Write-Host "  1. Run 'npx cap open android' to open in Android Studio."
    Write-Host "  2. Go to Build -> Build Bundle(s) / APK(s) -> Build APK(s)."
    Write-Host "  3. Re-run this script: .\apk\build-apk.ps1"
}

Set-Location $WorkspaceRoot
