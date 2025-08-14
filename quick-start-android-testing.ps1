# Lidapay Android Testing Quick Start Script
# Run this script from PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Lidapay Android Testing Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Building project..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed! Please check errors above." -ForegroundColor Red
        Read-Host "Press Enter to continue..."
        exit 1
    }
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed with error: $_" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "[2/4] Syncing with Capacitor..." -ForegroundColor Yellow
try {
    npm run cap:sync
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Sync failed! Please check errors above." -ForegroundColor Red
        Read-Host "Press Enter to continue..."
        exit 1
    }
    Write-Host "✅ Sync completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Sync failed with error: $_" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "[3/4] Opening Android Studio..." -ForegroundColor Yellow
try {
    npm run cap:open:android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to open Android Studio!" -ForegroundColor Red
        Read-Host "Press Enter to continue..."
        exit 1
    }
    Write-Host "✅ Android Studio opened!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to open Android Studio with error: $_" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎯 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps in Android Studio:" -ForegroundColor Yellow
Write-Host "1. Wait for project to load"
Write-Host "2. Click 'Sync Project with Gradle Files' (elephant icon)"
Write-Host "3. Wait for sync to complete"
Write-Host "4. Right-click on test folders to run tests:"
Write-Host "   - android/app/src/test/ (Unit Tests)" -ForegroundColor Cyan
Write-Host "   - android/app/src/androidTest/ (Instrumented Tests)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Quick Test Commands (from project root):" -ForegroundColor Yellow
Write-Host "- npm run test:android:unit" -ForegroundColor Cyan
Write-Host "- npm run test:android:instrumented" -ForegroundColor Cyan
Write-Host "- npm run test:android:all" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 See ANDROID_STUDIO_TESTING_GUIDE.md for details" -ForegroundColor Blue
Write-Host ""
Read-Host "Press Enter to continue..."
