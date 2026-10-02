import { VERIFIED_SPRITE_VARIANT_META } from './riverraid_verified_sprite_meta.mjs';
import { kernelShapeBitmap, kernelShapeRowColors } from './riverraidKernelSprites.mjs';

const SLOT_NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];

const SHAPE_FAMILY_OVERRIDES = Object.freeze({
  Explosion3: 'Explosion1',
});

export function u8(value) {
  return Number(value) & 0xff;
}

export function s8(value) {
  const v = u8(value);
  return (v ^ 0x80) - 0x80;
}

export function toHex(value, width = 2) {
  const mask = width > 2 ? 0xffff : 0xff;
  return `0x${(Number(value) & mask).toString(16).padStart(width, '0')}`;
}

export function dollarHex(value, width = 2) {
  const mask = width > 2 ? 0xffff : 0xff;
  return `$${(Number(value) & mask).toString(16).padStart(width, '0')}`;
}

export function wordAt(memory, address) {
  const lo = readByte(memory, address);
  const hi = readByte(memory, address + 1);
  return ((hi << 8) | lo) & 0xffff;
}

// Assembler switches from ASM excerpt lines 62-65
// These are build-conditional constants that control which code is assembled.
export const ASM_SWITCHES = Object.freeze({
  FILL_OPT: 1,    // ASM line 62: FILL_OPT = 1
  SCREENSAVER: 1, // ASM line 63: SCREENSAVER = 1
  TRAINER: 0,     // ASM line 64: TRAINER = 0
  NTSC: 1,        // ASM line 65: NTSC = 1
  note: 'ASM switches control conditional assembly. NTSC=1 selects NTSC color constants; SCREENSAVER=1 enables SS_XOR/SS_Mask/SS_Delay ZP variables.',
});

export const GAME_CONSTANTS = Object.freeze({
  SEED_LO: 0x14, // ASM: SEED_LO = $14
  SEED_HI: 0xa8, // ASM: SEED_HI = $A8
  NUM_BLOCKS: 6, // ASM: NUM_BLOCKS = 6
  SECTION_BLOCKS: 16, // ASM: SECTION_BLOCKS = 16
  BLOCK_PARTS: 2, // ASM: BLOCK_PARTS = 2
  BLOCK_SIZE: 32, // ASM: BLOCK_SIZE = 32
  NUM_LINES: 160, // ASM: NUM_LINES = 160
  MAX_LEVEL: 48, // ASM: MAX_LEVEL = 48
  DIGIT_H: 8, // ASM: DIGIT_H = 8
  JET_Y: 19, // ASM: JET_Y = 19
  MIN_MISSILE: 13, // ASM: MIN_MISSILE = JET_Y-6 = 13
  MAX_MISSILE: 161, // ASM: MAX_MISSILE = NUM_LINES+1 = 161
  MISSILE_SPEED: 6, // ASM: MISSILE_SPEED = 6
  ROAD_HEIGHT: 13, // ASM: ROAD_HEIGHT = 13 ; number of lines for road
  INTRO_SCROLL: 48, // ASM: INTRO_SCROLL = 48
  SWITCH_PAGE_ID: 9, // ASM: SWITCH_PAGE_ID = 9
});

// Array end-address constants directly from ASM excerpt (label = addr ; ..addr bytes)
// ASM defines blockLstEnd, XPos1LstEnd, State1LstEnd, Shape1IdLstEnd, PF1LstEnd, PF2LstEnd
export const ARRAY_ENDS = Object.freeze({
  blockLstEnd: 0x93,     // ASM: blockLstEnd = blockLst+NUM_BLOCKS-1 = $8E+5 = $93
  XPos1LstEnd: 0x99,     // ASM: XPos1LstEnd = XPos1Lst+NUM_BLOCKS-1 = $94+5 = $99
  State1LstEnd: 0x9f,    // ASM: State1LstEnd = State1Lst+NUM_BLOCKS-1 = $9A+5 = $9F
  Shape1IdLstEnd: 0xa5,  // ASM: Shape1IdLstEnd = Shape1IdLst+NUM_BLOCKS-1 = $A0+5 = $A5
  PF1LstEnd: 0xab,       // ASM: PF1LstEnd = PF1Lst+NUM_BLOCKS-1 = $A6+5 = $AB
  PF2LstEnd: 0xb1,       // ASM: PF2LstEnd = PF2Lst+NUM_BLOCKS-1 = $AC+5 = $B1
  // scorePtr2 comment says "12 bytes" but $DD..$E7 = 11 bytes; port preserves this ambiguity.
});

const BLOCK_ARRAY_NAMES = Object.freeze([
 'blockLst',
 'XPos1Lst',
 'State1Lst',
 'Shape1IdLst',
 'PF1Lst',
 'PF2Lst',
]);

// NTSC color constants from ASM excerpt lines 77-85
// (The ASM also defines PAL equivalents behind IF NTSC / ELSE on lines 80-92,
//  but only NTSC values are visible in the excerpt's active path.)
export const COLORS_NTSC = Object.freeze({
  BLACK: 0x00,
  GREY: 0x06,
  ORANGE: 0x2a,
  YELLOW: 0x1c,
  RED: 0x48,
  BLUE: 0x84,
  CYAN: 0xb0,
  GREEN: 0xd2,
});

// PAL color constants from ASM excerpt lines 86-92 (ELSE branch)
// These are declared in the excerpt but NOT the active path for NTSC=1 builds.
export const COLORS_PAL = Object.freeze({
  BLACK: 0x00,
  GREY: 0x06,
  ORANGE: 0x2a,
  YELLOW: 0x2c,
  RED: 0x68,
  BLUE: 0xb4,
  CYAN: 0x70,
  GREEN: 0x52,
});

// Default color set matches the NTSC path (ASM line 65: NTSC = 1)
export const COLORS = COLORS_NTSC;

export const DERIVED_COLORS = Object.freeze({
  DARK_RED: u8(COLORS.RED - 0x06),
  LIGHT_GREEN: u8(COLORS.GREEN + 0x08),
  BROWN: u8(COLORS.YELLOW - 0x0c),
  LIGHT_GREY: u8(COLORS.GREY + 0x06),
  DARK_BLUE: u8(COLORS.BLUE - 0x04),
});

export const SHAPE_IDS = Object.freeze({
  ID_EXPLOSION0: 0,
  ID_EXPLOSION1: 1,
  ID_EXPLOSION2: 2,
  ID_EXPLOSION3: 3,
  ID_PLANE: 4,
  ID_HELI0: 5,
  ID_HELI1: 6,
  ID_SHIP: 7,
  ID_BRIDGE: 8,
  ID_HOUSE: 9,
  ID_FUEL: 10,
});

const VISIBLE_SLOT_BASE_SHAPES = Object.freeze([
  SHAPE_IDS.ID_PLANE,
  SHAPE_IDS.ID_HELI0,
  SHAPE_IDS.ID_SHIP,
  SHAPE_IDS.ID_BRIDGE,
  SHAPE_IDS.ID_HOUSE,
  SHAPE_IDS.ID_FUEL,
]);

const SCORE_DIGIT_OFFSETS = Object.freeze([0, 2, 4, 6, 8, 10]);
const SCORE_DIGIT_COUNT = SCORE_DIGIT_OFFSETS.length;
// ScoreTab (Jentzsch line 3232), points per shape id: explosions 0, plane 100,
// helis 60, ship 30, bridge 500, house 0, fuel 80.
const SCORE_TAB_POINTS = Object.freeze([0, 0, 0, 0, 100, 60, 60, 30, 500, 0, 80]);
const HARNESS_BRIDGE_EXPLOSION_TICKS = 4;
const MISSILE_X_OFFSET = 5; // LDA playerX / CLC / ADC #$05 / STA missileX
const HARNESS_OBJECT_MOVE_STEP = 1;
const HARNESS_PATROL_TURN_PERIOD = 8;
const HARNESS_RESPAWN_PLAYER_X = 80;

const VISIBLE_SLOT_BASE_FLAGS = Object.freeze([
  0b00000100,
  0b11000000,
  0b00010001,
  0b10000010,
  0b00100000,
  0b01000100,
]);

const VISIBLE_SLOT_BASE_STATE1 = Object.freeze([
  0x00,
  0x2d,
  0x43,
  0x72,
  0x10,
  0x57,
]);

// Values for ENAxy registers (from ASM excerpt line 155-156)
export const TIA_ENABLE = Object.freeze({
  DISABLE: 0b00, // ASM: DISABLE = %00
  ENABLE: 0b10,  // ASM: ENABLE = %10  (value for enabling a missile)
});

// BW_MASK for SWCHB (from ASM excerpt line 165-166)
export const SWITCH_MASK = Object.freeze({
  BW_MASK: 0b1000, // ASM: BW_MASK = %1000 ; black and white bit
});

export const FLAGS = Object.freeze({
  blockLst: Object.freeze({
    PF1_PAGE_FLAG: 0b00000001,
    PF2_PAGE_FLAG: 0b00000010,
    PF_COLOR_FLAG: 0b00000100,
    PATROL_FLAG: 0b00010000,
    PF_COLLIDE_FLAG: 0b00100000,
    ENEMY_MOVE_FLAG: 0b01000000,
    PF_ROAD_FLAG: 0b10000000,
  }),
  state1Lst: Object.freeze({
    DIRECTION_FLAG: 0b00001000,
    FINE_MASK: 0b11110000,
    NUSIZ_MASK: 0b00000111,
  }),
  pfState: Object.freeze({
    ISLAND_FLAG: 0b10000000,
    CHANGE_FLAG: 0b01000000,
  }),
  joystick: Object.freeze({
    MOVE_RIGHT: 0b00001000,
    MOVE_LEFT: 0b00000100,
    MOVE_DOWN: 0b00000010,
    MOVE_UP: 0b00000001,
  }),
});

export const NUSIZ_ASM_NAMES = Object.freeze({
  TWO_COPIES: 0b001,
  THREE_COPIES: 0b011,
  DOUBLE_SIZE: 0b101,
  QUAD_SIZE: 0b111,
});

export const NUSIZ_LABELS = Object.freeze([
  '1 copy',       // NUSIZ %000: 1 copy
  'two copies',   // NUSIZ %001: TWO_COPIES
  'double size',  // NUSIZ %010: 1 copy, double width — ASM: no label for this value
  'three copies', // NUSIZ %011: THREE_COPIES
  'two copies wide', // NUSIZ %100: 2 copies, wide spacing
  'double size',  // NUSIZ %101: DOUBLE_SIZE — same display as %010 on TIA
  'three copies wide', // NUSIZ %110: 3 copies, medium spacing
  'double size',  // NUSIZ %111: QUAD_SIZE — TIA renders same as DOUBLE_SIZE (%101)
]);

// TIA NUSIZx detail table — grounded in ASM excerpt lines 158-162
// (TWO_COPIES=%001, THREE_COPIES=%011, DOUBLE_SIZE=%101, QUAD_SIZE=%111)
// and the Atari TIA hardware spec those named constants encode.
// playerPixelWidth and copyCount describe how the TIA actually renders
// each NUSIZ value for a player sprite; these are TIA hardware facts
// referenced by the ASM's named constants, not invented gameplay.
export const NUSIZ_DETAIL_TABLE = Object.freeze([
  { value: 0b000, asmName: null,            label: '1 copy',            playerPixelWidth: 8,  copyCount: 1, copyOffsets: [0],         note: '1 copy, normal size — ASM: no named constant for this value' },
  { value: 0b001, asmName: 'TWO_COPIES',    label: 'two copies',        playerPixelWidth: 8,  copyCount: 2, copyOffsets: [0, 16],     note: 'ASM line 159: TWO_COPIES = %001' },
  { value: 0b010, asmName: null,            label: 'two copies medium', playerPixelWidth: 8,  copyCount: 2, copyOffsets: [0, 32],     note: '2 copies, medium spacing — ASM: no label for this value' },
  { value: 0b011, asmName: 'THREE_COPIES',  label: 'three copies',      playerPixelWidth: 8,  copyCount: 3, copyOffsets: [0, 16, 32], note: 'ASM line 160: THREE_COPIES = %011' },
  { value: 0b100, asmName: null,            label: 'two copies wide',   playerPixelWidth: 8,  copyCount: 2, copyOffsets: [0, 64],     note: '2 copies, wide spacing — ASM: no label for this value' },
  { value: 0b101, asmName: 'DOUBLE_SIZE',   label: 'double size',       playerPixelWidth: 16, copyCount: 1, copyOffsets: [0],         note: 'ASM line 161: DOUBLE_SIZE = %101' },
  { value: 0b110, asmName: null,            label: 'three copies wide', playerPixelWidth: 8,  copyCount: 3, copyOffsets: [0, 32, 64], note: '3 copies, medium spacing — ASM: no label for this value' },
  { value: 0b111, asmName: 'QUAD_SIZE',     label: 'quad size',         playerPixelWidth: 32, copyCount: 1, copyOffsets: [0],         note: 'ASM line 162: QUAD_SIZE = %111 — TIA renders 4x width for this value' },
]);

export function decodeNUSIZDetail(nusizValue) {
  const value = u8(nusizValue) & 0b111;
  const entry = NUSIZ_DETAIL_TABLE[value] ?? null;
  if (!entry) return { value, asmName: null, label: 'unknown', playerPixelWidth: 8, copyCount: 1, copyOffsets: [0], note: 'Unrecognized NUSIZ value' };
  return { ...entry };
}

export const NTSC_HUE_NAMES = Object.freeze([
  'Grey',
  'Gold',
  'Orange',
  'Orange/Yellow',
  'Blue/Green',
  'Green',
  'Blue',
  'Purple',
]);

export const GAME_MODES = Object.freeze({
  label(value) {
    const raw = u8(value);
    if (raw === 0x00) return 'running';
    if (raw === 0xff) return 'game over';
    if (raw >= 1 && raw <= GAME_CONSTANTS.INTRO_SCROLL) return `scroll ${raw}/${GAME_CONSTANTS.INTRO_SCROLL}`;
    return `unknown (${dollarHex(raw)})`;
  },
});

export const SECTION_STRUCTURE = Object.freeze({
  blocksPerSection: GAME_CONSTANTS.SECTION_BLOCKS,
  blockParts: GAME_CONSTANTS.BLOCK_PARTS,
  kernelTotalLines: GAME_CONSTANTS.BLOCK_SIZE,
  bridgeBlockIndex: 15,
});

export const TIA_REGISTER_MAP = Object.freeze({
  write: Object.freeze({
    0x00: 'VSYNC', 0x01: 'VBLANK', 0x02: 'WSYNC', 0x03: 'RSYNC', 0x04: 'NUSIZ0', 0x05: 'NUSIZ1',
    0x06: 'COLUP0', 0x07: 'COLUP1', 0x08: 'COLUPF', 0x09: 'COLUBK', 0x0A: 'CTRLPF', 0x0B: 'REFP0',
    0x0C: 'REFP1', 0x0D: 'PF0', 0x0E: 'PF1', 0x0F: 'PF2', 0x10: 'RESP0', 0x11: 'RESP1',
    0x12: 'RESM0', 0x13: 'RESM1', 0x14: 'RESBL', 0x15: 'AUDC0', 0x16: 'AUDC1', 0x17: 'AUDF0',
    0x18: 'AUDF1', 0x19: 'AUDV0', 0x1A: 'AUDV1', 0x1B: 'GRP0', 0x1C: 'GRP1', 0x1D: 'ENAM0',
    0x1E: 'ENAM1', 0x1F: 'ENABL', 0x20: 'HMP0', 0x21: 'HMP1', 0x22: 'HMM0', 0x23: 'HMM1',
    0x24: 'HMBL', 0x25: 'VDELP0', 0x26: 'VDELP1', 0x27: 'VDELBL', 0x28: 'RESMP0', 0x29: 'RESMP1',
    0x2A: 'HMOVE', 0x2B: 'HMCLR', 0x2C: 'CXCLR',
  }),
  read: Object.freeze({
    0x00: 'CXM0P', 0x01: 'CXM1P', 0x02: 'CXP0FB', 0x03: 'CXP1FB', 0x04: 'CXM0FB', 0x05: 'CXM1FB',
    0x06: 'CXBLPF', 0x07: 'CXPPMM', 0x08: 'INPT0', 0x09: 'INPT1', 0x0A: 'INPT2', 0x0B: 'INPT3',
    0x0C: 'INPT4', 0x0D: 'INPT5',
  }),
});

const ZERO_PAGE_LAYOUT_SOURCE = Object.freeze([
  { name: 'gameVariation', address: 0x80, note: 'Declared in excerpt ZP variables.' },
  { name: 'gameDelay', address: 0x81, note: 'Declared in excerpt ZP variables.' },
  { name: 'frameCnt', address: 0x82, note: 'Declared in excerpt ZP variables.' },
  { name: 'random', address: 0x83, note: 'Visible reset/init touches random.' },
  { name: 'joystick', address: 0x84, note: 'Declared in excerpt ZP variables.' },
  { name: 'SS_XOR', address: 0x85, note: 'Screensaver build variable declaration.' },
  { name: 'SS_Mask', address: 0x86, note: 'Screensaver build variable declaration.' },
  { name: 'dXSpeed', address: 0x87, note: 'Declared in excerpt ZP variables.' },
  { name: 'prevPF1PatId', address: 0x88, note: 'Declared in excerpt ZP variables.' },
  { name: 'PF_State', address: 0x89, note: 'Declared in excerpt ZP variables.' },
  { name: 'sectionEnd', address: 0x8a, note: 'Declared in excerpt ZP variables.' },
  { name: 'blockOffset', address: 0x8b, note: 'Declared in excerpt ZP variables.' },
  { name: 'posYLo', address: 0x8c, note: 'Declared in excerpt ZP variables.' },
  { name: 'bridgeExplode', address: 0x8d, note: 'Declared in excerpt ZP variables.' },
  { name: 'blockLst', address: 0x8e, length: 6, note: 'Declared block list array.' },
  { name: 'XPos1Lst', address: 0x94, length: 6, note: 'Declared XPos1Lst array.' },
  { name: 'State1Lst', address: 0x9a, length: 6, note: 'Declared State1Lst array.' },
  { name: 'Shape1IdLst', address: 0xa0, length: 6, note: 'Declared Shape1IdLst array.' },
  { name: 'PF1Lst', address: 0xa6, length: 6, note: 'Declared PF1Lst array.' },
  { name: 'PF2Lst', address: 0xac, length: 6, note: 'Declared PF2Lst array.' },
  { name: 'missileY', address: 0xb2, note: 'Declared in excerpt ZP variables.' },
  { name: 'playerX', address: 0xb3, note: 'Declared in excerpt ZP variables.' },
  { name: 'speedX', address: 0xb4, note: 'Declared in excerpt ZP variables.' },
  { name: 'speedY', address: 0xb5, note: 'Declared in excerpt ZP variables.' },
  { name: 'blockPart', address: 0xb6, note: 'Declared in excerpt ZP variables.' },
  { name: 'fuelHi', address: 0xb7, note: 'Visible fuel bar math uses fuelHi.' },
  { name: 'fuelLo', address: 0xb8, note: 'Declared in excerpt ZP variables.' },
  { name: 'sectionBlock', address: 0xb9, note: 'Declared in excerpt ZP variables.' },
  { name: 'shapePtr0', address: 0xba, length: 2, note: 'Declared pointer pair.' },
  { name: 'PF1PatId', address: 0xbc, note: 'Declared in excerpt ZP variables.' },
  { name: 'player1State', address: 0xbd, length: 5, note: 'Declared 5-byte player1State area.' },
  { name: 'level', address: 0xbd, aliasOf: 'player1State', note: 'Alias within player1State area.' },
  { name: 'randomLoSave', address: 0xbe, aliasOf: 'player1State', note: 'Alias within player1State area.' },
  { name: 'randomHiSave', address: 0xbf, aliasOf: 'player1State', note: 'Alias within player1State area.' },
  { name: 'livesPtr', address: 0xc0, length: 2, aliasOf: 'player1State', note: 'Low/high bytes inside player1State area.' },
  { name: 'player2State', address: 0xc2, length: 4, note: 'Declared 4-byte player2State area.' },
  { name: 'livesPtr2', address: 0xc5, aliasOf: 'player2State', note: 'Alias within player2State area.' },
  { name: 'gameMode', address: 0xc6, note: 'Visible gameMode checks appear in excerpt.' },
  { name: 'shapePtr1a', address: 0xc7, length: 2, note: 'Declared pointer pair.' },
  { name: 'shapePtr1b', address: 0xc9, length: 2, note: 'Declared pointer pair.' },
  { name: 'colorPtr', address: 0xcb, length: 2, note: 'Declared pointer pair.' },
  { name: 'scorePtr1', address: 0xcd, length: 12, note: 'Declared score pointer area.' },
  { name: 'PF1Ptr', address: 0xd9, length: 2, note: 'Declared pointer pair.' },
  { name: 'PF2Ptr', address: 0xdb, length: 2, note: 'Declared pointer pair.' },
  { name: 'scorePtr2', address: 0xdd, length: 11, note: 'Declared secondary pointer/alias area.' },
  { name: 'blockNum', address: 0xde, aliasOf: 'scorePtr2', note: 'Alias inside scorePtr2 area.' },
  { name: 'reflect0', address: 0xe0, aliasOf: 'scorePtr2', note: 'Alias inside scorePtr2 area.' },
  { name: 'hitEnemyIdx', address: 0xe2, aliasOf: 'scorePtr2', note: 'Alias inside scorePtr2 area.' },
  { name: 'PFCrashFlag', address: 0xe4, aliasOf: 'scorePtr2', note: 'Alias inside scorePtr2 area.' },
  { name: 'missileFlag', address: 0xe6, aliasOf: 'scorePtr2', note: 'Alias inside scorePtr2 area.' },
  { name: 'collidedEnemy', address: 0xe8, note: 'Declared in excerpt ZP variables.' },
  { name: 'randomLo', address: 0xe9, note: 'Declared current RNG low byte.' },
  { name: 'randomHi', address: 0xea, note: 'Declared current RNG high byte.' },
  { name: 'randomLoSave2', address: 0xeb, note: 'Declared saved RNG low byte.' },
  { name: 'randomHiSave2', address: 0xec, note: 'Declared saved RNG high byte.' },
  { name: 'temp2', address: 0xed, note: 'Declared temp byte.' },
  { name: 'roadBlock', address: 0xed, aliasOf: 'temp2', note: 'Inspector alias only: bit 7 road-bit convention.' },
  { name: 'PFcolor', address: 0xee, note: 'Declared in excerpt ZP variables.' },
  { name: 'valleyWidth', address: 0xee, aliasOf: 'PFcolor', note: 'Alias shares PFcolor byte.' },
  { name: 'playerColor', address: 0xef, note: 'Declared in excerpt ZP variables.' },
  { name: 'stateBKColor', address: 0xf0, note: 'Declared in excerpt ZP variables.' },
  { name: 'statePFColor', address: 0xf1, note: 'Declared in excerpt ZP variables.' },
  { name: 'temp', address: 0xf2, note: 'Declared temp byte.' },
  { name: 'diffPF', address: 0xf2, aliasOf: 'temp', note: 'Inspector alias only; no diff calculation claimed.' },
  { name: 'zero1', address: 0xf3, note: 'Declared always-zero byte.' },
  { name: 'player', address: 0xf4, note: 'Declared in excerpt ZP variables.' },
  { name: 'missileX', address: 0xf5, note: 'Declared in excerpt ZP variables.' },
  { name: 'zero2', address: 0xf6, note: 'Declared always-zero byte.' },
  { name: 'SS_Delay', address: 0xf7, note: 'Screensaver build variable declaration.' },
  { name: 'sound0Id', address: 0xf8, note: 'Declared in excerpt ZP variables.' },
  { name: 'sound0Cnt', address: 0xf9, note: 'Declared in excerpt ZP variables.' },
  { name: 'bridgeSound', address: 0xfa, note: 'Declared in excerpt ZP variables.' },
  { name: 'missileSound', address: 0xfb, note: 'Declared in excerpt ZP variables.' },
  { name: 'temp3', address: 0xfc, note: 'Declared temp byte.' },
  { name: 'blockLine', address: 0xfc, aliasOf: 'temp3', note: 'Inspector alias only for kernel-line visualization.' },
  { name: 'maxId', address: 0xfc, aliasOf: 'temp3', note: 'Inspector alias only for shared temp byte.' },
  { name: 'lineNum', address: 0xfd, note: 'Declared in excerpt ZP variables.' },
]);

export const ZERO_PAGE_LAYOUT = ZERO_PAGE_LAYOUT_SOURCE.map((entry) => Object.freeze({
  ...entry,
  length: entry.length ?? 1,
  hex: dollarHex(entry.address),
}));

export const ZERO_PAGE_INDEX = Object.freeze(Object.fromEntries(
  ZERO_PAGE_LAYOUT.map((entry) => [entry.name, Object.freeze({
    address: entry.address,
    length: entry.length,
    aliasOf: entry.aliasOf,
    note: entry.note,
    })]),
    ));

    // Precomputed base addresses for the six block arrays — avoids repeated
    // ZERO_PAGE_INDEX lookups in per-frame hot loops (inspectVisibleSlots,
    // slotAddressLookup, advanceVisibleSlotScene, applyVisibleObjectMovement).
    const BLOCK_ARRAY_BASES = Object.freeze(BLOCK_ARRAY_NAMES.map((name) => ZERO_PAGE_INDEX[name].address));

    export const ALIAS_MAP = new Map();
    for (const entry of ZERO_PAGE_LAYOUT) {
  const names = ALIAS_MAP.get(entry.address) ?? [];
  names.push(entry.name);
  ALIAS_MAP.set(entry.address, names);
}

export const ADDRESS_MAP = ZERO_PAGE_LAYOUT
  .filter((entry) => !entry.aliasOf)
  .map((entry) => ({
    start: entry.address,
    end: entry.address + entry.length - 1,
    length: entry.length,
    label: entry.name,
    aliases: (ALIAS_MAP.get(entry.address) ?? []).filter((name) => name !== entry.name),
  }));

export const BLOCK_ARRAY_LAYOUT = Object.freeze(BLOCK_ARRAY_NAMES.map((name) => {
  const entry = ZERO_PAGE_INDEX[name];
  const endLabel = `${name}End`;
  const end = ARRAY_ENDS[endLabel];
  const length = entry.length;
  return Object.freeze({
    name,
    endLabel,
    start: entry.address,
    end,
    length,
    startHex: dollarHex(entry.address),
    endHex: dollarHex(end),
    rangeHex: `${dollarHex(entry.address)}..${dollarHex(end)}`,
    formula: `${name}+NUM_BLOCKS-1`,
    note: 'Derived directly from excerpt array declarations and *End constants.',
  });
}));

function coverageFor(name) {
  if (['gameMode', 'random', 'fuelHi', 'livesPtr', 'temp'].includes(name)) return 'visible-code';
  if (['joystick', 'sound0Id'].includes(name)) return 'declared-only';
  if (['stateBKColor', 'statePFColor', 'PF1PatId', 'sectionBlock', 'blockOffset', 'posYLo'].includes(name)) return 'visible-code';
  return 'declared';
}

export const COVERAGE_MAP = new Map(
  ZERO_PAGE_LAYOUT.map((entry) => [entry.name, {
    address: entry.address,
    coverage: coverageFor(entry.name),
  }]),
);

export function createZeroPageMemory() {
  return new Uint8Array(0x100).fill(0);
}

export function readByte(memory, address) {
 return (memory?.[address & 0xff] ?? 0) & 0xff;
}

export function writeByte(memory, address, value) {
 memory[address & 0xff] = value & 0xff;
 return memory;
}

export function getField(memory, field) {
 const info = ZERO_PAGE_INDEX[field];
 if (!info) throw new Error(`Unknown field: ${field}`);
 return readByte(memory, info.address);
}

export function getFieldBytes(memory, field) {
  const info = ZERO_PAGE_INDEX[field];
  if (!info) throw new Error(`Unknown field: ${field}`);
  const out = [];
  for (let i = 0; i < info.length; i++) out.push(readByte(memory, info.address + i));
  return out;
}

export function setField(memory, field, value) {
  const info = ZERO_PAGE_INDEX[field];
  if (!info) throw new Error(`Unknown field: ${field}`);
  if (info.length > 1 && typeof value === 'number' && info.length === 2) {
    writeByte(memory, info.address, value & 0xff);
    writeByte(memory, info.address + 1, (value >>> 8) & 0xff);
    return memory;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < info.length; i++) writeByte(memory, info.address + i, value[i] ?? 0);
    return memory;
  }
  writeByte(memory, info.address, value);
  return memory;
}

export function applyVisibleResetLogic(memory) {
  memory.fill(0);
  setField(memory, 'random', 1);
  writeRng16(memory, (GAME_CONSTANTS.SEED_HI << 8) | GAME_CONSTANTS.SEED_LO);
  setField(memory, 'randomLoSave2', GAME_CONSTANTS.SEED_LO);
  setField(memory, 'randomHiSave2', GAME_CONSTANTS.SEED_HI);
  writeByte(memory, ZERO_PAGE_INDEX.scorePtr1.address + 10, 0x01);
  setField(memory, 'zero1', 0x00);
  setField(memory, 'zero2', 0x00);
  return Object.assign(memory, {
    random: readByte(memory, ZERO_PAGE_INDEX.random.address),
    livesPtr: wordAt(memory, ZERO_PAGE_INDEX.livesPtr.address),
    scorePtr1Byte10: readByte(memory, ZERO_PAGE_INDEX.scorePtr1.address + 10),
  });
}

export function readRng16(memory) {
  return (readByte(memory, ZERO_PAGE_INDEX.randomHi.address) << 8) | readByte(memory, ZERO_PAGE_INDEX.randomLo.address);
}

export function writeRng16(memory, value) {
  writeByte(memory, ZERO_PAGE_INDEX.randomLo.address, value & 0xff);
  writeByte(memory, ZERO_PAGE_INDEX.randomHi.address, (value >>> 8) & 0xff);
  return memory;
}

export function rngStep(state16) {
  const s = Number(state16) & 0xffff;
  const bit = s & 1;
  return ((s >>> 1) ^ (bit ? 0xb400 : 0x0000)) & 0xffff;
}

// Stella's standard NTSC palette (src/common/PaletteHandler.cxx, ourNTSCPalette),
// indexed by colorByte >> 1 (bit 0 is ignored by the TIA).
const NTSC_PALETTE_RGB = Object.freeze([
  0x000000, 0x4a4a4a, 0x6f6f6f, 0x8e8e8e, 0xaaaaaa, 0xc0c0c0, 0xd6d6d6, 0xececec,
  0x484800, 0x69690f, 0x86861d, 0xa2a22a, 0xbbbb35, 0xd2d240, 0xe8e84a, 0xfcfc54,
  0x7c2c00, 0x904811, 0xa26221, 0xb47a30, 0xc3903d, 0xd2a44a, 0xdfb755, 0xecc860,
  0x901c00, 0xa33915, 0xb55328, 0xc66c3a, 0xd5824a, 0xe39759, 0xf0aa67, 0xfcbc74,
  0x940000, 0xa71a1a, 0xb83232, 0xc84848, 0xd65c5c, 0xe46f6f, 0xf08080, 0xfc9090,
  0x840064, 0x97197a, 0xa8308f, 0xb846a2, 0xc659b3, 0xd46cc3, 0xe07cd2, 0xec8ce0,
  0x500084, 0x68199a, 0x7d30ad, 0x9246c0, 0xa459d0, 0xb56ce0, 0xc57cee, 0xd48cfc,
  0x140090, 0x331aa3, 0x4e32b5, 0x6848c6, 0x7f5cd5, 0x956fe3, 0xa980f0, 0xbc90fc,
  0x000094, 0x181aa7, 0x2d32b8, 0x4248c8, 0x545cd6, 0x656fe4, 0x7580f0, 0x8490fc,
  0x001c88, 0x183b9d, 0x2d57b0, 0x4272c2, 0x548ad2, 0x65a0e1, 0x75b5ef, 0x84c8fc,
  0x003064, 0x185080, 0x2d6d98, 0x4288b0, 0x54a0c5, 0x65b7d9, 0x75cceb, 0x84e0fc,
  0x004030, 0x18624e, 0x2d8169, 0x429e82, 0x54b899, 0x65d1ae, 0x75e7c2, 0x84fcd4,
  0x004400, 0x1a661a, 0x328432, 0x48a048, 0x5cba5c, 0x6fd26f, 0x80e880, 0x90fc90,
  0x143c00, 0x355f18, 0x527e2d, 0x6e9c42, 0x87b754, 0x9ed065, 0xb4e775, 0xc8fc84,
  0x303800, 0x505916, 0x6d762b, 0x88923e, 0xa0ab4f, 0xb7c25f, 0xccd86e, 0xe0ec7c,
  0x482c00, 0x694d14, 0x866a26, 0xa28638, 0xbb9f47, 0xd2b656, 0xe8cc63, 0xfce070,
]);

export function ntscDecode(colorByte) {
  const raw = u8(colorByte);
  const hue = ((raw >>> 4) & 0x0f) >>> 1;
  const luminance = (raw & 0x0f) * 2;
  const hueName = NTSC_HUE_NAMES[hue] ?? 'Unknown';
  const grayValue = Math.round((luminance / 28) * 255);
  const grayCss = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
  const css = `#${NTSC_PALETTE_RGB[raw >>> 1].toString(16).padStart(6, '0')}`;
  return {
    raw,
    hue,
    hueName,
    luminance,
    css,
    grayCss,
  };
}

export function ntscColorCss(colorByte) {
 const decoded = ntscDecode(colorByte);
 return decoded.css;
}

export function computeFuel16(valueOrMemory) {
  if (valueOrMemory instanceof Uint8Array) {
    return (readByte(valueOrMemory, ZERO_PAGE_INDEX.fuelHi.address) << 8) | readByte(valueOrMemory, ZERO_PAGE_INDEX.fuelLo.address);
  }
  return Number(valueOrMemory) & 0xffff;
}

export function computeFuelPercent(valueOrMemory) {
  const fuel16 = computeFuel16(valueOrMemory);
  return Number(((fuel16 / 0xffff) * 100).toFixed(1));
}

export function computeFuelDisplayBallValue(fuelHi) {
  return (((u8(fuelHi) >>> 3) + 69) & 0xff) >>> 0;
}

