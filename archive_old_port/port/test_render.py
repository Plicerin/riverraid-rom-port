"""Quick render test — runs 60 frames then exits."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pygame
pygame.init()
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Render Test")
clock = pygame.time.Clock()

from port.core.config import COLORS
from port.rendering.screen import ScreenRenderer
from port.rendering.hud import HUD
from port.systems.river import River
from port.systems.random import LFSR
from port.entities.player import Player

lfsr = LFSR()
river = River(lfsr)
player = Player()
renderer = ScreenRenderer(screen)
hud = HUD()

print(f"Screen size: {screen.get_size()}")
print(f"Player: x={player.x}, y={player.y}")
print(f"River: left={river.left_bank}, right={river.right_bank}")

# Draw 60 frames (1 second)
for i in range(60):
    screen.fill(COLORS["BLACK"])
    renderer.draw_river(screen, river)
    player.draw(screen, renderer)
    hud.draw(screen, score=12345, fuel=80, lives=3, multiplier=1)
    pygame.display.flip()
    clock.tick(60)

print(f"Frame {60} drawn successfully")
print("Window should be visible for 1 second — try moving it if it's off-screen")
clock.tick(1)  # Hold for 1 second

pygame.quit()
print("Done — exit code 0")
