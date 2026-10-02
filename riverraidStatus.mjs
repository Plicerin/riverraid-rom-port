// River Raid status display (score, fuel gauge, lives and copyright), modelled
// on the ROM's DisplayState kernel (Jentzsch lines 960-1110). Players 0 and 1
// are set to three copies close with vertical delay and rewritten mid-line, so
// each line shows six 8-pixel slots at x = 56, 64, ..., 96:
// - score (8 lines): slot k shows the digit at scorePtr1+2k
// - fuel (15 lines): slot 0 blank, slots 1-5 FuelTab0..4 in black; the ball
//   (2 pixels, COLUPF) is the needle at fuelHi/8 + 69 - 1, on where ENABLTab is
// - lives (8 lines): the lives digit, then Copyright1..5; on game over the
//   copyright scrolls in by frameCnt
// tools/verify-status.mjs checks this against the ROM's TIA writes.

import { DIGITS, FUEL_TABS } from './riverraidPlayfieldData.mjs';

export const STATUS_SLOT_X = Object.freeze([56, 64, 72, 80, 88, 96]);
const ZP = Object.freeze({
  frameCnt: 0x82, fuelHi: 0xb7, livesPtr: 0xc0, gameMode: 0xc6, scorePtr1: 0xcd,
  playerColor: 0xef, stateBKColor: 0xf0, statePFColor: 0xf1, zero1: 0xf3,
});
const COPYRIGHT = [0x59, 0x68, 0x78, 0x88, 0x98, 0xa8]; // Copyright0..5 low bytes in page $FB
const FUEL_TAB = [0x00, 0x0f, 0x1d, 0x2b, 0x39];        // FuelTab0..4 low bytes in page $FE
const ENABL_TAB = 0x48;

const digitRow = (low, y) => DIGITS[(low + y) & 0xff] ?? 0;
const fuelRow = (low, y) => FUEL_TABS[low + y] ?? 0;

// Lines below the 160-line kernel, top to bottom. Each line:
// { bk, color, slots: [6 bytes] | null, ball: x | null, ballColor }
export function statusLines(mem) {
  const lines = [];
  const bk = mem[ZP.stateBKColor];
  const blank = (color) => ({ bk: color, color: 0, slots: null, ball: null, ballColor: 0 });
  lines.push(blank(mem[ZP.zero1])); // DisplayState: COLUBK = zero1
  lines.push(blank(bk));
  for (let y = 7; y >= 0; y -= 1) {
    lines.push({ bk, color: mem[ZP.playerColor], slots: [0, 2, 4, 6, 8, 10].map((o) => digitRow(mem[ZP.scorePtr1 + o], y)), ball: null, ballColor: 0 });
  }
  lines.push(blank(bk));
  lines.push(blank(bk));
  const needleX = (((mem[ZP.fuelHi] >> 3) + 69) & 0xff) - 1;
  for (let y = 14; y >= 0; y -= 1) {
    lines.push({
      bk,
      color: mem[ZP.zero1],
      slots: [0, ...FUEL_TAB.map((low) => fuelRow(low, y))],
      ball: fuelRow(ENABL_TAB, y) & 0x02 ? needleX : null,
      ballColor: mem[ZP.statePFColor],
    });
  }
  lines.push(blank(bk));
  lines.push(blank(bk));
  // copyright scroll offset (temp3)
  let y0 = 7;
  if (mem[ZP.gameMode] === 0xff) {
    const a = mem[ZP.frameCnt] >> 3;
    if (a >= 20) y0 = 15;
    else if (a >= 12) y0 = a - 4;
  }
  for (let i = 0; i < 8; i += 1) {
    const y = y0 - i;
    lines.push({
      bk,
      color: mem[ZP.playerColor],
      slots: [digitRow(mem[ZP.livesPtr], y), ...COPYRIGHT.slice(1).map((low) => digitRow(low, y))],
      ball: null,
      ballColor: 0,
    });
  }
  lines.push(blank(bk));
  return lines;
}

// Palette bytes for one status line, 160 pixels.
export function statusLinePixels(line) {
  const row = new Array(160).fill(line.bk);
  // TIA priority: players over the ball
  if (line.ball !== null) for (const x of [line.ball, line.ball + 1]) if (x >= 0 && x < 160) row[x] = line.ballColor;
  if (line.slots) {
    line.slots.forEach((byte, k) => {
      for (let bit = 0; bit < 8; bit += 1) if ((byte >> (7 - bit)) & 1) row[STATUS_SLOT_X[k] + bit] = line.color;
    });
  }
  return row;
}