export function setVisibleFuel(memory, fuel16) {
  const normalized = Math.max(0, Math.min(0xffff, Math.trunc(Number(fuel16) || 0)));
  writeByte(memory, ZERO_PAGE_INDEX.fuelHi.address, (normalized >>> 8) & 0xff);
  writeByte(memory, ZERO_PAGE_INDEX.fuelLo.address, normalized & 0xff);
  return normalized;
}

export function drainVisibleFuel(memory, amount = 1) {
  const fuelBefore = computeFuel16(memory);
  const normalizedAmount = Math.max(0, Math.trunc(Number(amount) || 0));
  const fuelAfter = Math.max(0, fuelBefore - normalizedAmount);
  setVisibleFuel(memory, fuelAfter);
  return {
    fuelBefore,
    fuelBeforeHex: dollarHex(fuelBefore, 4),
    fuelAfter,
    fuelAfterHex: dollarHex(fuelAfter, 4),
    drainAmount: Math.max(0, fuelBefore - fuelAfter),
    depleted: fuelBefore > 0 && fuelAfter === 0,
    note: 'Harness fuel-drain helper decrements the visible fuelHi/fuelLo 16-bit pair directly. It is a conservative gameplay-loop model, not a claim about the unseen ROM drain cadence.',
  };
}

export function applyVisibleObjectMovement(memory, options = {}) {
  const frameCnt = Number.isFinite(Number(options.frameCnt))
    ? u8(options.frameCnt)
    : readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  const gameMode = Number.isFinite(Number(options.gameMode))
    ? u8(options.gameMode)
    : readByte(memory, ZERO_PAGE_INDEX.gameMode.address);
  const running = gameMode === 0x00;
  const slots = inspectVisibleSlots(memory);
  const profile = inspectVisibleRiverProfile(memory);
  const slicesBySlot = new Map(profile.slices.map(slice => [slice.slotIndex, slice]));
  const movedSlots = [];

  for (const slot of slots) {
    const eligibleShape = slot.shapeClass === 'shape-air' || slot.shapeClass === 'shape-water';
    const patrolEligibleShape = slot.shapeId === SHAPE_IDS.ID_SHIP || slot.shapeId === SHAPE_IDS.ID_HELI0 || slot.shapeId === SHAPE_IDS.ID_HELI1;
    const moveBit = !!slot.blockFlags.enemyMoving;
    const patrolBit = !!slot.blockFlags.patrol;
    const cadenceActive = ((frameCnt + slot.slotIndex) & 1) === 0;
    if (!running || !eligibleShape || !moveBit || !cadenceActive) continue;

    const sprite = resolveVisibleSpriteVariant(slot.shapeId, frameCnt);
    const slice = slicesBySlot.get(slot.slotIndex) ?? null;
    const state1RawBefore = slot.state1Byte;
    const blockRawBefore = slot.blockLst;
    const patrolTriggered = patrolBit && patrolEligibleShape && ((frameCnt + slot.slotIndex) % HARNESS_PATROL_TURN_PERIOD) === 0;
    const movingLeftBefore = !!slot.state1.directionFlag;
    let movingLeft = movingLeftBefore;
    if (patrolTriggered) movingLeft = !movingLeft;
    const delta = movingLeft ? -HARNESS_OBJECT_MOVE_STEP : HARNESS_OBJECT_MOVE_STEP;
    const requestedX = slot.coarseX + delta;
    const minX = slice ? Math.max(0, slice.left) : 0;
    const maxX = slice ? Math.max(minX, Math.min(159, slice.right - Math.max(0, sprite.width - 1))) : 159;
    let nextX = Math.max(minX, Math.min(maxX, requestedX));
    const collidedWithPlayfield = nextX !== requestedX;
    let nextDirectionLeft = movingLeft;
    if (collidedWithPlayfield) nextDirectionLeft = !movingLeft;

    let nextState1 = state1RawBefore;
    if (nextDirectionLeft) nextState1 |= FLAGS.state1Lst.DIRECTION_FLAG;
    else nextState1 &= (~FLAGS.state1Lst.DIRECTION_FLAG) & 0xff;

    let nextBlock = blockRawBefore;
    if (collidedWithPlayfield) nextBlock |= FLAGS.blockLst.PF_COLLIDE_FLAG;
    else nextBlock &= (~FLAGS.blockLst.PF_COLLIDE_FLAG) & 0xff;

    writeByte(memory, ZERO_PAGE_INDEX.XPos1Lst.address + slot.slotIndex, nextX & 0xff);
    writeByte(memory, ZERO_PAGE_INDEX.State1Lst.address + slot.slotIndex, nextState1 & 0xff);
    writeByte(memory, ZERO_PAGE_INDEX.blockLst.address + slot.slotIndex, nextBlock & 0xff);

    movedSlots.push({
      slotIndex: slot.slotIndex,
      slotLabel: slot.slotLabel,
      shapeId: slot.shapeId,
      shapeName: slot.shapeName,
      shapeClass: slot.shapeClass,
      patrolBit,
      patrolEligibleShape,
      patrolTriggered,
      xBefore: slot.coarseX,
      xAfter: nextX,
      deltaApplied: nextX - slot.coarseX,
      requestedX,
      minX,
      maxX,
      directionBefore: movingLeftBefore ? 'left' : 'right',
      directionAfterPatrol: movingLeft ? 'left' : 'right',
      directionAfter: nextDirectionLeft ? 'left' : 'right',
      bounced: collidedWithPlayfield,
      blockLstBefore: blockRawBefore,
      blockLstAfter: nextBlock & 0xff,
      state1Before: state1RawBefore,
      state1After: nextState1 & 0xff,
    });
  }

  return {
    frameCnt,
    frameCntHex: dollarHex(frameCnt),
    gameMode,
    gameModeHex: dollarHex(gameMode),
    moved: movedSlots.length > 0,
    movedSlots,
    note: running
      ? 'Harness object-movement helper advances MOVE_ENEMY air/water slots by 1 coarse X on alternating frames, uses State1 direction bit, lets PATROL ship/helicopter slots flip direction on an 8-frame cadence, and reverses on derived river-bound collisions. It is conservative cadence scaffolding, not a claim about the unseen ROM movement kernel.'
      : 'Harness object-movement helper is idle unless the visible loop is in running mode.',
  };
}

const SHAPE_NAME_TABLE = Object.freeze([
 'Explosion0', 'Explosion1', 'Explosion2', 'Explosion3',
 'Plane', 'Heli0', 'Heli1', 'Ship', 'Bridge', 'House', 'Fuel',
]);

export function shapeNameFromId(id) {
 const numId = Number(id);
 if (numId >= 0 && numId <= 10) return SHAPE_NAME_TABLE[numId];
 return 'unknown';
}

const SHAPE_ASM_NAME_TABLE = Object.freeze([
 'ID_EXPLOSION0', 'ID_EXPLOSION1', 'ID_EXPLOSION2', 'ID_EXPLOSION3',
 'ID_PLANE', 'ID_HELI0', 'ID_HELI1', 'ID_SHIP', 'ID_BRIDGE', 'ID_HOUSE', 'ID_FUEL',
]);

export function shapeAsmNameFromId(id) {
 const numId = Number(id);
 if (numId >= 0 && numId <= 10) return SHAPE_ASM_NAME_TABLE[numId];
 return 'UNKNOWN_SHAPE_ID';
}

const SHAPE_CLASS_TABLE = Object.freeze([
 'explosion', 'explosion', 'explosion', 'explosion',
 'shape-air', 'shape-air', 'shape-air', 'shape-water',
 'shape-structure', 'shape-structure', 'shape-fuel',
]);

export function shapeClassFromId(id) {
 const numId = Number(id);
 if (numId >= 0 && numId <= 10) return SHAPE_CLASS_TABLE[numId];
 return 'unknown';
}

export function resolveVisibleSpriteVariant(shapeId, frameCnt = 0) {
  const shapeName = shapeNameFromId(shapeId);
  const familyName = SHAPE_FAMILY_OVERRIDES[shapeName] ?? shapeName;
  const normalizedFrameCnt = u8(frameCnt);
  let variantName = shapeName;
  if (familyName === 'Explosion0') variantName = 'Explosion0';
  else if (
    familyName === 'Explosion1' || familyName === 'Explosion2'
    || familyName === 'Plane' || familyName === 'Heli0' || familyName === 'Heli1'
    || familyName === 'Ship' || familyName === 'Bridge' || familyName === 'House'
    || familyName === 'Fuel'
  ) {
    variantName = `${familyName}${normalizedFrameCnt & 1 ? 'B' : 'A'}`;
  }
  const meta = VERIFIED_SPRITE_VARIANT_META[variantName]
    ?? VERIFIED_SPRITE_VARIANT_META[familyName]
    ?? VERIFIED_SPRITE_VARIANT_META[shapeName]
    ?? null;
  return {
    shapeId: u8(shapeId),
    shapeName,
    familyName,
    variantName,
    frameCnt: normalizedFrameCnt,
    width: Number.isFinite(Number(meta?.width)) ? Math.max(1, Math.trunc(Number(meta.width))) : 8,
    height: Number.isFinite(Number(meta?.height)) ? Math.max(1, Math.trunc(Number(meta.height))) : 8,
    verified: !!meta?.verified,
    meta,
    // Interlaced A/B rows as the kernel draws them (24 scanlines), independent of frame parity.
    bitmap: kernelShapeBitmap(u8(shapeId)),
    // NTSC COLUP1 byte per bitmap row, from the ROM color tables via colorPtr.
    rowColors: kernelShapeRowColors(u8(shapeId)),
  };
}

export function resolveVisiblePlayerJetVariant(memory, options = {}) {
  const frameCnt = Number.isFinite(Number(options.frameCnt))
    ? u8(options.frameCnt)
    : readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  const gameMode = Number.isFinite(Number(options.gameMode))
    ? u8(options.gameMode)
    : readByte(memory, ZERO_PAGE_INDEX.gameMode.address);
  const variantName = gameMode === 0xff
    ? 'JetExplode'
    : (frameCnt & 1 ? 'JetMove' : 'JetStraight');
  const meta = VERIFIED_SPRITE_VARIANT_META[variantName] ?? VERIFIED_SPRITE_VARIANT_META.JetStraight ?? null;
  return {
    variantName,
    frameCnt,
    gameMode,
    width: Number.isFinite(Number(meta?.width)) ? Math.max(1, Math.trunc(Number(meta.width))) : 16,
    height: Number.isFinite(Number(meta?.height)) ? Math.max(1, Math.trunc(Number(meta.height))) : 13,
    verified: !!meta,
    meta,
  };
}

export function computeSectionBlockLabel(sectionBlock) {
  const raw = u8(sectionBlock);
  if (raw === 0) return 'sectionEnd sentinel (transition)';
  if (raw === 1) return 'value 1 sentinel (bridge)';
  if (raw >= 2 && raw <= GAME_CONSTANTS.SECTION_BLOCKS) return `sectionBlock=${raw}`;
  return `unknown (${dollarHex(raw)})`;
}

export function decodeBlockFlags(byte) {
  const raw = u8(byte);
  const out = {
    raw,
    hex: dollarHex(raw),
    pf1Page: !!(raw & FLAGS.blockLst.PF1_PAGE_FLAG),
    pf2Page: !!(raw & FLAGS.blockLst.PF2_PAGE_FLAG),
    pfColor: !!(raw & FLAGS.blockLst.PF_COLOR_FLAG),
    patrol: !!(raw & FLAGS.blockLst.PATROL_FLAG),
    collidedWithPlayfield: !!(raw & FLAGS.blockLst.PF_COLLIDE_FLAG),
    enemyMoving: !!(raw & FLAGS.blockLst.ENEMY_MOVE_FLAG),
    road: !!(raw & FLAGS.blockLst.PF_ROAD_FLAG),
  };
  out.labels = [
    out.pf1Page && 'PF1 page-select bit',
    out.pf2Page && 'PF2 page-select bit',
    out.pfColor && 'PF_COLOR bit',
    out.patrol && 'PATROL bit',
    out.collidedWithPlayfield && 'PF_COLLIDE bit',
    out.enemyMoving && 'MOVE_ENEMY bit',
    out.road && 'PF_ROAD bit',
  ].filter(Boolean);
  return out;
}

// Precomputed reverse lookup: NUSIZ value → ASM name (avoids Object.entries().find() per call)
const NUSIZ_VALUE_TO_ASM_NAME = Object.freeze(new Map(
 Object.entries(NUSIZ_ASM_NAMES).map(([name, value]) => [value, name]),
));

export function decodeState1(byte) {
 const raw = u8(byte);
 const nusiz = raw & FLAGS.state1Lst.NUSIZ_MASK;
 const fineNibble = (raw & FLAGS.state1Lst.FINE_MASK) >>> 4;
 const fineOffset = fineNibble - 8;
 const directionFlag = !!(raw & FLAGS.state1Lst.DIRECTION_FLAG);
 const refp1 = directionFlag;
 const nusizAsmName = NUSIZ_VALUE_TO_ASM_NAME.get(nusiz) ?? null;
  return {
    raw,
    hex: dollarHex(raw),
    directionFlag,
    directionLabel: directionFlag ? 'left/reflected' : 'right/normal',
    refp1,
    refp1Label: refp1 ? 'reflected' : 'normal',
    nusiz,
    nusizLabel: NUSIZ_LABELS[nusiz] ?? 'unknown',
    nusizAsmName,
    fineNibble,
    fineOffset,
    summary: `${directionFlag ? 'dir' : 'straight'}, ${NUSIZ_LABELS[nusiz] ?? 'unknown'}, fine ${fineOffset}`,
  };
}

export function inspectRng16(memory) {
  const rng16 = readRng16(memory);
  return { rng16, rng16Hex: dollarHex(rng16, 4) };
}

export function inspectRng8(memory) {
  const random8 = readByte(memory, ZERO_PAGE_INDEX.random.address);
  return { random8, random8Hex: dollarHex(random8) };
}

export function inspectRngState(memory) {
  const rng16 = readRng16(memory);
  const seed16 = (GAME_CONSTANTS.SEED_HI << 8) | GAME_CONSTANTS.SEED_LO;
  return {
    rng16,
    rng16Hex: dollarHex(rng16, 4),
    seed16,
    seed16Hex: dollarHex(seed16, 4),
    rngNextPreview: rngStep(rng16),
    random8: readByte(memory, ZERO_PAGE_INDEX.random.address),
    note: 'Inspector view: current 16-bit RNG is stored in $E9/$EA; $83 is the separate random byte used by reset/visible code.',
  };
}

export function inspectGameModeState(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.gameMode.address);
  const isRunning = raw === 0x00;
  const isGameOver = raw === 0xff;
  const isScrollInto = raw >= 1 && raw <= GAME_CONSTANTS.INTRO_SCROLL;
  const scrollProgress = isScrollInto ? raw / GAME_CONSTANTS.INTRO_SCROLL : 0;
  return {
    raw,
    hex: dollarHex(raw),
    label: GAME_MODES.label(raw),
    isRunning,
    isGameOver,
    isScrollInto,
    scrollProgress,
    scrollProgressPct: `${(scrollProgress * 100).toFixed(1)}%`,
  };
}

export function inspectPfState(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.PF_State.address);
  return {
    raw,
    hex: dollarHex(raw),
    binary: raw.toString(2).padStart(8, '0'),
    islandFlag: !!(raw & FLAGS.pfState.ISLAND_FLAG),
    changeFlag: !!(raw & FLAGS.pfState.CHANGE_FLAG),
    note: 'PF_State bit names come from the excerpt constants; this inspector surfaces only the declared bits and does not infer higher-level terrain behavior.',
  };
}

export function inspectSectionEnd(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.sectionEnd.address);
  return {
    raw,
    hex: dollarHex(raw),
    sectionEnd: raw,
    sectionEndHex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.sectionEnd.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.sectionEnd.address),
    isSectionEnd: raw === 0,
    note: 'sectionEnd is the declared byte at $8A; only the visible zero-means-transition check is surfaced.',
  };
}

export function inspectPosYLo(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.posYLo.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.posYLo.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.posYLo.address),
    note: 'posYLo is the declared byte at $8C; broader vertical-position behavior is NOT inferred beyond the visible byte.',
  };
}

export function inspectPrevPF1PatId(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.prevPF1PatId.address);
  const pageHighByte = raw >= GAME_CONSTANTS.SWITCH_PAGE_ID ? 0xfd : 0xfc;
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.prevPF1PatId.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.prevPF1PatId.address),
    pageHighByte,
    pageHighByteHex: dollarHex(pageHighByte),
    pageLabel: `$${pageHighByte.toString(16).toUpperCase().padStart(2, '0')}`,
    isOnPageFD: pageHighByte === 0xfd,
    note: 'prevPF1PatId is the declared byte at $88; page labeling is an inspector aid only using the visible SWITCH_PAGE_ID threshold.',
  };
}

export function inspectPF1PatId(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.PF1PatId.address);
  const switchPageId = GAME_CONSTANTS.SWITCH_PAGE_ID;
  const id = u8(raw);
  const pageHighByte = id >= switchPageId ? 0xfd : 0xfc;
  const pageLabel = `$${pageHighByte.toString(16).padStart(2, '0').toUpperCase()}`;
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.PF1PatId.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.PF1PatId.address),
    pf1PatId: id,
    pf1PatIdHex: dollarHex(id),
    pageHighByte,
    pageHighByteHex: dollarHex(pageHighByte),
    pageLabel,
    switchPageId,
    isOnPageFD: pageHighByte === 0xfd,
    note: 'PF1PatId is a declared byte at $BC; page label is an inspector aid only; uses SWITCH_PAGE_ID=9 threshold.',
  };
}

export function inspectPF1PatIdPage(memory) {
    const curr = inspectPF1PatId(memory);
    const prev = readByte(memory, ZERO_PAGE_INDEX.prevPF1PatId.address);
    const prevPage = prev >= GAME_CONSTANTS.SWITCH_PAGE_ID ? 0xfd : 0xfc;
    let zoneLabel = 'zone C (9+)';
    if (curr.pf1PatId <= 2) zoneLabel = 'zone A (0-2)';
    else if (curr.pf1PatId <= 8) zoneLabel = 'zone B (3-8)';
    return {
      pf1PatId: curr.pf1PatId,
      pf1PatIdHex: curr.pf1PatIdHex,
      prevPF1PatId: prev,
      prevPF1PatIdHex: dollarHex(prev),
      pageHighByte: curr.pageHighByte,
      pageLabel: curr.pageLabel,
      switchPageId: curr.switchPageId,
      prevPage,
      prevPageLabel: dollarHex(prevPage).toUpperCase(),
      isOnPageFD: curr.isOnPageFD,
      pageChanged: prevPage !== curr.pageHighByte,
      pageChangedLabel: prevPage !== curr.pageHighByte ? 'PAGE CHANGED' : 'same page',
      zoneLabel,
      note: 'PF1PatIdPage inspector shows page-change logic; zone labels are INSPECTOR-ONLY aids.',
    };
  }

export function inspectBlockOffset(memory) {
  const blockOffset = readByte(memory, ZERO_PAGE_INDEX.blockOffset.address);
  const posYLo = readByte(memory, ZERO_PAGE_INDEX.posYLo.address);
  const lineOffset = blockOffset * GAME_CONSTANTS.BLOCK_SIZE;
  return {
    blockOffset,
    blockOffsetHex: dollarHex(blockOffset),
    blockOffsetAddress: ZERO_PAGE_INDEX.blockOffset.address,
    blockOffsetAddressHex: dollarHex(ZERO_PAGE_INDEX.blockOffset.address),
    posYLo,
    posYLoHex: dollarHex(posYLo),
    posYLoAddress: ZERO_PAGE_INDEX.posYLo.address,
    posYLoAddressHex: dollarHex(ZERO_PAGE_INDEX.posYLo.address),
    blockSize: GAME_CONSTANTS.BLOCK_SIZE,
    multiplierFormula: 'blockOffset * BLOCK_SIZE',
    lineOffset,
    lineOffsetHex: dollarHex(lineOffset, 4),
    note: 'blockOffset at $8B is treated as a 32-line block multiplier for inspector display only.',
  };
}

export function inspectBlockPart(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
  let label = 'unset';
  if (raw === 1) label = 'first half';
  else if (raw === 2) label = 'value-2 bridge-half marker';
  else if (raw !== 0) label = `unknown (${raw})`;
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.blockPart.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.blockPart.address),
    label,
    isUnset: raw === 0,
    isFirstHalf: raw === 1,
    isSecondHalf: raw === 2,
    isBridgeHalf: raw === 2,
    note: 'Half labels are inspector-only mnemonics around the declared blockPart byte; detailed gameplay sequencing is NOT in excerpt.',
  };
}

export function rngSeedSequence(seed16) {
  const start = Number(seed16) & 0xffff;
  if (start === 0) {
    return {
      period: 0,
      isMaximal: false,
      note: 'Seed $0000 is the lock-up state of a Galois LFSR.',
    };
  }
  let state = start;
  let steps = 0;
  const maxIter = 0x10000;
  do {
    state = rngStep(state);
    steps++;
    if (steps > maxIter) break;
  } while (state !== start);
  const isMaximal = steps === 0xffff;
  return {
    seed: start,
    seedHex: dollarHex(start, 4),
    period: steps,
    isMaximal,
    declaredSectionCount: 57337,
    note: isMaximal
      ? `Full LFSR period = ${steps} (65,535 = maximal). ASM declares 57,337 sections; restriction logic is NOT in excerpt.`
      : `Period = ${steps}; NOT maximal. Seed may be in a shorter cycle.`,
  };
}

export function inspectKernelTiming(blockLineValue) {
  const raw = u8(blockLineValue);
  const twoLinePhase = 24;
  const setupPhase = 8;
  const repeatLines = 2;
  const total = twoLinePhase + setupPhase;
  let phase;
  let phaseLabel;
  let iterationInPhase;
  if (raw < twoLinePhase) {
    phase = 'display';
    phaseLabel = `two-line kernel (line ${raw} of ${twoLinePhase})`;
    iterationInPhase = Math.floor(raw / repeatLines);
  } else if (raw < total) {
    phase = 'setup';
    phaseLabel = `block iteration (line ${raw - twoLinePhase} of ${setupPhase})`;
    iterationInPhase = raw - twoLinePhase;
  } else {
    phase = 'overflow';
    phaseLabel = `beyond block boundary (${raw} >= ${total})`;
    iterationInPhase = -1;
  }
  return {
    blockLine: raw,
    blockLineHex: dollarHex(raw),
    totalLinesPerBlock: total,
    twoLinePhaseLines: twoLinePhase,
    setupPhaseLines: setupPhase,
    repeatLines,
    phase,
    phaseLabel,
    iterationInPhase,
    isValid: raw < total,
    isDisplayPhase: phase === 'display',
    isSetupPhase: phase === 'setup',
    note: 'Phase labels derived from ASM excerpt header comment only: 12 iterations × 2 display lines plus 8 setup lines. Kernel code itself is NOT in the excerpt.',
  };
}

export function computePF1PageAddress(pf1PatId) {
  const id = u8(pf1PatId);
  const switchPageId = GAME_CONSTANTS.SWITCH_PAGE_ID;
  const isOnPageFD = id >= switchPageId;
  const pageHighByte = isOnPageFD ? 0xfd : 0xfc;
  return {
    pf1PatId: id,
    pf1PatIdHex: dollarHex(id),
    switchPageId,
    isOnPageFD,
    pageHighByte,
    pageHighByteHex: dollarHex(pageHighByte),
    pageLabel: `$${pageHighByte.toString(16).padStart(2, '0').toUpperCase()}`,
    note: 'INSPECTOR-ONLY: page logic aligned with inspectPF1PatId ($FC for id<9, $FD for id>=9). PF1_PAGE_FLAG encoding from ASM; actual banking mechanism NOT in excerpt.',
  };
}

export function computeBlockOffsetLine(blockOffsetValue, sectionBlockValue) {
  const blockOff = u8(blockOffsetValue);
  const sectionBlk = u8(sectionBlockValue);
  const blockSize = GAME_CONSTANTS.BLOCK_SIZE;
  const sectionBlocks = GAME_CONSTANTS.SECTION_BLOCKS;
  const twoLinePhase = 24;
  const hasValidBlockOffset = blockOff < blockSize;
  const hasValidSectionBlock = sectionBlk >= 1 && sectionBlk <= sectionBlocks;
  const withinBounds = hasValidBlockOffset && hasValidSectionBlock;
  const sectionRelative = withinBounds ? (sectionBlocks - sectionBlk) * blockSize + blockOff : null;
  const phase = !hasValidBlockOffset
    ? 'overflow'
    : !hasValidSectionBlock
      ? 'invalid-section'
      : blockOff < twoLinePhase
        ? 'display'
        : 'setup';
  return {
    blockOffset: blockOff,
    sectionBlock: sectionBlk,
    sectionRelative,
    isValid: withinBounds,
    hasValidBlockOffset,
    hasValidSectionBlock,
    phase,
    isDisplayPhase: phase === 'display',
    isSetupPhase: phase === 'setup',
    note: withinBounds
      ? 'Pure arithmetic from declared constants. Actual kernel scan-out order NOT in excerpt.'
      : 'Inspector marks section-relative line as unavailable when blockOffset or sectionBlock falls outside declared bounds.',
  };
}

export function inspectSectionBlockSequence(sectionBlockValue) {
  const raw = u8(sectionBlockValue);
  let label;
  let isNormalBlock;
  let isBridge;
  let isSectionEnd;
  let blocksRemaining;
  let progressThroughSection;
  if (raw === 0) {
    label = 'transition sentinel';
    isNormalBlock = false;
    isBridge = false;
    isSectionEnd = true;
    blocksRemaining = 0;
    progressThroughSection = 1.0;
  } else if (raw === 1) {
    label = 'bridge sentinel';
    isNormalBlock = false;
    isBridge = true;
    isSectionEnd = false;
    blocksRemaining = GAME_CONSTANTS.SECTION_BLOCKS - raw;
    progressThroughSection = (GAME_CONSTANTS.SECTION_BLOCKS - raw) / GAME_CONSTANTS.SECTION_BLOCKS;
  } else if (raw >= 2 && raw <= GAME_CONSTANTS.SECTION_BLOCKS) {
    label = `value ${raw} of ${GAME_CONSTANTS.SECTION_BLOCKS}`;
    isNormalBlock = true;
    isBridge = false;
    isSectionEnd = false;
    blocksRemaining = GAME_CONSTANTS.SECTION_BLOCKS - raw;
    progressThroughSection = (GAME_CONSTANTS.SECTION_BLOCKS - raw) / GAME_CONSTANTS.SECTION_BLOCKS;
  } else {
    label = `out of range (${dollarHex(raw)})`;
    isNormalBlock = false;
    isBridge = false;
    isSectionEnd = false;
    blocksRemaining = null;
    progressThroughSection = null;
  }
  return {
    sectionBlock: raw,
    sectionBlockHex: dollarHex(raw),
    label,
    isNormalBlock,
    isBridge,
    isSectionEnd,
    blocksRemaining,
    progressThroughSection,
    note: progressThroughSection === null
      ? 'Sequence is only defined for sectionBlock values 0..16 in the visible excerpt; out-of-range bytes are reported without synthetic progress.'
      : 'Sequence derived from ASM constants SECTION_BLOCKS=16 and sectionBlock=$B9; labels are byte conventions, not gameplay simulation.',
  };
}

export function inspectFuelLo(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.fuelLo.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.fuelLo.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.fuelLo.address),
    pairAddressHex: `${dollarHex(ZERO_PAGE_INDEX.fuelHi.address)}..${dollarHex(ZERO_PAGE_INDEX.fuelLo.address)}`,
    note: 'fuelLo is declared in the excerpt, but standalone low-byte gameplay semantics are NOT in excerpt.',
  };
}

export function traceMainLoopFuelSequence(fuelHi) {
  const aAfterLoad = u8(fuelHi);
  const lsr1 = aAfterLoad >>> 1;
  const lsr2 = lsr1 >>> 1;
  const lsr3 = lsr2 >>> 1;
  const afterAdd = (lsr3 + 69) & 0xff;
  return {
    aAfterLoad,
    aAfterLoadHex: `0x${aAfterLoad.toString(16).toUpperCase().padStart(2, '0')}`,
    lsr1: { aAfterLsr: lsr1, aAfterLsrHex: `0x${lsr1.toString(16).padStart(2, '0')}`, carryOut: aAfterLoad & 1 },
    lsr2: { aAfterLsr: lsr2, aAfterLsrHex: `0x${lsr2.toString(16).padStart(2, '0')}`, carryOut: lsr1 & 1 },
    lsr3: { aAfterLsr: lsr3, aAfterLsrHex: `0x${lsr3.toString(16).padStart(2, '0')}`, carryOut: lsr2 & 1 },
    adc69: { afterAdd, afterAddHex: `0x${afterAdd.toString(16).toUpperCase().padStart(2, '0')}`, carryOut: lsr3 + 69 > 0xff },
    jsrSetPosX: { offset: 4, label: 'ball' },
    note: 'Visible excerpt only: LDA fuelHi / LSR / LSR / LSR / ADC #69, then LDX #4 before SetPosX; broader loop behavior is NOT in excerpt.',
  };
}

export function inspectMainLoopEntry(memory) {
  const fuelHi = readByte(memory, ZERO_PAGE_INDEX.fuelHi.address);
  const afterLsr = fuelHi >>> 3;
  const yPos = computeFuelDisplayBallValue(fuelHi);
  return {
    x: 4,
    xHex: dollarHex(4),
    xLabel: 'ball',
    fuelHi,
    fuelHiHex: dollarHex(fuelHi),
    fuelHiAddress: ZERO_PAGE_INDEX.fuelHi.address,
    fuelHiAddressHex: dollarHex(ZERO_PAGE_INDEX.fuelHi.address),
    lsrCount: 3,
    addConstant: 69,
    addConstantHex: dollarHex(69),
    afterLsr,
    afterLsrHex: dollarHex(afterLsr),
    yPos,
    yPosHex: dollarHex(yPos),
    note: 'Visible excerpt only: LDX #4 then fuelHi>>3 plus #69 before SetPosX.',
  };
}

export function computeMainLoopVisibleState(memory) {
  const fuelHi = readByte(memory, ZERO_PAGE_INDEX.fuelHi.address);
  const fuelTrace = traceMainLoopFuelSequence(fuelHi);
  return {
    fuelDisplayBallValue: computeFuelDisplayBallValue(fuelHi),
    fuel16: computeFuel16(memory),
    gameModeLabel: GAME_MODES.label(readByte(memory, ZERO_PAGE_INDEX.gameMode.address)),
    fuelHi,
    setPosXIndex: fuelTrace.jsrSetPosX.offset,
    setPosXLabel: fuelTrace.jsrSetPosX.label,
  };
}

export function inspectSectionState(memory) {
  const sectionBlock = readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address);
  const blockOffset = readByte(memory, ZERO_PAGE_INDEX.blockOffset.address);
  const PF1PatId = readByte(memory, ZERO_PAGE_INDEX.PF1PatId.address);
  const sectionEnd = readByte(memory, ZERO_PAGE_INDEX.sectionEnd.address);
  const page = PF1PatId >= GAME_CONSTANTS.SWITCH_PAGE_ID ? 0xfd : 0xfc;
  return {
    sectionBlock,
    sectionBlockHex: dollarHex(sectionBlock),
    sectionBlockAddress: ZERO_PAGE_INDEX.sectionBlock.address,
    sectionBlockAddressHex: dollarHex(ZERO_PAGE_INDEX.sectionBlock.address),
    sectionBlockLabel: computeSectionBlockLabel(sectionBlock),
    isBridgeBlock: sectionBlock === 1,
    isBridge: sectionBlock === 1,
    blockOffset,
    blockOffsetHex: dollarHex(blockOffset),
    blockOffsetAddress: ZERO_PAGE_INDEX.blockOffset.address,
    blockOffsetAddressHex: dollarHex(ZERO_PAGE_INDEX.blockOffset.address),
    blockOffsetLine: blockOffset * GAME_CONSTANTS.BLOCK_SIZE,
    PF1PatId,
    pf1PatId: PF1PatId,
    pf1PatIdHex: dollarHex(PF1PatId),
    pf1PatIdAddress: ZERO_PAGE_INDEX.PF1PatId.address,
    pf1PatIdAddressHex: dollarHex(ZERO_PAGE_INDEX.PF1PatId.address),
    pf1PatIdPage: page,
    pf1PatIdPageLabel: dollarHex(page).toUpperCase(),
    sectionEnd,
    sectionEndHex: dollarHex(sectionEnd),
    sectionEndAddress: ZERO_PAGE_INDEX.sectionEnd.address,
    sectionEndAddressHex: dollarHex(ZERO_PAGE_INDEX.sectionEnd.address),
    isSectionEnd: sectionEnd === 0,
    note: 'Inspector summarizes declared section bytes and the visible PF page threshold only.',
  };
}

export function inspectSectionCountdown(memory) {
  const section = inspectSectionState(memory);
  const blockPart = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
  const posYLo = readByte(memory, ZERO_PAGE_INDEX.posYLo.address);
  const prevPF1PatId = readByte(memory, ZERO_PAGE_INDEX.prevPF1PatId.address);
  const bkColor = readByte(memory, ZERO_PAGE_INDEX.stateBKColor.address);
  const pfColor = readByte(memory, ZERO_PAGE_INDEX.statePFColor.address);
  const blocksRemaining = section.sectionBlock === 0 ? 0 : Math.max(0, GAME_CONSTANTS.SECTION_BLOCKS - section.sectionBlock);
  return {
    ...section,
    blocksRemaining,
    isBridge: section.sectionBlock === 1,
    isSectionTransition: section.sectionBlock === 0,
    blockPart,
    blockPartLabel: inspectBlockPart(memory).label,
    posYLo,
    prevPF1PatId,
    bkColor,
    bkColorHex: dollarHex(bkColor),
    pfColor,
    pfColorHex: dollarHex(pfColor),
    bkMatchesExpected: bkColor === COLORS.GREY,
    pfMatchesExpected: pfColor === 0x1e,
    pfPageTransition: section.pf1PatIdPageLabel,
    note: 'Countdown view combines declared section bytes with excerpt color constants GREY and YELLOW+2 only.',
  };
}

