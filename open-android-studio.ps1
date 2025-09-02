# PowerShell script to open Android Studio with the correct project
# Run this script to quickly open your project in Android Studio

param(
    [string]$AndroidStudioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
)

Write-Host "🚀 Opening Android Studio for LidaPay project..." -ForegroundColor Green

# Check if Android Studio exists at the default path
if (Test-Path $AndroidStudioPath) {
    Write-Host "✅ Android Studio found at: $AndroidStudioPath" -ForegroundColor Green
    
    # Get the current project path
    $ProjectPath = Split-Path -Parent $PSScriptRoot
    $AndroidProjectPath = Join-Path $ProjectPath "android"
    
    Write-Host "📁 Project path: $ProjectPath" -ForegroundColor Cyan
    Write-Host "📱 Android project path: $AndroidProjectPath" -ForegroundColor Cyan
    
    # Check if android folder exists
    if (Test-Path $AndroidProjectPath) {
        Write-Host "✅ Android project folder found!" -ForegroundColor Green
        
        # Open Android Studio with the project
        Write-Host "🚀 Launching Android Studio..." -ForegroundColor Yellow
        Start-Process -FilePath $AndroidStudioPath -ArgumentList $AndroidProjectPath
        
        Write-Host "✅ Android Studio should now be opening with your project!" -ForegroundColor Green
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Wait for project sync to complete" -ForegroundColor White
        Write-Host "   2. Create an Android Virtual Device (AVD) if needed" -ForegroundColor White
        Write-Host "   3. Click the Run button (▶️) to test your app" -ForegroundColor White
    } else {
        Write-Host "❌ Android project folder not found at: $AndroidProjectPath" -ForegroundColor Red
        Write-Host "💡 Make sure you're running this script from the project root directory" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Android Studio not found at: $AndroidStudioPath" -ForegroundColor Red
    Write-Host "💡 Please update the AndroidStudioPath parameter or install Android Studio" -ForegroundColor Yellow
    Write-Host "📥 Download from: https://developer.android.com/studio" -ForegroundColor Cyan
    
    # Try to find Android Studio in common locations
    $CommonPaths = @(
        "C:\Program Files\Android\Android Studio\bin\studio64.exe",
        "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe",
        "$env:LOCALAPPDATA\Android\Sdk\Android Studio\bin\studio64.exe"
    )
    
    Write-Host "🔍 Searching for Android Studio in common locations..." -ForegroundColor Yellow
    foreach ($path in $CommonPaths) {
        if (Test-Path $path) {
            Write-Host "✅ Found Android Studio at: $path" -ForegroundColor Green
            Write-Host "💡 Update the script with this path or run manually" -ForegroundColor Yellow
            break
        }
    }
}

Write-Host ""
Write-Host "📚 For detailed instructions, see: ANDROID_STUDIO_GOOGLE_PLAY_SETUP.md" -ForegroundColor Cyan
Write-Host "🎯 Ready to test and build your app for Google Play Store!" -ForegroundColor Green
