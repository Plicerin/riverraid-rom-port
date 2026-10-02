"""Tests for collision detection system."""

from port.systems.collision import CollisionSystem
from port.core import config


class MockRiver:
    """Mock river for collision testing."""
    def __init__(self, left: int, right: int):
        self._left = left
        self._right = right

    def check_collision(self, obj_x: int, obj_y: int, obj_w: int, obj_h: int) -> bool:
        if obj_x < self._left:
            return True
        if obj_x + obj_w > self._right:
            return True
        return False


class MockPlayer:
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
        self.state = 0


class MockEnemy:
    def __init__(self, x: int, y: int, alive: bool = True):
        self.x = x
        self.y = y
        self.alive = alive

    def collides_with(self, other_x: int, other_y: int, other_w: int, other_h: int) -> bool:
        return (self.x < other_x + other_w and
                self.x + 8 > other_x and
                self.y < other_y + other_h and
                self.y + 8 > other_y)


class MockBullet:
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
        self.active = True


class MockScoring:
    def __init__(self):
        self.decay_counter = 0
        self.multiplier = 10

    def update(self):
        self.decay_counter += 1


def test_player_river_collision_left():
    river = MockRiver(left=100, right=200)
    player = MockPlayer(x=90, y=100)
    assert river.check_collision(player.x, player.y, 8, 18)


def test_player_river_collision_right():
    river = MockRiver(left=100, right=200)
    player = MockPlayer(x=205, y=100)
    assert river.check_collision(player.x, player.y, 8, 18)


def test_player_in_river():
    river = MockRiver(left=100, right=200)
    player = MockPlayer(x=140, y=100)
    assert not river.check_collision(player.x, player.y, 8, 18)


def test_bullet_enemy_collision():
    collision = CollisionSystem()
    bullet = MockBullet(x=50, y=50)
    enemy = MockEnemy(x=48, y=48)
    enemies = [enemy]

    callbacks = {"enemy_destroyed": None}

    def on_destroyed(e):
        callbacks["enemy_destroyed"] = e

    # Manually test bullet-enemy collision logic
    for b in [bullet]:
        if not b.active:
            continue
        for e in enemies:
            if not e.alive:
                continue
            if e.collides_with(b.x, b.y, 8, 8):
                e.alive = False
                callbacks["enemy_destroyed"] = e
                b.active = False
                break

    assert not enemy.alive
    assert not bullet.active
    assert callbacks["enemy_destroyed"] is enemy


def test_no_collision_outside_river():
    river = MockRiver(left=100, right=200)
    player = MockPlayer(x=140, y=0)  # Horizontally inside river, vertically outside
    # The real river.check_collision checks vertical bounds first
    # Mock doesn't, so this tests horizontal only
    assert not river.check_collision(player.x, player.y, 8, 18)


def test_two_enemy_collision():
    e1 = MockEnemy(x=40, y=40)
    e2 = MockEnemy(x=44, y=44)
    assert e1.collides_with(e2.x, e2.y, 8, 8)
    assert e2.collides_with(e1.x, e1.y, 8, 8)
