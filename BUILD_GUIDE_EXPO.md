# Expo Android Build Quick Reference

## 🚀 Quick Commands

### Build Production AAB (for Google Play Store):
```powershell
cd "d:\Coding\App Development\CSESA APPS\argueMind"
eas build -p android --profile production
```

### Build Preview APK (for testing):
```powershell
eas build -p android --profile preview
```

### Check Build Status:
```powershell
eas build:list
```

### Download Latest Build:
```powershell
eas build:download
```

---

## 🔧 First Time Setup

### 1. Install EAS CLI:
```powershell
npm install -g eas-cli
```

### 2. Login to Expo:
```powershell
eas login
```

### 3. Configure EAS:
```powershell
eas build:configure
```

---

## 📋 Using the Build Script

### Run the automated script:
```powershell
.\build-android.ps1
```

This script will:
- ✅ Check if EAS CLI is installed
- ✅ Install dependencies
- ✅ Configure EAS if needed
- ✅ Prompt you to choose production or preview build
- ✅ Submit build to Expo servers

---

## 📊 Build Process Timeline

1. **Submit build** (1 minute)
   - Code uploaded to Expo servers
   - Build queued

2. **Build process** (10-20 minutes)
   - Dependencies installed
   - Native code compiled
   - AAB/APK generated

3. **Download** (1 minute)
   - Download link provided
   - File ready for Play Store

---

## 📦 Build Profiles (eas.json)

### Production:
- Builds `.aab` file (App Bundle)
- Optimized for Google Play Store
- Smaller download size for users
- Signed automatically by Expo

### Preview:
- Builds `.apk` file
- For internal testing
- Can install directly on devices
- Good for QA testing

### Development:
- Includes development tools
- Hot reload enabled
- Larger file size
- Not for production

---

## 🔐 Code Signing

**Good news:** Expo handles code signing automatically!

- Expo generates and manages keystore
- No need to manually create keystore
- Keys stored securely on Expo servers
- You can download keystore later if needed

### To download keystore:
```powershell
eas credentials
```

---

## 📱 Google Play Store Upload

### 1. Download AAB:
After build completes, download from:
- Email link
- Expo dashboard: https://expo.dev
- Or run: `eas build:download`

### 2. Upload to Play Console:
1. Go to [Google Play Console](https://play.google.com/console)
2. Select "ArgueMind" app (or create new app)
3. Go to "Production" → "Create new release"
4. Upload the `.aab` file
5. Fill in release notes
6. Submit for review

---

## 🐛 Troubleshooting

### "EAS CLI not found"
```powershell
npm install -g eas-cli
```

### "Not logged in"
```powershell
eas login
```

### "Build failed - Firebase error"
Check `firebase/config.js` has correct credentials

### "Package name conflict"
Update `android.package` in `app.json` to unique name

### "Version code already exists"
Increment `android.versionCode` in `app.json`

---

## 📈 Version Management

Every new build for Play Store needs:

### Update app.json:
```json
{
  "expo": {
    "version": "1.0.1",  // ← Increment this
    "android": {
      "versionCode": 2   // ← Increment this
    }
  }
}
```

**Version naming:**
- `1.0.0` → First release
- `1.0.1` → Bug fixes
- `1.1.0` → New features
- `2.0.0` → Major changes

**Version code:**
- Must be integer
- Must increase with each release
- Cannot skip numbers
- Cannot go backwards

---

## 💰 Pricing

### Expo EAS Build:
- **Free tier:** 30 builds/month
- **Production tier:** $29/month (unlimited builds)
- **Enterprise:** Custom pricing

For your event (1-2 builds), **free tier is perfect!**

---

## 🎯 Pre-Build Checklist

Before running build:

- [ ] All code committed to git (optional but recommended)
- [ ] Firebase config is correct
- [ ] `app.json` has unique package name
- [ ] Version numbers updated
- [ ] Tested app on physical device
- [ ] All assets (icons, splash) are in place
- [ ] No console errors in debug mode

---

## 📞 Support

**EAS Build Docs:**  
https://docs.expo.dev/build/introduction/

**Expo Discord:**  
https://chat.expo.dev/

**Google Play Console:**  
https://play.google.com/console

---

## 🎉 Quick Start (TL;DR)

```powershell
# One-time setup
npm install -g eas-cli
eas login

# Build AAB
cd "d:\Coding\App Development\CSESA APPS\argueMind"
eas build -p android --profile production

# Wait 10-20 minutes, then download AAB and upload to Play Store!
```

---

**Last Updated:** November 2025  
**App:** ArgueMind v1.0.0  
**Status:** Ready to build! 🚀
