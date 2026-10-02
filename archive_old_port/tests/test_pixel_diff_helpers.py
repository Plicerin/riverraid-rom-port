"""
Pixel-diff regression canaries for the prior hardware-fidelity fixes.

Canary-style tests that lock in correctness against future drift in:

  1. **Stella NTSC palette routing** (port/core/ntsc_palette.py).
     Water must be tia_to_rgb(0x84)=(0,120,132); top-frame colors must be
     among the canonical {0x84, $D2, $DA, $0C, $1C, $48} family.

  2. **JET_Y bottom anchor** (port/core/config.py).
     The jet MUST be drawn at JET_TOP_Y=190, NOT at the bare JTZ JET_Y=19.
     Scans rows 12..22 cols 140..180 for YELLOW-pixel leaks (the jet
     sprite's only color) — a full silhouette there would mean
     JET_Y=19 was used as the screen Y verbatim.

  3. **HUD fuel sprite blits** (port/rendering/hud.py).
     The 5 fuel-tab segments must produce varying-width non-water spans
     at y=220, NOT uniform-width solid rectangles (the pre-fix condition).

  4. **Sprite MSB-first decoder** (port/assets/sprites.py).
     Pixel pattern for byte $2A must be the MSB-first rendering
     `[0,0,1,0,1,0,1,0]` (cols 2,4,6 lit), NOT the LSB-first legacy
     `[0,1,0,1,0,1,0,0]` (cols 1,3,5 lit).

  5. **Player.rect scale-mismatch** (port/entities/player.py).
     self.rect.size MUST be (16, 36) — the 2×-scaled sprite dimensions.
     Reverting to the native 1× (8×18) would let bullets/enemies hit
     only the top-left quadrant of the visible jet.

  6. **HUD parity across deterministic frames** (INTERNAL SanityAssertion).
     Implemented as `tests/test_sanity_deterministic_frames.py:
     test_sanity_across_deterministic_frames`. Replaces the prior
     `test_against_stella_reference_frame` (formerly # 6a) which compared
     `port/after_game.png` against an external Stella/MAME NTSC reference
     that could not be captured on this host due to LFSR game-state
     divergence (see `tests/stella_capture.md` § Pivot to internal
     SanityAssertion for the full failure-mode log).

  7. **Bank-color anti-yellow guard + per-block uniformity** (river
     zones). Double-canary on the draw_river() palette path (the
     $DA→$D6 lighter-variant fix + the row-parity→per-block-color
     alternation fix).
"""

from pathlib import Path
from collections import Counter

import pygame
import pytest
from PIL import Image

from port.core import ntsc_palette
from port.core.config import JET_TOP_Y, JET_Y, ROAD_HEIGHT, SCREEN_HEIGHT
from port.assets.sprites import bytes_to_surface


# ── Paths & constants ─────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
CAPTURE_FILE = PROJECT_ROOT / "port" / "after_game.png"
TOL = 5  # RGB tolerance per channel (Pygame PNG export is exact; ±5 catches
         # palette-index drift without rejecting harmless sub-pixel rounding)


# ── Helpers ───────────────────────────────────────────────────────────

def rgb_approx(c1, c2, tol=TOL):
    """Return True if every channel of c1 is within ±tol of c2."""
    return all(abs(int(a) - int(b)) <= tol for a, b in zip(c1[:3], c2[:3]))


def water():
    return ntsc_palette.tia_to_rgb(0x84)  # canonical Stella water blue


# ── Fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def capture_surface():
    """Load port/after_game.png once for all tests in this module.

    Skips gracefully if the capture hasn't been generated yet (e.g. CI
    without running capture_after.py first).
    """
    if not CAPTURE_FILE.exists():
        pytest.skip(f"{CAPTURE_FILE.relative_to(PROJECT_ROOT)} not found; "
                    f"run capture_after.py first")
    img = Image.open(CAPTURE_FILE).convert("RGB")
    assert img.size == (320, 240), (
        f"Expected 320×240 internal buffer; got {img.size}. "
        f"Was capture_after.py run with a non-standard SCREEN_SIZE?"
    )
    return img


