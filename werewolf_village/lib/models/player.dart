import 'role.dart';

class Player {
  final String id;
  final String name;
  Role role;
  bool isAlive;
  bool hasVoted;
  String? votedFor;

  Player({
    required this.id,
    required this.name,
    this.role = Role.villager,
    this.isAlive = true,
    this.hasVoted = false,
    this.votedFor,
  });

  Player copyWith({
    String? id,
    String? name,
    Role? role,
    bool? isAlive,
    bool? hasVoted,
    String? votedFor,
  }) {
    return Player(
      id: id ?? this.id,
      name: name ?? this.name,
      role: role ?? this.role,
      isAlive: isAlive ?? this.isAlive,
      hasVoted: hasVoted ?? this.hasVoted,
      votedFor: votedFor ?? this.votedFor,
    );
  }

  void resetVote() {
    hasVoted = false;
    votedFor = null;
  }
}
