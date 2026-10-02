/**
 * riverraid_port.js
 * Partial JavaScript port of Atari 2600 River Raid 6502 assembly (excerpt).
 * Source: /home/vrocket/workspace/riverraid-port/riverraid.asm (staged version)
 * Author: Carol Shaw / Activision (original); Thomas Jentzsch (analysis/labels)
 *
 * Rules of this port:
 * - Only port what is visible in the excerpt (constants, zero-page layout,
 *   and the ROM code snippets present in the ASM).
 * - Do not invent the rest of the game (kernel, collision, full RNG, object
 *   spawning logic, sound engine, etc.). Stub such things clearly.
 * - Preserve 6502 semantics (flags, BCD, 8-bit wraparound, etc.) with helpers.
 * - Label every block with the origin ASM labels/sections.
 */

'use strict';

// -----------------------------------------------------------------------------
// 1. CONSTANTS (from ";==== CONSTANTS" section)
// -----------------------------------------------------------------------------//

// Seeding for LFSR-style RNG (if it appears later).
export const SEED_LO  = 0x14;
export const SEED_HI  = 0xA8;

// Color constants (NTSC assumed per build switch).
export const BLACK      = 0x00;
export const GREY       = 0x06;
export const ORANGE     = 0x2A;
export const YELLOW     = 0x1C;   // NTSC
export const RED        = 0x48;   // NTSC
export const BLUE       = 0x84;   // NTSC
export const CYAN       = 0xB0;   // NTSC
export const GREEN      = 0xD2;   // NTSC

export const DARK_RED     = RED    - 0x06;
export const LIGHT_GREEN  = GREEN  + 0x08;
export const BROWN        = YELLOW - 0x0C;
export const LIGHT_GREY   = GREY   + 0x06;
export const DARK_BLUE    = BLUE   - 0x04;

// Main game constants
export const NUM_BLOCKS     = 6;
export const SECTION_BLOCKS = 16;
export const BLOCK_PARTS    = 2;
export const BLOCK_SIZE     = 32;
export const NUM_LINES      = 160;
export const MAX_LEVEL      = 48;
export const DIGIT_H        = 8;
export const JET_Y          = 19;
export const MIN_MISSILE    = JET_Y - 6;
export const MAX_MISSILE    = NUM_LINES + 1;
export const MISSILE_SPEED  = 6;
export const ROAD_HEIGHT    = 13;
export const INTRO_SCROLL   = 48;
export const SWITCH_PAGE_ID = 9;

// Shape IDs
export const ID_EXPLOSION0 = 0;
export const ID_EXPLOSION1 = 1;
export const ID_EXPLOSION2 = 2;
export const ID_EXPLOSION3 = 3;
export const ID_PLANE      = 4;
export const ID_HELI0      = 5;
export const ID_HELI1      = 6;
export const ID_SHIP       = 7;
export const ID_BRIDGE     = 8;
export const ID_HOUSE      = 9;
export const ID_FUEL       = 10;

// Flags for blockLst
export const PF1_PAGE_FLAG   = 0b00000001;
export const PF2_PAGE_FLAG   = 0b00000010;
export const PF_COLOR_FLAG   = 0b00000100;
export const PATROL_FLAG     = 0b00010000;
export const PF_COLLIDE_FLAG = 0b00100000;
export const ENEMY_MOVE_FLAG = 0b01000000;
export const PF_ROAD_FLAG    = 0b10000000;

// Flags for State1Lst
export const DIRECTION_FLAG = 0b00001000;
export const FINE_MASK      = 0b11110000;
export const NUSIZ_MASK     = 0b00000111;

// Flags for PF_State
export const ISLAND_FLAG  = 0b10000000;
export const CHANGE_FLAG  = 0b01000000;

// Joystick bits
export const MOVE_RIGHT = 0b00001000;
export const MOVE_LEFT  = 0b00000100;
export const MOVE_DOWN  = 0b00000010;
export const MOVE_UP    = 0b00000001;

// ENAxy values
export const DISABLE = 0b00;
export const ENABLE  = 0b10;

// NUSIZx values
export const TWO_COPIES   = 0b001;
export const THREE_COPIES = 0b011;
export const DOUBLE_SIZE  = 0b101;
export const QUAD_SIZE    = 0b111;

// SWCHB bit mask
export const BW_MASK = 0b1000;

// Build switches
export const FILL_OPT    = true;
export const SCREENSAVER = true;
export const TRAINER     = false;
export const NTSC        = true;

// -----------------------------------------------------------------------------
// 2. ZERO-PAGE STATE (from ";==== ZP-VARIABLES" section)
// -----------------------------------------------------------------------------