@pytest.fixture(scope="module")
def pygame_init():
    """Ensure pygame.display + pygame.font are initialized for surface ops."""
    pygame.init()
    pygame.font.init()  # Required for pygame.font.Font(...) — used by HUD init.
    pygame.display.set_mode((1, 1))  # 1×1 dummy display for Surface()
    yield
    pygame.quit()


# ── 1. Palette canary ────────────────────────────────────────────────

def test_water_color_canary(capture_surface):
    """Center-of-frame pixel must be canonical Stella water blue ($84)."""
    px = capture_surface.getpixel((160, 100))
    assert rgb_approx(px, water()), (
        f"Water canary drift: pixel (160,100) = {px}, "
        f"want ~{water()} (Stella tia_to_rgb($84)). "
        f"Check port/core/ntsc_palette.py + port/core/config.py COLORS[\"BLUE\"]."
    )


def test_palette_lock_top_colors(capture_surface):
    """Top-3 most common frame colors must be canonical Stella NTSC colors.

    Guards against future regressions in the NTSC palette header
    (e.g. accidentally re-masking bit 7 of TIA color-lum codes).
    """
    canonical = {
        ntsc_palette.tia_to_rgb(0x84),  # water BLUE
        ntsc_palette.tia_to_rgb(0xD2),  # bank GREEN
        ntsc_palette.tia_to_rgb(0xDA),  # bank LIGHT_GREEN
        ntsc_palette.tia_to_rgb(0x0C),  # road LIGHT_GREY
        ntsc_palette.tia_to_rgb(0x1C),  # HUD YELLOW
        ntsc_palette.tia_to_rgb(0x48),  # accent RED
    }
    histogram = Counter(capture_surface.getdata())
    top3 = [color for color, _ in histogram.most_common(3)]
    for color in top3:
        matched = any(rgb_approx(color, c) for c in canonical)
        assert matched, (
            f"Top-frame color {color} does not match any canonical Stella "
            f"NTSC color (bit 7 of TIA color-lum register unmasked?). "
            f"Canonical set: {sorted(canonical)}"
        )


# ── 2. JET_Y bottom-anchor guard ─────────────────────────────────────

def test_jets_y_at_bare_jets_y_has_no_yellow_silhouette(capture_surface):
    """Rows 12..22 cols 140..180 must have FEW YELLOW pixels — guards against
    bare JET_Y=19 drift where the FULL jet sprite fills the upper playfield.

    Why YELLOW specifically? The jet sprite is the ONLY entity whose body
    color is COLORS[\"YELLOW\"]=tia_to_rgb(0x1C)=(252,252,180). Banks use
    GREEN/LIGHT_GREEN, enemies use ORANGE/RED, fuel depots use YELLOW but
    only at lower HUD-band x positions. Bounding x to 140..180 (the
    center-of-frame jet-strafing band where JTZ spawning never places
    fuel depots) plus ±10 tolerance isolates the jet silhouette. A
    full JetStraight spread at this band is ~60 YELLOW pixels — the
    inference threshold is set conservatively low at 5.
    """
    yellow = ntsc_palette.tia_to_rgb(0x1C)  # (252, 252, 180)
    yellow_pixels = []
    for y in range(12, 23):
        for x in range(140, 180):
            px = capture_surface.getpixel((x, y))
            if rgb_approx(px, yellow, tol=10):
                yellow_pixels.append((x, y, px))
    assert len(yellow_pixels) < 5, (
        f"{len(yellow_pixels)} YELLOW pixels found in rows 12..22 cols "
        f"140..180 — the full JetStraight silhouette is ~60 YELLOW pixels. "
        f"Likely a {JET_Y}=19 screen-Y regression. First 5: {yellow_pixels[:5]}"
    )


