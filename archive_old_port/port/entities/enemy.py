"""
River Raid — Enemy entity.

Mirrors JTZ enemy list structure (6 block arrays, ZP $8E–$B3):
  blockLst, XPos1Lst, State1Lst, Shape1IdLst, PF1Lst, PF2Lst
"""

import pygame

from port.core import config
from port.assets.sprites import SpriteLoader


class Enemy:
    """Single enemy object on screen."""

    def __init__(self, enemy_type: int, x: int, y: int,
                 sprite_loader: SpriteLoader | None = None):
        self.sprite_loader = sprite_loader or SpriteLoader()
        self.type = enemy_type
        self.x = x
        self.y = y
        self.alive = True
        # JTZ: planes move right, every other enemy-type moves left.
        # Spawner can override this post-construction for LFSR-derived
        # initial patrol direction (randomLo bit 7).
        self.direction = 1 if self.type == config.ENEMY_PLANE else -1
        self.patrol_timer = 0
        self.frame = 0  # Animation frame index (for color cycling)

        # Score value from JTZ ScoreTab
        self.score_value = config.SCORES.get(
            {
                config.ENEMY_PLANE: "PLANE",
                config.ENEMY_HELI0: "HELI0",
                config.ENEMY_HELI1: "HELI1",
                config.ENEMY_SHIP: "SHIP",
                config.ENEMY_BRIDGE: "BRIDGE",
                config.ENEMY_HOUSE: "HOUSE",
                config.ENEMY_FUEL: "FUEL",
            }.get(enemy_type, "SHIP"),
            30,
        )

        # Explosion type for death animation
        self.explosion_type = 1  # Default small explosion

    def update(self, river):
        """Update enemy position based on type."""
        if not self.alive:
            return

        # Horizontal patrol (JTZ: enemy patrol logic)
        if self.type in (config.ENEMY_PLANE, config.ENEMY_HELI0, config.ENEMY_HELI1):
            self.x += self.direction * 1
            self.patrol_timer += 1
            self.frame += 1  # Cycle color
            # Reverse direction at screen edges
            if self.x <= 0 or self.x >= config.SCREEN_WIDTH - 8:
                self.direction *= -1
        elif self.type in (config.ENEMY_SHIP, config.ENEMY_HOUSE):
            self.x += self.direction * 1
            self.patrol_timer += 1
            self.frame += 1  # Cycle color
            if self.x <= 0 or self.x >= config.SCREEN_WIDTH - 8:
                self.direction *= -1
        elif self.type == config.ENEMY_BRIDGE:
            self.frame += 1  # Cycle bridge color

        # Move down with river scroll
        self.y += river.scroll_speed

    def draw(self, screen: pygame.Surface, renderer, offset_y: int = 0):
        """Draw the enemy at its current position (internal coords)."""
        sprite_name = self._get_sprite_name()
        if sprite_name:
            sprite = self.sprite_loader.get_scaled(sprite_name)
            if sprite:
                screen.blit(sprite, (self.x, self.y + offset_y))
                return
        # Fallback: draw colored rectangle
        renderer.draw_rect(self.x, self.y + offset_y, 8, 8, self._get_color())

    def _get_sprite_name(self) -> str | None:
        """Map enemy type to extracted sprite name (A/B frame pair).

        The labeled extraction uses A/B suffixes for animation frames.
        We pick frame A as the default.
        """
        sprite_map = {
            config.ENEMY_PLANE: "PlaneA",
            config.ENEMY_HELI0: "Heli0A",
            config.ENEMY_HELI1: "Heli1A",
            config.ENEMY_SHIP: "ShipA",
            config.ENEMY_BRIDGE: "BridgeB",
            config.ENEMY_HOUSE: "HouseA",
            config.ENEMY_FUEL: "FuelA",
        }
        return sprite_map.get(self.type)

    def _get_color(self) -> tuple[int, int, int]:
        """
        Get enemy color (JTZ: ColorPtrTab / COLUP1).
        Colors match the original NTSC VCS register values from ColorPtrTab.
        """
        if self.type in (config.ENEMY_PLANE,):
            # ColorPtrTab: $AC, $9C, $8C (greenish-grey gradient)
            colors = [
                config.COLORS["PLANE_GREEN"],
                config.COLORS["PLANE_GREY"],
                config.COLORS["PLANE_DARK"],
            ]
            return colors[self.frame % len(colors)]
        elif self.type in (config.ENEMY_HELI0, config.ENEMY_HELI1):
            # ColorPtrTab: CYAN $B0, DARK_BLUE $80, ORANGE $2A
            colors = [
                config.COLORS["CYAN"],
                config.COLORS["DARK_BLUE"],
                config.COLORS["ORANGE"],
            ]
            return colors[self.frame % len(colors)]
        elif self.type == config.ENEMY_SHIP:
            # ColorPtrTab: $A8, $32, BLACK
            colors = [
                config.COLORS["SHIP_WHITE"],
                config.COLORS["SHIP_LIGHT"],
                config.COLORS["BLACK"],
            ]
            return colors[self.frame % len(colors)]
        elif self.type == config.ENEMY_BRIDGE:
            # ColorPtrTab: $20, $14, $12 (red/grey gradient)
            colors = [
                config.COLORS["BRIDGE_RED"],
                config.COLORS["BRIDGE_DARK"],
                config.COLORS["BRIDGE_DARKEST"],
            ]
            return colors[self.frame % len(colors)]
        elif self.type == config.ENEMY_HOUSE:
            # ColorPtrTab: BROWN $10, LIGHT_GREEN $DA, BLACK, LIGHT_GREY $0C
            colors = [
                config.COLORS["BROWN"],
                config.COLORS["LIGHT_GREEN"],
                config.COLORS["BLACK"],
                config.COLORS["LIGHT_GREY"],
            ]
            return colors[self.frame % len(colors)]
        return config.COLORS["GREY"]

    def collides_with(self, other_x: int, other_y: int, other_w: int, other_h: int) -> bool:
        """Check if this enemy collides with another object."""
        return (self.x < other_x + other_w and
                self.x + 8 > other_x and
                self.y < other_y + other_h and
                self.y + 8 > other_y)
