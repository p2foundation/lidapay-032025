# Android Studio Emulator Setup Guide for Lidapay

## Prerequisites

1. **Android Studio** (Latest version recommended)
2. **Java Development Kit (JDK)** 17 or higher
3. **Android SDK** with API level 26+ (Android 8.0+)
4. **Android Virtual Device (AVD)** or physical Android device

## Project Status ✅

The project has been successfully prepared for Android Studio emulator:

- ✅ **Angular build completed** - All compilation errors fixed
- ✅ **Capacitor sync completed** - Web assets copied to Android
- ✅ **Android project cleaned** - Gradle build successful
- ✅ **Dependencies resolved** - All Capacitor plugins configured
- ✅ **Android 15 (API 35) Compliant** - Meets Google Play requirements

## 🔧 **Updated Technical Stack**

### **Build Tools (Latest)**
- **Gradle**: 8.11.1
- **Android Gradle Plugin**: 8.7.2
- **Java**: 17 (Modern compatibility)
- **Kotlin**: 2.0.20
- **Build Tools**: 35.0.0

### **Android Configuration**
- **compileSdkVersion**: 35 (Android 15)
- **targetSdkVersion**: 35 (Android 15)
- **minSdkVersion**: 26 (Android 8.0)
- **Target Platform**: Android 15 (API 35)

### **Capacitor & Dependencies**
- **Capacitor**: Latest version with Android 15 support
- **AndroidX Libraries**: Latest versions
- **Security**: Latest Android security patches
- **Performance**: Optimized for modern devices

## 📱 **Compatibility Matrix**

| Android Version | API Level | Support Level | Notes |
|----------------|-----------|---------------|-------|
| Android 8.0 | API 26 | ✅ Required | Minimum supported |
| Android 9.0 | API 28 | ✅ Full | Optimized |
| Android 10 | API 29 | ✅ Full | Optimized |
| Android 11 | API 30 | ✅ Full | Optimized |
| Android 12 | API 31 | ✅ Full | Optimized |
| Android 13 | API 33 | ✅ Full | Optimized |
| Android 14 | API 34 | ✅ Full | Recommended |
| Android 15 | API 35 | ✅ Full | **Primary Target** |

## Quick Start

### 1. Open Project in Android Studio

```bash
# Option 1: Open directly from Android Studio
File → Open → Select: lidapay-032025/android

# Option 2: Use command line
npm run cap:open:android
```

### 2. Build and Run

```bash
# Build the project
npm run cap:build:android

# Or manually in Android Studio:
# Build → Make Project (Ctrl+F9)
# Run → Run 'app' (Shift+F10)
```

## Detailed Setup Steps

### Step 1: Android Studio Configuration

1. **Open Android Studio**
2. **Open Project**: Navigate to `lidapay-032025/android` folder
3. **Wait for Gradle Sync**: Let Android Studio complete the initial setup
4. **Check SDK**: Ensure you have Android SDK API 26+ installed

### Step 2: Create/Configure Emulator

1. **AVD Manager**: Tools → AVD Manager
2. **Create Virtual Device**: Click "Create Virtual Device"
3. **Select Device**: Choose a phone (e.g., Pixel 6)
4. **Select System Image**: 
   - **Recommended**: API 35 (Android 15) - **PRIMARY TARGET**
   - **Alternative**: API 34 (Android 14)
   - **Minimum**: API 26 (Android 8.0)
5. **Configure AVD**: Set RAM (2GB+), Internal Storage (2GB+)
6. **Finish**: Click "Finish" to create the emulator

### Step 3: Build Configuration

1. **Gradle Sync**: File → Sync Project with Gradle Files
2. **Build Project**: Build → Make Project
3. **Check Build Output**: Ensure no errors in Build tab

### Step 4: Run on Emulator

1. **Select Device**: Choose your emulator from the device dropdown
2. **Run App**: Click the green "Run" button or Shift+F10
3. **Wait for Installation**: The app will install and launch on the emulator

