@echo off
echo ========================================
echo    Lidapay Android Testing Quick Start
echo ========================================
echo.

echo [1/4] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please check errors above.
    pause
    exit /b 1
)
echo ✅ Build completed successfully!

echo.
echo [2/4] Syncing with Capacitor...
call npm run cap:sync
if %errorlevel% neq 0 (
    echo ❌ Sync failed! Please check errors above.
    pause
    exit /b 1
)
echo ✅ Sync completed successfully!

echo.
echo [3/4] Opening Android Studio...
call npm run cap:open:android
if %errorlevel% neq 0 (
    echo ❌ Failed to open Android Studio!
    pause
    exit /b 1
)
echo ✅ Android Studio opened!

echo.
echo ========================================
echo 🎯 Setup Complete!
echo ========================================
echo.
echo 📋 Next Steps in Android Studio:
echo 1. Wait for project to load
echo 2. Click "Sync Project with Gradle Files" (elephant icon)
echo 3. Wait for sync to complete
echo 4. Right-click on test folders to run tests:
echo    - android/app/src/test/ (Unit Tests)
echo    - android/app/src/androidTest/ (Instrumented Tests)
echo.
echo 🚀 Quick Test Commands (from project root):
echo - npm run test:android:unit
echo - npm run test:android:instrumented
echo - npm run test:android:all
echo.
echo 📚 See ANDROID_STUDIO_TESTING_GUIDE.md for details
echo.
pause
