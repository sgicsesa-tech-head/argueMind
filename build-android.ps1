# ArgueMind Android Build Script (Expo)
# Builds AAB using Expo Application Services (EAS)

Write-Host "🚀 ArgueMind Expo Android Build Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if app.json exists (Expo project)
if (-not (Test-Path "app.json")) {
    Write-Host "❌ Error: app.json not found. This doesn't appear to be an Expo project." -ForegroundColor Red
    exit 1
}

Write-Host "📱 Detected Expo React Native project" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if EAS CLI is installed
Write-Host "� Step 1/4: Checking EAS CLI..." -ForegroundColor Cyan
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "   EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ EAS CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "   ✅ EAS CLI already installed" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "� Step 2/4: Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# Step 3: Configure EAS (if not already configured)
Write-Host ""
Write-Host "⚙️  Step 3/4: Checking EAS configuration..." -ForegroundColor Cyan
if (-not (Test-Path "eas.json")) {
    Write-Host "   eas.json not found. Running eas build:configure..." -ForegroundColor Yellow
    eas build:configure
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to configure EAS" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ EAS already configured (eas.json found)" -ForegroundColor Green
}

# Step 4: Build AAB
Write-Host ""
Write-Host "🔨 Step 4/4: Building production AAB..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   This will:" -ForegroundColor Yellow
Write-Host "   • Upload your code to Expo servers" -ForegroundColor White
Write-Host "   • Build the AAB in the cloud" -ForegroundColor White
Write-Host "   • Provide a download link when complete" -ForegroundColor White
Write-Host ""
Write-Host "   Note: You'll need to login to your Expo account if not already logged in." -ForegroundColor Yellow
Write-Host ""

# Prompt user for build type
Write-Host "   Select build type:" -ForegroundColor Cyan
Write-Host "   [1] Production (for Google Play Store) - recommended" -ForegroundColor White
Write-Host "   [2] Preview (for internal testing - APK)" -ForegroundColor White
Write-Host ""
$buildType = Read-Host "   Enter choice (1 or 2)"

if ($buildType -eq "2") {
    Write-Host ""
    Write-Host "   Building preview APK..." -ForegroundColor Cyan
    eas build --platform android --profile preview
} else {
    Write-Host ""
    Write-Host "   Building production AAB..." -ForegroundColor Cyan
    eas build --platform android --profile production
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   • Not logged in: Run 'eas login' first" -ForegroundColor White
    Write-Host "   • Firebase config issues: Check firebase/config.js" -ForegroundColor White
    Write-Host "   • Missing app.json settings: Update app.json with package name" -ForegroundColor White
    exit 1
}

# Success!
Write-Host ""
Write-Host "✅ Build submitted successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Your build is being processed on Expo servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 To check build status and download:" -ForegroundColor Yellow
Write-Host "   • Visit: https://expo.dev/accounts/[your-account]/projects/arguemind/builds" -ForegroundColor White
Write-Host "   • Or run: eas build:list" -ForegroundColor White
Write-Host ""
Write-Host "📧 You'll receive an email when the build is complete" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Wait for build completion (~10-20 minutes)" -ForegroundColor White
Write-Host "   2. Download the AAB file from the link provided" -ForegroundColor White
Write-Host "   3. Upload to Google Play Console for testing/release" -ForegroundColor White
Write-Host ""
