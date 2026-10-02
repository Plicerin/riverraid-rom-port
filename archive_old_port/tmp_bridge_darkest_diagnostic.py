"""BRIDGE_DARKEST hypothesis diagnostic.

Tests whether the COLU* $12 register (BRIDGE_DARKEST seed RGB [0x40, 0x10, 0x08] =
(64,16,8)) actually renders pixels in the Stella captures, or whether the
emulator decodes it to near-black (which would explain why the bucket is
perpetually EMPTY across all 5 capture strategies tried).
"""
from PIL import Image
import os
from collections import Counter

CAPT_DIR = 'tools/stella_captures'

# Test 6 tiers of near-black-ish pixels in the captures
TARGETS = [
    ('BLACK strict (0,0,0) L2<=8',         (0,   0,  0),  8),
    ('NEAR_BLACK L_inf<=8',                 None,          8),
    ('BRIDGE_DARKEST seed (64,16,8) L2<=25',(64,  16,  8), 25),
    ('BRIDGE_DARKEST_LO (32,8,4) L2<=10',  (32,   8,  4), 10),
    ('ANY_DARK_RED (76,16,8) L2<=30',      (76,  16,  8), 30),
    ('ANY_DARK_BROWN (64,40,16) L2<=50',   (64,  40, 16), 50),
]

count_by_tier = {n: 0 for n, _, _ in TARGETS}
near_black_hist = Counter()

files = sorted(f for f in os.listdir(CAPT_DIR) if f.startswith('frame_'))
print(f'# Files scanned: {len(files)} (first: {files[0] if files else "—"}, last: {files[-1] if files else "—"})\n')

for f in files:
    img = Image.open(os.path.join(CAPT_DIR, f)).convert('RGB')
    for y in range(8, 168):
        for x in range(16, 144):
            r, g, b = img.getpixel((x,y))
            for name, tgt, tol in TARGETS:
                if tgt is None:
                    if max(r, g, b) <= 8:
                        count_by_tier[name] += 1
                        near_black_hist[(r//8, g//8, b//8)] += 1
                        break
                else:
                    dr, dg, db = r-tgt[0], g-tgt[1], b-tgt[2]
                    if dr*dr + dg*dg + db*db <= tol*tol:
                        count_by_tier[name] += 1
                        break

print('=== BRIDGE_DARKEST hypothesis diagnostic ===')
for name, _, _ in TARGETS:
    print(f'  {name:<48}  hits={count_by_tier[name]:>10}')

print()
print('=== Top-15 dominant near-black buckets (R//8, G//8, B//8) → count ===')
for rgb, cnt in near_black_hist.most_common(15):
    actual_rgb = (rgb[0]*8, rgb[1]*8, rgb[2]*8)
    print(f'  bucket=({rgb[0]:>2},{rgb[1]:>2},{rgb[2]:>2}) actual~={actual_rgb!s:<15}  count={cnt:>10}')

print()
print('=== Verdict ===')
bd_hits = count_by_tier['BRIDGE_DARKEST seed (64,16,8) L2<=25']
if bd_hits == 0:
    print('BRIDGE_DARKEST seed (64,16,8) does NOT appear in any of the 5970 captures.')
    print('Hypothesis confirmed: emulator decodes COLU* $12 to near-black.')
elif bd_hits > 100000:
    print(f'BRIDGE_DARKEST seed appears {bd_hits} times but is BG-filtered or merged by k-means.')
else:
    print(f'BRIDGE_DARKEST seed appears {bd_hits} times; partial visibility.')
