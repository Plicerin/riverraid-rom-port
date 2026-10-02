// River Raid — AABB overlap detector.
//
// Rows are checked individually for player↔river bank so we can use the
// actual edge shape (banks widen/narrow as the river scrolls), not a
// bounding box. Everything else uses plain AABB.

import { PLAYER_H, PLAYER_W, ROAD_H } from './data.js';

// Standard AABB test for two {x,y,w,h} rectangles.
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
}

// Player vs river bank — iterates the player's height and consults the
// river model for each row. Returns true on first contact. Island rows
// are skipped because islands sit in mid-stream and aren't a hazard.
//
// ROW-OFFSET FIX: `bankEdgesForRow` expects a LOGICAL river row
// (0..NUM_BLOCKS*BLOCK_SIZE), measured from the top of the river model.
// The renderer maps screen row `R` → logical row `R - ROAD_H` (i.e. it
// subtracts the top road strip). The player lives in screen coordinates
// (y is set from JET_Y), so we MUST apply the same offset here. Without
// this fix the collision row is 13 pixels ahead of the render row —
// for PFPat 2-5 the byte is constant so it didn't bite, but for PFPat
// 6-8 (variable bytes) and PFPat 9-14 (island rows) the geometry
// disagreed. See src/river.js bankEdgesForRow + src/render.js drawRiver.
export function playerHitsBank(player, river) {
  const top = player.y;
  const bot = player.y + PLAYER_H;
  for (let row = top; row < bot; row++) {
    const edges = river.bankEdgesForRow(row - ROAD_H);
    if (edges.isIsland) continue;
    if (player.x < edges.leftX) return true;
    if (player.x + PLAYER_W > edges.rightX) return true;
  }
  return false;
}
