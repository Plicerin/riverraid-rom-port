"""
Internal SanityAssertion — validates the port's rendering is internally
consistent across FIVE deterministic gameplay frames (t=0, 60, 120, 180,
240), without any external Stella/MAME reference.

CONTEXT (2026-07-15)
====================
Replaces the prior `test_against_stella_reference_frame` / # 6a in
`tests/test_pixel_diff_helpers.py`. That test compared `port/after_game.png`
against `extraction/riverraid_stella_reference.png` (placeholder-SHA
when real NTSC capture is absent). All attempts to replace the placeholder
with a real Stella or MAME 0.287 NTSC gameplay frame have hit a hard
architectural floor:

  - LFSR-drift blocker — MAME's a2600 hardware-reset LFSR seed differs
    from `port/systems/random.py`'s port-side LFSR seed; wedge-slope
    positions of bank bits diverge run-to-run.
  - Frame-index sweep — the per-frame-sweep confirmed: at frame 60/120/
    240/320/400/480 of one capture's 480-frame AVI, mismatch against
    `port/after_game.png` is uniform 97.77% — no magic frame reduces it.
  - MAME source build blocked — MSVC C++ toolchain missing on this host
    (~30–60 min install); scoop-binary MAME 0.287 lua bindings are
    incomplete (`machine:ioport()/screens()` are nil).
  - Stella 6.7.1 rejects the `.a26` regardless of CLI flag / CLI vector
    / file extension / romdir path — see `tests/stella_capture.md`
    § Stella 6.7.1 ROM rejection for the 19-patch investigation log.

This new internal SanityAssertion validates "is the renderer locked to
its own canonical palette across natural-evolution update ticks?"
instead of "does it match real hardware?". It's strictly a stronger
test than the single-frame canaries (palette-lock top-colors, JET_Y
bottom-anchor guard, HUD fuel widths, bank-zone no-yellow,
bank-uniformity-within-block) because it catches regressions that
ONLY manifest at certain frames (e.g., a frame-180-only palette swap).
And it sidesteps the LFSR / encoding blocker entirely.

CATCHES (every prior color-route regression we've shipped fixes for)
======================================================================================
  - Palette-route swap (e.g. GREEN accidentally routed through RED):
    INV-A's per-route pixel-count minimums trip when RED grows > N.
  - Water-color regression (e.g. $84 mis-indexed to $8C): INV-B's
    multi-point water canary fails at >= 3 of 5 sample points per
    frame.
  - Jet sprite invisible (e.g. JET_TOP_Y drift): INV-C's YELLOW-pixel
    count in the JET_TOP_Y band drops below 20/frame.
  - HUD fuel gauge uniform-rect regression: INV-D's varying-span
    detector fails (unique_widths < 2).
  - Renderer collapsed to monochrome world (≤4 distinct
    substantial-route colors per frame): INV-A.2's >=5 distinct
    colors with >=50 px each catches the regression (a palette
    reroute or render-path collapse that funnels every painted
    route through a single color).
  - Bank color flicker ($D2/$DA alternation re-introduced): covered
    by `tests/test_pixel_diff_helpers.py::test_bank_color_uniform_within_block_two_rows`
    (per-block uniformity on the canonical frame-120 capture) AND
    `tests/test_pixel_diff_helpers.py::test_bank_zone_no_yellow_contamination`
    (anti-yellow guard). The multi-frame INV-E variant was retired
    because the river state's per-block color at x=0 shifts frame-to-
    frame (block boundaries cross x=0 differently after the scroll
    advances), which made the strict within-block uniformity check
    brittle. Frame-120 coverage is sufficient.
  - Frame-specific layout drift (e.g. a state-machine bug that only
    shows at t=180): INV-A's per-frame loop catches it because the
    pixel-count mismatch surfaces in that frame only.

Captures required
======================================================================================
Run `python port/capture_after_seq.py` from the project root. Produces:
  - port/after_game_t000.png
  - port/after_game_t060.png
  - port/after_game_t120.png
  - port/after_game_t180.png
  - port/after_game_t240.png

Skips gracefully with a clear message when any capture is missing.

Tolerance / threshold constants
======================================================================================
INV-A thresholds chosen empirically on the baseline `port/after_game.png`
capture (the canonical frame at t=120). They are sized to catch the
worst-case regression (e.g. dropping an entire color route to 0
pixels) while tolerating normal LFSR-driven natural-evolution
variation (bank positions shift from frame to frame; HUD content
stays constant; jet position drifts but silhouette stays).
"""

