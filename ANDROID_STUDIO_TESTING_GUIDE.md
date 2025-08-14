# Android Studio Testing Guide for Lidapay

## Prerequisites

Before testing in Android Studio, ensure you have:

1. **Android Studio** installed (latest stable version recommended)
2. **Android SDK** with API level 26+ (minimum) and API level 35 (target)
3. **Java Development Kit (JDK)** 17 or higher
4. **Gradle** 8.7.2 (already configured in project)

## Project Setup Status ✅

Your project is already properly configured for Android Studio testing:

- ✅ Capacitor Android platform added
- ✅ Gradle build configuration ready
- ✅ Testing dependencies configured
- ✅ Android project structure complete
- ✅ Build successful and synced

## Testing Configuration

### Unit Tests (JUnit)
- **Location**: `android/app/src/test/`
- **Framework**: JUnit 4.13.2
- **Configuration**: Already set up in `build.gradle`

### Instrumented Tests (Espresso)
- **Location**: `android/app/src/androidTest/`
- **Framework**: Espresso 3.6.1
- **Configuration**: Already set up in `build.gradle`

## Running Tests in Android Studio

### 1. Open Project
```bash
npm run cap:open:android
```
This will open the Android project in Android Studio.

### 2. Sync Project
- In Android Studio, click "Sync Project with Gradle Files" (elephant icon)
- Wait for sync to complete

### 3. Run Unit Tests
- Right-click on `android/app/src/test/` folder
- Select "Run Tests in 'app'"
- Or use: `./gradlew test` from terminal

### 4. Run Instrumented Tests
- Connect Android device or start emulator
- Right-click on `android/app/src/androidTest/` folder
- Select "Run Tests in 'app'"
- Or use: `./gradlew connectedAndroidTest` from terminal

### 5. Run All Tests
```bash
./gradlew test connectedAndroidTest
```

## Testing Commands

### From Project Root
```bash
# Build and sync
npm run build
npm run cap:sync

# Open in Android Studio
npm run cap:open:android

# Run Android tests (if you have device/emulator)
npm run cap:run:android
```

### From Android Directory
```bash
cd android

# Clean build
./gradlew clean

# Build project
./gradlew build

# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Run all tests
./gradlew test connectedAndroidTest

# Generate test report
./gradlew testDebugUnitTest
```

## Test Report Location
- **Unit Tests**: `android/app/build/reports/tests/`
- **Instrumented Tests**: `android/app/build/reports/androidTests/`

## Common Testing Scenarios

### 1. UI Testing with Espresso
- Test user interactions
- Verify UI state changes
- Test navigation flows

### 2. Unit Testing
- Test business logic
- Test data processing
- Test utility functions

### 3. Integration Testing
- Test Capacitor plugins
- Test native functionality
- Test app lifecycle

## Troubleshooting

### Build Issues
1. Clean project: `./gradlew clean`
2. Sync Gradle files in Android Studio
3. Check SDK versions in `variables.gradle`

### Test Issues
1. Ensure device/emulator is connected for instrumented tests
2. Check test dependencies in `build.gradle`
3. Verify test runner configuration

### Sync Issues
1. Run `npm run cap:sync` from project root
2. Check Capacitor configuration
3. Verify plugin versions

## Performance Testing

### Memory Profiling
- Use Android Studio Profiler
- Monitor memory usage during tests
- Check for memory leaks

### Performance Monitoring
- Test app startup time
- Monitor UI responsiveness
- Check battery usage

## Security Testing

### Network Security
- Test HTTPS connections
- Verify certificate pinning
- Test API security

### Data Security
- Test local storage encryption
- Verify sensitive data handling
- Test authentication flows

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
- name: Run Android Tests
  run: |
    cd android
    ./gradlew test
    ./gradlew connectedAndroidTest
```

### Local CI
```bash
# Add to package.json scripts
"test:android": "cd android && ./gradlew test connectedAndroidTest"
```

## Next Steps

1. **Open Android Studio** with `npm run cap:open:android`
2. **Sync project** with Gradle
3. **Run unit tests** to verify setup
4. **Connect device/emulator** for instrumented tests
5. **Run full test suite** to ensure everything works

## Support

If you encounter issues:
1. Check Android Studio logs
2. Verify Gradle configuration
3. Ensure all dependencies are properly installed
4. Check Capacitor documentation for plugin-specific issues

---

**Note**: Your project is already configured and ready for testing. Simply open it in Android Studio and start running tests!