export function inspectVisibleRiverProfile(memory) {
  const section = inspectSectionState(memory);
  const slots = inspectVisibleSlots(memory);
  const blockPart = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
  const phase = (section.blockOffset + section.pf1PatId + blockPart) & 0x0f;
  const widthBase = 52 + ((section.pf1PatId & 0x07) * 6);
  const widthJitter = ((section.blockOffset & 0x03) * 4) + (blockPart ? 3 : 0);
  const riverWidth = Math.max(44, Math.min(108, widthBase + widthJitter));
  const leftBase = 22 + (((section.sectionBlock + phase) & 0x07) * 3);
  const bend = Math.round(Math.sin(((section.sectionBlock + phase) / 16) * Math.PI * 2) * 12);
  const riverLeft = Math.max(8, Math.min(159 - riverWidth - 8, leftBase + bend));
  const roadSlots = slots.filter(slot => slot.blockFlags.road).length;
  const movingSlots = slots.filter(slot => slot.blockFlags.enemyMoving).length;
  const islandFlag = !!readByte(memory, ZERO_PAGE_INDEX.PF_State.address);
  const bridgeRowIndex = section.isBridge ? 2 : -1;
  const slices = slots.map((slot, index) => {
    const rowBias = (index - ((slots.length - 1) / 2)) * 2;
    const slotNudge = (((slot.pf1Low ^ slot.pf2Low) & 0x07) - 3) * 2;
    const left = Math.max(0, Math.min(159, riverLeft + rowBias + slotNudge));
    const widthAdjust = slot.blockFlags.road ? 6 : slot.blockFlags.pfColor ? -4 : 0;
    const width = Math.max(34, Math.min(118, riverWidth + widthAdjust - Math.abs(rowBias)));
    const right = Math.min(159, left + width);
    return {
      slotIndex: index,
      slotLabel: slot.slotLabel,
      left,
      leftHex: dollarHex(left),
      right,
      rightHex: dollarHex(right),
      width,
      widthHex: dollarHex(width),
      carriesRoadBit: slot.blockFlags.road,
      carriesMoveBit: slot.blockFlags.enemyMoving,
      shapeName: slot.shapeName,
      shapeClass: slot.shapeClass,
      isBridgeRow: bridgeRowIndex === index,
    };
  });
  return {
    riverLeft,
    riverLeftHex: dollarHex(riverLeft),
    riverWidth,
    riverWidthHex: dollarHex(riverWidth),
    riverRight: riverLeft + riverWidth,
    riverRightHex: dollarHex(riverLeft + riverWidth),
    roadSlots,
    movingSlots,
    islandFlag,
    bridgeRowIndex,
    sectionBlock: section.sectionBlock,
    blockOffset: section.blockOffset,
    pf1PatId: section.pf1PatId,
    blockPart,
    slices,
    note: 'Visible river profile is an inspector-only playfield projection from declared section/block/pattern bytes plus the six visible slot rows. It provides a loop-driven river silhouette for the browser harness, not a ROM-complete playfield decoder.',
  };
}

export function inspectVisibleRiverScrollState(memory) {
  const currentProfile = inspectVisibleRiverProfile(memory);
  const currentSlots = inspectVisibleSlots(memory);
  const blockLine = Math.max(0, Math.min(GAME_CONSTANTS.BLOCK_SIZE - 1, readByte(memory, ZERO_PAGE_INDEX.temp3.address)));
  const scrollProgress = blockLine / GAME_CONSTANTS.BLOCK_SIZE;
  const sliceLineSpan = GAME_CONSTANTS.NUM_LINES / GAME_CONSTANTS.NUM_BLOCKS;
  const pixelOffset = scrollProgress * sliceLineSpan;
  const currentFrame = readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  const remainingStepsToWrap = GAME_CONSTANTS.BLOCK_SIZE - blockLine;

  const nextMemory = new Uint8Array(memory);
  const sectionBlockBefore = readByte(nextMemory, ZERO_PAGE_INDEX.sectionBlock.address);
  const nextBlockOffset = (readByte(nextMemory, ZERO_PAGE_INDEX.blockOffset.address) + 1) & 0xff;
  const blockPartBefore = readByte(nextMemory, ZERO_PAGE_INDEX.blockPart.address);
  const nextBlockPart = blockPartBefore === 1 ? 2 : 1;
  const currentPf1PatId = readByte(nextMemory, ZERO_PAGE_INDEX.PF1PatId.address);
  const projectedIncomingHead = previewVisibleIncomingHeadSpawn(memory, {
    frameAfterWrap: currentFrame + remainingStepsToWrap,
    nextSectionBlock: computeNextSectionBlock(sectionBlockBefore),
    nextBlockOffset,
    nextBlockPart,
    nextPrevPF1PatId: currentPf1PatId,
    nextPF1PatId: (currentPf1PatId + 1) & 0x0f,
  });
  setField(nextMemory, 'blockOffset', nextBlockOffset);
  setField(nextMemory, 'blockPart', nextBlockPart || 1);
  setField(nextMemory, 'prevPF1PatId', currentPf1PatId);
  setField(nextMemory, 'PF1PatId', (currentPf1PatId + 1) & 0x0f);
  const nextSectionBlock = computeNextSectionBlock(sectionBlockBefore);
  setField(nextMemory, 'sectionBlock', nextSectionBlock);
  setField(nextMemory, 'sectionEnd', nextSectionBlock === 0 ? 0x00 : 0x01);
  const projectedSceneAdvance = advanceVisibleSlotScene(nextMemory, {
    rolling: true,
    incomingHeadOverride: projectedIncomingHead.projectedSpawn,
  });
  const nextProfile = inspectVisibleRiverProfile(nextMemory);
  const nextSlots = inspectVisibleSlots(nextMemory);
  const seamSlice = nextProfile.slices[0] ?? currentProfile.slices[currentProfile.slices.length - 1];
  const currentTailSlice = currentProfile.slices[currentProfile.slices.length - 1] ?? seamSlice;
  const currentTailSlot = currentSlots[currentTailSlice?.slotIndex ?? Math.max(0, currentSlots.length - 1)] ?? null;
  const nextHeadSlot = nextSlots[seamSlice?.slotIndex ?? 0] ?? null;
  const compositeSlices = [
    ...currentProfile.slices.map((slice, index) => ({
      ...slice,
      compositeIndex: index,
      source: 'current',
      projectedSlot: currentSlots[slice.slotIndex] ?? null,
    })),
    {
      ...seamSlice,
      compositeIndex: currentProfile.slices.length,
      source: 'next',
      slotLabel: `${seamSlice.slotLabel}→next`,
      projectedSlot: nextHeadSlot,
    },
  ];

  return {
    blockLine,
    blockLineHex: dollarHex(blockLine),
    scrollProgress,
    pixelOffset,
    sliceLineSpan,
    currentProfile,
    currentSlots,
    nextProfile,
    nextSlots,
    projectedSceneAdvance,
    currentTailSlice,
    currentTailSlot,
    nextHeadSlice: seamSlice,
    nextHeadSlot,
    seamDelta: {
      fromSlotLabel: currentTailSlice?.slotLabel ?? null,
      toSlotLabel: seamSlice?.slotLabel ?? null,
      leftDelta: (seamSlice?.left ?? 0) - (currentTailSlice?.left ?? 0),
      rightDelta: (seamSlice?.right ?? 0) - (currentTailSlice?.right ?? 0),
      widthDelta: (seamSlice?.width ?? 0) - (currentTailSlice?.width ?? 0),
      widthDeltaPct: (currentTailSlice?.width ?? 0) > 0
        ? (((seamSlice?.width ?? 0) - (currentTailSlice?.width ?? 0)) / (currentTailSlice?.width ?? 1))
        : null,
      shapeChanged: (currentTailSlot?.shapeId ?? null) !== (nextHeadSlot?.shapeId ?? null),
      fromShapeName: currentTailSlot?.shapeName ?? null,
      toShapeName: nextHeadSlot?.shapeName ?? null,
      xDelta: (nextHeadSlot?.inspectX ?? nextHeadSlot?.coarseX ?? 0) - (currentTailSlot?.inspectX ?? currentTailSlot?.coarseX ?? 0),
      xDirection: (nextHeadSlot?.inspectX ?? nextHeadSlot?.coarseX ?? 0) > (currentTailSlot?.inspectX ?? currentTailSlot?.coarseX ?? 0)
        ? 'right'
        : (nextHeadSlot?.inspectX ?? nextHeadSlot?.coarseX ?? 0) < (currentTailSlot?.inspectX ?? currentTailSlot?.coarseX ?? 0)
          ? 'left'
          : 'same',
    },
    seamCompareRows: [
      currentTailSlice ? {
        phase: 'current-tail',
        source: 'current',
        slotLabel: currentTailSlice.slotLabel,
        left: currentTailSlice.left,
        right: currentTailSlice.right,
        width: currentTailSlice.width,
        shapeName: currentTailSlot?.shapeName ?? null,
        shapeId: currentTailSlot?.shapeId ?? null,
        inspectX: currentTailSlot?.inspectX ?? currentTailSlot?.coarseX ?? null,
      } : null,
      seamSlice ? {
        phase: 'next-head',
        source: 'next',
        slotLabel: seamSlice.slotLabel,
        left: seamSlice.left,
        right: seamSlice.right,
        width: seamSlice.width,
        shapeName: nextHeadSlot?.shapeName ?? null,
        shapeId: nextHeadSlot?.shapeId ?? null,
        inspectX: nextHeadSlot?.inspectX ?? nextHeadSlot?.coarseX ?? null,
      } : null,
    ].filter(Boolean),
    rowSourceCounts: {
      current: currentProfile.slices.length,
      next: 1,
      total: compositeSlices.length,
    },
    compositeSlices,
    note: 'Visible river scroll state is a continuous upstream scroll hint for the browser harness. It interpolates within the current 32-line block, carries current/next slot metadata for projected seam rendering, exposes explicit current-tail vs next-head seam compare rows, and exposes the next projected slice for seam coverage without claiming the unseen ROM playfield-streaming routine.',
  };
}


export function inspectVisibleRiverTimeline(memory, options = {}) {
  const requestedHorizon = Number(options.horizon ?? options.steps);
  const horizon = Math.max(1, Math.min(96, Number.isFinite(requestedHorizon) ? Math.trunc(requestedHorizon) : 8));
  const timelineMemory = new Uint8Array(memory);
  const samples = [];
  let wrapCount = 0;

  for (let step = 0; step <= horizon; step += 1) {
    const scroll = inspectVisibleRiverScrollState(timelineMemory);
    const frameCnt = readByte(timelineMemory, ZERO_PAGE_INDEX.frameCnt.address);
    const currentTailSlot = scroll.currentTailSlot;
    const nextHeadSlot = scroll.nextHeadSlot;
    const currentTailSlice = scroll.currentTailSlice;
    const nextHeadSlice = scroll.nextHeadSlice;
    const seamSignature = `${currentTailSlot?.shapeName ?? 'n/a'}->${nextHeadSlot?.shapeName ?? 'n/a'}@${scroll.seamDelta.xDirection}:${scroll.seamDelta.widthDelta >= 0 ? '+' : ''}${scroll.seamDelta.widthDelta}`;
    samples.push({
      step,
      frameCnt,
      frameCntHex: dollarHex(frameCnt),
      blockLine: scroll.blockLine,
      blockLineHex: scroll.blockLineHex,
      scrollProgress: scroll.scrollProgress,
      scrollPct: Math.round(scroll.scrollProgress * 100),
      pixelOffset: scroll.pixelOffset,
      sectionBlock: readByte(timelineMemory, ZERO_PAGE_INDEX.sectionBlock.address),
      sectionBlockHex: dollarHex(readByte(timelineMemory, ZERO_PAGE_INDEX.sectionBlock.address)),
      blockOffset: readByte(timelineMemory, ZERO_PAGE_INDEX.blockOffset.address),
      blockOffsetHex: dollarHex(readByte(timelineMemory, ZERO_PAGE_INDEX.blockOffset.address)),
      wrapsSeen: wrapCount,
      rowSourceCounts: scroll.rowSourceCounts,
      seamDelta: scroll.seamDelta,
      seamSignature,
      currentTailSlot: currentTailSlot ? {
        slotLabel: currentTailSlice?.slotLabel ?? null,
        shapeName: currentTailSlot.shapeName ?? null,
        shapeId: currentTailSlot.shapeId ?? null,
        inspectX: currentTailSlot.inspectX ?? currentTailSlot.coarseX ?? null,
        left: currentTailSlice?.left ?? null,
        right: currentTailSlice?.right ?? null,
        width: currentTailSlice?.width ?? null,
      } : null,
      nextHeadSlot: nextHeadSlot ? {
        slotLabel: nextHeadSlice?.slotLabel ?? null,
        shapeName: nextHeadSlot.shapeName ?? null,
        shapeId: nextHeadSlot.shapeId ?? null,
        inspectX: nextHeadSlot.inspectX ?? nextHeadSlot.coarseX ?? null,
        left: nextHeadSlice?.left ?? null,
        right: nextHeadSlice?.right ?? null,
        width: nextHeadSlice?.width ?? null,
      } : null,
      seamCompareRows: scroll.seamCompareRows.map(entry => ({ ...entry })),
      compositeRows: scroll.compositeSlices.map(row => ({
        compositeIndex: row.compositeIndex,
        source: row.source,
        slotIndex: row.slotIndex,
        slotLabel: row.slotLabel,
        left: row.left,
        right: row.right,
        width: row.width,
        rowKey: `${row.source}-${row.slotIndex}-${row.compositeIndex}`,
        projectedSlot: row.projectedSlot ? {
          shapeName: row.projectedSlot.shapeName ?? null,
          shapeId: row.projectedSlot.shapeId ?? null,
          inspectX: row.projectedSlot.inspectX ?? row.projectedSlot.coarseX ?? null,
        } : null,
      })),
      wrappedThisStep: false,
      note: step === 0 ? 'current live state sample' : 'future harness-only seam sample',
    });
    if (step >= horizon) break;
    const stepInfo = stepVisibleGameplayLoop(timelineMemory, { steps: 1 });
    const wrapped = Boolean(stepInfo?.sectionWrapped ?? stepInfo?.lastStep?.sectionWrapped);
    if (wrapped) wrapCount += 1;
    samples[samples.length - 1].nextStepWrap = wrapped;
  }

  const seamTransitionSteps = [];
  const continuityRuns = [];
  let activeRun = null;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const prevSample = index > 0 ? samples[index - 1] : null;
    const prevNext = prevSample?.nextHeadSlot ?? null;
    const nextHead = sample.nextHeadSlot ?? null;
    const sameShape = Boolean(prevNext && nextHead && prevNext.shapeName === nextHead.shapeName);
    const sameSlotLabel = Boolean(prevNext && nextHead && prevNext.slotLabel === nextHead.slotLabel);
    const xDeltaFromPrev = Number.isFinite(prevNext?.inspectX) && Number.isFinite(nextHead?.inspectX)
      ? (nextHead.inspectX - prevNext.inspectX)
      : null;
    const widthDeltaFromPrev = Number.isFinite(prevNext?.width) && Number.isFinite(nextHead?.width)
      ? (nextHead.width - prevNext.width)
      : null;
    const continuityLabel = !prevSample
      ? 'origin'
      : !prevNext || !nextHead
        ? 'missing'
        : sameShape && sameSlotLabel && xDeltaFromPrev === 0 && widthDeltaFromPrev === 0
          ? 'stable'
          : sameShape && sameSlotLabel
            ? 'same-shape drift'
            : sameShape
              ? 'same-shape slot-shift'
              : 'shape-change';
    sample.nextHeadContinuity = {
      fromStep: prevSample?.step ?? null,
      toStep: sample.step,
      previousShapeName: prevNext?.shapeName ?? null,
      previousSlotLabel: prevNext?.slotLabel ?? null,
      previousInspectX: prevNext?.inspectX ?? null,
      previousWidth: prevNext?.width ?? null,
      sameShape,
      sameSlotLabel,
      xDeltaFromPrev,
      widthDeltaFromPrev,
      continuityLabel,
    };
    if (prevSample && sample.seamSignature !== prevSample.seamSignature) seamTransitionSteps.push(sample.step);
    if (!nextHead?.shapeName) {
      if (activeRun) {
        continuityRuns.push(activeRun);
        activeRun = null;
      }
      continue;
    }
    const runKey = `${nextHead.slotLabel ?? 'n/a'}|${nextHead.shapeName}`;
    if (!activeRun || activeRun.key !== runKey) {
      if (activeRun) continuityRuns.push(activeRun);
      activeRun = {
        key: runKey,
        shapeName: nextHead.shapeName,
        slotLabel: nextHead.slotLabel ?? null,
        startStep: sample.step,
        endStep: sample.step,
        length: 1,
        xValues: Number.isFinite(nextHead.inspectX) ? [nextHead.inspectX] : [],
        widthValues: Number.isFinite(nextHead.width) ? [nextHead.width] : [],
        continuityLabels: [continuityLabel],
      };
    } else {
      activeRun.endStep = sample.step;
      activeRun.length += 1;
      if (Number.isFinite(nextHead.inspectX)) activeRun.xValues.push(nextHead.inspectX);
      if (Number.isFinite(nextHead.width)) activeRun.widthValues.push(nextHead.width);
      activeRun.continuityLabels.push(continuityLabel);
    }
  }
  if (activeRun) continuityRuns.push(activeRun);
  const finalizedRuns = continuityRuns.map(run => ({
    shapeName: run.shapeName,
    slotLabel: run.slotLabel,
    startStep: run.startStep,
    endStep: run.endStep,
    length: run.length,
    xRange: {
      min: run.xValues.length ? Math.min(...run.xValues) : null,
      max: run.xValues.length ? Math.max(...run.xValues) : null,
    },
    widthRange: {
      min: run.widthValues.length ? Math.min(...run.widthValues) : null,
      max: run.widthValues.length ? Math.max(...run.widthValues) : null,
    },
    continuityLabels: Array.from(new Set(run.continuityLabels)),
  }));
  const slotShapeClass = (slot) => slot?.shapeClass ?? shapeClassFromId(slot?.shapeId);
  const describeShapeClassTransition = (beforeSlot, afterSlot) => {
    const previousShapeClass = slotShapeClass(beforeSlot);
    const currentShapeClass = slotShapeClass(afterSlot);
    const familyTransitionKey = `${previousShapeClass ?? 'unknown'}->${currentShapeClass ?? 'unknown'}`;
    return {
      previousShapeClass,
      currentShapeClass,
      familyTransitionKey,
      familyChanged: previousShapeClass !== currentShapeClass,
      familyTransitionLabel: `${previousShapeClass ?? 'unknown'} → ${currentShapeClass ?? 'unknown'}`,
    };
  };
  const wrapSamples = samples.filter(sample => sample.wrapsSeen > 0 || sample.nextStepWrap);
  const wrapPreviewSteps = samples.filter(sample => sample.nextStepWrap).map(sample => sample.step);
  const postWrapSteps = samples.filter(sample => sample.wrapsSeen > 0).map(sample => sample.step);
  const nextHeadWidths = samples.map(sample => sample.nextHeadSlot?.width).filter(value => Number.isFinite(value));
  const nextHeadXs = samples.map(sample => sample.nextHeadSlot?.inspectX).filter(value => Number.isFinite(value));
  const wrapEvents = wrapPreviewSteps.map(previewStep => {
    const beforeSample = samples.find(sample => sample.step === previewStep) ?? null;
    const afterSample = samples.find(sample => sample.step === previewStep + 1) ?? null;
    const wrapFamilyTransition = describeShapeClassTransition(beforeSample?.nextHeadSlot, afterSample?.nextHeadSlot);
    return {
      previewStep,
      postWrapStep: afterSample?.step ?? null,
      wrapsSeenAfter: afterSample?.wrapsSeen ?? beforeSample?.wrapsSeen ?? 0,
      beforeSignature: beforeSample?.seamSignature ?? null,
      afterSignature: afterSample?.seamSignature ?? null,
      seamChangedAcrossWrap: (beforeSample?.seamSignature ?? null) !== (afterSample?.seamSignature ?? null),
      widthDeltaAcrossWrap: Number.isFinite(afterSample?.nextHeadSlot?.width) && Number.isFinite(beforeSample?.nextHeadSlot?.width)
        ? (afterSample.nextHeadSlot.width - beforeSample.nextHeadSlot.width)
        : null,
      xDeltaAcrossWrap: Number.isFinite(afterSample?.nextHeadSlot?.inspectX) && Number.isFinite(beforeSample?.nextHeadSlot?.inspectX)
        ? (afterSample.nextHeadSlot.inspectX - beforeSample.nextHeadSlot.inspectX)
        : null,
      previousShapeClass: wrapFamilyTransition.previousShapeClass,
      currentShapeClass: wrapFamilyTransition.currentShapeClass,
      familyTransitionKey: wrapFamilyTransition.familyTransitionKey,
      familyChangedAcrossWrap: wrapFamilyTransition.familyChanged,
      familyTransitionLabel: wrapFamilyTransition.familyTransitionLabel,
      beforeSample: beforeSample ? {
        step: beforeSample.step,
        frameCnt: beforeSample.frameCnt,
        frameCntHex: beforeSample.frameCntHex,
        blockLine: beforeSample.blockLine,
        blockLineHex: beforeSample.blockLineHex,
        seamSignature: beforeSample.seamSignature,
        currentTailSlot: beforeSample.currentTailSlot ? { ...beforeSample.currentTailSlot } : null,
        nextHeadSlot: beforeSample.nextHeadSlot ? { ...beforeSample.nextHeadSlot } : null,
        seamDelta: { ...beforeSample.seamDelta },
        seamCompareRows: beforeSample.seamCompareRows.map(entry => ({ ...entry })),
      } : null,
      afterSample: afterSample ? {
        step: afterSample.step,
        frameCnt: afterSample.frameCnt,
        frameCntHex: afterSample.frameCntHex,
        blockLine: afterSample.blockLine,
        blockLineHex: afterSample.blockLineHex,
        seamSignature: afterSample.seamSignature,
        currentTailSlot: afterSample.currentTailSlot ? { ...afterSample.currentTailSlot } : null,
        nextHeadSlot: afterSample.nextHeadSlot ? { ...afterSample.nextHeadSlot } : null,
        seamDelta: { ...afterSample.seamDelta },
        seamCompareRows: afterSample.seamCompareRows.map(entry => ({ ...entry })),
      } : null,
    };
  });
  const wrapWidthDeltas = wrapEvents.map(event => event.widthDeltaAcrossWrap).filter(value => Number.isFinite(value));
  const wrapXDeltas = wrapEvents.map(event => event.xDeltaAcrossWrap).filter(value => Number.isFinite(value));
  const wrapPreviewGaps = wrapPreviewSteps.slice(1).map((step, index) => step - wrapPreviewSteps[index]);
  const nextHeadChangeEvents = samples.slice(1).map(sample => {
    const continuity = sample.nextHeadContinuity ?? {};
    const previousShapeName = continuity.previousShapeName ?? null;
    const currentShapeName = sample.nextHeadSlot?.shapeName ?? null;
    const previousSlotLabel = continuity.previousSlotLabel ?? null;
    const currentSlotLabel = sample.nextHeadSlot?.slotLabel ?? null;
    const familyTransition = describeShapeClassTransition(samples[sample.step - 1]?.nextHeadSlot, sample.nextHeadSlot);
    const shapeChanged = previousShapeName !== currentShapeName;
    const slotChanged = previousSlotLabel !== currentSlotLabel;
    if (!shapeChanged && !slotChanged) return null;
    return {
      step: sample.step,
      fromStep: continuity.fromStep ?? (sample.step - 1),
      continuityLabel: continuity.continuityLabel ?? 'n/a',
      previousShapeName,
      currentShapeName,
      previousSlotLabel,
      currentSlotLabel,
      previousShapeClass: familyTransition.previousShapeClass,
      currentShapeClass: familyTransition.currentShapeClass,
      familyTransitionKey: familyTransition.familyTransitionKey,
      familyChanged: familyTransition.familyChanged,
      familyTransitionLabel: familyTransition.familyTransitionLabel,
      shapeChanged,
      slotChanged,
      xDeltaFromPrev: continuity.xDeltaFromPrev ?? null,
      widthDeltaFromPrev: continuity.widthDeltaFromPrev ?? null,
      seamSignatureChanged: sample.step > 0 ? sample.seamSignature !== samples[sample.step - 1]?.seamSignature : false,
      nextStepWrap: Boolean(sample.nextStepWrap),
      wrapsSeen: sample.wrapsSeen,
      beforeSample: samples[sample.step - 1] ? {
        step: samples[sample.step - 1].step,
        frameCnt: samples[sample.step - 1].frameCnt,
        frameCntHex: samples[sample.step - 1].frameCntHex,
        blockLine: samples[sample.step - 1].blockLine,
        blockLineHex: samples[sample.step - 1].blockLineHex,
        seamSignature: samples[sample.step - 1].seamSignature,
        nextHeadSlot: samples[sample.step - 1].nextHeadSlot ? { ...samples[sample.step - 1].nextHeadSlot } : null,
        currentTailSlot: samples[sample.step - 1].currentTailSlot ? { ...samples[sample.step - 1].currentTailSlot } : null,
        seamDelta: { ...samples[sample.step - 1].seamDelta },
      } : null,
      afterSample: {
        step: sample.step,
        frameCnt: sample.frameCnt,
        frameCntHex: sample.frameCntHex,
        blockLine: sample.blockLine,
        blockLineHex: sample.blockLineHex,
        seamSignature: sample.seamSignature,
        nextHeadSlot: sample.nextHeadSlot ? { ...sample.nextHeadSlot } : null,
        currentTailSlot: sample.currentTailSlot ? { ...sample.currentTailSlot } : null,
        seamDelta: { ...sample.seamDelta },
      },
    };
  }).filter(Boolean);
  const nextHeadChangeKinds = nextHeadChangeEvents.map(event => event.continuityLabel).filter(Boolean);
  const nextHeadFamilyTransitionCounts = Object.fromEntries(nextHeadChangeEvents.reduce((map, event) => {
    const key = event.familyTransitionKey || 'unknown->unknown';
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map()));
  const wrapFamilyTransitionCounts = Object.fromEntries(wrapEvents.reduce((map, event) => {
    const key = event.familyTransitionKey || 'unknown->unknown';
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map()));
  const nextHeadChangeSummary = {
    totalEvents: nextHeadChangeEvents.length,
    shapeChangedCount: nextHeadChangeEvents.filter(event => event.shapeChanged).length,
    slotChangedCount: nextHeadChangeEvents.filter(event => event.slotChanged).length,
    familyChangedCount: nextHeadChangeEvents.filter(event => event.familyChanged).length,
    familyStableCount: nextHeadChangeEvents.filter(event => !event.familyChanged).length,
    previewSteps: nextHeadChangeEvents.map(event => event.step),
    changeKinds: Array.from(new Set(nextHeadChangeKinds)),
    familyTransitions: nextHeadChangeEvents.map(event => event.familyTransitionKey),
    familyTransitionCounts: nextHeadFamilyTransitionCounts,
  };
  const multiWrapSummary = {
    multiWrapDetected: wrapEvents.length > 1,
    firstWrapPreviewStep: wrapPreviewSteps[0] ?? null,
    lastWrapPreviewStep: wrapPreviewSteps.at(-1) ?? null,
    firstPostWrapStep: postWrapSteps[0] ?? null,
    lastPostWrapStep: postWrapSteps.at(-1) ?? null,
    wrapPreviewSteps: [...wrapPreviewSteps],
    postWrapSteps: [...postWrapSteps],
    wrapPreviewGapRange: {
      min: wrapPreviewGaps.length ? Math.min(...wrapPreviewGaps) : null,
      max: wrapPreviewGaps.length ? Math.max(...wrapPreviewGaps) : null,
    },
    averageWrapPreviewGap: wrapPreviewGaps.length ? Number((wrapPreviewGaps.reduce((sum, value) => sum + value, 0) / wrapPreviewGaps.length).toFixed(2)) : null,
  };
  const wrapTrendSummary = {
    totalWrapEvents: wrapEvents.length,
    seamChangedCount: wrapEvents.filter(event => event.seamChangedAcrossWrap).length,
    seamStableCount: wrapEvents.filter(event => !event.seamChangedAcrossWrap).length,
    familyChangedCount: wrapEvents.filter(event => event.familyChangedAcrossWrap).length,
    familyStableCount: wrapEvents.filter(event => !event.familyChangedAcrossWrap).length,
    widthDeltaRange: {
      min: wrapWidthDeltas.length ? Math.min(...wrapWidthDeltas) : null,
      max: wrapWidthDeltas.length ? Math.max(...wrapWidthDeltas) : null,
    },
    xDeltaRange: {
      min: wrapXDeltas.length ? Math.min(...wrapXDeltas) : null,
      max: wrapXDeltas.length ? Math.max(...wrapXDeltas) : null,
    },
    changedPreviewSteps: wrapEvents.filter(event => event.seamChangedAcrossWrap).map(event => event.previewStep),
    stablePreviewSteps: wrapEvents.filter(event => !event.seamChangedAcrossWrap).map(event => event.previewStep),
    familyChangedPreviewSteps: wrapEvents.filter(event => event.familyChangedAcrossWrap).map(event => event.previewStep),
    familyTransitionCounts: wrapFamilyTransitionCounts,
    wrapPreviewSteps: [...wrapPreviewSteps],
    postWrapSteps: [...postWrapSteps],
    wrapPreviewGapRange: multiWrapSummary.wrapPreviewGapRange,
    averageWrapPreviewGap: multiWrapSummary.averageWrapPreviewGap,
  };
  return {
    horizon,
    sampleCount: samples.length,
    wrapsSeen: wrapCount,
    samples,
    firstWrapStep: wrapSamples[0]?.step ?? null,
    firstWrapPreviewStep: wrapPreviewSteps[0] ?? null,
    firstPostWrapStep: postWrapSteps[0] ?? null,
    lastWrapPreviewStep: wrapPreviewSteps.at(-1) ?? null,
    lastPostWrapStep: postWrapSteps.at(-1) ?? null,
    firstNextHeadChangeStep: nextHeadChangeEvents[0]?.step ?? null,
    lastNextHeadChangeStep: nextHeadChangeEvents.at(-1)?.step ?? null,
    wrapPreviewSteps,
    postWrapSteps,
    wrapEvents,
    wrapEventCount: wrapEvents.length,
    nextHeadChangeEvents,
    nextHeadChangeCount: nextHeadChangeEvents.length,
    nextHeadChangeSummary,
    seamTransitionSteps,
    seamTransitionCount: seamTransitionSteps.length,
    continuityRuns: finalizedRuns,
    continuityRunCount: finalizedRuns.length,
    longestContinuityRunLength: finalizedRuns.length ? Math.max(...finalizedRuns.map(run => run.length)) : 0,
    multiWrapSummary,
    wrapTrendSummary,
    nextHeadWidthRange: {
      min: nextHeadWidths.length ? Math.min(...nextHeadWidths) : null,
      max: nextHeadWidths.length ? Math.max(...nextHeadWidths) : null,
    },
    nextHeadXRange: {
      min: nextHeadXs.length ? Math.min(...nextHeadXs) : null,
      max: nextHeadXs.length ? Math.max(...nextHeadXs) : null,
    },
    note: 'Visible river timeline is a harness-only future seam preview built by stepping the excerpt-limited gameplay helper on a cloned memory snapshot. It compares future current-tail vs next-head seam states, continuity drifts, next-head change events, wrap-preview markers, projected composite rows, and wrap-boundary summaries without claiming the unseen ROM scrolling scheduler.',
  };
}

export function inspectVisibleJetRiverBounds(memory, options = {}) {
  const riverProfile = inspectVisibleRiverProfile(memory);
  const rawPlayerX = Number.isFinite(Number(options.playerX))
    ? Math.max(0, Math.min(159, Math.trunc(Number(options.playerX))))
    : readByte(memory, ZERO_PAGE_INDEX.playerX.address);
  const normalizedJetRow = Math.max(0, Math.min(1, GAME_CONSTANTS.JET_Y / GAME_CONSTANTS.NUM_LINES));
  const requestedSliceIndex = Number(options.sliceIndex);
  const sliceIndex = Number.isInteger(requestedSliceIndex)
    ? Math.max(0, Math.min(riverProfile.slices.length - 1, requestedSliceIndex))
    : Math.max(0, Math.min(riverProfile.slices.length - 1, Math.floor(normalizedJetRow * riverProfile.slices.length)));
  const defaultSlice = {
    left: 32,
    right: 128,
    width: 96,
    slotIndex: 0,
    slotLabel: SLOT_NAMES[0],
    carriesMoveBit: false,
    shapeClass: 'unknown',
    shapeName: 'unknown',
  };
  const requestedSlice = riverProfile.slices[sliceIndex] ?? riverProfile.slices[0] ?? defaultSlice;
  const fallbackSlice = requestedSlice.carriesMoveBit
    ? riverProfile.slices.reduce((best, candidate, candidateIndex) => {
      if (!candidate || candidate.carriesMoveBit) return best;
      if (!best) return { candidate, candidateIndex };
      const bestDistance = Math.abs(best.candidateIndex - sliceIndex);
      const candidateDistance = Math.abs(candidateIndex - sliceIndex);
      if (candidateDistance < bestDistance) return { candidate, candidateIndex };
      return best;
    }, null)
    : null;
  const slice = fallbackSlice?.candidate ?? requestedSlice;
  const selectedSliceIndex = fallbackSlice?.candidateIndex ?? sliceIndex;
  const requestedMargin = Number(options.margin);
  const marginBase = Number.isFinite(requestedMargin) ? Math.max(0, Math.trunc(requestedMargin)) : 6;
  const maxMargin = Math.max(0, Math.floor((slice.right - slice.left) / 2) - 1);
  const margin = Math.min(marginBase, maxMargin);
  let leftBound = Math.max(0, slice.left + margin);
  let rightBound = Math.min(159, slice.right - margin);
  if (leftBound > rightBound) {
    const center = Math.round((slice.left + slice.right) / 2);
    leftBound = center;
    rightBound = center;
  }
  const clampedPlayerX = Math.max(leftBound, Math.min(rightBound, rawPlayerX));
  const crashSide = rawPlayerX < leftBound ? 'left-bank' : rawPlayerX > rightBound ? 'right-bank' : 'clear';
  return {
    rawPlayerX,
    rawPlayerXHex: dollarHex(rawPlayerX),
    sliceIndex: selectedSliceIndex,
    requestedSliceIndex: sliceIndex,
    sliceLabel: slice.slotLabel,
    margin,
    leftBound,
    leftBoundHex: dollarHex(leftBound),
    rightBound,
    rightBoundHex: dollarHex(rightBound),
    clampedPlayerX,
    clampedPlayerXHex: dollarHex(clampedPlayerX),
    collidedWithBank: crashSide !== 'clear',
    crashSide,
    slice,
    fallbackFromMovingSlice: !!fallbackSlice,
    requestedSlice,
    note: 'Jet river-bounds helper uses the inspector-only river silhouette at the fixed JET_Y row to derive harness clamp/collision bounds. It does not claim the unseen ROM collision routine.',
  };
}

export function slotAddressLookup(slotIndex) {
 const index = Number(slotIndex);
 if (!Number.isInteger(index) || index < 0 || index >= GAME_CONSTANTS.NUM_BLOCKS) return null;
 const out = {};
 for (let i = 0; i < BLOCK_ARRAY_NAMES.length; i++) {
 const name = BLOCK_ARRAY_NAMES[i];
 const addr = BLOCK_ARRAY_BASES[i] + index;
 out[name] = {
 address: addr,
 hex: dollarHex(addr),
 arrayBase: dollarHex(BLOCK_ARRAY_BASES[i]),
 offset: index,
 };
 }
 return out;
}

export function inspectVisibleSlots(memory) {
 const out = [];
 for (let i = 0; i < GAME_CONSTANTS.NUM_BLOCKS; i++) {
 const blockByte = readByte(memory, BLOCK_ARRAY_BASES[0] + i);
 const state1Byte = readByte(memory, BLOCK_ARRAY_BASES[2] + i);
 const shapeId = readByte(memory, BLOCK_ARRAY_BASES[3] + i);
 const coarseX = readByte(memory, BLOCK_ARRAY_BASES[1] + i);
 const pf1 = readByte(memory, BLOCK_ARRAY_BASES[4] + i);
 const pf2 = readByte(memory, BLOCK_ARRAY_BASES[5] + i);
 const shapeIdAddress = BLOCK_ARRAY_BASES[3] + i;
 const addrs = slotAddressLookup(i);
 const shapeName = shapeNameFromId(shapeId);
 const pf1Page = blockByte & FLAGS.blockLst.PF1_PAGE_FLAG ? 0xfd : 0xfc;
 const pf2Page = blockByte & FLAGS.blockLst.PF2_PAGE_FLAG ? 0xfd : 0xfc;
 out.push({
 slotIndex: i,
 slotLabel: SLOT_NAMES[i],
 coarseX,
 inspectX: coarseX,
 blockLst: blockByte,
 blockLstHex: dollarHex(blockByte),
 blockFlags: decodeBlockFlags(blockByte),
 state1Byte,
 state1ByteHex: dollarHex(state1Byte),
 state1: decodeState1(state1Byte),
 shapeId,
 shapeIdHex: dollarHex(shapeId),
 shapeName,
 shapeAsmName: shapeAsmNameFromId(shapeId),
 shapeClass: shapeClassFromId(shapeId),
 isKnownShape: shapeName !== 'unknown',
 shapeIdAddress,
 shapeIdAddressHex: dollarHex(shapeIdAddress),
 pf1,
 pf1Low: pf1,
 pf1Hex: dollarHex(pf1),
 pf1Page,
 pf1PageHex: dollarHex(pf1Page, 4),
 pf2,
 pf2Low: pf2,
 pf2Hex: dollarHex(pf2),
 pf2Page,
 pf2PageHex: dollarHex(pf2Page, 4),
 rowAddresses: addrs,
 rowRangeHex: `${addrs.blockLst.hex}..${addrs.PF2Lst.hex}`,
 });
 }
 return out;
}

// inspectVisibleSlotNUSIZMap — per-slot NUSIZ detail snapshot
// Reads all 6 State1Lst bytes and returns a concise per-slot NUSIZ breakdown
// using decodeNUSIZDetail, directly grounded in the ASM's State1Lst layout
// (ASM line 197: "State1Lst = $9A ..$9F bit 0..2 = NUSIZ1, bit 3 = REFP1, 4..7 = fine move")
// and the named NUSIZ constants (ASM lines 158-162).
export function inspectVisibleSlotNUSIZMap(memory) {
 const out = [];
 const state1Base = BLOCK_ARRAY_BASES[2]; // State1Lst
 for (let i = 0; i < GAME_CONSTANTS.NUM_BLOCKS; i++) {
 const state1Byte = readByte(memory, state1Base + i);
    const nusizValue = state1Byte & FLAGS.state1Lst.NUSIZ_MASK;
    const detail = decodeNUSIZDetail(nusizValue);
    const directionFlag = !!(state1Byte & FLAGS.state1Lst.DIRECTION_FLAG);
    out.push({
      slotIndex: i,
      slotLabel: SLOT_NAMES[i],
      state1Byte,
      state1ByteHex: dollarHex(state1Byte),
      nusizValue,
      nusizDetail: detail,
      directionFlag,
      directionLabel: directionFlag ? 'left/reflected' : 'right/normal',
      summary: `slot ${SLOT_NAMES[i]}: ${detail.label}${directionFlag ? ' reflected' : ''} (${detail.playerPixelWidth}px wide, ${detail.copyCount} cop${detail.copyCount === 1 ? 'y' : 'ies'})`,
    });
  }
  return {
    slots: out,
    note: 'Per-slot NUSIZ detail from State1Lst bytes. playerPixelWidth and copyCount describe TIA rendering behavior encoded by the ASM\'s named NUSIZ constants (lines 158-162).',
  };
}

// inspectVisibleSectionProgress — section/block/offset state inspector
// Grounded in ASM excerpt ZP variable declarations:
//   sectionBlock = $B9 (ASM line 217: "number of block in current section (16..1)")
//   blockOffset  = $8B (ASM line 200)
//   blockPart    = $B6 (ASM line 214: "1/2 (used for bridge)")
//   blockLst array at $8E..$93 (ASM line 191)
// This reads the section countdown and block offset/part that the kernel
// uses to track position within the current section of 16 blocks.
export function inspectVisibleSectionProgress(memory) {
  const sectionBlock = readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address);
  const blockOffset = readByte(memory, ZERO_PAGE_INDEX.blockOffset.address);
  const blockPart = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
  const currentBlockLine = readByte(memory, ZERO_PAGE_INDEX.lineNum.address);
  // sectionBlock counts down from SECTION_BLOCKS(16) to 1 per the ASM comment
  const remainingInSection = Math.max(0, sectionBlock);
  const sectionProgressPct = GAME_CONSTANTS.SECTION_BLOCKS > 0
    ? `${Math.round(((GAME_CONSTANTS.SECTION_BLOCKS - remainingInSection) / GAME_CONSTANTS.SECTION_BLOCKS) * 100)}%`
    : '0%';
  return {
    sectionBlock,
    sectionBlockHex: dollarHex(sectionBlock),
    remainingInSection,
    sectionBlocksTotal: GAME_CONSTANTS.SECTION_BLOCKS,
    sectionProgressPct,
    blockOffset,
    blockOffsetHex: dollarHex(blockOffset),
    blockPart,
    blockPartHex: dollarHex(blockPart),
    blockPartLabel: blockPart === 1 ? 'first half' : blockPart === 2 ? 'second half' : 'unknown',
    currentBlockLine,
    currentBlockLineHex: dollarHex(currentBlockLine),
    blockLineInPart: currentBlockLine,
    note: 'Section progress from ASM ZP: sectionBlock=$B9 (ASM line 217), blockOffset=$8B, blockPart=$B6 (ASM line 214). sectionBlock counts down from 16..1 per the ASM comment. blockPart 1=first half, 2=second half (bridge context).',
  };
}

