import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/game_service.dart';
import '../models/game_state.dart';
import '../models/role.dart';
import '../screens/lobby_screen.dart';

class GameOverWidget extends StatelessWidget {
  const GameOverWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<GameService>(
      builder: (context, gameService, child) {
        final result = gameService.result;
        final villagersWon = result == GameResult.villagersWin;
        final werewolvesWon = result == GameResult.werewolvesWin;

        final backgroundColor = villagersWon
            ? Colors.green.shade700
            : Colors.red.shade900;

        final title = villagersWon ? '🎉 Villagers Win!' : '🐺 Werewolves Win!';
        final subtitle = villagersWon
            ? 'All werewolves have been eliminated!'
            : 'The werewolves have taken over!';

        final allPlayers = gameService.gameState.players;
        final werewolves = allPlayers.where((p) => p.role == Role.werewolf).toList();
        final villagers = allPlayers.where((p) => p.role == Role.villager).toList();
        final seers = allPlayers.where((p) => p.role == Role.seer).toList();

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                backgroundColor,
                backgroundColor.withOpacity(0.7),
              ],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 40),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  )
                      .animate()
                      .fadeIn(duration: 600.ms)
                      .scale(
                        begin: const Offset(0.5, 0.5),
                        end: const Offset(1, 1),
                      ),
                  const SizedBox(height: 16),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 20,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  )
                      .animate(delay: 300.ms)
                      .fadeIn(duration: 600.ms),
                  const SizedBox(height: 48),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildRoleSection(
                            '🐺 Werewolves',
                            werewolves,
                            Colors.red.shade400,
                            0,
                          ),
                          const SizedBox(height: 24),
                          _buildRoleSection(
                            '🔮 Seers',
                            seers,
                            Colors.purple.shade400,
                            werewolves.length * 80,
                          ),
                          const SizedBox(height: 24),
                          _buildRoleSection(
                            '🧑‍🌾 Villagers',
                            villagers,
                            Colors.blue.shade400,
                            (werewolves.length + seers.length) * 80,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      gameService.resetGame();
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LobbyScreen(),
                        ),
                      );
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text(
                      'Play Again',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: backgroundColor,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  )
                      .animate(delay: 800.ms)
                      .fadeIn(duration: 400.ms)
                      .slideY(begin: 0.3, end: 0),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRoleSection(
    String title,
    List<dynamic> players,
    Color color,
    int baseDelay,
  ) {
    return Card(
      color: Colors.white.withOpacity(0.2),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: color,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...players.asMap().entries.map((entry) {
              final index = entry.key;
              final player = entry.value;
              final isAlive = player.isAlive;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: color.withOpacity(0.3),
                        child: Text(
                          player.name[0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          player.name,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            decoration: isAlive
                                ? TextDecoration.none
                                : TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isAlive
                              ? Colors.green.withOpacity(0.3)
                              : Colors.red.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          isAlive ? 'Alive' : 'Eliminated',
                          style: TextStyle(
                            color: isAlive ? Colors.green.shade200 : Colors.red.shade200,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
                  .animate(delay: (baseDelay + index * 100).ms)
                  .fadeIn(duration: 300.ms)
                  .slideX(begin: -0.2, end: 0);
            }).toList(),
          ],
        ),
      ),
    )
        .animate(delay: baseDelay.ms)
        .fadeIn(duration: 400.ms)
        .slideY(begin: 0.2, end: 0);
  }
}
