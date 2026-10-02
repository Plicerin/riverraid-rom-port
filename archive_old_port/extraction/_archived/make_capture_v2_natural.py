"""ARCHIVED (2026-07-15): make_capture_v2_natural.py — sister to make_capture_v2.py.

Same headless MAME → AVI → ffmpeg → PIL pipeline as v2, with ONE
deliberate change motivated by v2's ~98.79% mismatch finding (see
`extraction/_archived/make_capture_v2.py` § "Empirical result" + the
empirical run below): **NO `-nothrottle` flag**. MAME runs at native
60Hz cadence for `-seconds_to_run 8` (= 8 wall-seconds = ~480 frames).

### Why this sister file exists

The v2 run hypothesized that `-nothrottle` was the cause of the cart
parking in title-splash / menu state under `-aviwrite -video none`.
This sister file tests that hypothesis by removing `-nothrottle`
*without* changing any other capture parameter. If natural cadence
shows the playfield (≥60% blue water + ≥1 yellow jet-sprite pixel
at frame index 240), the cold-boot-to-running claim holds and
`-nothrottle` was the cause. If still title-splash, the cold-boot
claim itself is broken on MAME 0.287 headless and SPACE injection
becomes non-negotiable.

### Empirical result (2026-07-15 ~22:35)

* Ran for 8.03 wall-seconds (= 481 frames, 1 frame over the 480
  expected from `-seconds_to_run 8` — likely MAME's boundary-frame
  inclusion, not a frame-rate issue).
* Extracted 5 candidate frame indices (60, 120, 240, 360, 420) with
  STELLA_REMAP=1 (snap to canonical Stella NTSC palette).
* Per-candidate diff vs `port/after_game_t120.png` at ±15/channel:

  | Frame | Diff    | Blue(R<128,G<128,B>=128) | Yellow(R>200,G>200,B<128) |
  |-------|---------|--------------------------|--------------------------|
  | 60    | 99.02%  | ~22%                     | ~0.3%                    |
  | 120   | 99.03%  | ~22%                     | ~0.3%                    |
  | 240   | 99.04%  | **22.61%** (need ≥60%)   | 0.32% (need ≥0.01%)      |
  | 360   | 99.03%  | ~22%                     | ~0.3%                    |
  | 420   | 99.03%  | ~22%                     | ~0.3%                    |

* **Hypothesis A (was -nothrottle fault):** FALSIFIED. Removing
  -nothrottle barely moved the diff (~99.04% vs ~98.79%). The cart
  does NOT cold-boot to running under MAME 0.287 headless `-aviwrite`
  regardless of throttling mode.
* **Hypothesis B (cold-boot claim itself broken):** STRONGLY
  CONFIRMED. The cart parks in a perpetual title/menu overlay
  under MAME's a2600 headless driver without SPACE/FIRE injection.
  The scoop-binary lua engine cannot reach `ioport()` per
  `tests/stella_capture.md` § "MAME 0.287 scoop-binary lua-script
  attempts" v1–v6, so this gap is uncloseable headlessly.

### Implications

The internal SanityAssertion pivot (sanctioned in
`tests/stella_capture.md` § "Pivot to internal SanityAssertion")
is now **triple-validated** as the canonical validator for this
project:
1. LFSR-drift blocker (bank wedges diverge MAME-vs-port).
2. v2 -nothrottle capture (98.77–98.79% mismatch).
3. v2 natural-cadence capture (99.02–99.04% mismatch, marginally
   WORSE than v2 -nothrottle).

The only remaining paths to a real NTSC capture on this host are
documented in `tests/stella_capture.md` § "Working capture recipe
(MAME 0.287 GUI session)" — a manual GUI F12 capture (~5 min,
user-interactive, no toolchain install) or a MAME source build
(~30 min setup + ~10 min compile) with deeper lua bindings (still
subject to LFSR-drift blocker).

Beneath this banner block is the implementation.
"""

import os
import subprocess
import sys
import tempfile

from PIL import Image

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# Hard-fail on missing port.core — same rule as v1/v2.
try:
    from port.core import ntsc_palette
    NTSC_PALETTE = [
        c for c in (ntsc_palette.tia_to_rgb(code) for code in range(0, 0xFF, 2))
        if c is not None
    ]
