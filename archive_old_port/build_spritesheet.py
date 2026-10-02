"""
River Raid — Sprite Sheet Generator
====================================

Generate a single PNG that lays out every sprite from src/data.js in three
labeled groups:

  1. PLAYER        — JetStraight, JetMove, JetExplode
  2. MOBS (ENEMIES)— PlaneA/B, Heli0A/B, Heli1A/B, ShipA/B, HouseA/B, BridgeB
  3. PROPS         — FuelA/B, Explosion1A/B, Explosion2A/B

The bit-decoding matches src/data.js bytesToPixels exactly: each byte is
taken as an 8-bit horizontal pixel row with bit positions 0..7 (LSB→MSB)
mapping to sprite columns 0..7. Fill colors come from src/palette.js
(NTSC VCS) so the sheet reflects what the player sees in-game.

Output: riverraid_spritesheet.png at the project root.

Usage:  python build_spritesheet.py
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json

# ── Layout ────────────────────────────────────────────────────────────
SCALE = 6                  # each sprite pixel becomes an SCALE×SCALE block
SPRITE_W = 8               # every sprite is 8 columns wide
CELL_PAD_X = 18            # horizontal padding inside one sprite cell
CELL_PAD_Y = 16            # vertical padding inside one sprite cell
LABEL_H = 26               # vertical room reserved for the per-sprite label
GROUP_HDR_H = 36           # vertical room reserved for each group header
GROUP_GAP = 28             # vertical gap between groups
CELL_GAP = 18              # horizontal gap between sprite cells in a row
BG = (0, 0, 0)             # dark background so every sprite color pops
GRID = (32, 32, 32)        # subtle gridlines between sprite cells
HDR_FILL = (253, 244, 152) # PALETTE.YELLOW for group headers
LABEL_FILL = (255, 255, 255)
LABEL_DIM = (180, 180, 180)

# ── VCS Palette (R, G, B) ────────────────────────────────────────────
# Mirrors src/palette.js. Single canonical color pick per sprite type.
PALETTE = {
    'BLACK':         (0,     0,   0),
    'GREY':          (0x30,  0x30, 0x30),
    'LIGHT_GREY':    (0x60,  0x60, 0x60),
    'BROWN':         (0x51,  0x47, 0x1F),
    'YELLOW':        (0xFD,  0xF4, 0x98),
    'ORANGE':        (0xFD,  0xA8, 0x4C),
    'RED':           (0xFA,  0x38, 0x18),
    'BLUE':          (0x00,  0x28, 0x68),
    'CYAN':          (0x60,  0xF0, 0xF0),
    'GREEN':         (0x00,  0xB4, 0x00),
    'LIGHT_GREEN':   (0x00,  0xE0, 0x00),
    'PLANE_GREEN':   (0x56,  0x60, 0x44),
    'PLANE_GREY':    (0x4E,  0x4E, 0x4E),
    'WHITE':         (0xFF,  0xFF, 0xFF),
    'BRIDGE_RED':    (0x90,  0x10, 0x08),
    'BRIDGE_DARK':   (0x48,  0x18, 0x0C),
}

# Color pick for each sprite when laying out the sheet. Readability was
# chosen over strict game accuracy: SHIP_WHITE=(84,84,84), SHIP_LIGHT=(24,24,24),
# DARK_BLUE=(100,85,64) are dim against the black BG, so four sprites use
# brighter substitutes. See src/palette.js ENEMY_PALETTES for strict values.
SPRITE_COLOR = {
    'JetStraight':   PALETTE['YELLOW'],
    'JetMove':       PALETTE['YELLOW'],
    'JetExplode':    PALETTE['ORANGE'],
    'PlaneA':        PALETTE['PLANE_GREEN'],
    'PlaneB':        PALETTE['PLANE_GREY'],
    'Heli0A':        PALETTE['CYAN'],
    'Heli0B':        PALETTE['BLUE'],
    'Heli1A':        PALETTE['CYAN'],
    'Heli1B':        PALETTE['BLUE'],
    'ShipA':         PALETTE['WHITE'],
    'ShipB':         PALETTE['GREY'],
    'HouseA':        PALETTE['BROWN'],
    'HouseB':        PALETTE['LIGHT_GREEN'],
    'BridgeB':       PALETTE['BRIDGE_RED'],
    'FuelA':         PALETTE['RED'],
    'FuelB':         PALETTE['ORANGE'],
    'Explosion0':    PALETTE['ORANGE'],
    'Explosion1A':   PALETTE['ORANGE'],
    'Explosion1B':   PALETTE['RED'],
    'Explosion2A':   PALETTE['ORANGE'],
    'Explosion2B':   PALETTE['RED'],
}

# Each per-sprite cell gets a one-line subtitle explaining what it is.
SPRITE_NOTE = {
    'JetStraight':   'PLAYER (default)',
    'JetMove':       'PLAYER (tilted)',
    'JetExplode':    'PLAYER (dying)',
    'PlaneA':        'PLANE right',
    'PlaneB':        'PLANE left',
    'Heli0A':        'HELI0 right',
    'Heli0B':        'HELI0 left',
    'Heli1A':        'HELI1 right',
    'Heli1B':        'HELI1 left',
    'ShipA':         'SHIP right',
    'ShipB':         'SHIP left',
    'HouseA':        'HOUSE on shore',
    'HouseB':        'HOUSE on shore (alt)',
    'BridgeB':       'BRIDGE — flag 1st part of section',
    'FuelA':         'FUEL depot (alt)',
    'FuelB':         'FUEL depot (default)',
    'Explosion0':    'EXPLOSION (no-op)',
    'Explosion1A':   'EXPLOSION 1 (small) frame A',
    'Explosion1B':   'EXPLOSION 1 (small) frame B',
    'Explosion2A':   'EXPLOSION 2 (large) frame A',
    'Explosion2B':   'EXPLOSION 2 (large) frame B',
}

# ── Sprite byte arrays (canonical, ported from JTZ disassembly) ───────
# The byte sequences come from `extraction/riverraid_player_jet_report.json`
# (the jet sprite) and `extraction/riverraid_labeled_sprites.json` (every
# other sprite). Both are themselves derived from the JTZ disassembly
# (reference/jentzsch_2001/River Raid.asm). The bytes are stored in JTZ
# LISTING order — byte[0] first, byte[N-1] last.
#
# draw_sprite() applies one transformation: TIA bit-order. JTZ's
# annotated asm (e.g. `$2A ; |  X X X |`) shows MSB-first because
# that's how humans read hex left-to-right. But the JTZ kernel writes
# those bytes verbatim to GRP0, and the Atari 2600 TIA hardware shifts
# bit 0 out first during scanout — so bit 0 corresponds to the LEFTMOST
# pixel on the actual 1982 cartridge's display. This means the ROM
# bytes are HORIZONTALLY MIRRORED relative to JTZ's text annotations,
# but byte stacking is unchanged (byte[0] is still the TOP rendered row).
#
# We render the JTZ-as-graphics view (hardware-faithful), so:
#   - byte[0]    = TOP rendered row     (unchanged)
#   - bit 0      = LEFTMOST pixel (col 0)    (TIA hardware order)
#   - bit 7      = RIGHTMOST pixel (col 7)
#
# This matches what the user sees on the actual 1982 cartridge and
# matches the runtime JS renderer (bytesToPixels in src/data.js).
# It ALSO matches port/assets/sprites.py (Python port), which has
# always used `byte_val & (1 << bit)` to render — same convention.
SPRITE_BYTES = {
    # PLAYER (18 / 18 / 17 rows)
    'JetStraight': [
        0, 0, 0, 0, 0,
        42, 62, 28, 8,
        73, 107, 127, 127, 62, 28, 8, 8, 8,
    ],
    'JetMove': [
        0, 0, 0, 0, 2,
        46, 60, 24, 8,
        10, 46, 62, 62, 60, 24, 8, 8, 8,
    ],
    'JetExplode': [
        0, 0, 0, 0, 0,
        2, 8, 16,
        0, 64, 8, 33, 68, 16, 4, 8,
        0,
    ],
    # MOBS (9 / 8 / 9 / 8 / 9 / 8 / 7 / 7)
    'PlaneA': [0, 0, 0, 0, 0, 48, 79, 198, 0],
    'PlaneB': [0, 0, 0, 0, 0, 56, 255, 128],
    'Heli0A': [0, 0, 0, 0, 4, 255, 159, 4, 7],
    'Heli0B': [0, 0, 0, 14, 142, 255, 14, 28],
    'Heli1A': [0, 0, 0, 0, 4, 255, 159, 4, 28],
    'Heli1B': [0, 0, 0, 14, 142, 255, 14, 7],
    'ShipA':  [0, 0, 0, 124, 254, 120, 16],
    'ShipB':  [0, 0, 0, 252, 255, 48, 16],
    'HouseA': [0, 4, 14, 31, 14, 4, 0, 254, 170, 254, 56, 0, 0, 0],
    'HouseB': [0, 4, 31, 14, 4, 4, 0, 170, 254, 124, 0],
    'BridgeA': [66],
    'BridgeB': [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 66],
    # PROPS (11 / 12 / 13 / 9 / 8 / 11 / 9)
    'FuelA':        [254, 222, 222, 254, 222, 222, 254, 214, 214, 222, 206],
    'FuelB':        [198, 222, 222, 198, 206, 198, 198, 214, 254, 222, 222, 124],
    'Explosion0':   [0] * 13,
    'Explosion1A':  [0, 0, 0, 0, 4, 2, 8, 4, 0],
    'Explosion1B':  [0, 0, 0, 0, 16, 32, 64, 16],
    'Explosion2A':  [0, 0, 0, 4, 136, 16, 4, 128, 16, 0, 0],
    'Explosion2B':  [0, 0, 0, 32, 2, 65, 32, 2, 4],
}

# ── Group definitions (order + subset of SPRITE_BYTES) ───────────────
GROUPS = [
    ('PLAYER', ['JetStraight', 'JetMove', 'JetExplode']),
    ('MOBS (ENEMIES)', [
        'PlaneA', 'PlaneB',
        'Heli0A', 'Heli0B',
        'Heli1A', 'Heli1B',
        'ShipA',  'ShipB',
        'HouseA', 'HouseB',
        'BridgeB',
    ]),
    ('PROPS', ['FuelA', 'FuelB', 'Explosion1A', 'Explosion1B', 'Explosion2A', 'Explosion2B']),
]


def sprite_width_px(sprite_bytes):
    """Width in pixels = 8 sprite columns × SCALE."""
    return SPRITE_W * SCALE


def sprite_height_px(sprite_bytes):
    """Height in pixels = number of byte-rows × SCALE."""
    return len(sprite_bytes) * SCALE


def cell_width(sprite_bytes):
    return sprite_width_px(sprite_bytes) + 2 * CELL_PAD_X


def cell_height(sprite_bytes):
    return sprite_height_px(sprite_bytes) + LABEL_H + CELL_PAD_Y


def draw_sprite(img, sprite_bytes, x0, y0, color, grid=None):
    """Draw one sprite (top-left corner at x0, y0) and an outline rectangle.

    Applies the TIA hardware bit-order transformation: bit 0 is the
    LEFTMOST pixel (col 0), bit 7 is the RIGHTMOST (col 7). This mirrors
    JTZ's annotated asm left-to-right, because the JTZ kernel writes
    those bytes verbatim to GRP0 but the Atari 2600 TIA shifts bit 0
    out first during line scanout.

    byte[0] is the TOP rendered row (unchanged from JTZ listing order).
    The combination of (byte[0]=top, bit-0=leftmost) is exactly what the
    user sees on the actual 1982 cartridge and matches the runtime JS
    renderer (bytesToPixels in src/data.js) and the Python port
    (port/assets/sprites.py — `byte_val & (1 << bit)`).
    """
    draw = ImageDraw.Draw(img)
    for row_idx in range(len(sprite_bytes)):
        byte = sprite_bytes[row_idx]
        b = byte & 0xFF
        for col in range(SPRITE_W):
            # bit 0 = leftmost (col 0) — TIA hardware scanout order.
            if (b >> col) & 1:
                px = x0 + col * SCALE
                py = y0 + row_idx * SCALE
                draw.rectangle(
                    [px, py, px + SCALE - 1, py + SCALE - 1],
                    fill=color,
                )
    if grid:
        w = sprite_width_px(sprite_bytes)
        h = sprite_height_px(sprite_bytes)
        draw.rectangle(
            [x0 - 1, y0 - 1, x0 + w, y0 + h],
            outline=grid,
        )


def draw_label(draw, x, y, text, fill, font):
    draw.text((x, y), text, fill=fill, font=font)


def main():
    font_big = ImageFont.load_default(size=22)
    font_med = ImageFont.load_default(size=14)
    font_dim = ImageFont.load_default(size=10)

    # ── Compute layout ───────────────────────────────────────────────
    # Each row in a group is a horizontal strip of cells. We pick a row
    # width target = max cell_height in that group + LABEL_H + CELL_PAD_Y
    # so all groups line up vertically.

    group_blocks = []           # list of (group_name, rows-of-cells)
    for name, sprite_list in GROUPS:
        # Pack sprites into rows: a row holds whichever can fit width 1024.
        # For our short lists, just put them all on one row each.
        row_widths = []
        for sname in sprite_list:
            cw = cell_width(SPRITE_BYTES[sname])
            row_widths.append(cw)
        rows = [sprite_list]
        rows_widths = [sum(row_widths) + CELL_GAP * (len(row_widths) - 1)]
        rows_cell_heights = [
            max(cell_height(SPRITE_BYTES[s]) for s in rows[0])
        ]
        group_blocks.append((name, rows, rows_widths, rows_cell_heights))

    # Image width = max group row width + 80 px of margin
    inner_w = max(w for _, _, w_list, _ in group_blocks for w in w_list)
    IMAGE_W = inner_w + 80

    # Image height = top + Σ(group_hdr + row_height + GROUP_GAP) + bottom
    IMAGE_H = (
        40 + 32
        + sum(GROUP_HDR_H + sum(rh_list) + GROUP_GAP
              for _, _, _, rh_list in group_blocks)
    )

    img = Image.new('RGB', (IMAGE_W, IMAGE_H), BG)
    draw = ImageDraw.Draw(img)

    # Top title bar
    title = 'River Raid — Sprite Sheet (8-px wide VCS sprites, 6× upscaled)'
    bbox = draw.textbbox((0, 0), title, font=font_big)
    title_w = bbox[2] - bbox[0]
    draw.text(((IMAGE_W - title_w) // 2, 6), title, fill=HDR_FILL, font=font_big)
    total_h = GROUP_HDR_H + 8

    # Track per-sprite atlas positions for the manifest (Finding 2):
    # this list is populated below and emitted as a JSON `atlas:` block
    # in the manifest so downstream code can use the PNG as a runtime atlas.
    sprite_positions = []

    for name, rows, rows_widths, rh_list in group_blocks:
        # Group header
        draw.text((32, total_h), name, fill=HDR_FILL, font=font_big)

        # Draw each row of sprites
        for row_sprites, row_w, rh in zip(rows, rows_widths, rh_list):
            row_y = total_h + GROUP_HDR_H + 4
            row_x = (IMAGE_W - row_w) // 2

            x = row_x
            for sname in row_sprites:
                sb = SPRITE_BYTES[sname]
                color = SPRITE_COLOR.get(sname, (255, 255, 255))
                cells = cell_width(sb)
                # Top-centered sprite within the cell
                sprite_x = x + CELL_PAD_X
                sprite_y = row_y + CELL_PAD_Y
                draw_sprite(img, sb, sprite_x, sprite_y, color, grid=GRID)

                # Record atlas position (in PNG pixel coords).
                sprite_positions.append({
                    'name':  sname,
                    'group': name,
                    'x':     sprite_x,
                    'y':     sprite_y,
                    'w':     sprite_width_px(sb),
                    'h':     sprite_height_px(sb),
                })

                # Label
                label_x = x + CELL_PAD_X
                label_y = sprite_y + sprite_height_px(sb) + 4
                draw_label(draw, label_x, label_y,
                           sname, LABEL_FILL, font_med)
                draw_label(draw, label_x, label_y + 14,
                           f"8×{len(sb)} px  ({SPRITE_NOTE.get(sname, '')})",
                           LABEL_DIM, font_dim)
                x += cells + CELL_GAP

            total_h = row_y + rh + 4

        total_h += GROUP_GAP

    # ── Save ─────────────────────────────────────────────────────────
    out_path = Path(__file__).resolve().parent / 'riverraid_spritesheet.png'
    img.save(out_path, 'PNG')
    print(f"Saved: {out_path}  ({IMAGE_W}×{IMAGE_H} px)")

    # ── Emit manifest (+ Finding 2: atlas JSON block for runtime use) ─
    manifest_lines = ['# riverraid_spritesheet manifest',
                      f'# image: {IMAGE_W}x{IMAGE_H} px  scale={SCALE}',
                      f'# groups: {len(GROUPS)}',
                      '']
    manifest_lines.append('groups:')
    for name, sprite_list in GROUPS:
        manifest_lines.append(f'  - name: {name}')
        manifest_lines.append(f'    sprites: {len(sprite_list)}')
        for sname in sprite_list:
            sb = SPRITE_BYTES[sname]
            manifest_lines.append(
                f'      - {sname:14s} 8x{len(sb):2d}  hex={[hex(b & 0xFF) for b in sb]}'
            )

    # Atlas block: per-sprite PNG-pixel rectangles so the PNG can be
    # used as a runtime atlas (e.g. ctx.drawImage(sheet, x, y, w, h, ...)
    # in the JS port). Each entry is a single-line JSON object.
    manifest_lines.append('')
    manifest_lines.append('# Runtime atlas: load this PNG + read `atlas:` to draw')
    manifest_lines.append('# any sprite with: ' +
                          'ctx.drawImage(atlasImg, x, y, w, h, dstX, dstY, dstW, dstH)')
    manifest_lines.append('atlas:')
    for pos in sprite_positions:
        manifest_lines.append('  - ' + json.dumps(pos, separators=(', ', ': ')))

    (out_path.with_suffix('.manifest.txt')).write_text('\n'.join(manifest_lines) + '\n')
    print(f"Manifest: {out_path.with_suffix('.manifest.txt')}")


if __name__ == '__main__':
    main()
