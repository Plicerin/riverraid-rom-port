"""Capture MULTIPLE deterministic gameplay frames for the internal
SanityAssertion test.

Saves 5 frames at internal 320x240 after natural-evolution update() ticks:
  - port/after_game_t000.png   (T=0   — fresh _reset_game() state)
  - port/after_game_t060.png   (T=60  — mid-scroll)
  - port/after_game_t120.png   (T=120 — same as capture_after.py's frame)
  - port/after_game_t180.png   (T=180 — late scroll-in)
  - port/after_game_t240.png   (T=240 — end of INTRO_SCROLL=48..)

The single-frame `port/capture_after.py` continues to produce
`port/after_title.png`, `port/after_game.png`, and `port/after_over.png`
— its consumers remain unchanged.

Why a separate script (not a flag on capture_after.py)?
  - Keep the existing 3-frame capture path unchanged so its consumers
    (the single-frame canary tests in tests/test_pixel_diff_helpers.py)
    don't break.
  - Isolate the 5-frame loop logic for easy auditing + easier deletion
    in the future if the multi-frame approach is no longer required.
  - The 5-frame deterministic capture is ~5x the runtime of the
    single-frame baseline (~1s on dummy driver, ~5s on a real windowed
    driver).

All updates run with `game.skip_collisions = True` so the no-input
demo loop never enters PLAYER_EXPLODING (which would zero out the
jet sprite blit and skew INV-C downstream).

Usage (from project root):
    cd /c/Users/vrock/Documents/riverraid-rom-extract
    python port/capture_after_seq.py
"""
import sys
import os

# Allow imports of port.* modules from the project root.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pygame

from port.core.config import (WINDOW_WIDTH, WINDOW_HEIGHT, SCREEN_WIDTH,
                               SCREEN_HEIGHT)
from port.core.game import Game

# Headless: no display event loop, no GPU, but Pygame Surface() still
# works so game.draw() can blit to it and pygame.image.save() can write
# a PNG.
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
pygame.init()
# Sub-system init: `port.rendering.hud.HUD.__init__` instantiates
# `pygame.font.Font(None, 16)` which requires `pygame.font` to be
# initialized explicitly. `pygame.init()` above only initializes the
# top-level display module; font + mixer + other subsystems need a
# separate `pygame.font.init()` call. Without this, Game(internal)
# aborts with `pygame.error: font not initialized` on the very first
# `Game.__init__` call into `HUD()`.
pygame.font.init()
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
internal = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
game = Game(internal)


# Frames to capture, in deterministic natural-evolution tick order.
# Picked to span the intro-scroll in INTRO_SCROLL=48 -> t=240 plus the
# post-scroll gameplay before tick 300 (post which the demo loop hits
# fuel-empty GAME_OVER). Order is monotonic but the set check below is
# order-free.
FRAMES_TO_CAPTURE = {0, 60, 120, 180, 240}


def main() -> None:
    # Initialize gameplay state identical to capture_after.py's
    # after_game.png capture: PLAYING + skip_collisions + scroll_offset=0.
    game.state = "PLAYING"
    game.scroll_offset = 0
    game._reset_game()
    # Suppress collision / fuel / game-over so the no-input demo loop
    # renders the world without entering PLAYER_EXPLODING (Player.draw
    # blits nothing in that state) or GAME_OVER (Game.draw replaces
    # with game_over screen).
    game.skip_collisions = True

    # Walk t through 0..240 inclusive; capture at the documented indices
    # BEFORE the next update so each save corresponds to a stabilized
    # post-update state (matches capture_after.py's save-at-end behavior).
    for t in range(241):
        if t in FRAMES_TO_CAPTURE:
            game.draw()
            out_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                f"after_game_t{t:03d}.png",
            )
            pygame.image.save(internal, out_path)
            byte_size = os.path.getsize(out_path)
            print(f"t={t:3d}: saved {os.path.basename(out_path)} "
                  f"({byte_size} bytes)", flush=True)
        if t < 240:
            try:
                game.update()
            except Exception as exc:
                # Mirror capture_after.py's tolerance: log + break, leave
                # the loop's prior captures on disk. The test fixture
                # only needs one frame per index so partial completion
                # is graceful.
                print(f"[update] iter={t} failed: {exc}", flush=True)
                break

    game.skip_collisions = False
    pygame.quit()
    print("done: 5-frame deterministic capture complete")


if __name__ == "__main__":
    main()
