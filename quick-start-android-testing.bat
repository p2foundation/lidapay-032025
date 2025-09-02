@echo off
REM Quick Start Android Testing Script for LidaPay
REM This script prepares your app for Android Studio emulator testing

echo.
echo 🚀 LidaPay Android Testing Setup
echo =================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the LidaPay project root directory
    pause
    exit /b 1
)

echo 📦 Building Angular application...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed! Please fix the errors and try again.
    pause
    exit /b 1
)

echo ✅ Angular build completed successfully!

echo 🔄 Syncing with Capacitor...
call npm run cap:sync

if %ERRORLEVEL% neq 0 (
    echo ❌ Capacitor sync failed! Please check the errors and try again.
    pause
    exit /b 1
)

echo ✅ Capacitor sync completed successfully!

echo 🧹 Cleaning Android project...
cd android
call gradlew clean

if %ERRORLEVEL% neq 0 (
    echo ❌ Android clean failed! Please check the errors and try again.
    pause
    exit /b 1
)

echo ✅ Android project cleaned successfully!

cd ..

echo 🚪 Opening project in Android Studio...
call npm run cap:open:android

echo.
echo 🎉 Setup Complete! Your project is now ready for testing.
echo.
echo 📱 Next Steps:
echo 1. Wait for Android Studio to open the project
echo 2. Let Gradle sync complete
echo 3. Create/start an Android emulator (API 35 recommended)
echo 4. Build and run the app (Shift+F10)
echo.
echo 📋 Use the testing checklist: ANDROID_EMULATOR_TESTING_CHECKLIST.md
echo.
echo Happy Testing! 🚀
pause
