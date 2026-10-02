import * as visiblePort from './riverraidVisiblePort.mjs';
import { resolvePlayerJetBitmap } from './playerJetSprite.mjs';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const fuelEl = document.getElementById('fuel');
const livesEl = document.getElementById('lives');
const sectionEl = document.getElementById('section');
const debugEl = document.getElementById('debug');

const memory = visiblePort.createZeroPageMemory();
const pressed = new Set();
const logicalWidth = canvas.width;
const logicalHeight = canvas.height;
const SLOT_NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
const SCREEN_TITLE = 'title';
const SCREEN_PLAYING = 'playing';
const SCREEN_GAME_OVER = 'game-over';

let screenState = SCREEN_TITLE;
let paused = false;
let lastFrameTime = 0;
let accumulatorMs = 0;
let lastStepResult = null;
const frameStepMs = 1000 / 60;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shapeColor(shapeId) {
  const colors = {
    [visiblePort.SHAPE_IDS.ID_EXPLOSION0]: visiblePort.ntscColorCss(visiblePort.COLORS.RED),
    [visiblePort.SHAPE_IDS.ID_EXPLOSION1]: visiblePort.ntscColorCss(visiblePort.COLORS.ORANGE),
    [visiblePort.SHAPE_IDS.ID_EXPLOSION2]: visiblePort.ntscColorCss(visiblePort.COLORS.YELLOW),
    [visiblePort.SHAPE_IDS.ID_EXPLOSION3]: visiblePort.ntscColorCss(visiblePort.DERIVED_COLORS.LIGHT_GREY),
    [visiblePort.SHAPE_IDS.ID_PLANE]: visiblePort.ntscColorCss(visiblePort.DERIVED_COLORS.LIGHT_GREY),
    [visiblePort.SHAPE_IDS.ID_HELI0]: visiblePort.ntscColorCss(visiblePort.COLORS.GREY),
    [visiblePort.SHAPE_IDS.ID_HELI1]: visiblePort.ntscColorCss(visiblePort.DERIVED_COLORS.LIGHT_GREY),
    [visiblePort.SHAPE_IDS.ID_SHIP]: visiblePort.ntscColorCss(visiblePort.DERIVED_COLORS.BROWN),
    [visiblePort.SHAPE_IDS.ID_BRIDGE]: visiblePort.ntscColorCss(visiblePort.DERIVED_COLORS.BROWN),
    [visiblePort.SHAPE_IDS.ID_HOUSE]: visiblePort.ntscColorCss(visiblePort.COLORS.GREEN),
    [visiblePort.SHAPE_IDS.ID_FUEL]: visiblePort.ntscColorCss(visiblePort.COLORS.CYAN),
  };
  return colors[shapeId] || visiblePort.ntscColorCss(visiblePort.DERIVED_COLORS.LIGHT_GREY);
}

function drawBitmap(targetCtx, bitmap, centerX, centerY, color, options = {}) {
  if (!bitmap?.length) return;
  const scale = options.scale ?? 3;
  const scaleX = options.scaleX ?? scale;
  const scaleY = options.scaleY ?? scale;
  const reflect = !!options.reflect;
  const copies = options.copies ?? 1;
  const spacing = options.spacing ?? Math.max(scaleX * 10, 18);
  const width = bitmap[0].length * scaleX;
  const height = bitmap.length * scaleY;
  const startX = centerX - (((copies - 1) * spacing) + width) / 2;
  targetCtx.fillStyle = color;
  for (let copy = 0; copy < copies; copy += 1) {
    const leftX = startX + copy * spacing;
    for (let row = 0; row < bitmap.length; row += 1) {
      const bits = bitmap[row];
      if (options.rowColors?.[row]) targetCtx.fillStyle = options.rowColors[row];
      for (let col = 0; col < bits.length; col += 1) {
        if (bits[col] !== '1') continue;
        const pixelCol = reflect ? (bits.length - 1 - col) : col;
        targetCtx.fillRect(leftX + pixelCol * scaleX, centerY - height / 2 + row * scaleY, scaleX, scaleY);
      }
    }
  }
}

