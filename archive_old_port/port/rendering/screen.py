"""
River Raid — Screen renderer.

Handles drawing of all game elements: river, entities, title screen,
game over screen. Uses JTZ color palette for authentic look.

Visible-fidelity notes (post-fix):
  - River banks are drawn BITWISE from PFPAT row bytes (1 bit = 8 internal
    pixels, MSB-first). The byte is mapped over a 64-internal-pixel-wide
    variable region on each side (mirrored on the right). Banks visually
    step/wedge across the 28 rows of each PFPAT block.
  - Title and Game-Over screens use Atari-styled layout (PLAYER 1/2 label,
    ACTION / GAME SELECT / DIFFICULTY rows in original colors).
"""

import pygame

from port.core import config


# Atari-styled 5x7 pixel-glyph table for the title + game-over strings.
# Each glyph is 7 rows of 5 columns; '#' = lit, '.' = unlit.
GLYPHS_5x7 = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    'G': ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
    'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '#....', '####.', '....#', '....#', '####.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
    ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
}


def draw_text_5x7(
    screen: pygame.Surface,
    text: str,
    x: int,
    y: int,
    color: tuple[int, int, int],
    scale: int = 2,
) -> int:
    """Draw Atari-styled 5x7 pixel-glyph text. Returns right-edge X.

    Unsupported characters render as a blank space.
    """
    cx = x
    for ch in text.upper():
        glyph = GLYPHS_5x7.get(ch, GLYPHS_5x7[' '])
        for row, run in enumerate(glyph):
            for col, mark in enumerate(run):
                if mark == '#':
                    pygame.draw.rect(
                        screen,
                        color,
                        (cx + col * scale, y + row * scale, scale, scale),
                    )
        # 5 wide + 1 column gap = 6 px-wide per char
        cx += 6 * scale
    return cx


