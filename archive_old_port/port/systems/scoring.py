"""
River Raid — Scoring system.

Mirrors JTZ scoring:
  - ScoreTab: score values per enemy type
  - Multiplier: starts at 10, decays when not scoring
  - FinishDigits: score display rendering
  - scorePtr1/scorePtr2: 12-byte score display buffers
"""

from port.core import config


class ScoringSystem:
    """Score tracking and multiplier management."""

    def __init__(self):
        self.score = 0
        self.multiplier = config.MULTIPLIER_START
        self.decay_counter = 0

    def add(self, value: int):
        """Add scored value multiplied by current multiplier."""
        self.score += value * self.multiplier
        # Reset multiplier on scoring
        self.multiplier = config.MULTIPLIER_START

    def update(self):
        """Update multiplier decay."""
        self.decay_counter += 1
        if self.decay_counter >= config.MULTIPLIER_DECAY_RATE:
            self.decay_counter = 0
            self.multiplier = max(config.MULTIPLIER_MIN, self.multiplier - 1)

    def reset(self):
        """Reset score to initial state."""
        self.score = 0
        self.multiplier = config.MULTIPLIER_START
        self.decay_counter = 0
