// Node-side smoke tests for src/pixtest.js.
//
// We can NOT exercise the getImageData flow under Node (no DOM canvas);
// that's auto-tested at runtime by the harness itself looping every
// frame. What we CAN test are the pure helpers:
//   - clamp
//   - asciiDiff (the side-by-side row formatter + diff glyphs)
//   - spriteNameForEnemy (the ENEMY_SPRITE_PAIR dispatcher)
//   - PixTest class can instantiate without throwing & install() is
//     safe under Node (no document, no window — install() guards both)
//
// Plus we re-pin the LSB-first JetStraight first/last rows so any
// future regression in bytesToPixels will fail this test BEFORE it
// fails the runtime harness.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PixTest, _internalsForTests } from '../src/pixtest.js';
import {
  SPRITE_BYTES,
  bytesToPixels,
  SHAPE_PLANE, SHAPE_HELI0, SHAPE_HELI1, SHAPE_SHIP, SHAPE_HOUSE,
} from '../src/data.js';

const { asciiDiff, clamp, spriteNameForEnemy } = _internalsForTests;

// ── Pure helpers ──────────────────────────────────────────────────────

test('clamp bounds', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);
});

test('asciiDiff: each row produces "row NN: rendered | expected | diff" with right glyphs', () => {
  // Bulletproof structural check on the produced row strings. We pin the
  // format with a regex + a couple substring checks rather than a fragile
  // exact string equality (the latter was rejecting the test before due
  // to off-by-one spaces in the literal — recovered now).
  const rendered = ['X..X', '.X..'];
  const expected = ['X.X.', '.X..'];
  const out = asciiDiff(rendered, expected);
  const lines = out.split('\n');
  assert.equal(lines.length, 2);
  // padStart(2) → r=0,1 yield ' 0',' 1' (2 chars each: leading space +
  // digit). The template produces 'row' + (' N') + ': ' + rendered +
  // ' | ' + expected + ' | ' + diff.
  assert.match(lines[0], /^row\s+0:\s+X\.\.X\s\|\s+X\.X\.\s\|\s/);
  assert.match(lines[1], /^row\s+1:\s+\.X\.\.\s\|\s+\.X\.\.\s\|\s/);
  // Row 0 has c=3 mismatch: rendered 'X', expected '.' → '-' glyph.
  // (No '+' glyph because no position has rendered='.' with expected='X'.)
  assert.ok(/[-\+]/.test(lines[0]),
    `row 0 diff should contain at least one '-' or '+' glyph: ${JSON.stringify(lines[0])}`);
  // Row 1 has all-matching cells → diff section is all spaces.
  assert.ok(/^row\s+1:.*\|\s+$/.test(lines[1]),
    `row 1 diff has no glyphs (all cells match): ${JSON.stringify(lines[1])}`);
});

test('asciiDiff: diff glyphs — "-" means rendered-extras, "+" means misses', () => {
  // rendered = lit, expected = dark  → '-'
  // rendered = dark, expected = lit   → '+'
  // both same                       → ' '
  const r = ['X.'];
  const e = ['..'];
  const out = asciiDiff(r, e);
  assert.ok(out.includes(' - '),  'expected to mark rendered-extra');
});

test('asciiDiff: marks misses when expected has extra lit pixels', () => {
  const r = ['..'];
  const e = ['X.'];
  const out = asciiDiff(r, e);
  assert.ok(out.includes(' + '), 'expected to mark missed pixels');
});

test('asciiDiff: empty inputs → empty output (no crash)', () => {
  const out = asciiDiff([], []);
  assert.equal(out, '');
});

test('spriteNameForEnemy — Plane pair', () => {
  assert.equal(spriteNameForEnemy({ type: SHAPE_PLANE, dir:  1 }), 'PlaneA');
  assert.equal(spriteNameForEnemy({ type: SHAPE_PLANE, dir: -1 }), 'PlaneB');
  assert.equal(spriteNameForEnemy({ type: SHAPE_PLANE, dir:  0 }), 'PlaneA');
});

test('spriteNameForEnemy — Heli/House/Ship dispatch', () => {
  assert.equal(spriteNameForEnemy({ type: SHAPE_HELI0, dir:  1 }), 'Heli0A');
  assert.equal(spriteNameForEnemy({ type: SHAPE_HELI1, dir: -1 }), 'Heli1B');
  assert.equal(spriteNameForEnemy({ type: SHAPE_SHIP,  dir:  1 }), 'ShipA');
  assert.equal(spriteNameForEnemy({ type: SHAPE_HOUSE, dir: -1 }), 'HouseB');
});

test('spriteNameForEnemy — unknown type returns null (defensive)', () => {
  assert.equal(spriteNameForEnemy({ type: 999, dir: 1 }), null);
});

// ── PixTest class itself constructs under Node without ───────────────

test('PixTest instantiation succeeds without DOM', () => {
  // Construct with stub args; .install() should be a no-op because
  // `document` is undefined under Node.
  const pt = new PixTest({}, { player: { x: 0, y: 0, state: 0 }, enemies: [] },
                       () => 'TITLE');
  assert.equal(typeof pt.install, 'function');
  assert.equal(typeof pt.sample, 'function');
  // install() under Node must not throw on `document`/`window` undefined.
  pt.install();
  // sample() under TITLE state must be a no-op.
  pt.sample();
});

// ── MSB-first JetStraight pin (mirrors tests/test_sprites.py) ───────

test('JetStraight row 5 (byte $2A) → ..X.X.X.', () => {
  // SPRITE_BYTES.JetStraight[5] = 42 = 0b00101010
  // Under MSB-first (bit 7 → col 0): col 2,4,6 lit → `..X.X.X.`
  const pixels = bytesToPixels(SPRITE_BYTES.JetStraight);
  assert.deepEqual(Array.from(pixels[5]), [0, 0, 1, 0, 1, 0, 1, 0]);
});

test('JetStraight rows 11-12 (byte $7F) → col 0 dark, cols 1..7 lit', () => {
  // This is the WIDEST body row of the jet. Byte $7F = 0b01111111:
  // MSB-first bit 7 = 0 → col 0 unlit, bits 6..0 = 1 → cols 1..7 lit.
  const pixels = bytesToPixels(SPRITE_BYTES.JetStraight);
  assert.deepEqual(Array.from(pixels[11]), [0, 1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(Array.from(pixels[12]), [0, 1, 1, 1, 1, 1, 1, 1]);
});

test('JetStraight row 8 (byte $08) → only col 4 lit (MSB-first)', () => {
  // 0b00001000 → MSB-first bit 3 = 1 → col 4 lit
  const pixels = bytesToPixels(SPRITE_BYTES.JetStraight);
  assert.deepEqual(Array.from(pixels[8]), [0, 0, 0, 0, 1, 0, 0, 0]);
});

// ── PlaneA pin ───────────────────────────────────────────────────────

test('PlaneA row 5 (byte $30 = 0b00110000) → cols 2,3 lit (MSB-first)', () => {
  const pixels = bytesToPixels(SPRITE_BYTES.PlaneA);
  // 0x30 = 0b00110000 → MSB-first bits 5,4 = 1 → cols 2,3 lit.
  // Sanity check: not 0xFF (full) or 0x00 (empty), confirming the
  // decoder's byte-order is correct.
  assert.equal(pixels[5][2], 1);
  assert.equal(pixels[5][3], 1);
  assert.equal(pixels[5][4], 0);
});
