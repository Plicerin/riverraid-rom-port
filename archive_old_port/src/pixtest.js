// River Raid — Runtime pixel-test harness.
//
// Why this exists:
//   Across this port's history the user's recurring complaint has been
//   "player jet is upside down / mob sprites flipped / wing tips point
//   the wrong way" — every time the sprite decoder convention was
//   changed (MSB-first vs LSB-first, byte[0]=top vs byte[N-1]=top,
//   vertical flip, 180° rotation, etc.) the only feedback came from the
//   user hand-diffing the running canvas against an authentic 1982
//   cartridge reference. We have settled on LSB-first / TIA scanout
//   order but the next time someone touches bytesToPixels or PFPAT or
//   build_spritesheet.py, the same loop will repeat unless there is a
//   LIVE, AUTOMATED check that fails loudly in the browser.
//
// What this file does:
//   - Every frame the game is in 'PLAYING' state, sample the live
//     internal 320x240 canvas using getImageData at the on-screen
//     bounding box of the player jet and every alive enemy slot.
//   - For each pixel cell inside that bbox, decide if the canvas is
//     "lit" (different from the immediate 1-px-border background
//     sampled just outside the sprite bbox) or "dark".
//   - Compare row/col-by-row/col against the LSB-first expected grid
//     derived via bytesToPixels(SPRITE_BYTES.<name>).
//   - On first match for a given sprite, mark it PASS and stamp the
//     pixel grid. On first mismatch, mark FAIL and dump a side-by-side
//     ASCII render (canvas_rendered | expected | diff) to the console
//     AND surface a red chip on the page so the failure is visible
//     without opening DevTools.
//
// Liveness requirements:
//   - READ-ONLY: never writes to the canvas.
//   - DOM-touching: appends one <div id="pixtest-chip"> to the page
//     on first install (gated behind `?pixtest=1` query param OR
//     always-on if localStorage.__pixtest_chip === '1').
//   - Cheap: one comparison per alive sprite per frame (≈ 30µs total).
//
// Why not just unit-test bytesToPixels?
//   That's how we already pin the decoder convention (tests/test_sprites.py).
//   What this catches is regression in the OTHER layer — drawSprite's
//   fillRect call, color array lookup, palette mapping, ENEMY_SPRITE_PAIR
//   selection, clamp at canvas bounds — none of which a pure data unit
//   test would see. The harness verifies the full pipeline from
//   bytesToPixels output → rendered pixel on the actual canvas.

import {
  bytesToPixels,
  SPRITE_BYTES,
  SPRITES,
  ENEMY_SPRITE_PAIR,
  ENEMY_W, ENEMY_H,
  PLAYER_W, PLAYER_H,
} from './data.js';

// Sum of |dr|+|dg|+|db| between a cell and its row-bg sample must exceed
// this for the cell to count as "lit." Tuned so that the jet's black
// pixels over BLUE water register as lit (deltaR=0, deltaG=0x28,
// deltaB=0x68 → sum ~ 0x90 = 144 ≫ 30), and so ATARI red on GREEN bank
// also registers. Final fall-through is the side-by-side compare, so a
// slightly wrong threshold just shifts which side of the line we land
// on — the diff dump makes the truth obvious.
const COLOR_DIFF_THRESHOLD = 30;

// Per-frame throttle so we don't log 60×/sec on a runaway mismatch —
// emit at most one new PASS/FAIL pair per sprite per N ms.
const LOG_THROTTLE_MS = 500;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function spriteNameForEnemy(e) {
  const pair = ENEMY_SPRITE_PAIR[e.type];
  if (!pair) return null;
  return pair[e.dir >= 0 ? 0 : 1];
}

/**
 * Pretty-printer for row-aligned side-by-side ASCII.
 *   rendered | expected | diff
 * where diff is:
 *   ' '  both same
 *   '-'  rendered lit, expected dark
 *   '+'  rendered dark, expected lit
 */
function asciiDiff(rendered, expected) {
  const rows = rendered.length;
  const out = [];
  for (let r = 0; r < rows; r++) {
    const a = rendered[r] || '';
    const b = expected[r]  || '';
    const diff = (function () {
      let s = '';
      for (let c = 0; c < Math.max(a.length, b.length); c++) {
        const ac = a[c] || '.';
        const bc = b[c] || '.';
        if (ac === bc) s += ' ';
        else if (ac === 'X' && bc === '.') s += '-';   // rendered extra lit
        else if (ac === '.' && bc === 'X') s += '+';   // missed lit
        else s += '?';
      }
      return s;
    })();
    out.push(`row ${String(r).padStart(2)}: ${a} | ${b} | ${diff}`);
  }
  return out.join('\n');
}

