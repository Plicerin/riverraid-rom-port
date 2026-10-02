"""Capture AFTER-fix screenshots for visual diff against reference.

Saves 3 frames at internal 320x240 + their 2x scaled versions:
  - port/after_title.png
  - port/after_game.png
  - port/after_over.png

These are intended to be visually compared to:
  - extraction/riverraid_verified_sprite_sheet.png (sprite reference)
  - port/before_title.png (legacy title render)
  - external Stella-captured frames of the original ROM
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pygame
pygame.init()

from port.core.config import (WINDOW_WIDTH, WINDOW_HEIGHT, SCREEN_WIDTH,
                               SCREEN_HEIGHT, FPS)
from port.core.game import Game

# Headless-friendly: no display event loop, just draw a single frame.
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
internal = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
game = Game(internal)


def save(label: str) -> None:
    game.draw()
    pygame.image.save(internal, f"port/after_{label}.png")
    scaled = pygame.transform.scale(internal, (WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.image.save(scaled, f"port/after_{label}_2x.png")
    print(f"saved port/after_{label}.png + port/after_{label}_2x.png")


# 1. Title screen
game.state = "TITLE"
save("title")

# 2. Gameplay frame at T=120 ticks of natural evolution
game.state = "PLAYING"
game.scroll_offset = 0
game._reset_game()
# Suppress collision / fuel / game-over so the no-input demo loop can
# render the world without the player entering PLAYER_EXPLODING (Player.draw
# blits nothing in that state) or transitioning to GAME_OVER (Game.draw
# replaces with game_over screen). Restored below before save().
game.skip_collisions = True
for _ in range(120):
    try:
        game.update()
    except Exception as e:
        print(f"[update] {e}", flush=True)
        break
game.skip_collisions = False
save("game")

# 3. Game over
game.state = "GAME_OVER"
save("over")

pygame.quit()
print("done")
