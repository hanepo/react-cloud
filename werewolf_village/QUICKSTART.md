# 🚀 Quick Start Guide - Werewolf Village

Get up and running with Werewolf Village in under 5 minutes!

## Prerequisites Check

Before you begin, make sure you have Flutter installed:

```bash
flutter doctor
```

If you see any issues, follow the Flutter installation guide: https://flutter.dev/docs/get-started/install

## Installation Steps

### 1. Navigate to the Project
```bash
cd werewolf_village
```

### 2. Get Dependencies
```bash
flutter pub get
```

### 3. Check Connected Devices
```bash
flutter devices
```

Make sure you have either:
- An Android emulator running
- An iOS simulator running
- A physical device connected

### 4. Run the App
```bash
flutter run
```

That's it! The app should launch on your device.

## First Game Setup

1. **Enter Player Names**
   - Use the slider to select 3-10 players
   - Enter a name for each player
   - Tap "Start Game"

2. **Play Through One Night/Day Cycle**
   - **Night**: Werewolves eliminate, Seer reveals
   - **Day**: Discuss and vote
   - Continue until a team wins!

## Troubleshooting

### "No devices found"
- Make sure you have an emulator/simulator running
- Or connect a physical device with USB debugging enabled

### "Pub get failed"
```bash
flutter clean
flutter pub get
```

### "Build failed"
```bash
flutter clean
flutter pub cache repair
flutter pub get
```

### Hot reload not working
Press `r` in the terminal where `flutter run` is active, or `R` for hot restart.

## Development Commands

```bash
# Run in debug mode
flutter run

# Run in release mode (better performance)
flutter run --release

# Build APK for Android
flutter build apk

# Build for iOS (macOS only)
flutter build ios

# Run tests
flutter test

# Analyze code
flutter analyze
```

## Need Help?

Check the full [README.md](README.md) for:
- Detailed game rules
- Project structure
- Contributing guidelines
- Feature roadmap

---

**Have fun playing! 🐺🧑‍🌾🔮**