const BLOCK_GLYPHS = Object.freeze({
  '0': ['111','101','101','101','111'],
  '1': ['010','110','010','010','111'],
  '2': ['111','001','111','100','111'],
  '3': ['111','001','111','001','111'],
  '4': ['101','101','111','001','001'],
  '5': ['111','100','111','001','111'],
  '6': ['111','100','111','101','111'],
  '7': ['111','001','010','010','010'],
  '8': ['111','101','111','101','111'],
  '9': ['111','101','111','001','111'],
  'A': ['010','101','111','101','101'],
  'B': ['110','101','110','101','110'],
  'C': ['111','100','100','100','111'],
  'D': ['110','101','101','101','110'],
  'E': ['111','100','110','100','111'],
  'F': ['111','100','110','100','100'],
  'G': ['111','100','101','101','111'],
  'H': ['101','101','111','101','101'],
  'I': ['111','010','010','010','111'],
  'J': ['001','001','001','101','111'],
  'K': ['101','101','110','101','101'],
  'L': ['100','100','100','100','111'],
  'M': ['101','111','111','101','101'],
  'N': ['101','111','111','111','101'],
  'O': ['111','101','101','101','111'],
  'P': ['111','101','111','100','100'],
  'Q': ['111','101','101','111','001'],
  'R': ['111','101','111','110','101'],
  'S': ['111','100','111','001','111'],
  'T': ['111','010','010','010','010'],
  'U': ['101','101','101','101','111'],
  'V': ['101','101','101','101','010'],
  'W': ['101','101','111','111','101'],
  'X': ['101','101','010','101','101'],
  'Y': ['101','101','010','010','010'],
  'Z': ['111','001','010','100','111'],
  '-': ['000','000','111','000','000'],
  '.': ['000','000','000','000','010'],
  ':': ['000','010','000','010','000'],
  ' ': ['000','000','000','000','000'],
});

function blockTextWidth(text, scale = 3) {
  return [...String(text).toUpperCase()].reduce((width, char, index) => {
    const glyph = BLOCK_GLYPHS[char] ?? BLOCK_GLYPHS[' '];
    return width + (glyph[0].length * scale) + (index === 0 ? 0 : scale);
  }, 0);
}

