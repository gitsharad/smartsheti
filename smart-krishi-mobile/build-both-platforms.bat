@echo off
echo ========================================
echo Smart Krishi - Build Both Platforms
echo ========================================
echo.

echo Step 1: Checking EAS login...
eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Please login to EAS first:
    echo eas login
    echo.
    pause
    exit /b 1
)

echo ✅ Logged into EAS!

echo.
echo Step 2: Building Android APK...
echo This will take 10-15 minutes...
eas build --platform android --profile preview

echo.
echo Step 3: Building iOS App...
echo This will take 15-20 minutes...
eas build --platform ios --profile preview

echo.
echo ✅ Both builds started!
echo 📧 Check your email for download links.
echo.
pause 