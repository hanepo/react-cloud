import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class PhaseTransitionWidget extends StatefulWidget {
  final String title;
  final String subtitle;
  final String message;
  final Color backgroundColor;
  final VoidCallback onComplete;

  const PhaseTransitionWidget({
    super.key,
    required this.title,
    required this.subtitle,
    required this.message,
    required this.backgroundColor,
    required this.onComplete,
  });

  @override
  State<PhaseTransitionWidget> createState() => _PhaseTransitionWidgetState();
}

class _PhaseTransitionWidgetState extends State<PhaseTransitionWidget> {
  @override
  void initState() {
    super.initState();
    // Auto-advance after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        widget.onComplete();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            widget.backgroundColor,
            widget.backgroundColor.withOpacity(0.7),
          ],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.title,
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              )
                  .animate()
                  .fadeIn(duration: 600.ms)
                  .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1)),
              const SizedBox(height: 16),
              Text(
                widget.subtitle,
                style: const TextStyle(
                  fontSize: 24,
                  color: Colors.white70,
                ),
              )
                  .animate(delay: 300.ms)
                  .fadeIn(duration: 600.ms),
              const SizedBox(height: 48),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32.0),
                child: Text(
                  widget.message,
                  style: const TextStyle(
                    fontSize: 20,
                    color: Colors.white,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate(delay: 600.ms)
                    .fadeIn(duration: 600.ms)
                    .slideY(begin: 0.3, end: 0),
              ),
              const SizedBox(height: 48),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              )
                  .animate(delay: 900.ms)
                  .fadeIn(duration: 400.ms),
            ],
          ),
        ),
      ),
    );
  }
}
