@echo off
chcp 65001 >nul
echo 🚀 Opening Android Studio for LidaPay project...

set "ANDROID_STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe"
set "PROJECT_PATH=%~dp0"
set "ANDROID_PROJECT_PATH=%PROJECT_PATH%android"

echo 📁 Project path: %PROJECT_PATH%
echo 📱 Android project path: %ANDROID_PROJECT_PATH%

if exist "%ANDROID_STUDIO_PATH%" (
    echo ✅ Android Studio found!
    
    if exist "%ANDROID_PROJECT_PATH%" (
        echo ✅ Android project folder found!
        echo 🚀 Launching Android Studio...
        
        start "" "%ANDROID_STUDIO_PATH%" "%ANDROID_PROJECT_PATH%"
        
        echo ✅ Android Studio should now be opening with your project!
        echo.
        echo 📋 Next steps:
        echo    1. Wait for project sync to complete
        echo    2. Create an Android Virtual Device (AVD) if needed
        echo    3. Click the Run button (▶️) to test your app
    ) else (
        echo ❌ Android project folder not found!
        echo 💡 Make sure you're running this script from the project root directory
    )
) else (
    echo ❌ Android Studio not found at: %ANDROID_STUDIO_PATH%
    echo 💡 Please install Android Studio or update the path in this script
    echo 📥 Download from: https://developer.android.com/studio
    
    echo.
    echo 🔍 Checking common locations...
    
    if exist "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe" (
        echo ✅ Found at: C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe
        echo 💡 Update the script with this path or run manually
    )
    
    if exist "%LOCALAPPDATA%\Android\Sdk\Android Studio\bin\studio64.exe" (
        echo ✅ Found at: %LOCALAPPDATA%\Android\Sdk\Android Studio\bin\studio64.exe
        echo 💡 Update the script with this path or run manually
    )
)

echo.
echo 📚 For detailed instructions, see: ANDROID_STUDIO_GOOGLE_PLAY_SETUP.md
echo 🎯 Ready to test and build your app for Google Play Store!
pause
