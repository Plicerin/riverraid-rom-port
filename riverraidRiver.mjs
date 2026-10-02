// River Raid river: block generation and playfield, ported from the ROM.
//
// The block generator is an instruction-for-instruction port of the main
// loop from .setBlockVars to .mainLoopJmp (Jentzsch lines 1846-2244,
// $F85D-$F85A) and the subroutines it calls. It runs on the 256-byte zero
// page image used by riverraidVisiblePort.mjs, where each variable lives at
// its ROM address. tools/verify-blockgen.mjs checks it against the real
// routine running on a 6502 core.

import {
  PF_PAGE_FC, PF_PAGE_FD, BANK_PTR_TAB, PAGE_FLAG_TAB, SHAPE_POS_TAB, ENEMY_ID_TAB, ROAD_COLOR_TAB, INIT_TAB,
} from './riverraidPlayfieldData.mjs';

// zero page addresses (Jentzsch lines 168-275)
export const ZP = Object.freeze({
  dXSpeed: 0x87, prevPF1PatId: 0x88, PF_State: 0x89, sectionEnd: 0x8a, blockOffset: 0x8b, posYLo: 0x8c,
  bridgeExplode: 0x8d, blockLst: 0x8e, XPos1Lst: 0x94, State1Lst: 0x9a, Shape1IdLst: 0xa0, PF1Lst: 0xa6,
  PF2Lst: 0xac, missileY: 0xb2, playerX: 0xb3, speedX: 0xb4, speedY: 0xb5, blockPart: 0xb6, fuelHi: 0xb7,
  fuelLo: 0xb8, sectionBlock: 0xb9, PF1PatId: 0xbc, level: 0xbd, randomLoSave: 0xbe, randomHiSave: 0xbf,
  blockNum: 0xde, randomLo: 0xe9, randomHi: 0xea, randomLoSave2: 0xeb, randomHiSave2: 0xec, temp2: 0xed,
  valleyWidth: 0xee, temp: 0xf2, maxId: 0xfc,
  reflect0: 0xe0, hitEnemyIdx: 0xe2, PFCrashFlag: 0xe4, missileFlag: 0xe6, collidedEnemy: 0xe8, missileX: 0xf5,
});

export const NUM_BLOCKS = 6;
export const BLOCK_SIZE = 32;
export const SECTION_BLOCKS = 16;
export const ROAD_HEIGHT = 13;

export const BLOCK_FLAGS = Object.freeze({
  PF1_PAGE: 0x01, PF2_PAGE: 0x02, PF_COLOR: 0x04, PATROL: 0x10, PF_COLLIDE: 0x20, ENEMY_MOVE: 0x40, PF_ROAD: 0x80,
});
const ISLAND_FLAG = 0x80;
const SWITCH_PAGE_ID = 9;
const ID_HOUSE = 9, ID_FUEL = 10, ID_SHIP = 7, ID_BRIDGE = 8;
const DOUBLE_SIZE = 0b101, QUAD_SIZE = 0b111, DIRECTION_FLAG = 0x08;

const END = (list) => list + NUM_BLOCKS - 1;

// 6502 register/flag model operating on the zero page image.
export class Regs {
  constructor(mem) { this.m = mem; this.a = 0; this.x = 0; this.y = 0; this.c = 0; this.n = 0; this.z = 0; this.v = 0; }
  nz(v) { v &= 0xff; this.n = v >> 7; this.z = v === 0 ? 1 : 0; return v; }
  rd(addr) { return this.m[addr & 0xff]; }
  wr(addr, v) { this.m[addr & 0xff] = v & 0xff; }
  lda(v) { this.a = this.nz(v); }
  ldx(v) { this.x = this.nz(v); }
  ldy(v) { this.y = this.nz(v); }
  adc(v) {
    const r = this.a + v + this.c;
    this.c = r > 0xff ? 1 : 0;
    this.v = ((~(this.a ^ v) & (this.a ^ r)) & 0x80) ? 1 : 0;
    this.a = this.nz(r);
  }
  sbc(v) { this.adc(v ^ 0xff); }
  cmp(reg, v) { this.c = reg >= v ? 1 : 0; this.nz(reg - v); }
  and(v) { this.a = this.nz(this.a & v); }
  ora(v) { this.a = this.nz(this.a | v); }
  eor(v) { this.a = this.nz(this.a ^ v); }
  bit(v) { this.z = (this.a & v) === 0 ? 1 : 0; this.n = (v >> 7) & 1; this.v = (v >> 6) & 1; }
  asl() { this.c = this.a >> 7; this.a = this.nz(this.a << 1); }
  lsr() { this.c = this.a & 1; this.a = this.nz(this.a >> 1); }
  rol() { const c = this.c; this.c = this.a >> 7; this.a = this.nz((this.a << 1) | c); }
  rolMem(addr) { const v = this.rd(addr); const c = this.c; this.c = v >> 7; this.wr(addr, this.nz((v << 1) | c)); }
  inc(addr) { this.wr(addr, this.nz(this.rd(addr) + 1)); }
  dec(addr) { this.wr(addr, this.nz(this.rd(addr) - 1)); }
  inx() { this.x = this.nz(this.x + 1); }
  dex() { this.x = this.nz(this.x - 1); }
  iny() { this.y = this.nz(this.y + 1); }
  dey() { this.y = this.nz(this.y - 1); }
  tax() { this.x = this.nz(this.a); }
  txa() { this.a = this.nz(this.x); }
  tay() { this.y = this.nz(this.a); }
  tya() { this.a = this.nz(this.y); }
}

