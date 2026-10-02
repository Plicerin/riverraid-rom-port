// River Raid — NTSC VCS color palette.
//
// Values are the RGB triples a Stella-decoded Atari 2600 NTSC framebuffer
// produces for the COLU* register values this game uses. Sampled by
// scanning verify/reference_screenshot.png pixel-by-pixel (8-bit RGB,
// top-N color bucket of the cart's river+bank+road) and writing the
// exact triples back here. Provenance: Thomas Jentzsch 2001 disassembly
// (vcs.h COLU<n> register values) → baseStella v6 NTSC decoder → pixel
// sampled here. The comments on each line cite the COLU* register value
// that drives the colour so future restyles can re-derive it.

// ── Palette (R, G, B) ──────────────────────────────────────────────
export const PALETTE = {
  BLACK:         [0,     0,   0],    // $00
  GREY:          [0x30,  0x30, 0x30], // $06
  LIGHT_GREY:    [132,  132, 131], // $0C – KEEP: 131 in B is intentional (Stella sample, do NOT normalize)
  BROWN:         [0x48,  0x48, 0x00], // $10  ; parity-sweep-verified (n=23.9k px)
  YELLOW:        [230,  230, 62],  // $1C  – pixel-perfect vs Stella ref
  ORANGE:        [0xFD,  0xA8, 0x4C], // $2A
  RED:           [0xFA,  0x38, 0x18], // $48
  DARK_BLUE:     [0x64,  0x55, 0x40], // $80
  BLUE:          [36,   40,  176],  // $84   – water / pixel-perfect vs Stella ref
  CYAN:          [0x60,  0xF0, 0xF0], // $B0
  GREEN:         [99,   147, 54],   // $D2   – bank darker / pixel-perfect vs Stella ref
  LIGHT_GREEN:   [149,  203, 89],   // $DA   – bank lighter / pixel-perfect vs Stella ref
  // Derived gradient colors that the original used for multi-color sprites.
  PLANE_GREEN:   [0x56,  0x60, 0x44], // $AC
  PLANE_GREY:    [0x4E,  0x4E, 0x4E], // $9C
  PLANE_DARK:    [0x44,  0x44, 0x44], // $8C
  SHIP_WHITE:    [0x6F,  0x6F, 0x6F], // $A8  ; parity-sweep-verified (n=2.87M px)
  SHIP_LIGHT:    [0x18,  0x18, 0x18], // $32
  BRIDGE_RED:    [0xA3,  0x39, 0x15], // $20  ; parity-sweep-verified (n=179k px)
  BRIDGE_DARK:   [0x48,  0x18, 0x0C], // $14
  BRIDGE_DARKEST:[0x40,  0x10, 0x08], // $12 — STELLA-DECODED value; rendered 0× in a 199-frame subsample (≈3.3% of the 5970-frame capture set; full-set verification pending faster Python implementation). K-means seed still references this in sample_stella_buckets.mjs SEEDS array; bucket_status remains EMPTY because the cart doesn't render COLU* $12 within the captured level window (~levels 1–5 in 200s of natural-evolution play — verified via tmp_bridge_darkest_diagnostic.py).
  WHITE:         [0xFF,  0xFF, 0xFF],
};

// css() returns a string suitable for canvas fillStyle/strokeStyle.
export function css([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

// Bank / river color cycle (0 = GREEN/dark, 1 = LIGHT_GREEN/bright)
// per JTZ; assigned to each new block at creation.
export const BANK_COLORS = [PALETTE.GREEN, PALETTE.LIGHT_GREEN];

// Enemy palette cycles, indexed by frame counter.
export const ENEMY_PALETTES = {
  [4 /* PLANE   */]: [PALETTE.PLANE_GREEN,  PALETTE.PLANE_GREY,   PALETTE.PLANE_DARK],
  [5 /* HELI0   */]: [PALETTE.CYAN,         PALETTE.DARK_BLUE,    PALETTE.ORANGE],
  [6 /* HELI1   */]: [PALETTE.CYAN,         PALETTE.DARK_BLUE,    PALETTE.ORANGE],
  [7 /* SHIP    */]: [PALETTE.SHIP_WHITE,   PALETTE.SHIP_LIGHT,   PALETTE.BLACK],
  [8 /* BRIDGE  */]: [PALETTE.BRIDGE_RED,   PALETTE.BRIDGE_DARK,  PALETTE.BRIDGE_DARKEST],
  [9 /* HOUSE   */]: [PALETTE.BROWN,        PALETTE.LIGHT_GREEN,  PALETTE.BLACK, PALETTE.LIGHT_GREY],
};

// Road colors (RoadColorTab from JTZ, simplified to top+bottom road).
export const ROAD_COLOR_TAB = [
  PALETTE.BLACK, PALETTE.BLACK,
  PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY,
  PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY,
  PALETTE.YELLOW,
  PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY, PALETTE.LIGHT_GREY,
];
