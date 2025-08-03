# Smart Krishi iOS App Build Guide

## 📱 iOS App Overview
Smart Krishi iOS app is built with React Native and Expo, optimized for iPhone and iPad.

## 🚀 Quick Start - iOS Build

### Option 1: EAS Build (Recommended)
1. **Create Expo Account**: Go to https://expo.dev and sign up
2. **Login to EAS**: Run `eas login` in terminal
3. **Build iOS App**: Run `build-ios.bat` or `eas build --platform ios --profile preview`
4. **Download**: Get IPA file from email or Expo dashboard

### Option 2: Test with Expo Go
1. Install "Expo Go" app on your iPhone/iPad from App Store
2. Run `npx expo start`
3. Scan QR code with Expo Go app

## 📋 iOS App Configuration
- **Name**: Smart Krishi
- **Bundle ID**: com.smartkrishi.mobile
- **Version**: 1.0.0
- **Build Number**: 1
- **Permissions**: Camera, Photo Library, Location

## 🔧 iOS-Specific Features
- **Universal App**: Works on iPhone and iPad
- **Camera Integration**: Field image capture
- **Location Services**: GPS for field mapping
- **Photo Library**: Image selection for reports
- **Push Notifications**: Real-time alerts
- **Offline Support**: Works without internet

## 🛠️ iOS Build Requirements

### For EAS Build (Cloud - No Mac needed)
- ✅ Expo account
- ✅ EAS CLI installed
- ✅ App configuration ready

### For Local Build (Requires Mac)
- 🍎 Mac computer with macOS
- 🍎 Xcode installed
- 🍎 Apple Developer account ($99/year)
- 🍎 iOS Simulator or physical device

## 📱 iOS App Features

### Core Features
- **User Authentication**: Secure login system
- **Field Monitoring**: Real-time sensor data
- **Data Analytics**: Charts and reports
- **Weather Integration**: Local weather data
- **Offline Mode**: Works without internet

### iOS-Specific Features
- **3D Touch**: Quick actions
- **Haptic Feedback**: Touch responses
- **Siri Integration**: Voice commands
- **Apple Watch**: Companion app (future)
- **iCloud Sync**: Data backup

## 🚀 Build Commands

### EAS Build (Recommended)
```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Local Build (Mac only)
```bash
# Install dependencies
npm install

# Start development
npx expo start

# Run on iOS Simulator
npx expo run:ios

# Build for device
npx expo run:ios --device
```

## 📱 Testing Options

### 1. Expo Go (Easiest)
- Install Expo Go from App Store
- Scan QR code from development server
- Test app immediately

### 2. iOS Simulator (Mac only)
- Install Xcode
- Run `npx expo run:ios`
- Test in iOS Simulator

### 3. Physical Device (Mac only)
- Connect iPhone/iPad
- Run `npx expo run:ios --device`
- Test on actual device

## 🍎 App Store Submission

### Prerequisites
- Apple Developer account ($99/year)
- App Store Connect setup
- App icons and screenshots
- Privacy policy and terms

### Submission Steps
1. Build production app: `eas build --platform ios --profile production`
2. Submit to App Store: `eas submit --platform ios`
3. Review in App Store Connect
4. Submit for review

## 📋 iOS App Requirements

### Technical Requirements
- iOS 13.0 or later
- iPhone 6s or later
- iPad (5th generation) or later
- Internet connection for full features

### Design Requirements
- App icons (1024x1024)
- Screenshots for different devices
- Privacy policy
- App description

## 🔧 Configuration Files
- `app.json` - iOS configuration
- `eas.json` - Build profiles
- `build-ios.bat` - Windows build script

## 📞 Support
- Expo iOS Guide: https://docs.expo.dev/guides/ios/
- Apple Developer: https://developer.apple.com
- App Store Connect: https://appstoreconnect.apple.com

## ✅ Status
- ✅ iOS app configured
- ✅ Build system ready
- ✅ EAS build profiles set up
- ✅ Ready for iOS build and submission 