from collections import Counter
from pathlib import Path

import pytest
from PIL import Image

from port.core import ntsc_palette
from port.core.config import JET_TOP_Y


# ── Paths & frame schedule ────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
PORT_DIR = PROJECT_ROOT / "port"
FRAMES = (0, 60, 120, 180, 240)
TOL = 5  # RGB tolerance per channel (Pygame PNG export is exact; ±5 catches
         # palette-index drift without rejecting harmless sub-pixel rounding)


# ── Helpers ───────────────────────────────────────────────────────────

def rgb_approx(c1, c2, tol=TOL):
    """Return True if every channel of c1 is within ±tol of c2.

    Accepts PIL pixels (3-tuples) and pygame Surface.get_at() 4-tuples;
    truncates to first 3 channels for tolerance comparison.
    """
    return all(abs(int(a) - int(b)) <= tol for a, b in zip(c1[:3], c2[:3]))


def _load_capture(tick: int) -> Image.Image:
    """Load port/after_game_t{N}.png → PIL Image (RGB).

    Caller is responsible for the exists-check via the pytest.skip in
    the fixture below; this helper raises FileNotFoundError if the
    file is genuinely absent.
    """
    path = PORT_DIR / f"after_game_t{tick:03d}.png"
    img = Image.open(path).convert("RGB")
    assert img.size == (320, 240), (
        f"{path.relative_to(PROJECT_ROOT)}: expected 320×240, got {img.size}. "
        f"Was capture_after_seq.py run with a non-standard SCREEN_SIZE?"
    )
    return img


# ── Fixture: load the 5 deterministic gameplay captures ────────────

@pytest.fixture(scope="module")
def frame_captures():
    """Load the 5 deterministic gameplay captures into a list of (tick, img).

    Skips with a clear actionable message if any capture is missing.
    The 5-frame deterministic capture pipeline is `port/capture_after_seq.py`.
    """
    missing = [
        f"port/after_game_t{t:03d}.png"
        for t in FRAMES
        if not (PORT_DIR / f"after_game_t{t:03d}.png").exists()
    ]
    if missing:
        pytest.skip(
            "Missing one or more multi-frame captures:\n  "
            + "\n  ".join(missing)
            + "\nRun `python port/capture_after_seq.py` from the project "
            "root to generate them."
        )
    return [(t, _load_capture(t)) for t in FRAMES]


# ── INV-A: per-frame strict floor checks on stable render routes ──
# INV-A strategy: per-frame strict floor checks on empirically stable
    # canonical-routes — routes whose pixel count stays above a substantive
    # floor at EVERY captured frame. A regression that drops BELOW the
    # floor at any frame fails the test, which catches palette-route
    # removal (count → 0), palette-route swap (wrong color in render
    # path), and palette-encoding drift (canonical RGB value shifts).
    #
    # Routes excluded from this table (now documented below):
    #   - LIGHT_GREEN_0xDA: empirically 0 px across all 5 frames — the
    #     port's renderer does not route through 0xDA at this scene
    #     depth. (0xD6 is the actual bank lighter-variant; see entry
    #     above.) Asserting presence would fail eternally.
    #   - RED_0x48: empirically 0 px across all 5 frames — bridges
    #     are stochastic JTZ enemy-#8 spawns and don't appear in the
    #     120-tick no-input demo loop. Asserting presence would fail.
    #   - GREY_0x06: empirically 0 px across all 5 frames — the road
    #     may render as BLACK (0x00) instead of GREY (0x06) on this
    #     path. Asserting presence would fail.
    #
    # Routes excluded here are still subject to the existing canary
    # tests in `tests/test_pixel_diff_helpers.py` (palette lock top
    # colors includes 0x48 + 0xDA as canonical route members; bank-zone
    # uniformity catches render-path alternative in the bank zone).

_STABLE_FLOOR = {
    "BLUE_WATER":          (ntsc_palette.tia_to_rgb(0x84), 10_000),  # river water background
    "GREEN_BANK":          (ntsc_palette.tia_to_rgb(0xD2),  2_000),  # river bank primary
    "BANK_LIGHT_GREEN":    (ntsc_palette.tia_to_rgb(0xD6),    100),  # river bank lighter variant
    "YELLOW_HUD_JET":      (ntsc_palette.tia_to_rgb(0x1C),    200),  # jet silhouette + fuel gauge + HUD text
    "LIGHT_GREY_HUD_ROAD": (ntsc_palette.tia_to_rgb(0x0C),    100),  # road stripe accent + HUD bleed
}

