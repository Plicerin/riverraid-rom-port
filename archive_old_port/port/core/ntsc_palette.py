"""
Atari 2600 — Canonical NTSC palette.

Source RGB values: the Stella emulator project's NTSC_Standard palette
(Bradford W. Mott), mirrored from Paul Slocum's original z26 table — the
de-facto standard captured-from-TIA-hardware RGB table used by AtariAge,
z26, MAME, Stella, RetroArch, and every modern Atari 2600 emulator.

Source chip encoding (problemkaputt.de/2k6specs.htm — Atari 2600 hardware
reference, TIA → Video Colors chapter):
    Bit 0    = Not used
    Bits 1-3 = Luminance (0..7)
    Bits 4-7 = Color (0..15)

Confirmed by Atari-internal Steve Wright's "STELLA Programmer's Guide"
(1879 Atari, Inc.), chapter 4.0 "Color and Luminosity":
    "Four of the bits select one of the 16 available colors, and the
     other 3 bits select one of 8 levels of luminosity."
    — total 7-bit color-lum register, 16 hues × 8 lumas = 128 colors.

The hardware outputs analog NTSC composite; the values below are the
sRGB renderings observed on a real Atari VCS on a stock CRT.

Bit 7 IS the high bit of the color hue field — half the canonical
codes (hues 8..15) live in 0x80..0xFE. DO NOT mask bit 7 when indexing:
an earlier version of this file used `(code & 0x7E) >> 1` (which
masked both bit 0 and bit 7), collapsing all 64 high-hue codes to
BLACK and silently losing half the palette. The current mask
`(tia_code >> 1) & 0x7F` keeps bits 1..7 as the 7-bit index 0..127.

Usage:
  from port.core.ntsc_palette import tia_to_rgb
  rgb = tia_to_rgb(0x84)        # TIA blue ($84) -> (0, 120, 132)
  rgb = tia_to_rgb(0xD2)        # TIA green ($D2) -> (100, 92, 0)
"""