function drawBlockText(text, x, y, options = {}) {
  const scale = options.scale ?? 3;
  const align = options.align ?? 'left';
  const color = options.color ?? '#e8f0ff';
  let cursorX = Math.floor(x);
  const width = blockTextWidth(text, scale);
  if (align === 'center') cursorX -= Math.floor(width / 2);
  if (align === 'right') cursorX -= width;

  ctx.fillStyle = color;
  for (const char of String(text).toUpperCase()) {
    const glyph = BLOCK_GLYPHS[char] ?? BLOCK_GLYPHS[' '];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') {
          ctx.fillRect(cursorX + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    cursorX += (glyph[0].length + 1) * scale;
  }
}

function copiesForSlot(slot) {
  if (slot?.state1?.nusiz >= 4 && slot.state1.nusiz <= 5) return 2;
  if (slot?.state1?.nusiz === 6) return 3;
  return 1;
}

// Object bitmaps are one scanline per row, so draw them at the playfield's
// line/clock scale; NUSIZ stretches width only.
function spriteScaleForSlot(slot) {
  const sizeMult = slot?.state1?.nusiz >= 7 ? 4 : slot?.state1?.nusiz >= 5 ? 2 : 1;
  return {
    scaleX: (logicalWidth / 160) * sizeMult,
    scaleY: logicalHeight / visiblePort.GAME_CONSTANTS.NUM_LINES,
  };
}

function xToCanvas(x) {
  return (x / 160) * logicalWidth;
}

function computeSafeSpawnX(preferredX = 80) {
  const rawPlayerX = clamp(preferredX, 0, 159);
  const riverBounds = visiblePort.inspectVisibleJetRiverBounds(memory, { playerX: rawPlayerX });
  if (!riverBounds.collidedWithBank) return rawPlayerX;
  return Math.floor((riverBounds.leftBound + riverBounds.rightBound) / 2);
}

function previewSpawnLane(candidateX, previewSteps = 180) {
  const probeMemory = visiblePort.createZeroPageMemory();
  probeMemory.set(memory);
  for (let step = 0; step < previewSteps; step += 1) {
    const riverBounds = visiblePort.inspectVisibleJetRiverBounds(probeMemory, { playerX: candidateX });
    if (riverBounds.collidedWithBank || riverBounds.clampedPlayerX !== candidateX) {
      return { safe: false, survivedSteps: step, reason: 'bank' };
    }
    visiblePort.setField(probeMemory, 'playerX', candidateX);
    visiblePort.setField(probeMemory, 'joystick', 0x00);
    const loopStep = visiblePort.stepVisibleGameplayLoop(probeMemory);
    if (loopStep.lastStep.playerCrash) {
      return { safe: false, survivedSteps: step, reason: loopStep.lastStep.playerCrashKind };
    }
  }
  return { safe: true, survivedSteps: previewSteps, reason: 'clear' };
}

function computeSafePlayableSpawnX(preferredX = 80) {
  const baseX = computeSafeSpawnX(preferredX);
  const tried = new Set();
  let bestCandidate = { x: baseX, survivedSteps: -1, distance: Infinity };
  for (let delta = 0; delta < 160; delta += 1) {
    const candidates = delta === 0 ? [baseX] : [baseX + delta, baseX - delta];
    for (const candidate of candidates) {
      const x = clamp(candidate, 0, 159);
      if (tried.has(x)) continue;
      tried.add(x);
      const preview = previewSpawnLane(x);
      const distance = Math.abs(x - preferredX);
      if (preview.safe) return x;
      if (preview.survivedSteps > bestCandidate.survivedSteps || (preview.survivedSteps === bestCandidate.survivedSteps && distance < bestCandidate.distance)) {
        bestCandidate = { x, survivedSteps: preview.survivedSteps, distance };
      }
    }
  }
  return bestCandidate.x;
}

function resetToPlayableStart() {
  visiblePort.applyVisibleResetLogic(memory);
  visiblePort.setField(memory, 'frameCnt', 0x00);
  visiblePort.setField(memory, 'gameMode', visiblePort.GAME_CONSTANTS.INTRO_SCROLL);
  visiblePort.setField(memory, 'sectionBlock', visiblePort.GAME_CONSTANTS.SECTION_BLOCKS);
  visiblePort.setField(memory, 'sectionEnd', 0x01);
  visiblePort.setField(memory, 'blockOffset', 0x00);
  visiblePort.setField(memory, 'blockPart', 0x01);
  visiblePort.setField(memory, 'PF1PatId', 0x00);
  visiblePort.setField(memory, 'prevPF1PatId', 0x00);
  visiblePort.setField(memory, 'temp3', 0x00);
  visiblePort.setField(memory, 'lineNum', 0x00);
  visiblePort.setField(memory, 'posYLo', 0x00);
  visiblePort.setField(memory, 'fuelHi', 183);
  visiblePort.setField(memory, 'fuelLo', 0xff);
  visiblePort.setField(memory, 'playerX', 80);
  visiblePort.setField(memory, 'speedX', 0x00);
  visiblePort.setField(memory, 'speedY', 0x00);
  visiblePort.setField(memory, 'dXSpeed', 0x00);
  visiblePort.setField(memory, 'joystick', 0x00);
  visiblePort.setField(memory, 'bridgeExplode', 0x00);
  visiblePort.setField(memory, 'bridgeSound', 0x00);
  visiblePort.setField(memory, 'missileFlag', 0x00);
  visiblePort.setField(memory, 'missileSound', 0x00);
  visiblePort.setField(memory, 'missileY', visiblePort.GAME_CONSTANTS.MAX_MISSILE);
  visiblePort.setField(memory, 'missileX', 88);
  visiblePort.setField(memory, 'gameVariation', 0x00);
  visiblePort.setField(memory, 'level', 0x00);
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.livesPtr.address, 3);
  visiblePort.advanceVisibleSlotScene(memory);
  const safePlayerX = computeSafePlayableSpawnX(80);
  visiblePort.setField(memory, 'playerX', safePlayerX);
  visiblePort.setField(memory, 'missileX', Math.min(159, safePlayerX + 8));
  accumulatorMs = 0;
  lastStepResult = null;
}

function startGame() {
  resetToPlayableStart();
  screenState = SCREEN_PLAYING;
  paused = false;
  pauseButton.textContent = 'Pause';
}

function showTitle() {
  screenState = SCREEN_TITLE;
  paused = false;
  accumulatorMs = 0;
  lastStepResult = null;
  pauseButton.textContent = 'Pause';
}

