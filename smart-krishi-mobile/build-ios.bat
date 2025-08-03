@echo off
echo ========================================
echo Smart Krishi Mobile - iOS App Builder
echo ========================================
echo.

echo Step 1: Checking if you're logged into EAS...
eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ You're not logged into EAS yet.
    echo.
    echo Please follow these steps:
    echo 1. Create account at https://expo.dev
    echo 2. Run: eas login
    echo 3. Then run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ You're logged into EAS!
echo.

echo Step 2: Configuring build...
eas build:configure

echo.
echo Step 3: Building iOS App...
echo This will take 15-20 minutes...
echo Note: iOS builds require Apple Developer account
eas build --platform ios --profile preview

echo.
echo ✅ iOS build started! Check your email for download link.
echo.
echo 📱 iOS Build Options:
echo - Preview: TestFlight build (requires Apple Developer account)
echo - Production: App Store build (requires App Store Connect setup)
echo.
pause 