// River Raid — Renderer.
//
// Draws to an offscreen 320x240 canvas, which is then handed to the
// visible canvas at 2x. The renderer NEVER touches the visible canvas
// directly, so the Game loop is free to blit-on-blit without losing
// the unscaled backbuffer.
//
// Three responsibilities:
//   1. drawRiver    - water background + per-row bank/island rendering
//   2. drawEntities - enemies, fuel, bullets, player jet, explosions
//   3. drawHUD      - score / multiplier / lives / fuel gauge
//
// Both drawRiver and drawEntities accept an optional `offsetY` (default
// 0) which shifts the water + banks + islands + every entity DOWN by
// that many pixels. The intro reveal-from-top animation uses this so the
// river and jet rise into view instead of just sitting there.

import {
  W, H, ROAD_H,
  FUEL_MAX,
  PLAYER_FLYING, PLAYER_EXPLODING,
  SHAPE_BRIDGE,
} from './data.js';
import { SPRITES, ENEMY_SPRITE_PAIR } from './data.js';
import { PALETTE, css, BANK_COLORS, ENEMY_PALETTES, ROAD_COLOR_TAB } from './palette.js';

export class Renderer {
  constructor(g) {                       // g = internal 320x240 ctx
    this.g = g;
  }

  // ── River rendering ─────────────────────────────────────────────
  // `offsetY` shifts water + banks/islands down by N px; road strips
  // stay fixed at the top + bottom of the screen.
  drawRiver(river, offsetY = 0) {
    const g = this.g;
    try {
      // Water covers only the river area between top and bottom road,
      // shifted by offsetY. Roads are drawn last so they cover the
      // water edges regardless of offsetY.
      g.fillStyle = css(PALETTE.BLUE);
      g.fillRect(0, ROAD_H + offsetY, W, H - ROAD_H * 2);

      // Bank DATA is indexed by logical river row; we paint it at
      // (logical row) + offsetY so a positive offset pushes the entire
      // waterline downward.
      const riverTop = ROAD_H;
      const riverBot = H - ROAD_H;
      for (let row = riverTop; row < riverBot; row++) {
        const screenY = row + offsetY;
        const edges = river.bankEdgesForRow(row - riverTop);
        const color = BANK_COLORS[edges.colorIdx];

        // Both bank and island rows render via the same unified bit-loop
        // below (8-px columns, MSB-first scanout, mirrored across midline).
        // The isIsland flag is only consumed by collision.js to skip
        // island rows; the renderer treats them identically.
        if (!edges.byteVal) continue;
        for (let bit = 7; bit >= 0; bit--) {
          if (!(edges.byteVal & (1 << bit))) continue;
          const colPx = (7 - bit) * 8;                         // bit 7 → x=0
          fill(g, colPx, screenY, 8, 1, color);               //   left half
          fill(g, W - colPx - 8, screenY, 8, 1, color);        //   right half (mirror)
        }
      }

      // Road strips at fixed top/bottom positions — NOT shifted.
      for (let row = 0; row < ROAD_H; row++) {
        const c = ROAD_COLOR_TAB[row % ROAD_COLOR_TAB.length];
        fill(g, 0, row, W, 1, c);
        fill(g, 0, H - ROAD_H + row, W, 1, c);
      }
    } catch (e) {
      console.error('[drawRiver EXCEPTION]', e && e.message, '\n', e && e.stack);
      throw e;
    }
  }

