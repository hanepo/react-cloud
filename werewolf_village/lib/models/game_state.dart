import 'dart:math';
import 'player.dart';
import 'role.dart';

enum GamePhase {
  lobby,
  nightIntro,
  nightWerewolf,
  nightSeer,
  dayIntro,
  dayDiscussion,
  dayVoting,
  gameOver,
}

enum GameResult {
  villagersWin,
  werewolvesWin,
  none,
}

class GameState {
  List<Player> players;
  GamePhase phase;
  int dayNumber;
  String? eliminatedPlayerId;
  String? seerRevealedPlayerId;
  Role? seerRevealedRole;
  GameResult result;
  String? lastActionMessage;

  GameState({
    required this.players,
    this.phase = GamePhase.lobby,
    this.dayNumber = 0,
    this.eliminatedPlayerId,
    this.seerRevealedPlayerId,
    this.seerRevealedRole,
    this.result = GameResult.none,
    this.lastActionMessage,
  });

  List<Player> get alivePlayers =>
      players.where((p) => p.isAlive).toList();

  List<Player> get aliveWerewolves =>
      alivePlayers.where((p) => p.role == Role.werewolf).toList();

  List<Player> get aliveVillagers =>
      alivePlayers.where((p) => p.role != Role.werewolf).toList();

  Player? get seer =>
      players.firstWhere(
        (p) => p.role == Role.seer && p.isAlive,
        orElse: () => Player(id: '', name: ''),
      ).id.isEmpty
          ? null
          : players.firstWhere((p) => p.role == Role.seer && p.isAlive);

  void assignRoles() {
    final random = Random();
    final playerCount = players.length;

    // Calculate role distribution
    final werewolfCount = (playerCount / 3).ceil();
    final seerCount = 1;
    final villagerCount = playerCount - werewolfCount - seerCount;

    // Create a list of roles
    List<Role> roles = [
      ...List.filled(werewolfCount, Role.werewolf),
      ...List.filled(seerCount, Role.seer),
      ...List.filled(villagerCount, Role.villager),
    ];

    // Shuffle roles
    roles.shuffle(random);

    // Assign roles to players
    for (int i = 0; i < players.length; i++) {
      players[i].role = roles[i];
    }
  }

  void startNightPhase() {
    dayNumber++;
    phase = GamePhase.nightIntro;
    eliminatedPlayerId = null;
    seerRevealedPlayerId = null;
    seerRevealedRole = null;

    // Reset votes
    for (var player in players) {
      player.resetVote();
    }
  }

  void startDayPhase() {
    phase = GamePhase.dayIntro;

    // Reset votes for day phase
    for (var player in players) {
      player.resetVote();
    }
  }

  void eliminatePlayer(String playerId) {
    final player = players.firstWhere((p) => p.id == playerId);
    player.isAlive = false;
    eliminatedPlayerId = playerId;
  }

  void revealRole(String playerId) {
    final player = players.firstWhere((p) => p.id == playerId);
    seerRevealedPlayerId = playerId;
    seerRevealedRole = player.role;
  }

  Map<String, int> getVoteCounts() {
    Map<String, int> voteCounts = {};

    for (var player in alivePlayers) {
      if (player.votedFor != null) {
        voteCounts[player.votedFor!] = (voteCounts[player.votedFor!] ?? 0) + 1;
      }
    }

    return voteCounts;
  }

  String? getMostVotedPlayer() {
    final voteCounts = getVoteCounts();

    if (voteCounts.isEmpty) return null;

    // Find the player with the most votes
    String? mostVoted;
    int maxVotes = 0;

    voteCounts.forEach((playerId, votes) {
      if (votes > maxVotes) {
        maxVotes = votes;
        mostVoted = playerId;
      }
    });

    return mostVoted;
  }

  GameResult checkWinCondition() {
    final aliveWerewolfCount = aliveWerewolves.length;
    final aliveVillagerCount = aliveVillagers.length;

    if (aliveWerewolfCount == 0) {
      return GameResult.villagersWin;
    }

    if (aliveWerewolfCount >= aliveVillagerCount) {
      return GameResult.werewolvesWin;
    }

    return GameResult.none;
  }

  void checkAndUpdateGameResult() {
    result = checkWinCondition();
    if (result != GameResult.none) {
      phase = GamePhase.gameOver;
    }
  }
}