function currentJoystickByte() {
  let value = 0;
  if (pressed.has('ArrowRight') || pressed.has('KeyD')) value |= visiblePort.FLAGS.joystick.MOVE_RIGHT;
  if (pressed.has('ArrowLeft') || pressed.has('KeyA')) value |= visiblePort.FLAGS.joystick.MOVE_LEFT;
  if (pressed.has('ArrowDown') || pressed.has('KeyS')) value |= visiblePort.FLAGS.joystick.MOVE_DOWN;
  if (pressed.has('ArrowUp') || pressed.has('KeyW')) value |= visiblePort.FLAGS.joystick.MOVE_UP;
  return value & 0xff;
}

function syncJoystick() {
  visiblePort.setField(memory, 'joystick', currentJoystickByte());
}

function fireMissile() {
  if (screenState !== SCREEN_PLAYING) return;
  visiblePort.fireVisibleMissile(memory);
}

function stepGame() {
  if (screenState !== SCREEN_PLAYING) return;
  syncJoystick();
  lastStepResult = visiblePort.stepVisibleGameplayLoop(memory);
  if (lastStepResult?.lastStep?.respawned) {
    const safePlayerX = computeSafePlayableSpawnX(80);
    visiblePort.setField(memory, 'playerX', safePlayerX);
    visiblePort.setField(memory, 'missileX', Math.min(159, safePlayerX + 8));
  }
  if (lastStepResult?.lastStep?.respawnBlocked) {
    screenState = SCREEN_GAME_OVER;
    paused = false;
    pauseButton.textContent = 'Pause';
  }
}

function buildTerrainRows(rows, targetBands = 48) {
  if (!rows.length) return [];
  const anchors = rows.map((row) => ({
    ...row,
    yMid: (row.yTop + row.yBottom) / 2,
  })).sort((a, b) => a.yMid - b.yMid);
  const bandCount = Math.max(rows.length, targetBands);
  const out = [];
  for (let band = 0; band < bandCount; band += 1) {
    const yTop = Math.floor((band / bandCount) * logicalHeight);
    const yBottom = Math.floor(((band + 1) / bandCount) * logicalHeight);
    const yMid = (yTop + yBottom) / 2;
    let lower = anchors[0];
    let upper = anchors[anchors.length - 1];
    for (let index = 0; index < anchors.length; index += 1) {
      if (anchors[index].yMid <= yMid) lower = anchors[index];
      if (anchors[index].yMid >= yMid) {
        upper = anchors[index];
        break;
      }
    }
    const span = Math.max(1, upper.yMid - lower.yMid);
    const t = lower === upper ? 0 : clamp((yMid - lower.yMid) / span, 0, 1);
    const left = Math.round(lower.left + ((upper.left - lower.left) * t));
    const right = Math.round(lower.right + ((upper.right - lower.right) * t));
    const nearest = Math.abs(yMid - lower.yMid) <= Math.abs(yMid - upper.yMid) ? lower : upper;
    out.push({
      yTop,
      yBottom: Math.max(yTop + 1, yBottom),
      yMid,
      left,
      right,
      width: right - left,
      nearest,
    });
  }
  return out;
}

