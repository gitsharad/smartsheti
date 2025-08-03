@echo off
echo ========================================
echo Smart Krishi Mobile - Universal Builder
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
echo Step 3: Choose platform to build:
echo.
echo 1. Android APK
echo 2. iOS App
echo 3. Both (Android + iOS)
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" (
    echo.
    echo Building Android APK...
    echo This will take 10-15 minutes...
    eas build --platform android --profile preview
    echo.
    echo ✅ Android APK build started! Check your email for download link.
)

if "%choice%"=="2" (
    echo.
    echo Building iOS App...
    echo This will take 15-20 minutes...
    echo Note: iOS builds require Apple Developer account
    eas build --platform ios --profile preview
    echo.
    echo ✅ iOS build started! Check your email for download link.
)

if "%choice%"=="3" (
    echo.
    echo Building both Android APK and iOS App...
    echo This will take 25-35 minutes total...
    echo.
    echo Building Android APK first...
    eas build --platform android --profile preview
    echo.
    echo Building iOS App...
    eas build --platform ios --profile preview
    echo.
    echo ✅ Both builds started! Check your email for download links.
)

echo.
echo 📱 Build Options Summary:
echo - Android: APK file for direct installation
echo - iOS: IPA file for TestFlight or App Store
echo.
echo 📧 You'll receive email notifications when builds complete.
echo.
pause 