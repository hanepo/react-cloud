import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/game_service.dart';
import '../models/game_state.dart';
import '../models/role.dart';

class NightPhaseWidget extends StatefulWidget {
  const NightPhaseWidget({super.key});

  @override
  State<NightPhaseWidget> createState() => _NightPhaseWidgetState();
}

class _NightPhaseWidgetState extends State<NightPhaseWidget> {
  String? _selectedPlayerId;

  @override
  Widget build(BuildContext context) {
    return Consumer<GameService>(
      builder: (context, gameService, child) {
        final phase = gameService.phase;
        final isWerewolfPhase = phase == GamePhase.nightWerewolf;
        final isSeerPhase = phase == GamePhase.nightSeer;

        final title = isWerewolfPhase ? '🐺 Werewolf Turn' : '🔮 Seer Turn';
        final subtitle = isWerewolfPhase
            ? 'Choose a player to eliminate'
            : 'Choose a player to reveal';

        final alivePlayers = gameService.gameState.alivePlayers;
        final activeRole = isWerewolfPhase ? Role.werewolf : Role.seer;

        // Filter players based on phase
        final selectablePlayers = alivePlayers.where((p) {
          if (isWerewolfPhase) {
            return p.role != Role.werewolf; // Werewolves can't target themselves
          } else {
            return true; // Seer can check anyone
          }
        }).toList();

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.indigo.shade900,
                Colors.indigo.shade700,
              ],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 20),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .scale(),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white70,
                    ),
                    textAlign: TextAlign.center,
                  )
                      .animate(delay: 200.ms)
                      .fadeIn(duration: 400.ms),
                  const SizedBox(height: 32),
                  if (isSeerPhase && gameService.gameState.seerRevealedPlayerId != null)
                    Card(
                      color: Colors.amber.withOpacity(0.2),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            const Text(
                              '✨ Revealed Role',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${gameService.gameState.players.firstWhere((p) => p.id == gameService.gameState.seerRevealedPlayerId).name} is a ${gameService.gameState.seerRevealedRole?.name} ${gameService.gameState.seerRevealedRole?.emoji}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                        .animate()
                        .fadeIn()
                        .scale(),
                  const SizedBox(height: 16),
                  Expanded(
                    child: Card(
                      color: Colors.white.withOpacity(0.1),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Select a Player',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Expanded(
                              child: ListView.builder(
                                itemCount: selectablePlayers.length,
                                itemBuilder: (context, index) {
                                  final player = selectablePlayers[index];
                                  final isSelected = _selectedPlayerId == player.id;

                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12.0),
                                    child: InkWell(
                                      onTap: () {
                                        setState(() {
                                          _selectedPlayerId = player.id;
                                        });
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? Colors.amber.withOpacity(0.3)
                                              : Colors.white.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: isSelected
                                                ? Colors.amber
                                                : Colors.transparent,
                                            width: 2,
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              backgroundColor: Colors.white.withOpacity(0.2),
                                              child: Text(
                                                player.name[0].toUpperCase(),
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Text(
                                                player.name,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                            if (isSelected)
                                              const Icon(
                                                Icons.check_circle,
                                                color: Colors.amber,
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  )
                                      .animate(delay: (index * 50).ms)
                                      .fadeIn(duration: 300.ms)
                                      .slideX(begin: -0.2, end: 0);
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _selectedPlayerId == null
                        ? null
                        : () {
                            if (isWerewolfPhase) {
                              gameService.werewolfSelectVictim(_selectedPlayerId!);
                            } else {
                              gameService.seerRevealRole(_selectedPlayerId!);
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber,
                      foregroundColor: Colors.indigo.shade900,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      disabledBackgroundColor: Colors.grey.shade600,
                    ),
                    child: Text(
                      isWerewolfPhase ? 'Eliminate Player' : 'Reveal Role',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
