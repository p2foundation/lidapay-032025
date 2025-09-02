# Android Studio Setup & Google Play Store Release Guide

## 🚀 Quick Start for Android Studio

### 1. Open Android Studio
- Launch Android Studio
- Select "Open an existing project"
- Navigate to: `[your-workspace]/android`
- Click "OK" and wait for project sync

### 2. Project Configuration Status ✅
Your project is already configured with:
- **App ID**: `com.advansistechnologies.lidapay`
- **Version**: `1.0.1` (Code: 7)
- **Target SDK**: Android 15 (API 35)
- **Min SDK**: Android 8.0 (API 26)
- **Java Version**: 17 (for main build), 21 (for Capacitor)

## 📱 Testing in Android Studio

### Option A: Use Android Emulator
1. **Create Virtual Device**:
   - Tools → AVD Manager
   - Create Virtual Device
   - Select: **Pixel 8** or **Pixel 8 Pro**
   - System Image: **API 35** (Android 15) or **API 34** (Android 14)
   - RAM: 4GB+, Internal Storage: 8GB+

2. **Run the App**:
   - Click the green "Run" button (▶️)
   - Select your emulator
   - Wait for build and installation

### Option B: Use Physical Device
1. **Enable Developer Options** on your Android device
2. **Enable USB Debugging**
3. **Connect via USB**
4. **Allow USB Debugging** when prompted
5. **Run the app** - your device will appear in the device list

## 🔧 Pre-Testing Checklist

### Build Configuration ✅
- [x] Gradle sync completed
- [x] All dependencies resolved
- [x] Capacitor plugins properly configured
- [x] ProGuard rules configured for release builds

### App Permissions ✅
- [x] Internet access
- [x] Bluetooth (if needed)
- [x] File provider configured
- [x] Deep linking configured

## 🏗️ Building for Google Play Store

### 1. Generate Release APK/Bundle
```bash
# In Android Studio:
Build → Generate Signed Bundle/APK
```

### 2. Keystore Configuration
Your project already has keystore files:
- `lidapay.jks` (main keystore)
- `lidapay-032025-old.jks` (backup)

**Important**: Keep these keystore files secure! You'll need them for all future updates.

### 3. Build Variants
- **Debug**: For testing (unoptimized)
- **Release**: For Play Store (optimized with ProGuard)

### 4. Release Build Settings
```gradle
// Already configured in build.gradle:
release {
    minifyEnabled true          // Code optimization
    shrinkResources true        // Resource optimization
    proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
}
```

## 📋 Google Play Store Requirements

### App Bundle (Recommended)
- File extension: `.aab`
- Smaller download size
- Better optimization
- Required for new apps

### APK (Alternative)
- File extension: `.apk`
- Larger size
- Less optimized
- Legacy support

### Store Listing Requirements
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (minimum 2)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] App signing by Google Play

## 🚨 Common Issues & Solutions

### Build Errors
1. **Gradle sync failed**: 
   - File → Invalidate Caches / Restart
   - Check internet connection for dependencies

2. **SDK not found**:
   - Tools → SDK Manager
   - Install required SDK versions

3. **Permission denied**:
   - Check AndroidManifest.xml permissions
   - Verify runtime permissions in code

### Testing Issues
1. **App crashes on launch**:
   - Check logcat for error messages
   - Verify Capacitor plugin configurations

2. **Deep links not working**:
   - Test with adb: `adb shell am start -W -a android.intent.action.VIEW -d "lidapay://redirect-url" com.advansistechnologies.lidapay`

## 📱 Testing Checklist

### Basic Functionality
- [ ] App launches without crashes
- [ ] Splash screen displays correctly
- [ ] Navigation works properly
- [ ] All pages load correctly
- [ ] Deep links function properly

### Performance
- [ ] App responds quickly to user input
- [ ] No memory leaks (check with Android Studio Profiler)
- [ ] Battery usage is reasonable
- [ ] App works in background/foreground transitions

### Device Compatibility
- [ ] Test on different screen sizes
- [ ] Test in different orientations
- [ ] Test with different Android versions
- [ ] Test with different network conditions

## 🎯 Next Steps

1. **Open Android Studio** and load the project
2. **Run on emulator/device** to test functionality
3. **Fix any issues** found during testing
4. **Generate release build** when ready
5. **Upload to Google Play Console**

## 📞 Support

If you encounter issues:
1. Check the logcat output in Android Studio
2. Review the Capacitor documentation
3. Check Android Studio's built-in help system

---

**Ready to test! 🚀**

Open Android Studio and navigate to the `android` folder in your project. The project should sync automatically and be ready for testing and building.