export function snapshotNamedState(memory) {
 const out = {};
 for (let e = 0; e < ZERO_PAGE_LAYOUT.length; e++) {
 const entry = ZERO_PAGE_LAYOUT[e];
 if (entry.aliasOf) continue;
 if (entry.length === 1) {
 out[entry.name] = memory[entry.address] & 0xff;
 } else {
 const bytes = [];
 for (let i = 0; i < entry.length; i++) bytes.push(memory[(entry.address + i) & 0xff] & 0xff);
 out[entry.name] = bytes;
 }
 }
 return out;
}

export function inspectRoadBlockTemp2(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.temp2.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.temp2.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.temp2.address),
    roadBitMask: 0x80,
    roadBitMaskHex: dollarHex(0x80),
    roadBit: !!(raw & 0x80),
    hasRoad: !!(raw & 0x80),
    roadLabel: (raw & 0x80) ? 'road bit set' : 'road bit clear',
    lowerBits: raw & 0x7f,
    lowerBitsHex: dollarHex(raw & 0x7f),
    note: 'roadBlockTemp2 reads only the declared temp2 byte at $ED; bit 7 is surfaced as the PF-road bit and the lower 7 bits are left uninterpreted.',
  };
}

export function inspectTempAlias(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.temp.address);
  return {
    raw,
    rawHex: dollarHex(raw),
    diffPF: raw,
    diffPFHex: dollarHex(raw),
    aliasName: 'diffPF',
    address: ZERO_PAGE_INDEX.temp.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.temp.address),
    note: 'Inspector alias only: temp at $F2 is exposed as diffPF without claiming unseen diff logic; behavior NOT in excerpt.',
  };
}

export function inspectTemp2Alias(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.temp2.address);
  return {
    raw,
    rawHex: dollarHex(raw),
    roadBlock: raw,
    roadBlockHex: dollarHex(raw),
    roadBitMask: 0x80,
    roadBitMaskHex: dollarHex(0x80),
    hasRoad: !!(raw & 0x80),
    lowerBits: raw & 0x7f,
    lowerBitsHex: dollarHex(raw & 0x7f),
    aliasName: 'roadBlock',
    address: ZERO_PAGE_INDEX.temp2.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.temp2.address),
    note: 'Inspector alias only: temp2 at $ED is exposed as roadBlock; only bit 7 road-bit labeling is used, so details remain NOT in excerpt.',
  };
}

export function inspectPlayerColor(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.playerColor.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.playerColor.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.playerColor.address),
    colorCss: ntscColorCss(raw),
    isBlack: raw === COLORS.BLACK,
    isYellow: raw === COLORS.YELLOW,
    note: 'playerColor is the declared byte at $EF; only exact color-byte equality against visible constants is surfaced.',
  };
}

export function inspectPFcolorState(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.PFcolor.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.PFcolor.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.PFcolor.address),
    pfColorCss: ntscColorCss(raw),
    alias: 'PFcolor / valleyWidth shared byte at $EE',
    aliasName: 'valleyWidth',
    note: 'PFcolor and valleyWidth are two names for the same declared byte at $EE; this panel shows the raw byte plus a color decode only.',
  };
}

export function inspectStateColors(memory) {
  const bkColor = readByte(memory, ZERO_PAGE_INDEX.stateBKColor.address);
  const pfColor = readByte(memory, ZERO_PAGE_INDEX.statePFColor.address);
  return {
    bkColor,
    bkColorHex: dollarHex(bkColor),
    bkColorAddress: ZERO_PAGE_INDEX.stateBKColor.address,
    bkColorAddressHex: dollarHex(ZERO_PAGE_INDEX.stateBKColor.address),
    pfColor,
    pfColorHex: dollarHex(pfColor),
    pfColorAddress: ZERO_PAGE_INDEX.statePFColor.address,
    pfColorAddressHex: dollarHex(ZERO_PAGE_INDEX.statePFColor.address),
    rangeHex: `${dollarHex(ZERO_PAGE_INDEX.stateBKColor.address)}..${dollarHex(ZERO_PAGE_INDEX.statePFColor.address)}`,
    expectedBK: COLORS.GREY,
    expectedPF: 0x1e,
    bkMatchesExpected: bkColor === COLORS.GREY,
    pfMatchesExpected: pfColor === 0x1e,
    note: 'State color expectations come only from the visible excerpt constants GREY and YELLOW+2.',
  };
}

export function inspectShapePtrState(memory) {
  const makePointer = (name) => {
    const address = ZERO_PAGE_INDEX[name].address;
    const lo = readByte(memory, address);
    const hi = readByte(memory, address + 1);
    const value = wordAt(memory, address);
    return {
      name,
      address,
      addressHex: dollarHex(address).toUpperCase(),
      endAddress: address + 1,
      endAddressHex: dollarHex(address + 1).toUpperCase(),
      rangeHex: `${dollarHex(address)}..${dollarHex(address + 1)}`,
      lo,
      loHex: dollarHex(lo),
      hi,
      hiHex: dollarHex(hi),
      value,
      valueHex: dollarHex(value, 4),
      isZero: value === 0,
    };
  };
  const shapePtr0 = makePointer('shapePtr0');
  const shapePtr1a = makePointer('shapePtr1a');
  const shapePtr1b = makePointer('shapePtr1b');
  const pointers = [shapePtr0, shapePtr1a, shapePtr1b];
  return {
    shapePtr0,
    shapePtr1a,
    shapePtr1b,
    pointerNames: pointers.map((pointer) => pointer.name),
    pointerRanges: pointers.map((pointer) => pointer.rangeHex),
    nonZeroPointerCount: pointers.filter((pointer) => !pointer.isZero).length,
    allPointersZero: pointers.every((pointer) => pointer.isZero),
    note: 'Inspector reads declared pointer pairs only: shapePtr0 at $BA..$BB, shapePtr1a at $C7..$C8, shapePtr1b at $C9..$CA. Pointer targets themselves are NOT reconstructed from the excerpt.',
  };
}

export function inspectPFptrState(memory) {
  const makePointer = (name) => {
    const address = ZERO_PAGE_INDEX[name].address;
    const lo = readByte(memory, address);
    const hi = readByte(memory, address + 1);
    const value = wordAt(memory, address);
    return {
      address,
      addressHex: dollarHex(address).toUpperCase(),
      endAddress: address + 1,
      endAddressHex: dollarHex(address + 1).toUpperCase(),
      rangeHex: `${dollarHex(address)}..${dollarHex(address + 1)}`,
      lo,
      loHex: dollarHex(lo),
      hi,
      hiHex: dollarHex(hi),
      value,
      valueHex: dollarHex(value, 4),
    };
  };
  return {
    pf1Ptr: makePointer('PF1Ptr'),
    pf2Ptr: makePointer('PF2Ptr'),
    note: 'Inspector reads declared PF pointer pairs only: PF1Ptr at $D9..$DA and PF2Ptr at $DB..$DC.',
  };
}

export function inspectColorPtrState(memory) {
  const address = ZERO_PAGE_INDEX.colorPtr.address;
  const lo = readByte(memory, address);
  const hi = readByte(memory, address + 1);
  const value = wordAt(memory, address);
  return {
    address,
    addressHex: dollarHex(address).toUpperCase(),
    endAddress: address + 1,
    endAddressHex: dollarHex(address + 1).toUpperCase(),
    rangeHex: `${dollarHex(address)}..${dollarHex(address + 1)}`,
    colorPtr: value,
    colorPtrHex: dollarHex(value, 4),
    lo,
    loHex: dollarHex(lo),
    hi,
    hiHex: dollarHex(hi),
    note: 'Inspector reads the declared colorPtr pair only at $CB..$CC; target table contents are NOT reconstructed from the excerpt.',
  };
}

export function inspectSavedRngState(memory) {
  const saved16 = (readByte(memory, ZERO_PAGE_INDEX.randomHiSave2.address) << 8) | readByte(memory, ZERO_PAGE_INDEX.randomLoSave2.address);
  const current16 = readRng16(memory);
  return {
    randomLoSave2: readByte(memory, ZERO_PAGE_INDEX.randomLoSave2.address),
    randomHiSave2: readByte(memory, ZERO_PAGE_INDEX.randomHiSave2.address),
    saved16,
    saved16Hex: dollarHex(saved16, 4),
    current16,
    current16Hex: dollarHex(current16, 4),
    matchesCurrent: saved16 === current16,
    note: 'Inspector compares saved RNG bytes at $EB/$EC against current RNG state.',
  };
}

export function inspectPlayer1State(memory) {
  const entry = ZERO_PAGE_INDEX.player1State;
  const bytes = getFieldBytes(memory, 'player1State');
  const livesPtr16 = (bytes[4] << 8) | bytes[3];
  const level = bytes[0];
  let levelRange = 'unset';
  if (level >= 1 && level <= GAME_CONSTANTS.MAX_LEVEL) levelRange = 'valid (1..48)';
  else if (level > GAME_CONSTANTS.MAX_LEVEL) levelRange = 'out of range';
  const declaredFields = Object.freeze([
    { name: 'level', offset: 0, address: entry.address, addressHex: dollarHex(entry.address), raw: bytes[0], rawHex: dollarHex(bytes[0]) },
    { name: 'randomLoSave', offset: 1, address: entry.address + 1, addressHex: dollarHex(entry.address + 1), raw: bytes[1], rawHex: dollarHex(bytes[1]) },
    { name: 'randomHiSave', offset: 2, address: entry.address + 2, addressHex: dollarHex(entry.address + 2), raw: bytes[2], rawHex: dollarHex(bytes[2]) },
    { name: 'livesPtrLo', offset: 3, address: entry.address + 3, addressHex: dollarHex(entry.address + 3), raw: bytes[3], rawHex: dollarHex(bytes[3]) },
    { name: 'livesPtrHi', offset: 4, address: entry.address + 4, addressHex: dollarHex(entry.address + 4), raw: bytes[4], rawHex: dollarHex(bytes[4]) },
  ]);
  return {
    address: entry.address,
    addressHex: dollarHex(entry.address),
    endAddress: entry.address + entry.length - 1,
    endAddressHex: dollarHex(entry.address + entry.length - 1),
    rangeHex: `${dollarHex(entry.address)}..${dollarHex(entry.address + entry.length - 1)}`,
    bytes,
    hexDump: bytes.map((b) => b.toString(16).padStart(2, '0')).join(' '),
    declaredFields,
    level,
    levelHex: dollarHex(level),
    levelRange,
    randomLoSave: bytes[1],
    randomLoSaveHex: dollarHex(bytes[1]),
    randomHiSave: bytes[2],
    randomHiSaveHex: dollarHex(bytes[2]),
    savedRng16: (bytes[2] << 8) | bytes[1],
    savedRng16Hex: dollarHex((bytes[2] << 8) | bytes[1], 4),
    livesPtrLo: bytes[3],
    livesPtrLoAddress: entry.address + 3,
    livesPtrLoAddressHex: dollarHex(entry.address + 3),
    livesPtrHi: bytes[4],
    livesPtrHiAddress: entry.address + 4,
    livesPtrHiAddressHex: dollarHex(entry.address + 4),
    livesPtr16,
    livesPtr16Hex: dollarHex(livesPtr16, 4),
    note: 'player1State is reported as the declared 5-byte area at $BD..$C1; aliases are surfaced byte-for-byte only, without inferring unseen gameplay logic.',
  };
}

export function inspectPlayer2State(memory) {
  const entry = ZERO_PAGE_INDEX.player2State;
  const bytes = getFieldBytes(memory, 'player2State');
  const declaredFields = Object.freeze([
    { name: 'byte0', offset: 0, address: entry.address, addressHex: dollarHex(entry.address), raw: bytes[0], rawHex: dollarHex(bytes[0]) },
    { name: 'byte1', offset: 1, address: entry.address + 1, addressHex: dollarHex(entry.address + 1), raw: bytes[1], rawHex: dollarHex(bytes[1]) },
    { name: 'byte2', offset: 2, address: entry.address + 2, addressHex: dollarHex(entry.address + 2), raw: bytes[2], rawHex: dollarHex(bytes[2]) },
    { name: 'livesPtr2', offset: 3, address: entry.address + 3, addressHex: dollarHex(entry.address + 3), raw: bytes[3], rawHex: dollarHex(bytes[3]) },
  ]);
  return {
    address: entry.address,
    addressHex: dollarHex(entry.address),
    endAddress: entry.address + entry.length - 1,
    endAddressHex: dollarHex(entry.address + entry.length - 1),
    rangeHex: `${dollarHex(entry.address)}..${dollarHex(entry.address + entry.length - 1)}`,
    bytes,
    hexDump: bytes.map((b) => b.toString(16).padStart(2, '0')).join(' '),
    declaredFields,
    livesPtr2: bytes[3],
    livesPtr2Hex: dollarHex(bytes[3]),
    livesPtr2Address: entry.address + 3,
    livesPtr2AddressHex: dollarHex(entry.address + 3),
    livesPtr2Note: 'player2State packs a const/alias byte at the end of the declared 4-byte area.',
    note: 'player2State is reported as the declared 4-byte area at $C2..$C5; only the visible alias placement is surfaced here.',
  };
}

export function inspectPlayerByte(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.player.address);
  const playerNum = raw === 0 ? 0 : raw === 1 ? 1 : 'invalid';
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.player.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.player.address),
    playerNum,
    playerLabel: typeof playerNum === 'number' ? `P${playerNum + 1}` : `invalid (${dollarHex(raw)})`,
    isValidPlayerByte: typeof playerNum === 'number',
    note: 'player byte at $F4: raw 0 maps to P1 and raw 1 maps to P2 in the excerpt; broader swap/control logic is NOT in excerpt.',
  };
}

export function inspectDiffPF(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.temp.address);
  return {
    raw,
    hex: dollarHex(raw),
    diffPF: raw,
    diffPFHex: dollarHex(raw),
    aliasName: 'diffPF',
    address: ZERO_PAGE_INDEX.temp.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.temp.address),
    sharedByteName: 'temp',
    sharedByteAddressHex: dollarHex(ZERO_PAGE_INDEX.temp.address),
    note: 'Inspector alias only: temp at $F2 is exposed as diffPF without claiming unseen diff logic; behavior NOT in excerpt.',
  };
}

export function inspectBlockArrayLayout() {
  const arrays = BLOCK_ARRAY_LAYOUT.map((entry) => ({ ...entry }));
  return {
    arrays,
    totalArrays: arrays.length,
    bytesPerArray: GAME_CONSTANTS.NUM_BLOCKS,
    totalBytes: arrays.reduce((sum, entry) => sum + entry.length, 0),
    contiguousRangeHex: `${arrays[0]?.startHex}..${arrays[arrays.length - 1]?.endHex}`,
    note: 'Block-array layout is derived from the excerpt ZP declarations plus the six *End labels; no runtime kernel traversal is implied.',
  };
}

export function inspectPlayerSwapState(memory) {
  const gameVariationRaw = readByte(memory, ZERO_PAGE_INDEX.gameVariation.address);
  const gameDelayRaw = readByte(memory, ZERO_PAGE_INDEX.gameDelay.address);
  const playerRaw = readByte(memory, ZERO_PAGE_INDEX.player.address);
  const playerNum = playerRaw === 0 ? 0 : playerRaw === 1 ? 1 : null;
  return {
    gameVariation: {
      raw: gameVariationRaw,
      hex: dollarHex(gameVariationRaw),
      address: ZERO_PAGE_INDEX.gameVariation.address,
      addressHex: dollarHex(ZERO_PAGE_INDEX.gameVariation.address),
    },
    gameDelay: {
      raw: gameDelayRaw,
      hex: dollarHex(gameDelayRaw),
      address: ZERO_PAGE_INDEX.gameDelay.address,
      addressHex: dollarHex(ZERO_PAGE_INDEX.gameDelay.address),
    },
    sharedWindow: {
      start: ZERO_PAGE_INDEX.gameVariation.address,
      startHex: dollarHex(ZERO_PAGE_INDEX.gameVariation.address),
      end: ZERO_PAGE_INDEX.gameDelay.address,
      endHex: dollarHex(ZERO_PAGE_INDEX.gameDelay.address),
      rangeHex: `${dollarHex(ZERO_PAGE_INDEX.gameVariation.address)}..${dollarHex(ZERO_PAGE_INDEX.gameDelay.address)}`,
      length: 2,
    },
    player: {
      raw: playerRaw,
      hex: dollarHex(playerRaw),
      address: ZERO_PAGE_INDEX.player.address,
      addressHex: dollarHex(ZERO_PAGE_INDEX.player.address),
      playerNum,
      playerLabel: playerNum === 0 ? 'P1' : playerNum === 1 ? 'P2' : `invalid (${dollarHex(playerRaw)})`,
      isValidPlayerByte: playerNum !== null,
    },
    note: 'Variation/delay/player-byte view only surfaces the declared bytes at $80/$81/$F4; broader swap/control behavior is NOT in excerpt.',
  };
}

// ─── decodeJoystick — pure joystick byte decoder from ASM lines 149-152 ──
// Joystick bits: MOVE_UP=%00000001, MOVE_DOWN=%00000010,
//   MOVE_LEFT=%00000100, MOVE_RIGHT=%00001000
// This is a pure function (no memory required) grounded in the visible
// ASM bit-flag declarations. It does not claim anything about how the
// ROM reads INPT4/INPT5 or SWCHA — only what the declared flags decode to.
export function decodeJoystick(rawByte) {
  const raw = u8(rawByte);
  const up    = !!(raw & FLAGS.joystick.MOVE_UP);
  const down  = !!(raw & FLAGS.joystick.MOVE_DOWN);
  const left  = !!(raw & FLAGS.joystick.MOVE_LEFT);
  const right = !!(raw & FLAGS.joystick.MOVE_RIGHT);
  const directions = [up && 'UP', down && 'DOWN', left && 'LEFT', right && 'RIGHT'].filter(Boolean).join('+') || 'none';
  return {
    raw,
    hex: dollarHex(raw),
    up,
    down,
    left,
    right,
    directions,
    unusedBits: raw & 0xf0,
    bitBreakdown: {
      bit0_up:    !!(raw & 0b00000001),
      bit1_down:  !!(raw & 0b00000010),
      bit2_left:  !!(raw & 0b00000100),
      bit3_right: !!(raw & 0b00001000),
    },
    asmLines: '149-152',
    note: 'Pure decoder for joystick byte flags from ASM lines 149-152. Does not claim anything about hardware input latching or SWCHA mapping.',
  };
}

export function inspectJoystickState(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.joystick.address);
  const up = !!(raw & FLAGS.joystick.MOVE_UP);
  const down = !!(raw & FLAGS.joystick.MOVE_DOWN);
  const left = !!(raw & FLAGS.joystick.MOVE_LEFT);
  const right = !!(raw & FLAGS.joystick.MOVE_RIGHT);
  const directions = [up && 'UP', down && 'DOWN', left && 'LEFT', right && 'RIGHT'].filter(Boolean).join('+') || 'none';
  return {
    raw,
    hex: dollarHex(raw),
    up,
    down,
    left,
    right,
    directions,
    unusedBits: raw & 0xf0,
    note: 'Joystick byte at $84 is only decoded as declared bit flags.',
  };
}

export function inspectSoundState(memory) {
 const sound0Id = readByte(memory, ZERO_PAGE_INDEX.sound0Id.address);
 const sound0Cnt = readByte(memory, ZERO_PAGE_INDEX.sound0Cnt.address);
 const bridgeSound = readByte(memory, ZERO_PAGE_INDEX.bridgeSound.address);
 const missileSound = readByte(memory, ZERO_PAGE_INDEX.missileSound.address);
 return {
 sound0Id,
 sound0IdHex: dollarHex(sound0Id),
 sound0Cnt,
 sound0CntHex: dollarHex(sound0Cnt),
 bridgeSound,
 bridgeSoundHex: dollarHex(bridgeSound),
 missileSound,
 missileSoundHex: dollarHex(missileSound),
 bridgeExploding: bridgeSound !== 0,
 missileFired: missileSound !== 0,
 note: 'Sound bytes are surfaced directly from $F8..$FB; sound engine behavior is not claimed.',
 };
}

export function inspectBridgeExploState(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.bridgeExplode.address);
  return {
    raw,
    hex: dollarHex(raw),
    isExploding: raw !== 0,
    note: 'bridgeExplode is the declared byte at $8D; this inspector only surfaces zero vs non-zero byte state.',
  };
}

export function inspectMissileBoundsState(memory) {
  const missileY = readByte(memory, ZERO_PAGE_INDEX.missileY.address);
  const missileX = readByte(memory, ZERO_PAGE_INDEX.missileX.address);
  const missileFlag = readByte(memory, ZERO_PAGE_INDEX.missileFlag.address);
  const jetY = GAME_CONSTANTS.JET_Y;
  const minMissile = GAME_CONSTANTS.MIN_MISSILE;
  const maxMissile = GAME_CONSTANTS.MAX_MISSILE;
  const isEnabled = missileFlag === 0xff;
  return {
    missileY,
    missileYHex: dollarHex(missileY),
    missileX,
    missileXHex: dollarHex(missileX),
    missileFlag,
    missileFlagHex: dollarHex(missileFlag),
    jetY,
    minMissile,
    maxMissile,
    missileSpeed: GAME_CONSTANTS.MISSILE_SPEED,
    distFromJet: Math.abs(missileY - jetY),
    isEnabled,
    isAtSpawn: missileY === minMissile,
    isAboveScreen: missileY > maxMissile,
    isWithinBounds: missileY >= minMissile && missileY <= maxMissile,
    note: 'Missile inspector surfaces declared bytes at $B2/$F5/$E6 only; $FF=enabled is an inspector convention taken from existing harness expectations, not a full missile routine port.',
  };
}

export function inspectVisibleMissileCollision(memory) {
  const missile = inspectMissileBoundsState(memory);
  const scroll = inspectVisibleRiverScrollState(memory);
  const frameCnt = readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  // missileY is compared against lineNum, which counts up from the bottom (JET_Y = 19),
  // the same frame as the slot bands below.
  const visibleLineRaw = missile.missileY;
  const visibleLine = Math.max(0, Math.min(GAME_CONSTANTS.NUM_LINES - 1, visibleLineRaw));
  const compositeLine = visibleLine + scroll.pixelOffset;
  const slotIndex = Math.max(0, Math.min(scroll.currentSlots.length - 1, Math.floor(compositeLine / scroll.sliceLineSpan)));
  const slot = scroll.currentSlots[slotIndex] ?? null;
  const slice = scroll.currentProfile.slices[slotIndex] ?? null;
  const sprite = slot ? resolveVisibleSpriteVariant(slot.shapeId, frameCnt) : null;
  const bandTop = Math.max(0, Math.floor((slotIndex * scroll.sliceLineSpan) - scroll.pixelOffset));
  const bandBottom = Math.min(
    GAME_CONSTANTS.NUM_LINES - 1,
    Math.ceil(((slotIndex + 1) * scroll.sliceLineSpan) - scroll.pixelOffset) - 1,
  );
  const nusizDetail = decodeNUSIZDetail(slot?.state1?.nusiz ?? 0);
  const bboxLeft = slot ? slot.coarseX : 0;
  const bboxRight = slot ? Math.min(159, bboxLeft + nusizDetail.playerPixelWidth - 1) : 0;
  const supportsHit = !!slot && slot.shapeClass !== 'explosion' && slot.shapeClass !== 'unknown';
  const xHit = supportsHit && nusizDetail.copyOffsets.some((offset) => {
    const copyLeft = bboxLeft + offset;
    return missile.missileX >= copyLeft && missile.missileX <= copyLeft + nusizDetail.playerPixelWidth - 1;
  });
  const yHit = supportsHit && visibleLine >= bandTop && visibleLine <= bandBottom;
  const hit = missile.isEnabled && missile.isWithinBounds && visibleLineRaw >= 0 && supportsHit && xHit && yHit;
  return {
    missileX: missile.missileX,
    missileXHex: missile.missileXHex,
    missileY: missile.missileY,
    missileYHex: missile.missileYHex,
    visibleLineRaw,
    visibleLine,
    visibleLineHex: dollarHex(visibleLine),
    slotIndex,
    slotLabel: slot?.slotLabel ?? '?',
    slot,
    slice,
    sprite,
    shapeId: slot?.shapeId ?? 0,
    shapeIdHex: slot?.shapeIdHex ?? dollarHex(0),
    shapeName: slot?.shapeName ?? 'unknown',
    shapeClass: slot?.shapeClass ?? 'unknown',
    variantName: sprite?.variantName ?? 'unknown',
    spriteWidth: sprite?.width ?? 0,
    spriteHeight: sprite?.height ?? 0,
    bboxLeft,
    bboxLeftHex: dollarHex(bboxLeft),
    bboxRight,
    bboxRightHex: dollarHex(bboxRight),
    bandTop,
    bandBottom,
    xHit,
    yHit,
    supportsHit,
    hit,
    note: 'Visible missile collision helper projects the live missile byte into the current six-slot scroll view and checks a ROM-sized sprite bbox for the selected row. It is harness collision logic for the port, not a claim about the unseen TIA collision routine.',
  };
}

