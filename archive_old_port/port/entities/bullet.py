"""
River Raid — Player missile (bullet).

Mirrors JTZ missile state ($B2 missileY, $F5 missileX, $E6 missileFlag).
MissileFlag = $FF means missile is active.
"""

from port.core import config


class Bullet:
    """Player jet missile."""

    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
        self.active = True

    def update(self):
        """Move missile upward."""
        self.y -= config.MISSILE_SPEED_Y
        if self.y < 0:
            self.active = False

    def draw(self, screen, renderer, offset_y: int = 0):
        """Draw missile (internal coords)."""
        renderer.draw_rect(self.x, self.y + offset_y,
                           config.MISSILE_WIDTH, config.MISSILE_HEIGHT,
                           config.COLORS["ORANGE"])

    @property
    def rect(self):
        return (self.x, self.y, config.MISSILE_WIDTH, config.MISSILE_HEIGHT)
