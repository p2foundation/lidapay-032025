#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Android Studio Testing Setup...\n');

// Check if we're in the right directory
if (!fs.existsSync('android')) {
    console.error('❌ Android directory not found. Please run this from the project root.');
    process.exit(1);
}

// Check key files
const requiredFiles = [
    'android/app/build.gradle',
    'android/build.gradle',
    'android/gradle.properties',
    'android/variables.gradle',
    'capacitor.config.ts',
    'package.json'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

// Check Android SDK path
console.log('\n📱 Checking Android SDK configuration...');
try {
    const localProperties = fs.readFileSync('android/local.properties', 'utf8');
    const sdkDir = localProperties.match(/sdk\.dir=(.+)/);
    if (sdkDir) {
        console.log(`✅ Android SDK found at: ${sdkDir[1]}`);
    } else {
        console.log('⚠️  Android SDK path not found in local.properties');
    }
} catch (error) {
    console.log('❌ Could not read local.properties');
}

// Check Gradle wrapper
console.log('\n🔧 Checking Gradle setup...');
if (fs.existsSync('android/gradlew') || fs.existsSync('android/gradlew.bat')) {
    console.log('✅ Gradle wrapper found');
} else {
    console.log('❌ Gradle wrapper not found');
}

// Check Capacitor sync
console.log('\n🔄 Checking Capacitor sync status...');
try {
    const wwwDir = fs.readdirSync('www');
    const androidAssetsDir = fs.readdirSync('android/app/src/main/assets');
    
    if (wwwDir.length > 0 && androidAssetsDir.length > 0) {
        console.log('✅ Web assets synced to Android');
    } else {
        console.log('⚠️  Web assets may not be synced');
    }
} catch (error) {
    console.log('❌ Could not verify sync status');
}

// Check package.json scripts
console.log('\n📜 Checking package.json scripts...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const androidScripts = [
        'cap:sync',
        'cap:open:android',
        'test:android:unit',
        'test:android:instrumented'
    ];
    
    androidScripts.forEach(script => {
        if (packageJson.scripts[script]) {
            console.log(`✅ ${script}`);
        } else {
            console.log(`❌ ${script} - MISSING`);
        }
    });
} catch (error) {
    console.log('❌ Could not read package.json');
}

console.log('\n🎯 Setup Verification Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Run: npm run prepare:android');
console.log('2. Run: npm run cap:open:android');
console.log('3. In Android Studio, sync project with Gradle');
console.log('4. Run tests from the test folders');
console.log('\n📚 See ANDROID_STUDIO_TESTING_GUIDE.md for detailed instructions');