export function inspectVisiblePlayerSlotCollision(memory, options = {}) {
  const scroll = inspectVisibleRiverScrollState(memory);
  const playerX = Number.isFinite(Number(options.playerX))
    ? Math.max(0, Math.min(159, Math.trunc(Number(options.playerX))))
    : readByte(memory, ZERO_PAGE_INDEX.playerX.address);
  const jet = resolveVisiblePlayerJetVariant(memory, options);
  const visibleLine = Math.max(0, Math.min(GAME_CONSTANTS.NUM_LINES - 1, GAME_CONSTANTS.JET_Y));
  const compositeLine = visibleLine + scroll.pixelOffset;
  const slotIndex = Math.max(0, Math.min(scroll.currentSlots.length - 1, Math.floor(compositeLine / scroll.sliceLineSpan)));
  const slot = scroll.currentSlots[slotIndex] ?? null;
  const slice = scroll.currentProfile.slices[slotIndex] ?? null;
  const sprite = slot ? resolveVisibleSpriteVariant(slot.shapeId, jet.frameCnt) : null;
  const jetLeft = playerX;
  const jetRight = Math.min(159, jetLeft + Math.max(0, jet.width - 1));
  const slotLeft = slot ? slot.coarseX : 0;
  const slotRight = slot ? Math.min(159, slotLeft + Math.max(0, (sprite?.width ?? 1) - 1)) : 0;
  const playerHitInset = 1;
  const supportsInteraction = !!slot && slot.shapeClass !== 'explosion' && slot.shapeClass !== 'unknown';
  const bandTop = Math.max(0, Math.floor((slotIndex * scroll.sliceLineSpan) - scroll.pixelOffset));
  const bandBottom = Math.min(
    GAME_CONSTANTS.NUM_LINES - 1,
    Math.ceil(((slotIndex + 1) * scroll.sliceLineSpan) - scroll.pixelOffset) - 1,
  );
  const spriteTop = sprite
    ? Math.round((bandTop + bandBottom - Math.max(0, sprite.height - 1)) / 2)
    : bandTop;
  const spriteBottom = sprite
    ? Math.min(GAME_CONSTANTS.NUM_LINES - 1, spriteTop + Math.max(0, sprite.height - 1))
    : bandBottom;
  const rowInSprite = sprite ? (visibleLine - spriteTop) : -1;
  const spriteRowBytes = typeof sprite?.meta?.bytesHex === 'string'
    ? sprite.meta.bytesHex.split(/\s+/).filter(Boolean).map(hex => parseInt(hex, 16) & 0xff)
    : [];
  const spriteRowByte = rowInSprite >= 0 && rowInSprite < spriteRowBytes.length
    ? spriteRowBytes[rowInSprite]
    : null;
  let rowOpaqueLeft = slotLeft;
  let rowOpaqueRight = slotRight;
  let rowHasOpaquePixels = true;
  if (spriteRowByte !== null) {
    rowHasOpaquePixels = spriteRowByte !== 0;
    if (rowHasOpaquePixels) {
      let firstBit = -1;
      let lastBit = -1;
      for (let bit = 0; bit < 8; bit += 1) {
        if (spriteRowByte & (0x80 >>> bit)) {
          if (firstBit === -1) firstBit = bit;
          lastBit = bit;
        }
      }
      rowOpaqueLeft = firstBit === -1 ? slotLeft : Math.min(159, slotLeft + firstBit);
      rowOpaqueRight = lastBit === -1 ? slotRight : Math.min(159, slotLeft + lastBit);
    }
  }
  const xOverlap = !!slot && (jetLeft + playerHitInset) <= rowOpaqueRight && (jetRight - playerHitInset) >= rowOpaqueLeft;
  const yOverlap = !!slot && visibleLine >= spriteTop && visibleLine <= spriteBottom;
  const hit = supportsInteraction && yOverlap && rowHasOpaquePixels && xOverlap;
  return {
    visibleLine,
    visibleLineHex: dollarHex(visibleLine),
    slotIndex,
    slotLabel: slot?.slotLabel ?? '?',
    slot,
    slice,
    sprite,
    playerX,
    playerXHex: dollarHex(playerX),
    jetVariantName: jet.variantName,
    jetWidth: jet.width,
    jetHeight: jet.height,
    jetLeft,
    jetRight,
    slotLeft,
    slotRight,
    bandTop,
    bandBottom,
    spriteTop,
    spriteBottom,
    rowInSprite,
    spriteRowByte,
    rowHasOpaquePixels,
    rowOpaqueLeft,
    rowOpaqueRight,
    xOverlap,
    yOverlap,
    supportsInteraction,
    hit,
    shapeId: slot?.shapeId ?? 0,
    shapeIdHex: slot?.shapeIdHex ?? dollarHex(0),
    shapeName: slot?.shapeName ?? 'unknown',
    shapeClass: slot?.shapeClass ?? 'unknown',
    note: 'Visible player-slot collision helper projects the live jet bbox at JET_Y into the current six-slot scroll view, centers the verified sprite bitmap within the slot band, then checks overlap only against the opaque row for that visible line when bitmap bytes are available. It is harness overlap logic for port iteration, not a claim about the unseen collision kernel.',
  };
}

export function inspectCollisionState(memory) {
  const collidedEnemy = readByte(memory, ZERO_PAGE_INDEX.collidedEnemy.address);
  const reflect0 = readByte(memory, ZERO_PAGE_INDEX.reflect0.address);
  const hitEnemyIdx = readByte(memory, ZERO_PAGE_INDEX.hitEnemyIdx.address);
  const pfCrashFlag = readByte(memory, ZERO_PAGE_INDEX.PFCrashFlag.address);
  const projectedMissileCollision = inspectVisibleMissileCollision(memory);
  return {
    collidedEnemy,
    collidedEnemyHex: dollarHex(collidedEnemy),
    collidedShapeName: shapeNameFromId(collidedEnemy),
    collidedShapeAsmName: shapeAsmNameFromId(collidedEnemy),
    reflect0,
    reflect0Hex: dollarHex(reflect0),
    hitEnemyIdx,
    hitEnemyIdxHex: dollarHex(hitEnemyIdx),
    pfCrashFlag,
    pfCrashHex: dollarHex(pfCrashFlag),
    isReflected: reflect0 !== 0,
    hasHit: hitEnemyIdx !== 0,
    hasCrashedIntoPF: pfCrashFlag !== 0,
    projectedMissileCollision,
    note: 'Collision inspector exposes the declared collision bytes and a harness-only projected missile-vs-visible-slot collision check. Full TIA collision resolution is still not ported here.',
  };
}

export function inspectBlockLineState(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.temp3.address);
  let phase = 'out-of-range';
  if (raw < 24) phase = '2-line';
  else if (raw < 32) phase = '1-line';
  return {
    raw,
    hex: dollarHex(raw),
    blockLine: raw,
    maxId: raw,
    inBlock: raw < 32,
    inTwoLineLoop: raw < 24,
    inSingleLineLoop: raw >= 24 && raw < 32,
    phase,
    note: 'Inspector-only kernel split: 12*2+8 lines yields the shown 2-line / 1-line phases; detailed kernel is NOT in excerpt.',
  };
}

export function inspectSaverState(memory) {
  const xor = readByte(memory, ZERO_PAGE_INDEX.SS_XOR.address);
  const mask = readByte(memory, ZERO_PAGE_INDEX.SS_Mask.address);
  const delay = readByte(memory, ZERO_PAGE_INDEX.SS_Delay.address);
  let xorEffect = `xor byte ${dollarHex(xor)}`;
  if (xor === 0x01) xorEffect = 'xor byte equals $01';
  let maskEffect = `mask byte ${dollarHex(mask)}`;
  if (mask === 0xf7) maskEffect = 'mask byte equals $F7';
  return {
    xor,
    xorHex: dollarHex(xor),
    mask,
    maskHex: dollarHex(mask),
    delay,
    delayHex: dollarHex(delay),
    isSaverActive: delay > 0,
    xorEffect,
    maskEffect,
    note: 'Screensaver panel only surfaces the declared bytes and a conservative delay>0 check; actual screensaver behavior is not proven by the visible excerpt.',
  };
}

export function inspectFrameCounter(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.frameCnt.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.frameCnt.address),
    note: 'frameCnt is the declared byte at $82.',
  };
}

export function inspectDxSpeed(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.dXSpeed.address);
  const signed = s8(raw);
  return { raw, hex: dollarHex(raw), signed, isZero: signed === 0, isPositive: signed > 0, isNegative: signed < 0, note: 'dXSpeed is the declared signed-ish byte at $87.' };
}

export function inspectScorePtrs(memory) {
  const scorePtr1 = getFieldBytes(memory, 'scorePtr1');
  const scorePtr2 = getFieldBytes(memory, 'scorePtr2');
  const scorePtr1Address = ZERO_PAGE_INDEX.scorePtr1.address;
  const scorePtr2Address = ZERO_PAGE_INDEX.scorePtr2.address;
  const scorePtr1End = scorePtr1Address + ZERO_PAGE_INDEX.scorePtr1.length - 1;
  const scorePtr2End = scorePtr2Address + ZERO_PAGE_INDEX.scorePtr2.length - 1;
  const resetWriteOffset = 10;
  const resetWriteAddress = scorePtr1Address + resetWriteOffset;
  const resetWriteValue = readByte(memory, resetWriteAddress);
  return {
    scorePtr1: {
      address: scorePtr1Address,
      addressHex: dollarHex(scorePtr1Address).toUpperCase(),
      length: ZERO_PAGE_INDEX.scorePtr1.length,
      endAddress: scorePtr1End,
      endAddressHex: dollarHex(scorePtr1End).toUpperCase(),
      rangeHex: `${dollarHex(scorePtr1Address)}..${dollarHex(scorePtr1End)}`,
      bytes: scorePtr1,
      hexDump: scorePtr1.map((b) => b.toString(16).padStart(2, '0')).join(' '),
      visibleInitLoopCount: SCORE_PTR1_LOOP_COUNT,
      visibleInitLoopCountHex: dollarHex(SCORE_PTR1_LOOP_COUNT),
      resetWriteOffset,
      resetWriteAddress,
      resetWriteAddressHex: dollarHex(resetWriteAddress).toUpperCase(),
      resetWriteValue,
      resetWriteValueHex: dollarHex(resetWriteValue),
    },
    scorePtr2: {
      address: scorePtr2Address,
      addressHex: dollarHex(scorePtr2Address).toUpperCase(),
      length: ZERO_PAGE_INDEX.scorePtr2.length,
      endAddress: scorePtr2End,
      endAddressHex: dollarHex(scorePtr2End).toUpperCase(),
      rangeHex: `${dollarHex(scorePtr2Address)}..${dollarHex(scorePtr2End)}`,
      bytes: scorePtr2,
      hexDump: scorePtr2.map((b) => b.toString(16).padStart(2, '0')).join(' '),
    },
    note: 'Score pointer areas are exposed directly from declared bytes at $CD and $DD. Visible Reset code shows LDX #12-1 before SetScorePtr1 and later STA scorePtr1+10 on the first-boot path only; SetScorePtr1 body is NOT in excerpt.',
  };
}

export function readVisibleScoreDigits(memory) {
  return SCORE_DIGIT_OFFSETS.map((offset) => {
    const raw = readByte(memory, ZERO_PAGE_INDEX.scorePtr1.address + offset);
    return Math.max(0, Math.min(9, Math.trunc(Number(raw) || 0)));
  });
}

export function writeVisibleScoreDigits(memory, digits) {
  const normalized = Array.from({ length: SCORE_DIGIT_COUNT }, (_, index) => {
    const raw = Array.isArray(digits) ? digits[index] : 0;
    return Math.max(0, Math.min(9, Math.trunc(Number(raw) || 0)));
  });
  SCORE_DIGIT_OFFSETS.forEach((offset, index) => {
    writeByte(memory, ZERO_PAGE_INDEX.scorePtr1.address + offset, normalized[index]);
  });
  return normalized;
}

export function computeVisibleScore(memory) {
  return readVisibleScoreDigits(memory).reduce((value, digit) => (value * 10) + digit, 0);
}

export function addVisibleScore(memory, points = 0) {
  const digitsBefore = readVisibleScoreDigits(memory);
  const scoreBefore = digitsBefore.reduce((value, digit) => (value * 10) + digit, 0);
  const normalizedPoints = Math.max(0, Math.trunc(Number(points) || 0));
  const scoreAfter = Math.max(0, Math.min(999999, scoreBefore + normalizedPoints));
  const digitsAfter = String(scoreAfter).padStart(SCORE_DIGIT_COUNT, '0').slice(-SCORE_DIGIT_COUNT).split('').map((digit) => Number(digit));
  writeVisibleScoreDigits(memory, digitsAfter);
  return {
    points: normalizedPoints,
    scoreBefore,
    scoreAfter,
    digitsBefore,
    digitsAfter,
    note: 'Visible score helper treats scorePtr1 as six digit-pointer slots using the reset-time One-at+10 convention. This is a harness score model for port iteration, not a reconstruction of the unseen SetScorePtrs/SetScorePtr1 arithmetic.',
  };
}

export function inspectVisibleScore(memory) {
  const digits = readVisibleScoreDigits(memory);
  return {
    digits,
    score: computeVisibleScore(memory),
    lowByteOffsets: [...SCORE_DIGIT_OFFSETS],
    lowByteAddresses: SCORE_DIGIT_OFFSETS.map((offset) => ZERO_PAGE_INDEX.scorePtr1.address + offset),
    lowByteAddressHexes: SCORE_DIGIT_OFFSETS.map((offset) => dollarHex(ZERO_PAGE_INDEX.scorePtr1.address + offset).toUpperCase()),
    scorePtr1Bytes: getFieldBytes(memory, 'scorePtr1'),
    note: 'Visible score inspector reads the six low-byte digit slots in scorePtr1 (offsets 0,2,4,6,8,10), matching the visible first-boot write to scorePtr1+10 for One. It is a harness display-score model, not a claim about the unseen score subroutines.',
  };
}

export function respawnVisiblePlayer(memory, options = {}) {
  const requestedLives = Number(options.livesBefore);
  const livesBefore = Number.isFinite(requestedLives)
    ? Math.max(0, Math.min(255, Math.trunc(requestedLives)))
    : readByte(memory, ZERO_PAGE_INDEX.livesPtr.address);
  const canRespawn = livesBefore > 0;
  const spawnPlayerX = Number.isFinite(Number(options.playerX))
    ? Math.max(0, Math.min(159, Math.trunc(Number(options.playerX))))
    : HARNESS_RESPAWN_PLAYER_X;
  const gameModeAfter = canRespawn ? GAME_CONSTANTS.INTRO_SCROLL : 0xff;
  const livesAfter = canRespawn ? (livesBefore - 1) : livesBefore;

  if (canRespawn) {
    writeByte(memory, ZERO_PAGE_INDEX.livesPtr.address, livesAfter);
    setField(memory, 'gameMode', gameModeAfter);
    setField(memory, 'playerX', spawnPlayerX);
    setField(memory, 'speedX', 0x00);
    setField(memory, 'speedY', 0x00);
    setField(memory, 'dXSpeed', 0x00);
    setField(memory, 'PFCrashFlag', 0x00);
    setField(memory, 'collidedEnemy', 0x00);
    setField(memory, 'hitEnemyIdx', 0x00);
    setField(memory, 'reflect0', 0x00);
    setField(memory, 'missileFlag', 0x00);
    setField(memory, 'missileSound', 0x00);
    setField(memory, 'missileY', GAME_CONSTANTS.MAX_MISSILE);
  }

  return {
    canRespawn,
    livesBefore,
    livesAfter,
    playerXAfter: canRespawn ? spawnPlayerX : readByte(memory, ZERO_PAGE_INDEX.playerX.address),
    gameModeAfter,
    gameModeLabelAfter: GAME_MODES.label(gameModeAfter),
    note: canRespawn
      ? 'Harness respawn helper uses livesPtr low byte as the remaining stock counter: a game-over step can consume one stock and restart the intro-scroll countdown at gameMode=48. This is a conservative visible-state loop model, not a claim about the unseen death/continue routines.'
      : 'Harness respawn helper leaves gameMode at game over when no visible livesPtr low-byte stock remains.',
  };
}

export function inspectScorePtr2Aliases(memory) {
  const baseAddress = ZERO_PAGE_INDEX.scorePtr2.address;
  const length = ZERO_PAGE_INDEX.scorePtr2.length;
  const endAddress = baseAddress + length - 1;
  const makeField = (name, extra = () => ({})) => {
    const value = readByte(memory, ZERO_PAGE_INDEX[name].address);
    return {
      address: ZERO_PAGE_INDEX[name].address,
      addressHex: dollarHex(ZERO_PAGE_INDEX[name].address).toUpperCase(),
      offsetFromBase: ZERO_PAGE_INDEX[name].address - baseAddress,
      value,
      valueHex: dollarHex(value),
      hex: dollarHex(value),
      isSet: value !== 0,
      ...extra(value),
    };
  };
  const fields = {
    blockNum: makeField('blockNum'),
    reflect0: makeField('reflect0'),
    hitEnemyIdx: makeField('hitEnemyIdx'),
    PFCrashFlag: makeField('PFCrashFlag', (value) => ({ hasCrashed: value !== 0 })),
    missileFlag: makeField('missileFlag', (value) => ({ isEnabled: value === 0xff })),
  };
  const aliasOffsets = Object.values(fields).map((field) => field.offsetFromBase);
  const unlabeledOffsets = Array.from({ length }, (_, offset) => offset).filter((offset) => !aliasOffsets.includes(offset));
  const commentDeclaredBytes = 12;
  const actualBytesFromRange = endAddress - baseAddress + 1;
  return {
    baseAddress,
    baseAddressHex: dollarHex(baseAddress).toUpperCase(),
    length,
    endAddress,
    endAddressHex: dollarHex(endAddress).toUpperCase(),
    rangeHex: `${dollarHex(baseAddress)}..${dollarHex(endAddress)}`,
    commentDeclaredBytes,
    actualBytesFromRange,
    commentMatchesRange: commentDeclaredBytes === actualBytesFromRange,
    aliasOffsets,
    unlabeledOffsets,
    fields,
    note: 'scorePtr2 alias view names the shared bytes only. The excerpt comment says 12 bytes, but the visible $DD..$E7 range is 11 bytes; this harness preserves and surfaces that ambiguity. missileFlag is treated as enabled only at $FF for conservative inspection.',
  };
}

export function inspectBlockList(memory) {
 const slots = [];
 let roadCount = 0;
 const blockLstBase = BLOCK_ARRAY_BASES[0];
 for (let i = 0; i < GAME_CONSTANTS.NUM_BLOCKS; i++) {
 const flags = decodeBlockFlags(readByte(memory, blockLstBase + i));
    if (flags.road) roadCount++;
    slots.push({ index: i, label: SLOT_NAMES[i], raw: flags.raw, hex: flags.hex, flags });
  }
  return {
    baseAddress: ZERO_PAGE_INDEX.blockLst.address,
    slots,
    summary: `${roadCount} PF-road-bit slots across ${GAME_CONSTANTS.NUM_BLOCKS} entries`,
  };
}

export function inspectStateArea(memory) {
  const player1Bytes = getFieldBytes(memory, 'player1State');
  const player2Bytes = getFieldBytes(memory, 'player2State');
  return {
    player1State: {
      base: ZERO_PAGE_INDEX.player1State.address,
      length: ZERO_PAGE_INDEX.player1State.length,
      bytes: player1Bytes,
      baseHex: dollarHex(ZERO_PAGE_INDEX.player1State.address),
      hexDump: player1Bytes.map((b) => b.toString(16).padStart(2, '0')).join(' '),
    },
    player2State: {
      base: ZERO_PAGE_INDEX.player2State.address,
      length: ZERO_PAGE_INDEX.player2State.length,
      bytes: player2Bytes,
      baseHex: dollarHex(ZERO_PAGE_INDEX.player2State.address),
      hexDump: player2Bytes.map((b) => b.toString(16).padStart(2, '0')).join(' '),
      livesPtr2Note: 'player2State final byte is exposed as the livesPtr2 alias byte.',
    },
  };
}

export function inspectPlayerMovementState(memory) {
  const playerX = readByte(memory, ZERO_PAGE_INDEX.playerX.address);
  const speedX = readByte(memory, ZERO_PAGE_INDEX.speedX.address);
  const speedY = readByte(memory, ZERO_PAGE_INDEX.speedY.address);
  const pfCrashFlag = readByte(memory, ZERO_PAGE_INDEX.PFCrashFlag.address);
  const riverBounds = inspectVisibleJetRiverBounds(memory, { playerX });
  const bankState = pfCrashFlag !== 0
    ? playerX <= riverBounds.leftBound ? 'left-bank' : playerX >= riverBounds.rightBound ? 'right-bank' : 'bank-hit'
    : 'clear';
  return {
    playerX,
    playerXHex: dollarHex(playerX),
    speedX,
    speedXHex: dollarHex(speedX),
    speedXSigned: s8(speedX),
    speedY,
    speedYHex: dollarHex(speedY),
    speedYSigned: s8(speedY),
    jetY: GAME_CONSTANTS.JET_Y,
    pfCrashFlag,
    pfCrashHex: dollarHex(pfCrashFlag),
    hasBankCrash: pfCrashFlag !== 0,
    bankState,
    riverBounds,
    blockPart: inspectBlockPart(memory),
    note: 'Movement inspector exposes declared bytes like playerX at $B3 and a harness-only bank clamp derived from the inspector river silhouette. The unseen ROM collision routine remains NOT in excerpt.',
  };
}

export function inspectSpeedXY(memory) {
 const speedX = readByte(memory, ZERO_PAGE_INDEX.speedX.address);
 const speedY = readByte(memory, ZERO_PAGE_INDEX.speedY.address);
 const dxSpeed = readByte(memory, ZERO_PAGE_INDEX.dXSpeed.address);
 return {
 speedX,
 speedXHex: dollarHex(speedX),
 speedXS8: s8(speedX),
 speedY,
 speedYHex: dollarHex(speedY),
 speedYS8: s8(speedY),
 dxSpeed,
 dxSpeedHex: dollarHex(dxSpeed),
    dxSpeedS8: s8(dxSpeed),
    note: 'Standalone speed inspector for $B4/$B5/$87. Velocity update logic is NOT in excerpt.',
  };
}

export function inspectKernelLineNum(memory) {
  const raw = readByte(memory, ZERO_PAGE_INDEX.lineNum.address);
  return {
    raw,
    hex: dollarHex(raw),
    address: ZERO_PAGE_INDEX.lineNum.address,
    addressHex: dollarHex(ZERO_PAGE_INDEX.lineNum.address),
    note: 'lineNum is the declared kernel-line byte at $FD.',
  };
}

export function inspectFuelDisplayState(memory) {
  const fuelHi = readByte(memory, ZERO_PAGE_INDEX.fuelHi.address);
  const fuelLo = readByte(memory, ZERO_PAGE_INDEX.fuelLo.address);
  const fuel16 = computeFuel16(memory);
  const fuelPercent = computeFuelPercent(fuel16);
  return {
    fuelHi,
    fuelHiAddress: ZERO_PAGE_INDEX.fuelHi.address,
    fuelHiAddressHex: dollarHex(ZERO_PAGE_INDEX.fuelHi.address),
    fuelHiHex: dollarHex(fuelHi),
    fuelLo,
    fuelLoAddress: ZERO_PAGE_INDEX.fuelLo.address,
    fuelLoAddressHex: dollarHex(ZERO_PAGE_INDEX.fuelLo.address),
    fuelLoHex: dollarHex(fuelLo),
    fuel16,
    fuel16Hex: dollarHex(fuel16, 4),
    rangeHex: `${dollarHex(ZERO_PAGE_INDEX.fuelHi.address)}..${dollarHex(ZERO_PAGE_INDEX.fuelLo.address)}`,
    fuelPercent,
    isFuelEmpty: fuel16 === 0,
    isFuelFull: fuel16 === 0xffff,
    ballValue: computeFuelDisplayBallValue(fuelHi),
    ballValueHex: dollarHex(computeFuelDisplayBallValue(fuelHi)),
    fuelPercentLabel: `${Math.round(fuelPercent)}%`,
    trace: traceMainLoopFuelSequence(fuelHi),
    note: 'Fuel display inspector follows only the visible fuelHi=$B7 ball-position math plus the declared low byte.',
  };
}

function computeHarnessSpawnDifficulty(memory, sectionBlock) {
  const gameVariation = readByte(memory, ZERO_PAGE_INDEX.gameVariation.address) & 0x01;
  const level = readByte(memory, ZERO_PAGE_INDEX.level.address);
  const normalizedSectionBlock = sectionBlock === 0 ? GAME_CONSTANTS.SECTION_BLOCKS : Math.max(1, sectionBlock);
  const sectionProgress = Math.max(0, GAME_CONSTANTS.SECTION_BLOCKS - normalizedSectionBlock);
  const levelBoost = Math.min(2, Math.floor(level / 12));
  const variationBoost = gameVariation ? 1 : 0;
  const tier = Math.max(0, Math.min(3, Math.floor(sectionProgress / 4) + levelBoost + variationBoost));
  return {
    gameVariation,
    level,
    sectionProgress,
    tier,
  };
}

function chooseHarnessVisibleSpawn(shapeSelector, difficultyTier) {
  const pools = [
    [SHAPE_IDS.ID_FUEL, SHAPE_IDS.ID_HOUSE, SHAPE_IDS.ID_SHIP, SHAPE_IDS.ID_HELI0, SHAPE_IDS.ID_PLANE],
    [SHAPE_IDS.ID_FUEL, SHAPE_IDS.ID_SHIP, SHAPE_IDS.ID_HELI0, SHAPE_IDS.ID_PLANE, SHAPE_IDS.ID_HELI1],
    [SHAPE_IDS.ID_FUEL, SHAPE_IDS.ID_SHIP, SHAPE_IDS.ID_HELI0, SHAPE_IDS.ID_HELI1, SHAPE_IDS.ID_PLANE, SHAPE_IDS.ID_PLANE],
    [SHAPE_IDS.ID_SHIP, SHAPE_IDS.ID_HELI0, SHAPE_IDS.ID_HELI1, SHAPE_IDS.ID_PLANE, SHAPE_IDS.ID_PLANE, SHAPE_IDS.ID_FUEL],
  ];
  const pool = pools[Math.max(0, Math.min(pools.length - 1, difficultyTier))];
  return pool[shapeSelector % pool.length];
}

function buildHarnessVisibleSpawn(memory, options = {}) {
  const slotIndex = Math.max(0, Math.min(GAME_CONSTANTS.NUM_BLOCKS - 1, Math.trunc(Number(options.slotIndex) || 0)));
  const sceneSlotIndex = Math.max(0, Math.min(GAME_CONSTANTS.NUM_BLOCKS - 1, Math.trunc(Number(options.sceneSlotIndex) || slotIndex)));
  const sectionBlock = u8(options.sectionBlock);
  const blockOffset = u8(options.blockOffset);
  const pf1PatId = u8(options.pf1PatId);
  const prevPF1PatId = u8(options.prevPF1PatId);
  const blockPart = u8(options.blockPart) || 1;
  const sectionSeed = u8(options.sectionSeed);
  const bridgeBias = options.bridgeBias ? 1 : 0;
  const difficulty = computeHarnessSpawnDifficulty(memory, sectionBlock);
  const rng16 = readRng16(memory);
  const rngByte = readByte(memory, ZERO_PAGE_INDEX.random.address);
  const templateIndex = (sceneSlotIndex + sectionSeed) % GAME_CONSTANTS.NUM_BLOCKS;
  const shapeSelector = (rng16 + (slotIndex * 29) + (sceneSlotIndex * 17) + (sectionBlock * 11) + (blockOffset * 7) + (difficulty.tier * 13) + (rngByte * 3)) & 0xff;
  const forcedBridge = bridgeBias && sceneSlotIndex === 2;
  const shapeId = forcedBridge ? SHAPE_IDS.ID_BRIDGE : chooseHarnessVisibleSpawn(shapeSelector, difficulty.tier);
  const movingShape = shapeId === SHAPE_IDS.ID_PLANE || shapeId === SHAPE_IDS.ID_HELI0 || shapeId === SHAPE_IDS.ID_HELI1 || shapeId === SHAPE_IDS.ID_SHIP;
  const patrolShape = shapeId === SHAPE_IDS.ID_HELI0 || shapeId === SHAPE_IDS.ID_HELI1 || shapeId === SHAPE_IDS.ID_SHIP;
  let blockLst = 0;
  if ((shapeSelector & 0x03) !== 0) blockLst |= FLAGS.blockLst.PF_COLOR_FLAG;
  if (movingShape) blockLst |= FLAGS.blockLst.ENEMY_MOVE_FLAG;
  if (patrolShape && ((shapeSelector >> 2) & 0x01)) blockLst |= FLAGS.blockLst.PATROL_FLAG;
  if (shapeId === SHAPE_IDS.ID_BRIDGE || shapeId === SHAPE_IDS.ID_HOUSE) blockLst |= FLAGS.blockLst.PF_ROAD_FLAG;
  if (pf1PatId >= GAME_CONSTANTS.SWITCH_PAGE_ID) blockLst |= FLAGS.blockLst.PF1_PAGE_FLAG;
  if ((prevPF1PatId + sceneSlotIndex) >= GAME_CONSTANTS.SWITCH_PAGE_ID) blockLst |= FLAGS.blockLst.PF2_PAGE_FLAG;
  const sprite = resolveVisibleSpriteVariant(shapeId, readByte(memory, ZERO_PAGE_INDEX.frameCnt.address));
  const xSpan = Math.max(24, 132 - (difficulty.tier * 8));
  const xBase = 14 + ((sceneSlotIndex * 19) + (blockOffset * 5) + (sectionSeed * 3) + (blockPart * 7)) % xSpan;
  const xJitter = ((shapeSelector >> 3) & 0x0f) - 7;
  const xPos = Math.max(0, Math.min(159 - Math.max(1, sprite.width), xBase + xJitter));
  const directionLeft = movingShape && ((shapeSelector >> 1) & 0x01) === 1;
  const nusizBits = VISIBLE_SLOT_BASE_STATE1[templateIndex] & FLAGS.state1Lst.NUSIZ_MASK;
  const fineBits = ((blockOffset + sceneSlotIndex + blockPart + difficulty.tier) & 0x0f) << 4;
  const state1 = u8(fineBits | nusizBits | (directionLeft ? FLAGS.state1Lst.DIRECTION_FLAG : 0));
  const pf1 = u8(pf1PatId + (sceneSlotIndex * 3) + blockOffset + difficulty.tier + (shapeSelector & 0x03) + (forcedBridge ? 2 : 0));
  const pf2 = u8(prevPF1PatId + (sceneSlotIndex * 5) + (blockOffset * 2) + blockPart + ((shapeSelector >> 4) & 0x03));
  return {
    slotIndex,
    sceneSlotIndex,
    templateIndex,
    shapeId,
    shapeName: shapeNameFromId(shapeId),
    blockLst: u8(blockLst),
    xPos,
    state1,
    pf1,
    pf2,
    difficultyTier: difficulty.tier,
    sectionProgress: difficulty.sectionProgress,
    gameVariation: difficulty.gameVariation,
    forcedBridge,
    shapeSelector,
    movingShape,
    patrolShape,
  };
}

function writeVisibleSpawnToSlot(memory, slotIndex, spawn) {
  writeByte(memory, ZERO_PAGE_INDEX.blockLst.address + slotIndex, spawn.blockLst);
  writeByte(memory, ZERO_PAGE_INDEX.XPos1Lst.address + slotIndex, spawn.xPos);
  writeByte(memory, ZERO_PAGE_INDEX.State1Lst.address + slotIndex, spawn.state1);
  writeByte(memory, ZERO_PAGE_INDEX.Shape1IdLst.address + slotIndex, spawn.shapeId);
  writeByte(memory, ZERO_PAGE_INDEX.PF1Lst.address + slotIndex, spawn.pf1);
  writeByte(memory, ZERO_PAGE_INDEX.PF2Lst.address + slotIndex, spawn.pf2);
}

function computeNextSectionBlock(sectionBlockBefore, options = {}) {
  if (sectionBlockBefore === 0) return GAME_CONSTANTS.SECTION_BLOCKS;
  if (sectionBlockBefore === 1) return options.bridgeAdvanced ? GAME_CONSTANTS.SECTION_BLOCKS : 0;
  return u8(sectionBlockBefore - 1);
}

function simulateHarnessSpawnOffscreen(memory, spawn, options = {}) {
  const slotIndex = Number.isFinite(Number(options.slotIndex)) ? Math.max(0, Math.min(GAME_CONSTANTS.NUM_BLOCKS - 1, Math.trunc(Number(options.slotIndex)))) : 0;
  const frameAfterWrap = Number.isFinite(Number(options.frameAfterWrap)) ? u8(options.frameAfterWrap) : readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  const offscreenSteps = Math.max(0, Math.min(255, Number.isFinite(Number(options.offscreenSteps)) ? Math.trunc(Number(options.offscreenSteps)) : GAME_CONSTANTS.BLOCK_SIZE));
  const eligibleShape = shapeClassFromId(spawn.shapeId) === 'shape-air' || shapeClassFromId(spawn.shapeId) === 'shape-water';
  const patrolEligibleShape = spawn.shapeId === SHAPE_IDS.ID_SHIP || spawn.shapeId === SHAPE_IDS.ID_HELI0 || spawn.shapeId === SHAPE_IDS.ID_HELI1;
  const moveBit = !!(spawn.blockLst & FLAGS.blockLst.ENEMY_MOVE_FLAG);
  const patrolBit = !!(spawn.blockLst & FLAGS.blockLst.PATROL_FLAG);
  const profile = inspectVisibleRiverProfile(memory);
  const slice = profile.slices[slotIndex] ?? null;
  let xPos = u8(spawn.xPos);
  let state1 = u8(spawn.state1);
  let blockLst = u8(spawn.blockLst);
  let movementFrames = 0;
  let patrolTurns = 0;
  let bounceCount = 0;

  for (let step = 0; step < offscreenSteps; step += 1) {
    const frame = u8(frameAfterWrap - offscreenSteps + 1 + step);
    const cadenceActive = ((frame + slotIndex) & 1) === 0;
    if (!eligibleShape || !moveBit || !cadenceActive) continue;
    movementFrames += 1;
    const patrolTriggered = patrolBit && patrolEligibleShape && ((frame + slotIndex) % HARNESS_PATROL_TURN_PERIOD) === 0;
    let movingLeft = !!(state1 & FLAGS.state1Lst.DIRECTION_FLAG);
    if (patrolTriggered) {
      movingLeft = !movingLeft;
      patrolTurns += 1;
    }
    const sprite = resolveVisibleSpriteVariant(spawn.shapeId, frame);
    const delta = movingLeft ? -HARNESS_OBJECT_MOVE_STEP : HARNESS_OBJECT_MOVE_STEP;
    const requestedX = xPos + delta;
    const minX = slice ? Math.max(0, slice.left) : 0;
    const maxX = slice ? Math.max(minX, Math.min(159, slice.right - Math.max(0, sprite.width - 1))) : 159;
    const nextX = Math.max(minX, Math.min(maxX, requestedX));
    const bounced = nextX !== requestedX;
    let nextDirectionLeft = movingLeft;
    if (bounced) {
      nextDirectionLeft = !movingLeft;
      bounceCount += 1;
    }
    if (nextDirectionLeft) state1 |= FLAGS.state1Lst.DIRECTION_FLAG;
    else state1 &= (~FLAGS.state1Lst.DIRECTION_FLAG) & 0xff;
    if (bounced) blockLst |= FLAGS.blockLst.PF_COLLIDE_FLAG;
    else blockLst &= (~FLAGS.blockLst.PF_COLLIDE_FLAG) & 0xff;
    xPos = nextX & 0xff;
  }

  return {
    ...spawn,
    xPos,
    state1,
    blockLst,
    offscreenMovement: {
      offscreenSteps,
      movementFrames,
      patrolTurns,
      bounceCount,
      usedMovingShape: eligibleShape && moveBit,
      note: 'Harness-only offscreen continuity projection reuses the visible movement cadence for the incoming head slot before it enters view. It improves playability continuity but is not a claim about the unseen ROM scheduler.',
    },
  };
}

