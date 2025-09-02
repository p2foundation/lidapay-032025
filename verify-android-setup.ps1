# Android Project Setup Verification Script
# This script checks if your Android project is properly configured

Write-Host "🔍 Verifying Android Project Setup..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$ProjectPath = $PSScriptRoot
$AndroidPath = Join-Path $ProjectPath "android"
$AppPath = Join-Path $AndroidPath "app"

# Check project structure
Write-Host "📁 Checking project structure..." -ForegroundColor Yellow

$checks = @(
    @{Path = $AndroidPath; Name = "Android folder"; Required = $true},
    @{Path = $AppPath; Name = "App folder"; Required = $true},
    @{Path = Join-Path $AppPath "build.gradle"; Name = "App build.gradle"; Required = $true},
    @{Path = Join-Path $AndroidPath "build.gradle"; Name = "Project build.gradle"; Required = $true},
    @{Path = Join-Path $AndroidPath "gradle.properties"; Name = "Gradle properties"; Required = $true},
    @{Path = Join-Path $AppPath "src/main/AndroidManifest.xml"; Name = "AndroidManifest.xml"; Required = $true},
    @{Path = Join-Path $AppPath "src/main/java"; Name = "Java source folder"; Required = $true},
    @{Path = Join-Path $AppPath "src/main/res"; Name = "Resources folder"; Required = $true}
)

$allGood = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "✅ $($check.Name): Found" -ForegroundColor Green
    } else {
        if ($check.Required) {
            Write-Host "❌ $($check.Name): Missing (REQUIRED)" -ForegroundColor Red
            $allGood = $false
        } else {
            Write-Host "⚠️  $($check.Name): Missing (Optional)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🔧 Checking build configuration..." -ForegroundColor Yellow

# Check build.gradle files
if (Test-Path (Join-Path $AppPath "build.gradle")) {
    $buildGradle = Get-Content (Join-Path $AppPath "build.gradle") -Raw
    
    # Check for key configurations
    $checks = @(
        @{Pattern = "applicationId"; Name = "Application ID"; Required = $true},
        @{Pattern = "compileSdk"; Name = "Compile SDK"; Required = $true},
        @{Pattern = "targetSdkVersion"; Name = "Target SDK"; Required = $true},
        @{Pattern = "minSdkVersion"; Name = "Min SDK"; Required = $true},
        @{Pattern = "versionCode"; Name = "Version Code"; Required = $true},
        @{Pattern = "versionName"; Name = "Version Name"; Required = $true}
    )
    
    foreach ($check in $checks) {
        if ($buildGradle -match $check.Pattern) {
            Write-Host "✅ $($check.Name): Configured" -ForegroundColor Green
        } else {
            if ($check.Required) {
                Write-Host "❌ $($check.Name): Not configured (REQUIRED)" -ForegroundColor Red
                $allGood = $false
            } else {
                Write-Host "⚠️  $($check.Name): Not configured (Optional)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "📱 Checking Capacitor configuration..." -ForegroundColor Yellow

# Check Capacitor config
if (Test-Path (Join-Path $ProjectPath "capacitor.config.ts")) {
    $capacitorConfig = Get-Content (Join-Path $ProjectPath "capacitor.config.ts") -Raw
    
    if ($capacitorConfig -match "appId") {
        Write-Host "✅ Capacitor appId: Configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Capacitor appId: Not configured" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($capacitorConfig -match "appName") {
        Write-Host "✅ Capacitor appName: Configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Capacitor appName: Not configured" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "❌ Capacitor config: Not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "🔑 Checking keystore files..." -ForegroundColor Yellow

# Check keystore files
$keystoreFiles = @(
    Join-Path $ProjectPath "lidapay.jks",
    Join-Path $ProjectPath "lidapay-032025-old.jks"
)

foreach ($keystore in $keystoreFiles) {
    if (Test-Path $keystore) {
        Write-Host "✅ Keystore: $(Split-Path $keystore -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Keystore: $(Split-Path $keystore -Leaf) - Not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "🎉 All required configurations are present!" -ForegroundColor Green
    Write-Host "✅ Your project is ready for Android Studio" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Run: .\open-android-studio.ps1" -ForegroundColor White
    Write-Host "   2. Or manually open Android Studio and navigate to: $AndroidPath" -ForegroundColor White
} else {
    Write-Host "⚠️  Some required configurations are missing" -ForegroundColor Yellow
    Write-Host "🔧 Please fix the issues above before opening Android Studio" -ForegroundColor Red
}

Write-Host ""
Write-Host "📚 For detailed setup instructions, see: ANDROID_STUDIO_GOOGLE_PLAY_SETUP.md" -ForegroundColor Cyan
