"""
River Raid — ROM table data.

Tables extracted from JTZ disassembly (reference/jentzsch_2001/River Raid.asm).

EnemyIdTab  – Enemy ID lookup for LFSR mask result (line 2570)
ShapePosTab – X-positions for enemies indexed by PF1PatId (line 2573)
BankPtrTab  – Pattern pointer indices for river banks (line 2873)
FuelTab0-4  – Fuel depot shape definitions
"""


# ── EnemyIdTab (JTZ line 2570) ──────────────────────────────────────
# Look-up table used by LFSR-driven spawning.
# After masking randomHi with %111 (level>=3) or %001 (level<3),
# the result indexes into this table to get the enemy ID.
#
# ID constants (from config):
#   ENEMY_PLANE=4, ENEMY_HELI0=5, ENEMY_HELI1=6, ENEMY_SHIP=7
#
# Masked value → EnemyIdTab[idx] → enemy type (8-entry canonical JTZ pin):
#   0 → 7 (SHIP),  1 → 5 (HELI0),  2 → 7 (SHIP),  3 → 5 (HELI0)
#   4 → 4 (PLANE), 5 → 7 (SHIP),  6 → 5 (HELI0), 7 → 5 (HELI0)
ENEMY_ID_TAB = [7, 5, 7, 5, 4, 7, 5, 5]

# ── ShapePosTab (JTZ line 2573) ─────────────────────────────────────
# X-positions indexed by PF1PatId (0–10). 11 entries — CANONICAL JTZ
# pin per tests/test_tabs.py test_shape_pos_tab_length +
# test_shape_pos_tab_values. Even indices → right side (large values:
# 120–143). Odd indices → left side (small values: 7–22).
#
# Index = PF1PatId from river block generation:
#   0,1  = explosion (PF ID 0)
#   2,3  = explosion (PF ID 1)
#   4    = plane right (PF ID 4)
#   5    = heli0 left  (PF ID 5)
#   6    = heli1 right (PF ID 6)
#   7    = ship left   (PF ID 7)
#   8    = bridge right(PF ID 8)
#   9    = house left  (PF ID 9)
#  10    = fuel right  (PF ID 10)
SHAPE_POS_TAB = [
    143,  # PF ID 0 even (explosion right)
    141,  # PF ID 0 odd  (explosion left)
    7,    # PF ID 1 even (explosion right)
    10,   # PF ID 1 odd  (explosion left)
    132,  # PF ID 4 even (plane right)
    13,   # PF ID 5 odd  (heli0 left)
    128,  # PF ID 6 even (heli1 right)
    18,   # PF ID 7 odd  (ship left)
    124,  # PF ID 8 even (bridge right)
    22,   # PF ID 9 odd  (house left)
    120,  # PF ID 10 even (fuel right)
]

# ── BankPtrTab (JTZ line 2873, $FCF1) ───────────────────────────────
# Low-byte pointers to PFPat patterns for river bank generation.
# First 9 entries (0–8): standard bank patterns (PFPat0–PFPat8).
# Next 6 entries (9–14): island patterns (PFPat9–PFPat14).
#
# These indices directly reference pattern IDs in patterns.py.
# The bank pattern ID is selected based on the river's PF1PatId state.
BANK_PTR_TAB = [
    0,  # PFPat0 – empty river
    1,  # PFPat1 – single-pixel edge
    2,  # PFPat2 – two-pixel edge
    3,  # PFPat3 – three-pixel edge
    4,  # PFPat4 – four-pixel edge
    5,  # PFPat5 – five-pixel edge
    6,  # PFPat6 – six-pixel edge
    7,  # PFPat7 – seven-pixel edge
    8,  # PFPat8 – full bank (eight-pixel)
    9,  # PFPat9 – island 1-col
    10, # PFPat10 – island 2-col
    11, # PFPat11 – island 3-col
    12, # PFPat12 – island 4-col
    13, # PFPat13 – island 5-col
    14, # PFPat14 – island 6-col
]

# ── FuelTab0-4 (JTZ fuel depot shapes) ──────────────────────────────
# Fuel depot patterns: each is a list of row byte arrays.
# The game selects a fuel tab based on difficulty and position.
#
# FuelTab0: narrow fuel depot (single column)
# FuelTab1-4: wide fuel depots (multiple columns)
#
# Shape values: each row is a byte where bit 7 = leftmost pixel (TIA MSB-first).
FUEL_TAB_0 = [
    # Narrow fuel depot (1 column wide)
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
]

FUEL_TAB_1 = [
    # Wide fuel depot (3 columns wide)
    0xE0, 0xE0, 0xE0, 0xE0, 0xE0, 0xE0,
    0xE0, 0xE0, 0xE0, 0xE0, 0xE0, 0xE0,
]

FUEL_TAB_2 = [
    # Wide fuel depot (5 columns wide)
    0xF8, 0xF8, 0xF8, 0xF8, 0xF8, 0xF8,
    0xF8, 0xF8, 0xF8, 0xF8, 0xF8, 0xF8,
]

FUEL_TAB_3 = [
    # Wide fuel depot (7 columns wide)
    0xFC, 0xFC, 0xFC, 0xFC, 0xFC, 0xFC,
    0xFC, 0xFC, 0xFC, 0xFC, 0xFC, 0xFC,
]

FUEL_TAB_4 = [
    # Wide fuel depot (7 columns wide under MSB-first: 0xFE = 0b11111110)
    0xFE, 0xFE, 0xFE, 0xFE, 0xFE, 0xFE,
    0xFE, 0xFE, 0xFE, 0xFE, 0xFE, 0xFE,
]

# All fuel tabs indexed by tab ID (0–4)
ALL_FUEL_TABS = [
    FUEL_TAB_0, FUEL_TAB_1, FUEL_TAB_2, FUEL_TAB_3, FUEL_TAB_4,
]


def get_enemy_id(sequence_index: int) -> int:
    """Get enemy ID from EnemyIdTab at the given sequence index."""
    return ENEMY_ID_TAB[sequence_index % len(ENEMY_ID_TAB)]


def get_fuel_shape(fuel_tab_id: int) -> list[int]:
    """Get fuel depot shape bytes from the given fuel tab."""
    if 0 <= fuel_tab_id <= 4:
        return ALL_FUEL_TABS[fuel_tab_id]
    return FUEL_TAB_0


def get_bank_pattern_id(index: int) -> int:
    """Get the bank pattern ID from BankPtrTab."""
    if 0 <= index < len(BANK_PTR_TAB):
        return BANK_PTR_TAB[index]
    # Default to PFPat0 if out of range
    return 0