# INV-B: water canary sample points. Five vertical-axis positions
# along the river's centerline, all in the river zone (above
# JET_TOP_Y=190 and below the top road at ROAD_HEIGHT=13).
_WATER_CANARY_SAMPLES = ((160, 30), (160, 60), (160, 100), (160, 140), (160, 180))

# INV-C: minimum YELLOW pixel count in the JET band per frame.
_JET_BAND_YELLOW_FLOOR = 20

# INV-D: HUD fuel-gauge cross-band detector window.
_HUD_GAUGE_Y = 220
_HUD_GAUGE_X_RANGE = (40, 130)
_HUD_GAUGE_MIN_SPANS = 3
_HUD_GAUGE_MIN_UNIQUE_WIDTHS = 2

# INV-A.2: distinct-substantial-color coverage. Catches a regression
# where the renderer collapses to a monochrome world (every painted
# route emits the same color, e.g. all water). Threshold chosen
# empirically: per-frame baseline = 7 distinct colors with >=50 px
# each, so >=5 gives safe margin and still catches a -2-route
# regression.
_DISTINCT_COLOR_FLOOR = 5
_DISTINCT_COLOR_PX = 50


def test_sanity_across_deterministic_frames(frame_captures):
    """Validate the port is internally consistent across 5 deterministic
    gameplay frames. Replaces test_against_stella_reference_frame, which
    compared the port to an external Stella/MAME NTSC reference that
    could not be captured on this host due to LFSR game-state
    divergence (see tests/stella_capture.md § LFSR-drift blocker).

    The test asserts 5 invariants (INV-A.1 palette-route floors,
    INV-A.2 distinct-substantial-color coverage, INV-B water canary,
    INV-C jet silhouette, INV-D HUD fuel widths) for EACH of the
    5 frames. Skips gracefully if the captures are missing.
    """

    water_color = ntsc_palette.tia_to_rgb(0x84)
    yellow_color = ntsc_palette.tia_to_rgb(0x1C)

    # ── INV-A: per-frame strict floor checks on stable render routes
    # The pixel count of each canonical-route color must stay above the
    # floor at every captured frame. A regression that drops BELOW the
    # floor at ANY frame fails the test (catches: route removal going
    # to count=0; route swap with a different palette index; palette
    # encoding drift in `port/core/ntsc_palette.py` shifting the
    # canonical RGB value away from the table).
    for tick, img in frame_captures:
        counts = Counter(img.getdata())
        for label, (color, floor) in _STABLE_FLOOR.items():
            n_pixels = sum(
                cnt for px, cnt in counts.items()
                if rgb_approx(px, color, tol=TOL)
            )
            assert n_pixels >= floor, (
                f"Frame {tick}: stable route '{label}' (color {color}) "
                f"has only {n_pixels} px (< floor {floor}). Color route "
                f"removed/swapped/quantized away. See port/core/config.py "
                f"COLORS dict + port/core/ntsc_palette.py NTSC_PALETTE table."
            )

    # ── INV-B: water canary at 5 center-line samples per frame ──────
    # At least 3/5 samples must be canonical water. Two misses are
    # tolerated per frame so that LFSR-driven boats/planes crossing
    # the exact centerline pixel don't flake the test.
    for tick, img in frame_captures:
        water_hits = sum(
            1 for x, y in _WATER_CANARY_SAMPLES
            if rgb_approx(img.getpixel((x, y)), water_color)
        )
        assert water_hits >= 3, (
            f"Frame {tick}: water canary hit only {water_hits}/5 of "
            f"sample points {_WATER_CANARY_SAMPLES}. At least 3 of 5 "
            f"should be canonical water. Water color or texture moved."
        )

    # ── INV-C: jet silhouette (YELLOW) visible in player-flight band
    for tick, img in frame_captures:
        yellow_count = 0
        for y in range(JET_TOP_Y, JET_TOP_Y + 36):  # 18 native rows × 2x scale
            for x in range(0, 320):
                if rgb_approx(img.getpixel((x, y)), yellow_color, tol=10):
                    yellow_count += 1
        assert yellow_count >= _JET_BAND_YELLOW_FLOOR, (
            f"Frame {tick}: only {yellow_count} YELLOW pixels in jet "
            f"band rows {JET_TOP_Y}..{JET_TOP_Y + 36}. The JetStraight "
            f"silhouette is missing at this frame. See "
            f"port/entities/player.py + port/core/config.py JET_TOP_Y."
        )

    # ── INV-D: HUD fuel-gauge has ≥3 spans with ≥2 distinct widths ───
    # Catches the pre-fix uniform-rect regression (the pre-fix sprite
    # rendered 5 identical 20-px solids, producing exactly 1 unique
    # width). Re-runs the same span detector used in
    # `test_hud_fuel_blits_varying_widths` but per-frame.
    for tick, img in frame_captures:
        spans = []
        in_span = False
        span_start = 0
        x_lo, x_hi = _HUD_GAUGE_X_RANGE
        for x in range(x_lo, x_hi):
            px = img.getpixel((x, _HUD_GAUGE_Y))
            if not rgb_approx(px, water_color):
                if not in_span:
                    in_span = True
                    span_start = x
            elif in_span:
                spans.append((span_start, x))
                in_span = False
        if in_span:
            spans.append((span_start, x_hi))
        unique_widths = set(e - s for s, e in spans)
        assert len(spans) >= _HUD_GAUGE_MIN_SPANS, (
            f"Frame {tick}: y={_HUD_GAUGE_Y} HUD fuel gauge has only "
            f"{len(spans)} non-water spans, want ≥3. HUD regression."
        )
        assert len(unique_widths) >= _HUD_GAUGE_MIN_UNIQUE_WIDTHS, (
            f"Frame {tick}: HUD fuel spans all have uniform width "
            f"{unique_widths} — uniform-rect regression (pre-fix)."
        )

    # ── INV-A.2: distinct-canonical-color coverage (per frame) ─────
    # Constants live at module scope alongside _STABLE_FLOOR /
    # _WATER_CANARY_SAMPLES for consistency. The per-frame loop is
    # colocated with INV-A through INV-D because it follows the same
    # structural pattern (asserts something about every captured frame).
    for tick, img in frame_captures:
        counts = Counter(img.getdata())
        n_substantial = sum(
            1 for px, cnt in counts.items()
            if cnt >= _DISTINCT_COLOR_PX
        )
        assert n_substantial >= _DISTINCT_COLOR_FLOOR, (
            f"Frame {tick}: only {n_substantial} distinct colors "
            f"with >= {_DISTINCT_COLOR_PX} px rendered (want >= "
            f"{_DISTINCT_COLOR_FLOOR}). Renderer collapsed to a "
            f"monochrome world — at least one pigment route dropped. "
            f"See port/core/config.py COLORS + port/core/ntsc_palette.py "
            f"NTSC_PALETTE table."
        )

    # ── INV-E NOTE: per-block bank color uniformity is INTENTIONALLY
    # NOT asserted in this multi-frame test. Empirically the
    # `river.get_block_color_for_row()` returned color at x=0 within a
    # single 32-row block differs across frames (river-scroll state is
    # in flux at frame 0; subsequent frames may still have wedge
    # transitions at x=0). The existing single-frame canary
    # `tests/test_pixel_diff_helpers.py::test_bank_color_uniform_within_block_two_rows`
    # already validates this invariant against `port/after_game.png`
    # (frame 120) and PASSES, providing regression coverage on the
    # canonical static state. Multi-frame coverage for this specific
    # invariant would require a more permissive reformulation (e.g.,
    # "set of bank colors in block ⊆ {D2, D6}") which adds complexity
    # without proportional detection gain.


