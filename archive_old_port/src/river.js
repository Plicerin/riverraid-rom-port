// River Raid — River model.
//
// Stores the queue of visible bank-pattern blocks (NUM_BLOCKS = 6), the
// current block offset, section counter, level, valley-width restriction,
// and island/change flags. Exposes per-row queries for the renderer.
//
// JTZ reference: lines 1847–2273 (playfield rendering + new-block
// generation). Block/section counters here mirror the assembly's
// 1-based indexing.

import {
  NUM_BLOCKS, SECTION_BLOCKS, BLOCK_SIZE, MAX_LEVEL,
  W,
} from './data.js';
import { PFPAT } from './data.js';

const PATTERN_ROW_COUNT = 28;       // wraps pattern scroll

export class River {
  constructor(lfsr) {
    this.lfsr = lfsr;

    // Block slots: 6 visible blocks (bottom..top), each holds a PFPat ID.
    // Seeded to PFPat8 (= full banks) so the python-port and assembly
    // register boot state is preserved for debugging, then immediately
    // overwritten with real roller output (see _rollInitialBlocks below)
    // so the player has an actual river to fly on at game start.
    this._block_pat_ids = new Array(NUM_BLOCKS).fill(8);

    // Block colors: 0 = GREEN, 1 = LIGHT_GREEN. Initial display alternates.
    this._block_colors = [0, 1, 0, 1, 0, 1];

    // Section counters (Section_block counts DOWN from 16 to 1).
    this._section_block = SECTION_BLOCKS;
    this._block_part = 2;

    // Island / change flags (PF_State): bit 7 = ISLAND_FLAG, bit 6 = CHANGE_FLAG.
    this._pf_state = 0;
    this._pf1_pat_id = 12;

    // Difficulty level (1..MAX_LEVEL).
    this._level = 1;
    this._valley_width = 0;

    // Sub-row offset within the top block's pattern.
    this._block_offset = 0;
    this._pattern_scroll = 0;

    this._rollInitialBlocks();
  }

  reset() {
    this._block_pat_ids = new Array(NUM_BLOCKS).fill(8);
    this._block_colors = [0, 1, 0, 1, 0, 1];
    this._section_block = SECTION_BLOCKS;
    this._block_part = 2;
    this._pf_state = 0;
    this._pf1_pat_id = 12;
    this._level = 1;
    this._valley_width = 0;
    this._block_offset = 0;
    this._pattern_scroll = 0;
    this._rollInitialBlocks();
  }

  // Replace the six PFPat8 placeholders with real rolled PFPat IDs so
  // the player jet has room to fly on game start. The ROM boot state
  // holds full banks (PFPat8 = 0xFF) in PF1Lst/PF2Lst; relying on that
  // would leave the 320-wide screen with a 2-px water lane and crash
  // the jet within ~0.3 s.
  //
  // We bypass `_nextRandomBlock()` here to:
  //   1. Avoid advancing `_pf_state` through the section state machine
  //      six times (we pin it to 0 anyway — see below).
  //   2. Avoid mass-overwriting `_block_colors` (level 1 → all
  //      LIGHT_GREEN) — we restore the alternating pattern below.
  //   3. Cap the rolled id at PFPat5 instead of PFPat8 so the player
  //      has guaranteed playable water width (PFPat8 = byte 0xFF on
  //      most rows = banks that meet in a 2-px water lane once scaled).
  _rollInitialBlocks() {
    this.lfsr.reset();
    for (let i = 0; i < NUM_BLOCKS; i++) {
      this.lfsr.next();
      let raw = this.lfsr.peekLo() & 0x0F;
      if (raw < 2) raw = 2;
      if (raw > 5) raw = 5;
      this._block_pat_ids[i] = raw;
    }
    this._pf_state = 0;
    this._block_colors = [0, 1, 0, 1, 0, 1];
  }

  // Read-only views used by Spawner.
  get level()      { return this._level; }
  get pf1_pat_id() { return this._pf1_pat_id; }

  // Called 1–3 times per frame by Game depending on player speedY.
  advance() {
    this._pattern_scroll = (this._pattern_scroll + 1) % PATTERN_ROW_COUNT;
    this._block_offset += 1;
    if (this._block_offset >= BLOCK_SIZE) {
      this._block_offset -= BLOCK_SIZE;
      this._generateNewBlock();
    }
  }

  _generateNewBlock() {
    // Shift blocks down: bottom goes off-screen, new ID enters at top.
    // Duplicating the OLD top into the new top is harmless because the
    // new top value is overwritten one line later in _nextRandomBlock
    // or _generateNewBlock's bridge branch — but matches port/river.py.
    const lastPat = this._block_pat_ids[this._block_pat_ids.length - 1];
    const lastColor = this._block_colors[this._block_colors.length - 1];
    this._block_pat_ids = this._block_pat_ids.slice(1).concat(lastPat);
    this._block_colors  = this._block_colors.slice(1).concat(lastColor);

    this._block_part -= 1;
    if (this._block_part === 0) {
      this._block_part = 2;
      this._section_block -= 1;
      if (this._section_block === 0) {
        this._endOfSection();
        return;
      }
      this._nextRandomBlock();
      return;
    }

    // First part of last block of section = bridge pattern (PFPat12).
    this._section_block -= 1;
    if (this._section_block === 0) {
      this._endOfSection();
      return;
    }
    this._pf1_pat_id = 12;
    this._block_pat_ids[this._block_pat_ids.length - 1] = 12;
    this._block_colors[this._block_colors.length - 1] = 0;
  }

