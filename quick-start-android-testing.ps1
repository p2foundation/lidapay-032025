# Quick Start Android Testing Script for LidaPay
# This script prepares your app for Android Studio emulator testing

Write-Host "🚀 LidaPay Android Testing Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the LidaPay project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building Angular application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Angular build completed successfully!" -ForegroundColor Green

Write-Host "🔄 Syncing with Capacitor..." -ForegroundColor Yellow
npm run cap:sync

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed! Please check the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Capacitor sync completed successfully!" -ForegroundColor Green

Write-Host "🧹 Cleaning Android project..." -ForegroundColor Yellow
cd android
./gradlew clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Android clean failed! Please check the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Android project cleaned successfully!" -ForegroundColor Green

cd ..

Write-Host "🚪 Opening project in Android Studio..." -ForegroundColor Yellow
npm run cap:open:android

Write-Host ""
Write-Host "🎉 Setup Complete! Your project is now ready for testing." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait for Android Studio to open the project" -ForegroundColor White
Write-Host "2. Let Gradle sync complete" -ForegroundColor White
Write-Host "3. Create/start an Android emulator (API 35 recommended)" -ForegroundColor White
Write-Host "4. Build and run the app (Shift+F10)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Use the testing checklist: ANDROID_EMULATOR_TESTING_CHECKLIST.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy Testing! 🚀" -ForegroundColor Green