// NextRandom16 ($FAC6): 16 bit LFSR
function nextRandom16(r) {
  r.lda(r.rd(ZP.randomHi));
  r.asl(); r.asl(); r.asl();
  r.eor(r.rd(ZP.randomHi));
  r.asl();
  r.rolMem(ZP.randomLo);
  r.rolMem(ZP.randomHi);
}

// SaveSection ($FAD3): next level, save random state for restarting the section
export function saveSection(r) {
  r.ldx(r.rd(ZP.level));
  r.cmp(r.x, 48);
  if (!r.c) { /* .notMax */ } else r.ldx(48 - 2);
  r.lda(r.rd(ZP.randomLoSave)); r.wr(ZP.randomLoSave2, r.a);
  r.lda(r.rd(ZP.randomHiSave)); r.wr(ZP.randomHiSave2, r.a);
  r.lda(r.rd(ZP.randomLo)); r.wr(ZP.randomLoSave, r.a);
  r.lda(r.rd(ZP.randomHi)); r.wr(ZP.randomHiSave, r.a);
  r.inx();
  r.wr(ZP.level, r.x);
}

// GetPageFlag ($FF00): a = 0 for id 0 or >= SWITCH_PAGE_ID (page $FC), else 1 (page $FD)
function getPageFlag(r) {
  r.txa();
  if (r.z) return;
  r.lda(0);
  r.cmp(r.x, SWITCH_PAGE_ID);
  if (r.c) return;
  r.lda(1);
}

// LoadPFPattern ($FAB1)
function loadPFPattern(r) {
  r.bit(r.rd(ZP.PF_State));
  if (r.n) { r.tay(); r.lda(PAGE_FLAG_TAB[r.y]); }
  r.ora(r.rd(END(ZP.blockLst)));
  r.wr(END(ZP.blockLst), r.a);
  r.lda(BANK_PTR_TAB[r.x]);
  r.c = 0;
  r.adc(r.rd(ZP.temp)); // diffPF
  r.wr(END(ZP.PF2Lst), r.a);
}

// CalcPosX ($FDD8): a = x-position -> y = coarse value, a = fine value for HMxy
export function calcPosX(r) {
  r.tay(); r.iny(); r.tya();
  r.and(0x0f);
  r.wr(ZP.temp2, r.a);
  r.tya(); r.lsr(); r.lsr(); r.lsr(); r.lsr();
  r.tay();
  r.c = 0;
  r.adc(r.rd(ZP.temp2));
  r.cmp(r.a, 0x0f);
  if (r.c) { r.sbc(0x0f); r.iny(); }
  r.eor(0x07);
  r.asl(); r.asl(); r.asl(); r.asl();
}

