"""
River Raid — Explosion animation.

Mirrors JTZ explosion types (Explosion0–Explosion2 frames).
Explosion0 = small, Explosion1 = medium, Explosion2 = large.
"""

from port.core import config


class Explosion:
    """Explosion animation frame."""

    def __init__(self, x: int, y: int, explosion_type: int = 1):
        self.x = x
        self.y = y
        self.explosion_type = explosion_type
        self.timer = 6  # Frames to display
        self.alive = True

    def update(self):
        self.timer -= 1
        if self.timer <= 0:
            self.alive = False

    @property
    def size(self) -> int:
        """Explosion size based on type (JTZ explosion frame sizes)."""
        sizes = {
            config.SHAPE_EXPLOSION0: 8,
            config.SHAPE_EXPLOSION1: 10,
            config.SHAPE_EXPLOSION2: 12,
        }
        return sizes.get(self.explosion_type, 10)

    def draw(self, screen, renderer, offset_y: int = 0):
        """Draw explosion as a flashing rectangle at internal coordinates."""
        flash = self.timer % 2 == 0
        color = config.COLORS["ORANGE"] if flash else config.COLORS["RED"]
        renderer.draw_rect(self.x, self.y + offset_y, self.size, self.size, color)
