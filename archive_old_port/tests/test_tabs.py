"""Tests for ROM table data."""

from port.systems.tabs import (
    ALL_FUEL_TABS,
    BANK_PTR_TAB,
    ENEMY_ID_TAB,
    SHAPE_POS_TAB,
    FUEL_TAB_0,
    FUEL_TAB_1,
    FUEL_TAB_2,
    FUEL_TAB_3,
    FUEL_TAB_4,
    get_bank_pattern_id,
    get_enemy_id,
    get_fuel_shape,
)


# ── EnemyIdTab tests ────────────────────────────────────────────────

def test_enemy_id_tab_length():
    """EnemyIdTab should have 8 entries."""
    assert len(ENEMY_ID_TAB) == 8


def test_enemy_id_tab_values():
    """EnemyIdTab values should match expected sequence."""
    expected = [7, 5, 7, 5, 4, 7, 5, 5]
    assert ENEMY_ID_TAB == expected


def test_get_enemy_id_deterministic():
    """get_enemy_id should return deterministic values from EnemyIdTab."""
    assert get_enemy_id(0) == 7
    assert get_enemy_id(1) == 5
    assert get_enemy_id(2) == 7
    assert get_enemy_id(3) == 5
    assert get_enemy_id(4) == 4
    assert get_enemy_id(5) == 7
    assert get_enemy_id(6) == 5
    assert get_enemy_id(7) == 5


def test_get_enemy_id_wraps():
    """get_enemy_id should wrap around EnemyIdTab."""
    assert get_enemy_id(8) == get_enemy_id(0)  # 8 % 8 = 0
    assert get_enemy_id(16) == get_enemy_id(0)
    assert get_enemy_id(9) == get_enemy_id(1)


# ── ShapePosTab tests ───────────────────────────────────────────────

def test_shape_pos_tab_length():
    """ShapePosTab should have 11 entries."""
    assert len(SHAPE_POS_TAB) == 11


def test_shape_pos_tab_values():
    """ShapePosTab values should match expected positions."""
    expected = [143, 141, 7, 10, 132, 13, 128, 18, 124, 22, 120]
    assert SHAPE_POS_TAB == expected


def test_shape_pos_tab_alternates_sides():
    """ShapePosTab should have right-side (high) and left-side (low) positions.

    ShapePtr1a/1bTab pairs: even index = right side, next odd index = left side.
    """
    # Right-side positions (ShapePtr1a: ≥ 100)
    assert SHAPE_POS_TAB[0] >= 100  # PF ID 0 right (143)
    assert SHAPE_POS_TAB[4] >= 100  # PF ID 4 right (132)
    assert SHAPE_POS_TAB[6] >= 100  # PF ID 6 right (128)
    assert SHAPE_POS_TAB[8] >= 100  # PF ID 8 right (124)
    assert SHAPE_POS_TAB[10] >= 100 # PF ID 10 right (120)
    # Left-side positions (ShapePtr1b: ≤ 30)
    assert SHAPE_POS_TAB[2] <= 30   # PF ID 1 left (7)
    assert SHAPE_POS_TAB[3] <= 30   # PF ID 1 left (10)
    assert SHAPE_POS_TAB[5] <= 30   # PF ID 5 left (13)
    assert SHAPE_POS_TAB[7] <= 30   # PF ID 7 left (18)
    assert SHAPE_POS_TAB[9] <= 30   # PF ID 9 left (22)


# ── BankPtrTab tests ────────────────────────────────────────────────

def test_bank_ptr_tab_length():
    """BankPtrTab should have 15 entries."""
    assert len(BANK_PTR_TAB) == 15


def test_bank_ptr_tab_is_identity():
    """BankPtrTab should be [0, 1, 2, ..., 14] (identity mapping)."""
    assert BANK_PTR_TAB == list(range(15))


def test_get_bank_pattern_id():
    """get_bank_pattern_id should return correct ID from BankPtrTab."""
    for i in range(15):
        assert get_bank_pattern_id(i) == i


def test_get_bank_pattern_id_default():
    """get_bank_pattern_id should default to 0 for out-of-range."""
    assert get_bank_pattern_id(100) == 0
    assert get_bank_pattern_id(-1) == 0


# ── FuelTab tests ───────────────────────────────────────────────────

def test_all_fuel_tabs_length():
    """ALL_FUEL_TABS should have 5 entries."""
    assert len(ALL_FUEL_TABS) == 5


def test_fuel_tabs_unique():
    """Each fuel tab should have different width bytes."""
    # FuelTab_0 is narrow (0x80)
    for row in FUEL_TAB_0:
        assert row == 0x80
    # FuelTab_1 is medium-wide (0xE0)
    for row in FUEL_TAB_1:
        assert row == 0xE0
    # FuelTab_2 is wider (0xF8)
    for row in FUEL_TAB_2:
        assert row == 0xF8
    # FuelTab_3 is even wider (0xFC)
    for row in FUEL_TAB_3:
        assert row == 0xFC
    # FuelTab_4 is widest (0xFE)
    for row in FUEL_TAB_4:
        assert row == 0xFE


def test_get_fuel_shape():
    """get_fuel_shape should return correct tab for IDs 0-4."""
    assert get_fuel_shape(0) == FUEL_TAB_0
    assert get_fuel_shape(1) == FUEL_TAB_1
    assert get_fuel_shape(2) == FUEL_TAB_2
    assert get_fuel_shape(3) == FUEL_TAB_3
    assert get_fuel_shape(4) == FUEL_TAB_4


def test_get_fuel_shape_default():
    """get_fuel_shape should return FUEL_TAB_0 for invalid IDs."""
    assert get_fuel_shape(5) == FUEL_TAB_0
    assert get_fuel_shape(-1) == FUEL_TAB_0
