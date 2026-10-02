"""
River Raid — Enemy and fuel spawning system.

Mirrors JTZ block generation (lines 2075–2241):
  - Uses shared LFSR for all randomness (enemy selection, X position, fuel)
  - EnemyIdTab: LFSR mask result indexes into [SHIP, HELI0, HELI1, SHIP]
  - ShapePosTab: X position indexed by PF1PatId from river
  - Level-dependent probability: (100-level)*2 vs randomHi

JTZ flow per block (after skip-first-block):
  1. JSR NextRandom16           → advances LFSR once (used for threshold)
  2. LDA #$64; SBC level; ASL  → threshold = (100-level)*2
  3. CMP randomHi; BCC .newEnemy  → ~48%..88% chance of enemy
  4. BIT randomLo; BVC .newFuel   → ~50% chance of fuel (bit 7)
  5. Else → house

Enemy selection (JTZ line 2123-2132):
  - Level < 3: mask = %001 (ships + helis only, idx 0 or 1)
  - Level >= 3: mask = %111 (adds planes + heli1, idx 0..3)
  - idx = randomHi & mask; enemy = EnemyIdTab[idx]

X positioning (JTZ line 2114, 2237):
  - ShapePosTab indexed by PF1PatId from river
  - CalcPosX: (coarse+1) & 0xF → fine; ((coarse+1)>>4)+fine → carry check → XOR $07
"""

from port.core import config
from port.systems.random import LFSR
from port.systems.tabs import ENEMY_ID_TAB, SHAPE_POS_TAB


