# Android 15 Compliance Verification Script
Write-Host "🔍 Verifying Android 15 (API 35) Compliance..." -ForegroundColor Cyan

# Check variables.gradle
Write-Host "`n📱 Checking variables.gradle..." -ForegroundColor Yellow
$variablesContent = Get-Content "variables.gradle" -Raw
if ($variablesContent -match "compileSdkVersion = 35") {
    Write-Host "✅ compileSdkVersion = 35" -ForegroundColor Green
} else {
    Write-Host "❌ compileSdkVersion not set to 35" -ForegroundColor Red
}

if ($variablesContent -match "targetSdkVersion = 35") {
    Write-Host "✅ targetSdkVersion = 35" -ForegroundColor Green
} else {
    Write-Host "❌ targetSdkVersion not set to 35" -ForegroundColor Red
}

if ($variablesContent -match "minSdkVersion = 26") {
    Write-Host "✅ minSdkVersion = 26" -ForegroundColor Green
} else {
    Write-Host "❌ minSdkVersion not set to 26" -ForegroundColor Red
}

# Check app build.gradle
Write-Host "`n📱 Checking app/build.gradle..." -ForegroundColor Yellow
$appBuildContent = Get-Content "app/build.gradle" -Raw
if ($appBuildContent -match "compileSdk rootProject.ext.compileSdkVersion") {
    Write-Host "✅ Using centralized compileSdk" -ForegroundColor Green
} else {
    Write-Host "❌ Not using centralized compileSdk" -ForegroundColor Red
}

if ($appBuildContent -match "targetSdkVersion rootProject.ext.targetSdkVersion") {
    Write-Host "✅ Using centralized targetSdkVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Not using centralized targetSdkVersion" -ForegroundColor Red
}

if ($appBuildContent -match "JavaVersion.VERSION_17") {
    Write-Host "✅ Java 17 compatibility configured" -ForegroundColor Green
} else {
    Write-Host "❌ Java 17 compatibility not configured" -ForegroundColor Red
}

# Check project build.gradle
Write-Host "`n📱 Checking project build.gradle..." -ForegroundColor Yellow
$projectBuildContent = Get-Content "build.gradle" -Raw
if ($projectBuildContent -match "classpath 'com.android.tools.build:gradle:8.7.2'") {
    Write-Host "✅ Android Gradle Plugin 8.7.2" -ForegroundColor Green
} else {
    Write-Host "❌ Android Gradle Plugin not 8.7.2" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 COMPLIANCE SUMMARY:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if ($variablesContent -match "compileSdkVersion = 35" -and 
    $variablesContent -match "targetSdkVersion = 35" -and
    $appBuildContent -match "JavaVersion.VERSION_17") {
    Write-Host "🎉 FULLY COMPLIANT WITH ANDROID 15!" -ForegroundColor Green
    Write-Host "✅ Ready for Google Play Console submission" -ForegroundColor Green
    Write-Host "✅ Meets August 31, 2025 deadline" -ForegroundColor Green
} else {
    Write-Host "⚠️  NOT FULLY COMPLIANT" -ForegroundColor Red
    Write-Host "❌ Review configuration above" -ForegroundColor Red
}

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test build: ./gradlew assembleDebug" -ForegroundColor White
Write-Host "2. Test on Android 15 emulator" -ForegroundColor White
Write-Host "3. Build release: ./gradlew assembleRelease" -ForegroundColor White
Write-Host "4. Submit to Google Play Console" -ForegroundColor White

Write-Host "`n📚 For more details, see: ANDROID_15_COMPLIANCE_GUIDE.md" -ForegroundColor Cyan
