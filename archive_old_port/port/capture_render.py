"""Capture a screenshot of the current game render for comparison."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pygame
pygame.init()

# Match reference dimensions (640x480)
from port.core.config import WINDOW_WIDTH, WINDOW_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT, FPS
from port.core.game import Game

os.environ["SDL_VIDEO_WINDOW_POS"] = "100,100"

screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
internal = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
game = Game(internal)
game.state = "PLAYING"
game.scroll_offset = 0

# Advance the river a few times to get a populated scene
import random
game.rng = random.Random(42)
for _ in range(30):
    game.river.advance()

# Position player in middle of screen
game.player.x = 160
game.player.y = 100

# Spawn some enemies
for _ in range(20):
    game.spawner.update()
    new_e = game.spawner.get_new_enemies()
    new_f = game.spawner.get_new_fuel()
    game.enemies.extend(new_e)
    game.fuel_depots.extend(new_f)
    for e in game.enemies:
        e.y += 4

# Render
game.draw()
scaled = pygame.transform.scale(internal, (WINDOW_WIDTH, WINDOW_HEIGHT))
screen.blit(scaled, (0, 0))
pygame.display.flip()

# Save screenshot
pygame.image.save(internal, "port/current_render.png")
print(f"Saved {SCREEN_WIDTH}x{SCREEN_HEIGHT} screenshot to port/current_render.png")
pygame.quit()