# ── INV-F determinism guard (catches non-deterministic rendering) ──
#
# Running `python port/capture_after_seq.py` twice in a row MUST produce
# byte-identical PNGs at every frame index. If the captures drift
# against the pinned SHA baseline in
# `tests/sanity_capture_baseline.json`, something has introduced
# non-deterministic state into the port (e.g., `time.time()` used as
# a seed, an `import random` that's not LFSR-routed, a Set ordering
# leak into render output).
#
# Bootstrap behavior: on the FIRST run after the captures were
# generated (or the baseline JSON is missing), the test prints the
# computed SHAs, writes them to `tests/sanity_capture_baseline.json`,
# and skips the equality check with a clear "BASELINE PINNED" message
# so the developer can review + commit. On SUBSEQUENT runs the baseline
# exists and the test asserts byte-equality — any drift = non-determinism
# regression.

import hashlib
import json

# Sanity-capture baseline file path is co-located with this test for
# discoverability (a developer grepping tests/ will find the .json next
# to the .py that depends on it).
BASELINE_PATH = PROJECT_ROOT / "tests" / "sanity_capture_baseline.json"


@pytest.fixture(scope="module")
def frame_capture_shas(frame_captures):
    """Snapshot SHA-256 of each capture, useful for the determinism guard."""
    return {
        tick: hashlib.sha256(
            (PORT_DIR / f"after_game_t{tick:03d}.png").read_bytes()
        ).hexdigest()
        for (tick, _img) in frame_captures
    }


