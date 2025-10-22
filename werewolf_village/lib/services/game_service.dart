import 'package:flutter/foundation.dart';
import '../models/player.dart';
import '../models/role.dart';
import '../models/game_state.dart';

class GameService extends ChangeNotifier {
  GameState _gameState = GameState(players: []);

  GameState get gameState => _gameState;
  List<Player> get players => _gameState.players;
  GamePhase get phase => _gameState.phase;
  GameResult get result => _gameState.result;

  void initializePlayers(List<String> playerNames) {
    _gameState = GameState(
      players: playerNames.asMap().entries.map((entry) {
        return Player(
          id: entry.key.toString(),
          name: entry.value,
        );
      }).toList(),
    );
    notifyListeners();
  }

  void startGame() {
    _gameState.assignRoles();
    _gameState.startNightPhase();
    notifyListeners();
  }

  void proceedToWerewolfAction() {
    _gameState.phase = GamePhase.nightWerewolf;
    notifyListeners();
  }

  void werewolfSelectVictim(String playerId) {
    _gameState.eliminatePlayer(playerId);
    _gameState.lastActionMessage = 'A player was eliminated during the night...';

    // Check if seer is alive
    if (_gameState.seer != null) {
      _gameState.phase = GamePhase.nightSeer;
    } else {
      // Skip to day phase
      _completeNightPhase();
    }
    notifyListeners();
  }

  void seerRevealRole(String playerId) {
    _gameState.revealRole(playerId);
    _completeNightPhase();
    notifyListeners();
  }

  void _completeNightPhase() {
    _gameState.checkAndUpdateGameResult();
    if (_gameState.result == GameResult.none) {
      _gameState.startDayPhase();
    }
  }

  void proceedToDayDiscussion() {
    _gameState.phase = GamePhase.dayDiscussion;
    notifyListeners();
  }

  void proceedToDayVoting() {
    _gameState.phase = GamePhase.dayVoting;
    notifyListeners();
  }

  void castVote(String voterId, String targetId) {
    final voter = _gameState.players.firstWhere((p) => p.id == voterId);
    voter.hasVoted = true;
    voter.votedFor = targetId;
    notifyListeners();
  }

  bool get allPlayersVoted {
    return _gameState.alivePlayers.every((p) => p.hasVoted);
  }

  void completeDayVoting() {
    final eliminatedId = _gameState.getMostVotedPlayer();

    if (eliminatedId != null) {
      final eliminated = _gameState.players.firstWhere((p) => p.id == eliminatedId);
      _gameState.eliminatePlayer(eliminatedId);
      _gameState.lastActionMessage =
          '${eliminated.name} was eliminated by vote! They were a ${eliminated.role.name} ${eliminated.role.emoji}';
    } else {
      _gameState.lastActionMessage = 'No one was eliminated.';
    }

    _gameState.checkAndUpdateGameResult();

    if (_gameState.result == GameResult.none) {
      _gameState.startNightPhase();
    }

    notifyListeners();
  }

  void resetGame() {
    _gameState = GameState(players: []);
    notifyListeners();
  }

  String getPlayerRole(String playerId) {
    final player = _gameState.players.firstWhere((p) => p.id == playerId);
    return player.role.name;
  }

  String getPlayerRoleEmoji(String playerId) {
    final player = _gameState.players.firstWhere((p) => p.id == playerId);
    return player.role.emoji;
  }
}
