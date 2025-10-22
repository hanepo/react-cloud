enum Role {
  villager,
  werewolf,
  seer,
}

extension RoleExtension on Role {
  String get name {
    switch (this) {
      case Role.villager:
        return 'Villager';
      case Role.werewolf:
        return 'Werewolf';
      case Role.seer:
        return 'Seer';
    }
  }

  String get emoji {
    switch (this) {
      case Role.villager:
        return '🧑‍🌾';
      case Role.werewolf:
        return '🐺';
      case Role.seer:
        return '🔮';
    }
  }

  String get description {
    switch (this) {
      case Role.villager:
        return 'Vote during the day to eliminate werewolves';
      case Role.werewolf:
        return 'Choose a player to eliminate at night';
      case Role.seer:
        return 'Reveal one player\'s role each night';
    }
  }
}