export class PixTest {
  constructor(internalCtx, gameRef, getState) {
    this.ctx = internalCtx;     // internal 320x240 ctx
    this.gameRef = gameRef;     // Game instance (.player, .enemies, ...)
    this.getState = getState;   // () => 'PLAYING' | ...
    this._lastLog = new Map();  // label → ms
    this._passes  = new Set();  // labels seen passing
    this._fails   = new Set();  // labels seen failing
    this._chip    = null;
    this._installed = false;
    // Eager-install so window.__pixtest is observable from CDP BEFORE
    // PLAYING begins. The chip + sample() still gate behind sample(),
    // but the aggregate window.__pixtest handle must exist at boot so
    // headless drivers can latch onto it as a "harness ready" signal;
    // otherwise they wait for a tick that never fires.
    this.install();
  }
  install() {
    if (this._installed) return;
    this._installed = true;
    // Only show the on-page chip if explicitly requested (keeps the
    // shipping UI clean for users who didn't ask for diagnostics).
    const wantChip =
      (typeof location !== 'undefined' &&
       /[?&]pixtest=1\b/.test(location.search)) ||
      (typeof localStorage !== 'undefined' &&
       localStorage.getItem('__pixtest_chip') === '1');
    if (wantChip && typeof document !== 'undefined') {
      const chip = document.createElement('div');
      chip.id = 'pixtest-chip';
      chip.style.cssText = [
        'position:fixed','top:12px','right:12px','z-index:9999',
        'padding:6px 10px','border-radius:4px',
        'font:11px monospace','letter-spacing:0.5px',
        'background:rgba(0,0,0,0.7)',
        'color:#b4ffb4','border:1px solid #4a4a4a',
        'pointer-events:none','user-select:none',
      ].join(';');
      chip.textContent = '◌ PIXTEST…';
      document.body.appendChild(chip);
      this._chip = chip;
    }
    // Always expose a programmatic handle so headless/browser-side
    // verifiers can read aggregate results without UI.
    if (typeof window !== 'undefined') {
      window.__pixtest = window.__pixtest || { passed: 0, failed: 0, failures: [] };
    }
  }
  _setChip(label, kind) {
    if (!this._chip) return;
    this._chip.textContent = label;
    if (kind === 'pass') {
      this._chip.style.color = '#b4ffb4';
      this._chip.style.borderColor = '#4a4';
      this._chip.style.background = 'rgba(0,40,0,0.85)';
    } else if (kind === 'fail') {
      this._chip.style.color = '#ff8a8a';
      this._chip.style.borderColor = '#a44';
      this._chip.style.background = 'rgba(40,0,0,0.85)';
    } else {
      this._chip.style.color = '#888';
      this._chip.style.borderColor = '#4a4a4a';
      this._chip.style.background = 'rgba(0,0,0,0.7)';
    }
  }
  setChip(label, kind) { this._setChip(label, kind); }  // public override

  // Called once per frame after render-blit.
  sample() {
    if (!this._installed) this.install();
    const state = this.getState();
    if (state !== 'PLAYING') return;
    const ctx = this.ctx;
    const game = this.gameRef;
    if (!ctx || !game) return;
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // 1. Player jet (always present, deterministic position).
    try {
      const p = game.player;
      if (p) {
        const px = clamp(p.x, 0, ctx.canvas.width  - PLAYER_W);
        const py = clamp(p.y, 0, ctx.canvas.height - PLAYER_H);
        if (px === p.x && py === p.y) {       // fully inside canvas
          const spriteKey = (p.state === 0) ? 'JetStraight' : 'JetExplode';
          this._compareUnique({
            label: `player@(${px},${py}) ${spriteKey}`,
            spriteKey, x: px, y: py, w: PLAYER_W, h: PLAYER_H,
            ctx, now,
          });
        }
      }
    } catch (e) { /* never let harness errors break the game */ }

    // 2. Each alive enemy — group by (type, frame idx) so we PASS the
    // sprite once per direction palette pair, not 60× / frame.
    try {
      const enemies = game.enemies || [];
      for (const e of enemies) {
        if (!e.alive) continue;
        const spriteName = spriteNameForEnemy(e);
        if (!spriteName) continue;
        const ex = clamp(e.x, 0, ctx.canvas.width  - ENEMY_W);
        const ey = clamp(e.y, 0, ctx.canvas.height - ENEMY_H);
        if (ex !== e.x || ey !== e.y) continue;  // skip edge-clipped
        this._compareUnique({
          label: `enemy ${spriteName}@(${ex},${ey})`,
          spriteKey: spriteName, x: ex, y: ey, w: ENEMY_W, h: ENEMY_H,
          ctx, now,
        });
      }
    } catch (e) { /* same throw-guard as above */ }
  }

