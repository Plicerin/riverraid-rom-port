"""
River Raid — Sprite loading and rendering.

Loads sprite data from the extraction JSON files and converts
byte arrays into pygame Surfaces.
"""

import pygame
import json
import os

from port.core import config


def _load_json(filename: str) -> dict:
    """Load a JSON file from the extraction directory."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    path = os.path.join(base_dir, "extraction", filename)
    with open(path, "r") as f:
        return json.load(f)


def bytes_to_surface(byte_array: list[int], row_count: int,
                     scale: int = 1, transparent: bool = True,
                     msb_first: bool = True,
                     flip_rows: bool = False) -> pygame.Surface:
    """
    Convert a sprite's byte array to a pygame Surface.

    Per Atari 2600 TIA hardware spec (problemkaputt.de/2k6specs.htm and
    Steve Wright 1979 STELLA Programmer's Guide §6.0): the GRPx register
    is drawn MSB-first by default — bit 7 is the LEFTMOST pixel. Set
    `msb_first=False` for sprites where REFPx.3=1 (hardware horizontal
    mirror) OR for any legacy extraction data stored LSB-first.

    Args:
        byte_array: List of 0-255 byte values (rows).
        row_count: Number of rows (each = 8 pixels wide).
        scale: Pixel scale multiplier.
        transparent: If True, zero-bit pixels are transparent.
        msb_first: True (default) → TIA hardware-default orientation
                   (bit 7 leftmost, REFPx.3=0).
                   False → mirror/legacy orientation
                   (bit 0 leftmost, REFPx.3=1).

    Returns:
        A pygame Surface ready for blitting.
    """
    width = 8 * scale
    height = row_count * scale

    if transparent:
        surface = pygame.Surface((width, height), pygame.SRCALPHA)
    else:
        surface = pygame.Surface((width, height))

    # Optional row inversion. The TIA's native kernel scan order is
    # bottom-up (lineNum counts DOWN from NUM_LINES), but the
    # extraction pipeline emits sprite bytes in top-down visual order
    # (byte[0] = top row), so the default ``flip_rows=False`` is the
    # correct setting for our extracted data. flip_rows=True is kept
    # for completeness in case upstream extraction ever switches to
    # bottom-up order -- and as a regression-test handle (see
    # /extraction/smoke_test_e2e.py assertion (b) -- "jet points UP").
    rows_source = list(reversed(byte_array)) if flip_rows else byte_array

    if msb_first:
        # TIA hardware default: bit 7 (MSB) → col 0 (leftmost).
        # Iterate bit index from highest to lowest so col 0 draws first.
        for row_idx, byte_val in enumerate(rows_source):
            for bit in range(8):
                bit_msb = 7 - bit  # bit 7 first, then 6, ..., 0
                if byte_val & (1 << bit_msb):
                    px = (7 - bit_msb) * scale  # bit 7 → col 0
                    py = row_idx * scale
                    surface.fill((0xFD, 0xF4, 0x98), (px, py, scale, scale))
    else:
        # Legacy mirror (REFPx.3=1 or pre-fix extraction): bit 0 → col 0.
        for row_idx, byte_val in enumerate(rows_source):
            for bit in range(8):
                if byte_val & (1 << bit):
                    px = bit * scale
                    py = row_idx * scale
                    surface.fill((0xFD, 0xF4, 0x98), (px, py, scale, scale))

    return surface


class SpriteLoader:
    """
    Loads and caches sprite data from extraction files.

    Provides access to all enemy types, player jet, and explosion sprites.
    """

    def __init__(self):
        self._cache: dict[str, pygame.Surface] = {}
        self._load_sprites()
        self._load_player_jet()

    def _load_sprites(self):
        """Load all enemy sprites from labeled_sprites.json."""
        try:
            data = _load_json("riverraid_labeled_sprites.json")
        except (FileNotFoundError, json.JSONDecodeError):
            return  # No extraction data available; use fallback

        for name, info in data.get("sprites", {}).items():
            byte_array = info.get("bytes", [])
            rows = info.get("rows", len(byte_array))
            if byte_array:
                # Smoke test (extraction/smoke_test_e2e.py assertion (b))
                # verified the jet alpha-pixel distribution is wide-at-bottom
                # (bot-half=132) vs narrow-at-top (top-half=48) when the
                # extraction's byte order is preserved as-is. Earlier flip_rows
                # =True made the jet upside-down (top > bot). Default
                # flip_rows=False wins; row-orientation regression pinned by
                # the smoke test.
                self._cache[name] = bytes_to_surface(byte_array, rows)

    def _load_player_jet(self):
        """Load player jet frames from player_jet_report.json."""
        try:
            data = _load_json("riverraid_player_jet_report.json")
        except (FileNotFoundError, json.JSONDecodeError):
            return

        # Each jet state has 2 frames (straight + move) concatenated.
        # flip_rows=True honored for the same reason as _load_sprites:
        # ROM ships sprite bytes bottom-up (TIA scan order).
        for state_name in ["JetStraight", "JetMove", "JetExplode"]:
            state_data = data.get(state_name, {})
            byte_array = state_data.get("bytes", [])
            if byte_array:
                # Each frame is 9 rows; total rows = len(bytes).
                # flip_rows=False (default) -- same row-orientation note as
                # _load_sprites: smoke test verified the player jet renders
                # nose-up + wide-body-bottom under the default orientation.
                rows = len(byte_array)
                self._cache[f"jet_{state_name}"] = bytes_to_surface(
                    byte_array, rows, scale=1,
                )

    def get(self, name: str) -> pygame.Surface | None:
        """Get a cached sprite by name (native 1× surface)."""
        return self._cache.get(name)

    # Default visual scale for in-game entity rendering. The port renders
    # to a 320×240 internal buffer scaled 2× to a 640×480 window. Native
    # sprites are 8 px wide × ~rows tall — too small in the window. The
    # bytecode-scale-2 (16×36 jet) keeps the jet ~5% of internal width,
    # matching the original Atari pixel-art proportion on the 320-wide
    # internal surface.
    ENTITY_SCALE = 2

    def get_scaled(self, name: str, scale: int | None = None) -> pygame.Surface | None:
        """Get a sprite scaled for in-game rendering (default ENTITY_SCALE).

        Args:
            name: Sprite key in the cache.
            scale: Optional override (defaults to ENTITY_SCALE = 2).

        Returns:
            A pygame Surface scaled `scale`× vs the native sprite,
            or None if the sprite is not cached.
        """
        sprite = self._cache.get(name)
        if sprite is None:
            return None
        effective_scale = scale if scale is not None else self.ENTITY_SCALE
        target_w = sprite.get_width() * effective_scale
        target_h = sprite.get_height() * effective_scale
        if sprite.get_width() == target_w and sprite.get_height() == target_h:
            return sprite
        return pygame.transform.scale(sprite, (target_w, target_h))