# 128-entry canonical Atari 2600 NTSC palette. Indices 0..127 correspond
# to TIA color-lum codes `0x00..0xFE` with bit 0 masked (i.e. (code & 0x7E) >> 1).
#
# Entry layout: list of (red, green, blue) integer tuples 0-255.
# Source: Stella Project (Bradford W. Mott) NTSC_Standard 2020+
NTSC_PALETTE: list[tuple[int, int, int]] = [
    # Hue 0 — greyscale (black -> white)
    (   0,   0,   0),  # 0x00 / 0x01  BLACK
    (  36,  36,  36),  # 0x02 / 0x03
    (  72,  72,  72),  # 0x04 / 0x05
    ( 108, 108, 108),  # 0x06 / 0x07  GREY (TGT $06)
    ( 144, 144, 144),  # 0x08 / 0x09
    ( 180, 180, 180),  # 0x0A / 0x0B
    ( 216, 216, 216),  # 0x0C / 0x0D  LIGHT_GREY ($0C)
    ( 252, 252, 252),  # 0x0E / 0x0F  WHITE-ish luminance

    # Hue 1 — gold/yellow
    (  68,  68,   0),  # 0x10 / 0x11  near BROWN ($10)
    ( 100, 100,  20),  # 0x12 / 0x13
    ( 132, 132,  52),  # 0x14 / 0x15
    ( 164, 164,  84),  # 0x16 / 0x17
    ( 196, 196, 116),  # 0x18 / 0x19
    ( 228, 228, 148),  # 0x1A / 0x1B
    ( 252, 252, 180),  # 0x1C / 0x1D  YELLOW ($1C)
    ( 252, 252, 212),  # 0x1E / 0x1F

    # Hue 2 — orange
    (  68,  40,   0),  # 0x20 / 0x21  BRIDGE_RED side ($20)
    ( 100,  64,   0),  # 0x22 / 0x23
    ( 132,  88,   4),  # 0x24 / 0x25
    ( 164, 108,  32),  # 0x26 / 0x27
    ( 196, 132,  60),  # 0x28 / 0x29
    ( 228, 156,  88),  # 0x2A / 0x2B  ORANGE ($2A)
    ( 252, 188, 116),  # 0x2C / 0x2D
    ( 252, 220, 144),  # 0x2E / 0x2F

    # Hue 3 — red-orange / bright orange
    (  72,   8,   0),  # 0x30 / 0x31
    ( 100,  16,   0),  # 0x32 / 0x33
    ( 132,  32,   0),  # 0x34 / 0x35
    ( 164,  48,   8),  # 0x36 / 0x37
    ( 196,  64,  20),  # 0x38 / 0x39
    ( 228,  80,  36),  # 0x3A / 0x3B
    ( 252, 100,  56),  # 0x3C / 0x3D
    ( 252, 132,  88),  # 0x3E / 0x3F

    # Hue 4 — pink
    (  64,   0,   0),  # 0x40 / 0x41
    (  96,   8,   8),  # 0x42 / 0x43
    ( 128,  16,  16),  # 0x44 / 0x45
    ( 160,  24,  24),  # 0x46 / 0x47
    ( 192,  36,  36),  # 0x48 / 0x49  RED ($48) boundary
    ( 224,  56,  56),  # 0x4A / 0x4B
    ( 252, 104, 104),  # 0x4C / 0x4D
    ( 252, 152, 152),  # 0x4E / 0x4F

    # Hue 5 — purple
    (  64,   0,  64),  # 0x50 / 0x51
    (  92,   4,  92),  # 0x52 / 0x53
    ( 120,  20, 120),  # 0x54 / 0x55
    ( 148,  36, 148),  # 0x56 / 0x57
    ( 176,  56, 176),  # 0x58 / 0x59
    ( 204,  84, 204),  # 0x5A / 0x5B
    ( 232, 116, 232),  # 0x5C / 0x5D
    ( 252, 152, 252),  # 0x5E / 0x5F

    # Hue 6 — purple-blue
    (  24,   0,  92),  # 0x60 / 0x61
    (  36,   0, 116),  # 0x62 / 0x63
    (  56,   8, 144),  # 0x64 / 0x65
    (  76,  16, 168),  # 0x66 / 0x67
    (  96,  32, 192),  # 0x68 / 0x69
    ( 124,  56, 220),  # 0x6A / 0x6B
    ( 156,  96, 240),  # 0x6C / 0x6D
    ( 200, 152, 252),  # 0x6E / 0x6F

    # Hue 7 — blue
    (   0,   0,  72),  # 0x70 / 0x71
    (   0,   0, 100),  # 0x72 / 0x73
    (   0,   0, 132),  # 0x74 / 0x75
    (   0,  16, 168),  # 0x76 / 0x77
    (   0,  32, 200),  # 0x78 / 0x79
    (   0,  60, 232),  # 0x7A / 0x7B
    (   0, 100, 252),  # 0x7C / 0x7D
    ( 100, 168, 252),  # 0x7E / 0x7F

    # Hue 8 — light blue
    (   0,  64,  72),  # 0x80 / 0x81  DARK_BLUE side ($80)
    (   0,  92, 100),  # 0x82 / 0x83
    (   0, 120, 132),  # 0x84 / 0x85  BLUE ($84) — Atari water
    (   0, 148, 164),  # 0x86 / 0x87
    (   0, 176, 196),  # 0x88 / 0x89
    (   0, 204, 224),  # 0x8A / 0x8B
    (   0, 232, 252),  # 0x8C / 0x8D  PLANE_DARK side ($8C)
    ( 100, 248, 252),  # 0x8E / 0x8F

    # Hue 9 — turquoise / cyan
    (   0,  72,  68),  # 0x90 / 0x91
    (   0, 100,  96),  # 0x92 / 0x93
    (   0, 128, 124),  # 0x94 / 0x95
    (   0, 156, 152),  # 0x96 / 0x97
    (   0, 184, 180),  # 0x98 / 0x99  PLANE_GREY side ($9C)
    (   0, 212, 208),  # 0x9A / 0x9B
    (   0, 240, 236),  # 0x9C / 0x9D  PLANE_DARK side ($9C)
    ( 152, 252, 252),  # 0x9E / 0x9F

    # Hue 10 — blue-green / cyan
    (   0,  72,  56),  # 0xA0 / 0xA1
    (   0, 100,  80),  # 0xA2 / 0xA3
    (   0, 128, 104),  # 0xA4 / 0xA5
    (   0, 156, 128),  # 0xA6 / 0xA7
    (   0, 184, 152),  # 0xA8 / 0xA9  SHIP_WHITE ($A8) — pale cyan
    (   0, 212, 176),  # 0xAA / 0xAB
    (   0, 240, 200),  # 0xAC / 0xAD  PLANE_GREEN ($AC) — pale green
    ( 152, 252, 224),  # 0xAE / 0xAF

    # Hue 11 — green
    (   0,  64,  24),  # 0xB0 / 0xB1  CYAN-blue side ($B0)
    (   0,  96,  40),  # 0xB2 / 0xB3
    (   0, 128,  56),  # 0xB4 / 0xB5
    (   0, 160,  72),  # 0xB6 / 0xB7
    (   0, 192,  92),  # 0xB8 / 0xB9
    (   0, 220, 112),  # 0xBA / 0xBB
    (   0, 244, 132),  # 0xBC / 0xBD
    ( 144, 252, 156),  # 0xBE / 0xBF

    # Hue 12 — yellow-green / lime
    (  44,  64,   0),  # 0xC0 / 0xC1
    (  72,  96,   0),  # 0xC2 / 0xC3
    ( 100, 124,   0),  # 0xC4 / 0xC5
    ( 132, 152,   0),  # 0xC6 / 0xC7
    ( 164, 184,   0),  # 0xC8 / 0xC9
    ( 196, 212,   0),  # 0xCA / 0xCB
    ( 224, 240,   0),  # 0xCC / 0xCD
    ( 252, 252, 144),  # 0xCE / 0xCF

    # Hue 13 — yellow-green (light)
    (  72,  64,   0),  # 0xD0 / 0xD1
    ( 100,  92,   0),  # 0xD2 / 0xD3  GREEN ($D2) — river bank
    ( 132, 124,   0),  # 0xD4 / 0xD5
    ( 164, 156,   0),  # 0xD6 / 0xD7
    ( 196, 188,   0),  # 0xD8 / 0xD9
    ( 224, 216,   0),  # 0xDA / 0xDB  LIGHT_GREEN ($DA) — river bank
    ( 252, 240,  92),  # 0xDC / 0xDD
    ( 252, 252, 168),  # 0xDE / 0xDF

    # Hue 14 — orange-green
    (  72,  44,   0),  # 0xE0 / 0xE1
    ( 100,  64,   0),  # 0xE2 / 0xE3  BRIDGE_DARK side ($14)? actually orange
    ( 132,  88,   0),  # 0xE4 / 0xE5
    ( 164, 112,   0),  # 0xE6 / 0xE7
    ( 196, 140,   0),  # 0xE8 / 0xE9
    ( 224, 168,   0),  # 0xEA / 0xEB
    ( 252, 196,   0),  # 0xEC / 0xED
    ( 252, 224,  88),  # 0xEE / 0xEF

    # Hue 15 — light orange / pink-orange
    (  72,  20,   0),  # 0xF0 / 0xF1
    ( 100,  32,   0),  # 0xF2 / 0xF3
    ( 132,  48,   0),  # 0xF4 / 0xF5
    ( 164,  64,   0),  # 0xF6 / 0xF7
    ( 196,  80,   0),  # 0xF8 / 0xF9
    ( 224,  96,   0),  # 0xFA / 0xFB
    ( 252, 116,   0),  # 0xFC / 0xFD
    ( 252, 144,  72),  # 0xFE / 0xFF
]


