# Smart Krishi Mobile App

## 📱 App Overview
Smart Krishi is an AI-powered agriculture platform mobile app built with React Native and Expo, available for both Android and iOS.

## 🚀 Quick Start

### Option 1: Build APK (Android)
1. **Create Expo Account**: Go to https://expo.dev and sign up
2. **Login to EAS**: Run `eas login` in terminal
3. **Build APK**: Run `build-apk-eas.bat` or `eas build --platform android --profile preview`
4. **Download**: Get APK from email or Expo dashboard

### Option 2: Build iOS App
1. **Create Expo Account**: Go to https://expo.dev and sign up
2. **Login to EAS**: Run `eas login` in terminal
3. **Build iOS**: Run `build-ios.bat` or `eas build --platform ios --profile preview`
4. **Download**: Get IPA file from email or Expo dashboard

### Option 3: Test with Expo Go
1. Install "Expo Go" app on your phone from App Store/Google Play
2. Run `npx expo start`
3. Scan QR code with Expo Go app

## 📋 App Configuration

### Android
- **Name**: Smart Krishi
- **Package**: com.smartkrishi.mobile
- **Version**: 1.0.0
- **Permissions**: Internet, Camera, Storage, Location

### iOS
- **Name**: Smart Krishi
- **Bundle ID**: com.smartkrishi.mobile
- **Version**: 1.0.0
- **Build Number**: 1
- **Permissions**: Camera, Photo Library, Location

## 🔧 Build Files
- `app.json` - App configuration (Android + iOS)
- `eas.json` - Build configuration
- `build-apk-eas.bat` - Android build script
- `build-ios.bat` - iOS build script
- `check-status.bat` - Status checker

## 📁 Project Structure
```
smart-krishi-mobile/
├── App.tsx              # Main app component
├── screens/             # App screens
├── assets/              # Icons and images
├── app.json             # Expo configuration
├── eas.json             # EAS build config
└── package.json         # Dependencies
```

## 🛠️ Development
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React Hooks
- **UI**: Custom components with Tailwind-like styling
- **Platforms**: Android + iOS

## 📱 Features
- User authentication
- Field monitoring
- Data analytics
- Real-time alerts
- Offline support
- Camera integration
- Location services
- Push notifications

## 🚀 Build Commands
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Build Android APK
eas build --platform android --profile preview

# Build iOS App
eas build --platform ios --profile preview

# Test on device
npx expo start --tunnel
```

## 📱 Platform-Specific Features

### Android
- APK distribution
- Google Play Store ready
- Android-specific permissions
- Adaptive icons

### iOS
- Universal app (iPhone + iPad)
- App Store ready
- iOS-specific permissions
- 3D Touch support
- Haptic feedback

## 🍎 iOS Requirements
- iOS 13.0 or later
- iPhone 6s or later
- iPad (5th generation) or later
- Apple Developer account for App Store submission

## 🤖 Android Requirements
- Android 6.0 (API level 23) or later
- Google Play Services
- Camera and location permissions

## 📞 Support
- Expo Documentation: https://docs.expo.dev
- EAS Build Guide: https://docs.expo.dev/build/introduction/
- iOS Guide: https://docs.expo.dev/guides/ios/
- Android Guide: https://docs.expo.dev/guides/android/
- Community: https://forums.expo.dev

## ✅ Status
- ✅ App configured for Android and iOS
- ✅ Build system ready for both platforms
- ✅ Dependencies installed
- ✅ Ready for APK and iOS app generation 