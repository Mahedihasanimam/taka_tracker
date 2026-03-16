# Setup & Installation Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/MoneyMaster.git
cd MoneyMaster
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Expo Packages

```bash
npx expo install expo-sqlite expo-crypto @react-native-async-storage/async-storage
npx expo install expo-linear-gradient expo-image-picker
npx expo install expo-file-system expo-sharing expo-print
npx expo install @react-native-community/datetimepicker
npx expo install @react-native-community/netinfo
```

### 4. Start Development Server

```bash
npx expo start
```

### 5. Run on Device/Emulator

- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app

## Project Configuration

### app.json

```json
{
  "expo": {
    "name": "TakaTrack",
    "slug": "MoneyMaster",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "moneymaster",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#e2136e"
    },
    "plugins": ["expo-router", "expo-sqlite"]
  }
}
```

## Building for Production

### Android APK

```bash
npx expo build:android -t apk
```

### Android App Bundle

```bash
npx expo build:android -t app-bundle
```

### iOS

```bash
npx expo build:ios
```

## Environment

No external APIs or environment variables needed - the app is fully offline!

## Troubleshooting

### Database Issues

```bash
# Clear app data on device
# Or delete database file
npx expo start --clear
```

### Metro Bundler Issues

```bash
npx expo start --clear
```

### Dependency Issues

```bash
rm -rf node_modules
rm package-lock.json
npm install
```
