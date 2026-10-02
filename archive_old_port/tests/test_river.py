"""Tests for River system (JTZ block generation)."""

import random
from port.systems.river import River
from port.core import config


def test_river_initial_state():
    rng = random.Random(42)
    river = River(rng)
    # River uses block-based generation, not center/width
    assert river._block_offset == 0
    assert river._section_block == 16
    assert river._block_part == 2
    assert river._pf1_pat_id == 12  # Initial PF1PatId from InitTab
    assert river._pattern_scroll == 0


def test_river_advance():
    rng = random.Random(42)
    river = River(rng)
    initial = river._block_offset
    river.advance()
    assert river._block_offset == initial + 1


def test_river_block_counter_resets():
    """After BLOCK_SIZE advances, block_offset wraps and new block generated."""
    rng = random.Random(42)
    river = River(rng)
    for _ in range(config.BLOCK_SIZE):
        river.advance()
    assert river._block_offset == 0


def test_river_sections_decrement():
    """After SECTION_BLOCKS blocks, section resets."""
    rng = random.Random(42)
    river = River(rng)
    initial_section = river._section_block
    # Advance through one section
    for _ in range(config.BLOCK_SIZE * config.SECTION_BLOCKS):
        river.advance()
    # Section should have cycled back
    assert river._section_block == initial_section


def test_river_left_right_bank():
    """Banks are computed from PFPat patterns, mirrored around center."""
    rng = random.Random(42)
    river = River(rng)
    # With PFPat8 (full bank), left edge is far right, right edge far left
    # The banks should be mirrored
    left = river.left_bank
    right = river.right_bank
    # They should sum to SCREEN_WIDTH (mirrored)
    assert left + right == config.SCREEN_WIDTH


def test_river_collision_detection():
    """Objects outside the river banks should collide."""
    rng = random.Random(42)
    river = River(rng)
    # Object far left of any possible bank position - should collide
    assert river.check_collision(0, config.ROAD_HEIGHT + 5, 8, 8)
    # Object far right - should collide
    assert river.check_collision(config.SCREEN_WIDTH - 8, config.ROAD_HEIGHT + 5, 8, 8)


def test_river_reset():
    """Reset restores initial state."""
    rng = random.Random(42)
    river = River(rng)
    river._block_offset = 99
    river._pattern_scroll = 99
    river._section_block = 1
    river.reset()
    assert river._block_offset == 0
    assert river._pattern_scroll == 0
    assert river._section_block == 16
    assert river._block_part == 2
    assert river._pf1_pat_id == 12


def test_river_playfield_data():
    """get_playfield_data returns rows for the river area only."""
    rng = random.Random(42)
    river = River(rng)
    left_rows, right_rows = river.get_playfield_data()
    # River area = SCREEN_HEIGHT - 2*ROAD_HEIGHT
    expected_len = config.SCREEN_HEIGHT - 2 * config.ROAD_HEIGHT
    assert len(left_rows) == expected_len
    assert len(right_rows) == expected_len


def test_river_pattern_scroll_wraps():
    """Pattern scroll wraps within pattern row count."""
    rng = random.Random(42)
    river = River(rng)
    from port.systems.patterns import PATTERN_ROW_COUNT
    river._pattern_scroll = PATTERN_ROW_COUNT - 1
    river.advance()
    assert river._pattern_scroll == 0


def test_river_lfsr_random_sequence():
    """LFSR should produce a non-trivial sequence of values."""
    rng = random.Random(42)
    river = River(rng)
    river._rng_lo = 0xA8
    river._rng_hi = 0x14
    values = []
    for _ in range(16):
        lo = river._random_lo()
        values.append(lo)
    # Should produce more than 1 unique value
    assert len(set(values)) > 1
    # Sequence should be deterministic (same seed → same sequence)
    river._rng_lo = 0xA8
    river._rng_hi = 0x14
    values2 = []
    for _ in range(16):
        values2.append(river._random_lo())
    assert values == values2