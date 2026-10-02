"""
River Raid — River generation and scrolling.

Mirrors JTZ playfield rendering (lines 1847–2273):
  - blockOffset: scroll position within current block
  - PF1PatId: playfield pattern ID for new blocks (2..8, or 2..13/14 with islands)
  - PF_State: island flags (ISLAND_FLAG, CHANGE_FLAG)
  - sectionBlock: blocks remaining in current section (16..1)
  - blockPart: 1/2 (bridge occupies only part of a block)
  - BankPtrTab: maps PF1PatId to PFPat pattern index

Block structure:
  - Each block is BLOCK_SIZE (32) lines tall
  - Each block has its own PF1PatId and PF2PatId
  - 6 blocks are visible on screen simultaneously
  - New block generated when blockOffset >= BLOCK_SIZE
  - River scrolls by speedY*3 lines per frame (max 3 lines/frame)
"""

from port.core import config
from port.systems.patterns import get_pattern, get_row, PATTERN_ROW_COUNT
from port.systems.random import LFSR
from port.systems.tabs import BANK_PTR_TAB





class River:
    """River generation, scrolling, and collision detection."""

    def __init__(self, lfsr):
        # Duck-type: tests pass a random.Random (or any non-LFSR) for
        # standalone seeding. game.py passes a shared LFSR so the river
        # + spawner stay in sync. If we don't get a real LFSR, provision
        # a fresh one so the internal block-generation routines still
        # have a real 16-bit LFSR state.
        if not isinstance(lfsr, LFSR):
            lfsr = LFSR()
        self.lfsr = lfsr
        self._block_offset = 0      # Lines scrolled into current block (0–31)
        self._section_block = 16    # Blocks remaining in current section (16..1)
        self._block_part = 2        # 2 = first part, 1 = second part (for bridge)
        self._pf_state = 0          # Island flags (bit 7=ISLAND_FLAG, bit 6=CHANGE_FLAG)
        self._prev_pf1_pat_id = 12  # Previous block's PF1PatId (init = 12)
        self._pf1_pat_id = 12       # Current PF1 pattern ID for new blocks
        self._section_end = 0       # 0 = not at section end
        self._valley_width = 0      # Min valley width restriction (0=off, 6=restricted)
        self._level = 1             # Current difficulty level

        # 6 blocks visible on screen, each with its own pattern ID
        # Initialized from InitTab: PF1Lst = PFPat8, PF2Lst = PFPat12.
        # Note: _block_colors is indexed BOTTOM-TO-TOP (index 0 = bottom/oldest,
        # index 5 = top/newest) to mirror the same convention used by
        # `_block_pat_ids` and the `_generate_new_block` shift pattern.
        # _block_colors[i] holds the bank color (0=dark $D2, 1=light $D6)
        # for the i-th block counting from the bottom of the screen.
        self._block_pat_ids = [12, 12, 12, 12, 12, 12]  # 6 blocks (PFPat12 = 4-col bank = wide playable river seed; JTZ pf1_pat_id=12 at level start)
        self._block_colors = [0, 1, 0, 1, 0, 1]   # Alternating GREEN ($D2) / BANK_LIGHT_GREEN ($D6)

        # Scroll offset within the current block pattern
        self._pattern_scroll = 0

        # Current scroll speed in pixels per frame (default 1)
        self._scroll_speed = 1

    # ── Backward-compat RNG passthrough (for tests/test_river.py etc.) ──
    # Some tests predate the LFSR injection refactor and pin the legacy
    # `_rng_lo` / `_rng_hi` / `_random_lo()` triple. Keep them aliased to
    # the shared LFSR so the spec still works without forking the state.

    @property
    def _rng_lo(self) -> int:
        return self.lfsr.lo

    @_rng_lo.setter
    def _rng_lo(self, value: int) -> None:
        self.lfsr.lo = value & 0xFF

    @property
    def _rng_hi(self) -> int:
        return self.lfsr.hi

    @_rng_hi.setter
    def _rng_hi(self, value: int) -> None:
        self.lfsr.hi = value & 0xFF

    def _random_lo(self) -> int:
        """Return current LO byte AND advance the LFSR (mirrors LFSR.get_lo).

        Test pins ensure deterministic-from-state and varied sequences.
        """
        return self.lfsr.get_lo()

    def reset(self):
        """Reset river to initial state."""
        self._block_offset = 0
        self._section_block = 16
        self._block_part = 2
        self._pf_state = 0
        self._prev_pf1_pat_id = 12
        self._pf1_pat_id = 12
        self._section_end = 0
        self._valley_width = 0
        self._level = 1
        self._block_pat_ids = [12, 12, 12, 12, 12, 12]  # reset() — match __init__ initial state (wide playable river seed)
        self._block_colors = [0, 1, 0, 1, 0, 1]
        self._pattern_scroll = 0
        self._scroll_speed = 1

    def advance(self):
        """Advance river by one pixel of scroll.

        Called 1–3 times per frame tick depending on player speedY
        (game.py handles the speedY → scroll_amt mapping).
        """
        self._block_offset += 1
        self._pattern_scroll += 1

        # Wrap pattern scroll within pattern rows
        if self._pattern_scroll >= PATTERN_ROW_COUNT:
            self._pattern_scroll -= PATTERN_ROW_COUNT

        # Check if we need a new block
        if self._block_offset >= config.BLOCK_SIZE:
            self._block_offset -= config.BLOCK_SIZE
            self._generate_new_block()

    def _generate_new_block(self):
        """Generate a new block at the top of the screen.

        Mirrors JTZ lines 1866–2241 (new block generation).
        """
        # Shift all existing blocks down (block 0→1, 1→2, etc.)
        self._block_pat_ids = self._block_pat_ids[1:] + [self._block_pat_ids[-1]]
        self._block_colors = self._block_colors[1:] + [self._block_colors[-1]]

        # Decrement block part counter
        self._block_part -= 1

        if self._block_part == 0:
            # Second part of block – continue with same block
            self._block_part = 2
            # Check if this was the last block of the section
            self._section_block -= 1
            if self._section_block == 0:
                # End of section
                self._section_block = config.SECTION_BLOCKS
                self._level = min(self._level + 1, config.MAX_LEVEL)
                self._prev_pf1_pat_id = self._pf1_pat_id
                self._pf1_pat_id = 12  # Bridge pattern
                self._block_pat_ids[-1] = 12
                self._block_colors[-1] = 0
                return
            # Continue with next block of section
            self._next_random_block()
        else:
            # First part of last block of section = bridge/road
            self._section_block -= 1
            if self._section_block == 0:
                self._section_block = config.SECTION_BLOCKS
                self._level = min(self._level + 1, config.MAX_LEVEL)
                self._prev_pf1_pat_id = self._pf1_pat_id
                self._pf1_pat_id = 12
                self._block_pat_ids[-1] = 12
                self._block_colors[-1] = 0
                return
            # First part of last block – generate road with bridge
            self._prev_pf1_pat_id = self._pf1_pat_id
            self._pf1_pat_id = 12
            self._block_pat_ids[-1] = 12
            self._block_colors[-1] = 0
            self._section_end = 1
            return

        # Generate a normal block
        self._next_random_block()

    def _next_random_block(self):
        """Generate the next random block pattern.

        Mirrors JTZ lines 1918–2001.
        """
        # Get new random values
        self.lfsr.next()

        # Update PF_State (island flags)
        self._update_pf_state()

        # Generate new PF1PatId
        self._prev_pf1_pat_id = self._pf1_pat_id
        self._pf1_pat_id = self._generate_pf1_pat_id()

        # Set valley width restriction for first 4 levels
        if self._level < 5:
            self._valley_width = 6
        else:
            self._valley_width = 0

        # Determine block color (alternating based on level)
        if self._level % 2 == 0:
            self._block_colors[-1] = 0  # GREEN
        else:
            self._block_colors[-1] = 1  # BANK_LIGHT_GREEN ($D6) — maps via get_block_color_for_row()

        self._block_pat_ids[-1] = self._pf1_pat_id

    def _update_pf_state(self):
        """Update PF_State island flags. Mirrors JTZ lines 1933–1978."""
        if self._section_block == 1:
            # Last block of section – static PF
            self._pf_state = 0
            return

        if self._section_block == 2:
            # Last-but-one block
            if self._pf_state & 0xC0 == 0xC0:
                # Both flags set → clear CHANGE_FLAG (step 1 of finishing island)
                self._pf_state &= ~0x40
            else:
                # Clear both flags (step 2)
                self._pf_state = 0
            return

        # Normal block – update flags
        change = self._pf_state & 0x40
        island = self._pf_state & 0x80

        if island and not change:
            # 10 → 11 (island, start changing)
            self._pf_state = 0xC0
        elif island and change:
            # 11 → 10 (island, stop changing)
            self._pf_state = 0x80
        elif not island and change:
            # 01 → 00 (static, stop changing)
            self._pf_state = 0x00
        elif not island and not change:
            # 00 → 01 or 00 → 00
            # JTZ: BIT randomLo; BVC → ~50% chance to start changing
            self.lfsr.next()
            if not (self.lfsr.peek_lo() & 0x80):
                self._pf_state = 0x40  # Start changing
            else:
                self._pf_state = 0x00  # Stay static

    def _generate_pf1_pat_id(self) -> int:
        """Generate a new PF1PatId. Mirrors JTZ lines 1982–2001."""
        # Random ID from 2..15, minimum 2
        self.lfsr.next()
        raw_id = self.lfsr.peek_lo() & 0x0F
        if raw_id < 2:
            raw_id = 2

        max_id = 14  # Default max

        # If island is active, reduce max to 13
        if self._pf_state & 0x80:
            max_id = 13

        # If valley width is restricted (first 4 levels), max = 8
        if self._valley_width > 0:
            max_id = 8

        if raw_id > max_id:
            raw_id = max_id

        return raw_id

    @property
    def pf1_pat_id(self) -> int:
        """Current PF1 pattern ID for new block generation."""
        return self._pf1_pat_id

    @property
    def left_bank(self) -> int:
        """X position of the left river bank at screen center."""
        # Calculate from top block's pattern
        if not self._block_pat_ids:
            return 0
        pat_id = self._block_pat_ids[0]
        if pat_id == 0:
            return 0
        if pat_id >= len(BANK_PTR_TAB):
            pat_id = len(BANK_PTR_TAB) - 1
        return BANK_PTR_TAB[pat_id] * 2

    @property
    def right_bank(self) -> int:
        """X position of the right river bank at screen center."""
        return config.SCREEN_WIDTH - self.left_bank

    def get_left_bank_color(self) -> tuple[int, int, int]:
        """Get left bank color (alternates GREEN/LIGHT_GREEN)."""
        return config.COLORS["GREEN"]

    def get_right_bank_color(self) -> tuple[int, int, int]:
        """Get right bank color (alternates LIGHT_GREEN/GREEN)."""
        return config.COLORS["LIGHT_GREEN"]

    def get_block_color_for_row(self, row_in_river: int) -> tuple[int, int, int]:
        """Public accessor for a row's bank color.

        Used by `port/rendering/screen.py draw_river()` to map each visible
        row to the bank color of the 32-row block containing it.

        Args:
            row_in_river: 0..SCREEN_HEIGHT-ROAD_HEIGHT*2 (row index from top of river).

        Returns:
            RGB tuple for the bank's luma variant — config.COLORS['GREEN']
            (=tia_to_rgb(0xD2)=(100,92,0)) if the block's PF_COLOR_FLAG is
            clear, or config.COLORS['BANK_LIGHT_GREEN'] (=tia_to_rgb(0xD6)
            =(164,156,0)) if set. Mirrors JTZ's `PFcolor = GREEN |
            PF_COLOR_FLAG` semantics.
        """
        # Same top-to-bottom convention as get_row_byte: row 0 = top of
        # screen → _block_colors[-1] (newest block); max row = bottom → [0].
        block_count = len(self._block_colors)
        if block_count == 0:
            return config.COLORS["GREEN"]
        block_index = row_in_river // config.BLOCK_SIZE  # 0=top, len-1=bottom
        # Invert: top has index (block_count-1), bottom has index 0.
        actual_block = block_count - 1 - block_index
        if actual_block < 0 or actual_block >= block_count:
            return config.COLORS["GREEN"]  # fallback for stale row
        color_idx = self._block_colors[actual_block]
        if color_idx == 1:
            return config.COLORS["BANK_LIGHT_GREEN"]
        return config.COLORS["GREEN"]  # dark variant ($D2)

    def get_row_byte(self, row_in_river: int) -> int:
        """Get the PFPat byte for a given row within the river area.

        This maps a row within the visible river (0..186) to the appropriate
        PFPat pattern byte based on which block that row falls into.

        Args:
            row_in_river: Row index within the river area (0 to RIVER_HEIGHT-1)

        Returns:
            PFPat byte value for that row (0–255).
        """
        # Each block is 32 lines. 6 blocks visible = 192 lines.
        # Rows 0-31 = block 5 (top), rows 32-63 = block 4, etc.
        block_height = config.BLOCK_SIZE
        block_index = row_in_river // block_height
        row_in_block = row_in_river % block_height

        # Map to our block array (block 0 = bottom/oldest, block 5 = top/newest)
        # But we need to reverse since block 5 is at the top
        actual_block = len(self._block_pat_ids) - 1 - block_index
        if actual_block < 0 or actual_block >= len(self._block_pat_ids):
            actual_block = 0

        pat_id = self._block_pat_ids[actual_block]

        # Get the pattern and row within it
        try:
            pattern = get_pattern(pat_id)
            # Add pattern scroll offset and wrap
            pattern_row = (row_in_block + self._pattern_scroll) % PATTERN_ROW_COUNT
            return pattern[pattern_row]
        except (ValueError, IndexError):
            return 0

    def check_collision(self, obj_x: int, obj_y: int, obj_w: int, obj_h: int) -> bool:
        """Check if an object collides with river banks.

        ``row_byte`` here is a **TIA PF1 bitmap** (PFPat semantics), not a
        raw PF-coord width. Each SET BIT in the byte represents one bank
        column on the LEFT half of the playfield (mirrored to the right
        half via PF2). Counting the 1-bits gives the number of bank cols;
        each col covers ~4 PF coords of bank pixel.

        The OLD interpretation ``left_edge = row_byte`` treated the byte
        as a raw PF coord offset and produced insane edges for any
        pattern with high-byte rows: PFpat8 (0xFF) gave left_edge=510,
        PFpat6 (0xFC) gave left_edge=504, PFpat1 (0x80) gave left_edge=256.
        With ``scroll_amt >= 2`` (``Game.update`` runs
        ``self.river.advance()`` 1–3 times per PLAYING frame based on
        ``player.speed_y``), the bottom block cycles through many
        patterns in 100 frames -- including PFpat6 -- and the buggy
        formula crashed the player at x=160 instantly (~4-frame
        EXPLODING→FLYING→CRASH cycle repeated 3× = GAME_OVER by frame
        ~82). Reported 2026-07-15 via smoke_test_e2e.py Phase 2.
        """
        # Check all rows the object occupies
        for row in range(obj_y, obj_y + obj_h):
            row_in_river = row - config.ROAD_HEIGHT
            if 0 <= row_in_river < config.SCREEN_HEIGHT - config.ROAD_HEIGHT * 2:
                row_byte = self.get_row_byte(row_in_river)
                # Interpret row_byte as a BITMAP: each set bit = 1 bank col (~4 PF coords).
                blocks = bin(row_byte).count("1")
                # Left edge in playfield coords (0-159). Each col covers 4 PF coords.
                left_edge = blocks * 4
                right_edge = 159 - left_edge

                # Scale to screen coords (0-319)
                left_edge = int(left_edge * 2.0)
                right_edge = int(right_edge * 2.0)

                # Check collision
                if obj_x < left_edge:
                    return True
                if obj_x + obj_w > right_edge:
                    return True

        return False

    def get_playfield_data(self) -> tuple[list[int], list[int]]:
        """Get playfield pattern data for current frame.

        Returns (left_bank_rows, right_bank_rows) as byte arrays.
        """
        left_rows = []
        right_rows = []
        river_height = config.SCREEN_HEIGHT - config.ROAD_HEIGHT * 2

        for row in range(river_height):
            row_byte = self.get_row_byte(row)
            left_rows.append(row_byte)
            right_rows.append(255 - row_byte)

        return left_rows, right_rows

    @property
    def scroll_speed(self) -> int:
        """Current scroll speed in pixels per frame."""
        return self._scroll_speed

    @scroll_speed.setter
    def scroll_speed(self, value: int):
        self._scroll_speed = value