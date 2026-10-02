// River Raid — pure ROM-derived data.
//
// All numerical values come from Thomas Jentzsch's 2001 disassembly of
// the River Raid 4KB USA ROM (reference/jentzsch_2001/River Raid.asm).
// This module exports no system-dependent APIs — it can be loaded under
// Node.js for headless verification as well as in the browser.

// ── Constants ────────────────────────────────────────────────────────
export const W = 320;
export const H = 240;

export const NUM_BLOCKS = 6;        // JTZ NUM_BLOCKS
export const SECTION_BLOCKS = 16;   // JTZ SECTION_BLOCKS
export const BLOCK_SIZE = 32;       // JTZ BLOCK_SIZE
export const MAX_LEVEL = 48;

// JET_Y = vertical position of the player jet's TOP edge on the 240-line
// canvas. The JTZ asm labels this constant `JET_Y = 19 ; fixed y-position
// for jet` and uses it in the kernel as `CPY #JET_Y` to gate the jet
// drawing loop — the jet is drawn for the LAST 19 scanlines of the
// 160-line main kernel, i.e. anchored at the bottom of the playable area.
// In our 240-line port (with 13-px top + 13-px bottom road, river zone
// = Y=13..226), the equivalent position is: jet top edge at Y=208, jet
// bottom edge at Y=225 (PLAYER_H=18) — a clean fit just above the bottom
// road. The original port copied the raw JET_Y = 19 verbatim without
// remapping the offset, which is why the jet appeared at the top of the
// canvas.
export const JET_Y = 208;           // see JTZ JET_Y offset above
export const ROAD_H = 13;           // JTZ ROAD_HEIGHT
export const INTRO_SCROLL = 48;     // JTZ INTRO_SCROLL
export const RIVER_ROWS = H - ROAD_H * 2;

export const MAX_SPEED_X = 3;
export const MAX_SPEED_Y = 2;
export const MISSILE_SPEED = 4;

export const FUEL_MAX = 255;
export const FUEL_DRAIN = 1;
export const FUEL_REFUEL = 2;

export const LIVES_START = 3;
export const LIVES_MAX = 9;
export const MULT_START = 10;
export const MULT_MIN = 1;
export const MULT_DECAY_FRAMES = 5;

// Shape IDs (JTZ shape ID values, used for arrays indexed by PF1PatId)
export const SHAPE_PLANE = 4;
export const SHAPE_HELI0 = 5;
export const SHAPE_HELI1 = 6;
export const SHAPE_SHIP = 7;
export const SHAPE_BRIDGE = 8;
export const SHAPE_HOUSE = 9;

// Player state machine values
export const PLAYER_FLYING = 0;
export const PLAYER_EXPLODING = 1;

// Collision rectangles (in screen pixels)
export const PLAYER_W = 8;
export const PLAYER_H = 18;     // matches JetStraight/JetMove sprite height
export const ENEMY_W = 8;
export const ENEMY_H = 8;
export const BULLET_W = 1;
export const BULLET_H = 8;
export const FUEL_W = 8;
export const FUEL_H = 11;

// ── JTZ 16-bit LFSR (NextRandom16, lines 2308-2313) ──────────────────
// Mirrors the assembly:
//   LDA randomHi; ASL x3; EOR randomHi; ASL; ROL randomLo; ROL randomHi
// Initial seed: lo=0xA8, hi=0x14 (matches the original ROM boot state).
export class LFSR {
  constructor(lo = 0xA8, hi = 0x14) {
    this.lo = lo & 0xFF;
    this.hi = hi & 0xFF;
  }
  next() {
    const acc = ((this.hi << 3) ^ this.hi) & 0xFF;
    const c1 = (acc >> 7) & 1;
    const c2 = (this.lo >> 7) & 1;
    this.lo = ((this.lo << 1) | c1) & 0xFF;
    this.hi = ((acc << 1) | c2) & 0xFF;
  }
  peekLo() { return this.lo; }
  peekHi() { return this.hi; }
  reset() { this.lo = 0xA8; this.hi = 0x14; }
}

// ── EnemyIdTab (JTZ line 2570) ──────────────────────────────────────
// LFSR index (after mask) → enemy shape ID.
export const ENEMY_ID_TAB = [7, 5, 6, 7];

