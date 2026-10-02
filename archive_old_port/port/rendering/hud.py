"""
River Raid — HUD (Heads-Up Display).

Mirrors JTZ HUD rendering:
  - Score display: scorePtr1/scorePtr2 (12 bytes each)
  - Fuel gauges: FuelTab0-4 (5 fuel bars) — extracted ROM byte patterns
  - Lives display: livesPtr ($C0) using stock font + numeric count
  - Multiplier display: decreases from 10 to 1

The fuel gauge is built from port/systems/tabs.py FUEL_TAB_0..4 — these
are the EXACT ROM byte arrays JTZ extracted from the cartridge ($FCxx
page). Using them here means the gauge pixel layout matches what the
1982 physical cartridge produced, instead of hand-picked solid rects.
"""

import pygame

from port.core import config
from port.assets.sprites import bytes_to_surface
from port.systems.tabs import FUEL_TAB_0, FUEL_TAB_1, FUEL_TAB_2, FUEL_TAB_3, FUEL_TAB_4


# ── Fuel gauge sprite scaling ─────────────────────────────────────────
# JTZ FuelTab each = 12 rows × varying column count (1..7 cols lit).
# In the original NTSC display the depot is rendered at native 1× (1
# col × 12 rows for FUEL_TAB_0). The HUD here draws 5 of them as a
# gauge, so we use a moderate scale (2×) that keeps the gauge compact
# yet readable on the 320×240 internal buffer.
FUEL_SPRITE_SCALE = 2


class HUD:
    """Renders the score, fuel, lives, and multiplier HUD."""

    def __init__(self):
        self.font = pygame.font.Font(None, 16)
        self.small_font = pygame.font.Font(None, 12)

        # Pre-render the 5 FuelTab sprite surfaces (12 rows each, MSB-first).
        # Filled toggle on/off is driven by fuel level (5 equal segments);
        # each tab byte pattern is byte-by-byte identical across its 12
        # rows so the surface is a solid vertical strip of a specific
        # width (1 / 3 / 5 / 7 / 7 cols lit under MSB-first decode).
        self._fuel_sprites = [
            bytes_to_surface(tab, row_count=12, scale=FUEL_SPRITE_SCALE)
            for tab in (FUEL_TAB_0, FUEL_TAB_1, FUEL_TAB_2, FUEL_TAB_3, FUEL_TAB_4)
        ]

    def draw(self, screen, score: int, fuel: int, lives: int, multiplier: int):
        """Draw all HUD elements (internal coordinates)."""
        # Score (top-left)
        score_str = str(score)
        score_text = self.font.render(f"SCORE:{score_str}", True, config.COLORS["YELLOW"])
        screen.blit(score_text, (4, 4))

        # Multiplier (top-center)
        mult_text = self.small_font.render(f"x{multiplier}", True, config.COLORS["WHITE"])
        mult_rect = mult_text.get_rect(center=(config.SCREEN_WIDTH // 2, 8))
        screen.blit(mult_text, mult_rect)

        # Lives (top-right) — JTZ: livesPtr ($C0). Shows count via repeated
        # digit token instead of small icons (port simplification; the
        # original draws a tiny ship glyph per remaining life).
        lives_str = "LIVES:" + "1" * min(lives, config.LIVES_MAX)
        lives_text = self.font.render(lives_str, True, config.COLORS["YELLOW"])
        lives_rect = lives_text.get_rect(right=config.SCREEN_WIDTH - 4, top=4)
        screen.blit(lives_text, lives_rect)

        # Fuel gauge (bottom)
        self._draw_fuel_gauge(screen, fuel)

    def _draw_fuel_gauge(self, screen, fuel: int):
        """Draw the fuel gauge (JTZ: FuelTab0-4). Internal coordinates.

        Fuel is split into 5 segments of equal fuel budget (~51 units
        each, since FUEL_MAX=255 ÷ 5 ≈ 51). Each segment lit iff the
        current fuel level exceeds that segment's threshold.

        Mirrors JTZ `fuelLo` / `fuelHi` depletion display logic.

        Renders each segment as a blit of the corresponding FuelTab
        sprite (pixel-exact ROM byte decode under MSB-first) instead of
        a solid `pygame.draw.rect` placeholder, matching the original
        cartridge's fuel-depot pixel shape.
        """
        gauge_y = config.SCREEN_HEIGHT - 24

        # "FUEL" label (JTZ: FUEL text)
        fuel_label = self.small_font.render("FUEL", True, config.COLORS["YELLOW"])
        screen.blit(fuel_label, (4, gauge_y))

        # Draw 5 fuel segments (one per FUEL_TAB). Each segment is
        # rendered as a sprite blit scaled 2×; native 1× FUEL_TAB_0 has
        # width 1 col × 12 rows so the segment is 2×24 px at scale.
        start_x = 50
        bar_gap = 4  # gap between segments

        fuel_level = fuel / config.FUEL_MAX
        for i, sprite in enumerate(self._fuel_sprites):
            bar_x = start_x + i * (sprite.get_width() + bar_gap)
            bar_y = gauge_y

            # Determine if this segment is filled
            bar_threshold = (i + 1) / 5
            is_filled = fuel_level >= bar_threshold

            if is_filled:
                screen.blit(sprite, (bar_x, bar_y))
            else:
                # Render the same sprite but desaturated to dim grey
                pygame.draw.rect(screen, config.COLORS["GREY"],
                                 (bar_x, bar_y, sprite.get_width(), sprite.get_height()))
