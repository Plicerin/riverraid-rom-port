"""Decode the user-screenshot PNG(s) into ASCII grids using PIL.

Compares against the LSB-first JetStraight layout from src/data.js so
we can definitively report which sprites are vertically OR horizontally
flipped vs. the source ROM.
"""
from PIL import Image
import os
import sys

# Reference layout (LSB-first, top-to-bottom, byte index = sprite row):
# byte 0: 0   → ........
# byte 1: 0   → ........
# byte 2: 0   → ........
# byte 3: 0   → ........
# byte 4: 0   → ........
# byte 5: 42  → .X.X.X..
# byte 6: 62  → .XXXXX..
# byte 7: 28  → ..XXX...
# byte 8: 8   → ...X....
# byte 9: 73  → X..X..X.
# byte 10: 107 → XX.X.XX.
# byte 11: 127 → XXXXXXX.
# byte 12: 127 → XXXXXXX.
# byte 13: 62  → .XXXXX..
# byte 14: 28  → ..XXX...
# byte 15: 8   → ...X....
# byte 16: 8   → ...X....
# byte 17: 8   → ...X....

BYTES = [0, 0, 0, 0, 0, 42, 62, 28, 8, 73, 107, 127, 127, 62, 28, 8, 8, 8]

LSB_FIRST = []
MSB_FIRST = []
for b in BYTES:
    lsb_row = ''.join('X' if (b >> i) & 1 else '.' for i in range(8))
    msb_row = ''.join('X' if (b >> (7 - i)) & 1 else '.' for i in range(8))
    LSB_FIRST.append(lsb_row)
    MSB_FIRST.append(msb_row)
LSB_VERTICAL_FLIP = LSB_FIRST[::-1]
LSB_HORIZONTAL_FLIP = [r[::-1] for r in LSB_FIRST]
LSB_180 = [r[::-1] for r in LSB_FIRST[::-1]]


def grid_at(img, x0, y0, w, h, label='', threshold=60):
    """Crop a region and return ASCII-grid; print each row."""
    print(f'\n--- region ({x0},{y0}) {w}x{h}  threshold={threshold}  {label} ---')
    out = []
    for dy in range(h):
        line = ''
        y = y0 + dy
        if y < 0 or y >= img.height:
            line = ' ' * w
            out.append(line)
            continue
        for dx in range(w):
            x = x0 + dx
            if x < 0 or x >= img.width:
                line += ' '
                continue
            r, g, b = img.getpixel((x, y))[:3]
            line += 'X' if (r + g + b) // 3 > threshold else '.'
        out.append(line)
        print(f'  r{y:3d}: {line}')
    return out


def compare_captured(captured, expected_list, label_list):
    """Find which expected layout has the best Hamming match to captured."""
    print(f'\n    --- comparison for {label_list[0]}-shape sprite ---')
    best_match = ('?', -1)
    # Try ALL the captured 8x18 patches inside the box, sliding.
    H = len(captured)
    W = len(captured[0])
    if W < 8 or H < 18:
        print('    (region too small)')
        return
    captures = []
    for sy in range(0, H - 17):
        for sx in range(0, W - 7):
            patch = [captured[sy + r][sx:sx+8] for r in range(18)]
            captures.append((sx, sy, patch))
    if not captures:
        print('    (no 8x18 sub-patches available)')
        return

    # For each candidate layout, compute total Hamming over best-aligned patch.
    for layout, lname in zip(
        [LSB_FIRST, MSB_FIRST, LSB_VERTICAL_FLIP, LSB_HORIZONTAL_FLIP, LSB_180],
        ['LSB(forward)', 'MSB(forward)', 'LSB(vert-flip)', 'LSB(horiz-flip)', 'LSB(180-rot)']
    ):
        best = None
        for sx, sy, patch in captures:
            score = sum(
                1 for r in range(18) for c in range(8)
                if patch[r][c] != layout[r][c]
            )
            if best is None or score < best[0]:
                best = (score, sx, sy)
        sx, sy = best[1], best[2]
        print(f'    {lname:18s}  best_score={best[0]:3d}/144  at (sx,sy)=({sx},{sy})  patch_preview:')
        p = best[2] and None or None
        # Re-read patch for printing
        patch = [captured[sy + r][sx:sx+8] for r in range(18)]
        for row in patch[:6]: print(f'        captured: {row}')
        print('        ...')
        for row in patch[-3:]: print(f'        captured: {row}')


def index_scan(img, label=''):
    """Print the entire canvas as a coarse 4x8 sampled index."""
    print(f'\n=== compact index scan  {label}  {img.width}x{img.height} ===')
    SX, SY = 4, 8
    for y in range(0, img.height, SY):
        line = ''
        for x in range(0, img.width, SX):
            r, g, b = img.getpixel((x, y))[:3]
            line += '#' if (r + g + b) // 3 > 100 else ('.' if (r + g + b) // 3 > 30 else ' ')
        print(f'y={y:3d} | {line}')


def main():
    paths = []
    for p in ['jet_user.png', '/tmp/jet_user.png', '/tmp/jet_title.png',
              '/tmp/jet_playing.png', '/tmp/jet_user_playing.png']:
        if os.path.exists(p):
            paths.append(p)

    for path in paths:
        img = Image.open(path).convert('RGB')
        print(f'\n\n========== {path}  mode={img.mode}  WxH={img.width}x{img.height} ==========')

        # Index sweep — see what's actually on the canvas
        index_scan(img, label=path)

        # Try several candidate player locations
        for cx, cy in [(312, 432), (310, 430), (308, 428), (314, 434),
                       (160, 217), (200, 230), (260, 215), (160, 230)]:
            local = img.crop((cx - 12, cy - 12, cx + 12, cy + 18))
            grid_at(local, 0, 0, 24, 30, label=f'player try ({cx},{cy})')


if __name__ == '__main__':
    main()
