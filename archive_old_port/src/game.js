// River Raid — Game.
//
// Top-level orchestrator: holds the systems, advances them per frame,
// and tells the renderer what to draw. The update loop is a flat list of
// statements — no nested state predicates — so the JTZ state machine is
// easy to follow in linear order.

import {
  INTRO_SCROLL,
  SHAPE_BRIDGE,
  H,
  ROAD_H,
} from './data.js';
import { LFSR } from './data.js';
import { River } from './river.js';
import { Spawner } from './spawner.js';
import { Player, Enemy, Bullet, FuelDepot, Explosion } from './entities.js';
import { Scoring } from './scoring.js';
import { rectsOverlap, playerHitsBank } from './collision.js';
import { Input } from './input.js';
import { Renderer } from './render.js';

// Game state machine values.
const TITLE      = 'TITLE';
const SCROLL_IN  = 'SCROLL_IN';
const PLAYING    = 'PLAYING';
const GAME_OVER  = 'GAME_OVER';

export class Game {
  constructor(renderer, input, audio) {
    this.renderer = renderer;
    this.input = input;
    // Audio bus: prefer the instance passed in (main.js owns one for
    // the browser path); fall back to a no-op stub so headless tests
    // that skip main.js still run cleanly.
    this.audio = audio || {
      shoot() {}, hitEnemy() {}, bridge() {}, refuel() {},
      crash() {}, gameOver() {},
    };

    // Shared LFSR — also held by River/Spawner so the random stream
    // stays in lock-step with the original assembly.
    this.lfsr = new LFSR();

    this.river = new River(this.lfsr);
    this.spawner = new Spawner(this.lfsr, this.river);
    this.player = new Player();
    this.scoring = new Scoring();

    this.bullets = [];
    this.enemies = [];
    this.fuelDepots = [];
    this.explosions = [];

    this.state = TITLE;
    this._intro = 0;
    this._introOffset = 0;
  }

  // ── Reset all subsystems for a new game ─────────────────────────
  newGame() {
    this.lfsr.reset();
    this.river.reset();
    this.spawner.reset();
    this.player.reset();
    this.scoring.reset();

    this.bullets.length = 0;
    this.enemies.length = 0;
    this.fuelDepots.length = 0;
    this.explosions.length = 0;

    this.state = SCROLL_IN;
    this._introFrame = 0;
  }

  // Compute the intro scroll-down offset for the current frame.
  // Returns H on the very first frame (river is shifted fully off the
  // bottom) and 0 on the last frame before transitioning to PLAYING.
  _introOffsetY() {
    const denom = INTRO_SCROLL - 1;
    const remaining = denom - this._introFrame;
    return Math.max(0, Math.floor((remaining * H) / denom));
  }

  // ── One tick (60 FPS target) ──────────────────────────────────
  // The Input's just-pressed set must persist throughout the frame so
  // every state branch can see Space/Enter presses. We therefore call
  // input.tick() (which clears just-pressed) at the END of the frame.
  tick() {
    switch (this.state) {
      case TITLE: {
        this.renderer.drawTitle();
        if (this.input.justFire()) this.newGame();
        break;
      }

      case SCROLL_IN: {
        // Reveal-from-top: river + jet are initially drawn fully below
        // the visible viewport and slide UP into view as the offset
        // decreases from H to 0 over INTRO_SCROLL frames.
        const offsetY = this._introOffsetY();
        this.renderer.drawRiver(this.river, offsetY);
        if (this.player.flying)
          this.renderer.drawEntities(
            this.player, [], [], [], [], offsetY
          );
        this._introFrame += 1;
        if (this._introFrame >= INTRO_SCROLL) {
          this.state = PLAYING;
        }
        break;
      }

      case GAME_OVER: {
        this.renderer.drawGameOver(this.scoring.score);
        if (this.input.justFire()) this.state = TITLE;
        break;
      }

      case PLAYING: {
        this._tickPlaying();
        break;
      }
    }

    // Clear just-pressed AFTER every state has had a chance to handle it.
    this.input.tick();
  }

