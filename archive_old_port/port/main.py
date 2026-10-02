"""
River Raid — Python/pygame port entry point.

Based on the 4KB USA ROM, cross-referenced against
Thomas Jentzsch's 2001 6502 disassembly.
"""

import sys
import os

# Add parent directory to path so we can import port modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pygame

from port.core.config import WINDOW_WIDTH, WINDOW_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT, FPS, INTRO_SCROLL
from port.core.game import Game


def main():
    """Initialize pygame and launch the game."""
    os.environ["SDL_VIDEO_WINDOW_POS"] = "100,100"
    os.environ["SDL_VIDEO_CENTERED"] = "1"
    
    pygame.init()
    # Internal resolution is 320x240, scaled to 640x480 for display
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("River Raid — Python Port")
    clock = pygame.time.Clock()
    
    # Create internal-resolution surface for all rendering
    internal_screen = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    
    game = Game(internal_screen)
    
    # Draw title screen immediately so window isn't blank
    game.draw()
    # Scale and show
    scaled = pygame.transform.scale(internal_screen, (WINDOW_WIDTH, WINDOW_HEIGHT))
    screen.blit(scaled, (0, 0))
    pygame.display.flip()
    
    # Auto-start after 2 seconds so the user doesn't need to focus the window
    import time
    time.sleep(2)
    if game.state == "TITLE":
        try:
            game.state = "SCROLL_IN"
            game.scroll_counter = INTRO_SCROLL
            game._reset_game()
            print("[AUTO-START] Game started after 2s", flush=True)
        except Exception as e:
            print(f"[ERROR] Auto-start failed: {e}", flush=True)
            raise

    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                game.handle_event(event)

        try:
            game.update()
            game.draw()
        except Exception as e:
            print(f"[ERROR] {e}", flush=True)
            raise
        
        # Scale internal resolution to display
        scaled = pygame.transform.scale(internal_screen, (WINDOW_WIDTH, WINDOW_HEIGHT))
        screen.blit(scaled, (0, 0))
        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()


if __name__ == "__main__":
    main()