  _compareUnique(args) {
    const { label, spriteKey, x, y, w, h, ctx, now } = args;
    // Throttle and dedup by SPRITE IDENTITY (= spriteKey), NOT by the
    // per-frame label (which contains player/enemy position). If we
    // key by label, the player moving 1 px per frame yields a brand-
    // new throttle key each frame — bypasses LOG_THROTTLE_MS entirely
    // and grows _lastLog / _passes / _fails unbounded for the length
    // of a single play session (memory leak + 60 Hz console spam).
    // The `label` keeps position info for human-readable log lines.
    const last = this._lastLog.get(spriteKey) || 0;
    if (now - last < LOG_THROTTLE_MS) return;
    this._lastLog.set(spriteKey, now);

    const result = this._compareOne(spriteKey, x, y, w, h, ctx);
    if (result === null) return;  // skipped (no bg available)
    if (result.fails === 0) {
      if (!this._passes.has(spriteKey)) {
        this._passes.add(spriteKey);
        const totalChecked = this._passes.size + this._fails.size;
        console.log(`[pixtest] ✓ ${label} (${totalChecked} sprite shapes checked so far)`);
        if (typeof window !== 'undefined' && window.__pixtest) {
          window.__pixtest.passed = this._passes.size;
        }
        this._setChip(`✓ PIXTEST ${this._passes.size}/${this._passes.size + this._fails.size}`, 'pass');
      }
    } else {
      if (!this._fails.has(spriteKey)) {
        this._fails.add(spriteKey);
        const failure = { label, spriteKey, fails: result.fails, total: w * h,
                          rendered: result.rendered, expected: result.expected };
        const totalChecked = this._passes.size + this._fails.size;
        console.error(
          `\n[pixtest] ✗ MISMATCH on ${label}\n` +
          `Mistakes: ${result.fails}/${w*h}\n` +
          `Decoder convention = LSB-first (bit 0 = col 0, byte[0] = top).\n` +
          `Side-by-side  (rendered | expected | diff):\n` +
          asciiDiff(result.rendered, result.expected) +
          `\n` +
          `[pixtest] If column 0 is wrong and column 7 is right, the bit-order is mirrored.\n` +
          `[pixtest] If row 0 is wrong and the last row is right, the byte-order is mirrored.\n` +
          `[pixtest] Total sprite shapes checked: ${totalChecked} (${this._passes.size} pass, ${this._fails.size} fail)\n`
        );
        if (typeof window !== 'undefined' && window.__pixtest) {
          window.__pixtest.failed = this._fails.size;
          window.__pixtest.failures.push(failure);
        }
        this._setChip(`✗ PIXTEST ${spriteKey}: ${result.fails} wrong`, 'fail');
      }
    }
  }