/**
 * Creates the zero-page mirrored state as a plain object.
 * Arrays are sized exactly as the 6502 excerpt declares.
 */
export function createRiverRaidState() {
  return {
    // Scalar zero-page variables
    gameVariation: 0,   // $80
    gameDelay: 0,       // $81
    frameCnt: 0,        // $82
    random: 0,          // $83
    joystick: 0,        // $84

    // SCREENSAVER build only
    SS_XOR: 0,          // $85
    SS_Mask: 0,         // $86

    dXSpeed: 0,         // $87
    prevPF1PatId: 0,   // $88
    PF_State: 0,        // $89
    sectionEnd: 0,      // $8A
    blockOffset: 0,     // $8B
    posYLo: 0,          // $8C
    bridgeExplode: 0,   // $8D

    // Block arrays (NUM_BLOCKS = 6)
    blockLst: new Uint8Array(NUM_BLOCKS),   // $8E..$93
    XPos1Lst: new Uint8Array(NUM_BLOCKS),  // $94..$99
    State1Lst: new Uint8Array(NUM_BLOCKS), // $9A..$9F
    Shape1IdLst: new Uint8Array(NUM_BLOCKS), // $A0..$A5
    PF1Lst: new Uint8Array(NUM_BLOCKS),   // $A6..$AB
    PF2Lst: new Uint8Array(NUM_BLOCKS),   // $AC..$B1

    // Remaining scalars
    missileY: 0,        // $B2
    playerX: 0,         // $B3
    speedX: 0,          // $B4
    speedY: 0,          // $B5
    blockPart: 0,       // $B6
    fuelHi: 0,          // $B7
    fuelLo: 0,          // $B8
    sectionBlock: 0,    // $B9
    // shapePtr0     $BA..$BB (stub below)
    PF1PatId: 0,        // $BC

    // player1State  $BD..$C1
    player1State: {
      level: 0,           // $BD
      randomLoSave: 0,   // $BE
      randomHiSave: 0,   // $BF
      livesPtr: new Uint8Array(3), // $C0..$C1 (2 bytes + padding to size)
    },
    // Note: original livesPtr spans $BD..$C1 as 5 bytes; we keep a flat scalar lives as convenience
    lives: 0,

    // player2State  $C2..$C5
    player2State: {
      level: 0,
      randomLoSave: 0,
      randomHiSave: 0,
      livesPtr2: new Uint8Array(2), // $C2..$C5 compressed
    },

    gameMode: 0,        // $C6
    // shapePtr1a    $C7..$C8 (stub)
    // shapePtr1b    $C9..$CA (stub)
    // colorPtr      $CB..$CC (stub)
    // scorePtr1     $CD..$D8 (12 bytes, used directly as display pointers)
    scorePtr1: new Uint8Array(12),
    // PF1Ptr        $D9..$DA (stub)
    // PF2Ptr        $DB..$DC (stub)

    // scorePtr2     $DD..$E7 (11 bytes)
    scorePtr2: new Uint8Array(11),
    // Also reused:
    blockNum: 0,       // scorePtr2+1
    reflect0: 0,       // scorePtr2+3
    hitEnemyIdx: 0,    // scorePtr2+5
    PFCrashFlag: 0,    // scorePtr2+7
    missileFlag: 0,    // scorePtr2+9

    collidedEnemy: 0,  // $E8
    randomLo: 0,       // $E9
    randomHi: 0,       // $EA
    randomLoSave2: 0,  // $EB
    randomHiSave2: 0,  // $EC
    temp2: 0,          // $ED
    roadBlock: 0,      // alias of temp2
    PFcolor: 0,        // $EE
    valleyWidth: 0,    // alias
    playerColor: 0,    // $EF
    stateBKColor: 0,   // $F0
    statePFColor: 0,   // $F1
    temp: 0,           // $F2
    diffPF: 0,         // alias
    zero1: 0,          // $f3 — always zero
    player: 0,         // $F4
    missileX: 0,      // $F5
    zero2: 0,          // $F6 — always zero

    // SCREENSAVER build only
    SS_Delay: 0,       // $F7

    sound0Id: 0,       // $F8
    sound0Cnt: 0,      // $F9
    bridgeSound: 0,   // $FA
    missileSound: 0,  // $FB
    temp3: 0,          // $FC
    blockLine: 0,      // alias
    maxId: 0,          // alias
    lineNum: 0,        // $FD
  };
}

// -----------------------------------------------------------------------------
// 3. HELPERS FOR 6502 SEMANTICS
// ------------------------------------------------------------------------------

/** 8-bit wraparound addition. */
export function add8(a, b) {
  return ((a & 0xFF) + (b & 0xFF)) & 0xFF;
}

