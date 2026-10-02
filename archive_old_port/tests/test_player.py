"""Tests for player entity."""

from port.entities.player import Player
from port.core import config


class MockControls:
    def __init__(self):
        self._pressed = set()
        self._just_pressed = set()

    def left(self):
        return False

    def right(self):
        return False

    def up(self):
        return False

    def down(self):
        return False

    def fire(self):
        return False

    def just_fired(self):
        return False


def test_player_initial_state():
    player = Player()
    assert player.x == config.SCREEN_WIDTH // 2
    assert player.y == config.JET_TOP_Y
    assert player.speed_x == 0
    assert player.speed_y == 0
    assert player.state == config.PLAYER_FLYING
    assert player.fuel == config.FUEL_MAX
    assert player.lives == config.LIVES_START


def test_player_move_right():
    player = Player()
    controls = MockControls()
    # Simulate right movement
    for _ in range(3):
        controls._pressed.add(164)  # LEFT key
        controls._pressed.discard(163)  # RIGHT key
        # Override left/right methods
        orig_left = controls.left
        orig_right = controls.right
        controls.left = lambda: False
        controls.right = lambda: True
        player.update(controls)
    assert player.speed_x > 0


def test_player_fuel_depletion():
    player = Player()
    for _ in range(100):
        player.deplete_fuel()
    assert player.fuel == 155


def test_player_refuel():
    player = Player()
    player.fuel = 50
    player.refuel()
    assert player.fuel > 50
    assert player.fuel <= config.FUEL_MAX


def test_player_crash():
    player = Player()
    player.crash()
    assert player.state == config.PLAYER_EXPLODING
    assert player.lives == config.LIVES_START - 1


def test_player_die():
    player = Player()
    player.die()
    assert player.state == config.PLAYER_EXPLODING


def test_player_reset():
    player = Player()
    player.x = 100
    player.y = 100
    player.fuel = 50
    player.lives = 1
    player.crash()
    player.reset()
    assert player.x == config.SCREEN_WIDTH // 2
    assert player.y == config.JET_TOP_Y
    assert player.fuel == config.FUEL_MAX
    assert player.lives == config.LIVES_START
    assert player.state == config.PLAYER_FLYING
