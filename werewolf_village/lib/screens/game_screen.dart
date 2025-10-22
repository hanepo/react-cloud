import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/game_service.dart';
import '../models/game_state.dart';
import '../widgets/night_phase_widget.dart';
import '../widgets/day_phase_widget.dart';
import '../widgets/game_over_widget.dart';
import '../widgets/phase_transition_widget.dart';

class GameScreen extends StatelessWidget {
  const GameScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<GameService>(
        builder: (context, gameService, child) {
          final phase = gameService.phase;

          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: _buildPhaseWidget(context, phase, gameService),
          );
        },
      ),
    );
  }

  Widget _buildPhaseWidget(
    BuildContext context,
    GamePhase phase,
    GameService gameService,
  ) {
    switch (phase) {
      case GamePhase.lobby:
        return const Center(child: CircularProgressIndicator());

      case GamePhase.nightIntro:
        return PhaseTransitionWidget(
          key: const ValueKey('nightIntro'),
          title: '🌙 Night Falls',
          subtitle: 'Day ${gameService.gameState.dayNumber}',
          message: 'The village sleeps...\nBut danger lurks in the shadows.',
          backgroundColor: Colors.indigo.shade900,
          onComplete: () {
            gameService.proceedToWerewolfAction();
          },
        );

      case GamePhase.nightWerewolf:
      case GamePhase.nightSeer:
        return NightPhaseWidget(key: ValueKey(phase));

      case GamePhase.dayIntro:
        return PhaseTransitionWidget(
          key: const ValueKey('dayIntro'),
          title: '☀️ Day Breaks',
          subtitle: 'Day ${gameService.gameState.dayNumber}',
          message: gameService.gameState.lastActionMessage ??
              'The village awakens...',
          backgroundColor: Colors.orange.shade700,
          onComplete: () {
            gameService.proceedToDayDiscussion();
          },
        );

      case GamePhase.dayDiscussion:
      case GamePhase.dayVoting:
        return DayPhaseWidget(key: ValueKey(phase));

      case GamePhase.gameOver:
        return const GameOverWidget(key: ValueKey('gameOver'));

      default:
        return const Center(child: Text('Unknown Phase'));
    }
  }
}
