"""
River Raid — Fuel depot entity.

Mirrors JTZ fuel depot behavior:
  - Spawns from top, descends slowly with river scroll
  - Player can refuel by flying over it
  - Destroyed by player missile (score = 80)
  - Colors: LIGHT_GREY / RED (JTZ: FuelCol)
  - Shape from FuelTab0-4 (JTZ fuel depot patterns)
"""

from port.core import config
from port.systems.tabs import get_fuel_shape, FUEL_TAB_0


class FuelDepot:
    """Fuel depot floating down the river."""

    def __init__(self, x: int, y: int, fuel_tab_id: int = 0,
                 sprite_loader=None):
        self.x = x
        self.y = y
        self.fuel_tab_id = fuel_tab_id
        self.sprite_loader = sprite_loader
        self.alive = True

        # Width from FuelTab shape: count leading 1-bits in first row byte
        shape = get_fuel_shape(fuel_tab_id)
        if shape and len(shape) > 0:
            first_byte = shape[0]
            self.width = 0
            for bit in range(7, -1, -1):
                if first_byte & (1 << bit):
                    self.width += 1
                else:
                    break
        else:
            self.width = 10
        # Height from FuelTab shape (number of rows)
        self.height = len(shape) if shape else 12

    def update(self, river):
        """Fuel descends with river scroll."""
        self.y += river.scroll_speed

    def draw(self, screen, renderer, offset_y: int = 0):
        """Draw fuel depot (internal coords)."""
        sprite = self.sprite_loader.get_scaled("FuelA") if self.sprite_loader else None
        if sprite:
            screen.blit(sprite, (self.x, self.y + offset_y))
            return
        # Fallback: FuelCol = LIGHT_GREY, LIGHT_GREY, LIGHT_GREY, RED, RED, RED
        half_h = self.height // 2
        renderer.draw_rect(self.x, self.y + offset_y, self.width, half_h,
                           config.COLORS["LIGHT_GREY"])
        renderer.draw_rect(self.x, self.y + half_h + offset_y, self.width, half_h,
                           config.COLORS["RED"])

    @property
    def rect(self):
        return (self.x, self.y, self.width, self.height)
