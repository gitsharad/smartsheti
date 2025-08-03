# Smart Krishi Mobile APK Build Guide

## Prerequisites

To build the APK, you need one of the following approaches:

### Option 1: Using EAS Build (Recommended)
1. Create an Expo account at https://expo.dev
2. Login to EAS: `eas login`
3. Configure the build: `eas build:configure`
4. Build the APK: `eas build --platform android --profile preview`

### Option 2: Using Expo Development Build
1. Install Android Studio and Android SDK
2. Set ANDROID_HOME environment variable
3. Run: `npx expo run:android`

### Option 3: Using Expo Go (For Testing)
1. Install Expo Go app on your Android device
2. Run: `npx expo start`
3. Scan the QR code with Expo Go

## Current Setup

The app is configured with:
- Package name: `com.smartkrishi.mobile`
- App name: "Smart Krishi"
- Version: 1.0.0
- Required permissions: Internet, Camera, Storage

## Build Configuration

The app.json and eas.json files are already configured for APK builds.

## Next Steps

1. **For immediate testing**: Use Expo Go app
2. **For APK build**: Set up EAS account and run build commands
3. **For local build**: Install Android Studio and SDK

## Files Created
- `app.json`: Updated with Android configuration
- `eas.json`: EAS build configuration
- Build scripts and configurations ready 