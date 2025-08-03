# Quick Build Commands - Smart Krishi

## 🚀 Build Both Platforms

### Step 1: Login to EAS
```bash
eas login
```

### Step 2: Build Android APK
```bash
eas build --platform android --profile preview
```

### Step 3: Build iOS App
```bash
eas build --platform ios --profile preview
```

## 📱 Alternative: Use Build Scripts

### Windows
```bash
# Build both platforms
build-both-platforms.bat

# Or use the universal builder
build-all.bat
```

### Manual Commands
```bash
# Check if logged in
eas whoami

# Configure build (first time only)
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS App
eas build --platform ios --profile preview
```

## 📧 Download Files

After builds complete:
- **Android**: APK file download link in email
- **iOS**: IPA file download link in email
- **Dashboard**: Check https://expo.dev for build status

## ⏱️ Build Times
- Android APK: 10-15 minutes
- iOS App: 15-20 minutes
- Both platforms: 25-35 minutes total

## 📋 Requirements
- ✅ Expo account (free)
- ✅ EAS CLI installed
- ✅ App configured for both platforms 