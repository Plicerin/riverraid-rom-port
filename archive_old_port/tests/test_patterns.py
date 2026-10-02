"""Tests for playfield pattern data."""

from port.systems.patterns import (
    ALL_PATTERNS,
    PATTERN_ROW_COUNT,
    get_pattern,
    get_row,
    PFPAT0,
    PFPAT1,
    PFPAT2,
    PFPAT8,
    PFPAT9,
    PFPAT14,
)


def test_all_patterns_count():
    """All 15 patterns should be loaded."""
    assert len(ALL_PATTERNS) == 15


def test_pattern_0_empty_river():
    """PFPat0 should be mostly zeros (empty river)."""
    assert len(PFPAT0) == 24
    # First 19 rows are 0x00
    for i in range(19):
        assert PFPAT0[i] == 0x00


def test_pattern_1_single_pixel_edge():
    """PFPat1 should be 0x80 for 16 rows."""
    for i in range(16):
        assert PFPAT1[i] == 0x80


def test_pattern_2_two_pixel_edge():
    """PFPat2 should be 0xC0 for 16 rows."""
    for i in range(16):
        assert PFPAT2[i] == 0xC0


def test_pattern_8_full_bank():
    """PFPat8 should be 0xFF for 16 rows."""
    for i in range(16):
        assert PFPAT8[i] == 0xFF


def test_pattern_9_island():
    """PFPat9 should be 0x01 for 16 rows (single pixel island)."""
    for i in range(16):
        assert PFPAT9[i] == 0x01


def test_pattern_14_island():
    """PFPat14 should be 0x3F for 16 rows (six pixel island)."""
    for i in range(16):
        assert PFPAT14[i] == 0x3F


def test_get_pattern_valid_id():
    """get_pattern should return correct pattern for valid IDs."""
    for i in range(15):
        pattern = get_pattern(i)
        assert pattern == ALL_PATTERNS[i]


def test_get_pattern_invalid_id():
    """get_pattern should raise ValueError for invalid IDs."""
    try:
        get_pattern(-1)
        assert False, "Expected ValueError"
    except ValueError:
        pass

    try:
        get_pattern(15)
        assert False, "Expected ValueError"
    except ValueError:
        pass


def test_get_row_wraps():
    """get_row should wrap around at pattern boundary."""
    row_0 = get_row(0, 0)
    row_23 = get_row(0, 23)
    # After wrapping, row 24 should equal row 0
    assert get_row(0, 24) == row_0
    # Row 23 should be 0x1F (last row of PFPat0)
    assert row_23 == 0x1F


def test_get_row_returns_8bit():
    """get_row should return values 0-255."""
    for i in range(15):
        for r in range(30):
            val = get_row(i, r)
            assert 0 <= val <= 255


def test_pattern_row_count():
    """PATTERN_ROW_COUNT should be 28."""
    assert PATTERN_ROW_COUNT == 28
