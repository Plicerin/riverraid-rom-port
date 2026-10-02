"""
River Raid — Unit tests for entity classes.

Tests basic entity creation, state transitions, and property access.
"""

import sys
import os
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from port.entities.player import Player
from port.entities.enemy import Enemy
from port.entities.bullet import Bullet
from port.entities.explosion import Explosion
from port.entities.fuel import FuelDepot
from port.core import config


class TestPlayer:
    """Test player jet entity."""

    def test_initial_state(self):
        """Player should start in flying state with full fuel."""
        player = Player()
        assert player.state == config.PLAYER_FLYING
        assert player.fuel == config.FUEL_MAX
        assert player.lives == config.LIVES_START
        assert player.x == config.SCREEN_WIDTH // 2
        assert player.y == config.JET_TOP_Y

    def test_fuel_depletion(self):
        """Fuel should decrease by drain rate each update."""
        player = Player()
        initial_fuel = player.fuel
        player.deplete_fuel()
        assert player.fuel == initial_fuel - config.FUEL_DRAIN_RATE

    def test_fuel_clamp(self):
        """Fuel should not go below 0."""
        player = Player()
        player.fuel = 0
        player.deplete_fuel()
        assert player.fuel == 0

    def test_refuel(self):
        """Refueling should increase fuel."""
        player = Player()
        player.fuel = 100
        player.refuel()
        assert player.fuel == 100 + config.FUEL_REFUEL_RATE

    def test_refuel_max(self):
        """Fuel should not exceed max."""
        player = Player()
        player.fuel = config.FUEL_MAX - 1
        player.refuel()
        assert player.fuel == config.FUEL_MAX

    def test_crash(self):
        """Crash should trigger explosion state."""
        player = Player()
        player.crash()
        assert player.state == config.PLAYER_EXPLODING
        assert player.explode_timer == player.explode_frames

    def test_crash_reduces_lives(self):
        """Crash should reduce lives."""
        player = Player()
        initial_lives = player.lives
        player.crash()
        assert player.lives == initial_lives - 1

    def test_reset(self):
        """Reset should restore initial state."""
        player = Player()
        player.fuel = 0
        player.lives = 0
        player.state = config.PLAYER_EXPLODING
        player.reset()
        assert player.fuel == config.FUEL_MAX
        assert player.lives == config.LIVES_START
        assert player.state == config.PLAYER_FLYING


class TestEnemy:
    """Test enemy entity."""

    def test_create_plane(self):
        """Plane enemy should have correct properties."""
        enemy = Enemy(config.ENEMY_PLANE, 50, 10)
        assert enemy.type == config.ENEMY_PLANE
        assert enemy.x == 50
        assert enemy.y == 10
        assert enemy.alive is True
        assert enemy.score_value == config.SCORES["PLANE"]

    def test_create_ship(self):
        """Ship enemy should have correct properties."""
        enemy = Enemy(config.ENEMY_SHIP, 100, 20)
        assert enemy.type == config.ENEMY_SHIP
        assert enemy.score_value == config.SCORES["SHIP"]

    def test_create_bridge(self):
        """Bridge enemy should have correct properties."""
        enemy = Enemy(config.ENEMY_BRIDGE, 160, 30)
        assert enemy.type == config.ENEMY_BRIDGE
        assert enemy.score_value == config.SCORES["BRIDGE"]

    def test_create_fuel(self):
        """Fuel depot enemy should have correct properties."""
        enemy = Enemy(config.ENEMY_FUEL, 80, 40)
        assert enemy.type == config.ENEMY_FUEL
        assert enemy.score_value == config.SCORES["FUEL"]

    def test_collision(self):
        """Collision detection should work."""
        enemy = Enemy(config.ENEMY_SHIP, 50, 50)
        assert enemy.collides_with(50, 50, 8, 8) is True
        assert enemy.collides_with(0, 0, 8, 8) is False
        assert enemy.collides_with(100, 100, 8, 8) is False


class TestBullet:
    """Test bullet entity."""

    def test_create(self):
        """Bullet should start active."""
        bullet = Bullet(50, 100)
        assert bullet.x == 50
        assert bullet.y == 100
        assert bullet.active is True

    def test_update_moves_up(self):
        """Bullet should move upward each frame."""
        bullet = Bullet(50, 100)
        bullet.update()
        assert bullet.y == 100 - config.MISSILE_SPEED_Y

    def test_update_off_screen(self):
        """Bullet should deactivate when off screen."""
        bullet = Bullet(50, 0)
        bullet.update()
        assert bullet.active is False


class TestExplosion:
    """Test explosion entity."""

    def test_create(self):
        """Explosion should start alive with timer."""
        explosion = Explosion(50, 50, 1)
        assert explosion.alive is True
        assert explosion.timer == 6

    def test_update_decreases_timer(self):
        """Explosion timer should decrease each frame."""
        explosion = Explosion(50, 50, 1)
        explosion.update()
        assert explosion.timer == 5

    def test_update_dead(self):
        """Explosion should die when timer reaches 0."""
        explosion = Explosion(50, 50, 1)
        explosion.timer = 1
        explosion.update()
        assert explosion.alive is False

    def test_sizes(self):
        """Explosion sizes should match expected values."""
        e0 = Explosion(0, 0, config.SHAPE_EXPLOSION0)
        e1 = Explosion(0, 0, config.SHAPE_EXPLOSION1)
        e2 = Explosion(0, 0, config.SHAPE_EXPLOSION2)
        assert e0.size == 8
        assert e1.size == 10
        assert e2.size == 12


class TestFuelDepot:
    """Test fuel depot entity."""

    def test_create(self):
        """Fuel depot should start alive with FuelTab-driven dimensions."""
        fuel = FuelDepot(50, 10)
        assert fuel.x == 50
        assert fuel.y == 10
        assert fuel.alive is True
        # FUEL_TAB_0 default: width=1 (1 leading 1-bit in 0x80)
        assert fuel.width == 1
