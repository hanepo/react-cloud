import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/game_service.dart';
import '../models/game_state.dart';

class DayPhaseWidget extends StatefulWidget {
  const DayPhaseWidget({super.key});

  @override
  State<DayPhaseWidget> createState() => _DayPhaseWidgetState();
}

class _DayPhaseWidgetState extends State<DayPhaseWidget> {
  String? _selectedVoterId;
  String? _selectedTargetId;

  @override
  Widget build(BuildContext context) {
    return Consumer<GameService>(
      builder: (context, gameService, child) {
        final phase = gameService.phase;
        final isDiscussion = phase == GamePhase.dayDiscussion;
        final isVoting = phase == GamePhase.dayVoting;

        final alivePlayers = gameService.gameState.alivePlayers;

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.orange.shade700,
                Colors.orange.shade500,
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
                    isDiscussion ? '☀️ Day Discussion' : '🗳️ Voting Time',
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
                    isDiscussion
                        ? 'Discuss who might be a werewolf'
                        : 'Each player votes to eliminate someone',
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  )
                      .animate(delay: 200.ms)
                      .fadeIn(duration: 400.ms),
                  const SizedBox(height: 32),
                  if (isDiscussion) ...[
                    Expanded(
                      child: Card(
                        color: Colors.white.withOpacity(0.2),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '👥 Alive Players',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: alivePlayers.length,
                                  itemBuilder: (context, index) {
                                    final player = alivePlayers[index];
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 12.0),
                                      child: Container(
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              backgroundColor:
                                                  Colors.white.withOpacity(0.3),
                                              child: Text(
                                                player.name[0].toUpperCase(),
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            Text(
                                              player.name,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 18,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
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
                      onPressed: () {
                        gameService.proceedToDayVoting();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.orange.shade700,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Proceed to Voting',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ] else ...[
                    // Voting Phase
                    Card(
                      color: Colors.white.withOpacity(0.2),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '1. Who is voting?',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: alivePlayers.map((player) {
                                final isSelected = _selectedVoterId == player.id;
                                final hasVoted = player.hasVoted;

                                return FilterChip(
                                  label: Text(
                                    player.name,
                                    style: TextStyle(
                                      color: hasVoted
                                          ? Colors.grey
                                          : (isSelected
                                              ? Colors.orange.shade900
                                              : Colors.white),
                                    ),
                                  ),
                                  selected: isSelected,
                                  onSelected: hasVoted
                                      ? null
                                      : (selected) {
                                          setState(() {
                                            _selectedVoterId =
                                                selected ? player.id : null;
                                            _selectedTargetId = null;
                                          });
                                        },
                                  selectedColor: Colors.white,
                                  backgroundColor:
                                      hasVoted
                                          ? Colors.grey.shade600
                                          : Colors.white.withOpacity(0.2),
                                  checkmarkColor: Colors.orange.shade900,
                                  disabledColor: Colors.grey.shade600,
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_selectedVoterId != null)
                      Expanded(
                        child: Card(
                          color: Colors.white.withOpacity(0.2),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '2. Vote to eliminate:',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Expanded(
                                  child: ListView.builder(
                                    itemCount: alivePlayers.length,
                                    itemBuilder: (context, index) {
                                      final player = alivePlayers[index];
                                      final isSelected =
                                          _selectedTargetId == player.id;

                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 12.0),
                                        child: InkWell(
                                          onTap: () {
                                            setState(() {
                                              _selectedTargetId = player.id;
                                            });
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(
                                              color: isSelected
                                                  ? Colors.white.withOpacity(0.3)
                                                  : Colors.white.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(
                                                color: isSelected
                                                    ? Colors.white
                                                    : Colors.transparent,
                                                width: 2,
                                              ),
                                            ),
                                            child: Row(
                                              children: [
                                                CircleAvatar(
                                                  backgroundColor:
                                                      Colors.white.withOpacity(0.3),
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
                                                    color: Colors.white,
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
                        )
                            .animate()
                            .fadeIn(duration: 300.ms)
                            .slideY(begin: 0.2, end: 0),
                      ),
                    if (_selectedVoterId != null) const SizedBox(height: 16),
                    if (_selectedVoterId != null && _selectedTargetId != null)
                      ElevatedButton(
                        onPressed: () {
                          gameService.castVote(_selectedVoterId!, _selectedTargetId!);
                          setState(() {
                            _selectedVoterId = null;
                            _selectedTargetId = null;
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.orange.shade700,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Cast Vote',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      )
                          .animate()
                          .fadeIn(duration: 300.ms)
                          .slideY(begin: 0.3, end: 0),
                    if (gameService.allPlayersVoted)
                      Padding(
                        padding: const EdgeInsets.only(top: 16.0),
                        child: ElevatedButton(
                          onPressed: () {
                            gameService.completeDayVoting();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red.shade700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Complete Voting & Reveal Results',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        )
                            .animate()
                            .fadeIn(duration: 500.ms)
                            .scale(),
                      ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