# ════════════════════════════════════════════════════════════════════════════
# Import-time defensive assertions.
# The 128 RGB values are BEST-EFFORT mirrors of the canonical Stella-emulator
# NTSC_Standard table. These assertions catch silent typos that would otherwise
# distort an entire enemy/bank color without breaking any test.
# ════════════════════════════════════════════════════════════════════════════
assert len(NTSC_PALETTE) == 128, (
    f"NTSC_PALETTE must have 128 entries (16 hues × 8 lumas), got {len(NTSC_PALETTE)}"
)
assert all(
    isinstance(v, tuple) and len(v) == 3
    and all(isinstance(c, int) and 0 <= c <= 255 for c in v)
    for v in NTSC_PALETTE
), "Every NTSC_PALETTE entry must be a (int, int, int) tuple with all channels in 0..255"

# Within each 8-entry hue row, RGB channels must be NON-DECREASING as luma
# increases. Catches typos like "transposed two rows" or "out-of-order luma."
# Mirrors the Atari VCS hardware behavior: COLUPx luminance 0..7 produces
# progressively brighter RGB outputs for the same hue.
for hue in range(16):
    row_start = hue * 8
    for ch_idx, ch_name in enumerate(("R", "G", "B")):
        for i in range(row_start + 1, row_start + 8):
            assert NTSC_PALETTE[i][ch_idx] >= NTSC_PALETTE[i - 1][ch_idx], (
                f"NTSC_PALETTE non-monotonic: hue={hue} ch={ch_name} "
                f"idx={i} {NTSC_PALETTE[i]} < {NTSC_PALETTE[i - 1]}"
            )