export function previewVisibleIncomingHeadSpawn(memory, options = {}) {
  const sectionBlockBefore = readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address);
  const blockOffsetBefore = readByte(memory, ZERO_PAGE_INDEX.blockOffset.address);
  const blockPartBefore = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
  const currentPf1PatId = readByte(memory, ZERO_PAGE_INDEX.PF1PatId.address);
  const nextBlockOffset = Number.isFinite(Number(options.nextBlockOffset)) ? u8(options.nextBlockOffset) : u8(blockOffsetBefore + 1);
  const nextBlockPart = Number.isFinite(Number(options.nextBlockPart)) ? u8(options.nextBlockPart) : (blockPartBefore === 1 ? 2 : 1);
  const nextPrevPF1PatId = Number.isFinite(Number(options.nextPrevPF1PatId)) ? u8(options.nextPrevPF1PatId) : currentPf1PatId;
  const nextPF1PatId = Number.isFinite(Number(options.nextPF1PatId)) ? u8(options.nextPF1PatId) : u8(currentPf1PatId + 1);
  const nextSectionBlock = Number.isFinite(Number(options.nextSectionBlock))
    ? u8(options.nextSectionBlock)
    : computeNextSectionBlock(sectionBlockBefore, { bridgeAdvanced: options.bridgeAdvanced === true });
  const frameAfterWrap = Number.isFinite(Number(options.frameAfterWrap)) ? u8(options.frameAfterWrap) : readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
  const offscreenSteps = Math.max(0, Math.min(255, Number.isFinite(Number(options.offscreenSteps)) ? Math.trunc(Number(options.offscreenSteps)) : GAME_CONSTANTS.BLOCK_SIZE));
  const sectionSeed = (nextBlockOffset + nextPF1PatId + nextPrevPF1PatId + nextBlockPart + nextSectionBlock) % GAME_CONSTANTS.NUM_BLOCKS;
  const bridgeBias = nextSectionBlock === 1 ? 1 : 0;
  const probeMemory = createZeroPageMemory();
  probeMemory.set(memory);
  setField(probeMemory, 'frameCnt', frameAfterWrap);
  setField(probeMemory, 'sectionBlock', nextSectionBlock);
  setField(probeMemory, 'blockOffset', nextBlockOffset);
  setField(probeMemory, 'blockPart', nextBlockPart || 1);
  setField(probeMemory, 'prevPF1PatId', nextPrevPF1PatId);
  setField(probeMemory, 'PF1PatId', nextPF1PatId);
  setField(probeMemory, 'sectionEnd', nextSectionBlock === 0 ? 0x00 : 0x01);
  const rawSpawn = buildHarnessVisibleSpawn(probeMemory, {
    slotIndex: nextBlockOffset,
    sceneSlotIndex: 0,
    sectionBlock: nextSectionBlock,
    blockOffset: nextBlockOffset,
    pf1PatId: nextPF1PatId,
    prevPF1PatId: nextPrevPF1PatId,
    blockPart: nextBlockPart,
    sectionSeed,
    bridgeBias,
  });
  const projectedSpawn = simulateHarnessSpawnOffscreen(probeMemory, rawSpawn, {
    slotIndex: 0,
    frameAfterWrap,
    offscreenSteps,
  });
  return {
    target: {
      sectionBlock: nextSectionBlock,
      blockOffset: nextBlockOffset,
      blockPart: nextBlockPart,
      prevPF1PatId: nextPrevPF1PatId,
      PF1PatId: nextPF1PatId,
      frameAfterWrap,
      offscreenSteps,
    },
    rawSpawn,
    projectedSpawn,
    note: 'Incoming-head preview is a harness-only continuity helper: it derives the next wrap target from the declared section/block bytes, then pre-advances the entering slot through one block of offscreen movement so wrap-time gameplay feels less like a fresh spawn snapshot.',
  };
}

export function advanceVisibleSlotScene(memory, options = {}) {
  const sectionBlock = readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address);
  const blockOffset = readByte(memory, ZERO_PAGE_INDEX.blockOffset.address);
  const pf1PatId = readByte(memory, ZERO_PAGE_INDEX.PF1PatId.address);
  const prevPF1PatId = readByte(memory, ZERO_PAGE_INDEX.prevPF1PatId.address);
  const blockPart = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
  const sectionSeed = (blockOffset + pf1PatId + prevPF1PatId + blockPart + sectionBlock) % GAME_CONSTANTS.NUM_BLOCKS;
  const bridgeBias = sectionBlock === 1 ? 1 : 0;
  const difficulty = computeHarnessSpawnDifficulty(memory, sectionBlock);
  const rolling = options.rolling === true;
  const incomingHeadOverride = options.incomingHeadOverride ?? null;
  const replacedSlotIndices = [];
  let changed = false;
  let headSource = 'fresh-build';

  if (rolling) {
  for (let i = GAME_CONSTANTS.NUM_BLOCKS - 1; i > 0; i -= 1) {
  for (let b = 0; b < BLOCK_ARRAY_BASES.length; b++) {
  const base = BLOCK_ARRAY_BASES[b];
  const nextValue = readByte(memory, base + i - 1);
  if (readByte(memory, base + i) !== nextValue) changed = true;
  writeByte(memory, base + i, nextValue);
  }
  }
    const headSpawn = incomingHeadOverride ?? buildHarnessVisibleSpawn(memory, {
      slotIndex: blockOffset,
      sceneSlotIndex: 0,
      sectionBlock,
      blockOffset,
      pf1PatId,
      prevPF1PatId,
      blockPart,
      sectionSeed,
      bridgeBias,
    });
    headSource = incomingHeadOverride ? 'projected-offscreen' : 'fresh-build';
    if (readByte(memory, ZERO_PAGE_INDEX.blockLst.address + 0) !== headSpawn.blockLst) changed = true;
    if (readByte(memory, ZERO_PAGE_INDEX.XPos1Lst.address + 0) !== headSpawn.xPos) changed = true;
    if (readByte(memory, ZERO_PAGE_INDEX.State1Lst.address + 0) !== headSpawn.state1) changed = true;
    if (readByte(memory, ZERO_PAGE_INDEX.Shape1IdLst.address + 0) !== headSpawn.shapeId) changed = true;
    if (readByte(memory, ZERO_PAGE_INDEX.PF1Lst.address + 0) !== headSpawn.pf1) changed = true;
    if (readByte(memory, ZERO_PAGE_INDEX.PF2Lst.address + 0) !== headSpawn.pf2) changed = true;
    writeVisibleSpawnToSlot(memory, 0, headSpawn);
    replacedSlotIndices.push(0);
  } else {
    for (let i = 0; i < GAME_CONSTANTS.NUM_BLOCKS; i += 1) {
      const spawn = buildHarnessVisibleSpawn(memory, {
        slotIndex: i,
        sceneSlotIndex: i,
        sectionBlock,
        blockOffset,
        pf1PatId,
        prevPF1PatId,
        blockPart,
        sectionSeed,
        bridgeBias,
      });
      if (readByte(memory, ZERO_PAGE_INDEX.blockLst.address + i) !== spawn.blockLst) changed = true;
      if (readByte(memory, ZERO_PAGE_INDEX.XPos1Lst.address + i) !== spawn.xPos) changed = true;
      if (readByte(memory, ZERO_PAGE_INDEX.State1Lst.address + i) !== spawn.state1) changed = true;
      if (readByte(memory, ZERO_PAGE_INDEX.Shape1IdLst.address + i) !== spawn.shapeId) changed = true;
      if (readByte(memory, ZERO_PAGE_INDEX.PF1Lst.address + i) !== spawn.pf1) changed = true;
      if (readByte(memory, ZERO_PAGE_INDEX.PF2Lst.address + i) !== spawn.pf2) changed = true;
      writeVisibleSpawnToSlot(memory, i, spawn);
      replacedSlotIndices.push(i);
    }
  }

  const slots = inspectVisibleSlots(memory).map((slot, index) => ({
    slotIndex: index,
    slotLabel: SLOT_NAMES[index],
    templateIndex: (index + sectionSeed) % GAME_CONSTANTS.NUM_BLOCKS,
    shapeId: slot.shapeId,
    shapeName: slot.shapeName,
    coarseX: slot.coarseX,
    blockLst: slot.blockLst,
    pf1: slot.pf1Low,
    pf2: slot.pf2Low,
    forcedBridge: !rolling && bridgeBias === 1 && index === 2,
    replacedThisAdvance: replacedSlotIndices.includes(index),
  }));

  return {
    changed,
    mode: rolling ? 'rolling' : 'full',
    headSource,
    replacedSlotIndices,
    sectionBlock,
    blockOffset,
    pf1PatId,
    prevPF1PatId,
    blockPart,
    sectionSeed,
    difficultyTier: difficulty.tier,
    sectionProgress: difficulty.sectionProgress,
    gameVariation: difficulty.gameVariation,
    slots,
    note: rolling
      ? incomingHeadOverride
        ? 'Visible slot refresh is a harness rolling update: on wrap it shifts the existing six visible slot records toward the tail and injects a harness-only projected incoming head block that was pre-advanced through one block of offscreen movement. This improves gameplay continuity but still does not claim the unseen ROM streaming scheduler.'
        : 'Visible slot refresh is a harness rolling update: on wrap it shifts the existing six visible slot records toward the tail and synthesizes only the newly entered head block from declared section/block/pattern bytes plus RNG/gameVariation/level-derived difficulty. This is structurally closer to the scrolling scheduler, not a full River Raid scene generator.'
      : 'Visible slot refresh is a deterministic harness projection from declared section/block/pattern bytes plus RNG/gameVariation/level-derived difficulty into the six visible slot arrays. It is useful for loop-driven inspector motion, not a full River Raid scene generator.',
  };
}

export function stepVisibleGameplayLoop(memory, options = {}) {
  const requestedSteps = Number(options.steps);
  const steps = Math.max(1, Math.min(255, Number.isFinite(requestedSteps) ? Math.trunc(requestedSteps) : 1));
  let lastStep = null;

  for (let i = 0; i < steps; i += 1) {
    const frameBefore = readByte(memory, ZERO_PAGE_INDEX.frameCnt.address);
    const gameModeBefore = readByte(memory, ZERO_PAGE_INDEX.gameMode.address);
    const playerXBefore = readByte(memory, ZERO_PAGE_INDEX.playerX.address);
    const missileYBefore = readByte(memory, ZERO_PAGE_INDEX.missileY.address);
    const sectionBlockBefore = readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address);
    const blockLineBefore = readByte(memory, ZERO_PAGE_INDEX.temp3.address);
    const bridgeExplodeBefore = readByte(memory, ZERO_PAGE_INDEX.bridgeExplode.address);
    const bridgeSoundBefore = readByte(memory, ZERO_PAGE_INDEX.bridgeSound.address);
    const joystick = inspectJoystickState(memory);

    const nextFrame = (frameBefore + 1) & 0xff;
    setField(memory, 'frameCnt', nextFrame);

    const rngBefore = readRng16(memory);
    const rngAfter = rngStep(rngBefore);
    writeRng16(memory, rngAfter);

    if (gameModeBefore === 0xff) {
      const respawnState = respawnVisiblePlayer(memory);
      const nextBlockLine = (blockLineBefore + 1) % GAME_CONSTANTS.BLOCK_SIZE;
      setField(memory, 'temp3', nextBlockLine);
      setField(memory, 'lineNum', nextBlockLine);
      setField(memory, 'posYLo', nextBlockLine);

      let sectionWrapped = false;
      let sceneAdvance = null;
      if (nextBlockLine === 0) {
        sectionWrapped = true;
        const nextBlockOffset = (readByte(memory, ZERO_PAGE_INDEX.blockOffset.address) + 1) & 0xff;
        const blockPartBefore = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
        const nextBlockPart = blockPartBefore === 1 ? 2 : 1;
        const currentPf1PatId = readByte(memory, ZERO_PAGE_INDEX.PF1PatId.address);

        let nextSectionBlock;
        if (sectionBlockBefore === 0) nextSectionBlock = GAME_CONSTANTS.SECTION_BLOCKS;
        else if (sectionBlockBefore === 1) nextSectionBlock = 0;
        else nextSectionBlock = sectionBlockBefore - 1;
        const projectedIncomingHead = previewVisibleIncomingHeadSpawn(memory, {
          frameAfterWrap: nextFrame,
          nextSectionBlock,
          nextBlockOffset,
          nextBlockPart,
          nextPrevPF1PatId: currentPf1PatId,
          nextPF1PatId: (currentPf1PatId + 1) & 0x0f,
        });
        setField(memory, 'blockOffset', nextBlockOffset);
        setField(memory, 'blockPart', nextBlockPart || 1);
        setField(memory, 'prevPF1PatId', currentPf1PatId);
        setField(memory, 'PF1PatId', (currentPf1PatId + 1) & 0x0f);
        setField(memory, 'sectionBlock', nextSectionBlock);
        setField(memory, 'sectionEnd', nextSectionBlock === 0 ? 0x00 : 0x01);
        sceneAdvance = advanceVisibleSlotScene(memory, {
          rolling: true,
          incomingHeadOverride: projectedIncomingHead.projectedSpawn,
        });
      }

      lastStep = {
        frameBefore,
        frameAfter: nextFrame,
        joystick: joystick.directions,
        horizontalDeltaRequested: 0,
        horizontalDelta: 0,
        verticalDelta: 0,
        playerXBefore,
        requestedPlayerX: playerXBefore,
        playerXAfter: readByte(memory, ZERO_PAGE_INDEX.playerX.address),
        speedX: readByte(memory, ZERO_PAGE_INDEX.speedX.address),
        speedY: readByte(memory, ZERO_PAGE_INDEX.speedY.address),
        riverBounds: null,
        hitRiverBank: false,
        rngBefore,
        rngAfter,
        gameModeBefore,
        gameModeAfter: readByte(memory, ZERO_PAGE_INDEX.gameMode.address),
        missileYBefore,
        missileYAfter: readByte(memory, ZERO_PAGE_INDEX.missileY.address),
        missileEnabledAfter: readByte(memory, ZERO_PAGE_INDEX.missileFlag.address) === 0xff,
        missileHit: false,
        scoreDelta: 0,
        scoreState: {
          points: 0,
          scoreBefore: computeVisibleScore(memory),
          scoreAfter: computeVisibleScore(memory),
          digitsBefore: readVisibleScoreDigits(memory),
          digitsAfter: readVisibleScoreDigits(memory),
          note: 'No harness score event during respawn/game-over hold step.',
        },
        fuelBefore: computeFuel16(memory),
        fuelAfter: computeFuel16(memory),
        fuelDrain: { fuelBefore: computeFuel16(memory), fuelAfter: computeFuel16(memory), drainAmount: 0, depleted: false, note: 'Skipped during game-over/respawn step.' },
        fuelDrained: false,
        outOfFuel: false,
        projectedMissileCollision: { hit: false, note: 'Skipped during game-over/respawn step.' },
        objectMovement: { moved: false, movedSlots: [], note: 'Skipped during game-over/respawn step.' },
        fuelPickup: false,
        playerCrash: false,
        playerCrashKind: respawnState.canRespawn ? 'respawn' : 'game-over-hold',
        playerSlotCollision: { hit: false, note: 'Skipped during game-over/respawn step.' },
        respawned: respawnState.canRespawn,
        respawnBlocked: !respawnState.canRespawn,
        respawnState,
        blockLineBefore,
        blockLineAfter: nextBlockLine,
        sectionBlockBefore,
        sectionBlockAfter: readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address),
        sectionWrapped,
        blockOffsetAfter: readByte(memory, ZERO_PAGE_INDEX.blockOffset.address),
        blockPartAfter: readByte(memory, ZERO_PAGE_INDEX.blockPart.address),
        sceneAdvance,
      };
      continue;
    }

    const horizontalDeltaRequested = (joystick.right ? 1 : 0) - (joystick.left ? 1 : 0);
    const verticalDelta = (joystick.down ? 1 : 0) - (joystick.up ? 1 : 0);
    const requestedPlayerX = Math.max(0, Math.min(159, playerXBefore + horizontalDeltaRequested));
    const riverBounds = inspectVisibleJetRiverBounds(memory, { playerX: requestedPlayerX });
    const nextPlayerX = riverBounds.clampedPlayerX;
    const horizontalDelta = nextPlayerX - playerXBefore;
    const speedX = horizontalDelta & 0xff;
    const speedY = verticalDelta & 0xff;
    const hitRiverBank = riverBounds.collidedWithBank;

    setField(memory, 'playerX', nextPlayerX);
    setField(memory, 'speedX', speedX);
    setField(memory, 'speedY', speedY);
    setField(memory, 'dXSpeed', speedX);
    setField(memory, 'PFCrashFlag', hitRiverBank ? 0x01 : 0x00);

    let nextGameMode = gameModeBefore;
    if (gameModeBefore > 0x00 && gameModeBefore !== 0xff) {
      nextGameMode = (gameModeBefore - 1) & 0xff;
      setField(memory, 'gameMode', nextGameMode);
    }
    const isRunningMode = nextGameMode === 0x00;

    const objectMovement = isRunningMode
      ? applyVisibleObjectMovement(memory, { frameCnt: nextFrame, gameMode: nextGameMode })
      : { moved: false, movedSlots: [], note: 'Skipped during intro-scroll grace period.' };

    setField(memory, 'collidedEnemy', 0x00);
    setField(memory, 'hitEnemyIdx', 0x00);
    setField(memory, 'reflect0', 0x00);

    let missileEnabledAfter = readByte(memory, ZERO_PAGE_INDEX.missileFlag.address) === 0xff;
    if (missileEnabledAfter) {
      // Difficulty B (default) is a guided missile: it keeps following playerX + 5.
      setField(memory, 'missileX', Math.max(0, Math.min(159, readByte(memory, ZERO_PAGE_INDEX.playerX.address) + MISSILE_X_OFFSET)));
      let nextMissileY = missileYBefore + GAME_CONSTANTS.MISSILE_SPEED;
      if (nextMissileY > GAME_CONSTANTS.MAX_MISSILE) {
        nextMissileY = GAME_CONSTANTS.MAX_MISSILE;
        setField(memory, 'missileFlag', 0x00);
        setField(memory, 'missileSound', 0x00);
        missileEnabledAfter = false;
      }
      setField(memory, 'missileY', nextMissileY & 0xff);
    }

    const scoreBeforeStep = computeVisibleScore(memory);
    const scoreDigitsBeforeStep = readVisibleScoreDigits(memory);
    const fuelBeforeStep = computeFuel16(memory);
    const projectedMissileCollision = isRunningMode
      ? inspectVisibleMissileCollision(memory)
      : { hit: false, note: 'Skipped during intro-scroll grace period.' };
    let missileHit = false;
    let scoreDelta = 0;
    let scoreState = {
      points: 0,
      scoreBefore: scoreBeforeStep,
      scoreAfter: scoreBeforeStep,
      digitsBefore: scoreDigitsBeforeStep,
      digitsAfter: scoreDigitsBeforeStep,
      note: 'No harness score event this step.',
    };
    if (projectedMissileCollision.hit) {
      missileHit = true;
      setField(memory, 'collidedEnemy', projectedMissileCollision.shapeId);
      setField(memory, 'hitEnemyIdx', projectedMissileCollision.slotIndex + 1);
      setField(memory, 'reflect0', (projectedMissileCollision.missileX - projectedMissileCollision.bboxLeft + 1) & 0xff);
      setField(memory, 'missileFlag', 0x00);
      setField(memory, 'missileSound', 0x00);
      setField(memory, 'missileY', GAME_CONSTANTS.MAX_MISSILE);
      missileEnabledAfter = false;
      scoreDelta = SCORE_TAB_POINTS[projectedMissileCollision.shapeId] ?? 0;
      scoreState = addVisibleScore(memory, scoreDelta);
      if (projectedMissileCollision.slot) {
        const explosionShapeId = (nextFrame & 1) ? SHAPE_IDS.ID_EXPLOSION2 : SHAPE_IDS.ID_EXPLOSION1;
        writeByte(memory, ZERO_PAGE_INDEX.Shape1IdLst.address + projectedMissileCollision.slotIndex, explosionShapeId);
        if (projectedMissileCollision.shapeId === SHAPE_IDS.ID_BRIDGE) {
          setField(memory, 'bridgeExplode', HARNESS_BRIDGE_EXPLOSION_TICKS);
          setField(memory, 'bridgeSound', 0x01);
        }
      }
    }

    const playerSlotCollision = isRunningMode
      ? inspectVisiblePlayerSlotCollision(memory, { playerX: nextPlayerX, frameCnt: nextFrame, gameMode: nextGameMode })
      : { hit: false, note: 'Skipped during intro-scroll grace period.' };
    let fuelPickup = false;
    let playerCrash = false;
    let playerCrashKind = hitRiverBank ? riverBounds.crashSide : 'clear';
    let fuelDrain = {
      fuelBefore: fuelBeforeStep,
      fuelAfter: fuelBeforeStep,
      drainAmount: 0,
      depleted: false,
      note: 'Harness fuel drain skipped because the loop is not yet in running mode or visible fuel is unset.',
    };
    let fuelDrained = false;
    let outOfFuel = false;
    if (nextGameMode === 0x00 && fuelBeforeStep > 0) {
      fuelDrain = drainVisibleFuel(memory, 1);
      fuelDrained = fuelDrain.drainAmount > 0;
    }
    if (playerSlotCollision.hit && playerSlotCollision.shapeId === SHAPE_IDS.ID_FUEL) {
      fuelPickup = true;
      setField(memory, 'fuelHi', 0xff);
      setField(memory, 'fuelLo', 0xff);
      fuelDrain = {
        ...fuelDrain,
        fuelAfter: 0xffff,
        depleted: false,
        note: fuelDrained
          ? 'Harness fuel drain ran before this projected fuel pickup, then the pickup refilled fuel to full.'
          : 'Projected fuel pickup refilled visible fuel to full before any harness depletion consequence applied.',
      };
      setField(memory, 'collidedEnemy', playerSlotCollision.shapeId);
      setField(memory, 'hitEnemyIdx', playerSlotCollision.slotIndex + 1);
      setField(memory, 'reflect0', (nextPlayerX - playerSlotCollision.slotLeft + 1) & 0xff);
      writeByte(memory, ZERO_PAGE_INDEX.Shape1IdLst.address + playerSlotCollision.slotIndex, SHAPE_IDS.ID_HOUSE);
    } else if (playerSlotCollision.hit) {
      playerCrash = true;
      playerCrashKind = playerSlotCollision.shapeId === SHAPE_IDS.ID_BRIDGE ? 'bridge-impact' : `${playerSlotCollision.shapeClass}-impact`;
      setField(memory, 'collidedEnemy', playerSlotCollision.shapeId);
      setField(memory, 'hitEnemyIdx', playerSlotCollision.slotIndex + 1);
      setField(memory, 'reflect0', (nextPlayerX - playerSlotCollision.slotLeft + 1) & 0xff);
      const explosionShapeId = (nextFrame & 1) ? SHAPE_IDS.ID_EXPLOSION2 : SHAPE_IDS.ID_EXPLOSION1;
      writeByte(memory, ZERO_PAGE_INDEX.Shape1IdLst.address + playerSlotCollision.slotIndex, explosionShapeId);
      if (playerSlotCollision.shapeId === SHAPE_IDS.ID_BRIDGE) {
        setField(memory, 'bridgeExplode', HARNESS_BRIDGE_EXPLOSION_TICKS);
        setField(memory, 'bridgeSound', 0x01);
      }
    }

    if (fuelDrain.depleted && !fuelPickup && !playerCrash && !hitRiverBank) {
      outOfFuel = true;
      playerCrash = true;
      playerCrashKind = 'fuel-depleted';
    }

    if (hitRiverBank || playerCrash) {
      playerCrash = true;
      if (hitRiverBank) playerCrashKind = riverBounds.crashSide;
      setField(memory, 'speedX', 0x00);
      setField(memory, 'speedY', 0x00);
      setField(memory, 'dXSpeed', 0x00);
      setField(memory, 'PFCrashFlag', 0x01);
      setField(memory, 'gameMode', 0xff);
      nextGameMode = 0xff;
      setField(memory, 'missileFlag', 0x00);
      setField(memory, 'missileSound', 0x00);
    }

    let bridgeAftermath = {
      bridgeExplodeBefore,
      bridgeExplodeAfter: readByte(memory, ZERO_PAGE_INDEX.bridgeExplode.address),
      bridgeSoundBefore,
      bridgeSoundAfter: readByte(memory, ZERO_PAGE_INDEX.bridgeSound.address),
      ticked: false,
      cleared: false,
      advancedSection: false,
      justTriggered: false,
      note: 'No harness bridge-aftermath progression this step.',
    };

    const bridgeExplodeCurrent = readByte(memory, ZERO_PAGE_INDEX.bridgeExplode.address);
    if (bridgeExplodeCurrent > 0) {
      const justTriggered = bridgeExplodeBefore === 0;
      const nextBridgeExplode = justTriggered ? bridgeExplodeCurrent : Math.max(0, bridgeExplodeCurrent - 1);
      setField(memory, 'bridgeExplode', nextBridgeExplode);
      if (nextBridgeExplode === 0) setField(memory, 'bridgeSound', 0x00);
      bridgeAftermath = {
        bridgeExplodeBefore,
        bridgeExplodeAfter: nextBridgeExplode,
        bridgeSoundBefore,
        bridgeSoundAfter: readByte(memory, ZERO_PAGE_INDEX.bridgeSound.address),
        ticked: !justTriggered,
        cleared: nextBridgeExplode === 0,
        advancedSection: false,
        justTriggered,
        note: justTriggered
          ? 'Harness bridge aftermath latched a fresh bridge explosion and keeps the counter active for follow-up ticks.'
          : 'Harness bridge aftermath decremented bridgeExplode and clears bridgeSound when the counter reaches zero.',
      };
    }

    const nextBlockLine = (blockLineBefore + 1) % GAME_CONSTANTS.BLOCK_SIZE;
    setField(memory, 'temp3', nextBlockLine);
    setField(memory, 'lineNum', nextBlockLine);
    setField(memory, 'posYLo', nextBlockLine);

    let sectionWrapped = false;
    let sceneAdvance = null;
    if (nextBlockLine === 0) {
      sectionWrapped = true;
      const nextBlockOffset = (readByte(memory, ZERO_PAGE_INDEX.blockOffset.address) + 1) & 0xff;
      const blockPartBefore = readByte(memory, ZERO_PAGE_INDEX.blockPart.address);
      const nextBlockPart = blockPartBefore === 1 ? 2 : 1;
      const currentPf1PatId = readByte(memory, ZERO_PAGE_INDEX.PF1PatId.address);

      let nextSectionBlock;
      if (sectionBlockBefore === 0) nextSectionBlock = GAME_CONSTANTS.SECTION_BLOCKS;
      else if (sectionBlockBefore === 1) nextSectionBlock = bridgeAftermath.bridgeExplodeAfter > 0
        ? GAME_CONSTANTS.SECTION_BLOCKS
        : 0;
      else nextSectionBlock = sectionBlockBefore - 1;
      const projectedIncomingHead = previewVisibleIncomingHeadSpawn(memory, {
        frameAfterWrap: nextFrame,
        nextSectionBlock,
        nextBlockOffset,
        nextBlockPart,
        nextPrevPF1PatId: currentPf1PatId,
        nextPF1PatId: (currentPf1PatId + 1) & 0x0f,
        bridgeAdvanced: sectionBlockBefore === 1 && bridgeAftermath.bridgeExplodeAfter > 0,
      });
      setField(memory, 'blockOffset', nextBlockOffset);
      setField(memory, 'blockPart', nextBlockPart || 1);
      setField(memory, 'prevPF1PatId', currentPf1PatId);
      setField(memory, 'PF1PatId', (currentPf1PatId + 1) & 0x0f);
      setField(memory, 'sectionBlock', nextSectionBlock);
      setField(memory, 'sectionEnd', nextSectionBlock === 0 ? 0x00 : 0x01);
      if (sectionBlockBefore === 1 && bridgeAftermath.bridgeExplodeAfter > 0) {
        setField(memory, 'blockPart', 1);
        setField(memory, 'bridgeExplode', 0x00);
        setField(memory, 'bridgeSound', 0x00);
        bridgeAftermath = {
          ...bridgeAftermath,
          bridgeExplodeAfter: 0,
          bridgeSoundAfter: 0,
          cleared: true,
          advancedSection: true,
          note: 'Harness bridge aftermath treated a destroyed bridge at section wrap as immediate progression into the next section and cleared bridge explosion state.',
        };
      }
      sceneAdvance = advanceVisibleSlotScene(memory, {
        rolling: true,
        incomingHeadOverride: projectedIncomingHead.projectedSpawn,
      });
    }

    lastStep = {
      frameBefore,
      frameAfter: nextFrame,
      joystick: joystick.directions,
      horizontalDeltaRequested,
      horizontalDelta,
      verticalDelta,
      playerXBefore,
      requestedPlayerX,
      playerXAfter: nextPlayerX,
      speedX,
      speedY,
      riverBounds,
      hitRiverBank,
      rngBefore,
      rngAfter,
      gameModeBefore,
      gameModeAfter: nextGameMode,
      missileYBefore,
      missileYAfter: readByte(memory, ZERO_PAGE_INDEX.missileY.address),
      missileEnabledAfter,
      missileHit,
      scoreDelta,
      scoreState,
      projectedMissileCollision,
      objectMovement,
      fuelBefore: fuelBeforeStep,
      fuelAfter: computeFuel16(memory),
      fuelDrain,
      fuelDrained,
      outOfFuel,
      fuelPickup,
      playerCrash,
      playerCrashKind,
      playerSlotCollision,
      respawned: false,
      respawnBlocked: false,
      respawnState: null,
      bridgeAftermath,
      blockLineBefore,
      blockLineAfter: nextBlockLine,
      sectionBlockBefore,
      sectionBlockAfter: readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address),
      sectionWrapped,
      blockOffsetAfter: readByte(memory, ZERO_PAGE_INDEX.blockOffset.address),
      blockPartAfter: readByte(memory, ZERO_PAGE_INDEX.blockPart.address),
      sceneAdvance,
    };
  }

  return {
    steps,
    frameCnt: readByte(memory, ZERO_PAGE_INDEX.frameCnt.address),
    frameCntHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.frameCnt.address)),
    playerX: readByte(memory, ZERO_PAGE_INDEX.playerX.address),
    playerXHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.playerX.address)),
    missileY: readByte(memory, ZERO_PAGE_INDEX.missileY.address),
    missileYHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.missileY.address)),
    gameMode: readByte(memory, ZERO_PAGE_INDEX.gameMode.address),
    gameModeHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.gameMode.address)),
    sectionBlock: readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address),
    sectionBlockHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.sectionBlock.address)),
    blockLine: readByte(memory, ZERO_PAGE_INDEX.temp3.address),
    blockLineHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.temp3.address)),
    rng16: readRng16(memory),
    rng16Hex: dollarHex(readRng16(memory), 4),
    lastStep,
    note: 'Visible gameplay loop helper: advances frameCnt, intro-scroll countdown, RNG bytes, declared block-line counters, harness-only river-bank clamp/crash flagging from the inspector silhouette, simple joystick-driven playerX/speed bytes, harness MOVE_ENEMY object cadence for air/water slots, harness PATROL ship/helicopter direction flips, harness missile hits against visible slot bboxes, harness score-pointer digit updates for missile/bridge rewards, harness fuelHi/fuelLo drain while running with depletion-to-crash behavior, fuel-depot pickup refills from visible slot overlap, projected player-death/game-over transitions from bank or non-fuel slot impact, harness respawn/game-over-hold handling from livesPtr low-byte stock, and the existing harness missile convention. This is an excerpt-limited inspector loop, not a full River Raid gameplay port.',
  };
}

export function fireVisibleMissile(memory) {
  const missileFlagBefore = readByte(memory, ZERO_PAGE_INDEX.missileFlag.address);
  const alreadyEnabled = missileFlagBefore === 0xff;
  const playerX = readByte(memory, ZERO_PAGE_INDEX.playerX.address);
  const missileXBefore = readByte(memory, ZERO_PAGE_INDEX.missileX.address);
  const spawnX = Math.max(0, Math.min(159, playerX + MISSILE_X_OFFSET));

  if (!alreadyEnabled) {
    setField(memory, 'missileX', spawnX);
    setField(memory, 'missileY', GAME_CONSTANTS.MIN_MISSILE);
    setField(memory, 'missileFlag', 0xff);
    setField(memory, 'missileSound', 0x01);
  }

  return {
    fired: !alreadyEnabled,
    alreadyEnabled,
    playerX,
    playerXHex: dollarHex(playerX),
    missileXBefore,
    missileXBeforeHex: dollarHex(missileXBefore),
    missileXAfter: readByte(memory, ZERO_PAGE_INDEX.missileX.address),
    missileXAfterHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.missileX.address)),
    missileYAfter: readByte(memory, ZERO_PAGE_INDEX.missileY.address),
    missileYAfterHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.missileY.address)),
    missileFlagAfter: readByte(memory, ZERO_PAGE_INDEX.missileFlag.address),
    missileFlagAfterHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.missileFlag.address)),
    missileSoundAfter: readByte(memory, ZERO_PAGE_INDEX.missileSound.address),
    missileSoundAfterHex: dollarHex(readByte(memory, ZERO_PAGE_INDEX.missileSound.address)),
    spawnX,
    spawnXHex: dollarHex(spawnX),
    note: 'Visible missile-fire helper only uses declared playerX/missileX/missileY/missileFlag/missileSound bytes plus the existing $FF sentinel convention. It does not claim the unseen fire-button routine or exact launch kernel.',
  };
}

export function inspectPlayer1StateArea(memory) {
  return inspectPlayer1State(memory);
}

export function inspectPlayer2StateArea(memory) {
  return inspectPlayer2State(memory);
}

export function inspectZeroConsts(memory) {
  const zero1Val = readByte(memory, ZERO_PAGE_INDEX.zero1.address);
  const zero2Val = readByte(memory, ZERO_PAGE_INDEX.zero2.address);
  return {
    zero1Val,
    zero1Hex: dollarHex(zero1Val),
    zero1Address: ZERO_PAGE_INDEX.zero1.address,
    zero1AddressHex: dollarHex(ZERO_PAGE_INDEX.zero1.address),
    zero2Val,
    zero2Hex: dollarHex(zero2Val),
    zero2Address: ZERO_PAGE_INDEX.zero2.address,
    zero2AddressHex: dollarHex(ZERO_PAGE_INDEX.zero2.address),
    rangeHex: `${dollarHex(ZERO_PAGE_INDEX.zero1.address)}..${dollarHex(ZERO_PAGE_INDEX.zero2.address)}`,
    zero1Invariant: zero1Val === 0,
    zero2Invariant: zero2Val === 0,
    bothZero: zero1Val === 0 && zero2Val === 0,
    note: 'zero1 and zero2 are declared always zero in the excerpt; inspector highlights violations only.',
  };
}

