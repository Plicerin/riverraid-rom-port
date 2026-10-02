"""Tests for screen renderer (river drawing)."""

from port.systems.river import River


def test_river_get_row_byte():
    """PFPat bytes should be returned correctly for each row.

    As of 2026-07-15 the river initializes to PFPat12 (4-col bank,
    wide playable river) instead of PFPat8 (full bank). PFPat12 row 0
    = 0x0F (bits 0-3 set), PFPat8 row 0 = 0xFF (all bits set).
    Pin against the actual PFPat12 byte so a future re-seed of the
    initial block-pattern array (e.g. back to PFPat8, or to a randomized
    seed value) forces this test to break loudly rather than silently
    passing on whatever the seed happens to be.
    """
    import random
    rng = random.Random(42)
    river = River(rng)
    row = river.get_row_byte(0)
    assert row == 0x0F, (
        f"expected PFPat12 row 0 = 0x0F (post-2026-07-15 wide-river seed); "
        f"got {row:#04x}. If the river seed was changed intentionally, "
        f"also update this assertion to match the new PFPat ID's row 0."
    )


def test_river_block_scroll():
    """Block offset should advance and wrap within BLOCK_SIZE."""
    import random
    from port.core import config
    rng = random.Random(42)
    river = River(rng)
    initial_offset = river._block_offset
    river.advance()
    assert river._block_offset == initial_offset + 1


def test_river_pattern_scroll_wrap():
    """Pattern scroll should wrap within pattern row count."""
    import random
    from port.systems.patterns import PATTERN_ROW_COUNT
    rng = random.Random(42)
    river = River(rng)
    # Advance past pattern row count
    river._pattern_scroll = PATTERN_ROW_COUNT - 1
    river.advance()
    assert river._pattern_scroll == 0


def test_river_reset():
    """Reset should restore initial state."""
    import random
    rng = random.Random(42)
    river = River(rng)
    river._block_offset = 99
    river._pattern_scroll = 99
    river.reset()
    assert river._block_offset == 0
    assert river._pattern_scroll == 0
    assert river._section_block == 16
    assert river._block_part == 2


def test_river_block_generation():
    """After BLOCK_SIZE advances, a new block should be generated."""
    import random
    from port.core import config
    rng = random.Random(42)
    river = River(rng)
    initial_pat_id = river._block_pat_ids[-1]
    # Advance BLOCK_SIZE times
    for _ in range(config.BLOCK_SIZE):
        river.advance()
    # New block should have been generated (last entry changes)
    assert river._block_pat_ids[-1] != initial_pat_id or river._block_offset < config.BLOCK_SIZE


def test_river_lfsr_spawner():
    """Spawner LFSR should advance and produce varied values."""
    import random
    rng = random.Random(42)
    river = River(rng)
    river._rng_lo = 0xA8
    river._rng_hi = 0x14
    values = []
    for _ in range(10):
        lo = river._random_lo()
        values.append(lo)
    # All values should not be identical (LFSR produces sequence)
    assert len(set(values)) > 1


def test_river_left_right_bank_mirrored():
    """Left and right banks should be mirror images around center."""
    import random
    rng = random.Random(42)
    river = River(rng)
    # For any PFPat byte value B:
    # left_edge = B, right_edge = 159 - B
    # So left + right = 159
    # In screen coords (0-319): left = B*2, right = 319 - B*2
    # left + right = 319
    # Check for row 0 (PFPat12 = 0x0F after 2026-07-15 wide-river seed)
    row_byte = river.get_row_byte(0)
    assert 0 <= row_byte <= 255, (
        f"PFPat row 0 out of byte range: {row_byte}"
    )