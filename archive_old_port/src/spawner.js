// River Raid — Spawner.
//
// Mirrors JTZ block generation (lines 2075–2241):
//   - First block of each section is skipped (block_part=2 and section_counter=1).
//   - LFSR threshold (100-level)*2 vs randomHi → enemy vs fuel vs house.
//   - Spawned X position uses ShapePosTab[PF1PatId] with JTZ CalcPosX.
//   - Direction is the LFSR byte's high bit.
//
// The Spawner does NOT own the LFSR. The Game creates one LFSR and shares
// it between River and Spawner so the random stream stays in lock-step
// with the assembly.

import {
  BLOCK_SIZE, SECTION_BLOCKS,
  ENEMY_ID_TAB, SHAPE_POS_TAB,
  SHAPE_BRIDGE, SHAPE_HOUSE,
} from './data.js';

export class Spawner {
  constructor(lfsr, river) {
    this.lfsr = lfsr;
    this.river = river;

    this._block_counter = 0;
    this._section_counter = 0;
    this._block_part = 2;

    this._new_enemies = [];
    this._new_fuel = [];
  }

  reset() {
    this.lfsr.reset();
    this._block_counter = 0;
    this._section_counter = 0;
    this._block_part = 2;
    this._new_enemies.length = 0;
    this._new_fuel.length = 0;
  }

  // Call once per game frame. Internally advances a sub-block counter;
  // every BLOCK_SIZE lines it triggers the spawn decision.
  tick() {
    this._block_counter += 1;
    if (this._block_counter < BLOCK_SIZE) {
      this._consume();
      return;
    }
    this._block_counter = 0;
    this._block_part -= 1;
    if (this._block_part === 0) this._block_part = 2;
    this._spawnBlockStep();
    this._consume();
  }

  // Drain output arrays (returns references and clears for next tick).
  getNewEnemies() {
    const out = this._new_enemies;
    this._new_enemies = [];
    return out;
  }
  getNewFuel() {
    const out = this._new_fuel;
    this._new_fuel = [];
    return out;
  }
  _consume() {
    // already drained via getNew*
  }

  _spawnBlockStep() {
    this._section_counter += 1;

    // End of section → bridge at the boundary. The counter increments
    // BEFORE this check, so a section of length SECTION_BLOCKS wraps via
    // 1 → 2 → ... → SECTION_BLOCKS (= bridge) → reset to 0.
    if (this._section_counter >= SECTION_BLOCKS) {
      this._section_counter = 0;
      this._spawnBridge();
      return;
    }

    // Skip first part of first block of each section.
    if (this._section_counter === 1 && this._block_part === 2) {
      return;
    }

    // Decide enemy / fuel / house (JTZ line 2083-2089).
    this.lfsr.next();
    const threshold = ((100 - this.river.level) << 1) & 0xFF;
    if (this.lfsr.peekHi() < threshold) this._spawnEnemy();
    else if (!(this.lfsr.peekLo() & 0x80)) this._spawnFuel();
    else this._spawnHouse();
  }

  _spawnEnemy() {
    const level = this.river.level;
    const mask = level < 3 ? 0x01 : 0x07;
    this.lfsr.next();
    const idx = (this.lfsr.peekHi() & mask) % ENEMY_ID_TAB.length;
    const enemyId = ENEMY_ID_TAB[idx];

    const pf1 = this.river.pf1_pat_id;
    const coarse = pf1 < SHAPE_POS_TAB.length ? SHAPE_POS_TAB[pf1] : 120;
    const x = calcPosX(coarse);

    this.lfsr.next();
    const dir = (this.lfsr.peekLo() & 0x80) ? -1 : 1;

    this._new_enemies.push({ type: enemyId, x, y: 0, dir });
  }

  _spawnFuel() {
    this.lfsr.next();
    const coarse = SHAPE_POS_TAB[10]; // PFPat10 = fuel position
    const x = calcPosX(coarse);
    this._new_fuel.push({ x, y: 0 });
  }

  _spawnHouse() {
    this.lfsr.next();
    let coarse;
    if ((this.river.level & 1) === 0) {
      // Straight level: random X across the full playfield.
      this.lfsr.next();
      const r = this.lfsr.peekLo() & 0x1F;
      coarse = r + 8;
      if (coarse >= 25) coarse += 92;    // move to right bank
      this.lfsr.next();
    } else {
      const pf1 = this.river.pf1_pat_id;
      coarse = pf1 < SHAPE_POS_TAB.length ? SHAPE_POS_TAB[pf1] : 22;
    }
    const x = calcPosX(coarse);
    this._new_enemies.push({ type: SHAPE_HOUSE, x, y: 0, dir: 1 });
  }

  _spawnBridge() {
    const coarse = SHAPE_POS_TAB[SHAPE_BRIDGE] || 124;
    const x = calcPosX(coarse);
    this._new_enemies.push({ type: SHAPE_BRIDGE, x, y: 0, dir: 0 });
  }
}

// JTZ CalcPosX (line 3092-3118). Splits coarse (PF coord 0..159) into
// screen X (0..319) via the "high nibble + high nibble mod 0xF" trick.
export function calcPosX(coarse) {
  const v = coarse + 1;
  const fine = v & 0x0F;
  const coarseAdj = (v >> 4) & 0x0F;
  let sum = coarseAdj + fine;
  if (sum >= 0x0F) sum -= 0x0F;
  const fineAdj = (sum ^ 0x07) & 0x0F;
  // Map coarse (PF width 0..159 = half playfield) to screen 0..319.
  return coarse * 2 + fineAdj;
}