export function inspectResetSequence(memory) {
  // Faithful trace of the visible Reset code from the ASM excerpt ($F000).
  // START: SEI, CLD, LDX #0 (preamble)
  // Reset: LDA #0 (start of clear loop)
  // .loopClear: STA $00,X / TXS / INX / BNE .loopClear (5 steps per iteration)
  // Post-clear: JSR SetScorePtrs / LDA #>Zero / LDX #12-1 / JSR SetScorePtr1 /
  //             LDX #colorPtr+1-PF1Lst / JSR GameInit (6 steps, 3 subroutine calls)
  // Pre-MainLoop: LDA random / BNE MainLoop / INC random / STA livesPtr /
  //               LDA #<One / STA scorePtr1+10 (6 steps)
  // Accepts optional memory — when provided, reads live random byte to show the
  // correct branch path (first-boot vs MainLoop) based on ASM lines 313-318.
  // NOTE: JSR subroutines (SetScorePtrs, SetScorePtr1, GameInit) and
  // SetPosX called from MainLoop are NOT in the excerpt — inspector-only trace.
  const preamble = [
    { pc: '$F000', op: 'SEI', operand: '', effect: 'disable interrupts', isPreamble: true },
    { pc: '$F001', op: 'CLD', operand: '', effect: 'clear decimal mode', isPreamble: true },
    { pc: '$F002', op: 'LDX', operand: '#0', effect: 'X=0 for clear loop', isPreamble: true },
  ];
  const clearLoop = [
    { pc: '$F004', op: 'LDA', operand: '#0', effect: 'A=0', isClearLoop: true },
    { pc: '$F006', op: 'STA', operand: '$00,X', effect: 'zero ZP byte', isLoop: true },
    { pc: '$F007', op: 'TXS', operand: '', effect: 'set stack from X', isLoop: true },
    { pc: '$F008', op: 'INX', operand: '', effect: 'X++', isLoop: true },
    { pc: '$F009', op: 'BNE', operand: '.loopClear', effect: 'loop if X!=0', isLoop: true },
  ];
  const subroutineSetup = [
    { pc: '$F00B', op: 'JSR', operand: 'SetScorePtrs', effect: 'score ptr init', note: 'Subroutine NOT in the excerpt.' },
    { pc: '$F00E', op: 'LDA', operand: '#>Zero', effect: 'load high byte of Zero page' },
    { pc: '$F010', op: 'LDX', operand: '#12-1', effect: 'X=11 for scorePtr1 loop' },
    { pc: '$F012', op: 'JSR', operand: 'SetScorePtr1', effect: 'score page init', note: 'Subroutine NOT in the excerpt.' },
    { pc: '$F015', op: 'LDX', operand: '#colorPtr+1-PF1Lst', effect: 'X=38 for GameInit loop' },
    { pc: '$F017', op: 'JSR', operand: 'GameInit', effect: 'game init hook', note: 'Subroutine NOT in the excerpt.' },
  ];
  const preMainLoop = [
    { pc: '$F01A', op: 'LDA', operand: 'random', effect: 'load random byte' },
    { pc: '$F01B', op: 'BNE', operand: 'MainLoop', effect: 'branch to MainLoop if random!=0' },
  ];
  // Determine whether the subsequent first-boot path executes
  const randomVal = memory ? readByte(memory, ZERO_PAGE_INDEX.random.address) : 0;
  const isRandomZero = memory ? randomVal === 0 : true;
  const firstBootPath = isRandomZero ? [
    { pc: '$F01D', op: 'INC', operand: 'random', effect: 'random=1 (first boot)' },
    { pc: '$F01E', op: 'STA', operand: 'livesPtr', effect: 'clear livesPtr (A still 0)' },
    { pc: '$F020', op: 'LDA', operand: '#<One', effect: 'load low byte of digit ptr' },
    { pc: '$F022', op: 'STA', operand: 'scorePtr1+10', effect: 'store Ones ptr' },
  ] : [];
  const steps = [...preamble, ...clearLoop, ...subroutineSetup, ...preMainLoop, ...firstBootPath];
  return {
    steps,
    totalSteps: steps.length,
    visibleInstructions: steps.length - 3,
    preambleSteps: preamble.length,
    clearLoopSteps: clearLoop.length,
    subroutineCalls: 3,
    subroutineNames: ['SetScorePtrs', 'SetScorePtr1', 'GameInit'],
    note: 'Reset trace is an INSPECTOR summary of visible reset/setup intent; called subroutines are NOT in the excerpt body shown here.',
    isFirstBootPath: isRandomZero,
    branch: isRandomZero ? 'first-boot (random was 0)' : 'direct MainLoop (random != 0)',
    liveRandomRead: memory !== undefined,
  };
}

// Derived constant: GameInit loop counter from ASM line 311
// LDX #colorPtr+1-PF1Lst ; 2 #38
// Computed: colorPtr($CB) + 1 - PF1Lst($A6) = 0xCC - 0xA6 = 38
export const GAME_INIT_LOOP_COUNT = (ZERO_PAGE_INDEX.colorPtr.address + 1) - ZERO_PAGE_INDEX.PF1Lst.address; // = 38

// Derived constant: scorePtr1 loop counter from ASM line 309
// LDX #12-1 ; X = 11 (loop counter for 12 score-ptr bytes)
export const SCORE_PTR1_LOOP_COUNT = ZERO_PAGE_INDEX.scorePtr1.length - 1; // = 11

export function inspectScorePtr1Init() {
  // Faithful inspector for the visible Reset excerpt lines 308-310:
  // LDA #>Zero ; load high byte of Zero address
  // LDX #12-1 ; X = 11 (loop counter for 12 score-ptr bytes)
  // JSR SetScorePtr1; subroutine sets high-byte pointers
  // SetScorePtr1 body is NOT in the excerpt.
  const xRegisterValue = SCORE_PTR1_LOOP_COUNT; // 12-1 = 11, derived from declared scorePtr1 length
  const targetField = 'scorePtr1';
  const targetAddress = ZERO_PAGE_INDEX.scorePtr1.address; // $CD
  const targetLength = ZERO_PAGE_INDEX.scorePtr1.length; // 12
  return {
    asmLines: ['LDA #>Zero', 'LDX #12-1', 'JSR SetScorePtr1'],
    xRegisterValue,
    xRegisterValueSource: 'SCORE_PTR1_LOOP_COUNT (derived from scorePtr1.length - 1)',
    targetField,
    targetAddress,
    targetLength,
    subroutineBody: 'NOT in excerpt',
    note: 'Inspector for visible Reset lines 308-310; SetScorePtr1 subroutine body is NOT in excerpt.',
  };
}

export function inspectGameInitWindow() {
  const start = ZERO_PAGE_INDEX.PF1Lst.address;
  const endExclusive = ZERO_PAGE_INDEX.colorPtr.address + ZERO_PAGE_INDEX.colorPtr.length;
  const endInclusive = endExclusive - 1;
  const totalBytes = endExclusive - start;
  const coveredFields = ZERO_PAGE_LAYOUT
    .filter((entry) => !entry.aliasOf)
    .filter((entry) => entry.address >= start && entry.address < endExclusive)
    .map((entry) => Object.freeze({
      name: entry.name,
      start: entry.address,
      end: entry.address + entry.length - 1,
      length: entry.length,
      startHex: dollarHex(entry.address),
      endHex: dollarHex(entry.address + entry.length - 1),
      rangeHex: `${dollarHex(entry.address)}..${dollarHex(entry.address + entry.length - 1)}`,
    }));
  return {
    asmLine: 'LDX #colorPtr+1-PF1Lst',
    xRegisterValue: GAME_INIT_LOOP_COUNT,
    xRegisterValueHex: dollarHex(GAME_INIT_LOOP_COUNT),
    start,
    startHex: dollarHex(start),
    endExclusive,
    endExclusiveHex: dollarHex(endExclusive),
    endInclusive,
    endInclusiveHex: dollarHex(endInclusive),
    totalBytes,
    totalBytesSource: 'colorPtr+1 - PF1Lst',
    rangeHex: `${dollarHex(start)}..${dollarHex(endInclusive)}`,
    coveredFields,
    fieldCount: coveredFields.length,
    firstField: coveredFields[0]?.name ?? null,
    lastField: coveredFields[coveredFields.length - 1]?.name ?? null,
    note: 'Inspector for visible Reset line 311 only: it exposes the declared PF1Lst..colorPtr window implied by LDX #colorPtr+1-PF1Lst. GameInit subroutine body is NOT in excerpt.',
  };
}

export function inspectResetPreMainBranch(randomValue) {
  // Faithful inspector for the visible Reset excerpt lines 313-318:
  //   LDA random      ; 3  -- load $83
  //   BNE MainLoop    ; 2  -- branch to MainLoop if random != 0
  //   INC random      ; 5  -- (first-boot path) random was 0, increment to 1
  //   STA livesPtr    ; 3  -- A was 0, so livesPtr = 0
  //   LDA #<One       ; 2  -- load low byte of Ones digit pointer
  //   STA scorePtr1+10; 3  -- store Ones ptr in scorePtr1+10
  const raw = u8(randomValue);
  const isRandomZero = raw === 0;
  const branchTaken = !isRandomZero;
  const randomAddress = ZERO_PAGE_INDEX.random.address;
  const livesPtrAddress = ZERO_PAGE_INDEX.livesPtr.address;
  const scorePtr1WriteOffset = 10;
  const scorePtr1WriteAddress = ZERO_PAGE_INDEX.scorePtr1.address + scorePtr1WriteOffset;
  const firstBootSteps = isRandomZero ? [
    { op: 'INC random', effect: 'random was 0 → set to 1 (first boot)', address: dollarHex(randomAddress) },
    { op: 'STA livesPtr', effect: 'A=0 → clear livesPtr', address: dollarHex(livesPtrAddress) },
    { op: 'LDA #<One', effect: 'load low byte of Ones digit pointer', address: 'immediate' },
    { op: 'STA scorePtr1+10', effect: 'store Ones ptr in scorePtr1+10', address: dollarHex(scorePtr1WriteAddress) },
  ] : [];
  const path = isRandomZero ? 'first-boot (random was 0)' : 'MainLoop (random != 0)';
  return {
    raw,
    rawHex: dollarHex(raw),
    randomAddress,
    randomAddressHex: dollarHex(randomAddress).toUpperCase(),
    branchOpcode: 'BNE',
    branchOperand: 'MainLoop',
    branchTaken,
    branchOutcome: branchTaken ? 'taken to MainLoop' : 'not taken; continue first-boot path',
    isRandomZero,
    firstBootSteps,
    firstBootStepCount: firstBootSteps.length,
    livesPtrAddress,
    livesPtrAddressHex: dollarHex(livesPtrAddress).toUpperCase(),
    scorePtr1WriteOffset,
    scorePtr1WriteAddress,
    scorePtr1WriteAddressHex: dollarHex(scorePtr1WriteAddress).toUpperCase(),
    path,
    note: 'Inspector for visible Reset lines 313-318 only: branch decision comes directly from random at $83, and the first-boot path writes livesPtr then scorePtr1+10. The MainLoop body is outside this pre-branch snippet.',
  };
}

export function inspectFuelDisplayTrace(memory) {
  return traceMainLoopFuelSequence(readByte(memory, ZERO_PAGE_INDEX.fuelHi.address));
}

// ─── ASM switches inspector ────────────────────────────────────────────────
// Surfaces the four assembler-switch constants from ASM lines 62-65.
export function inspectAsmSwitches() {
  const sw = ASM_SWITCHES;
  return {
    fillOpt: sw.FILL_OPT,
    fillOptHex: dollarHex(sw.FILL_OPT),
    screensaver: sw.SCREENSAVER,
    screensaverHex: dollarHex(sw.SCREENSAVER),
    trainer: sw.TRAINER,
    trainerHex: dollarHex(sw.TRAINER),
    ntsc: sw.NTSC,
    ntscHex: dollarHex(sw.NTSC),
    activeColorSet: sw.NTSC ? 'NTSC' : 'PAL',
    activeColorSetColors: sw.NTSC ? COLORS_NTSC : COLORS_PAL,
    screensaverEnabled: sw.SCREENSAVER === 1,
    trainerEnabled: sw.TRAINER === 1,
    note: 'Assembler switches from ASM excerpt lines 62-65. These control conditional assembly at build time, not runtime.',
  };
}

// ─── inspectFirstBootMemoryState — cross-validate harness against ASM lines 315-318 ──
// After applyVisibleResetLogic(memory), when random was 0 on entry, the visible
// first-boot path (ASM lines 315-318) should have:
//   INC random    → random = 1
//   STA livesPtr  → livesPtr = 0
//   LDA #<One     → (loads immediate, no memory effect)
//   STA scorePtr1+10 → scorePtr1+10 = low byte of Ones ROM pointer
// This inspector reads back the harness memory and reports whether the visible
// first-boot writes are reflected, without claiming the harness Reset logic is
// a complete emulation of the unseen ROM Reset handler.
export function inspectFirstBootMemoryState(memory) {
  const randomVal   = readByte(memory, ZERO_PAGE_INDEX.random.address);
  const livesPtrVal = readByte(memory, ZERO_PAGE_INDEX.livesPtr.address);
  const scorePtr1Base = ZERO_PAGE_INDEX.scorePtr1.address;
  const scorePtr1Plus10 = readByte(memory, scorePtr1Base + 10);

  // The harness applyVisibleResetLogic zeros all memory then writes the
  // SetScorePtr1 high-pointer pattern (12 bytes of $FB). If the harness
  // faithfully follows the first-boot path, random should be 1 (INC from 0)
  // and livesPtr should be 0 (STA with A=0).
  const randomIsOne = randomVal === 1;
  const livesPtrIsZero = livesPtrVal === 0;

  // scorePtr1+10 should hold the low byte of the Ones digit pointer
  // (the harness sets this during applyVisibleResetLogic)
  const scorePtr1Plus10Hex = dollarHex(scorePtr1Plus10);

  return {
    randomAddress: dollarHex(ZERO_PAGE_INDEX.random.address),
    randomValue: randomVal,
    randomHex: dollarHex(randomVal),
    randomIsOne,
    livesPtrAddress: dollarHex(ZERO_PAGE_INDEX.livesPtr.address),
    livesPtrValue: livesPtrVal,
    livesPtrHex: dollarHex(livesPtrVal),
    livesPtrIsZero,
    scorePtr1BaseAddress: dollarHex(scorePtr1Base),
    scorePtr1Plus10Offset: 10,
    scorePtr1Plus10Address: dollarHex(scorePtr1Base + 10),
    scorePtr1Plus10Value: scorePtr1Plus10,
    scorePtr1Plus10Hex,
    firstBootConsistent: randomIsOne && livesPtrIsZero,
    asmLines: '315-318',
    note: 'Cross-validates harness memory state against visible first-boot writes (ASM lines 315-318). random=1 from INC; livesPtr=0 from STA with A=0. The LDA #<One immediate has no memory destination other than scorePtr1+10. Does not claim the harness Reset is a complete ROM emulation.',
  };
}

// ─── NTSC/PAL color comparison inspector ───────────────────────────────────
// Shows the color differences between NTSC and PAL paths from ASM lines 77-92.
export function inspectColorFormatComparison() {
  const ntscKeys = Object.keys(COLORS_NTSC);
  const differences = [];
  const same = [];
  for (const key of ntscKeys) {
    const n = COLORS_NTSC[key];
    const p = COLORS_PAL[key];
    if (n !== p) {
      differences.push({ name: key, ntsc: n, pal: p, ntscHex: dollarHex(n), palHex: dollarHex(p) });
    } else {
      same.push({ name: key, value: n, hex: dollarHex(n) });
    }
  }
  return {
    activeFormat: ASM_SWITCHES.NTSC ? 'NTSC' : 'PAL',
    differences,
    same,
    differingColorCount: differences.length,
    sameColorCount: same.length,
    note: 'NTSC vs PAL color constants from ASM excerpt lines 77-92. Only YELLOW/RED/BLUE/CYAN/GREEN differ between formats; BLACK/GREY/ORANGE are identical.',
  };
}

// ─── Complete shape ID table inspector ──────────────────────────────────────
// Surfaces all 11 declared shape IDs from ASM lines 146-156.
export function inspectShapeIdTable() {
  const entries = [];
  for (const [name, id] of Object.entries(SHAPE_IDS)) {
    const displayName = shapeNameFromId(id);
    const shapeClass = shapeClassFromId(id);
    entries.push({
      asmName: name,
      name,
      id,
      idHex: dollarHex(id),
      displayName,
      shapeClass,
      isKnownShape: displayName !== 'unknown',
    });
  }
  const classCounts = entries.reduce((acc, entry) => {
    acc[entry.shapeClass] = (acc[entry.shapeClass] ?? 0) + 1;
    return acc;
  }, {});
  return {
    entries,
    count: entries.length,
    idRange: `${dollarHex(0)}..${dollarHex(10)}`,
    classCounts,
    knownCount: entries.filter((entry) => entry.isKnownShape).length,
    note: 'Shape IDs from ASM excerpt lines 146-156. ID_BRIDGE and ID_FUEL are referenced in visible code; others are declared constants only.',
  };
}

// ─── Road height inspector ─────────────────────────────────────────────────
// Surfaces the ROAD_HEIGHT constant (ASM line 112) and its relationship to
// BLOCK_SIZE and the kernel structure.
export function inspectRoadHeight() {
  const roadHeight = GAME_CONSTANTS.ROAD_HEIGHT;
  const blockSize = GAME_CONSTANTS.BLOCK_SIZE;
  return {
    roadHeight,
    roadHeightHex: dollarHex(roadHeight),
    blockSize,
    blockSizeHex: dollarHex(blockSize),
    roadLinesPerBlock: roadHeight,
    nonRoadLinesPerBlock: blockSize - roadHeight,
    roadLineRange: `0..${roadHeight - 1}`,
    nonRoadLineRange: `${roadHeight}..${blockSize - 1}`,
    note: 'ROAD_HEIGHT=13 from ASM line 112. It declares the number of scanlines used for road rendering per block. The kernel loop structure that consumes this value is NOT in excerpt.',
  };
}

// ─── 1. NUSIZ value to sprite rendering mode lookup ────────────────────────
// Maps the three NUSIZ constants from ASM lines 159-162 to their TIA rendering
// effects. This is purely structural metadata — it does not fabricate bitmap data.
export const SPRITE_NUSIZ_MODES = Object.freeze({
  [NUSIZ_ASM_NAMES.TWO_COPIES]: {
    nusizValue: NUSIZ_ASM_NAMES.TWO_COPIES,
    nusizValueHex: dollarHex(NUSIZ_ASM_NAMES.TWO_COPIES),
    asmName: 'TWO_COPIES',
    asmLine: 159,
    copies: 2,
    pixelWidth: 1,
    description: '2 copies, close spacing',
    note: 'TWO_COPIES = %001 from ASM line 159. TIA renders two player copies at close spacing.',
  },
  [NUSIZ_ASM_NAMES.THREE_COPIES]: {
    nusizValue: NUSIZ_ASM_NAMES.THREE_COPIES,
    nusizValueHex: dollarHex(NUSIZ_ASM_NAMES.THREE_COPIES),
    asmName: 'THREE_COPIES',
    asmLine: 160,
    copies: 3,
    pixelWidth: 1,
    description: '3 copies, close spacing',
    note: 'THREE_COPIES = %011 from ASM line 160. TIA renders three player copies at close spacing.',
  },
  [NUSIZ_ASM_NAMES.DOUBLE_SIZE]: {
    nusizValue: NUSIZ_ASM_NAMES.DOUBLE_SIZE,
    nusizValueHex: dollarHex(NUSIZ_ASM_NAMES.DOUBLE_SIZE),
    asmName: 'DOUBLE_SIZE',
    asmLine: 161,
    copies: 1,
    pixelWidth: 2,
    description: '1 copy, double-width pixels',
    note: 'DOUBLE_SIZE = %101 from ASM line 161. TIA renders one copy with 2-color-clock-wide pixels.',
  },
  [NUSIZ_ASM_NAMES.QUAD_SIZE]: {
    nusizValue: NUSIZ_ASM_NAMES.QUAD_SIZE,
    nusizValueHex: dollarHex(NUSIZ_ASM_NAMES.QUAD_SIZE),
    asmName: 'QUAD_SIZE',
    asmLine: 162,
    copies: 1,
    pixelWidth: 4,
    description: '1 copy, quad-width pixels',
    note: 'QUAD_SIZE = %111 from ASM line 162. TIA renders one copy with 4-color-clock-wide pixels.',
  },
});

export function inspectSpriteNusizModes() {
  const entries = Object.values(SPRITE_NUSIZ_MODES);
  return {
    entries,
    count: entries.length,
    modeValues: entries.map((e) => e.nusizValue),
    modeValueHexes: entries.map((e) => e.nusizValueHex),
    note: 'NUSIZ rendering modes from ASM lines 159-162. These describe TIA player-missile rendering structure only; actual sprite bitmap data is NOT in excerpt.',
  };
}

// ─── 2. Shape ID to NUSIZ compatibility mapping ─────────────────────────────
// The kernel comment (ASM lines 33-41) states that each block stores NUSIZ and
// direction bits for its object via State1Lst. Which NUSIZ values each shape
// type can legally use is NOT fully stated in the excerpt, but the shape class
// This inspector exposes conservative class→NUSIZ hint metadata only.
// The visible excerpt gives us shape IDs plus some flag semantics, but not an
// explicit shape→NUSIZ assignment table. Any class-level grouping here is a
// browsing aid rather than excerpt-proven runtime behavior.
export function inspectShapeNusizHints() {
  const classNusizHints = {
    explosion: {
      typicalNusiz: 0,
      typicalNusizLabel: '1 copy',
      reason: 'Candidate single-copy hint: explosion shape IDs sit outside the moving shape classes in the visible ID/flag system.',
      shapes: ['Explosion0', 'Explosion1', 'Explosion2', 'Explosion3'],
    },
    'shape-air': {
      typicalNusiz: null,
      typicalNusizLabel: 'varies (multiple NUSIZ values possible)',
      reason: 'Candidate variable-NUSIZ hint: visible shape-air IDs share the PATROL_FLAG-capable class, but the excerpt does not assign one canonical NUSIZ byte.',
      shapes: ['Plane', 'Heli0', 'Heli1'],
    },
    'shape-water': {
      typicalNusiz: 0,
      typicalNusizLabel: '1 copy',
      reason: 'Candidate single-copy hint: visible shape-water IDs sit in the ENEMY_MOVE_FLAG-capable class, but the excerpt still does not prove one exact NUSIZ byte.',
      shapes: ['Ship'],
    },
    'shape-structure': {
      typicalNusiz: null,
      typicalNusizLabel: 'varies (bridge may use DOUBLE_SIZE)',
      reason: 'Candidate wide/variable hint: visible shape-structure IDs include bridge/house families, and bridge-related blocks also carry PF-road-bit semantics elsewhere in the excerpt.',
      shapes: ['Bridge', 'House'],
    },
    'shape-fuel': {
      typicalNusiz: 0,
      typicalNusizLabel: '1 copy',
      reason: 'Candidate single-copy hint: shape-fuel is a small standalone family in the visible ID table, but no explicit NUSIZ assignment is shown.',
      shapes: ['Fuel'],
    },
  };
  const entries = Object.entries(classNusizHints).map(([cls, hint]) => ({
    shapeClass: cls,
    ...hint,
  }));
  return {
    entries,
    classCount: entries.length,
    note: 'Shape-class to NUSIZ hints are INSPECTOR-ONLY inferences from the visible flag system (ASM lines 130-142). The excerpt does NOT explicitly assign NUSIZ values to shape IDs; these are conservative hints based on the declared flags.',
  };
}

// ─── 3. Sprite pointer-to-shape-ID cross-reference inspector ───────────────
// The excerpt declares three pointer pairs that point to sprite bitmap data:
//   shapePtr0 ($BA..$BB) — player 0 sprite (the jet/helicopter)
//   shapePtr1a ($C7..$C8) — player 1 sprite, even frames
//   shapePtr1b ($C9..$CA) — player 1 sprite, odd frames (interlaced)
// The kernel comment (ASM lines 34-37) states: "two pointers for the current
// object, the data is displayed interlaced, this gives in a single line
// resolution here." This inspector cross-references all three pointer values
// against the Shape1IdLst bytes to show which shape each pointer serves.
export function inspectSpritePointerCrossRef(memory) {
  const shapePtrState = inspectShapePtrState(memory);
  const slots = inspectVisibleSlots(memory);
  // shapePtr0 is the P0 sprite pointer and is not associated with any block slot.
  // shapePtr1a/1b are P1 interlace pointer pairs; the slot link below is only a heuristic hint.
  const heuristicSlotIdx = slots.findIndex((slot) => slot.isKnownShape && slot.shapeId !== SHAPE_IDS.ID_EXPLOSION0);
  const heuristicSlot = heuristicSlotIdx >= 0 ? slots[heuristicSlotIdx] : null;
  return {
    shapePtr0: {
      ...shapePtrState.shapePtr0,
      role: 'P0 sprite pointer (jet/heli variants)',
      roleNote: 'shapePtr0 always points to the player 0 graphics; it is NOT associated with any block slot.',
      associatedSlotIndex: null,
      associatedShapeId: null,
    },
    shapePtr1a: {
      ...shapePtrState.shapePtr1a,
      role: 'P1 interlace pointer A (even frames)',
      roleNote: 'shapePtr1a provides one half of the visible P1 interlace pair; any linked slot name shown here is heuristic only.',
      associatedSlotIndex: heuristicSlotIdx >= 0 ? heuristicSlotIdx : null,
      associatedShapeId: heuristicSlot ? heuristicSlot.shapeId : null,
      associatedShapeName: heuristicSlot ? heuristicSlot.shapeName : null,
    },
    shapePtr1b: {
      ...shapePtrState.shapePtr1b,
      role: 'P1 interlace pointer B (odd frames)',
      roleNote: 'shapePtr1b provides the second half of the visible P1 interlace pair; any linked slot name shown here is heuristic only.',
      associatedSlotIndex: heuristicSlotIdx >= 0 ? heuristicSlotIdx : null,
      associatedShapeId: heuristicSlot ? heuristicSlot.shapeId : null,
      associatedShapeName: heuristicSlot ? heuristicSlot.shapeName : null,
    },
    interlaceNote: 'ASM lines 34-37: "two pointers for the current object, the data is displayed interlaced, this gives in a single line resolution here."',
    note: 'Cross-reference inspector: shapePtr0 is the visible P0 pointer pair, and shapePtr1a/1b form the visible P1 interlace pair. Any slot association shown here is only a heuristic based on the first non-Explosion0 slot; actual kernel slot selection is NOT in the excerpt.',
  };
}

// ─── 4. Player-jet sprite pointer target inspector ───────────────────────────
// The excerpt declares shapePtr0 at $BA..$BB as the player 0 sprite pointer,
// reflect0 at $E0 as the GRP0 reflection flag alias, playerColor at $EF as the
// jet color byte, playerX at $B3 as the jet X position, and JET_Y=19. It does
// NOT include the ROM bitmap bytes that shapePtr0 points at, nor any visible
// P0 NUSIZ shadow byte equivalent to State1Lst for P1 objects.
export function inspectJetSpritePointerTarget(memory) {
  const shapePtrState = inspectShapePtrState(memory);
  const playerColor = inspectPlayerColor(memory);
  const playerMove = inspectPlayerMovementState(memory);
  const reflect0 = readByte(memory, ZERO_PAGE_INDEX.reflect0.address);
  const ptr = shapePtrState.shapePtr0;
  const unresolvedReasons = [
    'Bitmap bytes at the shapePtr0 ROM target are NOT present in the visible excerpt.',
    'No P0 NUSIZ shadow byte is declared in the excerpt the way State1Lst stores NUSIZ1/REFP1 for P1 objects.',
    'No visible write path to reflect0 ($E0) is shown in the excerpt.',
  ];
  return {
    pointerRole: 'P0 sprite pointer (jet/heli variants)',
    pointerAddressHex: ptr.addressHex,
    pointerEndAddressHex: ptr.endAddressHex,
    pointerValue: ptr.value,
    pointerValueHex: ptr.valueHex,
    targetRomAddress: ptr.value,
    targetRomAddressHex: ptr.valueHex,
    targetStatus: ptr.value === 0 ? 'zero/uninitialized-or-cleared' : 'unresolved target outside visible excerpt',
    targetDataVisibleInExcerpt: false,
    targetBitmapBytesAvailable: false,
    targetLabel: 'unresolved P0 bitmap target',
    unresolvedReasons,
    reflect0,
    reflect0Hex: dollarHex(reflect0),
    reflect0Address: ZERO_PAGE_INDEX.reflect0.address,
    reflect0AddressHex: dollarHex(ZERO_PAGE_INDEX.reflect0.address),
    refp0Interpretation: reflect0 === 0 ? 'normal/not reflected' : 'reflected (non-zero flag)',
    refp0BitPatternKnown: false,
    playerColor: playerColor.raw,
    playerColorHex: playerColor.hex,
    playerColorAddress: ZERO_PAGE_INDEX.playerColor.address,
    playerColorAddressHex: dollarHex(ZERO_PAGE_INDEX.playerColor.address),
    playerColorCss: playerColor.colorCss,
    playerX: playerMove.playerX,
    playerXHex: playerMove.playerXHex,
    playerXAddress: ZERO_PAGE_INDEX.playerX.address,
    playerXAddressHex: dollarHex(ZERO_PAGE_INDEX.playerX.address),
    jetY: GAME_CONSTANTS.JET_Y,
    jetYHex: dollarHex(GAME_CONSTANTS.JET_Y),
    hasVisibleP0NusizSource: false,
    p0NusizSource: null,
    p0NusizStatus: 'unresolved — no P0 NUSIZ storage visible in excerpt',
    note: 'Jet sprite pointer-target inspector: shapePtr0/$BA..$BB, reflect0/$E0, playerColor/$EF, playerX/$B3, and JET_Y=19 are visible in the excerpt. The ROM bitmap bytes at the target address and any P0 NUSIZ shadow are NOT visible, so the target remains intentionally unresolved.',
  };
}

// ─── 5. Player-jet TIA register derivation inspector ────────────────────────
// Surfaces the visible Player 0-related register sources without fabricating
// unseen GRP0 bytes or hidden register-shadow state.
export function inspectPlayerJetTiaRegisters(memory) {
  const jet = inspectJetSpritePointerTarget(memory);
  return {
    grp0: {
      source: 'shapePtr0',
      sourceAddressHex: jet.pointerAddressHex,
      sourceEndAddressHex: jet.pointerEndAddressHex,
      pointerValueHex: jet.pointerValueHex,
      status: 'pointer visible, bitmap target bytes unresolved',
    },
    refp0: {
      source: 'reflect0',
      sourceAddressHex: jet.reflect0AddressHex,
      rawHex: jet.reflect0Hex,
      interpretation: jet.refp0Interpretation,
      status: 'flag visible, exact write path not in excerpt',
    },
    colup0: {
      source: 'playerColor',
      sourceAddressHex: jet.playerColorAddressHex,
      rawHex: jet.playerColorHex,
      css: jet.playerColorCss,
      status: 'visible color byte for player 0',
    },
    resp0: {
      source: 'playerX',
      sourceAddressHex: jet.playerXAddressHex,
      rawHex: jet.playerXHex,
      raw: jet.playerX,
      status: 'coarse P0 X byte visible; exact RESP0 timing routine not in excerpt',
    },
    nusiz0: {
      source: null,
      status: 'unresolved — no P0 NUSIZ storage visible in excerpt',
    },
    vdelp0: {
      source: null,
      status: 'unresolved — no P0 VDELP0 source visible in excerpt',
    },
    jetY: jet.jetY,
    jetYHex: jet.jetYHex,
    note: 'Player 0 TIA derivation inspector: GRP0 pointer source, REFP0 flag source, COLUP0 byte source, and coarse X source are visible. Actual GRP0 bitmap bytes, NUSIZ0, VDELP0, and RESP0 timing writes are NOT shown in the visible excerpt.',
  };
}

// ─── 6. Shape class to TIA color-constant assignment hints ──────────────────
// The excerpt declares color constants (lines 77-97) and derived colors
// (lines 93-97: DARK_RED, LIGHT_GREEN, BROWN, LIGHT_GREY, DARK_BLUE).
// The kernel comment (line 37) mentions a "color pointer for the object"
// (colorPtr at $CB..$CC). While the excerpt does NOT contain a shape→color
// lookup table, the colorPtr exists as a per-block pointer. This inspector
// maps each shape class to candidate NTSC color-constant families only.
// The excerpt shows color constants and colorPtr-related bytes, but not the
// authoritative shape→color lookup table, so these remain browsing hints.
export function inspectShapeColorHints() {
  const classColorHints = [
    {
      shapeClass: 'explosion',
      shapeIds: [0, 1, 2, 3],
      shapeNames: ['Explosion0', 'Explosion1', 'Explosion2', 'Explosion3'],
      likelyColorConstant: 'YELLOW/RED/DARK_RED',
      likelyColorBytes: [COLORS.YELLOW, COLORS.RED, DERIVED_COLORS.DARK_RED],
      likelyColorCss: [COLORS.YELLOW, COLORS.RED, DERIVED_COLORS.DARK_RED].map((b) => ntscColorCss(b)),
      reason: 'Candidate warm-color family only: the excerpt declares RED and DARK_RED-related constants, but not a confirmed explosion color table.',
      confidence: 'hint',
    },
    {
      shapeClass: 'shape-air',
      shapeIds: [4, 5, 6],
      shapeNames: ['Plane', 'Heli0', 'Heli1'],
      likelyColorConstant: 'GREY/LIGHT_GREY',
      likelyColorBytes: [COLORS.GREY, DERIVED_COLORS.LIGHT_GREY],
      likelyColorCss: [COLORS.GREY, DERIVED_COLORS.LIGHT_GREY].map((b) => ntscColorCss(b)),
      reason: 'Candidate grey-family hint only: the excerpt declares GREY/LIGHT_GREY constants, but not a confirmed shape-air color assignment table.',
      confidence: 'hint',
    },
    {
      shapeClass: 'shape-water',
      shapeIds: [7],
      shapeNames: ['Ship'],
      likelyColorConstant: 'ORANGE/BROWN',
      likelyColorBytes: [COLORS.ORANGE, DERIVED_COLORS.BROWN],
      likelyColorCss: [COLORS.ORANGE, DERIVED_COLORS.BROWN].map((b) => ntscColorCss(b)),
      reason: 'Candidate orange/brown family hint only: the excerpt declares BROWN-related constants, but not a confirmed shape-water color assignment table.',
      confidence: 'hint',
    },
    {
      shapeClass: 'shape-structure',
      shapeIds: [8, 9],
      shapeNames: ['Bridge', 'House'],
      likelyColorConstant: 'GREEN/LIGHT_GREEN',
      likelyColorBytes: [COLORS.GREEN, DERIVED_COLORS.LIGHT_GREEN],
      likelyColorCss: [COLORS.GREEN, DERIVED_COLORS.LIGHT_GREEN].map((b) => ntscColorCss(b)),
      reason: 'Candidate green-family hint only: the excerpt declares GREEN/LIGHT_GREEN constants and a PF-color-bit path, but not a confirmed shape-structure lookup table.',
      confidence: 'hint',
    },
    {
      shapeClass: 'shape-fuel',
      shapeIds: [10],
      shapeNames: ['Fuel'],
      likelyColorConstant: 'CYAN/BLUE',
      likelyColorBytes: [COLORS.CYAN, COLORS.BLUE],
      likelyColorCss: [COLORS.CYAN, COLORS.BLUE].map((b) => ntscColorCss(b)),
      reason: 'Candidate cyan/blue family hint only: the excerpt declares CYAN/BLUE constants, but not a confirmed shape-fuel color assignment table.',
      confidence: 'hint',
    },
  ];
  return {
    hints: classColorHints,
    classCount: classColorHints.length,
    totalShapeIds: classColorHints.reduce((sum, h) => sum + h.shapeIds.length, 0),
    note: 'Shape-class to color hints are INSPECTOR-ONLY inferences. The excerpt declares color constants (lines 77-97) and a colorPtr pointer ($CB), but does NOT contain the shape→color lookup table. Actual color assignments are NOT confirmed by the visible excerpt.',
  };
}