// ── ShapePosTab (JTZ line 2573) ─────────────────────────────────────
// Indexed by PF1PatId (0..14). Even index = right bank, odd = left bank.
// Values are coarse VCS playfield X coordinates (0..159).
export const SHAPE_POS_TAB = [
  143, 141,   // PF 0 (explosion right, left)
  7,   10,     // PF 1 (explosion right, left)
  132,         // PF 4 (plane right)
  13,          // PF 5 (heli0 left)
  128,         // PF 6 (heli1 right)
  18,          // PF 7 (ship left)
  124,         // PF 8 (bridge right)
  22,          // PF 9 (house left)
  120,         // PF 10 (fuel right)
  26,          // PF 11 even
  116,         // PF 11 odd
  30,          // PF 13 even
  112,         // PF 13 odd
];

// ── BankPtrTab (JTZ line 2873) ──────────────────────────────────────
// Identity map PF1PatId → PFPAT index.
export const BANK_PTR_TAB = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// ── ScoreTab values (JTZ) ───────────────────────────────────────────
export const SCORES = {
  [SHAPE_PLANE]: 100,
  [SHAPE_HELI0]: 60,
  [SHAPE_HELI1]: 60,
  [SHAPE_SHIP]:   30,
  [SHAPE_BRIDGE]: 500,
  [SHAPE_HOUSE]:  0,
};