except ImportError as exc:
    sys.stderr.write(
        f"CRITICAL: make_capture_v2_natural.py requires port.core.ntsc_palette "
        f"to build the canonical Stella palette. Import failed: {exc}\n"
        f"This script must run from {_PROJECT_ROOT} (the project root). "
        f"Try: cd {_PROJECT_ROOT} && python extraction/_archived/make_capture_v2_natural.py\n"
    )
    raise SystemExit(5)

# Same STELLA_REMAP=1 default as v2.
os.environ.setdefault("STELLA_REMAP", "1")


# ── Absolute Windows paths ────────────────────────────────────────
MAME_EXE = r"C:\Users\vrock\scoop\apps\mame\0.287\mame.exe"
ROM_PATH = (
    r"C:\Users\vrock\Documents\riverraid-rom-extract"
    r"\reference\river-raid-wiz-main\baserom.a26"
)
TEMP_DIR = tempfile.gettempdir()
AVI_PATH = os.path.join(TEMP_DIR, "mame_cap_v2_natural.avi")
FINAL_PNG_PATH = (
    r"C:\Users\vrock\Documents\riverraid-rom-extract"
    r"\extraction\riverraid_stella_reference_natural.png"
)
PORT_REFERENCE = os.path.join(_PROJECT_ROOT, "port", "after_game_t120.png")


# ── Helpers (mirror v2's helpers) ────────────────────────────────────

def remap_to_stella_palette(img):
    """Closest-Euclidean snap to canonical Stella NTSC colors. Black-floor
    for all-3-channels-under-30 pixels → (0,0,0)."""
    img_data = list(img.getdata())
    color_map = {}
    for c in set(img_data):
        r, g, b = c[:3]
        if r < 30 and g < 30 and b < 30:
            color_map[c] = (0, 0, 0)
            continue
        best_dist = float("inf")
        best_p = (0, 0, 0)
        for p in NTSC_PALETTE:
            d = (r - p[0]) ** 2 + (g - p[1]) ** 2 + (b - p[2]) ** 2
            if d < best_dist:
                best_dist = d
                best_p = p
        color_map[c] = best_p
    new_img = img.copy()
    new_img.putdata([color_map[c] for c in img_data])
    return new_img