  _endOfSection() {
    this._section_block = SECTION_BLOCKS;
    this._level = Math.min(this._level + 1, MAX_LEVEL);
    this._pf1_pat_id = 12;
    this._block_pat_ids[this._block_pat_ids.length - 1] = 12;
    this._block_colors[this._block_colors.length - 1] = 0;
  }

  _nextRandomBlock() {
    this.lfsr.next();
    this._updatePFState();

    // Valley width: first 4 levels cap max pattern ID at 8 (narrow river).
    this._valley_width = this._level < 5 ? 6 : 0;

    this.lfsr.next();
    let raw = this.lfsr.peekLo() & 0x0F;
    if (raw < 2) raw = 2;
    let max = 14;
    if (this._pf_state & 0x80) max = 13;
    if (this._valley_width > 0) max = 8;
    if (raw > max) raw = max;

    // Color: new block is assigned by current level parity. Existing
    // blocks retain whatever color they had when scrolled in.
    const newColor = this._level % 2 === 0 ? 0 : 1;
    this._pf1_pat_id = raw;
    this._block_pat_ids[this._block_pat_ids.length - 1] = raw;
    this._block_colors[this._block_colors.length - 1] = newColor;
  }

  _updatePFState() {
    if (this._section_block === 1) { this._pf_state = 0; return; }
    if (this._section_block === 2) {
      if ((this._pf_state & 0xC0) === 0xC0) this._pf_state &= ~0x40;
      else this._pf_state = 0;
      return;
    }
    const change = this._pf_state & 0x40;
    const island = this._pf_state & 0x80;
    if (island && !change)      this._pf_state = 0xC0;
    else if (island && change)  this._pf_state = 0x80;
    else if (!island && change) this._pf_state = 0x00;
    else {
      this.lfsr.next();
      this._pf_state = (this.lfsr.peekLo() & 0x80) ? 0x00 : 0x40;
    }
  }

  // ── Per-row queries ────────────────────────────────────────────
  /** PFPat byte value for a given river row (0 = top of screen).
   *  Returns 8-bit byte for the block where this row falls. */
  getRowByte(rowInRiver) {
    const riverRows = NUM_BLOCKS * BLOCK_SIZE;        // 192 available rows
    if (rowInRiver < 0 || rowInRiver >= riverRows) return 0;
    const rowInBlock = rowInRiver % BLOCK_SIZE;
    const blockIndex = Math.floor(rowInRiver / BLOCK_SIZE);

    let block = NUM_BLOCKS - 1 - blockIndex;
    if (block < 0) block = 0;
    if (block >= NUM_BLOCKS) block = NUM_BLOCKS - 1;

    const patId = this._block_pat_ids[block];
    const pat = PFPAT[patId] || [0];
    const patRow = (block === NUM_BLOCKS - 1)
      ? (rowInBlock + this._pattern_scroll) % pat.length
      : rowInBlock;
    return pat[patRow % pat.length];
  }

  /** Returns the bank edge info for a river row.
   *  For PFPat0..8: { leftX, rightX, colorIdx, isIsland:false }
   *  For PFPat9..14: { isIsland:true, byteVal, colorIdx } — the renderer
   *    treats islands as embedded mid-river slabs, not as bank walls. */
  bankEdgesForRow(rowInRiver) {
    const blockIndex = Math.floor(rowInRiver / BLOCK_SIZE);
    let block = NUM_BLOCKS - 1 - blockIndex;
    if (block < 0) block = 0;
    if (block >= NUM_BLOCKS) block = NUM_BLOCKS - 1;

    const patId = this._block_pat_ids[block];
    const colorIdx = this._block_colors[block];
    const byteVal = this.getRowByte(rowInRiver);
    if (patId >= 9) {
      // Island pattern — embedded mid-river slab, drawn by the renderer
      // from the byte's bit positions across W * 4 screen pixels.
      return { patId, colorIdx, isIsland: true, byteVal };
    }
    // Bank pattern: compute left/right edges from the leading-bit count
    // (MSB-first, same bit-scan order as the renderer's 8-px column loop).
    // `collision.js:playerHitsBank` consumes leftX/rightX to detect when
    // the player touches a bank wall; without this computation the bank
    // collision test was silently disabled (leftX was `undefined`).
    let lp = 0;
    for (let i = 7; i >= 0; i--) {
      if (byteVal & (1 << i)) lp++;
      else break;
    }
    const leftX  = lp * 8;         // 0..64 in 8-px bank-column steps
    const rightX = W - leftX;      // mirrored across the playfield midline
    return { patId, colorIdx, isIsland: false, byteVal, leftX, rightX };
  }
}

// Re-export the row count for tests/diagnostics.
export { PATTERN_ROW_COUNT };