// .setBlockVars .. .mainLoopJmp ($F85D-$F85A): scroll by speedY and create new blocks.
export function runSetBlockVars(mem) {
  const r = new Regs(mem);
  let L = 'setBlockVars';
  for (;;) {
    switch (L) {
      case 'setBlockVars':
        r.lda(3 - 1); r.wr(ZP.blockNum, r.a);
      // falls through
      case 'loopNext':
        r.dec(ZP.blockNum);
        if (r.n) return; // .mainLoopJmp
        r.lda(r.rd(ZP.speedY));
        r.cmp(r.a, 0xfe);
        if (r.c) { L = 'incOffset'; continue; }
        r.adc(r.rd(ZP.posYLo));
        r.wr(ZP.posYLo, r.a);
        if (!r.c) { L = 'loopNext'; continue; }
      // falls through
      case 'incOffset':
        r.inc(ZP.blockOffset);
        r.lda(r.rd(ZP.blockOffset));
        r.cmp(r.a, BLOCK_SIZE);
        if (!r.c) { L = 'loopNext'; continue; }

        // *** create a new block ***
        r.ldx(0); r.wr(ZP.blockOffset, r.x);
        r.ldy(NUM_BLOCKS); r.wr(ZP.temp, r.y);
        r.lda(r.rd(ZP.level));
        r.cmp(r.a, 5);
        if (r.c) r.ldy(0);
        r.wr(ZP.valleyWidth, r.y);
        do { // .loopBlocks
          r.ldy(5);
          do { // .loopMoveBlock
            r.lda(r.rd(ZP.blockLst + 1 + r.x));
            r.wr(ZP.blockLst + r.x, r.a);
            r.inx(); r.dey();
          } while (!r.z);
          r.inx();
          r.dec(ZP.temp);
        } while (!r.z);
        r.wr(END(ZP.State1Lst), r.y); // y = 0
        r.lda(r.rd(END(ZP.blockLst))); r.and(BLOCK_FLAGS.PF_COLOR); r.wr(END(ZP.blockLst), r.a);
        r.ldx(r.rd(ZP.PF1PatId)); r.wr(ZP.prevPF1PatId, r.x);

        r.dec(ZP.blockPart);
        if (r.z) { L = 'nextBlock'; continue; }
        r.ldx(r.rd(ZP.sectionBlock)); r.dex();
        if (r.z) {
          // the last block of a section is a road with bridge
          r.wr(ZP.sectionEnd, r.x);
          r.lda(r.rd(ZP.level)); r.lsr();
          const straight = r.c;
          r.lda(BLOCK_FLAGS.PF_ROAD);
          if (!straight) r.lda(BLOCK_FLAGS.PF_ROAD | BLOCK_FLAGS.PF_COLOR);
          r.wr(END(ZP.blockLst), r.a);
        }
        nextRandom16(r); // .notLast
        L = 'nextBlockPart'; continue;

      case 'nextBlock':
        r.dec(ZP.sectionBlock);
        if (r.z) {
          saveSection(r);
          r.ldx(SECTION_BLOCKS); r.wr(ZP.sectionBlock, r.x);
        }
        nextRandom16(r); // .contSection
        r.ldx(r.rd(ZP.sectionBlock)); r.dex();
        if (r.z) {
          r.wr(ZP.PF_State, r.x);
          r.lda(12);
          L = 'setPF1Id'; continue;
        }
        // .notLastBlock
        r.lda(r.rd(ZP.level)); r.lsr();
        { const straight = r.c; r.lda(7); if (straight) { L = 'setPF1Id'; continue; } }
        r.lda(r.rd(ZP.PF_State));
        r.dex();
        if (r.z) {
          // finish island before end of section
          r.cmp(r.a, ISLAND_FLAG | 0x40);
          if (r.z) { L = 'isSetBoth'; continue; }
          L = 'clearBoth'; continue;
        }
        // .notLastButOne
        r.asl();
        r.eor(r.rd(ZP.PF_State));
        if (r.n) { L = 'updateFlags'; continue; }
        r.lda(r.rd(ZP.randomLo)); r.and(0b00110000);
        if (!r.z) { L = 'skipFlags'; continue; }
      // falls through
      case 'isSetBoth':
        r.lda(r.rd(ZP.PF_State)); r.and(ISLAND_FLAG);
        if (r.z) r.ora(0x40);
        r.wr(ZP.PF_State, r.a); // .isIsland
        r.lda(0);
        L = 'setPF1Id'; continue;

      case 'updateFlags':
        r.lda(ISLAND_FLAG | 0x40);
        r.bit(r.rd(ZP.PF_State));
        if (r.v) { L = 'setBoth'; continue; }
      // falls through
      case 'clearBoth':
        r.lda(0);
      // falls through
      case 'setBoth':
        r.wr(ZP.PF_State, r.a);
      // falls through
      case 'skipFlags':
        // create new random PF id
        r.ldy(14);
        r.lda(r.rd(ZP.randomLo)); r.and(0x0f);
        r.cmp(r.a, 2);
        if (!r.c) r.adc(2);
        r.bit(r.rd(ZP.PF_State)); // .minOk
        if (r.n) r.dey();
        r.ldx(r.rd(ZP.valleyWidth)); // .skipDey
        if (!r.z) r.ldy(8);
        r.wr(ZP.temp, r.y); // .allWidths
        r.cmp(r.a, r.rd(ZP.temp));
        if (!r.c) { L = 'setPF1Id'; continue; }
        r.lda(r.rd(ZP.temp));
      // falls through
      case 'setPF1Id':
        r.wr(ZP.PF1PatId, r.a);
        r.ldy(2); r.wr(ZP.blockPart, r.y);
      // falls through
      case 'nextBlockPart':
        r.lda(r.rd(ZP.prevPF1PatId));
        r.tax();
        r.c = 1;
        r.sbc(r.rd(ZP.PF1PatId));
        r.wr(ZP.temp, r.a); // diffPF
        if (r.c) { L = 'biggerPrev'; continue; }
        // new id is bigger
        r.inc(ZP.temp);
        r.cmp(r.x, SWITCH_PAGE_ID - 1);
        r.ldx(r.rd(ZP.PF1PatId));
        if (r.c) { L = 'prevBigId'; continue; }
        r.cmp(r.x, SWITCH_PAGE_ID);
        if (!r.c) { L = 'page1Id'; continue; }
        r.lda(0xff);
        r.adc(r.rd(ZP.prevPF1PatId)); // CF=1
        if (!r.n) { L = 'prevId'; continue; }
        L = 'biggerPrev'; continue; // not reached for valid ids (BPL always taken)

      case 'biggerPrev':
        if (!r.z) r.dec(ZP.temp);
        r.cmp(r.x, SWITCH_PAGE_ID); // .equalId
        if (r.c) { L = 'page0Id'; continue; }
      // falls through
      case 'page1Id':
        getPageFlag(r);
        loadPFPattern(r);
        r.wr(END(ZP.PF1Lst), r.a);
        r.lda(0);
        r.wr(END(ZP.PF2Lst), r.a);
        L = 'contPage1'; continue;

      case 'page0Id':
        r.lda(r.rd(ZP.PF1PatId));
        r.cmp(r.a, SWITCH_PAGE_ID - 1);
        if (r.c) { L = 'prevBigId'; continue; }
        r.lda(14 + 1);
        r.sbc(r.rd(ZP.PF1PatId)); // CF=0
        if (r.c) { L = 'prevId'; continue; }
      // falls through
      case 'prevBigId':
        r.lda(BLOCK_FLAGS.PF1_PAGE | BLOCK_FLAGS.PF2_PAGE | BLOCK_FLAGS.PF_COLOR);
      // falls through
      case 'prevId':
        r.wr(END(ZP.PF1Lst), r.a);
        getPageFlag(r);
        r.c = 1;
        r.rol();
        loadPFPattern(r);
      // falls through
      case 'contPage1':
        r.bit(r.rd(ZP.PF_State));
        if (r.n) {
          r.lda(r.rd(END(ZP.PF1Lst)));
          r.ldx(r.rd(END(ZP.PF2Lst)));
          r.wr(END(ZP.PF2Lst), r.a);
          r.wr(END(ZP.PF1Lst), r.x);
        }
        // .skipSwapPF
        r.bit(r.rd(END(ZP.blockLst)));
        if (r.n) {
          r.lda(QUAD_SIZE); r.wr(END(ZP.State1Lst), r.a);
          r.ldy(ID_BRIDGE);
          r.lda(63);
          L = 'endNewShape'; continue;
        }
        // .skipRoad: create new objects
        r.ldy(ID_FUEL);
        r.lda(r.rd(ZP.sectionBlock));
        r.c = 0;
        r.adc(r.rd(ZP.blockPart));
        r.cmp(r.a, SECTION_BLOCKS + 2);
        if (r.c) { L = 'newHouse'; continue; }
        r.lda(64);
        r.sbc(r.rd(ZP.level)); // CF=0
        r.asl();
        r.cmp(r.a, r.rd(ZP.randomHi));
        if (!r.c) { L = 'newEnemy'; continue; }
        r.bit(r.rd(ZP.randomLo));
        if (!r.v) { L = 'newFuel'; continue; }
      // falls through
      case 'newHouse':
        r.dey(); // y = ID_HOUSE
        r.ldx(r.rd(ZP.PF1PatId));
        r.cmp(r.x, r.rd(ZP.prevPF1PatId));
        if (r.c) r.ldx(r.rd(ZP.prevPF1PatId));
        r.lda(DOUBLE_SIZE); // .currentSmaller
        r.wr(END(ZP.State1Lst), r.a);
        r.lda(r.rd(ZP.level)); r.lsr();
        if (!r.c) { L = 'notStraight'; continue; }
        // random x-position for a house in a straight section
        r.lda(r.rd(ZP.randomLo)); r.and(0x1f);
        r.adc(8);
        r.cmp(r.a, 25);
        if (!r.c) { L = 'setShapeDir'; continue; }
        r.adc(92);
        L = 'setShapeDir'; continue;

      case 'notStraight':
        r.lda(SHAPE_POS_TAB[r.x]);
        r.bit(r.rd(ZP.PF_State));
        if (!r.n) { L = 'setShapeDir'; continue; }
        r.cmp(r.x, 0);
        if (r.z) { L = 'setShapeDir'; continue; }
        r.lda(71);
        L = 'setShapeDir'; continue;

      case 'newEnemy':
        r.lda(0b111);
        r.ldx(r.rd(ZP.level));
        r.cmp(r.x, 3);
        if (!r.c) r.lda(0b001);
        r.and(r.rd(ZP.randomHi)); // .withPlanes
        r.tax();
        r.ldy(ENEMY_ID_TAB[r.x]);
      // falls through
      case 'newFuel':
        r.cmp(r.y, ID_SHIP);
        if (r.z) { r.lda(DOUBLE_SIZE); r.wr(END(ZP.State1Lst), r.a); }
        r.lda(r.rd(ZP.PF1PatId)); // .noShip
        r.cmp(r.a, r.rd(ZP.prevPF1PatId));
        if (!r.z) { L = 'newId'; continue; }
        // position object in straight blocks
        r.wr(ZP.maxId, r.a);
        r.lda(r.rd(ZP.level)); r.lsr();
        if (!r.c) { L = 'notStraight2'; continue; }
        r.lda(106);
        r.ldx(r.rd(END(ZP.State1Lst)));
        if (!r.z) r.lda(97);
        r.sbc(r.rd(ZP.valleyWidth)); // .isShip
        r.wr(ZP.temp, r.a);
        r.lda(r.rd(ZP.randomLo)); r.and(0x3f);
        r.adc(45);
        r.adc(r.rd(ZP.valleyWidth));
        r.cmp(r.a, r.rd(ZP.temp));
        if (!r.c) { L = 'setShapeDir'; continue; }
        r.lda(r.rd(ZP.temp));
      // falls through
      case 'setShapeDir':
        r.bit(r.rd(ZP.randomLo));
        if (r.n) { L = 'invertDirection'; continue; }
        L = 'endNewShape'; continue;

      case 'newId':
        if (!r.c) r.lda(r.rd(ZP.prevPF1PatId));
        r.wr(ZP.maxId, r.a); // .currentBigger
      // falls through
      case 'notStraight2':
        r.ldx(13);
        r.bit(r.rd(ZP.PF_State));
        if (r.n) r.ldx(10);
        r.cmp(r.x, r.rd(ZP.maxId)); // .contPage12
        if (!r.c) {
          r.tya();
          r.sbc(ID_SHIP - 1);
          if (r.z) { r.wr(END(ZP.State1Lst), r.a); r.dey(); }
        }
        r.lda(r.rd(ZP.maxId)); // .spaceOk
        r.asl(); r.asl();
        if (r.z) { L = 'posSomewhere'; continue; }
        r.bit(r.rd(ZP.PF_State));
        if (!r.n) { L = 'posSomewhere'; continue; }
        // position object outside
        r.eor(0xff);
        r.adc(81);
        r.bit(r.rd(ZP.randomLo));
        if (!r.n) { L = 'skipNeg'; continue; }
        r.eor(0xff);
        r.adc(160);
        L = 'contPos'; continue;

      case 'posSomewhere':
        r.adc(16);
        r.bit(r.rd(ZP.randomLo));
        if (r.n) { L = 'doNeg'; continue; }
      // falls through
      case 'contPos':
        r.c = 0;
        r.adc(2);
        r.adc(r.rd(ZP.valleyWidth));
        L = 'endNewShape'; continue;

      case 'doNeg':
        r.eor(0xff);
        r.adc(160 + 1);
      // falls through
      case 'skipNeg':
        r.cmp(r.y, ID_FUEL);
        r.sbc(9);
        r.sbc(r.rd(ZP.valleyWidth));
        r.ldx(r.rd(END(ZP.State1Lst)));
        if (!r.z) r.sbc(10);
      // falls through
      case 'invertDirection':
        r.cmp(r.y, ID_FUEL);
        if (!r.z) {
          const saved = r.a;
          r.lda(r.rd(END(ZP.State1Lst)));
          r.ora(DIRECTION_FLAG);
          r.wr(END(ZP.State1Lst), r.a);
          r.lda(saved); // PLA
        }
      // falls through
      case 'endNewShape':
        r.wr(END(ZP.Shape1IdLst), r.y);
        calcPosX(r);
        r.wr(END(ZP.XPos1Lst), r.y);
        r.ora(r.rd(END(ZP.State1Lst)));
        r.wr(END(ZP.State1Lst), r.a);
        L = 'loopNext'; continue;

      default:
        throw new Error(`runSetBlockVars: unknown label ${L}`);
    }
  }
}

