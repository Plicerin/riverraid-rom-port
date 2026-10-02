"""Regression tests for river.check_collision BITMAP interpretation.

Pins the 2026-07-15 fix that prevents player.lives from dropping 3→0 when
the bottom block scrolls to a high-byte pattern (PFpat6, PFpat7, PFpat8)
during the early game. Pre-fix formula ``left_edge = row_byte * 2`` would
give left_edge=504 for PFpat6 row 0 (row_byte=0xFC), instantly crashing a
player at x=160 every 4 frames until lives hit 0 and GAME_OVER fired.

The tests pin the actual crashing patterns (PFpat6, PFpat8 -- both top-bit
PATs) so the regression is locked in. PFpat12 was *not* a regression pin
because its row 0 (0x0F=15) gave left_edge_screen=30 pre-fix -- safely
under 160 regardless of fix; only the high-byte patterns triggered the
crash. diag trace from `tmp_diag2.py` shows the bottom block at crash
frames as ``_block_pat_ids=[6, 12, 5, 12, 8, 12]`` -- pat_id=6 (PFpat6)
and pat_id=8 (PFpat8) are the real bug triggers.

Note: the fixture does NOT pin the test to PFPAT[row 0] alone. Player at
y=190 spans rows_in_river 177..194, which covers multiple row_in_block
indices (17/18 due to 177%32=17, then 0/1/2 for the wrapped rows past
row_in_river>=192). The full 18 rows the player occupies are tested in
each invocation, which is what we want for a black-box collision pin.

Verified 2026-07-15:
  - PRE-fix: PFpat6 row 0 (0xFC) -> left_edge_screen=504 -> obj_x=160 < 504 -> CRASH (3x in 100 frames)
  - POST-fix: PFpat6 row 0 (6 bits set) -> left_edge_screen=48 -> obj_x=160 > 48 -> safe
"""
import pytest
import random
from port.systems.river import River


@pytest.fixture
def river_at_pfpat():
    """Return a River mutated to a specific pat_id at the bottom (player) block.

    The bottom block (_block_pat_ids[0]) is what the player is sitting on for
    the rows at the player's y range. Pinning it isolates the row_byte-driven
    collision behavior from LFSR-driven block generation.
    """

    def _factory(pat_id: int) -> River:
        rng = random.Random(42)
        r = River(rng)
        # Override the bottom block (player area) to the target pattern.
        r._block_pat_ids[0] = pat_id
        return r

    return _factory


def test_player_at_center_pfpat6_no_crash(river_at_pfpat):
    """The actual bug pattern: PFpat6 row 0 (0xFC = 252) used to crash player at x=160.

    Pre-fix: left_edge_screen = 504, obj_x=160 < 504 -> CRASH.
    Post-fix: 6 bits counted -> left_edge_screen = 48 -> SAFE.
    This is the regression pin for the 3-lives-drop-in-100-frames bug.
    """
    river = river_at_pfpat(6)
    assert river.check_collision(160, 190, 8, 18) is False, (
        "REGRESSION: player at x=160 must NOT crash on PFpat6 -- the row-byte "
        "0xFC formula regressed to raw-width (pre-fix left_edge_screen=504)."
    )


def test_player_at_center_pfpat8_no_crash(river_at_pfpat):
    """PFpat8 (full bank, row_byte=0xFF = 255) is similarly affected.

    Pre-fix:  left_edge_screen = 510 -> CRASH.
    Post-fix: 8 bits counted -> left_edge_screen = 64 -> SAFE.
    """
    river = river_at_pfpat(8)
    assert river.check_collision(160, 190, 8, 18) is False, (
        "REGRESSION: player at x=160 must NOT crash on PFpat8 -- the row-byte "
        "0xFF formula regressed to raw-width."
    )