class ScreenRenderer:
    """Renders the game to the pygame screen."""

    # 1 PFPAT bit = 8 internal pixels (JTZ: 4 TIA clocks/px × 2 buffer-scale)
    BIT_W = 8

    def __init__(self, screen: pygame.Surface):
        self.screen = screen

    def draw_rect(self, x: int, y: int, w: int, h: int, color: tuple[int, int, int]):
        """Draw a filled rectangle."""
        pygame.draw.rect(self.screen, color, (x, y, w, h))

    def draw_circle(self, x: int, y: int, radius: int, color: tuple[int, int, int]):
        """Draw a filled circle."""
        pygame.draw.circle(self.screen, color, (x, y), radius)

    def draw_river(self, screen: pygame.Surface, river, offset_y: int = 0):
        """Draw the river with bitwise-interpreted PFPAT rows.

        Each row_byte is treated as an 8-column bitmap (MSB-first: bit 7
        is the leftmost of the 8). On the 320-wide screen, each bit covers
        8 internal pixels — so the 8-bit variable region = 64 internal px
        wide on each side. The center 192 px is water (BLUE).        Right side is a mirror of the left.

        Bank color: per-BLOCK alternation (every BLOCK_SIZE=32 rows),
        driven by `river.get_block_color_for_row()` (see JTZ's
        `PFcolor = GREEN | PF_COLOR_FLAG` set once per block in
        `DisplayKernel`).

        Mirrors JTZ color registers:
          - Background (water): BLUE ($84)       – COLUBK
          - River banks:        GREEN ($D2) / GREEN_BANK_LIGHT ($D6)  – COLUPF
        """
        river_top = config.ROAD_HEIGHT
        river_bottom = config.SCREEN_HEIGHT - config.ROAD_HEIGHT
        river_h = river_bottom - river_top
        bit_w = self.BIT_W
        var_w = 8 * bit_w  # 64 px per side

        # Water base across the entire river area
        screen.fill(
            config.COLORS["BLUE"],
            (0, river_top + offset_y, config.SCREEN_WIDTH, river_h),
        )

        # Per-row: render the byte into left variable region + mirrored right region
        for row in range(river_top, river_bottom):
            row_byte = river.get_row_byte(row - river_top)
            # Bank color: per-BLOCK alternation (matches JTZ's `PFcolor = GREEN |
            # PF_COLOR_FLAG` set once per block in `DisplayKernel SUBROUTINE` —
            # lines "DEC blockNum; LDA blockLst,X; AND #PF_COLOR_FLAG; ORA #GREEN;
            # STA PFcolor"). Each 32-line block shares ONE color. Use the public
            # accessor `river.get_block_color_for_row()` rather than indexing the
            # `_block_colors` array directly to keep encapsulation + arrow index
            # convention (top-of-screen = newest block = array index -1).
            bank_color = river.get_block_color_for_row(row - river_top)
            y_screen = row + offset_y

            # LEFT variable region: bit 7 (MSB) → leftmost 8-px column.
            for bit_i in range(8):
                bit_msb = 7 - bit_i
                if row_byte & (1 << bit_msb):
                    screen.fill(
                        bank_color,
                        (bit_i * bit_w, y_screen, bit_w, 1),
                    )
            # RIGHT mirror: same byte, mirrored. Bit 7 → rightmost 8-px column.
            for bit_i in range(8):
                bit_msb = 7 - bit_i
                if row_byte & (1 << bit_msb):
                    x0 = config.SCREEN_WIDTH - (bit_i + 1) * bit_w
                    screen.fill(
                        bank_color,
                        (x0, y_screen, bit_w, 1),
                    )

        # (No stripe padding — bitwise PFPat columns meet the water center
        # directly. A solid border stripe at x=64 and x=256 would draw extra
        # vertical artifacts regardless of the byte value of the pattern row.)

        # Road areas (top + bottom) with RoadColorTab pattern.
        # RoadColorTab: $04=BLACK, $08=LIGHT_GREY, $1C=YELLOW (only row 8 is yellow).
        road_colors = [
            config.COLORS["BLACK"], config.COLORS["BLACK"],
            config.COLORS["LIGHT_GREY"], config.COLORS["LIGHT_GREY"],
            config.COLORS["LIGHT_GREY"], config.COLORS["LIGHT_GREY"],
            config.COLORS["LIGHT_GREY"], config.COLORS["LIGHT_GREY"],
            config.COLORS["YELLOW"],
            config.COLORS["LIGHT_GREY"], config.COLORS["LIGHT_GREY"],
            config.COLORS["LIGHT_GREY"], config.COLORS["LIGHT_GREY"],
        ]
        for row in range(config.ROAD_HEIGHT):
            color_idx = row % len(road_colors)
            screen.fill(road_colors[color_idx],
                        (0, row + offset_y, config.SCREEN_WIDTH, 1))
            screen.fill(road_colors[color_idx],
                        (0, config.SCREEN_HEIGHT - config.ROAD_HEIGHT + row + offset_y,
                         config.SCREEN_WIDTH, 1))

    def draw_title(self, screen: pygame.Surface):
        """Atari-styled title screen.

        Layout (top → bottom):
          - "ATARI" wordmark (white, top center)
          - "RIVER RAID" (yellow, large, dead center)
          - "1  PLAYER" / "2  PLAYERS" red tags
          - "ACTION" / "GAME SELECT" / "DIFFICULTY" labels
          - "PRESS SPACE TO START" tickle at bottom
        """
        screen.fill(config.COLORS["BLACK"])

        # ATARI wordmark
        atari_x = config.SCREEN_WIDTH // 2 - 9   # 5 chars × 6 px/char / 2
        draw_text_5x7(screen, "ATARI", atari_x, 14, config.COLORS["WHITE"], scale=3)

        # RIVER RAID brand
        brand = "RIVER RAID"
        brand_w = len(brand) * 6 * 4
        draw_text_5x7(
            screen, brand,
            (config.SCREEN_WIDTH - brand_w) // 2, 70,
            config.COLORS["YELLOW"], scale=4,
        )

        # Player count + game-select / difficulty row
        for i, label_pair in enumerate([
            ("1 PLAYER",  config.COLORS["RED"]),
            ("2 PLAYERS", config.COLORS["RED"]),
        ]):
            label = label_pair[0]
            color = label_pair[1]
            label_w = len(label) * 6 * 2
            draw_text_5x7(
                screen, label,
                (config.SCREEN_WIDTH - label_w) // 2, 130 + i * 24,
                color, scale=2,
            )

        # Right-pane labels (Atari-styled position)
        pane_x = config.SCREEN_WIDTH - 100
        draw_text_5x7(screen, "ACTION",     pane_x, 130, config.COLORS["WHITE"], scale=2)
        draw_text_5x7(screen, "GAME SELECT", pane_x - 6, 154, config.COLORS["WHITE"], scale=2)
        draw_text_5x7(screen, "DIFFICULTY",  pane_x,     178, config.COLORS["WHITE"], scale=2)

        # Difficulty dots ("1" / "2" / "B" buttons)
        for i, lbl in enumerate(["1", "2", "B"]):
            color = (config.COLORS["RED"] if i == 0
                     else config.COLORS["WHITE"] if i == 1
                     else config.COLORS["YELLOW"])
            draw_text_5x7(
                screen, lbl,
                pane_x + 88, 130 + i * 24,
                color, scale=2,
            )

        # Tickle text
        tickle = "PRESS SPACE TO START"
        tickle_w = len(tickle) * 6 * 2
        draw_text_5x7(
            screen, tickle,
            (config.SCREEN_WIDTH - tickle_w) // 2, 210,
            config.COLORS["YELLOW"], scale=2,
        )

    def draw_game_over(self, screen: pygame.Surface, score: int):
        """Atari-styled game-over screen."""
        screen.fill(config.COLORS["BLACK"])

        # GAME OVER large
        title = "GAME OVER"
        title_w = len(title) * 6 * 4
        draw_text_5x7(
            screen, title,
            (config.SCREEN_WIDTH - title_w) // 2, 60,
            config.COLORS["RED"], scale=4,
        )

        # Final score
        score_str = f"FINAL SCORE {score}"
        score_w = len(score_str) * 6 * 2
        draw_text_5x7(
            screen, score_str,
            (config.SCREEN_WIDTH - score_w) // 2, 130,
            config.COLORS["YELLOW"], scale=2,
        )

        # Restart prompt
        prompt = "PRESS SPACE TO CONTINUE"
        prompt_w = len(prompt) * 6 * 2
        draw_text_5x7(
            screen, prompt,
            (config.SCREEN_WIDTH - prompt_w) // 2, 180,
            config.COLORS["WHITE"], scale=2,
        )
