# River Raid Python Port — Handover

## Project Status

**87 tests passing.** Core game loop, entity system, rendering infrastructure, input handling, ROM-driven spawning, and ROM-driven river patterns are implemented. The Python port is the most advanced implementation — ahead of the vanilla JS reference (`index.html`) which uses procedural random generation.

---

## Architecture

```
riverraid-rom-extract/
├── port/                          # Python port (Pygame)
│   ├── main.py                    # Entry point
│   ├── core/
│   │   ├── config.py              # Constants (screen dims, colors, score values)
│   │   └── state.py               # Game state management
│   ├── entities/
│   │   ├── player.py              # Player jet (states, fuel, lives)
│   │   ├── enemy.py               # Enemy types (ship, heli, plane, bridge, house)
│   │   ├── bullet.py              # Player bullets
│   │   ├── explosion.py           # Explosion animations (3 stages)
│   │   └── fuel.py                # Fuel depots
│   ├── systems/
│   │   ├── scoring.py             # Score + multiplier decay
│   │   ├── collision.py           # Collision detection (player/river, bullet/enemy)
│   │   ├── river.py               # River generation (PFPat-driven)
│   │   ├── spawning.py            # Enemy/fuel spawning (EnemyIdTab-driven)
│   │   ├── patterns.py            # PFPat0-PFPat14 byte arrays from ROM
│   │   └── tabs.py                # ROM tables (EnemyIdTab, ShapePosTab, BankPtrTab, FuelTab)
│   ├── rendering/
│   │   ├── screen.py              # Main screen/renderer
│   │   ├── hud.py                 # HUD (score, fuel gauge)
│   │   └── effects.py             # Visual effects
│   └── input/
│       └── controls.py            # Keyboard/gamepad input
├── reference/                     # JTZ disassembly + ROM
│   ├── jentzsch_2001/             # Thomas Jentzsch's complete disassembly
│   └── riverraid.rom              # 4KB USA ROM
├── extraction/                    # ROM extraction data (JSON, PNG, HTML reports)
├── tests/                         # 87 passing tests
│   ├── test_entities.py           # Entity creation and behavior (20 tests)
│   ├── test_collision.py          # Collision detection (6 tests)
│   ├── test_config.py             # Constants validation (6 tests)
│   ├── test_scoring.py            # Score/multiplier logic (6 tests)
│   ├── test_sprites.py            # Sprite byte-to-surface conversion (6 tests)
│   ├── test_player.py             # Player movement/fuel/crash (7 tests)
│   ├── test_river.py              # River generation (8 tests)
│   ├── test_patterns.py           # PFPat data integrity (11 tests)
│   └── test_tabs.py               # ROM table data (16 tests)
├── index.html                     # Vanilla JS reference (playable in browser)
├── PORT_PLAN.md                   # Master plan (8 phases)
├── README.md
└── handover.md                    # This file
```

---

## What's Done

### 1. ROM Table Infrastructure (`port/systems/tabs.py`)
- **EnemyIdTab**: `[Ship, Heli0, Ship, Heli0, Plane, Ship, Heli0, Heli0]` — deterministic enemy sequence
- **ShapePosTab**: X-positions for enemy/fuel spawn (11 entries, right-side ≥100 / left-side ≤30 pairs)
- **BankPtrTab**: Identity mapping `[0..14]` — PF state to pattern ID
- **FuelTab0-4**: Fuel depot width definitions (5 entries)
- Helper functions: `get_enemy_id()`, `get_bank_pattern_id()`, `get_fuel_shape()`

### 2. Playfield Patterns (`port/systems/patterns.py`)
- **PFPat0-PFPat14**: 15 byte arrays extracted from JTZ disassembly
- 24-28 rows each, 8 bits per row (left-to-right bank edge)
- Covers: river banks (PFPat0-8), islands (PFPat9-14), transition tapers
- Helper functions: `get_pattern(id)`, `get_row(id, index)` with wrapping

### 3. River Generation (`port/systems/river.py` — refactored)
- Replaced hardcoded random wedges with `BankPtrTab`-driven pattern selection
- `pf1_pat_id` tracks current pattern ID
- `get_playfield_data()` returns left/right bank rows from pattern bytes
- Maintains backward compatibility with collision logic