function drawBackground(rows) {
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const terrainRows = buildTerrainRows(rows);
  const waterGradient = ctx.createLinearGradient(0, 0, 0, logicalHeight);
  waterGradient.addColorStop(0, '#0f5fa8');
  waterGradient.addColorStop(0.45, '#1383d1');
  waterGradient.addColorStop(1, '#0a4f8a');

  ctx.fillStyle = waterGradient;
  ctx.beginPath();
  terrainRows.forEach((row, index) => {
    const left = xToCanvas(row.left);
    if (index === 0) ctx.moveTo(left, row.yTop);
    else ctx.lineTo(left, row.yTop);
    if (index === terrainRows.length - 1) ctx.lineTo(left, row.yBottom);
  });
  for (let index = terrainRows.length - 1; index >= 0; index -= 1) {
    const row = terrainRows[index];
    const right = xToCanvas(row.right);
    ctx.lineTo(right, row.yBottom);
    if (index === 0) ctx.lineTo(right, row.yTop);
  }
  ctx.closePath();
  ctx.fill();

  terrainRows.forEach((row, index) => {
    const left = xToCanvas(row.left);
    const right = xToCanvas(row.right);
    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.032)';
    ctx.fillRect(left, row.yTop, Math.max(1, right - left), row.yBottom - row.yTop);
    if (row.nearest?.carriesRoadBit) {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo((left + right) / 2, row.yTop + 1);
      ctx.lineTo((left + right) / 2, row.yBottom - 1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  ctx.strokeStyle = 'rgba(210, 237, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  terrainRows.forEach((row, index) => {
    const xMid = xToCanvas((row.left + row.right) / 2);
    if (index === 0) ctx.moveTo(xMid, row.yMid);
    else ctx.lineTo(xMid, row.yMid);
  });
  ctx.stroke();
}

function drawWorld() {
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  const scroll = visiblePort.inspectVisibleRiverScrollState(memory);
  const frameCnt = visiblePort.getField(memory, 'frameCnt');
  const gameMode = visiblePort.getField(memory, 'gameMode');
  const slots = visiblePort.inspectVisibleSlots(memory);
  const logicalYToCanvas = line => (line / visiblePort.GAME_CONSTANTS.NUM_LINES) * logicalHeight;
  const rows = scroll.compositeSlices.map((slice, index) => {
    const lineTop = (index * scroll.sliceLineSpan) - scroll.pixelOffset;
    const lineBottom = ((index + 1) * scroll.sliceLineSpan) - scroll.pixelOffset;
    return {
      ...slice,
      yTop: Math.floor(logicalHeight - logicalYToCanvas(lineBottom)),
      yBottom: Math.floor(logicalHeight - logicalYToCanvas(lineTop)),
      slotIndexWrapped: slice.slotIndex % slots.length,
      projectedSlot: slice.projectedSlot ?? slots[slice.slotIndex % slots.length] ?? null,
    };
  }).filter((row) => row.yBottom > 0 && row.yTop < logicalHeight)
    .sort((a, b) => a.yTop - b.yTop);

  drawBackground(rows);

  rows.forEach((row, index) => {
    const rowH = row.yBottom - row.yTop;
    if (rowH <= 0) return;
    const left = xToCanvas(row.left);
    const right = xToCanvas(row.right);
    const centerY = row.yTop + rowH / 2;
    const slot = row.projectedSlot ?? slots[row.slotIndexWrapped] ?? null;

    if (row.source === 'next') {
      ctx.fillStyle = 'rgba(255,214,102,0.06)';
      ctx.fillRect(left, row.yTop, Math.max(1, right - left), rowH);
    }
    if (index === 0 || row.source !== rows[index - 1]?.source) {
      ctx.strokeStyle = row.source === 'next' ? 'rgba(255,214,102,0.22)' : 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(0, row.yTop + 0.5);
      ctx.lineTo(logicalWidth, row.yTop + 0.5);
      ctx.stroke();
    }

    if (row.carriesRoadBit) {
      ctx.strokeStyle = 'rgba(255,255,255,0.32)';
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo((left + right) / 2, row.yTop + 4);
      ctx.lineTo((left + right) / 2, row.yBottom - 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (row.isBridgeRow) {
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(left - 8, centerY - 5, (right - left) + 16, 10);
      ctx.strokeStyle = '#d7b98e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(left - 8, centerY - 5, (right - left) + 16, 10);
    }

    if (!slot || slot.coarseX <= 0) return;
    const sprite = visiblePort.resolveVisibleSpriteVariant(slot.shapeId, frameCnt);
    const clampedX = clamp(slot.inspectX ?? slot.coarseX, row.left + 4, row.right - 4);
    const ox = xToCanvas(clampedX);
    const spriteOptions = {
      ...spriteScaleForSlot(slot),
      reflect: slot.state1?.refp1Label === 'reflected',
      copies: copiesForSlot(slot),
      rowColors: sprite.rowColors?.map(visiblePort.ntscColorCss),
    };
    drawBitmap(ctx, sprite.bitmap, ox, centerY, shapeColor(slot.shapeId), spriteOptions);
  });

  const playerX = visiblePort.getField(memory, 'playerX');
  const playerBounds = visiblePort.inspectVisibleJetRiverBounds(memory, { playerX });
  const jetBitmap = resolvePlayerJetBitmap(frameCnt, gameMode);
  const jetX = xToCanvas(playerBounds.clampedPlayerX);
  const jetY = logicalHeight - ((visiblePort.GAME_CONSTANTS.JET_Y / visiblePort.GAME_CONSTANTS.NUM_LINES) * logicalHeight);
  drawBitmap(ctx, jetBitmap, jetX, jetY, visiblePort.ntscColorCss(visiblePort.COLORS.YELLOW), { scale: 3 });
  if (playerBounds.collidedWithBank) {
    ctx.strokeStyle = visiblePort.ntscColorCss(visiblePort.COLORS.RED);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(jetX - 10, jetY - 12);
    ctx.lineTo(jetX + 10, jetY + 12);
    ctx.moveTo(jetX + 10, jetY - 12);
    ctx.lineTo(jetX - 10, jetY + 12);
    ctx.stroke();
  }

  const missileFlag = visiblePort.getField(memory, 'missileFlag');
  const missileY = visiblePort.getField(memory, 'missileY');
  const missileX = visiblePort.getField(memory, 'missileX');
  if (missileFlag === 0xff && missileY >= visiblePort.GAME_CONSTANTS.MIN_MISSILE) {
    const missileProgress = (missileY - visiblePort.GAME_CONSTANTS.MIN_MISSILE) / (visiblePort.GAME_CONSTANTS.MAX_MISSILE - visiblePort.GAME_CONSTANTS.MIN_MISSILE);
    const my = logicalHeight - 10 - (missileProgress * (logicalHeight - 20));
    const missileRowIndex = clamp(Math.floor((my / logicalHeight) * rows.length), 0, Math.max(0, rows.length - 1));
    const missileRow = rows[missileRowIndex] ?? rows[0] ?? { left: 0, right: 159 };
    const clampedMissileX = clamp(missileX, missileRow.left + 2, missileRow.right - 2);
    const mx = xToCanvas(clampedMissileX);
    ctx.fillStyle = visiblePort.ntscColorCss(visiblePort.COLORS.RED);
    ctx.fillRect(Math.floor(mx - 2), Math.floor(my - 4), 4, 8);
  }

  const fuelBarX = clamp(visiblePort.computeFuelDisplayBallValue(visiblePort.getField(memory, 'fuelHi')), 0, 159);
  const fuelX = Math.floor(xToCanvas(fuelBarX));
  ctx.fillStyle = visiblePort.ntscColorCss(visiblePort.COLORS.YELLOW);
  ctx.fillRect(fuelX - 3, Math.floor(jetY - 21), 6, 6);
}

function sectionLabel(sectionBlock) {
  return sectionBlock === 0 ? 'END' : String(visiblePort.GAME_CONSTANTS.SECTION_BLOCKS - sectionBlock + 1);
}

function drawCanvasHud() {
  const score = String(visiblePort.computeVisibleScore(memory)).padStart(6, '0');
  const fuelPct = Math.round(visiblePort.computeFuelPercent(memory));
  const lives = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.livesPtr.address);
  const section = sectionLabel(visiblePort.getField(memory, 'sectionBlock'));
  const fuelBarWidth = Math.max(0, Math.min(120, Math.round((fuelPct / 100) * 120)));

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, logicalWidth, 42);
  drawBlockText(score, 14, 13, { scale: 3, color: '#ffd166' });
  drawBlockText(`LIVES ${lives}`, 116, 13, { scale: 3, color: '#e8f0ff' });
  drawBlockText(`SEC ${section}`, 238, 13, { scale: 3, color: '#e8f0ff' });

  ctx.strokeStyle = '#e8f0ff';
  ctx.strokeRect(logicalWidth - 128, 12, 104, 18);
  ctx.fillStyle = fuelPct <= 25 ? '#ff6b6b' : '#5cc8ff';
  ctx.fillRect(logicalWidth - 127, 13, Math.round((fuelBarWidth / 120) * 102), 16);
  drawBlockText('FUEL', logicalWidth - 138, 15, { scale: 2, color: '#e8f0ff', align: 'right' });
  ctx.restore();
}

function drawCenteredText(lines, options = {}) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 10, 18, 0.78)';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line) => {
    if (line.scale) {
      drawBlockText(line.text, logicalWidth / 2, (logicalHeight / 2) + line.yOffset, {
        align: 'center',
        color: line.color ?? options.color ?? '#e8f0ff',
        scale: line.scale,
      });
      return;
    }
    ctx.font = line.font ?? options.font ?? '700 28px ui-monospace, monospace';
    ctx.fillStyle = line.color ?? options.color ?? '#e8f0ff';
    ctx.fillText(line.text, logicalWidth / 2, (logicalHeight / 2) + line.yOffset);
  });
  ctx.restore();
}