class Spawner:
    """Manages enemy and fuel spawning using shared LFSR."""

    def __init__(self, lfsr: LFSR):
        self.lfsr = lfsr
        self.river = None  # Set by game; needed for PF1PatId
        self._sprite_loader = None

        # Block generation state (mirrors JTZ variables)
        self._block_counter = 0          # Lines scrolled within current block
        self._section_counter = 0        # Blocks spawned in current section
        self._section_blocks = 16        # Blocks per section
        self._block_part = 2             # 2=first part, 1=second part
        # Difficulty level (synced from river.level via property); needs to
        # exist independently so _spawn_block() / _is_straight_level() can
        # read it before a River is wired up. Initialized to level 1.
        self._level = 1

        # Output buffers
        self._new_enemies: list = []
        self._new_fuel: list = []      

    def update(self):
        """Update spawner each game tick (one frame).

        Clears the spawn buffers at the *start* of the method so the
        Game loop's `get_new_enemies()` / `get_new_fuel()` reads (which
        run AFTER `Spawner.update()` returns each frame) have already
        drained the prior frame's buffer via `self.enemies.extend(...)`.
        The previous implementation cleared AFTER `_spawn_block()` in
        the SAME call — which silently dropped every newly-spawned
        entity on the floor, so no enemies ever appeared and no
        scoring was possible.
        """
        self._new_enemies.clear()
        self._new_fuel.clear()
        self._block_counter += 1

        if self._block_counter >= config.BLOCK_SIZE:
            self._block_counter = 0
            self._block_part -= 1
            if self._block_part == 0:
                self._block_part = 2  # Wrap: second part → next block first part

            self._spawn_block()

    def _spawn_block(self):
        """Generate entities for one block — mirrors JTZ lines 2075–2241."""
        self._section_counter += 1

        # End of section → bridge
        if self._section_counter >= self._section_blocks:
            self._section_counter = 0
            self._spawn_bridge()
            return

        # Skip first part of first block of section (JTZ line 2077-2081)
        # sectionBlock=1 means first block, blockPart=2 (first part)
        if self._section_counter == 1 and self._block_part == 2:
            return

        # JTZ line 2083-2089: decide enemy vs fuel vs house
        # LDA #$64; SBC level; ASL; CMP randomHi; BCC .newEnemy
        self.lfsr.next()  # First NextRandom16 for threshold
        threshold = ((100 - self._level) << 1) & 0xFF
        if self.lfsr.peek_hi() < threshold:
            self._spawn_enemy()
        elif not (self.lfsr.peek_lo() & 0x80):
            self._spawn_fuel()
        else:
            self._spawn_house()

    def _spawn_enemy(self):
        """Spawn an enemy — mirrors JTZ lines 2123–2235."""
        # JTZ line 2124-2129: level-dependent mask
        mask = 0x01 if self._level < 3 else 0x07
        self.lfsr.next()  # Second NextRandom16 for enemy type
        idx = self.lfsr.peek_hi() & mask
        self.lfsr.next()  # Advance past peek
        enemy_id = ENEMY_ID_TAB[idx % len(ENEMY_ID_TAB)]

        # Get X position from ShapePosTab indexed by PF1PatId
        pf1_id = self._get_pf1_pat_id()
        x_coarse = SHAPE_POS_TAB[pf1_id] if pf1_id < len(SHAPE_POS_TAB) else 120

        # CalcPosX: split coarse into delay (Y) and fine (HMxy/X)
        x_pos = self._calc_pos_x(x_coarse)

        # Direction from randomLo bit 7 (JTZ line 2165-2167)
        self.lfsr.next()
        direction = -1 if (self.lfsr.peek_lo() & 0x80) else 1

        enemy = self._create_enemy(enemy_id, x_pos, direction)
        if enemy:
            self._new_enemies.append(enemy)

    def _spawn_fuel(self):
        """Spawn a fuel depot — mirrors JTZ lines 2221-2229."""
        self.lfsr.next()  # For position
        x_coarse = SHAPE_POS_TAB[10]  # PF ID 10 = fuel

        # CalcPosX for fuel (JTZ adds 1 pixel offset for fuel)
        x_pos = self._calc_pos_x(x_coarse)

        fuel = self._create_fuel(x_pos)
        if fuel:
            self._new_fuel.append(fuel)

    def _spawn_house(self):
        """Spawn a house — mirrors JTZ lines 2091–2120."""
        self.lfsr.next()  # For position
        pf1_id = self._get_pf1_pat_id()
        x_coarse = SHAPE_POS_TAB[pf1_id] if pf1_id < len(SHAPE_POS_TAB) else 22

        # Random position for straight sections (JTZ line 2104-2110)
        if self._is_straight_level():
            self.lfsr.next()
            x_coarse = (self.lfsr.peek_lo() & 0x1F) + 8
            if x_coarse >= 25:
                x_coarse += 92  # Move to right bank
            self.lfsr.next()

        x_pos = self._calc_pos_x(x_coarse)
        house = self._create_enemy(config.ENEMY_HOUSE, x_pos)
        if house:
            self._new_enemies.append(house)

    def _spawn_bridge(self):
        """Spawn a bridge at section end — mirrors JTZ lines 2066-2073."""
        x_pos = self._calc_pos_x(SHAPE_POS_TAB[8])  # PF ID 8 = bridge
        enemy = self._create_enemy(config.ENEMY_BRIDGE, x_pos)
        if enemy:
            self._new_enemies.append(enemy)

    # ── Position helpers ──────────────────────────────────────────────

    def _calc_pos_x(self, coarse: int) -> int:
        """JTZ CalcPosX (line 3092): split coarse into screen X.

        The coarse value is a playfield coordinate (0-159).  The fine
        adjustment is computed by the classic "add high nibble to low
        nibble with carry" trick, then offset by 16 and adjusted by
        valley width.

        Simplified for the Python port: maps PF coords (0-159) to
        screen coords (0-319) by doubling, then applies the CalcPosX
        fine adjustment.
        """
        # CalcPosX algorithm (JTZ line 3092-3118):
        #   TAY; INY; TYA; AND $0F → fine = (coarse+1) & 0xF
        #   TYA; LSR x4 → coarse_adj = (coarse+1) >> 4
        #   CLC; ADC fine; CMP $0F; BCC skip; SBC $0F; INY
        #   EOR $07
        fine = ((coarse + 1) & 0x0F)
        coarse_adj = ((coarse + 1) >> 4) & 0x0F
        sum_val = coarse_adj + fine
        carry = sum_val >= 0x0F
        if carry:
            sum_val -= 0x0F
        fine_adj = (sum_val ^ 0x07) & 0x0F

        # Map to screen X: coarse * 2 + fine adjustment
        x = (coarse * 2) + fine_adj
        return x

    def _get_pf1_pat_id(self) -> int:
        """Get current PF1PatId from the river for ShapePosTab indexing."""
        if self.river and hasattr(self.river, 'pf1_pat_id'):
            return self.river.pf1_pat_id
        return 8  # Default to bridge-like position

    def _is_straight_level(self) -> bool:
        """JTZ: level LSR → carry set = straight level."""
        return (self._level & 1) == 0

    @property
    def level(self) -> int:
        """Current difficulty level (from river if available)."""
        if self.river and hasattr(self.river, 'level'):
            return self.river.level
        return 1

    # ── Entity creation ───────────────────────────────────────────────

    def _create_enemy(self, enemy_type: int, x: int, direction: int = 1):
        """Create an Enemy instance.

        `direction` overrides Enemy's default after construction — JTZ
        spawner derives initial patrol direction from `randomLo` bit 7
        (1=right, -1=left). The cleanup over loading `direction` as a
        ctor kwarg + dead fallback is documented in `Enemy.__init__`.
        """
        from port.entities.enemy import Enemy
        enemy = Enemy(enemy_type=enemy_type, x=x, y=0)
        enemy.direction = direction
        return enemy

    def _create_fuel(self, x: int):
        """Create a FuelDepot instance."""
        from port.entities.fuel import FuelDepot
        if not self._sprite_loader:
            return None
        return FuelDepot(x=x, y=0, fuel_tab_id=0, sprite_loader=self._sprite_loader)

    # ── Public interface ─────────────────────────────────────────────

    @property
    def sprite_loader(self):
        return self._sprite_loader

    def set_sprite_loader(self, sprite_loader):
        self._sprite_loader = sprite_loader

    def get_new_enemies(self) -> list:
        return self._new_enemies

    def get_new_fuel(self) -> list:
        return self._new_fuel

    def reset(self):
        """Reset spawner to initial state."""
        self.lfsr.reset()
        self._block_counter = 0
        self._section_counter = 0
        self._section_blocks = 16
        self._block_part = 2
        self._new_enemies.clear()
        self._new_fuel.clear()