// ── PFPat0–PFPat14 playfield patterns (JTZ) ─────────────────────────
// Each pattern is a list of 8-bit row bytes that describe either a
// bank edge (PFPat0..8) or an island column pattern (PFPat9..14).
//
// Interpretation:
//   PFPat0..8: byte is a BITMASK. Each set bit = one 16-px-wide bank
//              column on the LEFT half of the playfield. The number of
//              leading set bits (counted MSB-first from bit 7 down) gives
//              the bank fullness lp ∈ [0..8]; the first zero bit
//              terminates the count. The runtime (src/river.js
//              bankEdgesForRow) returns {leftX = lp*16, rightX = W-lp*16}
//              and src/render.js fills [0..leftX] and [rightX..W] with
//              bank color. So byte=0xFF → lp=8 → leftX=128 (full bank,
//              64-px center water gap); byte=0x80 → lp=1 → leftX=16
//              (single-column bank edge). THIS IS THE SAME BIT-ORDER
//              drawIslands uses below — both pull "leading bit first" out
//              of the same JTZ PFPAT byte convention. (Prior shipped
//              comment claimed this was a SCALAR, not a bitmask — that
//              was wrong; the bank-edge byte is bit-iterated by
//              bankEdgesForRow, see that file for the full algorithm.)
//   PFPat9..14: byte is a BITMASK. Each set bit encodes one isolated
//              mid-stream island column, rendered via drawIslands in
//              src/render.js. The decoder there iterates bits 7 → 0
//              (MSB-first): bit 7 = LEFTMOST PF pixel on the 320-px
//              screen, bit 0 = RIGHTMOST. This is the SAME TIA PF-
//              register byte-order used by the bank-edge branch of
//              src/river.js bankEdgesForRow (every PFPAT byte here is
//              one half of a mirrored PF1/PF2 register pair, written by
//              the JTZ kernel "low → high" bits so the leading bank
//              column corresponds to the high bit). NOTE: this is the
//              OPPOSITE bit-order from bytesToPixels further down —
//              bytesToPixels renders SPRITE GRP bytes LSB-first per
//              the TIA's GRP scanout (bit 0 = leftmost), which is why
//              the two decoders intentionally disagree on which bit
//              is "leftmost".
export const PFPAT = [
  // PFPat0: empty river + transition taper
  [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x03,0x07,0x0F,0x1F],
  // PFPat1: single-pixel bank edge + transition
  [0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0xFF,0x80,0x7F,0x40,0x4F,0x48,0x48,0x4E],
  // PFPat2: two-pixel bank edge (constant)
  [0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0,0xC0],
  // PFPat3: three-pixel bank edge + taper
  [0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xE0,0xC0,0x80],
  // PFPat4: four-pixel bank edge + taper
  [0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xE0,0xC0,0x80,0xC0],
  // PFPat5: five-pixel bank edge + taper
  [0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF8,0xF0,0xE0,0xC0,0x80,0xC0,0xE0],
  // PFPat6: six-pixel bank edge + taper
  [0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xFC,0xF8,0xF0,0xE0,0xC0,0x80,0xC0,0xE0,0xF0],
  // PFPat7: seven-pixel bank edge + taper
  [0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFC,0xF8,0xF0,0xE0,0xC0,0x80,0xC0,0xE0,0xF0,0xF8],
  // PFPat8: full bank + transition
  [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFE,0xFC,0xF8,0xF0,0xE0,0xC0,0x80,0xC0,0xE0,0xF0,0xF8,0xFC],
  // PFPat9: island single-column
  [0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x2A,0x3E,0x1C,0x08],
  // PFPat10: island two-column
  [0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  // PFPat11: island three-column
  [0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x07,0x03,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01],
  // PFPat12: island four-column
  [0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x0F,0x07,0x03,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01],
  // PFPat13: island five-column
  [0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x0F,0x07,0x03,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  // PFPat14: island six-column
  [0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x3F,0x1F,0x0F,0x07,0x03,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
];

// ── Sprite byte data, extracted directly from ROM ───────────────────
// Each byte = one row of an 8-px-wide sprite. The decoder `bytesToPixels`
// applies one horizontal bit-direction tweak (the only non-textual
//                       conversion):
//
//   1. byte[0] = TOP rendered row (no byte reversal). The JTZ kernel
//      iterates lineNum counting DOWN from NUM_LINES — the FIRST byte
//      drawn on screen is byte[0], so byte[0] is the TOP rendered row.
//   2. bit 0   = LEFTMOST pixel (col 0) — TIA scanout order. The Atari
//      2600 TIA's GRP0 register shifts bit 0 out first during line
//      scanout, so bit 0 corresponds to the LEFTMOST pixel on the actual
//      1982 cartridge's display.
//
//      JTZ's own asm annotations show MSB-first (he wrote
//      `$2A ; |  X X X |` with the high bit on the LEFT for human
//      readability), but the JTZ *kernel* writes those bytes verbatim
//      to GRP0 and the TIA silicon renders them LSB-first. So JTZ-as-text
//      and JTZ-as-hardware DISAGREE on left/right ordering; we follow the
//      HARDWARE because the user wants to match what they see on the
//      actual 1982 cartridge (Stella with baserom.a26, or a CRT with the
//      original ROM cart).
//
//      This convention ALSO matches port/assets/sprites.py (Python
//      port), which has always used `byte_val & (1 << bit)` to render
//      the same bytes — so after this change the JS port and Python port
//      produce identical on-screen output for the same ROM data.
//
// Byte sequences come from canonical extraction reports:
//   extraction/riverraid_player_jet_report.json    (JetStraight/JetMove/JetExplode)
//   extraction/riverraid_labeled_sprites.json      (every other sprite)
//
// Raw bytes here match the JTZ disassembly verbatim (byte[0] first).
export const SPRITE_BYTES = {
  // PLAYER (18 rows × 8 cols)
  JetStraight: [
    0,0,0,0,0,
    42,62,28,8,
    73,107,127,127,62,28,8,8,8,
  ],
  // PLAYER tilted (18 rows)
  JetMove: [
    0,0,0,0,2,
    46,60,24,8,
    10,46,62,62,60,24,8,8,8,
  ],
  // PLAYER exploding (17 rows)
  JetExplode: [
    0,0,0,0,0,
    2,8,16,
    0,64,8,33,68,16,4,8,
    0,
  ],
  // MOBS — planes (9 rows / 8 rows)
  PlaneA: [
    0,0,0,0,0,
    48,79,198,
    0,
  ],
  PlaneB: [
    0,0,0,0,0,
    56,255,
    128,
  ],
  // MOBS — helicopters (9 / 8 rows)
  Heli0A: [0,0,0,0,4,255,159,4,7],
  Heli0B: [0,0,0,14,142,255,14,28],
  Heli1A: [0,0,0,0,4,255,159,4,28],
  Heli1B: [0,0,0,14,142,255,14,7],
  // MOBS — ships (7 rows)
  ShipA: [0,0,0,124,254,120,16],
  ShipB: [0,0,0,252,255,48,16],
  // HOUSES (14 / 11 rows)
  HouseA: [0,4,14,31,14,4,0,254,170,254,56,0,0,0],
  HouseB: [0,4,31,14,4,4,0,170,254,124,0],
  // BRIDGE (1 / 11 rows)
  BridgeA: [66],
  BridgeB: [255,255,255,255,255,255,255,255,255,255,66],
  // PROPS — fuel (11 / 12 rows)
  FuelA: [254,222,222,254,222,222,254,214,214,222,206],
  FuelB: [198,222,222,198,206,198,198,214,254,222,222,124],
  // PROPS — explosions
  Explosion0: new Array(13).fill(0),
  Explosion1A: [0,0,0,0,4,2,8,4,0],
  Explosion1B: [0,0,0,0,16,32,64,16],
  Explosion2A: [0,0,0,4,136,16,4,128,16,0,0],
  Explosion2B: [0,0,0,32,2,65,32,2,4],
};

/** Decode a byte array into a 2D pixel grid (rows × 8 cols).
 *
 *  Mirrors `port/assets/sprites.py::bytes_to_surface(msb_first=True,
 *  flip_rows=False)` — the proven Python default validated by the
 *  extraction smoke test that asserts "jet points UP":
 *
 *    1. Bit order (MSB-first): bit 7 → col 0 (LEFTMOST), bit 0 → col 7
 *       (RIGHTMOST). JTZ writes `.byte` directives in top-down visual
 *       order in his annotated asm source (`| X X X |` with the high
 *       bit on the LEFT side of the comment) and the Python port's
 *       `bytes_to_surface(msb_first=True)` reproduces that comment-as-
 *       source convention.
 *
 *    2. Row order (NO reverse): byte[0] → output row 0 (TOP of sprite),
 *       byte[N-1] → output row N-1 (BOTTOM of sprite). JTZ lists the
 *       `JetStraight:` rows starting with five `.byte $00` blanks
 *       (representing river-water space ABOVE the visible jet shape)
 *       followed by the first jet-shape `.byte $2A` at byte[5]. The
 *       smoke test verified that this top-down raster order with NO
 *       flip produces the canonical jet pointing UP. Reversing here
 *       would ship a 180°-rotated jet vs the verified Python reference.
 *
 *  Verify (JetStraight byte[9] = $49 = 0b01001001):
 *    MSB-first: bit 6 ON → col 1 lit, bit 3 ON → col 4 lit, bit 0 ON →
 *    col 7 lit → `.X..X..X` — the classic River Raid jet ALPHA:
 *    cockpit bulges out left, rear-engine vents right, NOSE at the
 *    top point of the sprite (byte[5]=$2A — sparse 3-bit top taper).
 */
export function bytesToPixels(bytes) {
  const out = new Array(bytes.length);
  for (let r = 0; r < bytes.length; r++) {
    const b = bytes[r] & 0xFF;
    const row = new Uint8Array(8);
    // MSB-first: bit 7 → col 0 (LEFTMOST), bit 6 → col 1, ..., bit 0 → col 7.
    for (let i = 0; i < 8; i++) row[i] = (b >> (7 - i)) & 1;
    out[r] = row;             // byte[0] → top of sprite (NO flip — matches Python).
  }
  return out;
}

// Pre-decode every sprite once at module load.
export const SPRITES = Object.fromEntries(
  Object.entries(SPRITE_BYTES).map(([k, v]) => [k, bytesToPixels(v)])
);

// ── Enemy frame / color tables ──────────────────────────────────────
// Maps enemy shape ID → [frameA, frameB] (sprites) and palette cycle.
export const ENEMY_SPRITE_PAIR = {
  [SHAPE_PLANE]:  ['PlaneA', 'PlaneB'],
  [SHAPE_HELI0]:  ['Heli0A', 'Heli0B'],
  [SHAPE_HELI1]:  ['Heli1A', 'Heli1B'],
  [SHAPE_SHIP]:   ['ShipA',  'ShipB'],
  [SHAPE_HOUSE]:  ['HouseA', 'HouseB'],
  [SHAPE_BRIDGE]: ['BridgeA', 'BridgeB'],
};

// Color palettes cycle through frames (JTZ ColorPtrTab).
// Plane = greenish-grey gradient (NTSC $AC/$9C/$8C).
// Heli 0/1 = CYAN / DARK_BLUE / ORANGE ($B0/$80/$2A).
// Ship  = SHIP_WHITE / SHIP_LIGHT / BLACK ($A8/$32/$00).
// Bridge = BRIDGE_RED / BRIDGE_DARK / BRIDGE_DARKEST ($20/$14/$12).
// House = BROWN / LIGHT_GREEN / BLACK / LIGHT_GREY ($10/$DA/$00/$0C).
// (Keys are looked up against the palette map at render time.)