// *** kernel playfield ***
// The kernel draws each block as 8 setup lines plus a 2-line loop (Jentzsch
// lines 520-960). Playfield row r (15..0) of block i ends up on the two screen
// lines starting at top + (5 - i) * 32 + 33 - 2 * r, where top = blockOffset - 34
// is the screen line of the top block's first line; rows 15..13 and 0 come from
// the setup lines, rows 12..1 from the loop. COLUPF is the block's green, or for
// a road block RoadColorTab[row] on loop rows; it changes together with the
// playfield. tools/verify-kernel-pf.mjs checks this per pixel against the ROM.
export const KERNEL_LINES = 160;
export const PF_COLORS = Object.freeze({ GREEN: 0xd2, BLUE: 0x84, DARK_RED: 0x42 });

export function pfPatternByte(pageFlag, low) {
  const page = pageFlag ? PF_PAGE_FD : PF_PAGE_FC;
  const value = page[low & 0xff];
  if (value === undefined) throw new Error(`PF read outside extracted pattern data: $F${pageFlag ? 'D' : 'C'}${(low & 0xff).toString(16)}`);
  return value;
}

export function blockPlayfieldRow(mem, block, row) {
  const flags = mem[ZP.blockLst + block];
  const pf1 = pfPatternByte(flags & BLOCK_FLAGS.PF1_PAGE, mem[ZP.PF1Lst + block] + row);
  const pf2 = pfPatternByte(flags & BLOCK_FLAGS.PF2_PAGE, mem[ZP.PF2Lst + block] + row);
  const green = (flags & BLOCK_FLAGS.PF_COLOR) | PF_COLORS.GREEN;
  const colorRow = row === 0 ? 1 : row;
  const road = (flags & BLOCK_FLAGS.PF_ROAD) && colorRow <= 12;
  return { pf1, pf2, colupf: road ? ROAD_COLOR_TAB[colorRow] : green };
}

