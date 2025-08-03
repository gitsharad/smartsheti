@echo off
echo Smart Krishi Mobile APK Build Script
echo =====================================

echo.
echo Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo Node.js and npm are installed.

echo.
echo Installing dependencies...
npm install

echo.
echo Starting Expo development server...
echo.
echo To build APK, you have these options:
echo.
echo 1. For testing with Expo Go:
echo    - Install Expo Go app on your Android device
echo    - Scan the QR code that appears
echo.
echo 2. For building APK with EAS:
echo    - Create account at https://expo.dev
echo    - Run: eas login
echo    - Run: eas build --platform android --profile preview
echo.
echo 3. For local build (requires Android Studio):
echo    - Install Android Studio
echo    - Set ANDROID_HOME environment variable
echo    - Run: npx expo run:android
echo.

npx expo start 