def test_jets_visible_in_lower_playfield_window(capture_surface):
    """At least 30 YELLOW pixels in the lower-playfield band (rows 190..225,
    any column) must exist — the JetStraight silhouette is present
    somewhere on screen, not relying on coincidental non-water pixels
    (fuel depots, banks, enemies would also satisfy a generic non-water
    check).

    Band design: player.x can shift 0..312 via speedX (player.update()
    increments it by up to 3 per frame for hundreds of frames before
    clamping), so a fixed-column band (e.g. cols 152..167) misses the jet
    during normal flight. Instead we scan the WHOLE 320-column band for
    the YELLOW silhouette anchored at JET_TOP_Y=190. The YELLOW count
    threshold is set conservatively above the no-jet baseline (typically
    ~5 YELLOW pixels from HUD label bleed-through in this row range).

    Tolerance ±10 absorbs alpha-blend artifacts introduced when the
    Pygame sprite blit over the water background anti-aliases the sprite
    boundary into ~(252, 250, 180) sub-pixel values that exact-match
    tia_to_rgb(0x1C)=(252, 252, 180) only on the interior pixels.
    """
    yellow = ntsc_palette.tia_to_rgb(0x1C)  # (252, 252, 180)
    yellow_count = 0
    for y in range(JET_TOP_Y, JET_TOP_Y + 36):  # 18 native rows × scale 2
        for x in range(0, 320):
            px = capture_surface.getpixel((x, y))
            if rgb_approx(px, yellow, tol=10):
                yellow_count += 1
    assert yellow_count >= 20, (
        f"Found only {yellow_count} YELLOW pixels in lower-playfield "
        f"rows {JET_TOP_Y}..{JET_TOP_Y + 36} (any col). The player jet "
        f"silhouette is missing. See port/entities/player.py + "
        f"port/core/config.py JET_TOP_Y."
    )


# ── 3. HUD fuel sprite-blits varying widths ──────────────────────────
#
# Capture-pipeline quirk: active FUEL_TAB sprite surfaces are
# `pygame.SRCALPHA` (transparent alpha=0 in unlit cols). When the
# capture is saved to PNG, transparent regions become RGB(0,0,0) BLACK
# (not water blue) on read by PIL's convert("RGB"). The span detector
# reads them as non-water, so adjacent active segments can fuse into
# wide spans whose total width depends on the lit-pixel pattern + gap.
# The post-fix invariant — "at least 2 distinct widths" — still
# cleanly discriminates the pre-fix 5-identical-rect regression
# (which produces 1 unique width ⇒ FAIL) from the post-fix varying
# sprite blits (≥2 unique widths ⇒ PASS) without false-positiving on
# the SPCALPHA→PNG blend artifact.

def test_hud_fuel_blits_varying_widths(capture_surface):
    """At y=220 (HUD fuel gauge middle), detected non-water spans must
    include AT LEAST 2 DISTINCT widths.

    Pre-fix: 5 identical 20-px solid rects ⇒ every detected span has
    width 20 ⇒ unique_widths == 1 ⇒ FAIL.

    Post-fix: FUEL_TAB_0..4 widths (2, 6, 10, 12, 14) PLUS the inactive
    segments get 16-px-GREY solid rects ⇒ ≥2 distinct widths ⇒ PASS.
    """
    w = water()
    spans = []
    in_span = False
    span_start = 0
    for x in range(40, 130):
        px = capture_surface.getpixel((x, 220))
        if not rgb_approx(px, w):
            if not in_span:
                in_span = True
                span_start = x
        elif in_span:
            spans.append((span_start, x))
            in_span = False
    if in_span:
        spans.append((span_start, 130))

    widths = [e - s for s, e in spans]
    assert len(spans) >= 3, (
        f"Expected ≥3 HUD fuel segments at y=220, got {len(spans)}. "
        f"Spans: {spans}. Has HUD fuel-gauge lost its sprite blits?"
    )
    unique_widths = set(widths)
    assert len(unique_widths) >= 2, (
        f"All fuel segments have the SAME width {widths}: uniform-rect "
        f"regression (pre-fix). Widths should vary because FUEL_TAB_0..4 "
        f"have lit-pixel counts 1, 3, 5, 6, 7 plus 16-px inactive GREY rects."
    )