  _tickPlaying() {
    // ── Input ────────────────────────────────────────────────
    if (this.input.justFire() && !this.bullets.some(b => b.active)) {
      this.bullets.push(new Bullet(this.player.x, this.player.y));
      this.audio.shoot();
    }
    this.player.moveUpdate({
      left: this.input.left(),
      right: this.input.right(),
      up: this.input.up(),
      down: this.input.down(),
    });

    // Diagnostic: per-frame state snapshot (gated by window.__diag).
    // This is the only instrumented surface; lets browser-use capture
    // the crash cascade verbatim without scattering logs everywhere.
    if (typeof window !== 'undefined' && window.__diag) {
      console.log(
        '[tick] state=', this.state,
        'player x=', this.player.x, 'y=', this.player.y,
        'vx=', this.player.vx, 'vy=', this.player.vy,
        'state=', this.player.state,
        'lives=', this.player.lives,
        'fuel=', this.player.fuel,
        'enemies=', this.enemies.length,
        'section_block=', this.river._section_block
      );
    }

    // ── Bullets ──────────────────────────────────────────────
    for (const b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => b.active);

    // ── Spawner ──────────────────────────────────────────────
    this.spawner.tick();
    for (const e of this.spawner.getNewEnemies()) this.enemies.push(new Enemy(e.type, e.x, e.y, e.dir));
    for (const f of this.spawner.getNewFuel()) this.fuelDepots.push(new FuelDepot(f.x, f.y));

    // ── Entities (enemies, fuel) ─────────────────────────────
    // Sync scroll_speed BEFORE entities read it. src/entities.js falls
    // back to `river.scroll_speed || 1`, so without this assignment
    // enemies and fuel depots always tick at 1 px/frame regardless of
    // how fast the player is pushing the river — visually they lag the
    // river AND the player, and a jet centered at x=160 will reach any
    // irrationally-quick fuel-spawn position before the fuel renders.
    this.river.scroll_speed = this.player.scrollAmt();
    for (const e of this.enemies) e.update(this.river);
    for (const f of this.fuelDepots) f.update(this.river);
    this.enemies = this.enemies.filter(e => e.alive && e.y < 260);
    this.fuelDepots = this.fuelDepots.filter(f => f.alive && f.y < 260);

    // ── Explosions ───────────────────────────────────────────
    for (const ex of this.explosions) ex.update();
    this.explosions = this.explosions.filter(ex => ex.alive);

    // ── Collisions: bullet ↔ enemy ──────────────────────────
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        // Bridges are wider than the 8-px enemy rect; use a 10-px AABB.
        const eRect = e.type === SHAPE_BRIDGE
          ? { x: e.x, y: e.y, w: 10, h: e.rect.h }
          : e.rect;
        if (rectsOverlap(b.rect, eRect)) {
          e.alive = false;
          this.scoring.add(e.scoreValue);
          this.explosions.push(new Explosion(e.x, e.y, 1));
          if (e.type === SHAPE_BRIDGE) this.audio.bridge();
          else this.audio.hitEnemy();
          b.active = false;
          break;
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.active);

    // ── Collisions: player ↔ fuel (only by proximity) ────────
    // Bullets pass through fuel depots — shooting fuel is wasteful
    // in the original Atari, so we make the player fly over it to collect.
    if (this.player.flying) {
      for (const f of this.fuelDepots) {
        if (!f.alive) continue;
        if (rectsOverlap(this.player.rect, f.rect)) {
          this.player.refuel();
          f.alive = false;
          this.explosions.push(new Explosion(f.x, f.y, 1));
          this.audio.refuel();
          break;
        }
      }
    }

    // ── Collisions: player ↔ enemy ───────────────────────────
    if (this.player.flying) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (rectsOverlap(this.player.rect, e.rect)) {
          if (typeof window !== 'undefined' && window.__diag) {
            console.log('[CRASH] reason=enemy', 'enemy.type=', e.type, 'enemy.x=', e.x, 'enemy.y=', e.y);
          }
          this.player.crash();
          this.audio.crash();
          e.alive = false;
          break;
        }
      }
    }

    // ── Collisions: player ↔ river bank ──────────────────────
    if (this.player.flying) {
      if (playerHitsBank(this.player, this.river)) {
        if (typeof window !== 'undefined' && window.__diag) {
          const row = this.player.y;
          const edges0 = this.river.bankEdgesForRow(row - ROAD_H);
          console.log('[CRASH] reason=bank', 'player.x=', this.player.x,
                      'leftX=', edges0.leftX, 'rightX=', edges0.rightX,
                      'patId=', edges0.patId, 'isIsland=', edges0.isIsland);
        }
        this.player.crash();
        this.audio.crash();
      }
    }

    // ── Fuel depletion ───────────────────────────────────────
    this.player.depleteFuel();
    if (this.player.fuel <= 0 && this.player.flying) {
      if (typeof window !== 'undefined' && window.__diag) {
        console.log('[FUEL_DIE] fuel reached 0; calling player.die()');
      }
      this.explosions.push(new Explosion(this.player.x, this.player.y, 2));
      this.player.die();
      this.audio.crash();
    }

    // ── Respawn / death countdown ────────────────────────────
    const beforeRespawn = { state: this.player.state, lives: this.player.lives };
    this.player.applyExplodeTimer();
    if (typeof window !== 'undefined' && window.__diag &&
        (beforeRespawn.state !== this.player.state ||
         beforeRespawn.lives !== this.player.lives)) {
      console.log('[RESPAWN] from', beforeRespawn, 'to',
                  { state: this.player.state, lives: this.player.lives,
                    fuel: this.player.fuel,
                    x: this.player.x, y: this.player.y });
    }

    // ── River scroll (player vy → 1/2/3 advances) ───────────
    const amt = this.player.scrollAmt();
    for (let i = 0; i < amt; i++) this.river.advance();

    // ── Multiplier decay ─────────────────────────────────────
    this.scoring.tick();

    // ── Game-over transition ─────────────────────────────────
    if (this.player.lives <= 0 && !this.player.flying) {
      if (typeof window !== 'undefined' && window.__diag) {
        console.log('[GAME_OVER] lives=', this.player.lives,
                    'flying=', this.player.flying);
      }
      this.state = GAME_OVER;
      this.audio.gameOver();
    }

    // ── Draw ─────────────────────────────────────────────────
    this.renderer.drawRiver(this.river);
    this.renderer.drawEntities(
      this.player, this.enemies, this.fuelDepots,
      this.bullets, this.explosions
    );
    this.renderer.drawHUD({
      score: this.scoring.score,
      multiplier: this.scoring.multiplier,
      lives: this.player.lives,
      fuel: this.player.fuel,
    });
  }
}

// State names are exported for tests / external drivers.
export { TITLE, SCROLL_IN, PLAYING, GAME_OVER };
