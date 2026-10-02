"""Tests for sprite loading and rendering.

Decoder convention: MSB-first (TIAGRAM hardware default per
problemkaputt.de/2k6specs.htm §6.0 + Steve Wright 1979 STELLA
Programmer's Guide §6.0 — GRPx bytes are scanned with bit 7 as the
LEFTMOST pixel). Set `msb_first=False` for REFPx.3=1 mirrored sprites
or legacy extraction data.

This matches the JTZ-text-annotation ascii art in
`extraction/riverraid_player_jet_report.html` (`byte $2A ; |  X X X |`
renders as cols 2,4,6 lit = `··X·X·X·`), which is the same convention
the JTZ-labeled-sprites.html reports use for *every* extracted sprite.
"""

import pytest
from port.assets.sprites import bytes_to_surface


def test_bytes_to_surface_basic():
    """Surface dimensions match input byte-count × 8 cols × scale."""
    # 0b00000011 under LSB-first = bits 0, 1 set = cols 0, 1 lit (= leftmost
    # two PF pixels). The test was previously authored with MSB-first
    # intent (`0b11000000`); we use an LSB-first-clean literal here so the
    # intent matches the decoder convention this port actually uses.
    bytes_arr = [0b00000011]
    surface = bytes_to_surface(bytes_arr, row_count=1, scale=1)
    assert surface.get_width() == 8
    assert surface.get_height() == 1


def test_bytes_to_surface_scale():
    bytes_arr = [0b00000011]
    surface = bytes_to_surface(bytes_arr, row_count=1, scale=2)
    assert surface.get_width() == 16
    assert surface.get_height() == 2


def test_empty_sprite():
    """Empty sprite (all zeros) should produce a surface of correct size."""
    bytes_arr = [0, 0, 0]
    surface = bytes_to_surface(bytes_arr, row_count=3, scale=1)
    assert surface.get_width() == 8
    assert surface.get_height() == 3


def test_full_sprite():
    """All bits set should produce 8xN surface."""
    bytes_arr = [0xFF, 0xFF, 0xFF]
    surface = bytes_to_surface(bytes_arr, row_count=3, scale=1)
    assert surface.get_width() == 8
    assert surface.get_height() == 3


def test_sprite_color():
    """Non-zero pixels should be yellow."""
    bytes_arr = [0xFF]  # 1 row, all pixels
    surface = bytes_to_surface(bytes_arr, row_count=1, scale=1)
    pixel = surface.get_at((4, 0))
    assert pixel[0] > 200  # R
    assert pixel[1] > 200  # G
    assert pixel[2] < 160  # B


def test_sprite_transparency():
    """Zero pixels should be transparent (alpha=0)."""
    bytes_arr = [0]  # 1 row, all zeros
    surface = bytes_to_surface(bytes_arr, row_count=1, scale=1)
    pixel = surface.get_at((4, 0))
    assert pixel[3] == 0  # Alpha = 0


# ── Regression tests: pin MSB-first convention (TIA hardware default) ────
#
# `bytes_to_surface(msb_first=True)` (default) matches Atari 2600 TIA
# GRPx scanout: bit 7 of each byte is the LEFTMOST pixel and is drawn
# first. This matches the JTZ-text-annotation ascii art in
# `extraction/riverraid_player_jet_report.html` byte-by-byte, e.g.:
#
#   byte $2A → `|  X X X |`  →  cols 2,4,6 lit  → `[0,0,1,0,1,0,1,0]`
#   byte $7F → `| XXXXXXX|`  →  cols 0,1,2,3,4,5,6 lit, col 7 empty too
#                         wait, $7F = 0b01111111 has bit 7 = 0,
#                         so cols 1..7 lit, col 0 empty: `[0,1,1,1,1,1,1,1]`
#
# If you ever flip the default back to LSB-first, both the running game
# AND the JTZ-ascii labels in every extraction HTML file will desync at
# the same byte patterns. The pin below prevents that drift.
def test_msb_first_canonical_byte_2A():
    """byte $2A under MSB-first must render as `..X.X.X..` (cols 2,4,6 lit).

    Canonical wing-tip row of JetStraight at row 5 (see extraction/riverraid_
    player_jet_report.json + .html). MSB-first decoder routes bit 7→col 0,
    bit 6→col 1, ..., bit 0→col 7, so for $2A = 0b00101010 (bits 5,3,1 set):
    cols lit = {7-5, 7-3, 7-1} = {2, 4, 6}.
    """
    surface = bytes_to_surface([0x2A], row_count=1, scale=1)
    expected = [
        0,  # col 0 (bit 7 = 0)
        0,  # col 1 (bit 6 = 0)
        1,  # col 2 (bit 5 = 1)
        0,  # col 3 (bit 4 = 0)
        1,  # col 4 (bit 3 = 1)
        0,  # col 5 (bit 2 = 0)
        1,  # col 6 (bit 1 = 1)
        0,  # col 7 (bit 0 = 0)
    ]
    actual = [1 if surface.get_at((cx, 0))[3] > 0 else 0 for cx in range(8)]
    assert actual == expected, (
        f"MSB-first regression FAILED for byte $2A.\n"
        f"  expected: {expected} (= `..X.X.X..`)\n"
        f"  actual:   {actual}\n"
        f"If flipped back to LSB-first, both the JSON extraction labels "
        f"AND the rendered sprite sheet will desync at this exact pattern."
    )


def test_msb_first_byte_7F_widest_body():
    """byte $7F (widest body row of JetStraight: rows 11-12) renders as
    `·XXXXXXX` (cols 1..7 lit, col 0 empty) under MSB-first.

    $7F = 0b01111111 has bit 7 cleared and bits 6..0 all set, so the MSB
    decoder puts lit pixels at cols 1..7 and col 0 unlit.
    """
    surface = bytes_to_surface([0x7F], row_count=1, scale=1)
    actual = [1 if surface.get_at((cx, 0))[3] > 0 else 0 for cx in range(8)]
    expected = [0, 1, 1, 1, 1, 1, 1, 1]
    assert actual == expected, (
        f"byte $7F: expected {expected} (= `.XXXXXXX`), got {actual}"
    )


def test_lsb_first_byte_2A_via_explicit_mirror():
    """Opt-in LSB-first mode (msb_first=False) is still available for
    REFPx.3=1 mirrored sprites OR any legacy LSB-first extraction.

    Pins the explicit-flag path so it doesn't drift silently. byte $2A
    under LSB-first lights bits 1,3,5 at cols 1,3,5: `[0,1,0,1,0,1,0,0]`.
    """
    surface = bytes_to_surface([0x2A], row_count=1, scale=1, msb_first=False)
    actual = [1 if surface.get_at((cx, 0))[3] > 0 else 0 for cx in range(8)]
    expected = [0, 1, 0, 1, 0, 1, 0, 0]
    assert actual == expected, (
        f"LSB-first (msb_first=False) regression FAILED for byte $2A. "
        f"Expected {expected} (= `.X.X.X..`), got {actual}."
    )