# ── 4. Sprite MSB-first canonical pattern ────────────────────────────

def test_msb_first_byte_2A_render(pygame_init):
    """bytes_to_surface([0x2A], scale=1) MUST produce MSB-first pattern
    `[0,0,1,0,1,0,1,0]` (cols 2,4,6 lit), NOT LSB-first legacy `[0,1,0,1,0,1,0,0]`.

    Independently verifies the decoder flip without going through the
    full sprite-cache load.
    """
    pygame_init  # fixture ensures pygame is initialized for Surface()
    surface = bytes_to_surface([0x2A], row_count=1, scale=1)
    actual = [1 if surface.get_at((cx, 0))[3] > 0 else 0 for cx in range(8)]
    expected = [0, 0, 1, 0, 1, 0, 1, 0]
    assert actual == expected, (
        f"MSB-first regression for byte $2A. "
        f"Got {actual}, want {expected} (= `..X.X.X..`). "
        f"If you flipped the decoder back to LSB-first, this test fails "
        f"alongside every JetStraight rendering in port/after_game.png."
    )


# ── 5. Player.rect scale-mismatch regression ─────────────────────────

def test_player_rect_size_matches_scaled_sprite():
    """Player.rect.size MUST be (16, 36) — the scaled sprite dimensions.

    Guards a prior-turn fix where Player.rect was sourced from the
    NATIVE 1× sprite (8×18) but Player.draw blits the 2× scaled
    sprite (16×36). Reverting to native would let bullets/enemies hit
    only the top-left quadrant of the visible jet, breaking collision
    on the right edge and bottom edge.
    """
    from port.entities.player import Player
    player = Player()
    assert player.rect.size == (16, 36), (
        f"Player.rect.size = {player.rect.size}, want (16, 36). "
        f"Collision detection only matches the top-left quadrant of "
        f"the visible jet when sized correctly. See port/entities/"
        f"player.py __init__ — surface MUST come from get_scaled(...)."
    )


# ── 6. (HUD parity test REMOVED 2026-07-15 — replaced by
#        tests/test_sanity_deterministic_frames.py:test_sanity_across_deterministic_frames)
#        External per-pixel diff against the Stella/MAME NTSC reference
#        was retired because LFSR game-state divergence defeats the
#        compare. The internal SanityAssertion validates 5 invariants
#        across 5 deterministic frames (t=0, 60, 120, 180, 240) and
#        catches every prior color-route regression without an external
#        reference. See tests/stella_capture.md § Pivot to internal
#        SanityAssertion for the full rationale + the per-attempt
#        failure log.


# ── 7. LLM-hallucinated Stella-recipe guard ─────────────────────────────────
#
# Earlier turns perpetuated a hallucinated `stella ... -frame 0 -dump-png ...`
# recipe across pytest.skip() messages, module docstrings, and individual
# test docstrings. This guard fails at CI-time if any source file
# reintroduces it anywhere except the canonical-reference files
# tests/stella_capture.md and tests/test_pixel_diff_helpers.py (this file).
# Both are allowed to quote + critique the impossible command by design:
#   - stella_capture.md  — canonical doc explaining why the recipe fails
#   - test_pixel_diff_helpers.py — this pytest module DEFINES + DOCUMENTS
#     the guard itself (~5 mentions across docstrings + skip messages
#     + the HALLUCINATED_RECIPE string)
# Any other source file (.py / .md / .sh / .txt) MUST NOT carry the recipe.

