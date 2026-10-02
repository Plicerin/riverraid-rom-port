"""Tests for scoring system."""

from port.systems.scoring import ScoringSystem
from port.core import config


def test_initial_state():
    s = ScoringSystem()
    assert s.score == 0
    assert s.multiplier == config.MULTIPLIER_START
    assert s.decay_counter == 0


def test_add_score():
    s = ScoringSystem()
    s.add(30)  # Ship score
    assert s.score == 300  # 30 * 10 (initial multiplier)


def test_multiplier_resets_on_score():
    s = ScoringSystem()
    s.multiplier = 1
    s.add(30)
    assert s.score == 30
    assert s.multiplier == config.MULTIPLIER_START


def test_multiplier_decay():
    s = ScoringSystem()
    s.multiplier = 5
    # Decay rate is 5 frames
    for _ in range(5):
        s.update()
    assert s.multiplier == 4


def test_multiplier_min():
    s = ScoringSystem()
    s.multiplier = 2
    for _ in range(20):
        s.update()
    assert s.multiplier == config.MULTIPLIER_MIN


def test_reset():
    s = ScoringSystem()
    s.score = 1000
    s.multiplier = 3
    s.reset()
    assert s.score == 0
    assert s.multiplier == config.MULTIPLIER_START
    assert s.decay_counter == 0