// 160 kernel lines, top to bottom: { block, row, pf1, pf2, colupf }
export function kernelPlayfieldLines(mem) {
  const top = mem[ZP.blockOffset] - 34;
  const lines = new Array(KERNEL_LINES);
  for (let block = NUM_BLOCKS - 1; block >= 0; block -= 1) {
    const blockTop = top + (NUM_BLOCKS - 1 - block) * BLOCK_SIZE;
    for (let row = 15; row >= 0; row -= 1) {
      const first = blockTop + 33 - 2 * row;
      for (const line of [first, first + 1]) {
        if (line < 0 || line >= KERNEL_LINES) continue;
        lines[line] = { block, row, ...blockPlayfieldRow(mem, block, row) };
      }
    }
  }
  return lines;
}

// Background: BLUE water, flickering DARK_RED while a bridge explodes.
export function kernelBackgroundColor(mem) {
  const explode = mem[ZP.bridgeExplode];
  return explode && (explode & 1) ? PF_COLORS.DARK_RED : PF_COLORS.BLUE;
}

// Playfield bits for one line, 160 pixels: PF0 is always set, CTRLPF reflects.
export function playfieldPixels(line) {
  const bits = new Uint8Array(160);
  for (let x = 0; x < 80; x += 1) {
    const pf = x >> 2;
    let on;
    if (pf < 4) on = 1;
    else if (pf < 12) on = (line.pf1 >> (7 - (pf - 4))) & 1;
    else on = (line.pf2 >> (pf - 12)) & 1;
    bits[x] = on;
    bits[159 - x] = on;
  }
  return bits;
}