def extract_frame_with_ffmpeg(avi_path, png_path, frame_index,
                              ffmpeg_exe="ffmpeg"):
    """Spawn ffmpeg to extract one specific frame from the AVI into a PNG."""
    cmd = [
        ffmpeg_exe, "-y",
        "-i", avi_path,
        "-vf", f"select=eq(n\\,{frame_index})",
        "-frames:v", "1",
        png_path,
    ]
    subprocess.run(cmd, check=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


# ── MAME invocation (the singular difference vs v2) ─────────────────

def run_mame_aviwrite_natural(avi_path, rom_path, mame_exe, seconds_to_run=8):
    """Spawn MAME headlessly with -aviwrite at NATIVE 60Hz (no -nothrottle).

    The single difference from v2: this function does NOT pass
    `-nothrottle`. MAME runs at the host's natural 60Hz cadence, so
    8 wall-seconds = ~480-481 frames. Per the empirical result
    documented in this file's banner, this never reaches the
    playfield either; the cart parks in title-splash state.
    """
    cmd = [
        mame_exe, "a2600",
        "-cart", rom_path,
        "-seconds_to_run", str(seconds_to_run),
        # NO -nothrottle here (the sole change vs v2)
        "-video", "none",
        "-sound", "none",
        "-noreadconfig",
        "-aviwrite", avi_path,
    ]
    print("Launching MAME (headless, NATIVE 60Hz, 480-frame capture):")
    print("  " + " ".join(cmd))
    subprocess.run(cmd, check=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


def cleanup_intermediates(*paths):
    """Remove intermediate files; warnings only on Windows file-locking."""
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"Cleaned up: {path}")
            except OSError as exc:
                print(f"Cleanup failed for {path}: {exc}",
                      file=sys.stderr)


def capture_candidate(avi_path, frame_index, out_png):
    """Extract one frame via ffmpeg, resize to 320x240, STELLA_REMAP."""
    raw_png = os.path.join(TEMP_DIR, f"mame_nat_raw_fr{frame_index:03d}.png")
    extract_frame_with_ffmpeg(avi_path, raw_png, frame_index=frame_index)
    img = Image.open(raw_png).convert("RGB").resize((320, 240), Image.LANCZOS)
    if os.environ.get("STELLA_REMAP", "0") == "1":
        img = remap_to_stella_palette(img)
    img.save(out_png)
    cleanup_intermediates(raw_png)
    return img


def main():
    # 0. Pre-flight
    for label, path in [("MAME binary", MAME_EXE),
                        ("ROM", ROM_PATH),
                        ("Temp dir", TEMP_DIR)]:
        if not os.path.exists(path):
            print(f"{label} not found: {path}", file=sys.stderr)
            return 1
        print(f"{label} OK: {path}")

    cleanup_intermediates(AVI_PATH)

    if not os.path.exists(PORT_REFERENCE):
        print(f"WARNING: port reference not found at {PORT_REFERENCE}; "
              "skipping diff-vs-port step.", file=sys.stderr)
        port_ref = None
    else:
        port_ref = Image.open(PORT_REFERENCE).convert("RGB")
        print(f"port reference OK: {PORT_REFERENCE} ({port_ref.size})")

    try:
        # 1. Spawn MAME at native 60Hz (no -nothrottle).
        # Wall-clock: ~8 seconds. Frame count expected: 480 (1 frame
        # boundary over is MAME's standard behavior).
        run_mame_aviwrite_natural(AVI_PATH, ROM_PATH, MAME_EXE,
                                  seconds_to_run=8)
        if not os.path.exists(AVI_PATH):
            print(f"MAME exited but AVI not at {AVI_PATH}",
                  file=sys.stderr)
            return 2
        avi_size = os.path.getsize(AVI_PATH)
        print(f"AVI written: {avi_size} bytes")

        # 2. Extract 5 candidate frames + diff vs port.
        CANDIDATE_FRAMES = (60, 120, 240, 360, 420)
        port_data = list(port_ref.getdata()) if port_ref is not None else None

        diffs = {}
        rendered = {}
        for f in CANDIDATE_FRAMES:
            out_png = os.path.join(TEMP_DIR, f"mame_nat_fr{f:03d}.png")
            rendered[f] = capture_candidate(AVI_PATH, f, out_png)
            if port_ref is not None:
                cand = rendered[f]
                if cand.size != port_ref.size:
                    cand = cand.resize(port_ref.size, Image.LANCZOS)
                cand_data = list(cand.getdata())
                mismatches = sum(
                    1 for a, b in zip(port_data, cand_data)
                    if abs(a[0] - b[0]) > 15 or abs(a[1] - b[1]) > 15
                    or abs(a[2] - b[2]) > 15
                )
                pct = 100.0 * mismatches / len(port_data) if port_data else 100.0
                diffs[f] = pct
                print(f"frame {f}: diff vs port/after_game_t120.png = "
                      f"{pct:.2f}%")

        # 3. PASS criterion (frame 240 ≥60% blue and ≥1 yellow pixel).
        if port_ref is not None:
            from collections import Counter
            cnt = Counter(rendered[240].getdata())
            n_total = 320 * 240
            blue = sum(n for c, n in cnt.items()
                       if c[0] < 128 and c[1] < 128 and c[2] >= 128)
            yellow = sum(n for c, n in cnt.items()
                         if c[0] > 200 and c[1] > 200 and c[2] < 128)
            print(f"\nPASS criterion (frame 240): "
                  f"blue={100*blue/n_total:.2f}% (need ≥60%), "
                  f"yellow={100*yellow/n_total:.2f}% (need ≥0.01%)")
            pass_status = blue / n_total >= 0.60 and yellow / n_total >= 0.0001
            print(f"=> {'PASS' if pass_status else 'FAIL'}: "
                  "natural cadence reached playfield"
                  if pass_status else
                  "=> FAIL: cart parks in title-splash state; see "
                  "hypothesis-B confirmation in this file's banner.")

        # 4. Save the best-fit candidate as the canonical reference.
        if diffs:
            best_f = min(CANDIDATE_FRAMES, key=lambda f: diffs[f])
            img_winner = rendered[best_f]
        else:
            best_f = CANDIDATE_FRAMES[0]
            img_winner = rendered[best_f]
        img_winner.save(FINAL_PNG_PATH)
        print(f"Saved {FINAL_PNG_PATH} (best-fit frame {best_f}, "
              f"diff={diffs.get(best_f, 'NA')})")
        return 0
    except subprocess.CalledProcessError as exc:
        print(f"Subprocess failed: {exc.cmd[0]} returned {exc.returncode}",
              file=sys.stderr)
        return 5
    finally:
        cleanup_intermediates(AVI_PATH)


if __name__ == "__main__":
    sys.exit(main())