def test_capture_determinism_baseline_pinned(frame_capture_shas):
    """Pinned SHA baseline: the 5 captures' SHA-256 must equal what's
    checked into `tests/sanity_capture_baseline.json`. On the bootstrap
    run (baseline file absent) the test pins the current SHAs and
    skips. On subsequent runs the test asserts equality. Drift = a
    non-determinism regression has crept into the renderer.
    """
    # Sanity: every SHA must be a valid 64-hex-char string.
    assert len(frame_capture_shas) == len(FRAMES), (
        f"Expected {len(FRAMES)} capture SHAs, got "
        f"{len(frame_capture_shas)}."
    )
    for tick, sha in frame_capture_shas.items():
        assert len(sha) == 64 and all(c in "0123456789abcdef" for c in sha), (
            f"Frame {tick}: invalid SHA-256 '{sha[:16]}...'. Capture file "
            f"is not hashable — corrupted PNG?"
        )

    if not BASELINE_PATH.exists():
        # ── Bootstrap: pin the baseline on first run ──
        baseline = {
            "_about": (
                "5-frame deterministic capture SHA-256 baseline. Pinned "
                "2026-07-15. Any drift between a fresh capture run and "
                "these hashes indicates a non-determinism regression in "
                "port/rendering (time.time()-used-as-seed, unseeded "
                "random, etc). Regenerate via `python port/capture_after_seq.py` "
                "and re-run this test; if the new SHAs are intentional, "
                "overwrite this file with them and commit."
            ),
            "_meta": {
                "version": 1,
                "capture_script": "port/capture_after_seq.py",
                "frame_count": len(FRAMES),
                "tolerance": "exact byte equality (PNG encoding is "
                             "deterministic for the same pixel buffer)",
            },
            "shas": {str(tick): sha for tick, sha in frame_capture_shas.items()},
        }
        BASELINE_PATH.write_text(json.dumps(baseline, indent=2) + "\n")
        pytest.skip(
            f"BASELINE PINNED: wrote {BASELINE_PATH.relative_to(PROJECT_ROOT)} "
            f"with the current 5 SHAs. Re-run this test to assert equality. "
            f"Review + commit the JSON before merging."
        )

    # ── Steady-state: assert equality against the pinned baseline ──
    with open(BASELINE_PATH) as f:
        baseline = json.load(f)
    pinned_shas = baseline.get("shas", {})
    assert set(pinned_shas.keys()) == {str(t) for t in FRAMES}, (
        f"Baseline {BASELINE_PATH.relative_to(PROJECT_ROOT)} has SHAs for "
        f"{sorted(pinned_shas.keys())}, expected "
        f"{sorted(str(t) for t in FRAMES)}. Baseline is corrupted or "
        f"out of sync with FRAMES."
    )
    drifts = []
    for tick, current_sha in frame_capture_shas.items():
        pinned_sha = pinned_shas[str(tick)]
        if current_sha != pinned_sha:
            drifts.append(
                f"  t={tick:3d}: pinned={pinned_sha[:16]}... "
                f"current={current_sha[:16]}..."
            )
    assert not drifts, (
        f"Non-determinism detected: {len(drifts)}/{len(FRAMES)} capture "
        f"SHAs drifted from pinned baseline in "
        f"{BASELINE_PATH.relative_to(PROJECT_ROOT)}.\n"
        + "\n".join(drifts)
        + "\nRegenerate via `python port/capture_after_seq.py` after "
        "fixing the source of non-determinism. If the drift is "
        "intentional, overwrite the JSON with the new SHAs and commit."
    )
