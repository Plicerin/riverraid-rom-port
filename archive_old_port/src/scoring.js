// River Raid — Scoring.
//
// Score accumulates by adding (enemy scoreValue × current multiplier).
// Each successful kill resets the multiplier to MULT_START. Each frame
// the multiplier decays toward MULT_MIN, allowing a single kill to count
// for less if you wait too long.

import { MULT_START, MULT_MIN, MULT_DECAY_FRAMES } from './data.js';

export class Scoring {
  constructor() {
    this.score = 0;
    this.multiplier = MULT_START;
    this._decay = 0;
  }

  reset() {
    this.score = 0;
    this.multiplier = MULT_START;
    this._decay = 0;
  }

  add(value) {
    if (!value) return;
    this.score += value * this.multiplier;
    this.multiplier = MULT_START;
    this._decay = 0;
  }

  // Called once per frame. Decays the multiplier after MULT_DECAY_FRAMES
  // idle frames since the last kill.
  tick() {
    this._decay += 1;
    if (this._decay >= MULT_DECAY_FRAMES) {
      this._decay = 0;
      if (this.multiplier > MULT_MIN) this.multiplier -= 1;
    }
  }
}