  // ── Entities ────────────────────────────────────────────────────
  // `offsetY` shifts every entity's y down by N px so the jet rises
  // into view along with the river.
  drawEntities(player, enemies, fuelDepots, bullets, explosions, offsetY = 0) {
    const g = this.g;
    try {
      for (const e of enemies) if (e.alive) drawEnemy(g, e, offsetY);
      for (const f of fuelDepots) if (f.alive) drawFuel(g, f, offsetY);
      for (const b of bullets) if (b.active)
        fill(g, b.x, b.y + offsetY, 1, 8, PALETTE.ORANGE);
      // The two player-state branches below both null-check their sprite
      // before drawing so a future SPRITES regression logs explicitly
      // instead of throwing inside drawSprite.
      if (player.state === PLAYER_FLYING) {
        if (SPRITES.JetStraight) {
          // Jet is drawn in YELLOW (COLUP0=$1C in original JTZ disassembly).
          // The prior value PALETTE.BLACK made the jet invisible — the jet
          // is the player's primary visual anchor and must contrast against
          // the blue river water and the dark bank background.
          drawSprite(g, SPRITES.JetStraight, player.x, player.y + offsetY, false, PALETTE.YELLOW);
        } else {
          console.error('[drawEntities] SPRITES.JetStraight is undefined');
        }
      } else if (player.state === PLAYER_EXPLODING) {
        if (SPRITES.JetExplode) {
          drawSprite(g, SPRITES.JetExplode, player.x, player.y + offsetY, false, PALETTE.ORANGE);
        }
      }
      for (const ex of explosions) if (ex.alive) drawExplosion(g, ex, offsetY);
    } catch (e) {
      console.error('[drawEntities EXCEPTION]', e && e.message, '\n', e && e.stack);
      throw e;
    }
  }

  drawHUD({ score, multiplier, lives, fuel }) {
    const g = this.g;
    try {
      drawText5x7(g, `SCORE:${score}`, 4, 4, PALETTE.YELLOW, 2);
      drawText5x7(g, `x${multiplier}`, (W - (1 + String(multiplier).length) * 6 * 2) / 2, 4, PALETTE.WHITE, 2);

      const livesStr = 'LIVES:' + '1'.repeat(Math.max(0, Math.min(lives, 9)));
      const livesW = livesStr.length * 12;  // 6 px/char × scale 2
      drawText5x7(g, livesStr, W - livesW - 4, 4, PALETTE.YELLOW, 2);

      const gy = H - 26;
      fill(g, 4, gy, 100, 16, PALETTE.DARK_BLUE);
      drawText5x7(g, 'FUEL', 8, gy + 3, PALETTE.YELLOW, 2);

      const bw = 16, bh = 10, gap = 2, sx = 58, n = 5;
      const fl = Math.max(0, Math.min(1, fuel / FUEL_MAX));
      for (let i = 0; i < n; i++) {
        const bx = sx + i * (bw + gap);
        const filled = fl >= (i + 1) / n;
        fill(g, bx, gy + 3, bw, bh, filled ? PALETTE.YELLOW : PALETTE.GREY);
        g.strokeStyle = '#333';
        g.strokeRect(bx + 0.5, gy + 3.5, bw - 1, bh - 1);
      }
    } catch (e) {
      console.error('[drawHUD EXCEPTION]', e && e.message, '\n', e && e.stack);
      throw e;
    }
  }

  // ── Title / game over ───────────────────────────────────────────
  drawTitle() {
    const g = this.g;
    fill(g, 0, 0, W, H, PALETTE.BLACK);
    // Authentic Atari-styled title using 5x7 pixel font.
    drawText5x7(g, 'RIVER RAID', (W - 10 * 6 * 4) / 2, 60, PALETTE.YELLOW, 4);
    drawText5x7(g, 'ATARI 2600', (W - 10 * 6 * 2) / 2, 100, PALETTE.WHITE, 2);
    drawText5x7(g, 'PRESS SPACE TO START', (W - 19 * 6 * 2) / 2, 150, PALETTE.YELLOW, 2);
    drawText5x7(g, 'ARROW KEYS / WASD', (W - 16 * 6 * 2) / 2, 180, PALETTE.GREY, 2);
    drawText5x7(g, 'SPACE - FIRE', (W - 12 * 6 * 2) / 2, 195, PALETTE.GREY, 2);
  }
  drawGameOver(score) {
    const g = this.g;
    fill(g, 0, 0, W, H, PALETTE.BLACK);
    drawText5x7(g, 'GAME OVER', (W - 9 * 6 * 4) / 2, 60, PALETTE.RED, 4);
    drawText5x7(g, `FINAL SCORE ${score}`, (W - (12 + String(score).length) * 6 * 2) / 2, 110, PALETTE.YELLOW, 2);
    drawText5x7(g, 'PRESS SPACE TO RESTART', (W - 22 * 6 * 2) / 2, 160, PALETTE.WHITE, 2);
  }
}

