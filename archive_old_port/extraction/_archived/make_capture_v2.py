"""ARCHIVED (2026-07-15): make_capture_v2.py — successor to make_capture_v1.py.

See also: `make_capture_v2_natural.py` (natural-cadence follow-up run,
2026-07-15) and `tests/stella_capture.md` § "v2 + v2-natural empirical
tests" for the full empirical logs of both runs + the triple-validation
of the internal SanityAssertion pivot.

Same headless MAME → AVI → ffmpeg → PIL pipeline as v1, with three
deliberate changes motivated by the port-vs-MAME visual-diff analysis
(see `tests/stella_capture.md` § "Pivot to internal SanityAssertion"):

1. *Default STELLA_REMAP=1* (was opt-in via env var in v1).
   The v1 capture showed 77% of MAME-decoded pixels NOT within ±15 of
   any canonical Stella NTSC color (MAME's YIQ→RGB and Stella's
   tia_to_rgb() tables disagree by 10–20 per channel). STELLA_REMAP=1
   snaps every captured pixel to its nearest canonical Stella color
   via Euclidean distance, collapsing the palette-rounding delta to
   zero and isolating the remaining diffs to LFSR + AA + scene-match.

2. *Multi-index extraction* (was single-frame index 400 in v1).
   v1 picked frame 400 (= 6.6 emu-seconds in) on the assumption it
   would land in attract-mode gameplay. But the prior 97.77%
   mismatch vs port/after_game.png indicates frame 400 may have
   landed in the wrong sub-segment (title-splash / blank / respawn).
   v2 extracts five candidate frames (60, 120, 240, 360, 420) so the
   script can mechanically pick the one with the lowest diff vs
   `port/after_game_t120.png`. Frame 60 = 1s in (just past
   `INTRO_SCROLL=48` so gameplay is active); frames 120/240/360/420
   sweep the rest of the 8-second capture.

3. *No lua SPACE-injection attempt.* All six v1-v6 attempts in
   `tests/stella_capture.md` § "MAME 0.287 scoop-binary lua-script
   attempts" failed (ioport()/screens()/frame_number() all nil on
   the scoop-binary lua engine). The cart's `baserom.asm` zero-page
   comment *would suggest* cold-boot to `gameMode=0 = "running"` with
   a one-shot `INTRO_SCROLL=48` animation, but *the v2 first-run
   empirical result below shows this hypothesis does NOT hold under
   MAME 0.287 headless `-nothrottle -aviwrite`* — the captured
   frame is 50% black + 39 distinct colors (consistent with title-
   splash / menu state), not the expected 75% blue + 118 distinct
   colors of running gameplay. Therefore the cold-boot-to-running
   claim is presumptive from the assembler comments but UNTESTED
   empirically on this MAME build. *SPACE injection is therefore
   non-negotiable* for any future real-gameplay capture; without
   it, MAME's a2600 driver likely parks the cart in menu state
   indefinitely. *This run was executed without SPACE injection as
   the existing lua stack cannot reach `ioport()`*, and *the result
   (see "Empirical result" below) is committed as an archival
   negative-result data point.*

**Empirical result (v2 first run, 2026-07-15 ~21:45):** all 5 candidate
frame indices (60, 120, 240, 360, 420) converge on ~98.77–98.79%
mismatch vs `port/after_game_t120.png` despite the STELLA_REMAP=1
snap-to-Stella-NTSC collapse. Top-5 colors of the captured reference
are 50.36% BLACK + 39 distinct colors (vs port's 75.57% blue water
+ 118 distinct colors; only 5 colors shared). This confirms that the
scene-mismatch axis dominates; the original SanityAssertion pivot
(from the v1 banner § "Pivot to internal SanityAssertion") is
empirically validated, not collapsed.

**Empirical result — natural-cadence follow-up (`extraction/_archived/
make_capture_v2_natural.py`, 2026-07-15 ~22:35):** the v2 capture's
~98.79% mismatch might have been a `-nothrottle` artifact, so a
sister run was made WITHOUT `-nothrottle` at native 60Hz cadence
(8 wall-seconds = 481 frames). All 5 candidate indices converged on
~99.02–99.04% mismatch — marginally WORSE than v2, and PASS
criterion (frame 240 ≥60% blue water + ≥0.01% yellow jet-sprite
pixel) FAILED at 22.61% blue + 0.32% yellow. *This empirically
falsifies the "it was just -nothrottle" hypothesis and strongly
confirms that the cart parks in title-splash state under MAME 0.287
headless `-aviwrite -video none` regardless of throttling cadence.*
The internal SanityAssertion pivot is therefore now triple-validated
(LFSR-drift blocker + v2 -nothrottle + v2 natural-cadence).

File name differs from v1 (`make_capture_v2.py` vs `tmp_mame_capture.py`
/ `make_capture_v1.py`) because v1 is archived with a HISTORICAL
banner and MUST NOT be modified per the archive protocol.

Beneath this banner block is the implementation.
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # → project root
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

# Hard-fail on missing port.core — same rule as v1.
try:
    from port.core import ntsc_palette
    NTSC_PALETTE = [
        c for c in (ntsc_palette.tia_to_rgb(code) for code in range(0, 0xFF, 2))
        if c is not None
    ]
except ImportError as exc:
    sys.stderr.write(
        f"CRITICAL: make_capture_v2.py requires port.core.ntsc_palette to "
        f"build the canonical Stella palette for the color-remap step. "
        f"Import failed: {exc}\n"
        f"This script must run from {_PROJECT_ROOT} (the project root). "
        f"Try: cd {_PROJECT_ROOT} && python extraction/_archived/make_capture_v2.py\n"
    )
    raise SystemExit(5)

# Default STELLA_REMAP=1 unless caller explicitly passes STELLA_REMAP=0.
# Per v1's empirical 77%-off-palette finding, the YIQ-vs-Stella color
# mismatch dominates the diff. Snapping to canonical Stella is the
# only way to isolate the remaining scene-mismatch from palette
# rounding. Override with: STELLA_REMAP=0 python make_capture_v2.py
os.environ.setdefault("STELLA_REMAP", "1")


# ── Absolute Windows paths (do NOT mix with MSYS bash paths) ─────────
MAME_EXE = r"C:\Users\vrock\scoop\apps\mame\0.287\mame.exe"
ROM_PATH = (
    r"C:\Users\vrock\Documents\riverraid-rom-extract"
    r"\reference\river-raid-wiz-main\baserom.a26"
)
TEMP_DIR = tempfile.gettempdir()  # e.g. C:\Users\vrock\AppData\Local\Temp
AVI_PATH = os.path.join(TEMP_DIR, "mame_cap_v2.avi")
RAW_PNG_DIR = os.path.join(TEMP_DIR, "mame_cap_v2_candidates")
FINAL_PNG_PATH = (
    r"C:\Users\vrock\Documents\riverraid-rom-extract"
    r"\extraction\riverraid_stella_reference.png"
)
PORT_REFERENCE = (
    _PROJECT_ROOT / "port" / "after_game_t120.png"
)


# ── Pipeline helpers ─────────────────────────────────────────────────

def crop_to_content(img, threshold=24, pad=8):
    """Crop to bbox of pixels with luminance > threshold (Atari 2600 has
    black background; cuts MAME's empty overscan margins from the AVI's
    176x220 rawvideo frame). Adds 8-px padding to capture AA edges."""
    gray = img.convert("L")
    mask = gray.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    w, h = img.size
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w, right + pad)
    bottom = min(h, bottom + pad)
    return img.crop((left, top, right, bottom))


def resize_to_target(img, target=(320, 240)):
    """Resize preserving aspect ratio (Atari 4:3 → port 320x240 4:3).
    Pads with black to fill the target frame."""
    target_w, target_h = target
    src_w, src_h = img.size
    src_aspect = src_w / src_h if src_h else 1.0
    target_aspect = target_w / target_h
    if src_aspect > target_aspect:
        new_w = target_w
        new_h = max(1, int(round(target_w / src_aspect)))
    else:
        new_h = target_h
        new_w = max(1, int(round(target_h * src_aspect)))
    img_resized = img.resize((new_w, new_h), Image.LANCZOS)
    new_img = Image.new("RGB", target, (0, 0, 0))
    paste_x = (target_w - new_w) // 2
    paste_y = (target_h - new_h) // 2
    new_img.paste(img_resized, (paste_x, paste_y))
    return new_img


def remap_to_stella_palette(img):
    """Quantize image to canonical Stella TIA colors via closest-Euclidean
    distance. Uses a unique-color dict cache so the cost is O(U*P) not O(N*P).
    Black-floor: any pixel with all 3 channels < 30 snaps to (0, 0, 0)."""
    img_data = list(img.getdata())
    unique_colors = set(img_data)
    color_map = {}
    for c in unique_colors:
        r, g, b = c[:3]
        if r < 30 and g < 30 and b < 30:
            color_map[c] = (0, 0, 0)
            continue
        best_dist = float("inf")
        best_p = (0, 0, 0)
        for p in NTSC_PALETTE:
            dr = r - p[0]
            dg = g - p[1]
            db = b - p[2]
            dist = dr * dr + dg * dg + db * db
            if dist < best_dist:
                best_dist = dist
                best_p = p
        color_map[c] = best_p
    new_data = [color_map[c] for c in img_data]
    new_img = img.copy()
    new_img.putdata(new_data)
    return new_img


def run_mame_aviwrite(avi_path, rom_path, mame_exe, seconds_to_run=8):
    """Spawn MAME headlessly with -aviwrite. MAME exits naturally on the
    seconds_to_run boundary and deterministically finalizes the AVI trailer.

    8 emu-seconds × 60 fps = 480 frames (matches v1's empirical 480-frame
    output documented in tests/stella_capture.md).

    No lua -script injection: the scoop MAME 0.287 lua bindings do not
    expose ioport()/screens()/frame_number() per the v1-v6 failure log.
    The cart cold-boots to gameMode=0 (running) so gameplay is active
    without any keypress.
    """
    cmd = [
        mame_exe, "a2600",
        "-cart", rom_path,
        "-seconds_to_run", str(seconds_to_run),
        "-nothrottle",
        "-video", "none",
        "-sound", "none",
        "-noreadconfig",
        "-aviwrite", avi_path,
    ]
    print("Launching MAME (headless, 480-frame capture):")
    print("  " + " ".join(cmd))
    subprocess.run(cmd, check=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


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
    print(f"Launching ffmpeg (extract frame {frame_index}):")
    print("  " + " ".join(cmd))
    subprocess.run(cmd, check=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


def cleanup_intermediates(*paths):
    """Remove intermediate files; warnings only (not fatal) on Windows
    file-locking."""
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"Cleaned up: {path}")
            except OSError as exc:
                print(f"Cleanup failed for {path}: {exc}",
                      file=sys.stderr)


def capture_candidate(avi_path, frame_index, out_png):
    """Extract + crop + resize + remap one candidate frame to out_png."""
    raw_png = os.path.join(TEMP_DIR, f"mame_v2_raw_f{frame_index:03d}.png")
    extract_frame_with_ffmpeg(avi_path, raw_png, frame_index=frame_index)
    img = Image.open(raw_png).convert("RGB")
    print(f"  raw frame {frame_index}: {img.size[0]}x{img.size[1]}")
    img_crop = crop_to_content(img)
    print(f"  cropped:          {img_crop.size[0]}x{img_crop.size[1]}")
    img_resized = resize_to_target(img_crop, target=(320, 240))
    print(f"  resized:          {img_resized.size[0]}x{img_resized.size[1]}")

    if os.environ.get("STELLA_REMAP", "0") == "1":
        img_final = remap_to_stella_palette(img_resized)
        print(f"  remapped:         Stella NTSC palette snapping applied")
    else:
        img_final = img_resized
        print(f"  NOT remapped:     STELLA_REMAP != 1")

    img_final.save(out_png)
    cleanup_intermediates(raw_png)
    return img_final


def main():
    # 0. Pre-flight sanity-check
    for label, path in [("MAME binary", MAME_EXE),
                        ("ROM", ROM_PATH),
                        ("Temp dir", TEMP_DIR)]:
        if not os.path.exists(path):
            print(f"{label} not found: {path}", file=sys.stderr)
            return 1
        print(f"{label} OK: {path}")

    # 1. Cleanup ONLY the AVI from any prior run — keep the
    #    candidate PNGs in RAW_PNG_DIR (named by frame index, so
    #    overwrites are idempotent) for re-comparison across runs.
    cleanup_intermediates(AVI_PATH)

    if not PORT_REFERENCE.exists():
        print(f"WARNING: port reference not found: {PORT_REFERENCE}",
              file=sys.stderr)
        print("Diff-vs-port step will be skipped; reference will be saved "
              "as-is to extraction/.",
              file=sys.stderr)
        port_ref = None
    else:
        port_ref = Image.open(PORT_REFERENCE).convert("RGB")
        print(f"port reference OK: {PORT_REFERENCE} ({port_ref.size})")

    os.makedirs(RAW_PNG_DIR, exist_ok=True)

    try:
        # 2. Spawn MAME headless, wait for natural exit (8 emu-seconds
        #   = 480 frames; -nothrottle means 0.5-2s wall-clock on this host).
        run_mame_aviwrite(AVI_PATH, ROM_PATH, MAME_EXE, seconds_to_run=8)
        if not os.path.exists(AVI_PATH):
            print(f"MAME exited but AVI not at {AVI_PATH}",
                  file=sys.stderr)
            return 2
        avi_size = os.path.getsize(AVI_PATH)
        print(f"AVI written: {avi_size} bytes")

        # 3. Extract candidate frames via ffmpeg + PIL post-process.
        #   The five indices chosen:
        #     60  = 1.0s in, just past INTRO_SCROLL=48 → real gameplay
        #     120 = 2.0s in, mid-gameplay
        #     240 = 4.0s in, mid-gameplay
        #     360 = 6.0s in, late gameplay
        #     420 = 7.0s in, late gameplay
        CANDIDATE_FRAMES = (60, 120, 240, 360, 420)

        # Pre-load port reference as RGB tuple list for fast diff.
        if port_ref is not None:
            port_data = list(port_ref.getdata())

        diffs = {}
        rendered = {}
        for frame_idx in CANDIDATE_FRAMES:
            out_png = os.path.join(RAW_PNG_DIR, f"v2_f{frame_idx:03d}.png")
            print(f"\n=== Candidate frame {frame_idx} ===")
            rendered[frame_idx] = capture_candidate(
                AVI_PATH, frame_idx, out_png)

            if port_ref is not None:
                # Exhaustive PIL diff (trustworthy, not heuristic).
                img = rendered[frame_idx]
                if img.size != port_ref.size:
                    img = img.resize(port_ref.size, Image.LANCZOS)
                candidate_data = list(img.getdata())
                mismatches = 0
                n = len(port_data)
                for a, b in zip(port_data, candidate_data):
                    if (abs(a[0] - b[0]) > 15
                            or abs(a[1] - b[1]) > 15
                            or abs(a[2] - b[2]) > 15):
                        mismatches += 1
                pct = 100.0 * mismatches / n if n else 100.0
                diffs[frame_idx] = pct
                print(f"  diff vs port/after_game_t120.png: "
                      f"{pct:.2f}% pixels > ±15/channel "
                      f"({mismatches}/{n} px)")

        # 4. Pick lowest-diff candidate (auto-pick).
        if diffs:
            best_idx, best_pct = min(diffs.items(), key=lambda kv: kv[1])
            print(f"\n=> Best-fit frame index: {best_idx} "
                  f"({best_pct:.2f}% mismatch)")
            img_winner = rendered[best_idx]
        else:
            print("\n=> No diff-vs-port possible; using first candidate "
                  "(frame 60) as reference.")
            img_winner = rendered[CANDIDATE_FRAMES[0]]

        # 5. Save winner as the canonical reference path.
        img_winner.save(FINAL_PNG_PATH)
        byte_size = os.path.getsize(FINAL_PNG_PATH)
        print(f"Saved {FINAL_PNG_PATH}: {img_winner.size[0]}x"
              f"{img_winner.size[1]} ({byte_size} bytes)")

        if byte_size < 1024:
            print(f"WARNING: PNG unexpectedly small ({byte_size} bytes)",
                  file=sys.stderr)
            return 4
        return 0

    except subprocess.CalledProcessError as exc:
        print(f"Subprocess failed: {exc.cmd[0]} returned {exc.returncode}",
              file=sys.stderr)
        return 5
    except FileNotFoundError as exc:
        print(f"Required tool not found: {exc}", file=sys.stderr)
        print("Verify ffmpeg is on PATH and mame.exe is in scoop apps.",
              file=sys.stderr)
        return 6
    finally:
        # Cleanup intermediates. The candidate PNGs in RAW_PNG_DIR are
        # kept for re-comparison; the AVI is deleted (it's the only
        # large intermediate; raw per-frame PNGs are deleted inline by
        # capture_candidate -> cleanup_intermediates).
        cleanup_intermediates(AVI_PATH)


if __name__ == "__main__":
    sys.exit(main())