// *** kernel objects ***
// Per kernel line: jet (GRP0) byte, enemy (GRP1, vertically delayed) byte and
// color, and the missile enable, following the kernel's line schedule:
// - jet: line s shows the jet table byte at index 160 - s (shapePtr0 = table-1, Y = 161 - s)
// - enemy: block line b = 32 - 2y shows B[y], b = 33 - 2y shows A[y] (y = 11..0),
//   colored colors[y]; position, NUSIZ1 and REFP1 switch at block line 5..7
// - missile: ENAM0 is only rewritten on odd block lines, from Y = 161 - s
// - kernel entry: line 0 gets no enemy graphics when blockOffset < 3 or >= 26
//   (.noShape), and ENAM0 stays off until its first rewrite below line 0
// tools/verify-kernel-objects.mjs checks this against the ROM kernel.
export const JET_Y = 19;

export function kernelObjectLines(mem, shapes, jetTable) {
  const top = mem[ZP.blockOffset] - 34;
  const missileY = mem[ZP.missileY];
  const lines = Array.from({ length: KERNEL_LINES }, () => ({ grp0: 0, grp1: 0, colup1: 0, block: -1, enam0: 0 }));
  for (let s = 0; s < KERNEL_LINES; s += 1) {
    const y = 161 - s;
    if (y < JET_Y && y >= 1) lines[s].grp0 = jetTable[y - 1] ?? 0;
  }
  for (let block = NUM_BLOCKS - 1; block >= 0; block -= 1) {
    const blockTop = top + (NUM_BLOCKS - 1 - block) * BLOCK_SIZE; // screen line of block line 1
    const shape = shapes[mem[ZP.Shape1IdLst + block]];
    for (let y = 11; y >= 0; y -= 1) {
      for (const [b, byte] of [[32 - 2 * y, shape.b[y]], [33 - 2 * y, shape.a[y]]]) {
        const s = blockTop + b - 1;
        if (s < 0 || s >= KERNEL_LINES) continue;
        lines[s].grp1 = byte;
        lines[s].colup1 = shape.colors[y];
        lines[s].block = block;
      }
    }
    // missile: odd block lines rewrite ENAM0, held for the following line
    for (let b = 1; b <= 32; b += 2) {
      const s = blockTop + b - 1;
      const yLine = 161 - s;
      const inJetZone = yLine < JET_Y && b !== 7 && b !== 9;
      const on = !inJetZone && ((yLine - missileY) & 0xf8) === 0 ? 1 : 0;
      if (s < 1) continue;
      for (const t of [s, s + 1]) if (t < KERNEL_LINES) lines[t].enam0 = on;
    }
  }
  const blockOffset = mem[ZP.blockOffset];
  if (blockOffset < 3 || blockOffset >= 26) lines[0].grp1 = 0;
  return lines;
}