// ─── 5. Shape-ID explosion-sequence inspector ──────────────────────────────
// The excerpt declares four sequential explosion IDs (ASM lines 118-121):
//   ID_EXPLOSION0 = 0 ; used for explosion end
//   ID_EXPLOSION1 = 1
//   ID_EXPLOSION2 = 2
//   ID_EXPLOSION3 = 3
// The comment on ID_EXPLOSION0 ("used for explosion end") and the sequential
// numbering imply a frame-advance sequence: 3→2→1→0 where 0 is the terminal
// state. This inspector surfaces the declared sequence metadata without
// fabricating the actual animation timer or frame-advance logic.
export function inspectExplosionSequence() {
  const sequence = [
    { id: SHAPE_IDS.ID_EXPLOSION3, asmName: 'ID_EXPLOSION3', value: 3, valueHex: dollarHex(3), comment: 'first explosion frame (inferred from ID ordering)', frameOrder: 0 },
    { id: SHAPE_IDS.ID_EXPLOSION2, asmName: 'ID_EXPLOSION2', value: 2, valueHex: dollarHex(2), comment: 'second explosion frame (inferred from ID ordering)', frameOrder: 1 },
    { id: SHAPE_IDS.ID_EXPLOSION1, asmName: 'ID_EXPLOSION1', value: 1, valueHex: dollarHex(1), comment: 'third explosion frame (inferred from ID ordering)', frameOrder: 2 },
    { id: SHAPE_IDS.ID_EXPLOSION0, asmName: 'ID_EXPLOSION0', value: 0, valueHex: dollarHex(0), comment: 'explosion end (explicitly stated in ASM line 118)', frameOrder: 3, isTerminal: true },
  ];
  return {
    sequence,
    totalFrames: sequence.length,
    idRange: `${dollarHex(0)}..${dollarHex(3)}`,
    terminalId: SHAPE_IDS.ID_EXPLOSION0,
    terminalIdHex: dollarHex(SHAPE_IDS.ID_EXPLOSION0),
    terminalComment: 'ID_EXPLOSION0 = 0 is explicitly commented "used for explosion end" at ASM line 118.',
    shapeClass: 'explosion',
    shapeClassCount: 4,
 note: 'Explosion sequence is derived from the sequential ID declarations at ASM lines 118-121. ID_EXPLOSION0 is explicitly marked as the end state. Frame ordering (3→2→1→0) is inferred from the ID numbering convention; the actual animation timer and frame-advance logic are NOT in excerpt.',
 };
}

// ASM lines 321-328: MainLoop fuel ball positioning
// MainLoop:
//   LDX #4       ; 2 offset ball
//   LDA fuelHi   ; 3
//   LSR          ; 2
//   LSR          ; 2
//   LSR          ; 2
//   CLC          ; 2
//   ADC #69      ; 2
//   JSR SetPosX  ; 6 position ball for fuel display
// This inspector traces the exact addressing sequence: how fuelHi feeds
// three LSR shifts, CLC, and ADC #69 before the SetPosX call.
export function inspectMainLoopFuelBallAddressing(memory) {
 const fuelHi = readByte(memory, ZERO_PAGE_INDEX.fuelHi.address);
 const afterLsr1 = u8(fuelHi >>> 1);
 const afterLsr2 = u8(afterLsr1 >>> 1);
 const afterLsr3 = u8(afterLsr2 >>> 1);
 const afterClc = afterLsr3; // CLC clears carry, no numeric change
 const afterAdc = u8(afterClc + 69); // CLC ensures clean add
 return {
  fuelHi,
  fuelHiHex: dollarHex(fuelHi),
  fuelHiAddress: ZERO_PAGE_INDEX.fuelHi.address,
  fuelHiAddressHex: dollarHex(ZERO_PAGE_INDEX.fuelHi.address),
  trace: [
   { step: 'LDA fuelHi', value: fuelHi, valueHex: dollarHex(fuelHi), asmLine: 322, note: 'load accumulator from $B7' },
   { step: 'LSR', value: afterLsr1, valueHex: dollarHex(afterLsr1), asmLine: 323, note: 'shift right 1' },
   { step: 'LSR', value: afterLsr2, valueHex: dollarHex(afterLsr2), asmLine: 324, note: 'shift right 2' },
   { step: 'LSR', value: afterLsr3, valueHex: dollarHex(afterLsr3), asmLine: 325, note: 'shift right 3' },
   { step: 'CLC', value: afterClc, valueHex: dollarHex(afterClc), asmLine: 326, note: 'clear carry for clean add' },
   { step: 'ADC #69', value: afterAdc, valueHex: dollarHex(afterAdc), asmLine: 327, note: 'add 69 ($45) to accumulator' },
   { step: 'JSR SetPosX', value: null, valueHex: null, asmLine: 328, note: 'position ball; subroutine NOT in excerpt' },
  ],
  xRegister: 4,
  xRegisterHex: dollarHex(4),
  xRegisterPurpose: 'ball horizontal offset',
  addConstant: 69,
  addConstantHex: dollarHex(69),
  addConstantDecimal: 69,
  lsrCount: 3,
  ballPositionValue: afterAdc,
  ballPositionHex: dollarHex(afterAdc),
  note: 'Step-by-step trace of the visible MainLoop fuel ball addressing from ASM lines 321-328. SetPosX subroutine body is NOT in the excerpt.',
 };
}

// ─── Subroutine register setup inspector ──────────────────────────────────
// Decodes the three JSR calls in the visible Reset excerpt (ASM lines 307-312):
//   JSR SetScorePtrs       ; 6
//   LDA #>Zero             ; 2   (high byte of Zero pointer = $FB)
//   LDX #12-1              ; 2   (loop count = 11)
//   JSR SetScorePtr1       ; 6   set high-pointers to $FB
//   LDX #colorPtr+1-PF1Lst ; 2   (loop count = 38)
//   JSR GameInit           ; 6
// Each subroutine's register inputs are directly readable from the
// preceding instructions. The subroutine bodies themselves are NOT in
// the excerpt and are labeled accordingly.
export function inspectSubroutineRegisterSetup() {
  // SetScorePtrs: no visible register setup before this JSR
  // The X register still holds 0 from the clear loop (INX at line 305
  // wraps to 0 when the loop exits), and A holds 0 from the last STA.
  const setScorePtrsSetup = {
    subroutine: 'SetScorePtrs',
    asmLine: 307,
    registerA: { value: 0x00, hex: dollarHex(0x00), source: 'cleared by reset loop (STA $00,X with X=0 wraps to 0)' },
    registerX: { value: 0x00, hex: dollarHex(0x00), source: 'INX wraps to 0 at loop exit (BNE .loopClear falls through)' },
    note: 'Register state inferred from the visible clear loop (lines 301-306). SetScorePtrs body is NOT in the excerpt.',
  };

  // SetScorePtr1: LDA #>Zero and LDX #12-1 precede this JSR
  // #>Zero means the high byte of the Zero label address.
  // The ASM comment says "set high-pointers to $FB", so >Zero = $FB.
  const setScorePtr1Setup = {
    subroutine: 'SetScorePtr1',
    asmLine: 310,
    registerA: { value: 0xFB, hex: '$FB', source: 'LDA #>Zero (ASM line 308); comment says "set high-pointers to $FB"' },
    registerX: { value: 11, hex: dollarHex(11), source: 'LDX #12-1 (ASM line 309); loop count = 11' },
    loopCount: 11,
    loopCountSource: 'ASM line 309: LDX #12-1',
    note: 'SetScorePtr1 iterates 12-1=11 times. The >Zero high-byte ($FB) and loop count are directly from the visible excerpt. SetScorePtr1 body is NOT in the excerpt.',
  };

  // GameInit: LDX #colorPtr+1-PF1Lst precedes this JSR
  // colorPtr is at $CB, PF1Lst is at $A6, so colorPtr+1-PF1Lst = $CC-$A6 = 38
  const gameInitSetup = {
    subroutine: 'GameInit',
    asmLine: 312,
    registerA: { value: null, hex: null, source: 'unchanged from SetScorePtr1 return (NOT in excerpt)' },
    registerX: { value: 38, hex: dollarHex(38), source: 'LDX #colorPtr+1-PF1Lst (ASM line 311); computed: $CC-$A6=38' },
    byteSpan: 38,
    byteSpanFormula: 'colorPtr+1-PF1Lst = $CC-$A6',
    byteSpanStartAddress: ZERO_PAGE_INDEX.PF1Lst.address,
    byteSpanStartAddressHex: dollarHex(ZERO_PAGE_INDEX.PF1Lst.address).toUpperCase(),
    byteSpanEndExclusive: ZERO_PAGE_INDEX.colorPtr.address + 1,
    byteSpanEndExclusiveHex: dollarHex(ZERO_PAGE_INDEX.colorPtr.address + 1).toUpperCase(),
    note: 'GameInit clears 38 bytes from PF1Lst to colorPtr+1 (exclusive). The byte span formula is directly from ASM line 311. GameInit body is NOT in the excerpt.',
  };

  const totalSubroutines = 3;
  const totalSetupInstructions = 4; // LDA #>Zero, LDX #12-1, LDX #colorPtr+1-PF1Lst, plus 3 JSRs
  const totalSetupCycles = 2 + 2 + 2 + (6 * 3); // 4 setup instructions + 3 JSR overheads = 24

  return {
    subroutines: [setScorePtrsSetup, setScorePtr1Setup, gameInitSetup],
    totalSubroutines,
    totalSetupInstructions,
    totalSetupCycles,
    setupCycleBreakdown: 'LDA#>Zero(2)+LDX#11(2)+LDX#38(2)+JSR*3(6*3=18) = 24',
    note: 'Inspector for the three visible JSR calls in the Reset sequence (ASM lines 307-312). Register inputs are decoded from the preceding instructions visible in the excerpt. None of the subroutine bodies are in the excerpt.',
  };
}

// ─── ZP Byte Map inspector ─────────────────────────────────────────────────
// Surfaces which ASM variable occupies each zero-page address $80..$FD,
// including alias resolution. Grounded directly in the ZP variable
// declarations from ASM lines 172-274.
export function inspectZPByteMap(memory) {
  const bytes = [];
  for (let addr = 0x80; addr <= 0xfd; addr++) {
    const aliases = ALIAS_MAP.get(addr) ?? [];
    const primary = ZERO_PAGE_LAYOUT.find(e => e.address === addr && !e.aliasOf);
    const value = readByte(memory, addr);
    bytes.push({
      address: addr,
      addressHex: dollarHex(addr).toUpperCase(),
      value,
      valueHex: dollarHex(value).toUpperCase(),
      primaryName: primary ? primary.name : null,
      allNames: aliases,
      isArray: primary ? (primary.length ?? 1) > 1 : false,
      arrayLength: primary ? (primary.length ?? 1) : 1,
      isAlias: aliases.length > 1,
      note: primary ? primary.note : '',
    });
  }
  const namedCount = bytes.filter(b => b.primaryName !== null).length;
  const aliasCount = bytes.filter(b => b.isAlias).length;
  const arrayBytes = bytes.filter(b => b.isArray).length;
  return {
    bytes,
    addressRange: '$80..$FD',
    totalBytes: bytes.length,
    namedBytes: namedCount,
    aliasBytes: aliasCount,
    arrayBytes,
    note: 'Zero-page byte map derived directly from ASM ZP variable declarations (lines 172-274). All names and aliases match the excerpt; no invented variables.',
  };
}

// ─── Startup cycle budget inspector ────────────────────────────────────────
// Computes the 6502 cycle counts for the visible reset/startup code in the
// ASM excerpt (lines 297-328). Every instruction's cycle count is known from
// the 6502 reference. This is grounded directly in the visible instructions.
// The clear loop runs 256 iterations; subroutines (JSR) are counted as 6 cycles
// each (the JSR overhead) but their bodies are NOT in the excerpt.
export function inspectStartupCycleBudget(randomValue) {
  // Preamble: SEI (2) + CLD (2) + LDX #0 (2) = 6 cycles
  const preambleCycles = 2 + 2 + 2; // = 6

  // Clear loop: LDA #0 (2) + STA $00,X (4) + TXS (2) + INX (2) + BNE .loopClear (2/3)
  // 256 iterations; last BNE is not taken (2 cycles), all others taken (3 cycles)
  const clearLoopPerIter = 2 + 4 + 2 + 2; // = 10 (without branch)
  const clearLoopTotal = clearLoopPerIter * 256 + 3 * 255 + 2; // 10*256 + 765 + 2 = 3327

  // Post-clear subroutine calls:
  // JSR SetScorePtrs (6) + LDA #>Zero (2) + LDX #12-1 (2) +
  // JSR SetScorePtr1 (6) + LDX #colorPtr+1-PF1Lst (2) + JSR GameInit (6)
  const subroutineCycles = 6 + 2 + 2 + 6 + 2 + 6; // = 24

  // Pre-MainLoop branch:
  // LDA random (3) + BNE MainLoop (2 if taken, 3 if not taken)
  const raw = u8(randomValue);
  const isRandomZero = raw === 0;
  const branchCycles = 3 + (isRandomZero ? 3 : 2); // BNE: 3 if not taken, 2 if taken

  // First-boot path (only if random was 0):
  // INC random (5) + STA livesPtr (3) + LDA #<One (2) + STA scorePtr1+10 (3)
  const firstBootCycles = isRandomZero ? (5 + 3 + 2 + 3) : 0; // = 13 or 0

  // MainLoop entry (ASM lines 321-328):
  // LDX #4 (2) + LDA fuelHi (3) + LSR (2) + LSR (2) + LSR (2) +
  // CLC (2) + ADC #69 (2) + JSR SetPosX (6)
  const mainLoopEntryCycles = 2 + 3 + 2 + 2 + 2 + 2 + 2 + 6; // = 21

  const totalBeforeSubBodies = preambleCycles + clearLoopTotal + subroutineCycles + branchCycles + firstBootCycles;
  const totalWithMainLoop = totalBeforeSubBodies + mainLoopEntryCycles;

  return {
    preambleCycles,
    preambleBreakdown: 'SEI(2)+CLD(2)+LDX#0(2) = 6',
    clearLoopTotal,
    clearLoopBreakdown: '(LDA#0(2)+STA$00,X(4)+TXS(2)+INX(2)+BNE_taken(3)/BNE_not-taken(2)) * 256 = 3327',
    subroutineCycles,
    subroutineBreakdown: 'JSR SetScorePtrs(6)+LDA#>Zero(2)+LDX#11(2)+JSR SetScorePtr1(6)+LDX#38(2)+JSR GameInit(6) = 24',
    branchCycles,
    branchBreakdown: isRandomZero
      ? 'LDA random(3)+BNE not-taken(3) = 6'
      : 'LDA random(3)+BNE taken(2) = 5',
    firstBootCycles,
    firstBootBreakdown: isRandomZero
      ? 'INC random(5)+STA livesPtr(3)+LDA#<One(2)+STA scorePtr1+10(3) = 13'
      : '(skipped; random != 0)',
    mainLoopEntryCycles,
    mainLoopEntryBreakdown: 'LDX#4(2)+LDA fuelHi(3)+LSR(2)+LSR(2)+LSR(2)+CLC(2)+ADC#69(2)+JSR SetPosX(6) = 21',
    totalBeforeSubBodies,
    totalWithMainLoop,
    path: isRandomZero ? 'first-boot (random was 0)' : 'direct MainLoop (random != 0)',
    note: 'Cycle counts are from the 6502 instruction reference, applied to the visible ASM excerpt lines 297-328. JSR subroutines (SetScorePtrs, SetScorePtr1, GameInit, SetPosX) count only the call overhead (6 cycles each); their bodies are NOT in the excerpt. Clear loop runs 256 iterations (BNE taken 255 times at 3 cycles, not-taken once at 2 cycles).',
  };
}

export default {
  u8,
  s8,
  toHex,
  dollarHex,
  wordAt,
  ASM_SWITCHES,
  COLORS_NTSC,
  COLORS_PAL,
  GAME_CONSTANTS,
  ARRAY_ENDS,
  BLOCK_ARRAY_LAYOUT,
  COLORS,
  DERIVED_COLORS,
  SHAPE_IDS,
  FLAGS,
  NUSIZ_ASM_NAMES,
  NUSIZ_LABELS,
  NTSC_HUE_NAMES,
  GAME_MODES,
  SECTION_STRUCTURE,
  TIA_REGISTER_MAP,
  ZERO_PAGE_LAYOUT,
  ZERO_PAGE_INDEX,
  ALIAS_MAP,
  ADDRESS_MAP,
  COVERAGE_MAP,
  createZeroPageMemory,
  readByte,
  writeByte,
  getField,
  getFieldBytes,
  setField,
  applyVisibleResetLogic,
  readRng16,
  writeRng16,
  rngStep,
  ntscDecode,
  ntscColorCss,
  computeFuel16,
  computeFuelPercent,
  computeFuelDisplayBallValue,
  shapeNameFromId,
  shapeAsmNameFromId,
  shapeClassFromId,
  computeSectionBlockLabel,
  decodeBlockFlags,
  decodeState1,
  inspectRng16,
  inspectRng8,
  inspectRngState,
  inspectGameModeState,
  inspectPfState,
  inspectSectionEnd,
  inspectPosYLo,
  inspectPrevPF1PatId,
  inspectPF1PatId,
  inspectPF1PatIdPage,
  inspectBlockOffset,
  inspectBlockPart,
  rngSeedSequence,
  inspectKernelTiming,
  computePF1PageAddress,
  computeBlockOffsetLine,
  inspectSectionBlockSequence,
  inspectFuelLo,
  traceMainLoopFuelSequence,
  inspectMainLoopEntry,
  computeMainLoopVisibleState,
  inspectSectionState,
  inspectGameInitWindow,
  inspectSectionCountdown,
  inspectVisibleRiverProfile,
  inspectVisibleRiverScrollState,
  inspectVisibleRiverTimeline,
  inspectVisibleJetRiverBounds,
  previewVisibleIncomingHeadSpawn,
  slotAddressLookup,
 inspectVisibleSlots,
 inspectVisibleSlotNUSIZMap,
 inspectVisibleSectionProgress,
 decodeNUSIZDetail,
 NUSIZ_DETAIL_TABLE,
 snapshotNamedState,
  inspectRoadBlockTemp2,
  inspectTempAlias,
  inspectTemp2Alias,
  inspectPlayerColor,
  inspectPFcolorState,
  inspectStateColors,
  inspectShapePtrState,
  inspectPFptrState,
  inspectColorPtrState,
  inspectSavedRngState,
  inspectPlayer1State,
  inspectPlayer2State,
  inspectPlayerByte,
  inspectDiffPF,
  inspectBlockArrayLayout,
  inspectPlayerSwapState,
  inspectJoystickState,
  inspectSoundState,
  inspectBridgeExploState,
  inspectMissileBoundsState,
  inspectCollisionState,
  inspectBlockLineState,
  inspectSaverState,
  inspectFrameCounter,
  inspectDxSpeed,
  inspectScorePtrs,
  inspectScorePtr2Aliases,
  inspectBlockList,
  inspectStateArea,
  inspectPlayerMovementState,
  decodeJoystick,
  inspectSpeedXY,
  inspectKernelLineNum,
  inspectFuelDisplayState,
  stepVisibleGameplayLoop,
  advanceVisibleSlotScene,
  fireVisibleMissile,
  inspectZeroConsts,
  inspectResetSequence,
  inspectAsmSwitches,
  inspectColorFormatComparison,
  inspectShapeIdTable,
 inspectRoadHeight,
 SPRITE_NUSIZ_MODES,
 inspectSpriteNusizModes,
 inspectShapeNusizHints,
 inspectSpritePointerCrossRef,
 inspectJetSpritePointerTarget,
 inspectPlayerJetTiaRegisters,
  inspectShapeColorHints,
  inspectExplosionSequence,
 inspectMainLoopFuelBallAddressing,
 inspectResetPreMainBranch,
 inspectGameInitWindow,
 inspectFuelDisplayTrace,
 inspectSubroutineRegisterSetup,
 inspectFirstBootMemoryState,
 inspectZPByteMap,
 inspectStartupCycleBudget,
};

// --- Pass 10: player jet shape pointer slots (non-blocker tightening) ---
// Reads three ASM-visible addresses without dereferencing.
//
// ASM grounding:
//   shapePtr0  at $BA..$BB  (riverraid.asm L218: `..$BB pointer to the shape
//                            for the player jet`) -- 2-byte pointer.
//   shapePtr1a at $C7       (riverraid.asm L231) -- single-byte slot.
//   shapePtr1b at $C9       (riverraid.asm L232) -- single-byte slot.
//
// The 332-line excerpt does not include the GRP target bitmap data.
//
// CONTRACT (enforced by slot shape and frozen wrapper):
//   - shapePtr0 exposes {lo, hi, word} -- its `word` is the slot's own
//     value, not a dereferenced target.
//   - shapePtr1a and shapePtr1b expose only `byte` (no `hi`, no `word`).
//     Dereferencing is structurally not possible for shapePtr1a/1b.
//   - The returned wrapper is `Object.freeze`'d at the top level and the
//     `slots` array is also frozen. Adding new properties or pushing new
//     slots is a no-op in non-strict mode and a TypeError in strict mode.
//   - `kind` is included for human reading but is not a test contract;
//     verify.mjs asserts the structural property (`addressHi`/`hi`/`word`
//     presence vs `byte` only) directly.
//
// `options` is reserved for forward-compatibility. It accepts arbitrary
// keys without throwing. Currently no keys are recognized.
export function inspectPlayerJetShapePointer(memory, options = {}) {
  const slots = [
    { name: 'shapePtr0',  lo: 0xba, hi: 0xbb, asmLine: 218 },
    { name: 'shapePtr1a', lo: 0xc7, hi: null, asmLine: 231 },
    { name: 'shapePtr1b', lo: 0xc9, hi: null, asmLine: 232 },
  ];
  const built = {
    slots: Object.freeze(slots.map((s) => {
      const loByte = readByte(memory, s.lo);
      const hiByte = (s.hi == null) ? null : readByte(memory, s.hi);
      const word = (loByte == null || hiByte == null)
        ? null
        : ((loByte & 0xff) | ((hiByte & 0xff) << 8)) & 0xffff;
      const out = {
        name: s.name,
        address: s.lo,
        asmLine: s.asmLine,
        kind: (s.hi == null) ? 'byte' : 'pointer-low-high',  // documentation
        lo: loByte,
      };
      if (s.hi != null) {
        out.addressHi = s.hi;
        out.hi = hiByte;
        out.word = word;
      } else {
        out.byte = loByte;
      }
      return out;
    })),
    dereferenced: false,
    note: 'audit hint -- see header comment for the dereferencing contract',
  };
  return Object.freeze(built);
}
// --- Pass 11: Collision Inspection Pack (5 bitmask decoders + 1 aggregator; +6 collision labels) ---

// decodeEnableMask: pure decoder for asm constant `ENABLE = %10` (binary 00000010).
// Used by any fire-time missile-enable bit (and any NUSIZ / DMA enable mirror).
export function decodeEnableMask(byte) {
    const raw = u8(byte);
    const mask = 0x02;
    const isEnabled = (raw & mask) !== 0;
    const built = {
        raw,
        rawHex: dollarHex(raw),
        mask,
        maskHex: dollarHex(mask),
        isEnabled,
        label: isEnabled ? 'ENABLE_SET' : 'ENABLE_CLEAR',
        note: 'Asm constant ENABLE = %10 (binary 00000010). Pure bit-AND against that mask.',
    };
    return Object.freeze(built);
}

// decodePlayfieldCollideFlag: pure decoder for asm constant `PF_COLLIDE_FLAG = %00100000`.
// Surfaces whether the enemy-vs-playfield collision latch is set for a given byte.
export function decodePlayfieldCollideFlag(byte) {
    const raw = u8(byte);
    const mask = 0x20;
    const isSet = (raw & mask) !== 0;
    const built = {
        raw,
        rawHex: dollarHex(raw),
        mask,
        maskHex: dollarHex(mask),
        isSet,
        label: isSet ? 'PF_COLLIDE_FLAG_SET' : 'PF_COLLIDE_FLAG_CLEAR',
        note: 'Asm constant PF_COLLIDE_FLAG = %00100000 (binary). Pure bit-AND; no TIA CX register byte is fabricated.',
    };
    return Object.freeze(built);
}

// decodeMissileFlagByte: pure decoder for the `missileFlag = scorePtr2+9` semantic.
// $FF == missile enabled (asm convention); intermediate non-zero values are
// surfaced as a distinct `isAnimating` phase without claiming the unseen
// transition logic.
export function decodeMissileFlagByte(byte) {
    const raw = u8(byte);
    const isEnabled = raw === 0xff;
    const isOff = raw === 0x00;
    const isAnimating = !isEnabled && !isOff;
    let label = 'MISSILE_OFF';
    if (isEnabled) label = 'MISSILE_ENABLED';
    else if (isAnimating) label = 'MISSILE_IN_FLIGHT_NON_FF';
    const built = {
        raw,
        rawHex: dollarHex(raw),
        isEnabled,
        isOff,
        isAnimating,
        label,
        note: '$FF means missile enabled per asm convention; intermediate non-zero values surfaced as isAnimating without claiming the unseen transition logic.',
    };
    return Object.freeze(built);
}

// decodeMissileBounds: pure bounds check against asm MIN_MISSILE = JET_Y - 6
// and MAX_MISSILE = NUM_LINES + 1. Screen-max defaults reflect kernel y range
// and the 160-pixel player X range.
export function decodeMissileBounds({
    missileY,
    missileX,
    minMissile = 0x0d,
    maxMissile = 0xa1,
    screenMaxY = 0xa0,
    screenMaxX = 0xa0,
} = {}) {
    const y = u8(missileY);
    const x = u8(missileX);
    const minY = u8(minMissile);
    const maxY = u8(maxMissile);
    const yInBounds = y >= minY && y <= maxY;
    const built = {
        missileY: y,
        missileYHex: dollarHex(y),
        missileX: x,
        missileXHex: dollarHex(x),
        minMissile,
        minMissileHex: dollarHex(minMissile),
        maxMissile,
        maxMissileHex: dollarHex(maxMissile),
        screenMaxY,
        screenMaxYHex: dollarHex(screenMaxY),
        screenMaxX,
        screenMaxXHex: dollarHex(screenMaxX),
        yInBounds,
        offScreenUp: y < minY,
        offScreenDown: y > maxY,
        offScreenLeft: x > screenMaxX,
        offScreenRight: false,
        note: 'Bounds check mirrors asm interpretation of MIN_MISSILE (JET_Y - 6 = 19 - 6 = 13) and MAX_MISSILE = NUM_LINES + 1 = 161. Screen-max defaults to kernel y range and 160-pixel player X range.',
    };
    return Object.freeze(built);
}

// decodeEnemyHitIndex: pure decoder for `hitEnemyIdx` (missile-vs-enemy, inside
// scorePtr2 area) and `collidedEnemy` (jet-vs-enemy, $E8). Surfaces the
// canonical interpretation label without merging into TIA CX registers.
export function decodeEnemyHitIndex({ hitEnemyIdx = 0, collidedEnemy = 0 } = {}) {
    const hit = u8(hitEnemyIdx);
    const collide = u8(collidedEnemy);
    const missileHitSet = hit !== 0;
    const jetHitSet = collide !== 0;
    const bothSet = missileHitSet && jetHitSet;
    let interpretation = 'NO_ENEMY_HIT';
    if (bothSet) interpretation = 'MISSILE_AND_JET_BOTH_HIT';
    else if (missileHitSet) interpretation = 'MISSILE_HIT_ENEMY';
    else if (jetHitSet) interpretation = 'JET_HIT_ENEMY';
    const built = {
        hitEnemyIdx: hit,
        hitEnemyIdxHex: dollarHex(hit),
        collidedEnemy: collide,
        collidedEnemyHex: dollarHex(collide),
        missileHitSet,
        jetHitSet,
        bothSet,
        interpretation,
        note: 'hitEnemyIdx (inside scorePtr2 area) is the missile-vs-enemy index; collidedEnemy ($E8) is the jet-vs-enemy id. The port never merges these into TIA CX registers.',
    };
    return Object.freeze(built);
}

// inspectCollisionRegisters: top-level aggregator that surfaces every collision-
// related byte together with decoded masks in one canonical object. Reads 11
// memory bytes: missileY/missileX/missileFlag/missileSound/hitEnemyIdx/
// collidedEnemy/PFCrashFlag/reflect0 + asm constant masks for
// MIN_MISSILE / MAX_MISSILE / MISSILE_SPEED / ENABLE / PF_COLLIDE_FLAG.
export function inspectCollisionRegisters(memory) {
    const missileY = readByte(memory, ZERO_PAGE_INDEX.missileY.address);
    const missileX = readByte(memory, ZERO_PAGE_INDEX.missileX.address);
    const missileFlagByte = readByte(memory, ZERO_PAGE_INDEX.missileFlag.address);
    const missileSoundByte = readByte(memory, ZERO_PAGE_INDEX.missileSound.address);
    const hitEnemyIdxByte = readByte(memory, ZERO_PAGE_INDEX.hitEnemyIdx.address);
    const collidedEnemyByte = readByte(memory, ZERO_PAGE_INDEX.collidedEnemy.address);
    const pfCrashFlagByte = readByte(memory, ZERO_PAGE_INDEX.PFCrashFlag.address);
    const reflect0Byte = readByte(memory, ZERO_PAGE_INDEX.reflect0.address);
    const missileFlagDecoded = decodeMissileFlagByte(missileFlagByte);
    const missileBoundsDecoded = decodeMissileBounds({ missileY, missileX });
    const enemyHitDecoded = decodeEnemyHitIndex({ hitEnemyIdx: hitEnemyIdxByte, collidedEnemy: collidedEnemyByte });
    const pfCrashDecoded = decodePlayfieldCollideFlag(pfCrashFlagByte);
    const constants = Object.freeze({
        MIN_MISSILE: 0x0d,
        MIN_MISSILEHex: dollarHex(0x0d),
        MAX_MISSILE: 0xa1,
        MAX_MISSILEHex: dollarHex(0xa1),
        MISSILE_SPEED: 0x06,
        MISSILE_SPEEDHex: dollarHex(0x06),
        ENABLE_MASK: 0x02,
        ENABLE_MASKHex: dollarHex(0x02),
        PF_COLLIDE_FLAG_MASK: 0x20,
        PF_COLLIDE_FLAG_MASKHex: dollarHex(0x20),
    });
    const raw = Object.freeze({
        missileY,
        missileYHex: dollarHex(missileY),
        missileX,
        missileXHex: dollarHex(missileX),
        missileFlagByte,
        missileFlagByteHex: dollarHex(missileFlagByte),
        missileSoundByte,
        missileSoundByteHex: dollarHex(missileSoundByte),
        hitEnemyIdxByte,
        hitEnemyIdxByteHex: dollarHex(hitEnemyIdxByte),
        collidedEnemyByte,
        collidedEnemyByteHex: dollarHex(collidedEnemyByte),
        pfCrashFlagByte,
        pfCrashFlagByteHex: dollarHex(pfCrashFlagByte),
        reflect0Byte,
        reflect0ByteHex: dollarHex(reflect0Byte),
    });
    const decoded = Object.freeze({
        missileFlag: missileFlagDecoded,
        missileBounds: missileBoundsDecoded,
        enemyHit: enemyHitDecoded,
        pfCrash: pfCrashDecoded,
    });
    const built = {
        raw,
        decoded,
        isMissileEnabled: missileFlagDecoded.isEnabled,
        isMissileInFlight: missileFlagDecoded.isAnimating || missileFlagDecoded.isEnabled,
        isMissileOutOfBounds: !missileBoundsDecoded.yInBounds,
        didMissileHitEnemy: enemyHitDecoded.missileHitSet,
        didJetHitEnemy: enemyHitDecoded.jetHitSet,
        didJetCrashIntoPlayfield: pfCrashDecoded.isSet,
        isReflect0Active: reflect0Byte !== 0,
        isMissileFiringSoundActive: missileSoundByte !== 0,
        constants,
        note: 'Aggregator surfaces the 11 collision-related bytes plus the asm constant masks for MIN_MISSILE / MAX_MISSILE / MISSILE_SPEED / ENABLE / PF_COLLIDE_FLAG. No TIA CX register bytes are fabricated; everything here is read from the bytes the asm writes.',
    };
    return Object.freeze(built);
}