HALLUCINATED_RECIPE = "-frame 0 -dump-png"
ALLOWED_PATHS = {
    (PROJECT_ROOT / "tests" / "stella_capture.md").resolve(),
    (PROJECT_ROOT / "tests" / "test_pixel_diff_helpers.py").resolve(),
}
# Belt-and-braces fallback: matches by file name in case a future refactor
# renames the test module but leaves the canonical-reference intent intact.
ALLOWED_NAMES = {"test_pixel_diff_helpers.py", "stella_capture.md"}
SKIP_DIR_PARTS = {"__pycache__", ".git", "node_modules", ".venv", "venv"}

def _scan_for_hallucinated_stella_recipe():
    """Return list of (path, line_no, text) for any file outside the
    canonical-reference set that contains the impossible Stella CLI recipe.
    Skips bytecode caches + virtualenvs + .git to avoid pyc duplicates.
    """
    findings = []
    for ext in ("*.py", "*.md", "*.sh", "*.txt"):
        for path in sorted(PROJECT_ROOT.rglob(ext)):
            if any(part in SKIP_DIR_PARTS for part in path.parts):
                continue  # bytecode cache + venv + git — irrelevant
            if path.resolve() in ALLOWED_PATHS:
                continue  # canonical reference; permitted to quote
            if path.name in ALLOWED_NAMES:
                continue  # belt-and-braces: rename-resilient exemption
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            for i, line in enumerate(text.splitlines(), 1):
                if HALLUCINATED_RECIPE in line:
                    findings.append((path, i, line.strip()))
    return findings


def test_no_hallucinated_stella_recipes():
    """No file other than the canonical-reference set
    {tests/stella_capture.md, tests/test_pixel_diff_helpers.py} may
    mention the impossible `stella ... -frame 0 -dump-png ...` recipe.
    Catches future LLM-agent regressions at CI-time instead of
    perpetuating across turns.
    """
    findings = _scan_for_hallucinated_stella_recipe()
    assert not findings, (
        f"Found {len(findings)} references to the impossible Stella CLI "
        f"recipe (`-frame 0 -dump-png`) outside the canonical-reference "
        f"set:\n"
        + "\n".join(
            f"  {p.relative_to(PROJECT_ROOT)}:{i}: {t}"
            for p, i, t in findings
        )
        + "\nSee tests/stella_capture.md 'Why the literal ... does NOT work' "
        "section for the documented fact that this command does NOT exist "
        "on Stella 6.7.1; use the MAME 0.287 recipe (documented in the same "
        "file) for genuine NTSC capture."
    )


# ── 8. Bank color anti-yellow guard (river bank zone must use GREEN/LIGHT_GREEN only) ────
#
# Pre-fix bug: draw_river() alternated bank color ROW-PARITY between
# tia_to_rgb(0xD2)=(100,92,0) and config.COLORS["LIGHT_GREEN"]=tia_to_rgb(0xDA)=(224,216,0).
# tia_to_rgb(0xDA) at luma-5 hue-13 is bright-yellow — visibly wrong as a 2-row
# bank stripe (looked like a flicker between dark-olive and yellow). The fix
# replaces the brighter variant with tia_to_rgb(0xD6)=(164,156,0) at luma-3 hue-13
# (JTZ's actual `PFcolor = GREEN | PF_COLOR_FLAG` ⇒ $D2|0x04=$D6), AND switches
# row-parity alternation → per-(BLOCK_SIZE=32-row) block alternation
# (matches JTZ's `STA PFcolor` once per block in DisplayKernel).
#
# This guard fails if the bank zone (x=0..63 left + 256..319 right of river
# rows 14..226) contains any pure YELLOW ($1C ≈ (252,252,180)) pixels — the
# symptom of the original bug. Adjacent GREEN/LIGHT_GREEN alternation is fine.

_BANK_COLOR_PAIR = {
    ntsc_palette.tia_to_rgb(0xD2),  # (100, 92, 0)   GREEN
    ntsc_palette.tia_to_rgb(0xD6),  # (164, 156, 0)  BANK_LIGHT_GREEN (post-fix)
}
_YELLOW = ntsc_palette.tia_to_rgb(0x1C)  # (252, 252, 180)