// *** TIA object geometry ***
// x-position from the coarse/fine values CalcPosX produced (its exact inverse).
export function objectX(coarse, state) {
  return 15 * coarse + ((((state >> 4) & 0x0f) ^ 7) & 0x0f) - 1;
}

// NUSIZ player copies (color-clock offsets) and pixel width per bit.
const NUSIZ_COPIES = [[0], [0, 16], [0, 32], [0, 16, 32], [0, 64], [0], [0, 32, 64], [0]];
const NUSIZ_SCALE = [1, 1, 1, 1, 1, 2, 1, 4];

// Pixels (0..159) covered by a player byte. Stretched players start one clock
// later (Stella shows the double-size ship/house one pixel right of x).
export function playerPixels(byte, x, nusiz = 0, reflect = false) {
  const out = [];
  if (!byte) return out;
  const scale = NUSIZ_SCALE[nusiz & 7];
  const start = x + (scale > 1 ? 1 : 0);
  for (const copy of NUSIZ_COPIES[nusiz & 7]) {
    for (let bit = 0; bit < 8; bit += 1) {
      if (!((byte >> (reflect ? bit : 7 - bit)) & 1)) continue;
      for (let k = 0; k < scale; k += 1) out.push((((start + copy + bit * scale + k) % 160) + 160) % 160);
    }
  }
  return out;
}

// *** kernel collisions ***
// The kernel only uses the hardware collision latches, cleared once per block.
// Block i is checked on its block line 7 (BIT CXM0P/CXP0FB/CXM0FB/CXPPMM, the
// first read at cycle 31, then every 6 cycles, 2 more after each hit because
// STX replaces the taken BPL) and line 8 (CXP1FB at 33, then CXCLR 6 cycles
// later, or 15 after a hit that sets PF_COLLIDE_FLAG). Lines >= 143, where the
// jet is drawn, start 7 cycles later. The check stores X = i + 1 (or i when the
// kernel was entered past line 7). The last segment is checked after the
// status display with X = blockOffset >= 26 ? 1 : 0. A read at cycle c sees
// pixels left of 3c - 68; CXCLR at cycle c clears pixels left of 3c + 3 - 68.
// tools/atari/collisions.mjs latches the ROM's own TIA writes the same way.
export const COLLISION = Object.freeze({ M0P: 0, P0FB: 2, P1FB: 3, M0FB: 4, PPMM: 7 });