### 4. Spawning System (`port/systems/spawning.py` — refactored)
- Replaced random probability spawning with `EnemyIdTab` cycling
- Uses `ShapePosTab` for deterministic X-positions per enemy type
- Fuel spawning tied to section counter (every 4 sections)
- Bridge spawning at section boundaries

### 5. Entity System
- **Player**: 3 states (straight, moving, explode), fuel management, lives
- **Enemies**: Ship, Heli0, Heli1, Plane, Bridge, House with sprite flipping
- **Bullets**: Single active bullet (Atari limitation)
- **Explosions**: 3 stages (small, medium, large) with A/B color variants

### 6. Rendering
- `screen.py`: Main renderer, offscreen buffer, 2x scaling
- `hud.py`: Score, multiplier, lives, fuel gauge (5 segments)
- `effects.py`: Explosion sprite rendering
- Sprite system: byte arrays → pixel grids → colored rects

### 7. Input
- Keyboard: Arrow keys/WASD (move), Space (fire)
- Just-pressed tracking for single-shot firing

### 8. Test Suite (87 tests)
- Pattern data integrity, boundary wrapping, ID validation
- Table lengths, deterministic values, wrapping behavior, side alternation
- Entity creation, movement, collision, scoring, fuel logic

---

## What's Left

### Priority 1: Rendering Update
`port/rendering/screen.py` still draws solid-colored river banks. Needs refactoring to:
- Decode `get_playfield_data()` byte rows into actual pixel patterns
- Render PFPat bytes as left/right bank edges (bitwise per row)
- Apply alternating row colors (GREEN/LIGHT_GREEN like the original)
- Support island rendering (PFPat9-14: interior gaps in the river)

### Priority 2: Fuel Tab Integration
- `FuelTab` width data is defined in `tabs.py` but not fully wired into spawning or rendering
- Fuel depot sprites (FuelA/FuelB) need to use correct width from `get_fuel_shape()`

### Priority 3: Game State Flow
- Title screen → scroll-in → playing → game over state machine
- Intro animation (player jet scrolls in from top)
- Game over screen with final score display

### Priority 4: Gameplay Verification
- Visual comparison against original Atari 2600 (or emulator)
- Verify pattern shapes match expected bank wedge geometry
- Verify enemy spawn positions and movement patterns
- Tune difficulty scaling (section count, width variance, spawn frequency)

### Priority 5: Sound
- Atari 2600 has 2 channels (shot/explosion noise, engine drone)
- ROM contains audio subroutines (TIA $2800/$2801 writes)
- Deferred per PORT_PLAN.md Phase 6

### Priority 6: Polish
- 2-player support (swap players)
- Difficulty selection
- Pause functionality
- Screen flash on explosion

---

## Key Design Decisions

1. **ROM-driven over procedural**: All spawning and river patterns now use extracted ROM tables (EnemyIdTab, ShapePosTab, BankPtrTab, PFPat0-14) instead of random generation. This ensures deterministic, authentic behavior.

2. **JTZ disassembly as ground truth**: Thomas Jentzsch's 2001 disassembly is the authoritative reference. All tables, patterns, and sprite data are cross-referenced against it.

3. **Internal resolution 320×240, scaled 2×**: Matches VCS native resolution. Offscreen buffer renders at 320×240, then scaled to 640×480 for display.

4. **Color palette from NTSC VCS registers**: All colors use original NTSC register values ($00-$DA). Derived gradient colors added for sprite shading.

5. **Single bullet rule**: Enforces Atari 2600 hardware limitation — only one bullet active at a time.

---

## Running the Project

```bash
# Run tests
python -m pytest tests/ -v

# Run the game
python port/main.py

# Install dependencies
pip install pygame pytest
```

---

## Reference

- **Thomas Jentzsch disassembly** (2001): Complete labeled 6502 source — `reference/jentzsch_2001/`
- **Atari 2600 ROM**: `reference/riverraid.rom` (4KB USA version)
- **PORT_PLAN.md**: 8-phase development plan (sound, 2-player, polish deferred)
- **index.html**: Vanilla JS playable reference (procedural, not ROM-driven)
