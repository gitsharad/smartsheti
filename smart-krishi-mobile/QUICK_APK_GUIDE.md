# Quick APK Build Guide - Smart Krishi Mobile

## 🚀 EASY METHOD: Build APK without Android Studio

### Step 1: Create Expo Account
1. Go to https://expo.dev
2. Click "Sign Up" and create a free account
3. Verify your email

### Step 2: Login to EAS
Open a new terminal in the smart-krishi-mobile folder and run:
```bash
eas login
```
Enter your Expo account credentials.

### Step 3: Configure Build
```bash
eas build:configure
```
This will set up the build configuration.

### Step 4: Build APK
```bash
eas build --platform android --profile preview
```

### Step 5: Download APK
- The build will take 10-15 minutes
- You'll get a download link in your email
- Or download directly from the Expo dashboard

## 📱 Test the App First (Optional)

If you want to test before building APK:

1. **Install Expo Go** on your Android phone from Google Play Store
2. **Run the development server:**
   ```bash
   npx expo start
   ```
3. **Scan the QR code** with Expo Go app
4. **Test the app** on your phone

## 🔧 Alternative: Local Build (Requires Android Studio)

If you prefer local builds:
1. Install Android Studio
2. Install Android SDK
3. Set ANDROID_HOME environment variable
4. Run: `npx expo run:android`

## 📋 Current App Configuration

✅ **App Name:** Smart Krishi  
✅ **Package:** com.smartkrishi.mobile  
✅ **Version:** 1.0.0  
✅ **Permissions:** Internet, Camera, Storage  
✅ **Build Type:** APK  

## 🎯 Recommended Approach

**Use EAS Build** - It's the easiest method and doesn't require any local setup!

## 📞 Need Help?

- Expo Documentation: https://docs.expo.dev
- EAS Build Guide: https://docs.expo.dev/build/introduction/
- Community Support: https://forums.expo.dev 