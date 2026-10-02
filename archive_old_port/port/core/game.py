"""
River Raid — Main game class.

Implements the top-level game loop, state machine, and entity management.
State machine mirrors JTZ's `gameMode` variable:
  -1 = game over,  0 = running,  1..48 = intro scroll
"""

import pygame

from port.core import config
from port.entities.player import Player
from port.entities.enemy import Enemy
from port.entities.bullet import Bullet
from port.entities.explosion import Explosion
from port.entities.fuel import FuelDepot
from port.systems.river import River
from port.systems.scoring import ScoringSystem
from port.systems.spawning import Spawner
from port.systems.random import LFSR
from port.systems.collision import CollisionSystem
from port.rendering.screen import ScreenRenderer
from port.rendering.hud import HUD
from port.input.controls import Controls


class Game:
    """Top-level game state manager."""

    def __init__(self, screen: pygame.Surface):
        self.screen = screen
        self.clock = pygame.time.Clock()
        self.lfsr = LFSR()  # Shared LFSR for river + spawner

        # Game state (mirrors JTZ gameMode: $C6)
        self.state = "TITLE"  # TITLE, SCROLL_IN, PLAYING, GAME_OVER
        self.scroll_counter = config.INTRO_SCROLL
        self.scroll_offset = 0  # Vertical camera offset during intro scroll

        # Initialize systems
        self.controls = Controls()
        self.river = River(self.lfsr)
        self.spawner = Spawner(self.lfsr)
        self.player = Player()
        self.spawner.set_sprite_loader(self.player.sprite_loader)
        self.bullets: list[Bullet] = []
        self.enemies: list[Enemy] = []
        self.fuel_depots: list[FuelDepot] = []
        self.explosions: list[Explosion] = []
        self.scoring = ScoringSystem()
        self.collision = CollisionSystem()
        self.renderer = ScreenRenderer(screen)
        self.hud = HUD()
        # Demo-mode toggle for headless capture (e.g. capture_after.py).
        # When True, collision + fuel-depletion + game-over checks are
        # suppressed so a no-input screenshot session can render the world
        # without the player entering PLAYER_EXPLODING (which Player.draw()
        # leaves blank) or transitioning to GAME_OVER (which Game.draw()
        # replaces with the game_over screen). Production play keeps this
        # False; flip True ONLY for the demo capture's 120-tick loop.
        self.skip_collisions = False

    def handle_event(self, event: pygame.event.Event):
        """Process input events."""
        self.controls.handle_event(event)

        if self.state == "TITLE":
            if self.controls.just_fired():
                print(f"[DEBUG] TITLE -> SCROLL_IN (state was {self.state})")
                self.state = "SCROLL_IN"
                self.scroll_counter = config.INTRO_SCROLL
                self._reset_game()

        elif self.state == "PLAYING":
            if self.controls.just_fired() and not any(b.active for b in self.bullets):
                self._fire_bullet()

        elif self.state == "GAME_OVER":
            if self.controls.just_fired():
                self.state = "TITLE"

    def update(self):
        """Main update loop — mirrors JTZ's MainLoop structure."""
        if self.state == "TITLE":
            self.controls.update()
            return

        if self.state == "SCROLL_IN":
            self.controls.update()
            self.scroll_counter -= 1
            # Compute vertical offset: 48→0, 1→SCREEN_HEIGHT (reveal from top)
            # In ROM: scroll counter maps to vertical offset via scroll table
            self.scroll_offset = int(
                (config.INTRO_SCROLL - self.scroll_counter) / config.INTRO_SCROLL * config.SCREEN_HEIGHT
            )
            # Draw during scroll-in
            self.renderer.draw_river(self.screen, self.river, offset_y=self.scroll_offset)
            self.player.draw(self.screen, self.renderer, offset_y=self.scroll_offset)
            pygame.display.flip()
            if self.scroll_counter <= 0:
                self.scroll_offset = 0
                self.state = "PLAYING"
            return

        if self.state == "GAME_OVER":
            self.controls.update()
            return

        # ── PLAYING state ─────────────────────────────────────
        self.controls.update()

        # Player
        self.player.update(self.controls)

        # Bullets
        for bullet in self.bullets:
            bullet.update()
        self.bullets = [b for b in self.bullets if b.active]

        # Spawning (new enemies/fuel at top)
        self.spawner.update()
        new_enemies = self.spawner.get_new_enemies()
        new_fuel = self.spawner.get_new_fuel()
        self.enemies.extend(new_enemies)
        self.fuel_depots.extend(new_fuel)

        # Enemies
        for enemy in self.enemies:
            enemy.update(self.river)
        self.enemies = [e for e in self.enemies if e.alive]

        # Fuel depots
        for fuel in self.fuel_depots:
            fuel.update(self.river)
        self.fuel_depots = [f for f in self.fuel_depots if f.alive]

        # Explosions
        for explosion in self.explosions:
            explosion.update()
        self.explosions = [e for e in self.explosions if e.alive]

        # Scrolling (JTZ: speedY controls scroll speed, not player Y position)
        # speedY: $FE = base (1px/frame), lower = faster (up), higher = slower (down)
        # Map speedY ($41-$FE) to scroll amount (3 → 1)
        scroll_speed = self.player.speed_y
        if scroll_speed >= 0xF0:
            scroll_amt = 1
        elif scroll_speed >= 0xC0:
            scroll_amt = 2
        else:
            scroll_amt = 3
        for _ in range(scroll_amt):
            self.river.advance()

        # Collision / fuel / game-over suppression for the headless capture
        # demo (see self.skip_collisions docstring in __init__). Default
        # gameplay keeps all three paths active.
        if not self.skip_collisions:
            # Collision detection
            self.collision.check_all(
                self.player, self.bullets, self.enemies,
                self.fuel_depots, self.explosions, self.river,
                self.scoring, self._on_enemy_destroyed, self._on_fuel_pickup,
                self._on_crash,
            )

            # Fuel depletion
            self.player.deplete_fuel()
            if self.player.fuel <= 0:
                self._on_player_fuel_exhausted()

            # Game over check
            if self.player.lives <= 0:
                self.state = "GAME_OVER"

    def draw(self):
        """Render the current frame to internal screen."""
        if self.state == "TITLE":
            self.renderer.draw_title(self.screen)
            pygame.display.flip()
            return

        if self.state == "SCROLL_IN":
            self.renderer.draw_river(
                self.screen, self.river, offset_y=self.scroll_offset
            )
            self.player.draw(self.screen, self.renderer, offset_y=self.scroll_offset)
            pygame.display.flip()
            return

        if self.state == "GAME_OVER":
            self.renderer.draw_game_over(self.screen, self.scoring.score)
            pygame.display.flip()
            return

        # Draw river
        self.renderer.draw_river(self.screen, self.river)

        # Draw enemies
        for enemy in self.enemies:
            enemy.draw(self.screen, self.renderer)

        # Draw fuel depots
        for fuel in self.fuel_depots:
            fuel.draw(self.screen, self.renderer)

        # Draw bullets
        for bullet in self.bullets:
            if bullet.active:
                bullet.draw(self.screen, self.renderer)

        # Draw player
        self.player.draw(self.screen, self.renderer)

        # Draw explosions
        for explosion in self.explosions:
            explosion.draw(self.screen, self.renderer)

        # Draw HUD
        self.hud.draw(
            self.screen,
            score=self.scoring.score,
            fuel=self.player.fuel,
            lives=self.player.lives,
            multiplier=self.scoring.multiplier,
        )

        pygame.display.flip()

    def _reset_game(self):
        """Reset game state for a new game."""
        self.player.reset()
        self.bullets.clear()
        self.enemies.clear()
        self.fuel_depots.clear()
        self.explosions.clear()
        self.scoring.reset()
        self.river.reset()
        self.spawner.river = self.river
        self.spawner.reset()

    def _fire_bullet(self):
        """Fire a missile (player jet gun)."""
        bullet = Bullet(
            x=self.player.x,
            y=self.player.y - 8,  # Start above player
        )
        self.bullets.append(bullet)

    def _on_enemy_destroyed(self, enemy: Enemy):
        """Handle enemy destroyed by bullet."""
        self.scoring.add(enemy.score_value)
        explosion = Explosion(
            x=enemy.x,
            y=enemy.y,
            explosion_type=enemy.explosion_type,
        )
        self.explosions.append(explosion)
        enemy.alive = False

    def _on_fuel_pickup(self, fuel: FuelDepot):
        """Handle player refueling."""
        self.player.refuel()
        explosion = Explosion(
            x=fuel.x,
            y=fuel.y,
            explosion_type=1,  # Small explosion for fuel
        )
        self.explosions.append(explosion)
        fuel.alive = False

    def _on_crash(self):
        """Handle player crashing into river banks or enemies."""
        self.player.crash()

    def _on_player_fuel_exhausted(self):
        """Handle player running out of fuel."""
        explosion = Explosion(
            x=self.player.x,
            y=self.player.y,
            explosion_type=2,  # Large explosion
        )
        self.explosions.append(explosion)
        self.player.die()