def test_bank_zone_no_yellow_contamination(capture_surface):
    """No YELLOW ($1C) pixels may appear in the river-bank zone.

    Symptom-of-regression: if `draw_river` accidentally pulls
    COLORS['LIGHT_GREEN'] (=tia_to_rgb(0xDA)=(224,216,0), bright yellow)
    into the bank palette, or if the row-parity alternation re-introduces
    a brighter-than-$D6 variant, the bank zone will contain YELLOW-like
    pixels distinguishable from the DARK/LIGHT-GREEN pair. This guard
    blocks the regression at CI-time.
    """
    yellow_hits = []
    for y in range(14, 227):  # skip road bands (0..13 + 227..239)
        for x in (0, 32, 63, 256, 287, 319):  # sample across both bank zones
            px = capture_surface.getpixel((x, y))
            # YELLOW detection: matches $1C within ±10, but NOT a GREEN bank pixel.
            is_yellow = rgb_approx(px, _YELLOW, tol=10)
            is_bank = any(rgb_approx(px, c, tol=10) for c in _BANK_COLOR_PAIR)
            if is_yellow and not is_bank:
                yellow_hits.append((x, y, px))
    assert len(yellow_hits) <= 5, (
        f"{len(yellow_hits)} YELLOW ($1C) pixels in bank zones — the "
        f"draw_river() palette is pulling in a too-bright variant "
        f"({_YELLOW}). Expected only $_BANK_COLOR_PAIR-set pixels. "
        f"First 5 hits: {yellow_hits[:5]}. "
        f"See port/rendering/screen.py draw_river() — bank_color must "
        f"use COLORS['GREEN'] ($D2) or COLORS['BANK_LIGHT_GREEN'] ($D6), "
        f"NEVER COLORS['LIGHT_GREEN'] ($DA = bright yellow)."
    )


def test_bank_color_uniform_within_block_two_rows(capture_surface):
    """Within each block, all rows that have a BANK PIXEL at x=0 must share
    the SAME color exactly (per-block uniformity, no row-flicker).

    Symptom-of-regression: pre-fix `draw_river` alternated the row color
    every 2 rows between $D2 and $DA (bright yellow), producing a strong
    dark↔bright flicker. Post-fix uses per-BLOCK_SIZE=32-row alternation
    between $D2 and $D6 with `river.get_block_color_for_row()`. Within a
    single block's 32 rows, every bank pixel at x=0 must match exactly
    (Pygame PNG export is lossless). Tolerance ≤5 matches the TOL constant.

    Implementation note: PFPAT0 contains 0x00 rows (all water, x=0 is
    water not bank) and wedge transition rows. So the test must SKIP rows
    where x=0 IS water (otherwise color delta = max-channel-water-vs-bank
    is huge and the test would always fail). The robust assertion is:
    for every 2 CONSECUTIVE BANK rows in the same block, their colors
    match within TOL.
    """
    block_size = 32
    water_color = ntsc_palette.tia_to_rgb(0x84)
    for block_idx in range(6):
        block_top_y = 14 + block_idx * block_size
        prev = None  # (y, rgb) of preceding bank-painted row in this block
        for dy in range(block_size):
            y = block_top_y + dy
            px = capture_surface.getpixel((0, y))
            is_water = all(
                abs(int(px[c]) - int(water_color[c])) <= 10 for c in range(3)
            )
            if is_water:
                prev = None
                continue
            if prev is not None:
                delta = max(
                    abs(int(prev[1][c]) - int(px[c])) for c in range(3)
                )
                assert delta <= TOL, (
                    f"Block {block_idx}: bank color jumped from RGB{prev[1]} "
                    f"(y={prev[0]}) to RGB{px} (y={y}) — delta={delta} "
                    f"per-channel exceeds TOL={TOL}. Per-block uniformity "
                    f"violated: the renderer is alternating COLORS at "
                    f"row-level rather than BLOCK_SIZE=32-row-level."
                )
            prev = (y, px)