  // Single compare: read sprite bbox + just-outside bg; build lit grid;
  // compare to expected.
  _compareOne(spriteKey, x, y, w, h, ctx) {
    // Reserve 1-px border for bg sampling. Don't fall off the canvas.
    const bx = Math.max(0, x - 1);
    const by = Math.max(0, y - 1);
    const rightMax = Math.min(ctx.canvas.width,  x + w + 1);
    const botMax   = Math.min(ctx.canvas.height, y + h + 1);
    const bw = rightMax - bx;
    const bh = botMax   - by;
    if (bw !== w + 2 || bh !== h + 2) return null;  // edge-clipped or near-edge; skip
    const data = ctx.getImageData(bx, by, bw, bh).data;

    // Robust bg color: PREVIOUSLY a SINGLE modal across all 2h border
    // pixels, which failed whenever the sprite bbox straddled a water /
    // bank / fuel-depot / sky boundary — rows whose actual bg differed
    // from the global modal would all classify as "lit" against the
    // wrong reference, producing the block-of-X diff patterns we saw at
    // every boundary-crossing bbox. Now we compute ONE modal-bg per ROW
    // from the same 1-px left+right borders (2 samples per row); cells
    // in row r are classified against the bg that actually surrounds r.
    const bgRref = new Array(h);
    const bgGref = new Array(h);
    const bgBref = new Array(h);
    let anyRowUntrusted = false;
    for (let r = 0; r < h; r++) {
      const dataRow = r + 1;                  // skip 1-px top border
      const rowCounts = new Map();
      let rowModalRGB = [0, 0, 0];
      let rowModalCount = 0;
      for (const bcol of [0, w + 1]) {        // left + right 1-px border cols
        const i = (dataRow * bw + bcol) * 4;
        const dr = data[i], dg = data[i + 1], db = data[i + 2];
        // Quantize to nearest 8 (>> 3) to merge visually-identical
        // pixels that differ by 1 due to canvas-rounding.
        const key = (dr >> 3) + ',' + (dg >> 3) + ',' + (db >> 3);
        const c = (rowCounts.get(key) || 0) + 1;
        rowCounts.set(key, c);
        if (c > rowModalCount) {
          rowModalCount = c;
          rowModalRGB = [dr, dg, db];
        }
      }
      // If both border pixels disagree (rowModalCount < 2 means they
      // didn't quantize to the same 8-bit-bucket color), we cannot
      // trust ANY bg for that row → flag whole sprite as "skip" (the
      // previous global path's behaviour was to skip on border
      // contamination; we preserve that semantic per-row so each
      // sprite's skip/fail decision stays coherent).
      if (rowModalCount < 2) {
        anyRowUntrusted = true;
      }
      bgRref[r] = rowModalRGB[0];
      bgGref[r] = rowModalRGB[1];
      bgBref[r] = rowModalRGB[2];
    }
    if (anyRowUntrusted) {
      return null;
    }

    let fails = 0;
    const rendered = new Array(h);

    for (let r = 0; r < h; r++) {
      const dataRow = r + 1;                  // skip 1-row top border
      const bgR = bgRref[r], bgG = bgGref[r], bgB = bgBref[r];
      const line = [];
      for (let c = 0; c < w; c++) {
        const pxIdx = (dataRow * bw + (c + 1)) * 4;    // col c+1 (skip 1-col left border)
        const pr = data[pxIdx];
        const pg = data[pxIdx + 1];
        const pb = data[pxIdx + 2];
        const da = Math.abs(pr - bgR);
        const db = Math.abs(pg - bgG);
        const dc = Math.abs(pb - bgB);
        const lit = (da + db + dc) > COLOR_DIFF_THRESHOLD;
        line.push(lit ? 'X' : '.');
      }
      rendered[r] = line.join('');
    }

    // Build the expected LSB-first grid as a string array, same shape.
    const expected = SPRITES[spriteKey];
    if (!expected) return null;
    const expStr = new Array(h);
    for (let r = 0; r < h; r++) {
      const row = expected[r];
      if (!row) { expStr[r] = ''; continue; }
      let s = '';
      for (let c = 0; c < w; c++) {
        s += row[c] ? 'X' : '.';
      }
      expStr[r] = s;
      // diff count
      for (let c = 0; c < w; c++) {
        const renderedLit = rendered[r][c] === 'X';
        const expectedLit = !!row[c];
        if (renderedLit !== expectedLit) fails++;
      }
      // padding: if rendered row is shorter than w, the missing cells were rendered-beyond-bbox (nil)
      // (we already drew w cells, so mismatches beyond w are impossible)
    }

    return { fails, rendered, expected: expStr };
  }
}

// ──────────────────────────────────────────────────────────────────
// Boot helper: instantiate + install + wire to main loop.
//
// Called from main.js after startGame's renderer is up.
export function bootPixTest(ctx, game, getState) {
  const pt = new PixTest(ctx, game, getState);
  pt.install();
  return pt;
}

// ──────────────────────────────────────────────────────────────────
// Pure-data exports (Node-side testable).
// Re-export the small bits that tests need to verify the harness
// without launching a browser.
export const _internalsForTests = {
  COLOR_DIFF_THRESHOLD,
  asciiDiff,
  clamp,
  spriteNameForEnemy,
};
