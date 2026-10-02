"""
River Raid configuration constants.

All values are sourced from Thomas Jentzsch's 2001 disassembly of the
River Raid 4KB USA ROM. See reference/jentzsch_2001/River Raid.asm.

Color values are derived from the canonical Atari 2600 NTSC palette
captured by the Stella-emulator project (Bradford W. Mott) and Paul
Slocum's original z26 table — see port/core/ntsc_palette.py.
"""

from port.core.ntsc_palette import tia_to_rgb

# ── Screen ──────────────────────────────────────────────────────────
SCREEN_WIDTH = 320
SCREEN_HEIGHT = 240
SCALE = 2
WINDOW_WIDTH = SCREEN_WIDTH * SCALE
WINDOW_HEIGHT = SCREEN_HEIGHT * SCALE
FPS = 60

# ── NTSC Colors (canonical Stella NTSC_Standard table) ────────────
# Each color is (R, G, B) with 0-255 range, sourced from the canonical Atari 2600
# NTSC palette in port/core/ntsc_palette.py — the same table used by Stella, z26,
# MAME, and every modern Atari emulator. Each key maps to the TIA color-lum code
# documented in Steve Wright's 1979 Atari 2600 Programmer's Guide §4.0.
#
# VCS register values (NTSC) per Steve Wright §4.0:
#   $00=BLACK  $06=GREY      $0C=LIGHT_GREY  $10=BROWN
#   $1C=YELLOW $2A=ORANGE    $48=RED         $80=DARK_BLUE
#   $84=BLUE   $B0=CYAN      $D2=GREEN       $DA=LIGHT_GREEN
COLORS = {
    # Background / road / panel
    "BLACK":         tia_to_rgb(0x00),       # $00 — TV black, behind everything
    "WHITE":         tia_to_rgb(0x0E),       # max-luma greyscale (no NTSC white register)
    "GREY":          tia_to_rgb(0x06),       # $06 — road / ground
    "LIGHT_GREY":    tia_to_rgb(0x0C),       # $0C — fuel depot, road stripe accent
    "BROWN":         tia_to_rgb(0x10),       # $10 — house body
    "YELLOW":        tia_to_rgb(0x1C),       # $1C — HUD text, road stripe
    # Water + banks
    "BLUE":          tia_to_rgb(0x84),       # $84 — water background (COLUBK)
    "DARK_BLUE":     tia_to_rgb(0x80),       # $80 — heli body
    "GREEN":         tia_to_rgb(0xD2),       # $D2 — river bank (dark luma-1 hue-13)
    "LIGHT_GREEN":   tia_to_rgb(0xDA),       # $DA — luma-5 hue-13 (HUD / non-bank use)
    "BANK_LIGHT_GREEN": tia_to_rgb(0xD6),    # $D6 — river bank (light luma-3 hue-13)
    # Sprite / accent
    "ORANGE":        tia_to_rgb(0x2A),       # $2A — explosion, heli accent
    "RED":           tia_to_rgb(0x48),       # $48 — bridge, fuel text
    "CYAN":          tia_to_rgb(0xB0),       # $B0 — heli accent
    # Derived enemy-family gradients (JTZ ColorPtrTab cycles through these)
    "PLANE_GREEN":   tia_to_rgb(0xAC),       # $AC — plane color 1 (green)
    "PLANE_GREY":    tia_to_rgb(0x9C),       # $9C — plane color 2 (cyan)
    "PLANE_DARK":    tia_to_rgb(0x8C),       # $8C — plane color 3 (blue-cyan)
    "SHIP_WHITE":    tia_to_rgb(0xA8),       # $A8 — ship color 1
    "SHIP_LIGHT":    tia_to_rgb(0x32),       # $32 — ship color 2 (light grey)
    "BRIDGE_RED":    tia_to_rgb(0x20),       # $20 — bridge color 1 (orange-red)
    "BRIDGE_DARK":   tia_to_rgb(0x14),       # $14 — bridge color 2 (gold-dim)
    "BRIDGE_DARKEST":tia_to_rgb(0x12),       # $12 — bridge color 3 (darkest)
    "BG":            tia_to_rgb(0x00),       # TV black (alias)
}

# ── Game Constants (from JTZ defines) ───────────────────────────────
# Order matters: SCREEN_HEIGHT → JET_Y → ROAD_HEIGHT → derived JET_TOP_Y.
# Python evaluates module-level assignments top to bottom, so each constant
# must be defined before it is referenced. The previous layout put JET_Y and
# PLAYER_JET_ROWS at the JET_Y slot but referenced JET_Y in the anchor math
# BEFORE the JET_Y literal was defined → NameError. Layout below puts
# JET_Y + ROAD_HEIGHT together, then derives everything else.
NUM_BLOCKS = 6            # Max objects on screen (JTZ: NUM_BLOCKS)
SECTION_BLOCKS = 16       # Blocks per stage (JTZ: SECTION_BLOCKS)
BLOCK_SIZE = 32           # Lines per block (JTZ: BLOCK_SIZE)
NUM_LINES = 160           # Main kernel lines (JTZ: NUM_LINES)
MAX_LEVEL = 48            # Difficulty levels (JTZ: MAX_LEVEL)

# JET_Y = 19 is the JTZ raw constant: scanlines from the BOTTOM of the
# NUM_LINES=160 kernel upward. See reference/jentzsch_2001/River Raid.asm
# line 108 + the `CPY #JET_Y` triggers in the kernel — the Atari beam Y
# counter counts DOWN as the beam moves down the screen, so the kernel
# fires when Y reaches `JET_Y` counting FROM the bottom up.
JET_Y = 19                # JTZ: JET_Y (lines-from-bottom anchor)
ROAD_HEIGHT = 13          # Lines for road (JTZ: ROAD_HEIGHT)

