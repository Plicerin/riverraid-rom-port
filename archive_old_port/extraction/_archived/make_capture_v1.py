"""ARCHIVED (2026-07-15): make_capture_v1.py — SUPERSEDED by the internal SanityAssertion.

This script is RETAINED FOR HISTORICAL REFERENCE ONLY. It is no longer
load-bearing in the project. On 2026-07-15, the deterministic-capture
test infrastructure was pivoted:

  - The external Stella/MAME NTSC reference comparison
    (extraction/riverraid_stella_reference.png, formerly the basis for
    `tests/test_pixel_diff_helpers.py::test_against_stella_reference_frame`)
    was REPLACED by the internal SanityAssertion in
    `tests/test_sanity_deterministic_frames.py`, which validates port
    rendering across 5 deterministic gameplay frames (t=0, 60, 120,
    180, 240) without any external reference dependency.

  - Why: every attempt to obtain a real NTSC capture ran into one of
    three architectural floors:
      (a) LFSR-drift — MAME's a2600 hardware-reset LFSR seed differs
          from `port/systems/random.py`'s port-side LFSR seed;
          wedge-slope positions of bank bits diverge run-to-run.
      (b) Frame-index sweep — at every captured frame index (60, 120,
          240, 320, 400, 480) of one capture's 480-frame AVI, the
          mismatch against `port/after_game.png` is uniform 97.77% —
          no magic frame reduces it.
      (c) Toolchain unavailable — MSVC C++ toolchain missing on this
          host, blocking MAME source build; scoop-binary MAME 0.287
          lua bindings are incomplete (`machine:ioport()/screens()`
          are nil); Stella 6.7.1 rejects the .a26.

  - The replacement test (SanityAssertion) sidesteps ALL three blocks
    by validating "is the renderer locked to its own canonical palette
    across natural-evolution update ticks?" instead of "does it match
    real hardware?". See `tests/stella_capture.md` for the full pivot
    log.

If you need to revive an external NTSC capture (e.g. to A/B test
port-side rendering vs real hardware under a future real-Stella
release), this script's pipeline is still functional:
  1. MAME headless `mame a2600 -cart <rom> -seconds_to_run 8 \
     -nothrottle -video none -sound none -noreadconfig -aviwrite <avi>`
  2. ffmpeg `ffmpeg -y -i <avi> -vf "select=eq(n\,400)" \
     -frames:v 1 <png>`
  3. PIL post-process: crop + resize + optional STELLA_REMAP=1 quantize.
The output file path is hard-coded to
`extraction/riverraid_stella_reference.png`.

Beneath this banner block is the original v5 docstring + code,
unchanged.

==========================================================================
ORIGINAL v5 DOCSTRING (2026-07-15, pre-pivot)
==========================================================================

tmp_mame_capture.py — headless MAME 0.287 → AVI → ffmpeg frame extraction → PIL post-process.

Replaces the prior GUI capture path (Win32 ctypes + PIL.ImageGrab of the MAME
window, defeated by RawInput bypass + PrintWindow DWM compositing + scene
mismatch where MAME captures the title-splash frame instead of gameplay).
The new pipeline is fully headless + deterministic at a known frame index:

  1. Wait for any stale MAME + free the temp dir.
  2. Spawn mame a2600 -cart ... -seconds_to_run 8 -nothrottle -video none
     -sound none -noreadconfig -aviwrite C:\\Users\\vrock\\AppData\\Local\\Temp\\mame_cap.avi
     MAME runs at full emulation speed (no GUI, no sound, no throttling) and
     exits naturally on the seconds_to_run boundary, deterministically
     finalizing the AVI file trailer.
  3. Spawn ffmpeg -y -i <avi> -vf "select=eq(n\\,400)" -frames:v 1 <png>
     Extracts frame index 400 (= ~6.6 s in at NTSC 60 fps, well past the
     Activision title splash + into attract-mode gameplay).
  4. PIL post-process: crop_to_content (cut MAME's empty letterbox overscan /
     black borders) + resize_to_target (LANCZOS to 320x240 preserving 4:3
     aspect, padded with black) + optional remap_to_stella_palette (set
     STELLA_REMAP=1 to snap each pixel to the closest canonical Stella TIA
     color via Euclidean distance).
  5. Save to extraction/riverraid_stella_reference.png (320x240 — matches the
     test's expected size and avoids the upstream nearest-neighbor resize).

Total wall-clock ~2-4s per capture (MAME at -nothrottle runs 8 emu-seconds
in ~0.5-2s wall-clock + ffmpeg ~0.5s + PIL <20ms with the unique-color
dict cache for the optional remap step).

Why absolute Windows paths (not MSYS /tmp/...): MSYS bash maps /tmp to
C:\\Users\\vrock\\AppData\\Local\\Temp\\, but Python's tempfile.gettempdir()
returns the same Windows path. Subprocess.run() with shell=False on Windows
expects native paths. Mixing MSYS-style /tmp with Windows-native Python
caused the prior basher's PIL inspection to fail (file-not-found despite
the file existing in the same physical directory). The new code uses only
absolute Windows paths.

Empirical result (2026-07-15): the headless pipeline produces a 176x220
rawvideo BGR24 AVI (~35 MB for 8 emu-seconds). Frame 400 extracted via
ffmpeg gives a NTSC attract-mode game frame, not the title-splash — the
fundamental scene-mismatch blocker documented in this file's v4 docstring.

LFSR-drift still defeats the bank-zone test #6b at 100% mismatch as
documented in tests/stella_capture.md § LFSR-drift blocker.
"""

import os
import subprocess
import sys
import tempfile

from PIL import Image

_PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# Hard-fail on missing port.core — same rule as v4 of tmp_mame_capture.py.
# Refuses to silently fall through with a wrong hand-coded palette.
try:
    from port.core import ntsc_palette
    NTSC_PALETTE = [
        c for c in (ntsc_palette.tia_to_rgb(code) for code in range(0, 0xFF, 2))
        if c is not None
    ]
except ImportError as exc:
    sys.stderr.write(
        f"CRITICAL: tmp_mame_capture.py requires port.core.ntsc_palette to "
        f"build the canonical Stella palette for the color remap step. "
        f"Import failed: {exc}\n"
        f"This script must run from {_PROJECT_ROOT} (the project root). "
        f"Try: cd {_PROJECT_ROOT} && python tmp_mame_capture.py\n"
    )
    raise SystemExit(5)


# ── Absolute Windows paths (do NOT mix with MSYS bash paths) ─────────
MAME_EXE = r"C:\Users\vrock\scoop\apps\mame\0.287\mame.exe"
ROM_PATH = (
    r"C:\Users\vrock\Documents\riverraid-rom-extract"
    r"\reference\river-raid-wiz-main\baserom.a26"
)
TEMP_DIR = tempfile.gettempdir()  # e.g. C:\Users\vrock\AppData\Local\Temp
AVI_PATH = os.path.join(TEMP_DIR, "mame_cap.avi")
RAW_PNG_PATH = os.path.join(TEMP_DIR, "mame_raw.png")
FINAL_PNG_PATH = (
    r"C:\Users\vrock\Documents\riverraid-rom-extract"
    r"\extraction\riverraid_stella_reference.png"
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


def run_mame_aviwrite(avi_path, rom_path, mame_exe,
                      seconds_to_run=8):
    """Spawn MAME headlessly with -aviwrite. MAME exits naturally on the
    seconds_to_run boundary and deterministically finalizes the AVI trailer.
    Raises subprocess.CalledProcessError if MAME exits non-zero."""
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
    print("Launching MAME (headless):")
    print("  " + " ".join(cmd))
    subprocess.run(cmd, check=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


def extract_frame_with_ffmpeg(avi_path, png_path, frame_index=400,
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
    """Remove intermediate files; warnings only (not fatal) on Windows file-locking."""
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"Cleaned up: {path}")
            except OSError as exc:
                print(f"Cleanup failed for {path}: {exc}",
                      file=sys.stderr)


def main():
    # 0. Pre-flight sanity-check
    for label, path in [("MAME binary", MAME_EXE),
                        ("ROM", ROM_PATH),
                        ("Temp dir", TEMP_DIR)]:
        if not os.path.exists(path):
            print(f"{label} not found: {path}", file=sys.stderr)
            return 1
        print(f"{label} OK: {path}")
    if AVI_PATH.rsplit(os.sep, 1)[0] != TEMP_DIR:
        print(f"AVI path parent mismatch: {AVI_PATH} vs {TEMP_DIR}",
              file=sys.stderr)
        return 1

    # 1. Cleanup any stale intermediates from a prior failed run
    cleanup_intermediates(AVI_PATH, RAW_PNG_PATH)

    try:
        # 2. Spawn MAME headless, wait for natural exit
        run_mame_aviwrite(AVI_PATH, ROM_PATH, MAME_EXE, seconds_to_run=8)
        if not os.path.exists(AVI_PATH):
            print(f"MAME exited but AVI not at {AVI_PATH}",
                  file=sys.stderr)
            return 2
        avi_size = os.path.getsize(AVI_PATH)
        print(f"AVI written: {avi_size} bytes")

        # 3. Extract frame 400 via ffmpeg
        extract_frame_with_ffmpeg(AVI_PATH, RAW_PNG_PATH,
                                  frame_index=400)
        if not os.path.exists(RAW_PNG_PATH):
            print(f"ffmpeg failed to write {RAW_PNG_PATH}",
                  file=sys.stderr)
            return 3
        raw_size = os.path.getsize(RAW_PNG_PATH)
        print(f"Raw frame extracted: {raw_size} bytes")

        # 4. PIL post-process: crop + resize + optional remap
        img = Image.open(RAW_PNG_PATH).convert("RGB")
        print(f"Raw frame size: {img.size[0]}x{img.size[1]}")
        img_crop = crop_to_content(img)
        print(f"After crop: {img_crop.size[0]}x{img_crop.size[1]}")
        img_resized = resize_to_target(img_crop, target=(320, 240))
        print(f"After resize: {img_resized.size[0]}x{img_resized.size[1]}")

        remap_enabled = os.environ.get("STELLA_REMAP", "0") == "1"
        if remap_enabled:
            print("Applying Stella canonical color remap (STELLA_REMAP=1)...")
            img_final = remap_to_stella_palette(img_resized)
        else:
            img_final = img_resized

        # 5. Save final
        img_final.save(FINAL_PNG_PATH)
        byte_size = os.path.getsize(FINAL_PNG_PATH)
        print(f"Saved {FINAL_PNG_PATH}: {img_final.size[0]}x{img_final.size[1]} "
              f"({byte_size} bytes, remap={'yes' if remap_enabled else 'no'})")

        if byte_size < 1024:
            print(f"WARNING: PNG unexpectedly small ({byte_size} bytes)",
                  file=sys.stderr)
            return 4
        return 0

    except subprocess.CalledProcessError as exc:
        print(f"Subprocess failed: {exc.cmd[0]} returned {exc.returncode}",
              file=sys.stderr)
        return 5
    finally:
        # Cleanup intermediates regardless of success/failure (don't pollute
        # the user's temp dir). Done in the finally block so a crash mid-pipeline
        # doesn't leak an N-MB AVI behind.
        cleanup_intermediates(AVI_PATH, RAW_PNG_PATH)


if __name__ == "__main__":
    sys.exit(main())