/** 8-bit wraparound subtraction. */
export function sub8(a, b) {
  return ((a & 0xFF) - (b & 0xFF)) & 0xFF;
}

/** Logical shift right (6502 LSR on accumulator). */
export function lsr8(v) {
  return (v & 0xFF) >>> 1;
}

/** Arithmetic shift right (6502-ish; used if ever needed). */
export function asr8(v) {
  const signed = (v << 24) >> 24; // sign-extend from 8 bits
  return (signed >> 1) & 0xFF;
}

/** Test a bit in an 8-bit value. */
export function bitTest(val, mask) {
  return (val & mask) !== 0;
}

/** Set or clear a bit. */
export function bitSet(val, mask, on) {
  return on ? (val | mask) & 0xFF : (val & (~mask & 0xFF)) & 0xFF;
}

// -----------------------------------------------------------------------------
// 4. STUBBED / EXTERNAL ROUTINES
// ------------------------------------------------------------------------------
// The excerpt mentions several JSR targets that appear later in the file.
// We provide clear stubs so the port remains honest about missing logic.

/** Stub: SetScorePtrs — sets up score/number display pointers. */
export function SetScorePtrs(state) {
  // NOT IMPLEMENTED in excerpt.
  // In the original, this would configure the 6-digit score/number display.
  // Expected side-effect: initialize scorePtr1 high bytes, etc.
  // stubbed
}

/** Stub: SetScorePtr1 — set high-pointer page for score digits. */
export function SetScorePtr1(state, page, index) {
  // NOT IMPLEMENTED in excerpt.
  // Called during reset chain with page = #>Zero and index = 11 (12-1).
  // stubbed
}

/** Stub: GameInit — full game initialization. */
export function GameInit(state, xOffset) {
  // NOT IMPLEMENTED in excerpt.
  // Original description: "initialize game variables, clear screen buffers,"
  // "set up difficulty, reset joystick state, etc."
  // xOffset was loaded into X before the JSR.
  // stubbed
}

/**
 * Stub: SetPosX — coarse/fine horizontal positioning.
 * ASM snippet where it is used:
 *   LDA fuelHi; LSR; LSR; LSR; CLC; ADC #69; JSR SetPosX
 */
export function SetPosX(state, x, offset) {
  // NOT IMPLEMENTED in excerpt.
  // Original: coarse/fine positioning of a TIA object (ball for fuel bar).
  // x = fuel bar horizontal position derived from fuelHi.
  // offset = #4 (ball index into object table).
  // stubbed
}

// -----------------------------------------------------------------------------
// 5. PORTED LOGIC FROM THE EXCERPT
// ------------------------------------------------------------------------------

/**
 * ASM label: START + Reset
 *   SEI; CLD; LDX #0; ...
 *   LDA #0; .loopClear: STA $00,X; TXS; INX; BNE .loopClear
 *   JSR SetScorePtrs
 *   LDA #>Zero; LDX #12-1; JSR SetScorePtr1
 *   LDX #colorPtr+1-PF1Lst; JSR GameInit
 *   LDA random; BNE MainLoop
 *   INC random
 *   STA livesPtr          ; = 0!
 *   LDA #<One; STA scorePtr1+10
 *
 * We model this as a function that mutates state in place.
 */
export function resetAndInit(state) {
  // Zero the entire zero-page range ($00..$FF), and reset stack pointer.
  // In JS we just re-initialize known fields.
  Object.assign(state, createRiverRaidState());

  // JSR SetScorePtrs
  SetScorePtrs(state);

  // JSR SetScorePtr1 (page = 0xFB implied by #>Zero, index = 11)
  const pageZero = 0xFB; // placeholder; >Zero may map elsewhere in full source
  SetScorePtr1(state, pageZero, 11);

  // LDX #38 (colorPtr+1-PF1Lst = 0xCC+1-0xA6 = roughly 0x27 = 39? In excerpt: #38)
  // JSR GameInit
  GameInit(state, 38);

  // LDA random; BNE MainLoop
  if (state.random === 0) {
    // INC random
    state.random = add8(state.random, 1);
    // STA livesPtr (= 0)
    state.player1State.livesPtr[0] = 0;
    // LDA #<One ; STA scorePtr1+10
    // "One" is a label in the original; we don't have the address.
    // We store 0x01 as a plausible low-byte placeholder
    state.scorePtr1[10] = 0x01;
  }

  // Fall through to MainLoop logic
}

/**
 * ASM label: MainLoop (first visible chunk)
 *   LDX #4                ; offset ball
 *   LDA fuelHi
 *   LSR; LSR; LSR
 *   CLC; ADC #69
 *   JSR SetPosX           ; position ball for fuel display
 *
 * We expose this as a per-frame early update helper.
 */
