# 🐺 Werewolf Village - Flutter Mobile Game

A beautifully designed multiplayer social deduction game built with Flutter. Players work together to identify and eliminate werewolves before they take over the village!

## 🎮 Game Overview

**Werewolf Village** is a digital adaptation of the classic party game "Werewolf" (also known as "Mafia"). Players are secretly assigned roles and must use logic, deduction, and social skills to achieve their team's objective.

### Game Roles

- **🧑‍🌾 Villager**: Vote during the day to eliminate suspected werewolves
- **🐺 Werewolf**: Eliminate villagers at night without being discovered
- **🔮 Seer**: Use magical powers to reveal one player's role each night

### Win Conditions

- **Villagers Win**: Eliminate all werewolves
- **Werewolves Win**: Equal or outnumber the villagers

## ✨ Features

### Core Gameplay
- ✅ 3-10 player support (local pass-and-play multiplayer)
- ✅ Random role assignment with balanced distribution
- ✅ Two distinct game phases:
  - **🌙 Night Phase**: Werewolves hunt, Seer investigates
  - **☀️ Day Phase**: Players discuss and vote
- ✅ Complete win condition checking
- ✅ Player elimination mechanics

### UI/UX
- ✅ Smooth phase transition animations
- ✅ Beautiful gradient backgrounds
- ✅ Character avatars for all players
- ✅ Intuitive voting system
- ✅ Comprehensive game over screen showing all roles
- ✅ Material Design 3 components
- ✅ Responsive layout

### Technical Features
- ✅ State management with Provider
- ✅ Clean architecture (Models, Services, Widgets, Screens)
- ✅ Smooth animations with flutter_animate
- ✅ Portrait-only orientation lock
- ✅ Cross-platform support (iOS & Android)

## 📱 Screenshots

### Lobby Screen
Configure player count and names before starting the game.

### Night Phase
Werewolves secretly choose their victim, while the Seer reveals hidden roles.

### Day Phase
Players discuss suspicions and vote to eliminate werewolves.

### Game Over
View all player roles and see which team won!

## 🚀 Getting Started

### Prerequisites

- **Flutter SDK**: 3.0.0 or higher
- **Dart**: 3.0.0 or higher
- **Android Studio** / **Xcode** (for running on emulators/simulators)
- A physical device or emulator

### Installation

1. **Clone the repository**:
   ```bash
   cd werewolf_village
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Run the app**:
   ```bash
   # On Android emulator/device
   flutter run

   # On iOS simulator/device
   flutter run
   ```

## 🎯 How to Play

### Setup Phase
1. Launch the app
2. Use the slider to select number of players (3-10)
3. Enter names for each player
4. Tap "Start Game"

### Gameplay

#### Night Phase 🌙
1. **Werewolf Turn**:
   - Pass the device to werewolf players
   - Select a villager to eliminate
   - Confirm selection

2. **Seer Turn** (if alive):
   - Pass device to the Seer
   - Select a player to reveal their role
   - Remember the information for discussion

#### Day Phase ☀️
1. **Discussion Time**:
   - All alive players discuss who might be a werewolf
   - Share suspicions and alibis
   - Tap "Proceed to Voting" when ready

2. **Voting**:
   - Each player votes individually
   - Select who is voting
   - Choose who to eliminate
   - Cast vote
   - Once all votes are in, tap "Complete Voting"

#### Game Over
- View all player roles (revealed)
- See who survived
- Play again or return to lobby

## 📦 Project Structure

```
lib/
├── models/
│   ├── player.dart          # Player data model
│   ├── role.dart            # Role enum and extensions
│   └── game_state.dart      # Game state management
├── services/
│   └── game_service.dart    # Game logic and state provider
├── screens/
│   ├── lobby_screen.dart    # Player setup screen
│   └── game_screen.dart     # Main game orchestrator
├── widgets/
│   ├── phase_transition_widget.dart  # Animated transitions
│   ├── night_phase_widget.dart       # Night gameplay UI
│   ├── day_phase_widget.dart         # Day gameplay UI
│   └── game_over_widget.dart         # Results screen
└── main.dart                # App entry point
```

## 🛠️ Technologies Used

- **Flutter**: Cross-platform mobile framework
- **Provider**: State management solution
- **flutter_animate**: Smooth animations and transitions
- **Material Design 3**: Modern UI components

## 🎨 Design Decisions

### Color Scheme
- **Night Phase**: Deep indigo gradients for mysterious atmosphere
- **Day Phase**: Warm orange gradients for active discussion
- **Villager Win**: Victorious green
- **Werewolf Win**: Ominous red

### User Experience
- **Pass-and-Play**: Designed for local multiplayer on a single device
- **Role Privacy**: Players see roles only when it's their turn
- **Clear Visual Feedback**: Selected items, vote status, and phase indicators
- **Animations**: Smooth transitions to enhance immersion

## 🔮 Future Enhancements

### Potential Features
- [ ] Online multiplayer support
- [ ] Additional roles (Doctor, Hunter, etc.)
- [ ] Sound effects and background music
- [ ] Game history and statistics
- [ ] Custom game rules and variants
- [ ] Chat/voice integration for online play
- [ ] Tutorial/onboarding for new players
- [ ] Achievements and unlockables
- [ ] Multiple language support
- [ ] Dark/light theme toggle

### Technical Improvements
- [ ] Unit and widget tests
- [ ] Integration tests
- [ ] Firebase backend integration
- [ ] WebSocket for real-time multiplayer
- [ ] State persistence
- [ ] Analytics integration

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Game Tips

### For Villagers
- Pay attention to voting patterns
- The Seer's information is crucial - protect them!
- Look for inconsistencies in player behavior
- Work together with confirmed villagers

### For Werewolves
- Blend in with villagers during discussion
- Don't eliminate the same types of players
- Create doubt and confusion
- Coordinate with fellow werewolves

### For the Seer
- Choose wisely who to reveal each night
- Share information carefully - don't reveal yourself too early
- Try to confirm villagers to build a trusted coalition

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by the classic Werewolf/Mafia party game
- Built with Flutter and the amazing Dart ecosystem
- Special thanks to the Flutter community

## 📧 Contact

For questions, suggestions, or bug reports, please open an issue on GitHub.

---

**Enjoy playing Werewolf Village! May the best team win! 🎉**
