# River Raid Port — Master Plan

## Overview

Transform the existing ROM data extraction into a fully playable River Raid port.
Leverage Thomas Jentzsch's publicly available complete disassembly as the primary
reference (it covers the exact same 4KB USA ROM) and the existing extraction data
(sprites, tables, playfield patterns) for asset verification.

---

## Key Discovery: Thomas Jentzsch's Disassembly Exists

Thomas Jentzsch (JTZ) published a **complete, labeled disassembly** of River Raid
in 2001. It is available from:
- **romhacking.net** (doc #518): Full source, compiles with DASM + vcs.h
- **Scribd**: Labeled assembler source code with comments
- **Stella mailing list** (Aug 2001): Original release with summary document

This disassembly includes:
- Complete 6502 source with meaningful labels
- Memory map and variable definitions
- Full kernel/playfield rendering code
- Enemy AI, scoring, fuel logic
- Sprite and playfield data

**This means we do NOT need to reverse-engineer the code from scratch.**
We can use JTZ's disassembly as the authoritative reference and build our port
on top of it, adding our own extraction data for cross-verification.

---

## Architecture: Two-Tier Approach

### Tier 1: Reference Disassembly (JTZ's Code)
Use JTZ's disassembly as the ground truth for:
- Variable names and memory map
- Subroutine structure and call graph
- Game logic (scoring, fuel, enemies, collision)
- Kernel timing and playfield rendering

### Tier 2: Our Extraction Data (Verification Layer)
Cross-reference our extraction against JTZ's disassembly:
- Sprite byte patterns → verify against JTZ's sprite tables
- Data tables → verify against JTZ's table definitions
- Playfield patterns → verify against JTZ's PFPat tables
- ASM snippets → verify against JTZ's subroutine implementations

Where they agree: confirmed. Where they differ: investigate and resolve.

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Set up the project structure

```
riverraid-port/
├── README.md
├── requirements.txt          # Python dependencies
├── Makefile                  # Build orchestration
│
├── reference/                # JTZ disassembly (reference only, not compiled)
│   ├── riverraid.asm          # JTZ's disassembly
│   ├── vcs.h                  # TIA register definitions
│   └── README.md              # Attribution and usage notes
│
├── extraction/               # Our ROM extraction data (already exists)
│   ├── riverraid_data_extract.json
│   ├── riverraid_labeled_sprites.json
│   ├── riverraid_annotated_asm_map.json
│   ├── riverraid_extract_report.json
│   ├── riverraid_attached_rom_sprite_report.json
│   ├── riverraid_player_jet_report.json
│   ├── riverraid_plane_family_report.json
│   ├── riverraid_enemy_air_compare.json
│   ├── riverraid_five_more_visible_objects.json
│   ├── riverraid_next_five_visible_objects.json
│   ├── riverraid_playfield_next_five.json
│   ├── riverraid_verified_playfield_report.json
│   ├── riverraid_ascii_runs.txt
│   ├── riverraid_roman_extract_candidates.html
│   ├── riverraid_*.html        # All extraction HTML reports
│   ├── riverraid_*.png         # Extracted sprite sheets, crops
│   └── riverraid.rom           # The 4KB ROM
│
├── port/                     # The actual port implementation
│   ├── __init__.py
│   ├── main.py               # Entry point
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── game.py           # Main game loop
│   │   ├── state.py          # Game state management
│   │   └── config.py         # Constants and configuration
│   │
│   ├── assets/
│   │   ├── __init__.py
│   │   ├── sprites.py        # Sprite loading and rendering
│   │   ├── playfield.py      # Playfield/river generation
│   │   └── sounds.py         # Sound effects (if extracted)
│   │
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── player.py         # Player jet (3 states)
│   │   ├── enemy.py          # Enemy types (ship, heli, plane, bridge, house)
│   │   ├── fuel.py           # Fuel depots
│   │   ├── bullet.py         # Player bullets
│   │   └── explosion.py      # Explosion animations
│   │
│   ├── systems/
│   │   ├── __init__.py
│   │   ├── scoring.py        # Score calculation (from ScoreTab)
│   │   ├── fuel.py           # Fuel consumption logic
│   │   ├── spawning.py       # Enemy/fuel spawning (from EnemyIdTab, ShapePosTab)
│   │   ├── collision.py      # Collision detection
│   │   └── river.py          # River generation (from PFPat tables)
│   │
│   ├── rendering/
│   │   ├── __init__.py
│   │   ├── screen.py         # Main screen/renderer
│   │   ├── hud.py            # HUD (score, fuel gauges)
│   │   └── effects.py        # Visual effects (explosions, flashes)
│   │
│   └── input/
│       ├── __init__.py
│       └── controls.py       # Input handling (fire, left, right)
│
├── verify/                   # Verification tools
│   ├── __init__.py
│   ├── compare_sprites.py    # Compare extracted sprites vs JTZ
│   ├── compare_tables.py     # Compare data tables vs JTZ
│   └── compare_rom.py        # Byte-level ROM comparison
│
└── tests/
    ├── __init__.py
    ├── test_sprites.py       # Sprite extraction verification
    ├── test_tables.py        # Table data verification
    ├── test_entities.py      # Entity behavior tests
    └── test_scoring.py       # Score calculation tests
```

### 1.2 Acquire JTZ disassembly
- Download from romhacking.net (doc #518) or Stella mailing list archive
- If unavailable, reconstruct from the Scribd document
- Store in `reference/` with attribution

### 1.3 Install dependencies
- `pygame` — rendering and input
- `numpy` — optional, for byte pattern analysis
- `pytest` — testing

---

## Phase 2: Core Engine (Week 3-4)

### 2.1 Game state machine
Based on JTZ's disassembly, implement the main game states:
- `TITLE_SCREEN` — title, options (mono/colour, 1P/2P)
- `PLAYING` — main gameplay loop
- `GAME_OVER` — final score display
- `NEW_GAME` — transition between games

### 2.2 Player jet
- Implement 3 states from our extraction: `JetStraight`, `JetMove`, `JetExplode`
- Movement: left/right (joystick), vertical (auto-scroll + manual)
- Fuel consumption: continuous drain, refuel from fuel depots
- Shooting: fire button triggers bullets

### 2.3 Input handling
- Keyboard: Arrow keys + spacebar (fire)
- Gamepad: D-pad + button (pygame supports this natively)
- Mirrors Atari's single-controller design

### 2.4 Main game loop
Structure based on JTZ's main loop:
```
while game_state == PLAYING:
    update_input()
    update_player()
    update_enemies()
    update_fuel()
    update_bullets()
    update_explosions()
    check_collisions()
    update_scoring()
    update_fuel_global()
    update_river()
    check_game_over()
    render()
```

---

## Phase 3: Entity System (Week 5-6)

### 3.1 Enemy types (from EnemyIdTab and sprite extraction)
Each enemy type has:
- Sprite bytes (from `riverraid_labeled_sprites.json`)
- Shape pointers (from `shapePtr1aTab` / `shapePtr1bTab`)
- X starting position (from `ShapePosTab`)
- Score value (from `ScoreTab`)
- Movement pattern (from JTZ disassembly)

| Type | Enemy ID | Score | Sprite Family | Movement |
|------|----------|-------|---------------|----------|
| Ship | ID_SHIP | 50 | ShipA/ShipB | Slow horizontal |
| Heli0 | ID_HELI0 | 100 | Heli0A/Heli0B | Moderate horizontal |
| Heli1 | ID_HELI1 | 100 | Heli1A/Heli1B | Moderate horizontal |
| Plane | ID_PLANE | 300 | PlaneA/PlaneB | Fast horizontal |
| Bridge | ID_BRIDGE | 500 | BridgeA/BridgeB | Stationary (level end) |
| House | ID_HOUSE | 200 | HouseA/HouseB | Stationary |
| Fuel | ID_FUEL | 50 | FuelA/FuelB | Slow vertical descent |

### 3.2 Explosion system
- 3 explosion stages: Explosion0 (small), Explosion1 (medium), Explosion2 (large)
- Each has A/B variants (2-player color differentiation)
- Animation: sequential frame display from sprite data

### 3.3 Bullet system
- Single bullet at a time (Atari limitation)
- Bullet sprite from player jet's "move" frame (the gun port)
- Speed: constant upward movement

---

## Phase 4: River Generation (Week 7-8)

### 4.1 Playfield data
Using our extracted PFPat0-PFPat14 patterns:
- These define river bank wedge shapes
- Combined with shape position tables for horizontal offset
- BankPtrTab determines which pattern to use

### 4.2 River algorithm
Based on JTZ's river generation:
- River width varies over time (controlled by a counter)
- River center shifts left/right gradually
- Obstacles (bridges, houses) placed at specific intervals
- Fuel depots spawn at calculated positions (from FuelTab tables)

### 4.3 Scrolling
- River scrolls downward (giving illusion of forward movement)
- Speed increases with score/difficulty
- Player can move up/down to change scroll speed

---

## Phase 5: HUD & Scoring (Week 9)

### 5.1 Score display
- Digits from our extraction (or standard Atari-style 7-segment)
- ScoreTab provides score values
- Multiplier system (x1, x2, x3, x5, x10) — decreases when not scoring

### 5.2 Fuel gauge
- Fuel bars from FuelTab0-FuelTab4 (5 levels)
- Animated fuel depletion
- Fuel A / Fuel B for 2-player display
- "FUEL" text from extraction

### 5.3 Additional HUD elements
- Score multiplier indicator
- Enemy type icons (when shot)
- Extra life notification
- Game over screen with final score

---

## Phase 6: Sound (Week 10)

### 6.1 Atari 2600 audio
The 2600 has 2 audio channels:
- Channel 1: Sound effects (shots, explosions)
- Channel 2: Background noise (engine drone)

### 6.2 Sound extraction strategy
- Analyze ROM for audio-related subroutines (look for TIA $2800/$2801 writes)
- Cross-reference with JTZ's audio code
- Map frequency/duration tables to sound effects

### 6.3 Sound implementation
- Use pygame's audio or a simple synthesizer
- Engine drone: low-frequency oscillator, slight pitch variation
- Shots: short noise burst
- Explosions: noise with decaying amplitude
- Fuel pickup: ascending tone

---

## Phase 7: Verification & Polish (Week 11-12)

### 7.1 Cross-verification
Run our extraction data against JTZ's disassembly:
```python
# verify/compare_sprites.py
for sprite_name in extracted_sprites:
    assert extracted_sprites[sprite_name] == jtz_sprites[sprite_name]

# verify/compare_tables.py
for table_name in extracted_tables:
    assert extracted_tables[table_name] == jtz_tables[table_name]
```

### 7.2 Gameplay comparison
- Play both the emulator and our port side-by-side
- Compare: enemy spawn patterns, scoring, fuel consumption, difficulty scaling
- Adjust parameters to match original behavior

### 7.3 Polish
- Add title screen with proper styling
- Add game over screen
- Add 2-player support (swap players subroutine)
- Add difficulty selection
- Add pause functionality
- Add screen flash on explosion (Atari-style)

---

## Phase 8: Distribution (Week 13)

### 8.1 Packaging
- Single-file executable (PyInstaller)
- Or web version (Pygame → PyGame.js → browser)
- Or pure Python (for educational purposes)

### 8.2 Documentation
- Attribution to Atari (original creator) and JTZ (disassembly)
- How to play
- Technical notes on the extraction process

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| JTZ disassembly unavailable | Low | Available from multiple sources |
| JTZ ROM version differs from ours | Low | Compare ROM hashes; JTZ likely uses same 4KB USA |
| Sound data ambiguous | Medium | Prioritize gameplay; sound is secondary |
| pygame performance on old hardware | Low | Target modern systems; optimize if needed |
| Scope creep | High | Strict phase boundaries; MVP = no sound |

---

## MVP Definition (Minimum Viable Product)

A playable River Raid with:
- [x] Player jet with 3 states
- [x] All enemy types (ship, heli, plane, bridge, house, fuel)
- [x] River scrolling with variable width
- [x] Shooting and collision detection
- [x] Score and fuel display
- [x] Game over / restart
- [ ] Sound effects (deferred to Phase 6)
- [ ] 2-player support (deferred to Phase 7)

---

## Immediate Next Steps

1. **Download JTZ disassembly** from romhacking.net or Stella mailing list
2. **Create project structure** as defined in Phase 1.1
3. **Install dependencies** (pygame, pytest)
4. **Start with Phase 2**: Core engine — get a blank window that cycles through title screen → playing → game over
5. **Cross-reference** our sprite extraction against JTZ's sprite tables
6. **Implement entities** using our extracted sprite bytes (verified against JTZ)