function drawTitleScreen() {
  ctx.fillStyle = '#06111d';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  ctx.fillStyle = '#0f5fa8';
  ctx.fillRect(logicalWidth * 0.24, 0, logicalWidth * 0.52, logicalHeight);
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(0, 0, logicalWidth * 0.24, logicalHeight);
  ctx.fillRect(logicalWidth * 0.76, 0, logicalWidth * 0.24, logicalHeight);
  drawCenteredText([
    { text: 'RIVER RAID', yOffset: -88, scale: 8, color: '#ffd166' },
    { text: 'VISIBLE HARNESS', yOffset: -28, scale: 4, color: '#e8f0ff' },
    { text: 'PRESS SPACE OR ENTER', yOffset: 34, scale: 3, color: '#5cc8ff' },
    { text: 'ARROWS WASD MOVE  SPACE Z FIRE', yOffset: 74, scale: 2, color: '#8fa6c1' },
  ]);
}

function drawGameOverScreen() {
  drawWorld();
  drawCanvasHud();
  const score = String(visiblePort.computeVisibleScore(memory)).padStart(6, '0');
  drawCenteredText([
    { text: 'GAME OVER', yOffset: -70, scale: 7, color: '#ff6b6b' },
    { text: `SCORE ${score}`, yOffset: -8, scale: 4, color: '#ffd166' },
    { text: 'PRESS SPACE OR ENTER', yOffset: 52, scale: 3, color: '#5cc8ff' },
  ]);
}