// Collision pixel times (line * 160 + x) per latch, from per-line pixel masks.
export function collisionTimes(lineMasks) {
  const times = { [COLLISION.M0P]: [], [COLLISION.P0FB]: [], [COLLISION.P1FB]: [], [COLLISION.M0FB]: [], [COLLISION.PPMM]: [] };
  lineMasks.forEach((m, s) => {
    for (let x = 0; x < 160; x += 1) {
      const t = s * 160 + x;
      if (m.m0[x] && m.p1[x]) times[COLLISION.M0P].push(t);
      if (m.p0[x] && m.pf[x]) times[COLLISION.P0FB].push(t);
      if (m.p1[x] && m.pf[x]) times[COLLISION.P1FB].push(t);
      if (m.m0[x] && m.pf[x]) times[COLLISION.M0FB].push(t);
      if (m.p0[x] && m.p1[x]) times[COLLISION.PPMM].push(t);
    }
  });
  return times;
}

// Latched value (bit 7) of a collision register at time t since the last clear.
export function latched(times, reg, from, to) {
  return times[reg].some((t) => t >= from && t < to) ? 0x80 : 0;
}

// Per-line pixel masks for the kernel from the playfield and object line models.
export function kernelLineMasks(mem, pfLines, objLines) {
  const playerX = mem[ZP.playerX], reflect0 = mem[ZP.reflect0];
  const jetX = playerX + (reflect0 ? 1 : 0);
  const missileX = mem[ZP.missileX] - 1;
  return pfLines.map((pfLine, s) => {
    const o = objLines[s];
    const pf = playfieldPixels(pfLine);
    const p0 = new Uint8Array(160), p1 = new Uint8Array(160), m0 = new Uint8Array(160);
    for (const x of playerPixels(o.grp0, jetX, 0, !!reflect0)) p0[x] = 1;
    if (o.block >= 0 && o.grp1) {
      const state = mem[ZP.State1Lst + o.block];
      for (const x of playerPixels(o.grp1, objectX(mem[ZP.XPos1Lst + o.block], state), state & 7, !!(state & 0x08))) p1[x] = 1;
    }
    if (o.enam0) m0[((missileX % 160) + 160) % 160] = 1;
    return { pf, p0, p1, m0 };
  });
}

// Runs the kernel's collision checks, writing hitEnemyIdx, PFCrashFlag,
// missileFlag, collidedEnemy and PF_COLLIDE_FLAG like the ROM does.
export function applyKernelCollisions(mem, times) {
  const store = { [COLLISION.M0P]: ZP.hitEnemyIdx, [COLLISION.P0FB]: ZP.PFCrashFlag, [COLLISION.M0FB]: ZP.missileFlag, [COLLISION.PPMM]: ZP.collidedEnemy };
  const blockOffset = mem[ZP.blockOffset];
  const top = blockOffset - 34;
  const at = (line, cycle) => line * 160 + 3 * cycle - 68;
  const jetZone = (line) => (line >= 143 ? 7 : 0);
  let from = 0;
  for (let block = NUM_BLOCKS - 1; block >= 0; block -= 1) {
    const s7 = top + (NUM_BLOCKS - 1 - block) * BLOCK_SIZE + 6;
    const s8 = s7 + 1;
    const checked7 = s7 >= 1 && s7 <= 159;
    if (checked7) {
      let cycle = 31 + jetZone(s7);
      for (const reg of [COLLISION.M0P, COLLISION.P0FB, COLLISION.M0FB, COLLISION.PPMM]) {
        if (latched(times, reg, from, at(s7, cycle))) { mem[store[reg]] = block + 1; cycle += 2; }
        cycle += 6;
      }
    }
    if (s8 >= 1 && s8 <= 159) {
      const x = checked7 ? block + 1 : block;
      let cycle = 33 + jetZone(s8);
      if (latched(times, COLLISION.P1FB, from, at(s8, cycle))) {
        mem[(ZP.blockLst + x) & 0xff] |= BLOCK_FLAGS.PF_COLLIDE;
        cycle += 9;
      }
      from = at(s8, cycle + 6) + 3;
    }
  }
  const end = KERNEL_LINES * 160;
  const last = blockOffset >= BLOCK_SIZE - 6 ? 1 : 0;
  for (const reg of [COLLISION.M0P, COLLISION.P0FB, COLLISION.M0FB]) if (latched(times, reg, from, end)) mem[store[reg]] = last;
  if (latched(times, COLLISION.P1FB, from, end)) mem[(ZP.blockLst + last) & 0xff] |= BLOCK_FLAGS.PF_COLLIDE;
  if (latched(times, COLLISION.PPMM, from, end)) mem[store[COLLISION.PPMM]] = last;
}

export { PF_PAGE_FC, PF_PAGE_FD, ROAD_COLOR_TAB, INIT_TAB };
