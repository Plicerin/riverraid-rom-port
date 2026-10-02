"""Decode the user-supplied screenshot into ASCII grids to find sprite orientations.

Strategy:
1. Read the PNG (RGBA, 640x480 expected).
2. For each intended sprite region, emit a binary grid.
3. Cross-reference against the LSB-first expected layout from src/data.js.
"""
import zlib
import struct
import os
import sys


def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    pos = 8
    width = height = 0
    idat = b''
    color_type = 0
    while pos < len(data):
        L = struct.unpack('>I', data[pos:pos+4])[0]
        ct_ = data[pos + 4:pos + 8]
        cd = data[pos + 8:pos + 8 + L]
        if ct_ == b'IHDR':
            width, height = struct.unpack('>II', cd[:8])
            color_type = cd[9]
        elif ct_ == b'IDAT':
            idat += cd
        elif ct_ == b'IEND':
            break
        pos += 12 + L
    raw = zlib.decompress(idat)
    bpp = 4 if color_type in (4, 6) else 3
    stride = width * bpp + 1
    rows = []
    prev = bytearray(width * bpp)
    for r in range(height):
        ftype = raw[r * stride]
        line = bytearray(raw[r * stride + 1: r * stride + stride])
        if ftype == 0:
            pass
        elif ftype == 1:
            for i in range(len(line)):
                left = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + left) & 0xFF
        elif ftype == 2:
            for i in range(len(line)):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ftype == 3:
            for i in range(len(line)):
                left = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + (left + prev[i]) // 2) & 0xFF
        elif ftype == 4:
            for i in range(len(line)):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else b if pb <= pc else c
                line[i] = (line[i] + pr) & 0xFF
        rows.append(bytes(line))
        prev = line
    return width, height, rows, bpp


def grid_at(rows, bpp, x0, y0, w, h, bright_threshold=60, label=''):
    H = len(rows)
    W = len(rows[0]) // bpp
    print(f'\n--- region ({x0},{y0}) {w}x{h} {label} ---')
    out = []
    for r in range(max(0, y0), min(y0 + h, H)):
        row = rows[r]
        cells = []
        for c in range(max(0, x0), min(x0 + w, W)):
            i = c * bpp
            R, G, B = row[i], row[i + 1], row[i + 2]
            bright = (R + G + B) // 3
            cells.append('X' if bright > bright_threshold else '.')
        out.append(''.join(cells))
    for i, line in enumerate(out):
        print(f'  r{i + y0:3d}: {line}')
    return out


def full_index(rows, bpp, label=''):
    H = len(rows)
    W = len(rows[0]) // bpp
    print(f'\n=== compact index scan {label} {W}x{H} ===')
    # step 8px vertical, 4px horizontal
    for y in range(0, H, 8):
        row = rows[y]
        line = ''
        for x in range(0, W, 4):
            i = x * bpp
            R, G, B = row[i], row[i + 1], row[i + 2]
            bright = (R + G + B) // 3
            line += '#' if bright > 100 else ('.' if bright > 30 else ' ')
        print(f'y={y:3d} | {line[:160]}')


def main():
    paths = []
    # Check the project jet_user.png and /tmp versions
    for p in ['jet_user.png', '/tmp/jet_user.png', '/tmp/jet_title.png',
              '/tmp/jet_playing.png', '/tmp/jet_user_playing.png']:
        if os.path.exists(p):
            paths.append(p)

    for path in paths:
        W, H, rows, bpp = read_png(path)
        print(f'\n\n========== {path} ==========')
        print(f'info: W={W} H={H} bpp={bpp}')

        # 1. Player region (display coords): center 2x scale of (160, 217) internal
        # Display: x=304..319, y=416..451 (8x18 displayed = 16x36)
        # But the player can drift — sample a wider window
        for sample_x, sample_y in [(312, 432), (310, 430), (308, 428), (314, 434), (304, 420)]:
            grid_at(rows, bpp, sample_x - 8, sample_y - 8, 24, 26,
                    bright_threshold=60, label=f'player-around ({sample_x},{sample_y})')

        # 2. Look at the bottom strip as a whole — see what's actually there
        print('\n--- bottom strip y=400..460 ---')
        for y in [410, 420, 430, 440, 450]:
            row = rows[y]
            line = ''
            for x in range(0, W, 2):
                i = x * bpp
                R, G, B = row[i], row[i + 1], row[i + 2]
                bright = (R + G + B) // 3
                line += '#' if bright > 100 else ('.' if bright > 30 else ' ')
            print(f'y={y:3d} | {line}')


if __name__ == '__main__':
    main()