function renderHud() {
  const score = visiblePort.computeVisibleScore(memory);
  const fuelPct = Math.round(visiblePort.computeFuelPercent(memory));
  const sectionBlock = visiblePort.getField(memory, 'sectionBlock');
  const gameMode = visiblePort.getField(memory, 'gameMode');
  const frameCnt = visiblePort.getField(memory, 'frameCnt');
  const lives = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.livesPtr.address);
  const scroll = visiblePort.inspectVisibleRiverScrollState(memory);
  const lastStep = lastStepResult?.lastStep ?? null;
  const crashInfo = lastStep?.playerCrash
    ? ` · crash ${lastStep.playerCrashKind}`
    : lastStep?.fuelPickup
      ? ' · fuel pickup'
      : lastStep?.missileHit
        ? ` · hit ${lastStep.projectedMissileCollision?.shapeName ?? 'target'}`
        : '';
  scoreEl.textContent = String(score).padStart(6, '0');
  fuelEl.textContent = `${fuelPct}%`;
  livesEl.textContent = String(lives);
  sectionEl.textContent = sectionLabel(sectionBlock);
  statusEl.textContent = screenState === SCREEN_TITLE
    ? 'title'
    : screenState === SCREEN_GAME_OVER
      ? 'game over'
      : paused
        ? 'paused'
        : visiblePort.GAME_MODES.label(gameMode);
  debugEl.textContent = `lives ${lives} · frame ${frameCnt} · playerX ${visiblePort.getField(memory, 'playerX')} · seam ${scroll.seamDelta.fromShapeName ?? 'n/a'}→${scroll.seamDelta.toShapeName ?? 'n/a'}${crashInfo}`;
}

function render() {
  if (screenState === SCREEN_TITLE) drawTitleScreen();
  else if (screenState === SCREEN_GAME_OVER) drawGameOverScreen();
  else {
    drawWorld();
    drawCanvasHud();
  }
  renderHud();
}

function frame(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const delta = Math.min(100, timestamp - lastFrameTime);
  lastFrameTime = timestamp;
  if (!paused && screenState === SCREEN_PLAYING) {
    accumulatorMs += delta;
    while (accumulatorMs >= frameStepMs) {
      stepGame();
      accumulatorMs -= frameStepMs;
    }
  }
  render();
  window.requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (event.repeat && event.code === 'Space') return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  pressed.add(event.code);
  if (event.code === 'Space' || event.code === 'Enter') {
    if (screenState === SCREEN_TITLE || screenState === SCREEN_GAME_OVER) {
      startGame();
      return;
    }
  }
  if (event.code === 'Space' || event.code === 'KeyZ') {
    fireMissile();
  }
  if (event.code === 'KeyP' && screenState === SCREEN_PLAYING) {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
  }
  if (event.code === 'KeyR') {
    startGame();
  }
});

window.addEventListener('keyup', (event) => {
  pressed.delete(event.code);
});

pauseButton.addEventListener('click', () => {
  if (screenState !== SCREEN_PLAYING) return;
  paused = !paused;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
});

resetButton.addEventListener('click', () => {
  startGame();
  render();
});

resetToPlayableStart();
showTitle();
render();
window.requestAnimationFrame(frame);
