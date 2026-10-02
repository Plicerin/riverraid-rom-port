"""Tests for core configuration constants."""

from port.core import config


def test_screen_dimensions():
    assert config.SCREEN_WIDTH == 320
    assert config.SCREEN_HEIGHT == 240
    assert config.WINDOW_WIDTH == config.SCREEN_WIDTH * config.SCALE
    assert config.WINDOW_HEIGHT == config.SCREEN_HEIGHT * config.SCALE


def test_color_palette():
    assert "BLACK" in config.COLORS
    assert "YELLOW" in config.COLORS
    assert "RED" in config.COLORS
    assert all(len(c) == 3 for c in config.COLORS.values())


def test_game_constants():
    assert config.NUM_BLOCKS == 6
    assert config.SECTION_BLOCKS == 16
    assert config.BLOCK_SIZE == 32
    assert config.MAX_LEVEL == 48
    assert config.JET_Y == 19
    assert config.PLAYER_JET_ROWS == 18
    assert config.JET_TOP_Y == 190  # 240 - 13 - 19 - 18 = playfield_bottom - gap - sprite_h


def test_score_values():
    assert config.SCORES["PLANE"] == 100
    assert config.SCORES["HELI0"] == 60
    assert config.SCORES["SHIP"] == 30
    assert config.SCORES["BRIDGE"] == 500
    assert config.SCORES["HOUSE"] == 0
    assert config.SCORES["FUEL"] == 80


def test_enemy_ids():
    assert config.ENEMY_PLANE == 4
    assert config.ENEMY_HELI0 == 5
    assert config.ENEMY_HELI1 == 6
    assert config.ENEMY_SHIP == 7
    assert config.ENEMY_BRIDGE == 8
    assert config.ENEMY_HOUSE == 9
    assert config.ENEMY_FUEL == 10


def test_shapes():
    assert config.SHAPE_EXPLOSION0 == 0
    assert config.SHAPE_PLANE == 4
    assert config.SHAPE_SHIP == 7
    assert config.SHAPE_BRIDGE == 8
    assert config.SHAPE_FUEL == 10