// ── Internal draw helpers (module-private) ────────────────────────
function fill(g, x, y, w, h, color) {
  g.fillStyle = css(color);
  g.fillRect(x, y, w, h);
}

function drawSprite(g, sprite, sx, sy, flipX, color) {
  g.fillStyle = css(color);
  for (let row = 0; row < sprite.length; row++) {
    const rowData = sprite[row];
    for (let col = 0; col < rowData.length; col++) {
      if (!rowData[col]) continue;
      const px = flipX ? sx + (7 - col) : sx + col;
      g.fillRect(px, sy + row, 1, 1);
    }
  }
}

function spritePair(type, idx) {
  const names = ENEMY_SPRITE_PAIR[type];
  if (!names) return null;
  return SPRITES[names[idx]];
}

function drawEnemy(g, e, offsetY = 0) {
  const palettes = ENEMY_PALETTES[e.type];
  const color = palettes ? palettes[e.frame % palettes.length] : PALETTE.GREY;

  if (e.type === SHAPE_BRIDGE) {
    // Bridges carry a 1-px black skyline above the sprite and a brown
    // road deck along its top edge - the visual cue that lets the player
    // tell a finish-line bridge from a generic red enemy. Deck color
    // matches the original JS hard-coded [160,100,60] (sandstone road).
    const sprite = SPRITES.BridgeB;
    if (sprite) drawSprite(g, sprite, e.x, e.y + offsetY, false, color);
    fill(g, e.x - 1, e.y + offsetY - 1, 10, 1, PALETTE.BLACK);
    fill(g, e.x - 1, e.y + offsetY,     10, 1, [160, 100, 60]);
    return;
  }

  const sprite = spritePair(e.type, e.dir >= 0 ? 0 : 1);
  if (sprite) drawSprite(g, sprite, e.x, e.y + offsetY, false, color);
}

function drawFuel(g, f, offsetY = 0) {
  // Light-grey plate + red sprite overlay so the depot is visible
  // against the dark blue water and the bright bank.
  fill(g, f.x, f.y + offsetY, 8, 11, PALETTE.LIGHT_GREY);
  const sprite = (Math.floor(f.frame / 4) % 2 === 0) ? SPRITES.FuelA : SPRITES.FuelB;
  drawSprite(g, sprite, f.x, f.y + offsetY, false, PALETTE.RED);
}

function drawExplosion(g, ex, offsetY = 0) {
  const baseName = ex.type === 2 ? 'Explosion2' : 'Explosion1';
  const sprite = ex.timer > 4 ? SPRITES[baseName + 'A'] : SPRITES[baseName + 'B'];
  const color = (ex.timer % 2 === 0) ? PALETTE.ORANGE : PALETTE.RED;
  if (sprite) drawSprite(g, sprite, ex.x, ex.y + offsetY, false, color);
}

// ── Atari-styled 5x7 pixel glyph table ───────────────────────────────
// Each glyph is 7 rows of 5 columns; '#' = lit, '.' = unlit.
// Matches the Python port's GLYPHS_5x7 in port/rendering/screen.py.
const GLYPHS_5x7 = {
  'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  'G': ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'],
  'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  'N': ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'W': ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
  'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '#....', '####.', '....#', '....#', '####.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  '/': ['....#', '...#.', '..#..', '.#...', '#....', '.....', '.....'],
  'x': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
};

/** Draw Atari-styled 5x7 pixel-glyph text. */
function drawText5x7(g, str, x, y, color, scale = 2) {
  g.fillStyle = css(color);
  let cx = x;
  for (const ch of str) {
    // Try exact case first (for lowercase 'x' in multiplier), then uppercase.
    const glyph = GLYPHS_5x7[ch] || GLYPHS_5x7[ch.toUpperCase()] || GLYPHS_5x7[' '];
    for (let row = 0; row < glyph.length; row++) {
      const run = glyph[row];
      for (let col = 0; col < run.length; col++) {
        if (run[col] === '#') {
          g.fillRect(cx + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    cx += 6 * scale;  // 5 wide + 1 col gap
  }
}