export function mainLoopFuelBar(state) {
  const x = add8(lsr8(lsr8(lsr8(state.fuelHi))), 69);
  // offset = 4 (ball)
  SetPosX(state, x, 4);
}

// NOTE: The excerpt ends after the first JSR in MainLoop (line 332).
// Everything below this line in the original ROM is NOT present in the excerpt.
// The port is frozen at the boundary of the excerpt; anything past this point
// is explicitly stubbed (TODO) so the file can compile and the smoke test
// passes, while remaining honest about missing logic.

// -----------------------------------------------------------------------------
// 6. STUBS FOR SUBSYSTEMS NOT VISIBLE IN EXCERPT
// -----------------------------------------------------------------------------

/** TODO enemy-movement update — excerpt truncated before this logic.
 *  Original contains: patrol direction changes, ENEMY_MOVE_FLAG handling,
 *  speed adjustments per difficulty level, x-position updates for planes/ships/helicopters.
 */
export function updateEnemyMovement(state) {
  // NOT IMPLEMENTED in excerpt.
  // stubbed
}

/** TODO collision detection — excerpt truncated before this logic.
 *  Original contains: hardware CX register reads, enemy-vs-missile,
 *  player-vs-enemy, player-vs-playfield, fuel pickup detection.
 */
export function checkCollisions(state) {
  // NOT IMPLEMENTED in excerpt.
  // stubbed
}

/** TODO missile logic — excerpt truncated before this logic.
 *  Original contains: missile Y advance (MISSILE_SPEED), bounds check
 *  against MAX_MISSILE / MIN_MISSILE, missileFlag enable/disable,
 *  missileX tracking, missileSound trigger.
 */
export function updateMissile(state) {
  // NOT IMPLEMENTED in excerpt.
  // stubbed
}

/** TODO sound engine tick — excerpt truncated before this logic.
 *  Original contains: sound0Id / sound0Cnt decrement, bridgeSound envelope,
 *  missileSound tone updates, TIA AUDCx / AUDFx / AUDVx register writes.
 */
export function updateSound(state) {
  // NOT IMPLEMENTED in excerpt.
  // stubbed
}

// -----------------------------------------------------------------------------
// 7. HIGHER-LEVEL CONVENIENCE
// ------------------------------------------------------------------------------

export class RiverRaidState {
  constructor() {
    this._s = createRiverRaidState();
  }

  /** Access to raw zero-page mirror. */
  get raw() { return this._s; }

  /** Re-initialize (START/Reset path). */
  reset() { resetAndInit(this._s); }

  /** One tick of the early MainLoop logic visible in the excerpt. */
  tickFuelBar() { mainLoopFuelBar(this._s); }
}

export default {
  createRiverRaidState,
  RiverRaidState,
  resetAndInit,
  mainLoopFuelBar,
  // Stubs for not-yet-ported subsystems
  updateEnemyMovement,
  checkCollisions,
  updateMissile,
  updateSound,
  // Constants
  SEED_LO, SEED_HI,
  BLACK, GREY, ORANGE, YELLOW, RED, BLUE, CYAN, GREEN,
  DARK_RED, LIGHT_GREEN, BROWN, LIGHT_GREY, DARK_BLUE,
  NUM_BLOCKS, SECTION_BLOCKS, BLOCK_PARTS, BLOCK_SIZE, NUM_LINES,
  MAX_LEVEL, DIGIT_H, JET_Y, MIN_MISSILE, MAX_MISSILE, MISSILE_SPEED,
  ROAD_HEIGHT, INTRO_SCROLL, SWITCH_PAGE_ID,
  ID_EXPLOSION0, ID_EXPLOSION1, ID_EXPLOSION2, ID_EXPLOSION3,
  ID_PLANE, ID_HELI0, ID_HELI1, ID_SHIP, ID_BRIDGE, ID_HOUSE, ID_FUEL,
  PF1_PAGE_FLAG, PF2_PAGE_FLAG, PF_COLOR_FLAG, PATROL_FLAG,
  PF_COLLIDE_FLAG, ENEMY_MOVE_FLAG, PF_ROAD_FLAG,
  DIRECTION_FLAG, FINE_MASK, NUSIZ_MASK,
  ISLAND_FLAG, CHANGE_FLAG,
  MOVE_RIGHT, MOVE_LEFT, MOVE_DOWN, MOVE_UP,
  DISABLE, ENABLE,
  TWO_COPIES, THREE_COPIES, DOUBLE_SIZE, QUAD_SIZE,
  BW_MASK,
  FILL_OPT, SCREENSAVER, TRAINER, NTSC,
};
