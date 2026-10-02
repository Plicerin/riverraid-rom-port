// River Raid — Entity classes (Player + Enemy + Bullet + FuelDepot +
// Explosion). Plain data objects with a small update() method. Each
// entity exposes its AABB collision rectangle (`rect`) for the
// collision system.

import {
  JET_Y, W, FUEL_MAX, FUEL_DRAIN, FUEL_REFUEL,
  PLAYER_W, PLAYER_H, ENEMY_W, ENEMY_H,
  BULLET_W, BULLET_H, FUEL_W, FUEL_H,
  MISSILE_SPEED,
  MAX_SPEED_X, MAX_SPEED_Y,
  PLAYER_FLYING, PLAYER_EXPLODING,
  SHAPE_BRIDGE, SHAPE_HOUSE, SCORES,
} from './data.js';

// ── Player ──────────────────────────────────────────────────────────
export class Player {
  constructor() {
    this._reset();
    this.explode_setup = () => { this.state = PLAYER_EXPLODING; this.explode_timer = 4; };
  }

  _reset() {
    this.x = Math.floor(W / 2);
    this.y = JET_Y;
    this.vx = 0;
    this.vy = 0;            // current frame's vertical speed flag (-2/0/+2)
    this.state = PLAYER_FLYING;
    this.explode_timer = 0;
    this.fuel = FUEL_MAX;
    this.lives = 3;
    this.frame = 0;
  }

  reset() { this._reset(); }

  get rect() { return { x: this.x, y: this.y, w: PLAYER_W, h: PLAYER_H }; }
  get flying() { return this.state === PLAYER_FLYING; }

  // Returns true if player just transitioned from "alive" → "dead"
  // (used by Game to bump the explosion timer).
  applyExplodeTimer() {
    if (this.state !== PLAYER_EXPLODING) return false;
    this.explode_timer -= 1;
    if (this.explode_timer <= 0) {
      if (this.lives > 0) {
        // Respawn.
        this.state = PLAYER_FLYING;
        this.x = Math.floor(W / 2);
        this.y = JET_Y;
        this.vx = 0;
        this.vy = 0;
        this.fuel = FUEL_MAX;
        return true;
      }
      return true;        // no respawn — game over handled by Game
    }
    return false;
  }

  // Input is a snapshot of the four directional booleans.
  moveUpdate({ left, right, up, down }) {
    if (this.state !== PLAYER_FLYING) return;
    if (right) this.vx = Math.min(this.vx + 1, MAX_SPEED_X);
    else if (left) this.vx = Math.max(this.vx - 1, -MAX_SPEED_X);
    else {
      if (this.vx > 0) this.vx = Math.max(0, this.vx - 1);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + 1);
    }
    if (up) this.vy = -MAX_SPEED_Y;
    else if (down) this.vy = MAX_SPEED_Y;
    else this.vy = 0;

    this.x += this.vx;
    if (this.x < 0) this.x = 0;
    if (this.x > W - PLAYER_W) this.x = W - PLAYER_W;
  }

  // Crash flag (river bank / enemy / fuel exhaustion).
  crash() {
    if (this.state !== PLAYER_FLYING) return;
    this.state = PLAYER_EXPLODING;
    this.explode_timer = 4;
    this.lives -= 1;
    if (this.lives < 0) this.lives = 0;
  }

  // Fuel depletion triggers a single death (one life lost), not a
  // wipe. Originally this method unconditionally set lives=0, which
  // meant idling past 4.25 s of fuel drain wiped all 3 lives in one
  // hit. Real River Raid gives the player a free respawn with full
  // fuel after a fuel-out crash; we now match that by delegating to
  // crash() which decrements by 1 and triggers the 4-frame explode.
  die() {
    return this.crash();
  }

  refuel() {
    this.fuel = Math.min(this.fuel + FUEL_REFUEL, FUEL_MAX);
  }
  depleteFuel() {
    this.fuel = Math.max(0, this.fuel - FUEL_DRAIN);
  }

  // Scroll speed is the number of river advances per frame.
  scrollAmt() {
    if (this.vy < 0) return 3;     // up = fastest (JTZ speedY < $C0)
    if (this.vy > 0) return 2;     // down = slower than default
    return 1;                      // default
  }

  tickFrame() { this.frame += 1; }
}

// ── Enemy ───────────────────────────────────────────────────────────
export class Enemy {
  constructor(type, x, y, dir = 1) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.alive = true;
    this.frame = 0;
  }

  get rect() { return { x: this.x, y: this.y, w: ENEMY_W, h: ENEMY_H }; }
  get scoreValue() { return SCORES[this.type] || 0; }
  get isStatic() { return this.type === SHAPE_BRIDGE || this.type === SHAPE_HOUSE; }

  update(river) {
    if (!this.alive) return;
    if (!this.isStatic) {
      this.x += this.dir;
      if (this.x <= 0 || this.x >= W - ENEMY_W) this.dir *= -1;
    }
    this.y += river.scroll_speed || 1;
    this.frame += 1;
  }
}

// ── Bullet (player missile) ────────────────────────────────────────
export class Bullet {
  constructor(x, y) {
    this.x = x + Math.floor(BULLET_W / 2) - 1;   // center on player jet
    this.y = y - BULLET_H;
    this.active = true;
  }
  get rect() { return { x: this.x, y: this.y, w: BULLET_W, h: BULLET_H }; }

  update() {
    this.y -= MISSILE_SPEED;
    if (this.y + BULLET_H < 0) this.active = false;
  }
}

// ── Fuel depot ──────────────────────────────────────────────────────
export class FuelDepot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alive = true;
    this.frame = 0;
  }
  get rect() { return { x: this.x, y: this.y, w: FUEL_W, h: FUEL_H }; }

  update(river) {
    this.y += river.scroll_speed || 1;
    this.frame += 1;
    if (this.y > 240) this.alive = false;
  }
}

// ── Explosion ───────────────────────────────────────────────────────
export class Explosion {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;        // 1 = small, 2 = large
    this.timer = type === 2 ? 12 : 6;
    this.alive = true;
    this.startY = y;
  }
  update() {
    this.timer -= 1;
    if (this.timer <= 0) this.alive = false;
  }
}

// NOTE: rectsOverlap lives in src/collision.js as the single canonical
// AABB helper. Game imports it from there.