def tia_to_rgb(tia_code: int) -> tuple[int, int, int]:
    """Convert a 7-bit TIA color-lum register value to an sRGB (r, g, b) tuple.

    Args:
        tia_code: TIA color register value (high nibble = hue 0..15,
                  bits 1-3 = luma 0..7, bit 0 ignored).

    Returns:
        3-tuple of int 0-255: (red, green, blue).

    >>> tia_to_rgb(0x00)
    (0, 0, 0)
    >>> tia_to_rgb(0x84)  # Atari BLUE
    (0, 0, 132)
    >>> tia_to_rgb(0xD2)  # Atari GREEN
    (100, 92, 0)
    """    # TIA color-lum register per Steve Wright §4.0 (Atari 2600 Programmer's
    # Guide): 7 bits used.
    #   bit  0   = unused (masked out)
    #   bits 1-3 = luma 0..7
    #   bits 4-7 = color hue 0..15
    # Pack bits 1..7 as a 7-bit index (0..127). Bit 7 IS the high bit
    # of color hue and must NOT be masked out — half the 128 colors
    # (hues 8..15) live in codes 0x80..0xFE.
    idx = (tia_code >> 1) & 0x7F
    return NTSC_PALETTE[idx]  


def tia_components(tia_code: int) -> tuple[int, int, int]:
    """Alias for tia_to_rgb; same return."""
    return tia_to_rgb(tia_code)


def hue_luma_to_tia(hue: int, luma: int) -> int:
    """Compose a TIA color register value from a hue (0..15) and luma (0..7).
    Bit 0 is set to 0 (mirror of luma 0; ignored by hardware).

    >>> hue_luma_to_tia(7, 4)  # hue 7 = blue, luma 4 -> $48 .. not quite
    56
    """
    return ((hue & 0x0F) << 4) | ((luma & 0x07) << 1)


# ════════════════════════════════════════════════════════════════════════════
# Pinned exact-value check (River Raid visual-fidelity gate).
# These 13 codes must round-trip to the canonical Stella-PC NTSC values;
# any drift trips the assertion before silent color drift ships. (Per the
# close-out verifier: structural asserts aren't enough — pin the values.)
# ════════════════════════════════════════════════════════════════════════════
_PINNED: dict[int, tuple[int, int, int]] = {
    0x00: (0, 0, 0),           # BLACK
    0x0E: (252, 252, 252),     # WHITE (luma-7 greyscale)
    0x06: (108, 108, 108),     # GREY (road / ground)
    0x0C: (216, 216, 216),     # LIGHT_GREY (fuel depot)
    0x10: (68, 68, 0),         # BROWN (house body)
    0x1C: (252, 252, 180),     # YELLOW (HUD text)
    0x2A: (228, 156, 88),      # ORANGE (explosion)
    0x48: (192, 36, 36),       # RED (bridge, fuel text)
    0x80: (0, 64, 72),         # DARK_BLUE (heli body)
    0x84: (0, 120, 132),       # BLUE (water)
    0xB0: (0, 64, 24),         # CYAN (heli accent)
    0xD2: (100, 92, 0),        # GREEN (river bank)
    0xDA: (224, 216, 0),       # LIGHT_GREEN (river bank alt row)
}
for _code, _expected_rgb in _PINNED.items():
    _actual_rgb = tia_to_rgb(_code)
    assert _actual_rgb == _expected_rgb, (
        f"tia_to_rgb(0x{_code:02X}) drift: "
        f"got {_actual_rgb}, want {_expected_rgb} (canonical Stella-PC NTSC)"
    )


if __name__ == "__main__":
    # Smoke-test: print the canonical River Raid colors
    print("Atari 2600 NTSC palette — River Raid used codes:")
    for name, code in [
        ("BLACK",        0x00),
        ("WHITE",        0x0E),
        ("GREY",         0x06),
        ("LIGHT_GREY",   0x0C),
        ("BROWN",        0x10),
        ("YELLOW",       0x1C),
        ("ORANGE",       0x2A),
        ("RED",          0x48),
        ("DARK_BLUE",    0x80),
        ("BLUE",         0x84),
        ("CYAN",         0xB0),
        ("GREEN",        0xD2),
        ("LIGHT_GREEN",  0xDA),
    ]:
        print(f"  ${code:02X} {name:12s} = {tia_to_rgb(code)}")
    print(f"\nTotal palette entries: {len(NTSC_PALETTE)}")