# Jet-anchor math for our 240-tall internal buffer:
#   playfield top row      = ROAD_HEIGHT              = 13
#   playfield bottom row   = SCREEN_HEIGHT - ROAD_HEIGHT = 227
#   jet bottom row         = playfield_bottom - JET_Y    = 208
#   jet top row (sprite_y) = jet_bottom - sprite_height = 190
# (verified by thinker-with-files-gemini against jentzsch_2001 asm)
PLAYER_JET_ROWS = 18      # JetStraight sprite height (extraction JSON row count).
PLAYER_JET_BOTTOM_GAP = JET_Y   # Re-export for anchor-math readability.
JET_TOP_Y = (SCREEN_HEIGHT - ROAD_HEIGHT      # bottom of playfield
             - PLAYER_JET_BOTTOM_GAP           # gap below jet (= JTZ JET_Y)
             - PLAYER_JET_ROWS)                # sprite height, working up from bottom
# Bounded (not literal) check: catches real drift (wrong SCREEN_HEIGHT,
# miscalculated stair, etc.) without re-breaking every time someone tunes
# a road strip or sprite scale. Literal "== 190" was a footgun replaced
# per code-reviewer.
assert 50 < JET_TOP_Y < SCREEN_HEIGHT - 30, (
    f"JET_TOP_Y={JET_TOP_Y} out of expected range "
    f"(must be between 50 and {SCREEN_HEIGHT - 30}). "
    f"Derived as SCREEN_HEIGHT({SCREEN_HEIGHT}) - ROAD_HEIGHT({ROAD_HEIGHT}) "
    f"- JET_Y({JET_Y}) - PLAYER_JET_ROWS({PLAYER_JET_ROWS})."
)

INTRO_SCROLL = 48         # Scroll-in counter (JTZ: INTRO_SCROLL)
DIGIT_H = 8               # Height of score digits (JTZ: DIGIT_H)

# ── Shape IDs (from JTZ shape ID defines) ───────────────────────────
# These match the Shape1IdLst byte values in the original.
SHAPE_EXPLOSION0 = 0
SHAPE_EXPLOSION1 = 1
SHAPE_EXPLOSION2 = 2
SHAPE_PLANE = 4
SHAPE_HELI0 = 5
SHAPE_HELI1 = 6
SHAPE_SHIP = 7
SHAPE_BRIDGE = 8
SHAPE_HOUSE = 9
SHAPE_FUEL = 10

# ── Score Values (from JTZ ScoreTab) ────────────────────────────────
SCORES = {
    "EXPLOSION0": 0,
    "EXPLOSION1": 0,
    "EXPLOSION2": 0,
    "EXPLOSION3": 0,
    "PLANE": 100,
    "HELI0": 60,
    "HELI1": 60,
    "SHIP": 30,
    "BRIDGE": 500,
    "HOUSE": 0,
    "FUEL": 80,
}

# ── Enemy IDs (from JTZ EnemyIdTab) ─────────────────────────────────
# These are the IDs stored in the enemy list during gameplay.
# Used to determine type-specific behavior (patrol speed, etc.).
ENEMY_NONE = 0
ENEMY_EXPLOSION0 = 1
ENEMY_EXPLOSION1 = 2
ENEMY_EXPLOSION2 = 3
ENEMY_PLANE = 4
ENEMY_HELI0 = 5
ENEMY_HELI1 = 6
ENEMY_SHIP = 7
ENEMY_BRIDGE = 8
ENEMY_HOUSE = 9
ENEMY_FUEL = 10

# ── Game Modes (from JTZ gameMode variable) ─────────────────────────
MODE_RUNNING = 0
MODE_GAME_OVER = -1
MODE_SCROLL_IN = 1  # 1..48 = intro scroll counter

# ── Player States (from JTZ player1State block) ─────────────────────
# $BD: level, $BE: randomLoSave, $BF: randomHiSave, $C0: livesPtr
# $C1: state (0=flying, 1=explosion, 2=crash into PF)
PLAYER_FLYING = 0
PLAYER_EXPLODING = 1
PLAYER_CRASHED = 2

# ── Player Movement (from JTZ playerX, speedX, speedY) ──────────────
PLAYER_MAX_SPEED_X = 3    # Max X speed (JTZ: $B4 speedX)
PLAYER_MAX_SPEED_Y = 2    # Max Y speed (JTZ: $B5 speedY)
PLAYER_ACCEL_X = 1
PLAYER_DECEL_X = 2

# ── Fuel (from JTZ fuelLo, fuelHi) ──────────────────────────────────
FUEL_MAX = 255            # Max fuel value (8-bit)
FUEL_DRAIN_RATE = 1       # Fuel lost per frame (JTZ: $20 = 32 per frame → ~2 sec tank)
FUEL_REFUEL_RATE = 2      # Fuel gained per frame when over fuel depot

# ── Missile (from JTZ missileY, missileX, missileFlag) ──────────────
MISSILE_SPEED_Y = 4
MISSILE_WIDTH = 1
MISSILE_HEIGHT = 8

# ── River (from JTZ PF1Ptr, PF2Ptr, PF1PatId, PF_State) ─────────────
RIVER_MIN_WIDTH = 4       # Minimum valley width
RIVER_MAX_WIDTH = 12      # Maximum valley width
RIVER_WIDTH_STEP = 1      # Width change per block

# ── Multiplier (from JTZ scoring logic) ─────────────────────────────
MULTIPLIER_START = 10
MULTIPLIER_MIN = 1
MULTIPLIER_DECAY_RATE = 5  # Frames between decay

# ── Lives ───────────────────────────────────────────────────────────
LIVES_START = 3
LIVES_MAX = 9
