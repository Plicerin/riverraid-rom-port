"""
River Raid — Player jet entity.

Mirrors JTZ player state block ($BD–$C1):
  $BD: level, $BE: randomLoSave, $BF: randomHiSave, $C0: livesPtr, $C1: state
  State: 0=flying, 1=explosion, 2=crashed into PF
"""

import pygame

from port.core import config
from port.assets.sprites import SpriteLoader


class Player:
    """Player jet with 3 states (JTZ: player1State block)."""

    def __init__(self, sprite_loader: SpriteLoader | None = None):
        self.sprite_loader = sprite_loader or SpriteLoader()

        # Position (JTZ: $B3 playerX, JET_Y = 19)
        # In the original kernel, the jet is drawn 19 scanlines up from
        # the BOTTOM of the NUM_LINES=160 kernel (not from the top — JTZ's
        # `CPY #JET_Y` triggers as the Y counter counts DOWN toward 0).
        # The Python port maps this to top-edge blit Y via:
        #   JET_TOP_Y = SCREEN_HEIGHT - ROAD_HEIGHT - JET_Y - sprite_height
        #             = 240 - 13 - 19 - 18 = 190
        # See port/core/config.py JET_TOP_Y for derivation + the assert
        # that pins the math.
        self.x = config.SCREEN_WIDTH // 2
        self.y = config.JET_TOP_Y

        # Velocity (JTZ: $B4 speedX, $B5 speedY)
        # speedY: 0 = base scroll, negative = faster (up), positive = slower (down)
        self.speed_x = 0
        self.speed_y = 0

        # State ($C1: state)
        self.state = config.PLAYER_FLYING  # 0=flying, 1=explosion, 2=crashed

        # Fuel ($B7 fuelHi, $B8 fuelLo)
        self.fuel = config.FUEL_MAX

        # Lives
        self.lives = config.LIVES_START

        # Animation
        self.explode_timer = 0
        self.explode_frames = 4  # Frames to show explosion

        # Visual
        # IMPORTANT: Player.draw() blits the SCALED sprite (ENTITY_SCALE=2,
        # 16×36), so self.rect must come from the same scaled surface —
        # otherwise collision detection (CollisionSystem uses self.rect)
        # only catches the top-left quadrant of the visible jet, letting
        # bullets/enemies graze the right and bottom edges. Pre-existing
        # bug exposed by the JET_Y anchor move (the offset_y delta made
        # the collision/visible asymmetry clearly visible).
        self.surface = self.sprite_loader.get_scaled("jet_JetStraight") or self._create_fallback_jet(scale=2)
        self.rect = self.surface.get_rect()

    def update(self, controls):
        """Update player position based on input (JTZ lines 1475–1548)."""
        if self.state != config.PLAYER_FLYING:
            return

        # Horizontal movement (JTZ: speedX, playerX)
        if controls.right():
            self.speed_x = min(self.speed_x + 1, config.PLAYER_MAX_SPEED_X)
        elif controls.left():
            self.speed_x = max(self.speed_x - 1, -config.PLAYER_MAX_SPEED_X)
        else:
            # Decelerate
            if self.speed_x > 0:
                self.speed_x = max(0, self.speed_x - 1)
            elif self.speed_x < 0:
                self.speed_x = min(0, self.speed_x + 1)

        # Vertical speed control (JTZ: speedY controls scroll speed, NOT position)
        # speedY range: $FE (base) down to $41 (max fast scroll)
        # Moving UP: speedY -= 2 (faster scroll)
        # Moving DOWN: speedY += 2 (slower scroll)
        # No input: speedY → $FE (base scroll)
        if controls.up():
            self.speed_y = max(0x41, self.speed_y - 2)
        elif controls.down():
            self.speed_y = min(0xFE, self.speed_y + 2)
        else:
            # Return to base speed
            if self.speed_y < 0xFE:
                self.speed_y = min(0xFE, self.speed_y + 2)
            elif self.speed_y > 0xFE:
                self.speed_y = max(0xFE, self.speed_y - 2)

        # Apply horizontal velocity
        self.x += self.speed_x

        # Clamp to screen bounds
        self.x = max(0, min(self.x, config.SCREEN_WIDTH - 8))

    def crash(self):
        """Player crashes into river bank or enemy."""
        if self.state == config.PLAYER_FLYING:
            self.state = config.PLAYER_EXPLODING
            self.explode_timer = self.explode_frames
            self.lives -= 1

    def die(self):
        """Player dies (fuel exhausted or crashed)."""
        self.state = config.PLAYER_EXPLODING
        self.explode_timer = self.explode_frames
        self.lives = max(0, self.lives - 1)

    def refuel(self):
        """Refuel when over a fuel depot."""
        self.fuel = min(self.fuel + config.FUEL_REFUEL_RATE, config.FUEL_MAX)

    def deplete_fuel(self):
        """Drain fuel each frame."""
        self.fuel = max(0, self.fuel - config.FUEL_DRAIN_RATE)

    def reset(self):
        """Reset player to initial state."""
        self.x = config.SCREEN_WIDTH // 2
        self.y = config.JET_TOP_Y
        self.speed_x = 0
        self.speed_y = 0
        self.state = config.PLAYER_FLYING
        self.fuel = config.FUEL_MAX
        self.lives = config.LIVES_START
        self.explode_timer = 0

    def draw(self, screen: pygame.Surface, renderer, offset_y: int = 0):
        """Draw the player jet or explosion at internal coordinates.

        Anchors the SCALED sprite to (self.x, self.y) treating them as
        the top-left of the original 8×N sprite — visual extends
        `ENTITY_SCALE`× further right and down. Collision bounds in
        CollisionSystem still use the original 8×N rect (drawn from
        self.x, self.y) so the engine's logic remains unchanged.
        """
        if self.state == config.PLAYER_EXPLODING:
            self.explode_timer -= 1
            if self.explode_timer <= 0:
                self.state = config.PLAYER_FLYING
                if self.lives > 0:
                    self.x = config.SCREEN_WIDTH // 2
                    self.y = config.JET_TOP_Y
                    self.speed_x = 0
            return

        # Scaled jet sprite (16×36 by default — was 8×18 — at ENTITY_SCALE=2)
        jet_sprite = self.sprite_loader.get_scaled("jet_JetStraight")
        if jet_sprite:
            if self.speed_x < 0:
                jet_sprite = pygame.transform.flip(jet_sprite, True, False)
            screen.blit(jet_sprite, (self.x, self.y + offset_y))
        else:
            screen.blit(self.surface, (self.x, self.y + offset_y))

    def _create_fallback_jet(self, scale: int = 2) -> pygame.Surface:
        """Create a fallback jet sprite if extraction data unavailable.

        Args:
            scale: Pixel scale multiplier (default 2 to match ENTITY_SCALE
                   so the fallback stays the same visible size as the byte-
                   array sprite loader path).
        """
        w, h = 8, 18
        surface = pygame.Surface((w * scale, h * scale), pygame.SRCALPHA)
        # Simple jet shape: nose up, wings middle, tail narrow.
        for row in range(h):
            if row < 6:
                pixels = list(range(4 - row, 4 + row + 1))
            elif row < 10:
                pixels = list(range(4 - 4, 4 + 4 + 1))
            else:
                pixels = list(range(4 - (9 - row), 4 + (9 - row) + 1))
            for col in pixels:
                surface.fill(
                    config.COLORS["YELLOW"],
                    (col * scale, row * scale, scale, scale),
                )
        return surface