## Troubleshooting

### Common Issues

#### 1. Gradle Build Failures
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew build

# Or in Android Studio: Build → Clean Project
```

#### 2. Emulator Performance Issues
- **Enable Hardware Acceleration**: 
  - Intel HAXM (Windows/macOS)
  - KVM (Linux)
- **Increase RAM**: Set emulator RAM to 4GB+
- **Use x86_64 system images**: Better performance than ARM

#### 3. SDK Issues
```bash
# Check SDK installation
sdkmanager --list

# Install missing SDK components
sdkmanager "platforms;android-35"
sdkmanager "build-tools;35.0.0"
```

#### 4. Capacitor Sync Issues
```bash
# Re-sync Capacitor
npm run cap:sync

# Clean and rebuild
npm run build
npm run cap:sync
```

### Performance Optimization

1. **Emulator Settings**:
   - Enable "Use Host GPU"
   - Set RAM to 4GB+
   - Enable "Multi-Core CPU"
   - Use x86_64 system images

2. **Android Studio Settings**:
   - Increase IDE memory: Help → Edit Custom VM Options
   - Enable "Power Save Mode" when not actively developing

## Project Structure

```
lidapay-032025/
├── src/                    # Angular source code
├── www/                    # Built web assets
├── android/                # Android project
│   ├── app/               # Main app module
│   ├── build.gradle       # Project-level build config
│   ├── app/build.gradle   # App-level build config
│   └── gradle/            # Gradle wrapper
└── package.json           # Project dependencies
```

## Build Commands Reference

```bash
# Development workflow
npm run build              # Build Angular app
npm run cap:sync          # Sync with native projects
npm run cap:open:android  # Open in Android Studio
npm run cap:run:android   # Build and run on device

# Android-specific commands
cd android
./gradlew clean           # Clean build
./gradlew build          # Build project
./gradlew assembleDebug  # Build debug APK
./gradlew assembleRelease # Build release APK
./gradlew installDebug   # Install debug APK
```

## Testing on Emulator

### Features to Test

1. **Navigation**: Tab navigation, back button functionality
2. **Forms**: Input validation, form submission
3. **API Calls**: Network requests, error handling
4. **Responsiveness**: Different screen orientations, sizes
5. **Deep Links**: Payment redirect handling
6. **Android 15 Features**: Latest platform capabilities

### Debug Tools

1. **Chrome DevTools**: 
   - Chrome → chrome://inspect
   - Inspect web content running in WebView
2. **Android Logcat**: View native Android logs
3. **Network Inspector**: Monitor API calls

## Deployment

### Debug Build
```bash
cd android
./gradlew assembleDebug
# APK location: app/build/outputs/apk/debug/app-debug.apk
```

### Release Build
```bash
cd android
./gradlew assembleRelease
# APK location: app/build/outputs/apk/release/app-release.apk
```

## Support

If you encounter issues:

1. **Check Logs**: Android Studio Logcat
2. **Verify Dependencies**: Ensure all Capacitor plugins are properly configured
3. **Clean Build**: Remove build artifacts and rebuild
4. **Check SDK**: Verify Android SDK installation

## Success Indicators ✅

Your project is ready for Android Studio emulator when:

- ✅ `npm run build` completes successfully
- ✅ `npm run cap:sync` completes without errors
- ✅ Android Studio opens the project without Gradle errors
- ✅ Gradle sync completes successfully
- ✅ App builds and installs on emulator
- ✅ **Android 15 (API 35) compliance confirmed**

---

## 🎉 **Android 15 Compliance Status: FULLY COMPLIANT! ✅**

**Key Benefits:**
- **Future-Proof**: Meets Google Play requirements through August 2025
- **Enhanced Security**: Latest Android security features
- **Performance**: Optimized for Android 15 capabilities
- **User Experience**: Modern platform features and improvements

**Happy Coding! 🚀**

The Lidapay project is now fully prepared for Android Studio emulator development and testing with Android 15 compliance.
