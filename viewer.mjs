import * as visiblePort from './riverraidVisiblePort.mjs?v=37';
import * as objectPort from './riverraid_port.js';
import { VERIFIED_ROM_INFO, VERIFIED_SPRITE_VARIANT_META, VERIFIED_PF_PATTERN_REFERENCE } from './riverraid_verified_sprite_meta.mjs?v=1';

const fuelHiInput = document.getElementById('fuelHi');
const fuelHiValue = document.getElementById('fuelHiValue');
const playerXInput = document.getElementById('playerX');
const missileXInput = document.getElementById('missileX');
const missileYInput = document.getElementById('missileY');
const joyByteInput = document.getElementById('joyByte');
const frameCntInput = document.getElementById('frameCnt');
const frameSpeedInput = document.getElementById('frameSpeed');
const prevFrameButton = document.getElementById('prevFrame');
const nextFrameButton = document.getElementById('nextFrame');
const autoFrameButton = document.getElementById('autoFrame');
const fireMissileButton = document.getElementById('fireMissile');
const applyResetButton = document.getElementById('applyReset');
const randomizeFuelButton = document.getElementById('randomizeFuel');
const clearSlotsButton = document.getElementById('clearSlots');
const summaryStats = document.getElementById('summaryStats');
const namedStateEl = document.getElementById('namedState');
const memoryDumpEl = document.getElementById('memoryDump');
const objectStateEl = document.getElementById('objectState');
const slotEditor = document.getElementById('slotEditor');
const slotDetailEl = document.getElementById('slotDetail');
const slotPreviewVizEl = document.getElementById('slotPreviewViz');
const playerJetVizEl = document.getElementById('playerJetViz');
const playerJetCompareVizEl = document.getElementById('playerJetCompareViz');
const spriteDecisionVizEl = document.getElementById('spriteDecisionViz');
const explosionFamilyVizEl = document.getElementById('explosionFamilyViz');
const pfPatternVizEl = document.getElementById('pfPatternViz');
const romCoverageVizEl = document.getElementById('romCoverageViz');
const provenanceVizEl = document.getElementById('provenanceViz');
const worldHoverVizEl = document.getElementById('worldHoverViz');
const worldLegend = document.getElementById('worldLegend');
const bandLegendEl = document.getElementById('bandLegend');
const worldRowVizEl = document.getElementById('worldRowViz');
const seamScrollVizEl = document.getElementById('seamScrollViz');
const compositeRowsVizEl = document.getElementById('compositeRowsViz');
const seamTimelineVizEl = document.getElementById('seamTimelineViz');
const prevWorldRowButton = document.getElementById('prevWorldRow');
const nextWorldRowButton = document.getElementById('nextWorldRow');
const jumpCurrentTailButton = document.getElementById('jumpCurrentTail');
const jumpNextHeadButton = document.getElementById('jumpNextHead');
const clearWorldPinButton = document.getElementById('clearWorldPin');
const hudCanvas = document.getElementById('hudCanvas');
const hudCtx = hudCanvas.getContext('2d');
const worldCanvas = document.getElementById('worldCanvas');
const worldCtx = worldCanvas.getContext('2d');
const paletteCanvas = document.getElementById('paletteCanvas');
const paletteCtx = paletteCanvas.getContext('2d');
const paletteLegend = document.getElementById('paletteLegend');
const mainLoopEntryEl = document.getElementById('mainLoopEntryViz');
const sectionCountdownEl = document.getElementById('sectionCountdownViz');
const sectionViz = document.getElementById('sectionViz');
const sectionStateEl = document.getElementById('sectionState');
const addressMapBody = document.getElementById('addressMapBody');
const flagEditorEl = document.getElementById('flagEditor');
const joystickVizEl = document.getElementById('joystickViz');
const missileVizEl = document.getElementById('missileViz');
const rngVizEl = document.getElementById('rngViz');
const diffPFVizEl = document.getElementById('diffPFViz');
const gameModeVizEl = document.getElementById('gameModeViz');
const colorInspectorEl = document.getElementById('colorInspector');
const soundVizEl = document.getElementById('soundViz');
const bridgeExploVizEl = document.getElementById('bridgeExploViz');
const missileStateVizEl = document.getElementById('missileStateViz');
const playerMoveVizEl = document.getElementById('playerMoveViz');
const pfcVizEl = document.getElementById('pfColorViz');
const shapePtrVizEl = document.getElementById('shapePtrViz');
const jetSpritePtrVizEl = document.getElementById('jetSpritePtrViz');
const pfPtrVizEl = document.getElementById('pfPtrViz');
const colorPtrVizEl = document.getElementById('colorPtrViz');
const savedRngVizEl = document.getElementById('savedRngViz');
const nusizDetailVizEl = document.getElementById('nusizDetailViz');
const sectionProgressVizEl = document.getElementById('sectionProgressViz');
const blockListVizEl = document.getElementById('blockListViz');
const frameCntVizEl = document.getElementById('frameCntViz');
const dxSpeedVizEl = document.getElementById('dxSpeedViz');
const scorePtrsVizEl = document.getElementById('scorePtrsViz');
const collisionVizEl = document.getElementById('collisionViz');
const scorePtr2AliasesVizEl = document.getElementById('scorePtr2AliasesViz');
const stateAreaVizEl = document.getElementById('stateAreaViz');
const sectionEndVizEl = document.getElementById('sectionEndViz');
const posYLoVizEl = document.getElementById('posYLoViz');
const prevPF1PatIdVizEl = document.getElementById('prevPF1PatIdViz');
const stateColorVizEl = document.getElementById('stateColorViz');
const playerColorVizEl = document.getElementById('playerColorViz');
const kernelLineNumVizEl = document.getElementById('kernelLineNumViz');
const saverStateVizEl = document.getElementById('saverStateViz');
const playerSwapVizEl = document.getElementById('playerSwapViz');
const resetSeqVizEl = document.getElementById('resetSeqViz');
const blockLineVizEl = document.getElementById('blockLineViz');
const fuelDisplayVizEl = document.getElementById('fuelDisplayViz');
const player2StateVizEl = document.getElementById('player2StateViz');
const pf1PatIdPageVizEl = document.getElementById('pf1PatIdPageViz');
const pf1PatIdVizEl = document.getElementById('pf1PatIdViz');
const player1StateVizEl = document.getElementById('player1StateViz');
const blockOffsetLineVizEl = document.getElementById('blockOffsetLineViz');
const rngSeedVizEl = document.getElementById('rngSeedViz');
const kernelTimingVizEl = document.getElementById('kernelTimingViz');
const pf1PageAddressVizEl = document.getElementById('pf1PageAddressViz');
const sectionBlockSeqVizEl = document.getElementById('sectionBlockSeqViz');

const memory = visiblePort.createZeroPageMemory();
visiblePort.applyVisibleResetLogic(memory);
visiblePort.setField(memory, 'fuelHi', Number(fuelHiInput.value));
visiblePort.setField(memory, 'playerX', Number(playerXInput.value));
visiblePort.setField(memory, 'missileX', Number(missileXInput.value));
visiblePort.setField(memory, 'missileY', Number(missileYInput.value));
visiblePort.setField(memory, 'joystick', Number(joyByteInput.value || 0));

const SLOT_COUNT = objectPort.NUM_BLOCKS;
const SLOT_NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
const SHAPE_OPTIONS = [
 ['0', 'Explosion0'],
 ['1', 'Explosion1'],
 ['2', 'Explosion2'],
 ['3', 'Explosion3'],
 ['4', 'Plane'],
 ['5', 'Heli0'],
 ['6', 'Heli1'],
 ['7', 'Ship'],
 ['8', 'Bridge'],
 ['9', 'House'],
 ['10', 'Fuel'],
];
const SHAPE_ID_BY_FAMILY = Object.fromEntries(SHAPE_OPTIONS.map(([value, label]) => [label, Number(value)]));
const FAMILY_BY_SHAPE_ID = Object.fromEntries(SHAPE_OPTIONS.map(([value, label]) => [Number(value), label]));

const slotModel = Array.from({ length: SLOT_COUNT }, (_, index) => ({
 blockLst: [
  objectPort.PF_COLOR_FLAG,
  objectPort.PF_ROAD_FLAG | objectPort.ENEMY_MOVE_FLAG,
  objectPort.PATROL_FLAG | objectPort.PF1_PAGE_FLAG,
  objectPort.PF_ROAD_FLAG | objectPort.PF2_PAGE_FLAG,
  objectPort.PF_COLLIDE_FLAG,
  objectPort.ENEMY_MOVE_FLAG | objectPort.PF_COLOR_FLAG,
 ][index],
 XPos1Lst: 18 + index * 22,
 State1Lst: [
  0x00,
  objectPort.DIRECTION_FLAG | 0x20 | objectPort.DOUBLE_SIZE,
  0x40 | objectPort.THREE_COPIES,
  0x70 | objectPort.TWO_COPIES,
  0x10,
  0x50 | objectPort.QUAD_SIZE,
 ][index],
 Shape1IdLst: [objectPort.ID_PLANE, objectPort.ID_HELI0, objectPort.ID_SHIP, objectPort.ID_BRIDGE, objectPort.ID_HOUSE, objectPort.ID_FUEL][index],
 PF1Lst: 0x20 + index * 3,
 PF2Lst: 0x60 + index * 5,
}));

let selectedSlotIndex = 0;
let hoveredSlotIndex = -1;
let hoveredWorldRowKey = '';
let worldHoverPinned = false;
let pinnedWorldHover = { rowKey: '', slotIndex: -1, clientX: 0, clientY: 0 };
let lastWorldRenderRows = [];
let rngExCycleCount = 0;
let colorInspectorValue = 0x00;
let frameTimer = null;
let seamTimelineHorizon = 8;
let selectedTimelineStep = 0;
let timelineFilterMode = 'all';
let timelineSelectionMeta = { step: 0, source: 'initial sample' };
let pendingTimelineSpotlightStep = null;
let pendingTimelineRevealMode = '';
let timelineRevealSequenceId = 0;

function clampFrameSpeed(value) {
 return Math.max(50, Math.min(2000, Number(value) || 250));
}

function clampByte(value) {
 return Math.max(0, Math.min(255, Number(value) || 0)) & 0xff;
}

function clampPlayfieldX(value) {
 return Math.max(0, Math.min(159, Number(value) || 0));
}

function clampPlayerXToVisibleRiverBounds(requestedPlayerX) {
 const rawPlayerX = clampPlayfieldX(requestedPlayerX);
 const riverBounds = visiblePort.inspectVisibleJetRiverBounds(memory, { playerX: rawPlayerX });
 return {
  requestedPlayerX: rawPlayerX,
  riverBounds,
  playerX: riverBounds.clampedPlayerX,
  wasClamped: riverBounds.clampedPlayerX !== rawPlayerX,
 };
}

function syncInputsFromMemory() {
 fuelHiInput.value = String(clampByte(visiblePort.getField(memory, 'fuelHi')));
 playerXInput.value = String(clampPlayfieldX(visiblePort.getField(memory, 'playerX')));
 missileXInput.value = String(clampPlayfieldX(visiblePort.getField(memory, 'missileX')));
 missileYInput.value = String(clampByte(visiblePort.getField(memory, 'missileY')));
 joyByteInput.value = String(clampByte(visiblePort.getField(memory, 'joystick')));
 frameCntInput.value = String(clampByte(visiblePort.getField(memory, 'frameCnt')));
}

function stepGameplayLoop(steps = 1) {
 visiblePort.stepVisibleGameplayLoop(memory, { steps });
 syncSlotModelFromMemory();
 syncInputsFromMemory();
 syncView();
}

function fireMissile() {
 visiblePort.fireVisibleMissile(memory);
 syncInputsFromMemory();
 syncView();
}

function toHex(value, width = 2) {
 return `0x${(value >>> 0).toString(16).toUpperCase().padStart(width, '0')}`;
}

function normalize(value) {
 if (value instanceof Uint8Array) return Array.from(value);
 if (Array.isArray(value)) return value.map(normalize);
 if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, normalize(inner)]));
 return value;
}

function dumpMemory(mem) {
 const lines = [];
 for (let base = 0x80; base <= 0xF0; base += 0x10) {
  const bytes = [];
  for (let offset = 0; offset < 0x10; offset += 1) {
   bytes.push((mem[base + offset] ?? 0).toString(16).toUpperCase().padStart(2, '0'));
  }
  lines.push(`${toHex(base)}: ${bytes.join(' ')}`);
 }
 return lines.join('\n');
}

function renderStats(stats) {
 summaryStats.innerHTML = '';
 for (const [key, value] of Object.entries(stats)) {
  const card = document.createElement('div');
  card.className = 'stat';
  const k = document.createElement('div');
  k.className = 'k';
  k.textContent = key;
  const v = document.createElement('div');
  v.className = 'v';
  v.textContent = typeof value === 'number' ? `${value} (${toHex(value)})` : String(value);
  card.append(k, v);
  summaryStats.appendChild(card);
 }
}

// ─── NTSC COLOR PALETTE ───────────────────────────────────────────────────

function drawPalette() {
 const w = paletteCanvas.width;
 const h = paletteCanvas.height;
 paletteCtx.clearRect(0, 0, w, h);
 paletteCtx.fillStyle = '#0a1022';
 paletteCtx.fillRect(0, 0, w, h);
 const hues = 8, lums = 8;
 const cellW = (w - 20) / lums, cellH = (h - 40) / hues;
 const ox = 10, oy = 10;
 for (let hue = 0; hue < hues; hue++) {
  for (let li = 0; li < lums; li++) {
   const lum = (li * 2) + 2;
   const colorByte = (hue << 5) | lum;
   paletteCtx.fillStyle = visiblePort.ntscColorCss(colorByte);
   paletteCtx.fillRect(ox + li * cellW, oy + hue * cellH, cellW - 1, cellH - 1);
  }
 }
 paletteCtx.fillStyle = '#e8ecff';
 paletteCtx.font = '9px ui-monospace, monospace';
 for (let li = 0; li < lums; li++) {
  paletteCtx.fillText(`L${(li * 2) + 2}`, ox + li * cellW + 2, oy + hues * cellH + 12);
 }
 for (let hue = 0; hue < hues; hue++) {
  paletteCtx.fillText(visiblePort.NTSC_HUE_NAMES[hue].slice(0, 4), ox + lums * cellW + 4, oy + hue * cellH + 12);
 }
 const excerptColors = [
  ['BLACK', visiblePort.COLORS.BLACK], ['GREY', visiblePort.COLORS.GREY],
  ['ORANGE', visiblePort.COLORS.ORANGE], ['YELLOW', visiblePort.COLORS.YELLOW],
  ['RED', visiblePort.COLORS.RED], ['BLUE', visiblePort.COLORS.BLUE],
  ['CYAN', visiblePort.COLORS.CYAN], ['GREEN', visiblePort.COLORS.GREEN],
 ];
 const derivedColors = [
  ['DARK_RED', visiblePort.DERIVED_COLORS.DARK_RED],
  ['LIGHT_GREEN', visiblePort.DERIVED_COLORS.LIGHT_GREEN],
  ['BROWN', visiblePort.DERIVED_COLORS.BROWN],
  ['LIGHT_GREY', visiblePort.DERIVED_COLORS.LIGHT_GREY],
  ['DARK_BLUE', visiblePort.DERIVED_COLORS.DARK_BLUE],
 ];
 paletteLegend.innerHTML = excerptColors.map(([name, val]) =>
  `<span class="color-swatch" style="background:${visiblePort.ntscColorCss(val)}"></span><span class="mono">${name}=${toHex(val)}</span>`
 ).join(' &nbsp; ') + '<br>' + derivedColors.map(([name, val]) =>
  `<span class="color-swatch" style="background:${visiblePort.ntscColorCss(val)}"></span><span class="mono">${name}=${toHex(val)}</span>`
 ).join(' &nbsp; ');
}

function drawHudPreview(fuelHi, fuelBallX, fuel16) {
 const scale = 4, logicalWidth = 160, y = 108;
 hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
 hudCtx.fillStyle = '#07101e'; hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
 hudCtx.fillStyle = '#144b9a'; hudCtx.fillRect(0, 0, hudCanvas.width, 70);
 hudCtx.fillStyle = '#1f7032'; hudCtx.fillRect(0, 70, hudCanvas.width, 50);
 hudCtx.fillStyle = '#2b204d'; hudCtx.fillRect(0, 120, hudCanvas.width, 60);
 hudCtx.strokeStyle = '#8fb6ff'; hudCtx.lineWidth = 2;
 hudCtx.strokeRect(20, y - 16, logicalWidth * scale, 20);
 for (let x = 0; x <= logicalWidth; x += 8) {
  hudCtx.strokeStyle = x % 32 === 0 ? '#38538f' : '#243764';
  hudCtx.beginPath(); hudCtx.moveTo(20 + x * scale, y - 20); hudCtx.lineTo(20 + x * scale, y + 10); hudCtx.stroke();
 }
 hudCtx.fillStyle = '#ffd166';
 hudCtx.beginPath(); hudCtx.arc(20 + fuelBallX * scale, y - 6, 8, 0, Math.PI * 2); hudCtx.fill();
 hudCtx.fillStyle = '#ffffff'; hudCtx.font = '15px ui-monospace, monospace';
 hudCtx.fillText(`fuelHi = ${fuelHi} (${toHex(fuelHi)})`, 20, 145);
 hudCtx.fillText(`ballX = (fuelHi>>3)+69 = ${fuelBallX} (${toHex(fuelBallX)})`, 20, 166);
 hudCtx.fillStyle = visiblePort.ntscColorCss(visiblePort.COLORS.YELLOW);
 hudCtx.fillRect(20, 170, 18, 12);
 hudCtx.fillStyle = '#9dacd6'; hudCtx.font = '12px ui-monospace, monospace';
 hudCtx.fillText(`YELLOW=${toHex(visiblePort.COLORS.YELLOW)}`, 44, 180);
 hudCtx.fillText(`fuel16 = ${fuel16}`, 20, 20);
}

function shapeColor(id) {
 const p = {
  [objectPort.ID_EXPLOSION0]: '#f25f5c', [objectPort.ID_EXPLOSION1]: '#f28482',
  [objectPort.ID_EXPLOSION2]: '#f6bd60', [objectPort.ID_EXPLOSION3]: '#f7ede2',
  [objectPort.ID_PLANE]: '#59c3c3', [objectPort.ID_HELI0]: '#8bd450',
  [objectPort.ID_HELI1]: '#4ecdc4', [objectPort.ID_SHIP]: '#4d96ff',
  [objectPort.ID_BRIDGE]: '#c9a66b', [objectPort.ID_HOUSE]: '#ff8fab',
  [objectPort.ID_FUEL]: '#ffd166',
 };
 return p[id] ?? '#cccccc';
}

const SPRITE_VARIANTS = {
 Explosion0: [
  { name: 'Explosion0', bitmap: ['00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000'] },
 ],
 Explosion1: [
  { name: 'Explosion1A', bitmap: ['00000000','00000000','00000000','00000000','00000100','00000010','00001000','00000100','00000000'] },
  { name: 'Explosion1B', bitmap: ['00000000','00000000','00000000','00000000','00010000','00100000','01000000','00010000'] },
 ],
 Explosion2: [
  { name: 'Explosion2A', bitmap: ['00000000','00000000','00000000','00000100','10001000','00010000','00000100','10000000','00010000','00000000','00000000'] },
  { name: 'Explosion2B', bitmap: ['00000000','00000000','00000000','00100000','00000010','01000001','00100000','00000010','00000100'] },
 ],
 Plane: [
  { name: 'PlaneA', bitmap: ['00000000','00000000','00000000','00000000','00000000','00110000','01001111','11000110','00000000'] },
  { name: 'PlaneB', bitmap: ['00000000','00000000','00000000','00000000','00000000','00111000','11111111','10000000'] },
 ],
 Heli0: [
  { name: 'Heli0A', bitmap: ['00000000','00000000','00000000','00000000','00000100','11111111','10011111','00000100','00000111'] },
  { name: 'Heli0B', bitmap: ['00000000','00000000','00000000','00001110','10001110','11111111','00001110','00011100'] },
 ],
 Heli1: [
  { name: 'Heli1A', bitmap: ['00000000','00000000','00000000','00000000','00000100','11111111','10011111','00000100','00011100'] },
  { name: 'Heli1B', bitmap: ['00000000','00000000','00000000','00001110','10001110','11111111','00001110','00000111'] },
 ],
 Ship: [
  { name: 'ShipA', bitmap: ['00000000','00000000','00000000','01111100','11111110','01111000','00010000'] },
  { name: 'ShipB', bitmap: ['00000000','00000000','00000000','11111100','11111111','00110000','00010000'] },
 ],
 Bridge: [
  { name: 'BridgeA', bitmap: ['01000010'] },
  { name: 'BridgeB', bitmap: ['11111111','11111111','11111111','11111111','11111111','11111111','11111111','11111111','11111111','11111111','01000010'] },
 ],
 House: [
  { name: 'HouseA', bitmap: ['00000000','00000100','00001110','00011111','00001110','00000100','00000000','11111110','10101010','11111110','00111000','00000000','00000000','00000000'] },
  { name: 'HouseB', bitmap: ['00000000','00000100','00011111','00001110','00000100','00000100','00000000','10101010','11111110','01111100','00000000'] },
 ],
 Fuel: [
  { name: 'FuelA', bitmap: ['11111110','11011110','11011110','11111110','11011110','11011110','11111110','11010110','11010110','11011110','11001110'] },
  { name: 'FuelB', bitmap: ['11000110','11011110','11011110','11000110','11001110','11000110','11000110','11010110','11111110','11011110','11011110','01111100'] },
 ],
};

const SHAPE_FAMILY_OVERRIDES = {
 Explosion3: 'Explosion1',
};

const PLAYER_JET_VARIANTS = {
 Straight: ['00000000','00000000','00000000','00000000','00000000','00101010','00111110','00011100','00001000','01001001','01101011','01111111','01111111','00111110','00011100','00001000','00001000','00001000'],
 Move: ['00000000','00000000','00000000','00000000','00000010','00101110','00111100','00011000','00001000','00001010','00101110','00111110','00111110','00111100','00011000','00001000','00001000','00001000'],
 Explode: ['00000000','00000000','00000000','00000000','00000000','00000010','00001000','00010000','00000000','01000000','00001000','00100001','01000100','00010000','00000100','00001000','00000000'],
};

const SPRITE_BITMAPS = {
 [objectPort.ID_EXPLOSION0]: SPRITE_VARIANTS.Explosion0[0].bitmap,
 [objectPort.ID_EXPLOSION1]: SPRITE_VARIANTS.Explosion1[0].bitmap,
 [objectPort.ID_EXPLOSION2]: SPRITE_VARIANTS.Explosion2[0].bitmap,
 [objectPort.ID_EXPLOSION3]: SPRITE_VARIANTS.Explosion1[0].bitmap,
 [objectPort.ID_PLANE]: SPRITE_VARIANTS.Plane[0].bitmap,
 [objectPort.ID_HELI0]: SPRITE_VARIANTS.Heli0[0].bitmap,
 [objectPort.ID_HELI1]: SPRITE_VARIANTS.Heli1[0].bitmap,
 [objectPort.ID_SHIP]: SPRITE_VARIANTS.Ship[0].bitmap,
 [objectPort.ID_BRIDGE]: SPRITE_VARIANTS.Bridge[1].bitmap,
 [objectPort.ID_HOUSE]: SPRITE_VARIANTS.House[0].bitmap,
 [objectPort.ID_FUEL]: SPRITE_VARIANTS.Fuel[0].bitmap,
};

function resolveSpriteVariant(shapeName, frameCnt = 0) {
 const familyName = SHAPE_FAMILY_OVERRIDES[shapeName] ?? shapeName;
 const variants = SPRITE_VARIANTS[familyName];
 if (!variants?.length) return { familyName, variantName: shapeName, variantIndex: 0, variantCount: 0, bitmap: null };
 const variantIndex = variants.length <= 1 ? 0 : (frameCnt & 1) % variants.length;
 const variant = variants[variantIndex];
 return {
  familyName,
  variantName: variant.name,
  variantIndex,
  variantCount: variants.length,
  bitmap: variant.bitmap,
 };
}

function resolveSlotSprite(slot, frameCnt = 0) {
 return resolveSpriteVariant(slot.shapeName ?? visiblePort.shapeNameFromId(slot.shapeId), frameCnt);
}

function resolvePlayerJetSprite(frameCnt = 0, gameMode = 0) {
 const gameModeState = visiblePort.inspectGameModeState(memory);
 if (!gameModeState.isRunning) {
  return (frameCnt & 1)
   ? { name: 'JetMove', bitmap: PLAYER_JET_VARIANTS.Move }
   : { name: 'JetStraight', bitmap: PLAYER_JET_VARIANTS.Straight };
 }
 return (frameCnt & 1)
  ? { name: 'JetMove', bitmap: PLAYER_JET_VARIANTS.Move }
  : { name: 'JetStraight', bitmap: PLAYER_JET_VARIANTS.Straight };
}

function renderBitmapChip(bitmap, { pixelSize = 4, color = '#74f0b8' } = {}) {
 if (!bitmap?.length) return '<span class="tiny">no bitmap</span>';
 const rows = bitmap.map(bits => {
  const cells = bits.split('').map(bit => `<span class="bitmap-pixel${bit === '1' ? ' on' : ''}"></span>`).join('');
  return `<div class="bitmap-row" style="grid-template-columns:repeat(${bits.length}, var(--px, ${pixelSize}px))">${cells}</div>`;
 }).join('');
 return `<div class="bitmap-chip" style="--px:${pixelSize}px;--on:${color}">${rows}</div>`;
}

function describeFrameParity(frameCnt = 0) {
 return (frameCnt & 1) ? 'odd/B' : 'even/A';
}

function parityBadgeHtml(frameCnt = 0) {
 const odd = !!(frameCnt & 1);
 return `<span class="parity-badge${odd ? ' odd' : ''}">${describeFrameParity(frameCnt)}</span>`;
}

function bitmapRowsText(bitmap) {
 return Array.isArray(bitmap) ? bitmap.join('\n') : '';
}

function familyAccentColor(familyName = '') {
 const palette = {
  Plane: '#5cc8ff',
  Heli0: '#74f0b8',
  Heli1: '#4ecdc4',
  Ship: '#7fb3ff',
  Bridge: '#d9b36c',
  House: '#ff9bc2',
  Fuel: '#ffd166',
  Explosion0: '#f25f5c',
  Explosion1: '#f28482',
  Explosion2: '#f6bd60',
  Explosion3: '#f7ede2',
 };
 return palette[familyName] || '#8fb6ff';
}

function shapeClassUiLabel(shapeClass = '') {
 const labels = {
  explosion: 'shape-class: explosion',
  'shape-air': 'shape-class: air',
  'shape-water': 'shape-class: water',
  'shape-structure': 'shape-class: structure',
  'shape-fuel': 'shape-class: fuel',
  unknown: 'shape-class: unknown',
 };
 return labels[shapeClass] || `shape-class: ${shapeClass}`;
}

function shapeClassCompactLabel(shapeClass = '') {
 const labels = {
  explosion: 'explosion',
  'shape-air': 'air',
  'shape-water': 'water',
  'shape-structure': 'structure',
  'shape-fuel': 'fuel',
  unknown: 'unknown',
 };
 return labels[shapeClass] || shapeClass || 'unknown';
}

function formatShapeClassTransition(fromShapeClass, toShapeClass) {
 return `${shapeClassCompactLabel(fromShapeClass)} → ${shapeClassCompactLabel(toShapeClass)}`;
}

function formatTransitionCountMap(countMap = {}) {
 const entries = Object.entries(countMap || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
 if (!entries.length) return 'none';
 return entries.map(([key, count]) => {
  const [fromShapeClass, toShapeClass] = String(key || 'unknown->unknown').split('->');
  return `${formatShapeClassTransition(fromShapeClass, toShapeClass)} (${count})`;
 }).join(' · ');
}

function buildFamilyTransitionDiagnostics(timeline, selectedChangeEvent = null, selectedWrapEvent = null) {
 const changeEvents = Array.isArray(timeline?.nextHeadChangeEvents) ? timeline.nextHeadChangeEvents : [];
 const wrapEvents = Array.isArray(timeline?.wrapEvents) ? timeline.wrapEvents : [];
 const diagnostics = new Map();
 const minDefined = (...values) => {
  const filtered = values.filter(Number.isFinite);
  return filtered.length ? Math.min(...filtered) : null;
 };
 const maxDefined = (...values) => {
  const filtered = values.filter(Number.isFinite);
  return filtered.length ? Math.max(...filtered) : null;
 };
 const ensureEntry = (transitionKey, fromShapeClass, toShapeClass) => {
  const normalizedKey = String(transitionKey || `${fromShapeClass ?? 'unknown'}->${toShapeClass ?? 'unknown'}` || 'unknown->unknown');
  if (!diagnostics.has(normalizedKey)) {
   diagnostics.set(normalizedKey, {
    transitionKey: normalizedKey,
    fromShapeClass: fromShapeClass ?? normalizedKey.split('->')[0] ?? 'unknown',
    toShapeClass: toShapeClass ?? normalizedKey.split('->')[1] ?? 'unknown',
    transitionLabel: formatShapeClassTransition(fromShapeClass ?? normalizedKey.split('->')[0], toShapeClass ?? normalizedKey.split('->')[1]),
    familyCrossing: (fromShapeClass ?? normalizedKey.split('->')[0] ?? 'unknown') !== (toShapeClass ?? normalizedKey.split('->')[1] ?? 'unknown'),
    changeCount: 0,
    wrapCount: 0,
    seamChangedChangeCount: 0,
    seamChangedWrapCount: 0,
    changeSteps: [],
    wrapPreviewSteps: [],
    exampleChangeLabels: [],
    exampleWrapLabels: [],
    selectedChange: false,
    selectedWrap: false,
   });
  }
  return diagnostics.get(normalizedKey);
 };
 for (const event of changeEvents) {
  const entry = ensureEntry(event.familyTransitionKey, event.previousShapeClass, event.currentShapeClass);
  entry.changeCount += 1;
  if (event.seamSignatureChanged) entry.seamChangedChangeCount += 1;
  entry.changeSteps.push(event.step);
  entry.exampleChangeLabels.push(`${event.previousSlotLabel ?? 'n/a'} ${event.previousShapeName ?? 'n/a'} → ${event.currentSlotLabel ?? 'n/a'} ${event.currentShapeName ?? 'n/a'}`);
  if (selectedChangeEvent && event.step === selectedChangeEvent.step && event.fromStep === selectedChangeEvent.fromStep) entry.selectedChange = true;
 }
 for (const event of wrapEvents) {
  const entry = ensureEntry(event.familyTransitionKey, event.previousShapeClass, event.currentShapeClass);
  entry.wrapCount += 1;
  if (event.seamChangedAcrossWrap) entry.seamChangedWrapCount += 1;
  entry.wrapPreviewSteps.push(event.previewStep);
  entry.exampleWrapLabels.push(`${event.beforeSample?.nextHeadSlot?.slotLabel ?? 'n/a'} ${event.beforeSample?.nextHeadSlot?.shapeName ?? 'n/a'} → ${event.afterSample?.nextHeadSlot?.slotLabel ?? 'n/a'} ${event.afterSample?.nextHeadSlot?.shapeName ?? 'n/a'}`);
  if (selectedWrapEvent && event.previewStep === selectedWrapEvent.previewStep) entry.selectedWrap = true;
 }
 return Array.from(diagnostics.values()).map(entry => ({
  ...entry,
  changeStepRange: entry.changeSteps.length ? { min: Math.min(...entry.changeSteps), max: Math.max(...entry.changeSteps) } : { min: null, max: null },
  wrapPreviewRange: entry.wrapPreviewSteps.length ? { min: Math.min(...entry.wrapPreviewSteps), max: Math.max(...entry.wrapPreviewSteps) } : { min: null, max: null },
  firstChangeStep: entry.changeSteps.length ? Math.min(...entry.changeSteps) : null,
  firstWrapPreviewStep: entry.wrapPreviewSteps.length ? Math.min(...entry.wrapPreviewSteps) : null,
  firstEvidenceStep: minDefined(entry.changeSteps.length ? Math.min(...entry.changeSteps) : null, entry.wrapPreviewSteps.length ? Math.min(...entry.wrapPreviewSteps) : null),
  lastEvidenceStep: maxDefined(entry.changeSteps.length ? Math.max(...entry.changeSteps) : null, entry.wrapPreviewSteps.length ? Math.max(...entry.wrapPreviewSteps) : null),
  totalEvidenceCount: entry.changeCount + entry.wrapCount,
  dominantEvidenceKind: entry.changeCount && entry.wrapCount ? 'mixed' : entry.changeCount ? 'change-only' : entry.wrapCount ? 'wrap-only' : 'none',
  selectedKind: entry.selectedChange ? 'change' : entry.selectedWrap ? 'wrap' : 'none',
  exampleChangeLabel: entry.exampleChangeLabels[0] ?? '',
  exampleWrapLabel: entry.exampleWrapLabels[0] ?? '',
 })).sort((a, b) => {
  const activityDelta = (b.changeCount + b.wrapCount) - (a.changeCount + a.wrapCount);
  if (activityDelta !== 0) return activityDelta;
  if (a.familyCrossing !== b.familyCrossing) return Number(b.familyCrossing) - Number(a.familyCrossing);
  return a.transitionKey.localeCompare(b.transitionKey);
 });
}

function escapeHtml(text = '') {
 return String(text)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
}

const SPRITE_VARIANT_META = VERIFIED_SPRITE_VARIANT_META;

const PF_PATTERN_REFERENCE = VERIFIED_PF_PATTERN_REFERENCE;

function variantTooltip(name, familyName = '') {
 const meta = SPRITE_VARIANT_META[name] || {};
 const parts = [name];
 if (familyName) parts.push(`ROM family=${familyName}`);
 if (meta.romOffset) parts.push(`rom=${meta.romOffset}`);
 if (meta.cpuAddr) parts.push(`cpu=${meta.cpuAddr}`);
 if (meta.sourceLine) parts.push(`asm line ${meta.sourceLine}`);
 if (Number.isFinite(meta.matchCount)) parts.push(`matches=${meta.matchCount}`);
 if (Array.isArray(meta.allMatches) && meta.allMatches.length > 1) {
  const candidates = meta.allMatches.map(match => `${match.cpuAddr} ${match.romOffset}`).join(', ');
  parts.push(`candidates=${candidates}`);
 }
 return parts.join(' · ');
}

function spriteMatchSummary(meta = {}) {
 if (!Number.isFinite(meta.matchCount)) return '';
 if (!Array.isArray(meta.allMatches) || meta.allMatches.length <= 1) {
  return meta.matchCount === 1 ? 'verified unique ROM hit' : `matches ${meta.matchCount}`;
 }
 return `candidates ${meta.allMatches.map(match => `${match.cpuAddr}/${match.romOffset}`).join(', ')}`;
}

function parseHexAddress(text) {
 if (!text) return null;
 return Number.parseInt(String(text).replace(/^[^0-9A-Fa-f]*/, ''), 16);
}

function lowByte(value) {
 return Number.isFinite(value) ? (value & 0xff) : null;
}

function exactPFPatternMatches(bytes = []) {
 const refs = Object.entries(PF_PATTERN_REFERENCE).map(([name, item]) => ({
  name,
  title: item.title,
  cpuValue: parseHexAddress(item.cpuAddr),
  low: lowByte(parseHexAddress(item.cpuAddr)),
  romOffset: item.romOffset,
  cpuAddr: item.cpuAddr,
  bitmap: item.bitmap,
 }));
 return bytes.map(entry => ({
  ...entry,
  matches: refs.filter(ref => ref.low === lowByte(entry.value)),
 }));
}

function setSelectedSlotFamilyAndParity(familyName, variantIndex = 0) {
 const slot = slotModel[selectedSlotIndex];
 if (!slot) return;
 const shapeId = SHAPE_ID_BY_FAMILY[familyName];
 if (Number.isFinite(shapeId)) slot.Shape1IdLst = shapeId;
 const nextFrame = (clampByte(frameCntInput.value) & 0xfe) | (variantIndex ? 1 : 0);
 frameCntInput.value = String(nextFrame);
 syncView();
}

function metaChipsHtml(parts = []) {
 return `<div class="meta-chip-row">${parts.filter(Boolean).map(part => `<span class="meta-chip${part.warn ? ' warn' : ''}">${escapeHtml(part.text)}</span>`).join('')}</div>`;
}

function renderROMCoverageViz() {
 if (!romCoverageVizEl) return;
 const metaValues = Object.values(SPRITE_VARIANT_META);
 const withRom = metaValues.filter(v => v?.romOffset).length;
 const withCpu = metaValues.filter(v => v?.cpuAddr).length;
 const withLine = metaValues.filter(v => v?.sourceLine).length;
 const pfCount = Object.keys(PF_PATTERN_REFERENCE).length;
 const spriteVariantCount = Object.keys(SPRITE_VARIANT_META).length;
 romCoverageVizEl.innerHTML = `<div class="coverage-grid">
  <div class="coverage-stat"><div class="tiny">sprite variants tracked</div><div class="mono" style="font-size:20px">${spriteVariantCount}</div><div class="tiny">P0 jet + slot-shape + explosion refs</div></div>
  <div class="coverage-stat"><div class="tiny">with ROM offsets</div><div class="mono" style="font-size:20px">${withRom}</div><div class="tiny">direct raw-offset citations wired</div></div>
  <div class="coverage-stat"><div class="tiny">with CPU addresses</div><div class="mono" style="font-size:20px">${withCpu}</div><div class="tiny">audit-friendly CPU address labels</div></div>
  <div class="coverage-stat"><div class="tiny">with asm source lines</div><div class="mono" style="font-size:20px">${withLine}</div><div class="tiny">line-level extraction provenance</div></div>
  <div class="coverage-stat"><div class="tiny">PF references</div><div class="mono" style="font-size:20px">${pfCount}</div><div class="tiny">PFPat8..PFPat12 reference cards extracted</div></div>
 </div>`;
}

function renderProvenanceViz() {
 if (!provenanceVizEl) return;
 const rows = [
  {
   label: 'SPRITE_VARIANT_META',
   source: './riverraid_verified_sprite_meta.mjs + riverraid_attached_rom_sprite_report.json',
   backs: 'selected slot preview, compare cards, world tooltip, coverage panel',
   proof: `${Object.keys(SPRITE_VARIANT_META).length} variants · sha256 ${VERIFIED_ROM_INFO.sha256.slice(0, 12)}…` },
  {
   label: 'PF_PATTERN_REFERENCE',
   source: VERIFIED_ROM_INFO.pfReportPath,
   backs: 'PF reference panel, exact low-byte live hints',
   proof: `${Object.keys(PF_PATTERN_REFERENCE).length} PF cards` },
  {
   label: 'PLAYER_JET_VARIANTS',
   source: 'viewer.mjs inline ROM-backed jet bitmaps',
   backs: 'P0 jet bitmap live preview + A/B compare',
   proof: `${Object.keys(PLAYER_JET_VARIANTS).length} P0 jet bitmap states` },
  {
   label: 'visiblePort inspectors',
   source: './riverraidVisiblePort.mjs runtime decode',
   backs: 'slot selection, address lookups, PF live bytes, section state',
   proof: 'live zero-page decode' },
 ];
 provenanceVizEl.innerHTML = `${rows.map(row => `<div class="coverage-stat" style="margin-bottom:8px"><div class="mono">${row.label}</div><div class="tiny" style="margin-top:4px">source: ${escapeHtml(row.source)}</div><div class="tiny">backs: ${escapeHtml(row.backs)}</div><div class="tiny">proof: ${escapeHtml(row.proof)}</div></div>`).join('')}<div class="tiny">All provenance labels here are viewer-facing references only; they do not claim any renderer path is ROM-perfect unless a verified mapping is already wired.</div>`;
}

function clearPinnedWorldHover() {
 worldHoverPinned = false;
 pinnedWorldHover = { rowKey: '', slotIndex: -1, clientX: 0, clientY: 0 };
 if (worldHoverVizEl) {
  worldHoverVizEl.hidden = true;
  worldHoverVizEl.classList.remove('pinned');
 }
}

function findWorldRenderRowByCanvasY(canvasY) {
 return lastWorldRenderRows.find(row => canvasY >= row.yTop && canvasY < row.yBottom) ?? null;
}

function buildWorldRenderRows(inspectedSlots) {
 const mainH = Math.floor(worldCanvas.height * 160 / 192);
 const riverScroll = visiblePort.inspectVisibleRiverScrollState(memory);
 const slices = riverScroll.compositeSlices;
 const logicalYToCanvas = line => (line / visiblePort.GAME_CONSTANTS.NUM_LINES) * mainH;
 const rows = slices.map((slice, index) => {
  const lineTop = (index * riverScroll.sliceLineSpan) - riverScroll.pixelOffset;
  const lineBottom = ((index + 1) * riverScroll.sliceLineSpan) - riverScroll.pixelOffset;
  const projectedSlot = slice.projectedSlot ?? inspectedSlots[slice.slotIndex % inspectedSlots.length] ?? null;
  return {
   ...slice,
   rowKey: `${slice.source}-${slice.slotIndex}-${slice.compositeIndex}`,
   slotIndexWrapped: slice.slotIndex % inspectedSlots.length,
   projectedSlot,
   yTop: Math.floor(logicalYToCanvas(lineTop)),
   yBottom: Math.floor(logicalYToCanvas(lineBottom)),
  };
 }).filter(row => row.yBottom > 0 && row.yTop < mainH);
 lastWorldRenderRows = rows;
 return { rows, riverScroll, mainH };
}

function findWorldRenderRowByKey(rowKey) {
 return lastWorldRenderRows.find(row => row.rowKey === rowKey) ?? null;
}

function getSelectedWorldRow() {
 if (worldHoverPinned && pinnedWorldHover.rowKey) {
  return findWorldRenderRowByKey(pinnedWorldHover.rowKey) ?? null;
 }
 return lastWorldRenderRows.find(row => row.projectedSlot?.slotIndex === selectedSlotIndex && row.source === 'current')
  ?? lastWorldRenderRows.find(row => row.projectedSlot?.slotIndex === selectedSlotIndex)
  ?? lastWorldRenderRows[0]
  ?? null;
}

function selectWorldRow(row, options = {}) {
 if (!row) return;
 const rect = worldCanvas.getBoundingClientRect();
 const clientX = rect.left + Math.min(rect.width - 16, Math.max(16, rect.width * 0.75));
 const clientY = rect.top + ((row.yTop + row.yBottom) / 2 / worldCanvas.height) * rect.height;
 selectedSlotIndex = row.projectedSlot?.slotIndex ?? selectedSlotIndex;
 updateWorldHoverTooltip(row.projectedSlot ?? null, { clientX, clientY }, { pinned: options.pinned !== false, rowMeta: row });
 if (options.sync !== false) syncView();
}

function selectWorldRowByKey(rowKey, options = {}) {
 const row = findWorldRenderRowByKey(rowKey);
 if (!row) return;
 selectWorldRow(row, options);
}

function selectWorldRowByOffset(delta) {
 const rows = lastWorldRenderRows;
 if (!rows.length) return;
 const current = getSelectedWorldRow();
 const currentIndex = current ? rows.findIndex(row => row.rowKey === current.rowKey) : 0;
 const baseIndex = currentIndex >= 0 ? currentIndex : 0;
 const nextIndex = Math.max(0, Math.min(rows.length - 1, baseIndex + delta));
 selectWorldRow(rows[nextIndex]);
}

function updateWorldHoverTooltip(slot, event, options = {}) {
 if (!worldHoverVizEl) return;
 if (!slot || !event) {
  if (!worldHoverPinned) {
   worldHoverVizEl.hidden = true;
   worldHoverVizEl.classList.remove('pinned');
  }
  return;
 }
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const resolved = resolveSlotSprite(slot, frameCnt);
 const meta = SPRITE_VARIANT_META[resolved.variantName] || {};
 const rowMeta = options.rowMeta ?? slot.worldRowMeta ?? null;
 const rect = worldCanvas.getBoundingClientRect();
 const left = Math.min(rect.width - 220, Math.max(8, event.clientX - rect.left + 12));
 const top = Math.min(rect.height - 110, Math.max(8, event.clientY - rect.top + 12));
 if (options.pinned) {
  worldHoverPinned = true;
  pinnedWorldHover = {
   rowKey: rowMeta?.rowKey ?? '',
   slotIndex: slot.slotIndex,
   clientX: event.clientX,
   clientY: event.clientY,
  };
 }
 worldHoverVizEl.style.left = `${left}px`;
 worldHoverVizEl.style.top = `${top}px`;
 worldHoverVizEl.textContent = `${SLOT_NAMES[slot.slotIndex]} · ${slot.shapeName}${rowMeta ? ` · ${rowMeta.source}` : ''}${options.pinned ? ' [pinned]' : ''}\nROM variant ${resolved.variantName} · ROM family ${resolved.familyName} · ${describeFrameParity(frameCnt)}\nX=${slot.inspectX ?? slot.coarseX} PF1=${toHex(slot.pf1Low)} PF2=${toHex(slot.pf2Low)}${rowMeta ? `\nrow ${rowMeta.rowKey} · river ${rowMeta.left}..${rowMeta.right}` : ''}${meta.cpuAddr ? `\nCPU ${meta.cpuAddr}` : ''}${meta.romOffset ? ` · ROM ${meta.romOffset}` : ''}${spriteMatchSummary(meta) ? `\n${spriteMatchSummary(meta)}` : ''}`;
 worldHoverVizEl.hidden = false;
 worldHoverVizEl.classList.toggle('pinned', !!options.pinned || worldHoverPinned);
}

function spriteScaleForSlot(slot, rowH) {
 const base = Math.max(2, Math.floor(rowH / 18));
 const sizeMult = slot.state1.nusiz >= 7 ? 4 : slot.state1.nusiz >= 5 ? 2 : 1;
 return Math.max(2, Math.min(6, base)) * sizeMult;
}

function drawBitmap(ctx, bitmap, centerX, centerY, color, options = {}) {
 if (!bitmap || !bitmap.length) return;
 const scale = options.scale ?? 3;
 const reflect = !!options.reflect;
 const copies = options.copies ?? 1;
 const spacing = options.spacing ?? Math.max(scale * 10, 18);
 const width = bitmap[0].length * scale;
 const height = bitmap.length * scale;
 const startX = centerX - (((copies - 1) * spacing) + width) / 2;
 ctx.fillStyle = color;
 for (let copy = 0; copy < copies; copy += 1) {
  const leftX = startX + copy * spacing;
  for (let row = 0; row < bitmap.length; row += 1) {
   const bits = bitmap[row];
   for (let col = 0; col < bits.length; col += 1) {
    if (bits[col] !== '1') continue;
    const pixelCol = reflect ? (bits.length - 1 - col) : col;
    ctx.fillRect(leftX + pixelCol * scale, centerY - height / 2 + row * scale, scale, scale);
   }
  }
 }
}

function copiesForSlot(slot) {
 if (slot.state1.nusiz >= 4 && slot.state1.nusiz <= 5) return 2;
 if (slot.state1.nusiz === 6) return 3;
 return 1;
}

function clearSlotModel() {
 for (let i = 0; i < slotModel.length; i++) {
  slotModel[i].blockLst = 0; slotModel[i].XPos1Lst = 0; slotModel[i].State1Lst = 0;
  slotModel[i].Shape1IdLst = objectPort.ID_PLANE;
  slotModel[i].PF1Lst = 0; slotModel[i].PF2Lst = 0;
 }
 selectedSlotIndex = 0;
}

function applySlotModelToMemory() {
 slotModel.forEach((slot, index) => {
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.blockLst.address + index, slot.blockLst);
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.XPos1Lst.address + index, slot.XPos1Lst);
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.State1Lst.address + index, slot.State1Lst);
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.Shape1IdLst.address + index, slot.Shape1IdLst);
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.PF1Lst.address + index, slot.PF1Lst);
  visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.PF2Lst.address + index, slot.PF2Lst);
 });
}

function syncSlotModelFromMemory() {
 slotModel.forEach((slot, index) => {
  slot.blockLst = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.blockLst.address + index);
  slot.XPos1Lst = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.XPos1Lst.address + index);
  slot.State1Lst = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.State1Lst.address + index);
  slot.Shape1IdLst = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.Shape1IdLst.address + index);
  slot.PF1Lst = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.PF1Lst.address + index);
  slot.PF2Lst = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.PF2Lst.address + index);
 });
}

function renderSlotEditor(inspectedSlots) {
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const rows = slotModel.map((slot, index) => {
  const inspected = inspectedSlots[index];
  const resolvedSprite = resolveSlotSprite(inspected, frameCnt);
  const spritePreview = renderBitmapChip(resolvedSprite.bitmap, { pixelSize: 3, color: '#5cc8ff' });
  const spriteMeta = SPRITE_VARIANT_META[resolvedSprite.variantName] || {};
  const shapeOptions = SHAPE_OPTIONS.map(([value, label]) =>
   `<option value="${value}"${Number(value) === slot.Shape1IdLst ? ' selected' : ''}>${label}</option>`
  ).join('');
  const metaHtml = metaChipsHtml([
   spriteMeta.cpuAddr ? { text: spriteMeta.cpuAddr } : null,
   spriteMeta.romOffset ? { text: spriteMeta.romOffset } : null,
   Number.isFinite(spriteMeta.matchCount) ? { text: `matches ${spriteMeta.matchCount}`, warn: spriteMeta.matchCount !== 1 } : null,
   Array.isArray(spriteMeta.allMatches) && spriteMeta.allMatches.length > 1 ? { text: spriteMatchSummary(spriteMeta), warn: true } : null,
   spriteMeta.sourceLine ? { text: `asm ${spriteMeta.sourceLine}` } : { text: 'no asm line', warn: true },
  ]);
  return `<tr data-slot-row="${index}"${index === selectedSlotIndex ? ' class="selected"' : ''}>
   <td>${SLOT_NAMES[index]}</td>
   <td><input data-slot="${index}" data-field="blockLst" type="number" min="0" max="255" value="${slot.blockLst}"></td>
   <td><input data-slot="${index}" data-field="XPos1Lst" type="number" min="0" max="159" value="${slot.XPos1Lst}"></td>
   <td><input data-slot="${index}" data-field="State1Lst" type="number" min="0" max="255" value="${slot.State1Lst}"></td>
   <td><select data-slot="${index}" data-field="Shape1IdLst">${shapeOptions}</select></td>
   <td><input data-slot="${index}" data-field="PF1Lst" type="number" min="0" max="255" value="${slot.PF1Lst}"></td>
   <td><input data-slot="${index}" data-field="PF2Lst" type="number" min="0" max="255" value="${slot.PF2Lst}"></td>
   <td>${inspected.shapeName}<div class="tiny" style="color:var(--muted)">${inspected.shapeAsmName} · ${shapeClassUiLabel(inspected.shapeClass)}</div></td>
   <td><div class="bitmap-stack">${spritePreview}<div><span class="mono">${resolvedSprite.variantName}</span><div class="tiny" style="color:var(--muted)">ROM family ${resolvedSprite.familyName} · ${describeFrameParity(frameCnt)}</div>${metaHtml}</div></div></td>
   <td>${inspected.blockFlags.labels.join(', ') || 'none'}</td>
   <td>${inspected.state1.summary}</td>
  </tr>`;
 }).join('');
 slotEditor.innerHTML = `<table><thead><tr>
  <th>Slot</th><th>blockLst</th><th>XPos1Lst</th><th>State1Lst</th>
  <th>Shape1IdLst</th><th>PF1Lst</th><th>PF2Lst</th>
  <th>Shape decode</th><th>ROM sprite variant</th><th>blockLst flags</th><th>State1</th>
 </tr></thead><tbody>${rows}</tbody></table>`;
 slotEditor.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', e => {
   const t = e.currentTarget, si = Number(t.dataset.slot), f = t.dataset.field;
   slotModel[si][f] = f === 'XPos1Lst' ? clampPlayfieldX(t.value) : clampByte(t.value);
   selectedSlotIndex = si; syncView();
  });
 });
 slotEditor.querySelectorAll('[data-slot-row]').forEach(row => {
  row.addEventListener('click', e => {
   if (e.target.closest('input, select')) return;
   selectedSlotIndex = Number(row.dataset.slotRow); syncView();
  });
 });
}

const BLOCK_FLAGS_SPEC = [
 { bit: 7, name: 'PF_ROAD',    mask: objectPort.PF_ROAD_FLAG,    desc: 'PF_ROAD bit set' },
 { bit: 6, name: 'ENEMY_MOVE', mask: objectPort.ENEMY_MOVE_FLAG, desc: 'MOVE_ENEMY bit set' },
 { bit: 5, name: 'PF_COLLIDE', mask: objectPort.PF_COLLIDE_FLAG, desc: 'PF_COLLIDE bit set' },
 { bit: 4, name: 'PATROL',     mask: objectPort.PATROL_FLAG,     desc: 'PATROL bit set' },
 { bit: 3, name: '(unused)',   mask: 0, desc: '' },
 { bit: 2, name: 'PF_COLOR',   mask: objectPort.PF_COLOR_FLAG,   desc: 'PF_COLOR bit set' },
 { bit: 1, name: 'PF2_PAGE',   mask: objectPort.PF2_PAGE_FLAG,   desc: 'PF2 selects $FD page' },
 { bit: 0, name: 'PF1_PAGE',   mask: objectPort.PF1_PAGE_FLAG,   desc: 'PF1 selects $FD page' },
];
const STATE1_FLAGS_SPEC = [
 { bit: 7, name: 'HM[7]', mask: 0x80, desc: 'fine' },
 { bit: 6, name: 'HM[6]', mask: 0x40, desc: 'fine' },
 { bit: 5, name: 'HM[5]', mask: 0x20, desc: 'fine' },
 { bit: 4, name: 'HM[4]', mask: 0x10, desc: 'fine' },
 { bit: 3, name: 'DIR',   mask: objectPort.DIRECTION_FLAG, desc: 'direction' },
 { bit: 2, name: 'NUSIZ2', mask: 0x04, desc: 'size' },
 { bit: 1, name: 'NUSIZ1', mask: 0x02, desc: 'size' },
 { bit: 0, name: 'NUSIZ0', mask: 0x01, desc: 'size' },
];

// ─── ROAD BLOCK ─────────────────────────────────────────────
function renderRoadBlockViz() {
  const el = document.getElementById('roadBlockViz');
  if (!el) return;
  const rb = visiblePort.inspectRoadBlockTemp2(memory);
  el.innerHTML = `
  <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
  <div><div style="font-family:monospace;font-size:14px;margin-bottom:4px">Raw: ${rb.hex} = ${rb.raw} at ${rb.addressHex}</div>
  <div style="margin-bottom:4px"><span style="display:inline-block;width:14px;height:14px;background:${rb.hasRoad ? '#59c3c3' : '#333'};border-radius:2px;vertical-align:middle;margin-right:4px"></span>bit7 = ${rb.hasRoad ? '1' : '0'} (${rb.roadLabel}) mask ${rb.roadBitMaskHex}</div>
  <div style="font-family:monospace;font-size:12px;margin-bottom:4px">Lower 7 bits: ${rb.lowerBitsHex} = ${rb.lowerBits}</div>
  <div style="font-size:11px;color:var(--muted)">${rb.note}</div>
  </div>
  <div><label style="font-size:12px;color:var(--muted)">Write $ED: <input id="roadBlockWrite" type="number" min="0" max="255" value="${rb.raw}" style="background:var(--bg);color:var(--fg);border:1px solid var(--border);padding:2px 6px;font-family:monospace;font-size:12px;width:60px"></label>
  <button id="roadBlockToggle" style="margin-left:8px;font-size:11px;padding:2px 8px;background:var(--bg);color:var(--fg);border:1px solid var(--border);cursor:pointer">Toggle bit 7</button>
  </div>
  </div>`;
  const wi = document.getElementById('roadBlockWrite');
  if (wi && !wi._bound) { wi._bound = true; wi.addEventListener('input', () => { visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.temp2.address, clampByte(wi.value)); renderRoadBlockViz(); }); }
  const tb = document.getElementById('roadBlockToggle');
  if (tb && !tb._bound) { tb._bound = true; tb.addEventListener('click', () => { const c = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.temp2.address); visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.temp2.address, c ^ 0x80); renderRoadBlockViz(); }); }
}

function renderFuelBar() {
 const canvas = document.getElementById('fuelBarCanvas');
 const infoEl = document.getElementById('fuelBarInfo');
 if (!canvas || !infoEl) return;
 const ctx = canvas.getContext('2d');
 const fuelPct = visiblePort.computeFuelPercent(memory);
 const fuel16 = visiblePort.computeFuel16(memory);
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
 const barX = 10, barY = 8, barW = canvas.width - 20, barH = 24;
 ctx.fillStyle = '#222'; ctx.fillRect(barX, barY, barW, barH);
 const fillW = barW * (fuelPct / 100);
 const g = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
 g.addColorStop(0, '#59c3c3'); g.addColorStop(1, fuelPct > 30 ? '#4ecdc4' : '#f25f5c');
 ctx.fillStyle = g; ctx.fillRect(barX, barY, fillW, barH);
 ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
 ctx.fillStyle = '#fff'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'center';
 ctx.fillText(`${fuelPct}%`, barX + barW / 2, barY + 17); ctx.textAlign = 'left';
 ctx.fillStyle = '#9dacd6'; ctx.font = '11px ui-monospace, monospace';
 ctx.fillText(`fuel16=${fuel16} (fuelHi:${toHex(visiblePort.getField(memory, 'fuelHi'))} fuelLo:${toHex(visiblePort.getField(memory, 'fuelLo'))})`, barX, barY + barH + 14);
 infoEl.innerHTML = '<span style="font-size:11px;color:var(--muted)">Combined fuelHi:fuelLo percentage. Drain/fill NOT in excerpt.</span>';
}

function renderFuelLoViz() {
 const el = document.getElementById('fuelLoViz');
 if (!el) return;
 const lo = visiblePort.inspectFuelLo(memory);
 el.innerHTML = `
 <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
 <div>
 <div style="font-family:monospace;font-size:14px;margin-bottom:4px">Raw: ${lo.hex} = ${lo.raw} at ${lo.addressHex}</div>
 <div style="font-size:11px;color:var(--muted);margin-bottom:4px">fuel pair endpoints: ${lo.pairAddressHex}</div>
 <div style="font-size:11px;color:var(--muted)">${lo.note}</div>
 </div>
 <div><label style="font-size:12px;color:var(--muted)">Write $B8: <input id="fuelLoWrite" type="number" min="0" max="255" value="${lo.raw}" style="background:var(--bg);color:var(--fg);border:1px solid var(--border);padding:2px 6px;font-family:monospace;font-size:12px;width:60px"></label></div>
 </div>`;
 const wi = document.getElementById('fuelLoWrite');
 if (wi && !wi._bound) { wi._bound = true; wi.addEventListener('input', () => { visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.fuelLo.address, clampByte(wi.value)); syncView(); }); }
}

function renderBlockPartViz() {
 const el = document.getElementById('blockPartViz');
 if (!el) return;
 const bp = visiblePort.inspectBlockPart(memory);
 const halfColor = bp.isFirstHalf ? '#59c3c3' : bp.isSecondHalf ? '#ffd166' : '#555';
 el.innerHTML = `
 <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
 <div>
 <div style="font-family:monospace;font-size:14px;margin-bottom:4px">Raw: ${bp.hex} = ${bp.raw} at ${bp.addressHex}</div>
 <div style="margin-bottom:4px"><span style="display:inline-block;width:14px;height:14px;background:${halfColor};border-radius:2px;vertical-align:middle;margin-right:4px"></span>${bp.label}${bp.isUnset ? ' (zero/unset)' : ''}</div>
 <div style="font-size:11px;color:var(--muted)">${bp.note}</div>
 </div>
 <div><label style="font-size:12px;color:var(--muted)">Write $B6: <input id="blockPartWrite" type="number" min="0" max="255" value="${bp.raw}" style="background:var(--bg);color:var(--fg);border:1px solid var(--border);padding:2px 6px;font-family:monospace;font-size:12px;width:60px"></label></div>
 </div>`;
 const wi = document.getElementById('blockPartWrite');
 if (wi && !wi._bound) { wi._bound = true; wi.addEventListener('input', () => { visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.blockPart.address, clampByte(wi.value)); syncView(); }); }
}

function renderSlotAddrLookup() {
 const el = document.getElementById('slotAddrViz');
 if (!el) return;
 const lu = visiblePort.slotAddressLookup(selectedSlotIndex);
 if (!lu) { el.innerHTML = '<div style="color:var(--muted)">Invalid slot</div>'; return; }
 let h = `<div style="margin-bottom:6px;font-size:13px">Slot ${SLOT_NAMES[selectedSlotIndex]}</div>`;
 h += '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:2px 6px">Field</th><th style="text-align:left;padding:2px 6px">Address</th><th style="text-align:left;padding:2px 6px">Array base</th><th style="text-align:left;padding:2px 6px">Offset</th><th style="text-align:left;padding:2px 6px">Value</th></tr>';
 for (const [field, info] of Object.entries(lu)) {
  const val = visiblePort.readByte(memory, info.address);
  h += `<tr style="border-bottom:1px solid var(--border)"><td style="padding:2px 6px;font-family:monospace">${field}</td><td style="padding:2px 6px;font-family:monospace;color:var(--accent)">${info.hex}</td><td style="padding:2px 6px;font-family:monospace">${info.arrayBase}</td><td style="padding:2px 6px;font-family:monospace">+${info.offset}</td><td style="padding:2px 6px;font-family:monospace">${val} (${toHex(val)})</td></tr>`;
 }
 h += '</table>';
 el.innerHTML = h;
}

function renderHexEditor(filterText) {
 const el = document.getElementById('hexEditorViz');
 if (!el) return;
 const filter = (filterText || '').trim().toLowerCase();
 const layout = visiblePort.ZERO_PAGE_LAYOUT;
 const fieldMap = new Map();
 for (const field of layout) {
  const addr = field.address;
  if (addr < 0x80 || addr > 0xFD) continue;
  if (!fieldMap.has(addr)) fieldMap.set(addr, []);
  fieldMap.get(addr).push(field);
 }
 let h = '<table style="width:100%;border-collapse:collapse;font-size:11px">';
 h += '<tr style="border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg)"><th style="text-align:left;padding:2px 4px">Addr</th><th style="text-align:left;padding:2px 4px">Hex</th><th style="text-align:left;padding:2px 4px">Dec</th><th style="text-align:left;padding:2px 4px">Bin</th><th style="text-align:left;padding:2px 4px">Field(s)</th><th style="text-align:left;padding:2px 4px">Coverage</th></tr>';
 const coverageMap = visiblePort.COVERAGE_MAP;
 const cc = { 'visible-code': '#59c3c3', 'declared': '#ffd166', 'declared-only': '#555' };
 for (let addr = 0x80; addr <= 0xFD; addr++) {
  const val = visiblePort.readByte(memory, addr);
  const fields = fieldMap.get(addr) || [];
  const primary = fields.find(f => !f.aliasOf) || fields[0];
  const allN = fields.map(f => f.name + (f.aliasOf ? ` (=${f.aliasOf})` : '')).join(', ');
  if (filter) {
   const ah = '$' + addr.toString(16).padStart(2, '0');
   if (!ah.toLowerCase().includes(filter) && !allN.toLowerCase().includes(filter)) continue;
  }
  const cov = primary ? (coverageMap.get(primary.name)?.coverage || 'declared-only') : 'declared-only';
  const covC = cc[cov] || '#555';
  const isAl = fields.length > 1;
  h += `<tr style="border-bottom:1px solid #1a1a1a${isAl ? ';background:rgba(255,209,102,0.05)' : ''}">`;
  h += `<td style="padding:2px 4px;font-family:monospace;color:var(--accent)">$${addr.toString(16).padStart(2, '0')}</td>`;
  h += `<td style="padding:2px 4px;font-family:monospace">${val.toString(16).padStart(2, '0')}</td>`;
  h += `<td style="padding:2px 4px;font-family:monospace">${val}</td>`;
  h += `<td style="padding:2px 4px;font-family:monospace;font-size:10px">${val.toString(2).padStart(8, '0')}</td>`;
  h += `<td style="padding:2px 4px;font-family:monospace${isAl ? ';color:#ffd166' : ''}">${allN || '(unused)'}</td>`;
  h += `<td style="padding:2px 4px"><span style="display:inline-block;width:8px;height:8px;background:${covC};border-radius:2px"></span></td>`;
  h += '</tr>';
 }
 h += '</table>';
 h += '<div style="margin-top:4px;font-size:11px;color:var(--muted)">Range $80-$FD. Coverage: teal=visible-code, yellow=declared, gray=declared-only. Aliased rows highlighted.</div>';
 el.innerHTML = h;
}

let addrMapFilterText = '';
let hexEditorFilterText = '';

function renderAddressMap() {
 if (!addressMapBody) return;
 const filter = (addrMapFilterText || '').trim().toLowerCase();
 const noteByLabel = new Map(visiblePort.ZERO_PAGE_LAYOUT.map(entry => [entry.name, entry.note || '']));
 const rows = [];
 for (const entry of visiblePort.ADDRESS_MAP) {
  const startHex = `$${entry.start.toString(16).toUpperCase().padStart(2, '0')}`;
  const endHex = `$${entry.end.toString(16).toUpperCase().padStart(2, '0')}`;
  const aliases = (entry.aliases || []).join(', ');
  const label = entry.label;
  const note = noteByLabel.get(label) || '';
  const haystack = `${startHex} ${endHex} ${label} ${aliases} ${note}`.toLowerCase();
  if (filter && !haystack.includes(filter)) continue;
  rows.push(`
   <div class="addr-row" style="border-bottom:1px solid var(--border)">
    <div class="addr mono" style="color:var(--accent)">${startHex}</div>
    <div class="addr mono">${endHex}</div>
    <div class="mono">${entry.length}</div>
    <div class="label mono">${label}</div>
    <div class="comment">${note}</div>
    <div class="mono">${aliases || '<span style="color:var(--muted)">(none)</span>'}</div>
   </div>`);
 }
 addressMapBody.innerHTML = rows.join('') || '<div style="padding:8px 0;color:var(--muted)">No address-map rows match the current filter.</div>';
}

const addrMapFilterInput = document.getElementById('addrMapFilter');
if (addrMapFilterInput) {
 addrMapFilterInput.addEventListener('input', () => { addrMapFilterText = addrMapFilterInput.value; renderAddressMap(); });
}
const hexEditorFilterInput = document.getElementById('hexFilterInput');
if (hexEditorFilterInput) {
 hexEditorFilterInput.addEventListener('input', () => { hexEditorFilterText = hexEditorFilterInput.value; renderHexEditor(hexEditorFilterText); });
}

// ─── MAIN-LOOP ENTRY INSPECTOR ───────────────────────────────
function renderMainLoopEntryViz() {
 if (!mainLoopEntryEl) return;
 const mle = visiblePort.inspectMainLoopEntry(memory);
 mainLoopEntryEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">X register:</span><span style="font-weight:bold;color:var(--accent)">${mle.x} (${mle.xLabel}) / ${mle.xHex}</span>
   <span style="color:var(--muted)">fuelHi:</span><span>${mle.fuelHiHex} (${mle.fuelHi}) at ${mle.fuelHiAddressHex}</span>
   <span style="color:var(--muted)">after ${mle.lsrCount}x LSR:</span><span>${mle.afterLsrHex} (${mle.afterLsr}), then ADC ${mle.addConstantHex}</span>
   <span style="color:var(--muted)">fuel ball Y:</span><span style="font-weight:bold;color:var(--accent)">${mle.yPosHex} (${mle.yPos})</span>
  </div>
  <div style="font-size:11px;color:var(--muted)">${mle.note}</div>`;
}

// ─── SECTION COUNTDOWN ───────────────────────────────────────
function renderSectionCountdownViz() {
 if (!sectionCountdownEl) return;
 const sc = visiblePort.inspectSectionCountdown(memory);
 sectionCountdownEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">sectionBlock byte:</span><span style="font-weight:bold;color:var(--accent)">${sc.sectionBlock} (${sc.sectionBlockLabel}) at ${sc.sectionBlockAddressHex}</span>
   <span style="color:var(--muted)">countdown helper:</span><span>${sc.blocksRemaining} visible blocks left from this byte convention</span>
   <span style="color:var(--muted)">value-1 check:</span><span>${sc.isBridge ? 'sectionBlock==1' : 'sectionBlock!=1'}</span>
   <span style="color:var(--muted)">value-0 check:</span><span>${sc.isSectionTransition ? 'sectionBlock==0' : 'sectionBlock!=0'}</span>
   <span style="color:var(--muted)">blockPart:</span><span>${sc.blockPart} (${sc.blockPartLabel})</span>
   <span style="color:var(--muted)">blockOffset:</span><span>${sc.blockOffset} at ${sc.blockOffsetAddressHex} -> line ${sc.blockOffsetLine}</span>
   <span style="color:var(--muted)">prevPF1PatId:</span><span>${toHex(sc.prevPF1PatId)}</span>
   <span style="color:var(--muted)">PF1PatId:</span><span>${toHex(sc.PF1PatId)} at ${sc.pf1PatIdAddressHex} -> ${sc.pfPageTransition}</span>
 <span style="color:var(--muted)">posYLo:</span><span>${toHex(sc.posYLo)}</span>
 <span style="color:var(--muted)">bkColor:</span><span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${visiblePort.ntscColorCss(sc.bkColor)};vertical-align:middle;margin-right:4px"></span>${sc.bkColorHex}${sc.bkMatchesExpected ? '' : ' ⚠ expected GREY'}</span>
 <span style="color:var(--muted)">pfColor:</span><span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${visiblePort.ntscColorCss(sc.pfColor)};vertical-align:middle;margin-right:4px"></span>${sc.pfColorHex}${sc.pfMatchesExpected ? '' : ' ⚠ expected YELLOW+2'}</span>
 </div>
  <div style="font-size:11px;color:var(--muted)">${sc.note}</div>`;
}

// ─── MISSILE BOUNDS ──────────────────────────────────────────
function renderMissileStateViz() {
 if (!missileStateVizEl) return;
 const m = visiblePort.inspectMissileBoundsState(memory);
 let sc = '#555', st = 'raw byte state';
 if (m.isAboveScreen) { sc = '#f25f5c'; st = 'ABOVE SCREEN'; }
 else if (!m.isWithinBounds) { sc = '#f6bd60'; st = 'OUT OF BOUNDS'; }
 else if (m.isAtSpawn) { sc = '#59c3c3'; st = `AT SPAWN Y=${m.minMissile}`; }
 else if (m.isEnabled) { sc = '#4ecdc4'; st = 'WITHIN BOUNDS + $FF FLAG'; }
 else { st = 'WITHIN BOUNDS + non-$FF FLAG'; }
 missileStateVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr auto;gap:4px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">missileY:</span><span>${m.missileY} <span class="mono">${m.missileYHex}</span></span>
   <span style="color:var(--accent);font-weight:bold;background:${sc}11;padding:0 4px;border-radius:3px">${st}</span>
   <span style="color:var(--muted)">missileX:</span><span>${m.missileX} <span class="mono">${m.missileXHex}</span></span>
   <span style="color:var(--muted)">flag:</span><span>${m.missileFlagHex} ${m.isEnabled ? '<span style="color:var(--accent2)">$FF sentinel</span>' : 'non-$FF byte'}</span>
   <span style="color:var(--muted)">bounds:</span><span class="mono">${m.minMissile}..${m.maxMissile}</span>
   <span style="color:var(--muted)">speed:</span><span>${m.missileSpeed} px/fr</span>
   <span style="color:var(--muted)">dist:</span><span>${m.distFromJet}</span>
  </div>
  <div class="tiny">${m.note}</div>`;
}

// ─── PLAYER MOVEMENT ─────────────────────────────────────────
function renderPlayerMoveViz() {
 if (!playerMoveVizEl) return;
 const p = visiblePort.inspectPlayerMovementState(memory);
 const rb = p.riverBounds;
 playerMoveVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">playerX:</span><span>${p.playerX} <span class="mono">${p.playerXHex}</span></span>
   <span style="color:var(--muted)">speedX:</span><span>${p.speedX} <span class="mono">${p.speedXHex}</span> (signed: ${p.speedXSigned})</span>
   <span style="color:var(--muted)">speedY:</span><span>${p.speedY} <span class="mono">${p.speedYHex}</span> (signed: ${p.speedYSigned})</span>
   <span style="color:var(--muted)">JET_Y:</span><span style="color:var(--warn)">${p.jetY} (fixed jet scanline)</span>
   <span style="color:var(--muted)">river bounds:</span><span>${rb.leftBoundHex}..${rb.rightBoundHex} via slice ${rb.sliceLabel} margin ${rb.margin}</span>
   <span style="color:var(--muted)">bank state:</span><span>${p.hasBankCrash ? `<span style="color:#f25f5c">${p.bankState}</span> (${p.pfCrashHex})` : 'clear'}</span>
  </div>
  <div class="tiny">signed interp is inspector-only. Harness bank clamp is silhouette-derived, and full ROM physics/collision remain NOT in excerpt. ${p.note}</div>`;
}

// ─── MainLoop fuel trace ─────────────────────────────────────
function renderMainloopTraceViz() {
 const el = document.getElementById('mainloopTraceViz');
 if (!el) return;
 const fuelHi = visiblePort.getField(memory, 'fuelHi');
 const trace = visiblePort.traceMainLoopFuelSequence(fuelHi);
 el.innerHTML = `
  <div style="font-family:var(--mono);font-size:11px;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;margin-bottom:6px">
   <span style="color:var(--muted)">LDA fuelHi:</span><span>A = ${trace.aAfterLoadHex} (${trace.aAfterLoad})</span>
   <span style="color:var(--muted)">LSR #1:</span><span>A = ${trace.lsr1.aAfterLsrHex}, C = ${trace.lsr1.carryOut}</span>
   <span style="color:var(--muted)">LSR #2:</span><span>A = ${trace.lsr2.aAfterLsrHex}, C = ${trace.lsr2.carryOut}</span>
   <span style="color:var(--muted)">LSR #3:</span><span>A = ${trace.lsr3.aAfterLsrHex}, C = ${trace.lsr3.carryOut}</span>
   <span style="color:var(--muted)">ADC #69:</span><span>A = ${trace.adc69.afterAddHex} (${trace.adc69.afterAdd})</span>
   <span style="color:var(--muted)">JSR SetPosX:</span><span>X=${trace.jsrSetPosX.offset} (${trace.jsrSetPosX.label})</span>
  </div>
  <div class="tiny">${trace.note}</div>`;
}

// ─── RENDER FUNCTIONS (batch) ──────────────────────────────────
function renderSelectedSlotDetail(slot) {
 if (!slot || !slotDetailEl) return;
 const addrs = visiblePort.slotAddressLookup(slot.slotIndex);
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const resolvedSprite = resolveSlotSprite(slot, frameCnt);
 const spriteMeta = SPRITE_VARIANT_META[resolvedSprite.variantName] || {};
 const detailLines = [
  `Slot ${SLOT_NAMES[slot.slotIndex]}`,
  `blockLst: ${toHex(slot.blockLst)}  flags: ${slot.blockFlags.labels.join(', ') || 'none'}`,
  `XPos1Lst(coarse): ${toHex(slot.coarseX)}`,
  `State1Lst: ${toHex(slot.state1Byte)}  dir=${slot.state1.directionLabel}  REFP1=${slot.state1.refp1Label}  ${slot.state1.nusizLabel}`,
  `fine offset: ${slot.state1.fineOffset >= 0 ? '+' : ''}${slot.state1.fineOffset}`,
  `inspect X: ${slot.inspectX}`,
  `Shape1IdLst: ${slot.shapeId} (${slot.shapeName})`,
  `shape meta: ${slot.shapeAsmName}  ${shapeClassUiLabel(slot.shapeClass)}  known=${slot.isKnownShape ? 'yes' : 'no'}  @ ${slot.shapeIdAddressHex}`, 
  `ROM sprite variant: ${resolvedSprite.variantName}  ROM family=${resolvedSprite.familyName}  variant ${resolvedSprite.variantCount ? `${resolvedSprite.variantIndex + 1}/${resolvedSprite.variantCount}` : 'n/a'}  frameCnt=${frameCnt} (${(frameCnt & 1) ? 'odd' : 'even'})`,
  `ROM variant meta: cpu=${spriteMeta.cpuAddr || 'n/a'}  rom=${spriteMeta.romOffset || 'n/a'}  asm=${spriteMeta.sourceLine || 'n/a'}`,
  `PF1Lst: ${toHex(slot.pf1Low)}  page ${toHex(slot.pf1Page,4)}`,
  `PF2Lst: ${toHex(slot.pf2Low)}  page ${toHex(slot.pf2Page,4)}`,
  `slot arrays: ${slot.rowRangeHex}`,
  `addrs: ${addrs ? Object.entries(addrs).map(([k,v]) => `${k}=${v.hex}`).join(' ') : 'n/a'}`,
 ];
 if (resolvedSprite.familyName === 'Bridge') {
  detailLines.push(`Bridge ROM-family detail: ${resolvedSprite.variantName} selected by ${describeFrameParity(frameCnt)} parity; this inspector follows the same A/B ROM variant branch.`);
 }
 slotDetailEl.textContent = detailLines.join('\n');
}

function renderPlayerJetViz() {
 if (!playerJetVizEl) return;
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const gameMode = visiblePort.getField(memory, 'gameMode');
 const gameModeLabel = visiblePort.computeMainLoopVisibleState(memory).gameModeLabel;
 const playerJet = resolvePlayerJetSprite(frameCnt, gameMode);
 const preview = renderBitmapChip(playerJet.bitmap, { pixelSize: 5, color: '#ffe066' });
 playerJetVizEl.innerHTML = `
  <div class="bitmap-stack">
   ${preview}
   <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start">
    <span style="color:var(--muted)">ROM jet variant:</span><span class="mono">${playerJet.name}</span>
    <span style="color:var(--muted)">frame parity:</span><span>${parityBadgeHtml(frameCnt)}</span>
    <span style="color:var(--muted)">gameMode:</span><span>${toHex(gameMode)} (${gameMode}) · ${gameModeLabel}</span>
    <span style="color:var(--muted)">selection rule:</span><span>current inspector rule is parity-based: even=A straight, odd=B move; no verified player explosion-state wiring yet.</span>
   </div>
  </div>
  <div class="tiny" style="margin-top:8px">P0 jet bitmap preview currently switches between ROM-backed JetStraight / JetMove variants by parity. JetExplode is extracted and available, but not yet wired to a verified explosion-state byte.</div>`;
}

function renderPlayerJetCompareViz() {
 if (!playerJetCompareVizEl) return;
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const current = resolvePlayerJetSprite(frameCnt, visiblePort.getField(memory, 'gameMode')).name;
 playerJetCompareVizEl.innerHTML = `
  <div class="bitmap-compare">
   <div class="bitmap-compare-card">
    <div class="mono">JetStraight · even/A</div>
    ${renderBitmapChip(PLAYER_JET_VARIANTS.Straight, { pixelSize: 5, color: '#ffe066' })}
   </div>
   <div class="bitmap-compare-card">
    <div class="mono">JetMove · odd/B</div>
    ${renderBitmapChip(PLAYER_JET_VARIANTS.Move, { pixelSize: 5, color: '#ff9f68' })}
   </div>
  </div>
  <div class="tiny" style="margin-top:8px">Current ROM jet variant: <span class="mono">${current}</span>. ${parityBadgeHtml(frameCnt)}</div>`;
}

function renderSpriteDecisionViz(slot) {
 if (!spriteDecisionVizEl || !slot) return;
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const slotSprite = resolveSlotSprite(slot, frameCnt);
 const playerJet = resolvePlayerJetSprite(frameCnt, visiblePort.getField(memory, 'gameMode'));
 const familyControls = SHAPE_OPTIONS.map(([, familyName]) => {
  const isActive = familyName === slot.shapeName;
  return `<button class="tiny-button${isActive ? ' active' : ''}" type="button" data-jump-family="${familyName}" data-jump-variant="${frameCnt & 1}">${familyName}</button>`;
 }).join(' ');
 spriteDecisionVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start">
   <span style="color:var(--muted)">frameCnt:</span><span>${toHex(frameCnt)} (${frameCnt}) ${parityBadgeHtml(frameCnt)}</span>
   <span style="color:var(--muted)">selected slot:</span><span>${SLOT_NAMES[slot.slotIndex]} · ${slot.shapeName}</span>
   <span style="color:var(--muted)">slot ROM variant:</span><span class="mono">${slotSprite.variantName}</span>
   <span style="color:var(--muted)">P0 ROM jet variant:</span><span class="mono">${playerJet.name}</span>
   <span style="color:var(--muted)">slot copies:</span><span>${copiesForSlot(slot)}</span>
   <span style="color:var(--muted)">slot reflect:</span><span>${slot.state1.reflect ? 'yes' : 'no'}</span>
  </div>
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Jump selected slot ROM family without hunting for a compare card</div></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap">${familyControls}</div>
  <div class="tiny" style="margin-top:6px">Buttons keep the current parity branch (${describeFrameParity(frameCnt)}) and only swap the selected slot ROM family.</div>`;
 spriteDecisionVizEl.querySelectorAll('[data-jump-family]').forEach(button => {
  if (button._bound) return;
  button._bound = true;
  button.addEventListener('click', () => setSelectedSlotFamilyAndParity(button.dataset.jumpFamily, Number(button.dataset.jumpVariant || 0)));
 });
}

function renderExplosionFamilyViz(slot) {
 if (!explosionFamilyVizEl || !slot) return;
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const explosionFamilies = ['Explosion0', 'Explosion1', 'Explosion2', 'Explosion3'];
 const cards = explosionFamilies.map((familyName, familyIndex) => {
  const variants = SPRITE_VARIANTS[familyName] || [];
  const compare = variants.map((variant, variantIndex) => {
   const accent = familyAccentColor(familyName);
   return `<div class="bitmap-compare-card clickable" data-click-family="${familyName}" data-click-variant="${variantIndex}" title="${escapeHtml(variantTooltip(variant.name, familyName))}" style="border-top:3px solid ${accent};padding-top:6px">
    <div class="mono">${variant.name} · seq ${familyIndex} · ${variantIndex === 0 ? 'even/A' : 'odd/B'}</div>
    ${renderBitmapChip(variant.bitmap, { pixelSize: 4, color: accent })}
   </div>`;
  }).join('');
  return `<div style="margin-bottom:10px"><div class="chip-label" style="background:${familyAccentColor(familyName)}">${familyName}</div><div class="bitmap-compare" style="margin-top:6px">${compare}</div></div>`;
 }).join('');
 const resolved = resolveSlotSprite(slot, frameCnt);
 const selectedNote = slot.shapeName.startsWith('Explosion')
  ? `Selected slot currently maps to <span class="mono">${resolved.variantName}</span>; parity ${describeFrameParity(frameCnt)} keeps the active branch on the same ROM-family row.`
  : `Selected slot is <span class="mono">${slot.shapeName}</span>; click any explosion card to retarget the selected slot to that ROM family + parity branch.`;
 explosionFamilyVizEl.innerHTML = `<div class="tiny" style="margin-bottom:8px">${selectedNote}</div>${cards}`;
 explosionFamilyVizEl.querySelectorAll('[data-click-family]').forEach(card => {
  if (card._bound) return;
  card._bound = true;
  card.addEventListener('click', () => setSelectedSlotFamilyAndParity(card.dataset.clickFamily, Number(card.dataset.clickVariant || 0)));
 });
}

function renderPFPatternViz(slot) {
 if (!pfPatternVizEl) return;
 const prevPF1 = visiblePort.inspectPrevPF1PatId(memory);
 const liveBytes = exactPFPatternMatches([
  { label: 'prevPF1PatId', value: prevPF1.raw },
  ...(slot ? [
   { label: `${SLOT_NAMES[slot.slotIndex]}.PF1Lst`, value: slot.pf1Low },
   { label: `${SLOT_NAMES[slot.slotIndex]}.PF2Lst`, value: slot.pf2Low },
  ] : []),
 ]);
 const selectedLowSet = new Set(slot ? [lowByte(slot.pf1Low), lowByte(slot.pf2Low)] : []);
 const liveHints = liveBytes.map(entry => `<div class="coverage-stat"><div class="mono">${entry.label} = ${toHex(entry.value)}</div><div class="tiny">${entry.matches.length ? entry.matches.map(m => `${m.name} (${m.cpuAddr})`).join(' · ') : 'no exact low-byte match to PFPat8..12'}</div></div>`).join('');
 const selectedByteStrip = slot ? `<div class="coverage-grid" style="margin:10px 0">${[
  { label: `${SLOT_NAMES[slot.slotIndex]}.PF1Lst`, value: slot.pf1Low, color: '#8fb6ff' },
  { label: `${SLOT_NAMES[slot.slotIndex]}.PF2Lst`, value: slot.pf2Low, color: '#74f0b8' },
 ].map(item => `<div class="coverage-stat"><div class="mono">${item.label} = ${toHex(item.value)}</div><div style="display:grid;grid-template-columns:repeat(8, 1fr);gap:2px;margin-top:6px">${item.value.toString(2).padStart(8, '0').split('').map(bit => `<span style="height:12px;border-radius:2px;background:${bit === '1' ? item.color : 'rgba(255,255,255,0.08)'}"></span>`).join('')}</div></div>`).join('')}</div>` : '';
 const cards = Object.entries(PF_PATTERN_REFERENCE).map(([name, item]) => {
  const refLow = lowByte(parseHexAddress(item.cpuAddr));
  const matched = selectedLowSet.has(refLow);
  return `<div class="bitmap-compare-card" title="${name} · rom=${item.romOffset} · cpu=${item.cpuAddr}" style="border-top:3px solid ${matched ? '#ffd166' : '#8fb6ff'};padding-top:6px;box-shadow:${matched ? '0 0 0 1px rgba(255,209,102,0.28)' : 'none'}">
   <div class="mono">${name}${matched ? ' · live low-byte match' : ''}</div>
   <div class="tiny">${item.title}</div>
   ${renderBitmapChip(item.bitmap, { pixelSize: 3, color: matched ? '#ffd166' : '#8fb6ff' })}
   <div class="tiny">ROM ${item.romOffset} · CPU ${item.cpuAddr}</div>
  </div>`;
 }).join('');
 pfPatternVizEl.innerHTML = `<div class="tiny" style="margin-bottom:8px">ROM-backed PF reference set from extracted island/bank patterns. Still reference-only for the main renderer, but now compared against live visible low bytes conservatively via exact low-byte matches.</div><div class="coverage-grid" style="margin-bottom:10px">${liveHints}</div>${selectedByteStrip}<div class="bitmap-compare">${cards}</div>`;
}

async function copyTextareaWithFeedback(textarea, button, status, labels = {}) {
 if (!textarea || !button) return false;
 const text = textarea.value;
 const idleLabel = labels.idleLabel ?? button.textContent ?? 'Copy';
 const copiedLabel = labels.copiedLabel ?? 'Copied';
 const failedLabel = labels.failedLabel ?? 'Copy failed';
 const okMessage = labels.okMessage ?? 'Copied text to clipboard.';
 const failMessage = labels.failMessage ?? 'Copy failed in this browser context; clipboard permission is blocked here.';
 let copied = false;
 try {
  if (navigator.clipboard?.writeText) {
   await navigator.clipboard.writeText(text);
   copied = true;
  }
 } catch {}
 if (!copied) {
  try {
   textarea.focus();
   textarea.select();
   textarea.setSelectionRange(0, textarea.value.length);
   copied = !!document.execCommand('copy');
  } catch {}
 }
 if (copied) {
  button.textContent = copiedLabel;
  button.classList.add('copied');
  if (status) { status.textContent = okMessage; status.className = 'copy-status ok'; }
  setTimeout(() => {
   button.textContent = idleLabel;
   button.classList.remove('copied');
   if (status) { status.textContent = ''; status.className = 'copy-status'; }
  }, 1200);
  return true;
 }
 button.textContent = failedLabel;
 if (status) { status.textContent = failMessage; status.className = 'copy-status fail'; }
 setTimeout(() => {
  button.textContent = idleLabel;
  if (status) { status.className = 'copy-status'; }
 }, 1200);
 return false;
}

async function copyBitmapExportText() {
 const textarea = document.querySelector('#slotPreviewViz textarea.bitmap-export');
 const button = document.getElementById('copyBitmapExport');
 const status = document.getElementById('copyBitmapStatus');
 await copyTextareaWithFeedback(textarea, button, status, {
  idleLabel: 'Copy rows',
  copiedLabel: 'Copied',
  failedLabel: 'Copy failed',
  okMessage: 'Copied active bitmap rows to clipboard.',
 });
}

async function copyWorldRowExportText() {
 const textarea = document.querySelector('#worldRowViz textarea.bitmap-export');
 const button = document.getElementById('copyWorldRowExport');
 const status = document.getElementById('copyWorldRowStatus');
 await copyTextareaWithFeedback(textarea, button, status, {
  idleLabel: 'Copy row',
  copiedLabel: 'Copied',
  failedLabel: 'Copy failed',
  okMessage: 'Copied selected world-row bitmap rows to clipboard.',
 });
}

async function copySeamExportText() {
 const textarea = document.querySelector('#seamScrollViz textarea.bitmap-export');
 const button = document.getElementById('copySeamExport');
 const status = document.getElementById('copySeamStatus');
 await copyTextareaWithFeedback(textarea, button, status, {
  idleLabel: 'Copy seam summary',
  copiedLabel: 'Copied',
  failedLabel: 'Copy failed',
  okMessage: 'Copied seam summary + compare rows to clipboard.',
 });
}

function renderSelectedSlotPreview(slot) {
 if (!slotPreviewVizEl || !slot) return;
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const resolvedSprite = resolveSlotSprite(slot, frameCnt);
 const preview = renderBitmapChip(resolvedSprite.bitmap, { pixelSize: 6, color: '#5cc8ff' });
 const variants = SPRITE_VARIANTS[resolvedSprite.familyName] || [];
 const compareHtml = variants.length > 1
  ? `<div class="compare-head"><div class="tiny">ROM family compare</div><div class="chip-label" style="background:${familyAccentColor(resolvedSprite.familyName)}">${resolvedSprite.familyName}</div></div><div class="bitmap-compare">${variants.map((variant, index) => `
   <div class="bitmap-compare-card clickable" data-click-family="${resolvedSprite.familyName}" data-click-variant="${index}" title="${escapeHtml(variantTooltip(variant.name, resolvedSprite.familyName))}" style="border-top:3px solid ${familyAccentColor(resolvedSprite.familyName)};padding-top:6px">
    <div class="mono">${variant.name} · ${index === 0 ? 'even/A' : 'odd/B'}</div>
    ${renderBitmapChip(variant.bitmap, { pixelSize: 4, color: index === resolvedSprite.variantIndex ? '#ffd166' : familyAccentColor(resolvedSprite.familyName) })}
   </div>`).join('')}</div>`
  : '';
 const exportText = `${resolvedSprite.variantName}\n${bitmapRowsText(resolvedSprite.bitmap)}`;
 slotPreviewVizEl.innerHTML = `
  <div class="bitmap-stack">
   ${preview}
   <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start">
    <span style="color:var(--muted)">slot:</span><span>${SLOT_NAMES[slot.slotIndex]}</span>
    <span style="color:var(--muted)">shape ID:</span><span>${slot.shapeName} · ${slot.shapeAsmName}</span>
    <span style="color:var(--muted)">ROM variant:</span><span class="mono" title="${escapeHtml(variantTooltip(resolvedSprite.variantName, resolvedSprite.familyName))}">${resolvedSprite.variantName}${spriteMatchSummary(spriteMeta) ? ` · ${escapeHtml(spriteMatchSummary(spriteMeta))}` : ''}</span>
    <span style="color:var(--muted)">parity:</span><span>${parityBadgeHtml(frameCnt)}</span>
   </div>
  </div>
  ${compareHtml}
  <div class="tiny" style="margin-top:6px">Click a ROM-family card to force the selected slot onto that even/A or odd/B branch via <span class="mono">frameCnt</span>.</div>
  <div class="compare-head"><div class="tiny">Active bitmap rows</div><button id="copyBitmapExport" class="tiny-button" type="button">Copy rows</button></div>
  <div id="copyBitmapStatus" class="copy-status"></div>
  <textarea class="bitmap-export" readonly>${escapeHtml(exportText)}</textarea>`;
 const copyButton = document.getElementById('copyBitmapExport');
 if (copyButton && !copyButton._bound) {
  copyButton._bound = true;
  copyButton.addEventListener('click', copyBitmapExportText);
 }
 slotPreviewVizEl.querySelectorAll('[data-click-family]').forEach(card => {
  if (card._bound) return;
  card._bound = true;
  card.addEventListener('click', () => setSelectedSlotFamilyAndParity(card.dataset.clickFamily, Number(card.dataset.clickVariant || 0)));
 });
}

function seamPctLabel(value) {
 if (!Number.isFinite(value)) return 'n/a';
 const pct = Math.round(value * 100);
 return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function seamDeltaText(sample) {
 const seam = sample?.seamDelta;
 if (!seam) return 'n/a';
 return `ΔW ${seam.widthDelta >= 0 ? '+' : ''}${seam.widthDelta} (${seamPctLabel(seam.widthDeltaPct)}) · ΔX ${seam.xDelta >= 0 ? '+' : ''}${seam.xDelta} (${seam.xDirection})`;
}

function signedMetricLabel(value) {
 if (!Number.isFinite(value)) return 'n/a';
 return `${value >= 0 ? '+' : ''}${value}`;
}

function buildBitmapDiffRows(bitmapA = [], bitmapB = []) {
 const rowCount = Math.max(bitmapA.length || 0, bitmapB.length || 0);
 const rows = [];
 for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
  const a = String(bitmapA[rowIndex] ?? '00000000').padStart(8, '0');
  const b = String(bitmapB[rowIndex] ?? '00000000').padStart(8, '0');
  let diff = '';
  for (let i = 0; i < 8; i += 1) diff += a[i] === b[i] ? '·' : '×';
  rows.push(`${rowIndex.toString().padStart(2, '0')} ${a} | ${b} | ${diff}`);
 }
 return rows;
}

function buildBitmapDiffSummary(bitmapA = [], bitmapB = []) {
 const rowCount = Math.max(bitmapA.length || 0, bitmapB.length || 0);
 let changedRows = 0;
 let mismatchPixels = 0;
 let overlapRows = 0;
 for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
  const a = String(bitmapA[rowIndex] ?? '00000000').padStart(8, '0');
  const b = String(bitmapB[rowIndex] ?? '00000000').padStart(8, '0');
  let rowMismatch = 0;
  for (let i = 0; i < 8; i += 1) {
   if (a[i] !== b[i]) rowMismatch += 1;
  }
  if (rowMismatch > 0) changedRows += 1;
  mismatchPixels += rowMismatch;
  if ((bitmapA[rowIndex] ?? null) != null && (bitmapB[rowIndex] ?? null) != null) overlapRows += 1;
 }
 return {
  rowCount,
  changedRows,
  overlapRows,
  mismatchPixels,
  densityPct: rowCount > 0 ? Math.round((mismatchPixels / (rowCount * 8)) * 100) : 0,
 };
}

function getSelectedTimelineSample() {
 const timeline = visiblePort.inspectVisibleRiverTimeline(memory, { horizon: seamTimelineHorizon });
 if (!timeline.samples.length) return { timeline, sample: null };
 const sample = timeline.samples.find(entry => entry.step === selectedTimelineStep) ?? timeline.samples[0];
 selectedTimelineStep = sample?.step ?? 0;
 return { timeline, sample };
}

function escapeAttr(value) {
 return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setSelectedTimelineStep(step, source = 'timeline sample card', options = {}) {
 const nextStep = Number(step) || 0;
 selectedTimelineStep = nextStep;
 const sourceLabel = String(source || 'timeline sample card');
 timelineSelectionMeta = { step: nextStep, source: sourceLabel };
 pendingTimelineSpotlightStep = options.spotlight === false ? null : nextStep;
 pendingTimelineRevealMode = options.revealMode || (sourceLabel === 'timeline sample card' ? 'card-only' : 'panel');
 renderSeamTimelineViz();
}

function timelineSelectionSpotlightSource(activeSample) {
 if (pendingTimelineSpotlightStep == null || activeSample?.step !== pendingTimelineSpotlightStep) return '';
 return String(timelineSelectionMeta?.source || 'timeline selection jump');
}

function classifyTimelinePrimaryReveal(activeSample, selectedChangeEvent, selectedWrapEvent, selectionSource = '') {
 if (!activeSample) return 'sample';
 const source = String(selectionSource || '').toLowerCase();
 if (source.includes('family transition diagnostic')) return 'family transition';
 if (source.includes('wrap')) return 'wrap boundary';
 if (source.includes('change')) return 'next-head change';
 if (selectedChangeEvent && (selectedChangeEvent.step === activeSample.step || selectedChangeEvent.fromStep === activeSample.step)) return 'next-head change';
 if (selectedWrapEvent && (selectedWrapEvent.previewStep === activeSample.step || selectedWrapEvent.postWrapStep === activeSample.step)) return 'wrap boundary';
 return activeSample.nextStepWrap || activeSample.wrapsSeen > 0 ? 'wrap-adjacent sample' : 'future seam sample';
}

function describeTimelinePrimaryReveal(activeSample) {
 if (!activeSample) return 'No active future seam sample is selected.';
 const fromLabel = `${activeSample.currentTailSlot?.slotLabel ?? 'n/a'} ${activeSample.currentTailSlot?.shapeName ?? 'n/a'}`;
 const toLabel = `${activeSample.nextHeadSlot?.slotLabel ?? 'n/a'} ${activeSample.nextHeadSlot?.shapeName ?? 'n/a'}`;
 return `${fromLabel} -> ${toLabel} · ${seamDeltaText(activeSample)}`;
}

function setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, phase, sequenceId) {
 if (sequenceId !== timelineRevealSequenceId) return false;
 if (sequenceNote) sequenceNote.dataset.timelineRevealPhase = phase;
 if (primaryDestination) primaryDestination.dataset.timelineRevealPhase = phase;
 [
  [activeSelectionStatus, 'status'],
  [primaryDestination, 'destination'],
  [activeCard, 'card'],
 ].forEach(([el, target]) => {
  if (!el) return;
  el.dataset.timelineRevealStageTarget = target;
  el.dataset.timelineRevealStageActive = phase === target ? 'true' : 'false';
 });
 sequenceNote?.querySelectorAll('[data-timeline-reveal-step]').forEach(stepEl => {
  stepEl.dataset.timelineRevealStepActive = stepEl.dataset.timelineRevealStep === phase ? 'true' : 'false';
 });
 return true;
}

function elementFullyVisibleInViewport(el, padding = 12) {
 if (!el || typeof el.getBoundingClientRect !== 'function') return false;
 const rect = el.getBoundingClientRect();
 const viewHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
 const viewWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
 if (!viewHeight || !viewWidth) return false;
 return rect.top >= padding
  && rect.left >= padding
  && rect.bottom <= viewHeight - padding
  && rect.right <= viewWidth - padding;
}

function elementWithinPreferredViewportBand(el, options = {}) {
 if (!el || typeof el.getBoundingClientRect !== 'function') return false;
 const rect = el.getBoundingClientRect();
 const viewHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
 if (!viewHeight) return false;
 const topBand = Math.max(18, Math.round(viewHeight * (options.topRatio ?? 0.20)));
 const bottomBand = Math.min(viewHeight - 18, Math.round(viewHeight * (options.bottomRatio ?? 0.78)));
 return rect.top >= topBand
  && rect.bottom <= bottomBand;
}

function elementContainsOrIs(ancestor, node) {
 if (!ancestor || !node) return false;
 if (ancestor === node) return true;
 if (typeof ancestor.contains === 'function') return ancestor.contains(node);
 return false;
}

function resolveTimelinePrimaryViewportTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-primary-anchor="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-anchor="true"]')
  || primaryDestination
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]');
}

function resolveTimelinePrimaryContextTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-primary-reveal-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-reveal-note="true"]')
  || primaryDestination?.querySelector('[data-timeline-primary-jump-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-jump-note="true"]')
  || resolveTimelinePrimaryViewportTarget(primaryDestination);
}

function resolveTimelinePrimaryJumpNoteTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-primary-jump-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-jump-note="true"]')
  || resolveTimelinePrimaryContextTarget(primaryDestination);
}

function resolveTimelinePrimaryStripTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-sample-strip="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-sample-strip="true"]')
  || primaryDestination?.querySelector('[data-timeline-primary-strip-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-strip-note="true"]')
  || resolveTimelinePrimaryViewportTarget(primaryDestination);
}

function resolveTimelinePrimaryStripNoteTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-primary-strip-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-strip-note="true"]')
  || resolveTimelinePrimaryStripTarget(primaryDestination);
}

function resolveTimelinePrimaryAnchorTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-primary-anchor="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-anchor="true"]')
  || resolveTimelinePrimaryViewportTarget(primaryDestination);
}

function resolveTimelinePrimaryStackBandTarget(primaryDestination) {
 return primaryDestination?.querySelector('[data-timeline-primary-jump-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-jump-note="true"]')
  || primaryDestination?.querySelector('[data-timeline-primary-reveal-note="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-reveal-note="true"]')
  || primaryDestination?.querySelector('[data-timeline-primary-anchor="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-anchor="true"]')
  || resolveTimelinePrimaryViewportTarget(primaryDestination);
}

function resolveTimelinePrimaryFocusTarget(primaryDestination, activeCard) {
 return activeCard
  || primaryDestination?.querySelector('[data-timeline-primary-anchor="true"]')
  || seamTimelineVizEl?.querySelector('[data-timeline-primary-anchor="true"]')
  || resolveTimelinePrimaryViewportTarget(primaryDestination);
}

function applyTimelineRevealFocusState(sequenceNote, primaryDestination, activeCard, focusTarget, focusMode = 'card') {
 const liveSequenceNote = sequenceNote || seamTimelineVizEl?.querySelector('[data-timeline-reveal-sequence="true"]');
 const livePrimaryDestination = primaryDestination || seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]');
 const liveFocusTarget = focusTarget || resolveTimelinePrimaryFocusTarget(livePrimaryDestination, activeCard);
 const activeElement = document.activeElement;
 const destinationFocusWithin = elementContainsOrIs(livePrimaryDestination, activeElement);
 const focusTargetFocused = elementContainsOrIs(liveFocusTarget, activeElement);
 const focusTargetVisible = elementFullyVisibleInViewport(liveFocusTarget);
 const focusLabel = focusMode === 'returned-card'
  ? 'Keyboard focus returned to the exact card'
  : focusMode === 'returned-anchor'
   ? 'Keyboard focus returned to the landing anchor'
   : focusMode === 'anchor'
    ? 'Keyboard focus is on the landing anchor'
    : 'Keyboard focus is on the exact card';
 [liveSequenceNote, livePrimaryDestination].forEach(el => {
  if (!el) return;
  el.dataset.timelineRevealFocusWithin = destinationFocusWithin ? 'true' : 'false';
  el.dataset.timelineRevealFocusVisible = focusTargetVisible ? 'true' : 'false';
  el.dataset.timelineRevealFocusTarget = focusMode;
 });
 if (liveFocusTarget) {
  liveFocusTarget.dataset.timelineRevealFocusActive = focusTargetFocused ? 'true' : 'false';
 }
 if (activeCard && activeCard !== liveFocusTarget) {
  activeCard.dataset.timelineRevealFocusActive = focusMode.includes('card') && focusTargetFocused ? 'true' : 'false';
 }
 const focusNote = liveSequenceNote?.querySelector('[data-timeline-reveal-focus-note]');
 if (focusNote) {
  focusNote.dataset.timelineRevealFocusNote = destinationFocusWithin && focusTargetFocused
   ? 'confirmed'
   : focusMode.startsWith('returned-')
    ? 'returned'
    : 'pending';
  focusNote.textContent = destinationFocusWithin && focusTargetFocused
   ? focusLabel
   : destinationFocusWithin
    ? `${focusLabel} (settling)`
    : 'Keyboard focus still settling';
 }
 return { destinationFocusWithin, focusTargetFocused, focusTargetVisible };
}

function applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, fallbackMode = 'none') {
 const liveSequenceNote = sequenceNote || seamTimelineVizEl?.querySelector('[data-timeline-reveal-sequence="true"]');
 const liveSelectionStatus = activeSelectionStatus || seamTimelineVizEl?.querySelector('[data-timeline-selection-status="true"]');
 const livePrimaryDestination = primaryDestination || seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]');
 const statusVisible = elementFullyVisibleInViewport(liveSelectionStatus);
 const jumpNoteTarget = resolveTimelinePrimaryJumpNoteTarget(livePrimaryDestination);
 const jumpNoteVisible = elementFullyVisibleInViewport(jumpNoteTarget);
 const contextViewportTarget = resolveTimelinePrimaryContextTarget(livePrimaryDestination);
 const contextVisible = elementFullyVisibleInViewport(contextViewportTarget);
 const destinationViewportTarget = resolveTimelinePrimaryViewportTarget(livePrimaryDestination);
 const destinationVisible = elementFullyVisibleInViewport(destinationViewportTarget);
 const anchorViewportTarget = resolveTimelinePrimaryAnchorTarget(livePrimaryDestination);
 const anchorBandVisible = elementWithinPreferredViewportBand(anchorViewportTarget, { topRatio: 0.03, bottomRatio: 0.40 });
 const stackBandTarget = resolveTimelinePrimaryStackBandTarget(livePrimaryDestination);
 const stackBandVisible = elementWithinPreferredViewportBand(stackBandTarget, { topRatio: 0.03, bottomRatio: 0.42 });
 const stripViewportTarget = resolveTimelinePrimaryStripTarget(livePrimaryDestination);
 const stripVisible = elementFullyVisibleInViewport(stripViewportTarget);
 const stripNoteTarget = resolveTimelinePrimaryStripNoteTarget(livePrimaryDestination);
 const cardVisible = elementFullyVisibleInViewport(activeCard);
 const effectiveCardVisible = cardVisible || (fallbackMode === 'recentered' && Boolean(activeCard));
 const cardBandVisible = effectiveCardVisible && elementWithinPreferredViewportBand(activeCard);
 const viewportLabel = fallbackMode === 'recentered'
  ? destinationVisible && effectiveCardVisible
 ? 'Viewport re-centered on landing anchor + exact card'
  : 'Viewport re-centered on exact card'
 : fallbackMode === 'band-nudged'
  ? 'Viewport nudged to keep the exact card in the preferred reading lane'
 : fallbackMode === 'jump-note-nudged'
  ? 'Viewport nudged to keep the primary jump destination cue + landing anchor obvious'
 : fallbackMode === 'anchor-band-nudged'
  ? 'Viewport nudged to keep the landing anchor in the upper reading band'
 : fallbackMode === 'stack-band-nudged'
  ? 'Viewport nudged to keep the primary destination cues in the upper reading band'
 : fallbackMode === 'strip-nudged'
  ? 'Viewport nudged to keep exact-card lane + landing anchor obvious'
 : fallbackMode === 'detail-nudged'
  ? 'Viewport nudged to keep destination detail + landing anchor obvious'
 : fallbackMode === 'status-nudged'
  ? 'Viewport nudged to keep status + landing anchor obvious'
 : fallbackMode === 'context-nudged'
  ? 'Viewport nudged to keep landing anchor obvious'
 : statusVisible && contextVisible && destinationVisible && stripVisible && effectiveCardVisible && cardBandVisible && stackBandVisible
  ? jumpNoteVisible
   ? 'Viewport confirms status + primary jump destination + destination detail + landing anchor + exact-card lane, with the primary destination cues in the upper reading band'
   : 'Viewport confirms status + destination detail + landing anchor + exact-card lane, with the primary destination cues in the upper reading band'
 : statusVisible && contextVisible && destinationVisible && stripVisible && effectiveCardVisible && cardBandVisible
  ? jumpNoteVisible
   ? 'Viewport confirms status + primary jump destination + destination detail + landing anchor + exact-card lane in the preferred reading lane'
   : 'Viewport confirms status + destination detail + landing anchor + exact-card lane in the preferred reading lane'
 : statusVisible && contextVisible && destinationVisible && stripVisible && effectiveCardVisible
  ? jumpNoteVisible
   ? 'Viewport confirms status + primary jump destination + destination detail + landing anchor + exact-card lane'
   : 'Viewport confirms status + destination detail + landing anchor + exact-card lane'
  : contextVisible && destinationVisible && stripVisible && effectiveCardVisible
   ? jumpNoteVisible
    ? 'Viewport confirms primary jump destination + destination detail + landing anchor + exact-card lane'
    : 'Viewport confirms destination detail + landing anchor + exact-card lane'
   : statusVisible && contextVisible && destinationVisible && effectiveCardVisible
    ? jumpNoteVisible
     ? 'Viewport confirms status + primary jump destination + destination detail + landing anchor + exact card'
     : 'Viewport confirms status + destination detail + landing anchor + exact card'
   : contextVisible && destinationVisible && effectiveCardVisible
    ? jumpNoteVisible
     ? 'Viewport confirms primary jump destination + destination detail + landing anchor + exact card'
     : 'Viewport confirms destination detail + landing anchor + exact card'
    : statusVisible && destinationVisible && effectiveCardVisible
     ? jumpNoteVisible
      ? 'Viewport confirms status + primary jump destination + landing anchor + exact card'
      : 'Viewport confirms status + landing anchor + exact card'
   : effectiveCardVisible
    ? destinationVisible
     ? jumpNoteVisible
      ? 'Viewport confirms primary jump destination + landing anchor + exact card'
      : 'Viewport confirms landing anchor + exact card'
     : 'Viewport confirms exact card'
    : 'Viewport check still settling';
 [liveSequenceNote, livePrimaryDestination].forEach(el => {
  if (!el) return;
  el.dataset.timelineRevealStatusVisible = statusVisible ? 'true' : 'false';
  el.dataset.timelineRevealJumpNoteVisible = jumpNoteVisible ? 'true' : 'false';
  el.dataset.timelineRevealContextVisible = contextVisible ? 'true' : 'false';
  el.dataset.timelineRevealDestinationVisible = destinationVisible ? 'true' : 'false';
  el.dataset.timelineRevealAnchorBandVisible = anchorBandVisible ? 'true' : 'false';
  el.dataset.timelineRevealStackBandVisible = stackBandVisible ? 'true' : 'false';
  el.dataset.timelineRevealStripVisible = stripVisible ? 'true' : 'false';
  el.dataset.timelineRevealCardVisible = effectiveCardVisible ? 'true' : 'false';
  el.dataset.timelineRevealCardBandVisible = cardBandVisible ? 'true' : 'false';
  el.dataset.timelineRevealFallback = fallbackMode;
 });
 if (contextViewportTarget) {
  contextViewportTarget.dataset.timelineRevealVisible = contextVisible ? 'true' : 'false';
 }
 if (jumpNoteTarget) {
  jumpNoteTarget.dataset.timelineRevealVisible = jumpNoteVisible ? 'true' : 'false';
 }
 if (destinationViewportTarget) {
  destinationViewportTarget.dataset.timelineRevealVisible = destinationVisible ? 'true' : 'false';
 }
 if (stripViewportTarget) {
  stripViewportTarget.dataset.timelineRevealVisible = stripVisible ? 'true' : 'false';
 }
 if (stripNoteTarget) {
  stripNoteTarget.dataset.timelineRevealVisible = stripVisible ? 'true' : 'false';
 }
 if (activeCard) {
  activeCard.dataset.timelineRevealVisible = effectiveCardVisible ? 'true' : 'false';
  activeCard.dataset.timelineRevealCardBandVisible = cardBandVisible ? 'true' : 'false';
 }
 const viewportNote = liveSequenceNote?.querySelector('[data-timeline-reveal-viewport-note]');
 if (viewportNote) {
  viewportNote.dataset.timelineRevealViewportNote = fallbackMode === 'recentered'
   ? 'recentered'
  : fallbackMode === 'band-nudged'
   ? 'band-nudged'
  : fallbackMode === 'jump-note-nudged'
   ? 'jump-note-nudged'
  : fallbackMode === 'anchor-band-nudged'
   ? 'anchor-band-nudged'
  : fallbackMode === 'stack-band-nudged'
   ? 'stack-band-nudged'
  : fallbackMode === 'strip-nudged'
   ? 'strip-nudged'
  : fallbackMode === 'detail-nudged'
   ? 'detail-nudged'
  : fallbackMode === 'status-nudged'
   ? 'status-nudged'
   : fallbackMode === 'context-nudged'
    ? 'context-nudged'
    : effectiveCardVisible
     ? 'confirmed'
     : 'settling';
  viewportNote.textContent = viewportLabel;
 }
 return { statusVisible, jumpNoteVisible, contextVisible, destinationVisible, anchorBandVisible, stackBandVisible, stripVisible, cardVisible: effectiveCardVisible, cardBandVisible };
}

function revealTimelinePrimaryDestination(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, revealMode) {
 const sequenceId = ++timelineRevealSequenceId;
 const focusStep = String(activeCard?.dataset.timelineStep || primaryDestination?.dataset.timelinePrimaryFocusStep || '');
 const jumpNoteTarget = resolveTimelinePrimaryJumpNoteTarget(primaryDestination);
 const contextViewportTarget = resolveTimelinePrimaryContextTarget(primaryDestination);
 const destinationViewportTarget = resolveTimelinePrimaryViewportTarget(primaryDestination);
 const stripViewportTarget = resolveTimelinePrimaryStripTarget(primaryDestination);
 const initialFocusTarget = resolveTimelinePrimaryFocusTarget(primaryDestination, activeCard);
 const initialFocusMode = initialFocusTarget && initialFocusTarget !== activeCard ? 'anchor' : 'card';
 const applyLiveFocusState = (focusMode = initialFocusMode) => {
  const livePrimaryDestination = seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]') || primaryDestination;
  const liveActiveCard = focusStep
   ? seamTimelineVizEl?.querySelector(`[data-timeline-role="sample-card"][data-timeline-step="${focusStep}"]`)
   : activeCard;
  const liveFocusTarget = resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard);
  return applyTimelineRevealFocusState(sequenceNote, livePrimaryDestination, liveActiveCard, liveFocusTarget, focusMode);
 };
 const ensureRevealFocus = (focusMode = 'card') => {
  const livePrimaryDestination = seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]') || primaryDestination;
  const liveActiveCard = focusStep
   ? seamTimelineVizEl?.querySelector(`[data-timeline-role="sample-card"][data-timeline-step="${focusStep}"]`)
   : activeCard;
  const fallbackFocusTarget = resolveTimelinePrimaryViewportTarget(livePrimaryDestination);
  const preferredFocusTarget = focusMode.includes('anchor')
   ? (fallbackFocusTarget || liveActiveCard)
   : (liveActiveCard || fallbackFocusTarget);
  const activeElement = document.activeElement;
  if (preferredFocusTarget && !elementContainsOrIs(livePrimaryDestination, activeElement)) {
   preferredFocusTarget.focus?.({ preventScroll: true });
   return applyTimelineRevealFocusState(sequenceNote, livePrimaryDestination, liveActiveCard, preferredFocusTarget, focusMode);
  }
  return applyTimelineRevealFocusState(sequenceNote, livePrimaryDestination, liveActiveCard, preferredFocusTarget, focusMode.replace('returned-', ''));
 };
  const finalizeViewportState = (fallbackMode = 'none') => {
 [220, 520, 920, 1600].forEach(delayMs => {
  window.setTimeout(() => {
   if (sequenceId !== timelineRevealSequenceId) return;
   const liveSequenceNote = seamTimelineVizEl?.querySelector('[data-timeline-reveal-sequence="true"]') || sequenceNote;
   const liveSelectionStatus = seamTimelineVizEl?.querySelector('[data-timeline-selection-status="true"]') || activeSelectionStatus;
   const livePrimaryDestination = seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]') || primaryDestination;
   const liveJumpNoteTarget = resolveTimelinePrimaryJumpNoteTarget(livePrimaryDestination) || jumpNoteTarget;
   const liveDestinationViewportTarget = resolveTimelinePrimaryViewportTarget(livePrimaryDestination) || destinationViewportTarget;
   const liveAnchorViewportTarget = resolveTimelinePrimaryAnchorTarget(livePrimaryDestination);
   const liveStackBandTarget = resolveTimelinePrimaryStackBandTarget(livePrimaryDestination);
   const liveActiveCard = focusStep
    ? seamTimelineVizEl?.querySelector(`[data-timeline-role="sample-card"][data-timeline-step="${focusStep}"]`)
    : activeCard;
   const liveViewportState = applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, fallbackMode);
   if (revealMode === 'panel' && fallbackMode !== 'jump-note-nudged' && liveActiveCard && liveViewportState.cardVisible && !liveViewportState.jumpNoteVisible) {
    liveJumpNoteTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
    liveDestinationViewportTarget?.focus?.({ preventScroll: true });
    requestAnimationFrame(() => {
     if (sequenceId !== timelineRevealSequenceId) return;
     applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'jump-note-nudged');
     applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
     window.setTimeout(() => {
      if (sequenceId !== timelineRevealSequenceId) return;
      applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'jump-note-nudged');
      applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
     }, 260);
    });
    return;
   }
   if (revealMode === 'panel' && fallbackMode !== 'anchor-band-nudged' && liveActiveCard && liveViewportState.cardVisible && liveViewportState.destinationVisible && liveViewportState.contextVisible && liveViewportState.jumpNoteVisible && !liveViewportState.anchorBandVisible) {
    liveAnchorViewportTarget?.focus?.({ preventScroll: true });
    liveAnchorViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
    if (!elementFullyVisibleInViewport(liveActiveCard)) {
     liveActiveCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
    requestAnimationFrame(() => {
     if (sequenceId !== timelineRevealSequenceId) return;
     applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'anchor-band-nudged');
     applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
     window.setTimeout(() => {
      if (sequenceId !== timelineRevealSequenceId) return;
      applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'anchor-band-nudged');
      applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
     }, 260);
    });
    return;
   }
   if (revealMode === 'panel' && fallbackMode !== 'stack-band-nudged' && liveActiveCard && liveViewportState.cardVisible && liveViewportState.destinationVisible && liveViewportState.contextVisible && liveViewportState.jumpNoteVisible && !liveViewportState.stackBandVisible) {
    liveStackBandTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
    liveActiveCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    liveDestinationViewportTarget?.focus?.({ preventScroll: true });
    requestAnimationFrame(() => {
     if (sequenceId !== timelineRevealSequenceId) return;
     applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'stack-band-nudged');
     applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
     window.setTimeout(() => {
      if (sequenceId !== timelineRevealSequenceId) return;
      applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'stack-band-nudged');
      applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
     }, 260);
    });
    return;
   }
   applyTimelineRevealFocusState(liveSequenceNote, livePrimaryDestination, liveActiveCard, resolveTimelinePrimaryFocusTarget(livePrimaryDestination, liveActiveCard), initialFocusMode);
  }, delayMs);
 });
};
 setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, 'status', sequenceId);
 applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, 'none');
 applyLiveFocusState(initialFocusMode);
 if (revealMode === 'panel') {
  activeSelectionStatus?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
 }
 const centerPrimaryDestination = () => {
  if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, 'destination', sequenceId)) return;
  if (revealMode === 'panel') {
   destinationViewportTarget?.focus?.({ preventScroll: true });
   destinationViewportTarget?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }
  requestAnimationFrame(() => {
   if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, 'card', sequenceId)) return;
   if (activeCard) {
    activeCard.focus({ preventScroll: true });
    activeCard.scrollIntoView({ block: revealMode === 'panel' ? 'center' : 'nearest', inline: 'nearest', behavior: 'smooth' });
   }
   requestAnimationFrame(() => {
    const liveActiveCard = focusStep
     ? seamTimelineVizEl?.querySelector(`[data-timeline-role="sample-card"][data-timeline-step="${focusStep}"]`)
     : activeCard;
    const viewportState = applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'none');
    const focusState = applyLiveFocusState('card');
    if (revealMode === 'panel' && liveActiveCard && !focusState.destinationFocusWithin) {
     ensureRevealFocus('returned-card');
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && viewportState.destinationVisible && !viewportState.contextVisible) {
     contextViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     if (!contextViewportTarget || contextViewportTarget === destinationViewportTarget) {
      destinationViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     }
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'detail-nudged');
      finalizeViewportState('detail-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && viewportState.destinationVisible && !viewportState.statusVisible) {
     activeSelectionStatus?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     contextViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     if (!contextViewportTarget || contextViewportTarget === destinationViewportTarget) {
      destinationViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     }
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'status-nudged');
      finalizeViewportState('status-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && !viewportState.jumpNoteVisible) {
     jumpNoteTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     destinationViewportTarget?.focus?.({ preventScroll: true });
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'jump-note-nudged');
      finalizeViewportState('jump-note-nudged');
      window.setTimeout(() => {
       if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
       applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'jump-note-nudged');
      }, 260);
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && viewportState.destinationVisible && viewportState.contextVisible && viewportState.jumpNoteVisible && !viewportState.anchorBandVisible) {
     const anchorViewportTarget = resolveTimelinePrimaryAnchorTarget(primaryDestination) || destinationViewportTarget;
     anchorViewportTarget?.focus?.({ preventScroll: true });
     anchorViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     if (!elementFullyVisibleInViewport(liveActiveCard)) {
      liveActiveCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
     }
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'anchor-band-nudged');
      finalizeViewportState('anchor-band-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && viewportState.destinationVisible && viewportState.contextVisible && viewportState.jumpNoteVisible && !viewportState.stackBandVisible) {
     const stackBandTarget = resolveTimelinePrimaryStackBandTarget(primaryDestination) || jumpNoteTarget || contextViewportTarget || destinationViewportTarget;
     stackBandTarget?.focus?.({ preventScroll: true });
     stackBandTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     liveActiveCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'stack-band-nudged');
      finalizeViewportState('stack-band-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.destinationVisible && viewportState.contextVisible && !viewportState.stripVisible) {
     stripViewportTarget?.focus?.({ preventScroll: true });
     stripViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     liveActiveCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'strip-nudged');
      finalizeViewportState('strip-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && viewportState.destinationVisible && viewportState.contextVisible && viewportState.stripVisible && !viewportState.cardBandVisible) {
     stripViewportTarget?.focus?.({ preventScroll: true });
     stripViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     liveActiveCard.focus({ preventScroll: true });
     liveActiveCard.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'band-nudged');
      finalizeViewportState('band-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && viewportState.cardVisible && !viewportState.destinationVisible) {
     contextViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     if (!contextViewportTarget || contextViewportTarget === destinationViewportTarget) {
      destinationViewportTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
     }
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'context-nudged');
      finalizeViewportState('context-nudged');
     });
     return;
    }
    if (revealMode === 'panel' && liveActiveCard && !viewportState.cardVisible) {
     primaryDestination?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
     liveActiveCard.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
     requestAnimationFrame(() => {
      if (!setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId)) return;
      applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'recentered');
      finalizeViewportState('recentered');
     });
     return;
    }
    setTimelineRevealSequenceState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'settled', sequenceId);
    applyTimelineRevealViewportState(sequenceNote, activeSelectionStatus, primaryDestination, liveActiveCard, 'none');
    ensureRevealFocus('card');
    finalizeViewportState('none');
   });
  });
 };
 requestAnimationFrame(centerPrimaryDestination);
}

function renderTimelineMetricStrip(timeline, sample, metric) {
 const values = timeline.samples.map(entry => Number(metric.getValue(entry))).filter(value => Number.isFinite(value));
 const min = values.length ? Math.min(...values) : 0;
 const max = values.length ? Math.max(...values) : 1;
 const span = Math.max(1, max - min);
 const bars = timeline.samples.map(entry => {
  const value = Number(metric.getValue(entry));
  const ratio = Number.isFinite(value) ? (value - min) / span : 0;
  const selected = entry.step === sample.step;
  const color = selected ? '#ffe066' : entry.nextStepWrap ? '#ff8fab' : entry.wrapsSeen > 0 ? '#ffd166' : (metric.color || '#5cc8ff');
  const label = `t+${entry.step} ${metric.label} ${Number.isFinite(value) ? value : 'n/a'}`;
  return `<button type="button" data-timeline-step="${entry.step}" title="${escapeAttr(label)}" style="flex:1 1 0;min-width:10px;height:44px;padding:0 2px;border:1px solid rgba(255,255,255,0.08);border-top:3px solid ${color};background:${selected ? 'rgba(255,224,102,0.10)' : 'rgba(19,27,48,0.50)'};display:flex;align-items:flex-end;justify-content:center"><span style="display:block;width:100%;height:${Math.max(4, Math.round(ratio * 34) + 4)}px;background:${color};border-radius:4px 4px 0 0;opacity:${selected ? 1 : 0.85}"></span></button>`;
 }).join('');
 return `<div style="margin-top:10px"><div class="tiny" style="margin-bottom:6px">${metric.title} (${min}..${max})</div><div style="display:flex;gap:4px;align-items:flex-end">${bars}</div></div>`;
}

function buildFutureChangeRowHighlight(changeEvent, sample, row) {
 if (!changeEvent?.beforeSample || !changeEvent?.afterSample || !sample || !row) return null;
 if (row.source !== 'next') return null;
 if (sample.step === changeEvent.fromStep) {
  return {
   accent: '#5cc8ff',
   background: 'rgba(92,200,255,0.10)',
   label: 'selected next-head change: before row',
  };
 }
 if (sample.step === changeEvent.step) {
  return {
   accent: '#74f0b8',
   background: 'rgba(116,240,184,0.10)',
   label: 'selected next-head change: after row',
  };
 }
 return null;
}

function renderSelectedChangeFutureRowPair(changeEvent, activeSample) {
 if (!changeEvent?.beforeSample?.nextHeadSlot || !changeEvent?.afterSample?.nextHeadSlot) return '';
 const renderRowCard = (sample, label, accent) => {
  const slot = sample.nextHeadSlot;
  const slotForBitmap = {
   shapeName: slot.shapeName,
   shapeId: slot.shapeId,
   slotIndex: 0,
   state1: { refp1Label: 'straight', nusiz: 0 },
   coarseX: slot.inspectX ?? 0,
   inspectX: slot.inspectX ?? 0,
  };
  const bitmap = resolveSlotSprite(slotForBitmap, sample.frameCnt).bitmap;
  const rowKey = (sample.compositeRows || []).find(row => row.source === 'next')?.rowKey ?? 'next-head row';
  const isSelected = activeSample?.step === sample.step;
  return `<button type="button" class="bitmap-compare-card clickable ${isSelected ? 'timeline-linked-card timeline-linked-card-active' : 'timeline-linked-card'}" data-timeline-step="${sample.step}" data-timeline-role="paired-change-card" data-timeline-source-label="${escapeAttr(label)}" aria-current="${isSelected ? 'true' : 'false'}" style="border:1px solid rgba(255,255,255,0.14);border-top:3px solid ${accent};padding-top:6px;background:${isSelected ? 'rgba(255,224,102,0.10)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%"><div class="mono">${label}</div><div class="tiny">t+${sample.step} · ${rowKey}${isSelected ? ' · selected sample' : ' · click to jump sample'}</div><div class="tiny">${slot.slotLabel ?? 'n/a'} · ${slot.shapeName ?? 'n/a'} · X ${slot.inspectX ?? 'n/a'}</div>${bitmap.length ? renderBitmapChip(bitmap, { pixelSize: 3, color: accent }) : '<div class="tiny">no bitmap</div>'}<div class="tiny">river ${slot.left ?? 'n/a'}..${slot.right ?? 'n/a'} · width ${slot.width ?? 'n/a'}</div></button>`;
 };
 return `<div class="tiny" style="margin:10px 0 8px">Selected next-head change cross-highlights the exact projected next-head row pair below so the before/after samples can be matched directly against the selected future composite-row strip. Click either paired card to jump to that exact timeline sample, focus the active timeline card, and synchronize the strip highlight.</div><div class="bitmap-compare">${renderRowCard(changeEvent.beforeSample, 'change-before projected row', '#5cc8ff')}${renderRowCard(changeEvent.afterSample, 'change-after projected row', '#74f0b8')}</div>`;
}

function renderFutureCompositeRows(sample, selectedChangeEvent = null) {
 const frameCnt = sample.frameCnt ?? visiblePort.getField(memory, 'frameCnt');
 const cards = (sample.compositeRows || []).map((row, index) => {
  const projectedSlot = row.projectedSlot;
  const isCurrentTail = row.source === 'current' && index === Math.max(0, (sample.rowSourceCounts?.current ?? 1) - 1);
  const isNextHead = row.source === 'next';
  const changeHighlight = buildFutureChangeRowHighlight(selectedChangeEvent, sample, row);
  const accent = changeHighlight?.accent ?? (isCurrentTail ? '#5cc8ff' : isNextHead ? '#ffd166' : '#8897c2');
  const slotForBitmap = projectedSlot ? {
   shapeName: projectedSlot.shapeName,
   shapeId: projectedSlot.shapeId,
   slotIndex: row.slotIndex ?? 0,
   state1: { refp1Label: 'straight', nusiz: 0 },
   coarseX: projectedSlot.inspectX ?? 0,
   inspectX: projectedSlot.inspectX ?? 0,
  } : null;
  const bitmap = slotForBitmap ? resolveSlotSprite(slotForBitmap, frameCnt).bitmap : [];
  const label = changeHighlight?.label ?? (isCurrentTail ? 'future current-tail row' : isNextHead ? 'future next-head seam row' : 'future current row');
  return `<div class="bitmap-compare-card" style="border-top:3px solid ${accent};padding-top:6px;background:${changeHighlight?.background ?? 'rgba(19,27,48,0.38)'}"><div class="mono">${index + 1}. ${row.rowKey}</div><div class="tiny">${label}</div><div class="tiny">${row.slotLabel} · ${projectedSlot?.shapeName ?? 'n/a'} · X ${projectedSlot?.inspectX ?? 'n/a'}</div>${bitmap.length ? renderBitmapChip(bitmap, { pixelSize: 2, color: accent }) : '<div class="tiny">no bitmap</div>'}<div class="tiny">river ${row.left}..${row.right} · width ${row.width}</div></div>`;
 }).join('');
 return `${renderSelectedChangeFutureRowPair(selectedChangeEvent, sample)}<div class="tiny" style="margin:10px 0 8px">Selected future sample composite rows stay cloned-memory only; they mirror the projected rows for that sample without mutating the live world canvas. When a next-head change is selected, the matching projected before/after next-head row is marked directly in this strip.</div><div class="bitmap-compare">${cards}</div>`;
}

function renderFutureCompositeRowDiffs(sample) {
 const frameCnt = sample.frameCnt ?? visiblePort.getField(memory, 'frameCnt');
 const rows = Array.isArray(sample?.compositeRows) ? sample.compositeRows : [];
 if (rows.length < 2) return '<div class="tiny" style="margin-top:10px">Need at least two projected rows before row-to-row diff evidence can be shown.</div>';
 const comparisons = [];
 for (let index = 1; index < rows.length; index += 1) {
  const prev = rows[index - 1];
  const current = rows[index];
  const prevSlot = prev.projectedSlot ? {
   shapeName: prev.projectedSlot.shapeName,
   shapeId: prev.projectedSlot.shapeId,
   slotIndex: prev.slotIndex ?? 0,
   state1: { refp1Label: 'straight', nusiz: 0 },
   coarseX: prev.projectedSlot.inspectX ?? 0,
   inspectX: prev.projectedSlot.inspectX ?? 0,
  } : null;
  const currentSlot = current.projectedSlot ? {
   shapeName: current.projectedSlot.shapeName,
   shapeId: current.projectedSlot.shapeId,
   slotIndex: current.slotIndex ?? 0,
   state1: { refp1Label: 'straight', nusiz: 0 },
   coarseX: current.projectedSlot.inspectX ?? 0,
   inspectX: current.projectedSlot.inspectX ?? 0,
  } : null;
  const prevBitmap = prevSlot ? resolveSlotSprite(prevSlot, frameCnt).bitmap : [];
  const currentBitmap = currentSlot ? resolveSlotSprite(currentSlot, frameCnt).bitmap : [];
  const stats = buildBitmapDiffSummary(prevBitmap, currentBitmap);
  comparisons.push({
   prev,
   current,
   stats,
   label: `${prev.rowKey} -> ${current.rowKey}`,
   xDelta: Number.isFinite(current.projectedSlot?.inspectX) && Number.isFinite(prev.projectedSlot?.inspectX)
    ? (current.projectedSlot.inspectX - prev.projectedSlot.inspectX)
    : null,
   widthDelta: Number.isFinite(current.width) && Number.isFinite(prev.width)
    ? (current.width - prev.width)
    : null,
  });
 }
 const cards = comparisons.map((entry, index) => {
  const accent = entry.current.source === 'next' ? '#ffd166' : entry.stats.mismatchPixels > 0 ? '#ff8fab' : '#74f0b8';
  return `<div class="bitmap-compare-card" style="border-top:3px solid ${accent};padding-top:6px"><div class="mono">${index + 1}. ${entry.label}</div><div class="tiny">${entry.prev.slotLabel} ${entry.prev.projectedSlot?.shapeName ?? 'n/a'} -> ${entry.current.slotLabel} ${entry.current.projectedSlot?.shapeName ?? 'n/a'}</div><div class="tiny">rows changed ${entry.stats.changedRows}/${entry.stats.rowCount} · mismatch px ${entry.stats.mismatchPixels} (${entry.stats.densityPct}%)</div><div class="tiny">ΔW ${entry.widthDelta == null ? 'n/a' : (entry.widthDelta >= 0 ? '+' : '') + entry.widthDelta} · ΔX ${entry.xDelta == null ? 'n/a' : (entry.xDelta >= 0 ? '+' : '') + entry.xDelta}</div></div>`;
 }).join('');
 const exportText = comparisons.map(entry => `${entry.label} changedRows=${entry.stats.changedRows}/${entry.stats.rowCount} mismatchPixels=${entry.stats.mismatchPixels} densityPct=${entry.stats.densityPct} widthDelta=${entry.widthDelta ?? 'n/a'} xDelta=${entry.xDelta ?? 'n/a'}`).join(String.fromCharCode(10));
 return `<div class="tiny" style="margin:10px 0 8px">Row-to-row diff evidence compares adjacent projected rows inside the selected future sample. It is a harness-only bitmap continuity aid.</div><div class="bitmap-compare">${cards}</div><div class="compare-head" style="margin-top:10px"><div class="tiny">Row-to-row diff export</div></div><textarea class="bitmap-export" readonly>${escapeHtml(exportText)}</textarea>`;
}

function renderContinuityRuns(timeline, activeSample) {
 const runs = Array.isArray(timeline?.continuityRuns) ? timeline.continuityRuns : [];
 if (!runs.length) return '<div class="tiny" style="margin-top:10px">No next-head continuity run is available for this horizon.</div>';
 const activeRun = runs.find(run => activeSample.step >= run.startStep && activeSample.step <= run.endStep) ?? null;
 const cards = runs.map((run, index) => {
  const selected = activeRun && run.startStep === activeRun.startStep && run.endStep === activeRun.endStep && run.shapeName === activeRun.shapeName;
  const accent = selected ? '#ffe066' : '#74f0b8';
  return `<div class="bitmap-compare-card" style="border-top:3px solid ${accent};padding-top:6px;background:${selected ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'}"><div class="mono">run ${index + 1}</div><div class="tiny">t+${run.startStep}..t+${run.endStep} · ${run.length} samples</div><div class="tiny">${run.slotLabel ?? 'n/a'} · ${run.shapeName ?? 'n/a'}</div><div class="tiny">X ${run.xRange.min ?? 'n/a'}..${run.xRange.max ?? 'n/a'} · W ${run.widthRange.min ?? 'n/a'}..${run.widthRange.max ?? 'n/a'}</div><div class="tiny">${(run.continuityLabels || []).join(', ')}</div></div>`;
 }).join('');
 return `<div style="margin-top:10px"><div class="tiny" style="margin-bottom:6px">Next-head continuity runs (${timeline.continuityRunCount ?? runs.length}; longest ${timeline.longestContinuityRunLength ?? 0})</div><div class="bitmap-compare">${cards}</div></div>`;
}

function renderWrapTrendSummary(timeline) {
 const summary = timeline?.wrapTrendSummary ?? {};
 const multiWrap = timeline?.multiWrapSummary ?? {};
 const events = Array.isArray(timeline?.wrapEvents) ? timeline.wrapEvents : [];
 const lines = events.map((event, index) => `wrap${index + 1} preview=${event.previewStep} post=${event.postWrapStep ?? 'n/a'} seamChanged=${event.seamChangedAcrossWrap} widthDelta=${event.widthDeltaAcrossWrap ?? 'n/a'} xDelta=${event.xDeltaAcrossWrap ?? 'n/a'}`);
 return `<div style="margin-top:10px"><div class="compare-head"><div class="tiny">Wrap-to-wrap trend summary</div></div><div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start"><span style="color:var(--muted)">events:</span><span>${summary.totalWrapEvents ?? 0}</span><span style="color:var(--muted)">multi-wrap:</span><span>${Boolean(multiWrap.multiWrapDetected)} · first ${multiWrap.firstWrapPreviewStep ?? 'n/a'} · last ${multiWrap.lastWrapPreviewStep ?? 'n/a'}</span><span style="color:var(--muted)">seam changes:</span><span>${summary.seamChangedCount ?? 0} changed · ${summary.seamStableCount ?? 0} stable</span><span style="color:var(--muted)">family crossings:</span><span>${summary.familyChangedCount ?? 0} changed · ${summary.familyStableCount ?? 0} stable · ${escapeHtml(formatTransitionCountMap(summary.familyTransitionCounts))}</span><span style="color:var(--muted)">ΔW range:</span><span>${summary.widthDeltaRange?.min ?? 'n/a'}..${summary.widthDeltaRange?.max ?? 'n/a'}</span><span style="color:var(--muted)">ΔX range:</span><span>${summary.xDeltaRange?.min ?? 'n/a'}..${summary.xDeltaRange?.max ?? 'n/a'}</span><span style="color:var(--muted)">wrap gap:</span><span>${summary.wrapPreviewGapRange?.min ?? 'n/a'}..${summary.wrapPreviewGapRange?.max ?? 'n/a'} · avg ${summary.averageWrapPreviewGap ?? 'n/a'}</span></div><textarea class="bitmap-export" readonly style="margin-top:10px">${escapeHtml(lines.join(String.fromCharCode(10)) || 'No wrap events in the current horizon.')}</textarea></div>`;
}

function renderMultiWrapCompareCards(timeline, selectedWrapEvent) {
 const events = Array.isArray(timeline?.wrapEvents) ? timeline.wrapEvents : [];
 if (events.length < 2) return '<div style="margin-top:10px"><div class="tiny">Need at least two wrap boundaries before wrap-to-wrap compare cards can show side-by-side deltas.</div></div>';
 const comparisons = [];
 for (let index = 1; index < events.length; index += 1) {
  const previous = events[index - 1];
  const current = events[index];
  const selectedSide = selectedWrapEvent?.previewStep === previous.previewStep
   ? 'left'
   : selectedWrapEvent?.previewStep === current.previewStep
    ? 'right'
    : '';
  comparisons.push({
   index,
   previous,
   current,
   selected: Boolean(selectedSide),
   selectedSide,
   targetStep: selectedSide === 'left' ? previous.previewStep : current.previewStep,
   previewGap: Number.isFinite(current.previewStep) && Number.isFinite(previous.previewStep) ? current.previewStep - previous.previewStep : null,
   postGap: Number.isFinite(current.postWrapStep) && Number.isFinite(previous.postWrapStep) ? current.postWrapStep - previous.postWrapStep : null,
   widthDeltaDrift: Number.isFinite(current.widthDeltaAcrossWrap) && Number.isFinite(previous.widthDeltaAcrossWrap)
    ? current.widthDeltaAcrossWrap - previous.widthDeltaAcrossWrap
    : null,
   xDeltaDrift: Number.isFinite(current.xDeltaAcrossWrap) && Number.isFinite(previous.xDeltaAcrossWrap)
    ? current.xDeltaAcrossWrap - previous.xDeltaAcrossWrap
    : null,
  });
 }
 const cards = comparisons.map(entry => {
  const accent = entry.selected ? '#ffe066' : '#c59bff';
  const selectionBits = [];
  if (entry.selectedSide === 'left') selectionBits.push(`selected wrap = wrap ${entry.index}`);
  else if (entry.selectedSide === 'right') selectionBits.push(`selected wrap = wrap ${entry.index + 1}`);
  selectionBits.push(`jump target wrap ${entry.selectedSide === 'left' ? entry.index : entry.index + 1} preview`);
  return `<button type="button" class="bitmap-compare-card clickable multi-wrap-compare-card ${entry.selected ? 'multi-wrap-compare-card-active' : ''}" data-multi-wrap-target-step="${entry.targetStep}" data-multi-wrap-pair="${entry.index}-${entry.index + 1}" data-multi-wrap-selected-side="${escapeAttr(entry.selectedSide || 'none')}" style="border:1px solid rgba(255,255,255,0.14);border-top:3px solid ${accent};padding:8px;background:${entry.selected ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%"><div class="mono">wrap ${entry.index} ↔ wrap ${entry.index + 1}</div><div class="tiny">preview gap ${entry.previewGap ?? 'n/a'} · post gap ${entry.postGap ?? 'n/a'} · ${selectionBits.join(' · ')}</div><div class="multi-wrap-compare-grid"><div class="multi-wrap-compare-side ${entry.selectedSide === 'left' ? 'multi-wrap-compare-side-selected' : ''}"><div class="tiny multi-wrap-compare-side-label">wrap ${entry.index}</div><div class="tiny">preview t+${entry.previous.previewStep} → post t+${entry.previous.postWrapStep ?? 'n/a'}</div><div class="tiny">family ${escapeHtml(formatShapeClassTransition(entry.previous.previousShapeClass, entry.previous.currentShapeClass))}</div><div class="tiny">ΔW ${signedMetricLabel(entry.previous.widthDeltaAcrossWrap)} · ΔX ${signedMetricLabel(entry.previous.xDeltaAcrossWrap)}</div><div class="tiny">${entry.previous.seamChangedAcrossWrap ? 'seam changed' : 'seam stable'}</div></div><div class="multi-wrap-compare-side ${entry.selectedSide === 'right' ? 'multi-wrap-compare-side-selected' : ''}"><div class="tiny multi-wrap-compare-side-label">wrap ${entry.index + 1}</div><div class="tiny">preview t+${entry.current.previewStep} → post t+${entry.current.postWrapStep ?? 'n/a'}</div><div class="tiny">family ${escapeHtml(formatShapeClassTransition(entry.current.previousShapeClass, entry.current.currentShapeClass))}</div><div class="tiny">ΔW ${signedMetricLabel(entry.current.widthDeltaAcrossWrap)} · ΔX ${signedMetricLabel(entry.current.xDeltaAcrossWrap)}</div><div class="tiny">${entry.current.seamChangedAcrossWrap ? 'seam changed' : 'seam stable'}</div></div></div><div class="tiny">wrap-to-wrap drift: Δgap ${entry.previewGap ?? 'n/a'} preview / ${entry.postGap ?? 'n/a'} post · Δ(ΔW) ${signedMetricLabel(entry.widthDeltaDrift)} · Δ(ΔX) ${signedMetricLabel(entry.xDeltaDrift)}</div><div class="tiny">family repeat ${escapeHtml(formatShapeClassTransition(entry.previous.previousShapeClass, entry.previous.currentShapeClass))} ⇢ ${escapeHtml(formatShapeClassTransition(entry.current.previousShapeClass, entry.current.currentShapeClass))}</div></button>`;
 }).join('');
 const exportText = comparisons.map(entry => `wrapPair=${entry.index}-${entry.index + 1} previewSteps=${entry.previous.previewStep}->${entry.current.previewStep} postSteps=${entry.previous.postWrapStep ?? 'n/a'}->${entry.current.postWrapStep ?? 'n/a'} previewGap=${entry.previewGap ?? 'n/a'} postGap=${entry.postGap ?? 'n/a'} widthDrift=${entry.widthDeltaDrift ?? 'n/a'} xDrift=${entry.xDeltaDrift ?? 'n/a'} leftFamily=${formatShapeClassTransition(entry.previous.previousShapeClass, entry.previous.currentShapeClass)} rightFamily=${formatShapeClassTransition(entry.current.previousShapeClass, entry.current.currentShapeClass)} selected=${entry.selected} selectedSide=${entry.selectedSide || 'none'} targetStep=${entry.targetStep}`);
 return `<div style="margin-top:10px"><div class="compare-head"><div class="tiny">Multi-wrap compare cards</div></div><div class="tiny" style="margin:6px 0 8px">Each card compares two consecutive wrap boundaries side by side so repeated wrap-to-wrap drift can be audited without leaving the future seam panel. Clicking a card jumps to the selected side when available, otherwise to the later wrap preview.</div><div class="bitmap-compare">${cards}</div><div class="compare-head" style="margin-top:10px"><div class="tiny">Multi-wrap compare export</div></div><textarea class="bitmap-export" readonly data-multi-wrap-export="true">${escapeHtml(exportText.join(String.fromCharCode(10)))}</textarea></div>`;
}

function renderFamilyTransitionDiagnostics(timeline, selectedChangeEvent, selectedWrapEvent) {
 const entries = buildFamilyTransitionDiagnostics(timeline, selectedChangeEvent, selectedWrapEvent);
 if (!entries.length) return '<div style="margin-top:10px"><div class="tiny">No future family-transition diagnostics are available for the current horizon yet.</div></div>';
 const cards = entries.map((entry, index) => {
  const selected = entry.selectedChange || entry.selectedWrap;
  const accent = selected ? '#ffe066' : entry.familyCrossing ? '#ff8fab' : '#74f0b8';
  const targetStep = entry.selectedChange
   ? selectedChangeEvent?.step ?? entry.firstChangeStep ?? entry.firstWrapPreviewStep
   : entry.selectedWrap
    ? selectedWrapEvent?.previewStep ?? entry.firstWrapPreviewStep ?? entry.firstChangeStep
    : entry.firstChangeStep ?? entry.firstWrapPreviewStep;
  const targetLabel = entry.selectedChange
   ? `selected next-head change t+${selectedChangeEvent?.step ?? entry.firstChangeStep ?? 'n/a'}`
   : entry.selectedWrap
    ? `selected wrap preview t+${selectedWrapEvent?.previewStep ?? entry.firstWrapPreviewStep ?? 'n/a'}`
    : entry.firstChangeStep != null
     ? `first family change t+${entry.firstChangeStep}`
     : entry.firstWrapPreviewStep != null
      ? `first family wrap t+${entry.firstWrapPreviewStep}`
      : 'no jump target';
  const flags = [];
  if (entry.familyCrossing) flags.push('family crossing');
  else flags.push('same-family transition');
  if (entry.selectedChange) flags.push('selected next-head change');
  if (entry.selectedWrap) flags.push('selected wrap');
  const evidenceWindowLabel = entry.firstEvidenceStep == null
   ? 'window n/a'
   : `window t+${entry.firstEvidenceStep}..t+${entry.lastEvidenceStep ?? entry.firstEvidenceStep}`;
  const evidenceChips = [
   { text: `${entry.totalEvidenceCount} total events` },
   { text: evidenceWindowLabel },
   { text: entry.dominantEvidenceKind },
   selected ? { text: `selected ${entry.selectedKind}`, warn: true } : null,
  ].filter(Boolean).map(part => `<span class="meta-chip${part.warn ? ' warn' : ''}">${escapeHtml(part.text)}</span>`).join('');
  const cardTag = targetStep != null ? 'button' : 'div';
  const cardAttrs = targetStep != null
   ? ` type="button" class="bitmap-compare-card clickable family-transition-card ${selected ? 'family-transition-card-active' : ''}" data-family-target-step="${targetStep}" data-family-target-label="${escapeAttr(targetLabel)}"`
   : ` class="bitmap-compare-card family-transition-card ${selected ? 'family-transition-card-active' : ''}"`;
  return `<${cardTag}${cardAttrs} data-family-transition-key="${escapeAttr(entry.transitionKey)}" data-family-selected-change="${entry.selectedChange ? 'true' : 'false'}" data-family-selected-wrap="${entry.selectedWrap ? 'true' : 'false'}" data-family-evidence-count="${entry.totalEvidenceCount}" data-family-first-evidence-step="${entry.firstEvidenceStep ?? ''}" data-family-last-evidence-step="${entry.lastEvidenceStep ?? ''}" data-family-dominant-evidence="${escapeAttr(entry.dominantEvidenceKind)}" data-family-selected-kind="${escapeAttr(entry.selectedKind)}" style="border-top:3px solid ${accent};padding-top:6px;background:${selected ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%"><div class="mono">family diag ${index + 1}</div><div class="tiny">${escapeHtml(entry.transitionLabel)}</div><div class="tiny">${flags.join(' · ')}</div><div class="meta-chip-row family-transition-meta-row">${evidenceChips}</div><div class="family-transition-detail-grid"><div class="family-transition-detail-lane"><div class="tiny family-transition-detail-label">next-head change</div><div class="tiny">events ${entry.changeCount}</div><div class="tiny">window ${entry.changeStepRange.min == null ? 'n/a' : `t+${entry.changeStepRange.min}..t+${entry.changeStepRange.max}`}</div><div class="tiny">seam-signature ${entry.seamChangedChangeCount}/${entry.changeCount}</div></div><div class="family-transition-detail-lane"><div class="tiny family-transition-detail-label">wrap boundary</div><div class="tiny">events ${entry.wrapCount}</div><div class="tiny">window ${entry.wrapPreviewRange.min == null ? 'n/a' : `t+${entry.wrapPreviewRange.min}..t+${entry.wrapPreviewRange.max}`}</div><div class="tiny">seam-signature ${entry.seamChangedWrapCount}/${entry.wrapCount}</div></div></div><div class="tiny">jump target: ${escapeHtml(targetLabel)}</div><div class="tiny">example change: ${escapeHtml(entry.exampleChangeLabel || 'n/a')}</div><div class="tiny">example wrap: ${escapeHtml(entry.exampleWrapLabel || 'n/a')}</div></${cardTag}>`;
 }).join('');
 const exportText = entries.map(entry => {
  const targetStep = entry.selectedChange
   ? selectedChangeEvent?.step ?? entry.firstChangeStep ?? entry.firstWrapPreviewStep
   : entry.selectedWrap
    ? selectedWrapEvent?.previewStep ?? entry.firstWrapPreviewStep ?? entry.firstChangeStep
    : entry.firstChangeStep ?? entry.firstWrapPreviewStep;
  const targetLabel = entry.selectedChange
   ? `selectedChange@${selectedChangeEvent?.step ?? entry.firstChangeStep ?? 'n/a'}`
   : entry.selectedWrap
    ? `selectedWrap@${selectedWrapEvent?.previewStep ?? entry.firstWrapPreviewStep ?? 'n/a'}`
    : entry.firstChangeStep != null
     ? `firstChange@${entry.firstChangeStep}`
     : entry.firstWrapPreviewStep != null
      ? `firstWrap@${entry.firstWrapPreviewStep}`
      : 'none';
  return `${entry.transitionKey} label=${entry.transitionLabel} crossing=${entry.familyCrossing} evidenceCount=${entry.totalEvidenceCount} evidenceWindow=${entry.firstEvidenceStep ?? 'n/a'}..${entry.lastEvidenceStep ?? 'n/a'} dominantEvidence=${entry.dominantEvidenceKind} selectedKind=${entry.selectedKind} changeCount=${entry.changeCount} changeStepRange=${entry.changeStepRange.min ?? 'n/a'}..${entry.changeStepRange.max ?? 'n/a'} wrapCount=${entry.wrapCount} wrapPreviewRange=${entry.wrapPreviewRange.min ?? 'n/a'}..${entry.wrapPreviewRange.max ?? 'n/a'} seamChangedChangeCount=${entry.seamChangedChangeCount} seamChangedWrapCount=${entry.seamChangedWrapCount} selectedChange=${entry.selectedChange} selectedWrap=${entry.selectedWrap} targetStep=${targetStep ?? 'n/a'} targetLabel=${targetLabel}`;
 }).join(String.fromCharCode(10));
 return `<div style="margin-top:10px"><div class="compare-head"><div class="tiny">Object-family transition diagnostics</div></div><div class="tiny" style="margin:6px 0 8px">These cards aggregate excerpt-backed next-head change and wrap events by object family so selected future seam transitions can be audited by family, not only by isolated sample. When a family card has change or wrap evidence, clicking it jumps to the most relevant excerpt-backed sample for that family.</div><div class="bitmap-compare">${cards}</div><div class="compare-head" style="margin-top:10px"><div class="tiny">Family-transition export</div></div><textarea class="bitmap-export" readonly data-family-transition-export="true">${escapeHtml(exportText)}</textarea></div>`;
}

function renderWorldRowViz() {
 if (!worldRowVizEl) return;
 const row = getSelectedWorldRow();
 if (!row?.projectedSlot) {
  worldRowVizEl.innerHTML = '<div class="tiny">No visible world row is selected yet. Click or pin a canvas row, use Prev/Next row, or jump directly to the current-tail / next-head seam rows.</div>';
  return;
 }
 const rowIndex = lastWorldRenderRows.findIndex(entry => entry.rowKey === row.rowKey);
 const prevRow = rowIndex > 0 ? lastWorldRenderRows[rowIndex - 1] : null;
 const nextRow = rowIndex >= 0 && rowIndex < lastWorldRenderRows.length - 1 ? lastWorldRenderRows[rowIndex + 1] : null;
 const slot = row.projectedSlot;
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const resolved = resolveSlotSprite(slot, frameCnt);
 const meta = SPRITE_VARIANT_META[resolved.variantName] || {};
 const exportText = [
  `rowKey=${row.rowKey}`,
  `source=${row.source}`,
  `slot=${SLOT_NAMES[row.slotIndexWrapped]} ${slot.shapeName}`,
  `variant=${resolved.variantName}`,
  `parity=${describeFrameParity(frameCnt)}`,
  `river=${row.left}..${row.right} width=${row.width}`,
  `inspectX=${slot.inspectX ?? slot.coarseX}`,
  bitmapRowsText(resolved.bitmap),
 ].join('\n');
 const selectionLabel = worldHoverPinned && pinnedWorldHover.rowKey === row.rowKey ? 'pinned row' : 'selected-slot row';
 const neighborCard = (neighbor, label) => {
  if (!neighbor?.projectedSlot) return `<div class="bitmap-compare-card"><div class="mono">${label}</div><div class="tiny">n/a</div></div>`;
  const neighborResolved = resolveSlotSprite(neighbor.projectedSlot, frameCnt);
  return `<div class="bitmap-compare-card" style="border-top:3px solid ${neighbor.source === 'next' ? '#ffd166' : '#5cc8ff'};padding-top:6px">
   <div class="mono">${label}</div>
   <div class="tiny">${neighbor.rowKey}</div>
   <div class="tiny">${SLOT_NAMES[neighbor.slotIndexWrapped]} · ${neighbor.projectedSlot.shapeName} · ${neighborResolved.variantName}</div>
   ${renderBitmapChip(neighborResolved.bitmap, { pixelSize: 3, color: neighbor.source === 'next' ? '#ffd166' : '#8fb6ff' })}
   <div class="tiny">river ${neighbor.left}..${neighbor.right} · width ${neighbor.width}</div>
  </div>`;
 };
 worldRowVizEl.innerHTML = `
  <div class="bitmap-stack">
   ${renderBitmapChip(resolved.bitmap, { pixelSize: 5, color: row.source === 'next' ? '#ffd166' : '#5cc8ff' })}
   <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start">
    <span style="color:var(--muted)">selection:</span><span>${selectionLabel}</span>
    <span style="color:var(--muted)">row key:</span><span class="mono">${row.rowKey}</span>
    <span style="color:var(--muted)">row index:</span><span>${rowIndex + 1} / ${lastWorldRenderRows.length}</span>
    <span style="color:var(--muted)">slot:</span><span>${SLOT_NAMES[row.slotIndexWrapped]} · ${slot.shapeName}</span>
    <span style="color:var(--muted)">row source:</span><span>${row.source === 'next' ? 'projected next-head seam row' : 'current visible row'}</span>
    <span style="color:var(--muted)">bitmap:</span><span class="mono">${resolved.variantName} · ${parityBadgeHtml(frameCnt)}</span>
    <span style="color:var(--muted)">river:</span><span>${row.left}..${row.right} (width ${row.width})</span>
    <span style="color:var(--muted)">inspect X:</span><span>${slot.inspectX ?? slot.coarseX}</span>
    <span style="color:var(--muted)">PF bytes:</span><span>${toHex(slot.pf1Low)} / ${toHex(slot.pf2Low)}</span>
    <span style="color:var(--muted)">ROM meta:</span><span>${meta.cpuAddr || 'n/a'}${meta.romOffset ? ` · ${meta.romOffset}` : ''}${meta.sourceLine ? ` · asm ${meta.sourceLine}` : ''}</span>
   </div>
  </div>
  <div class="tiny" style="margin-top:8px">DOM-backed row mirror for cases where canvas hover/click verification is flaky. This mirrors the actual rendered row selection rather than the old fixed band estimate.</div>
  <div class="compare-head" style="margin-top:8px"><div class="tiny">Neighbor row compare</div></div>
  <div class="bitmap-compare">${neighborCard(prevRow, 'previous')}<div class="bitmap-compare-card" style="border-top:3px solid #ffe066;padding-top:6px"><div class="mono">current</div><div class="tiny">${row.rowKey}</div><div class="tiny">${SLOT_NAMES[row.slotIndexWrapped]} · ${slot.shapeName} · ${resolved.variantName}</div>${renderBitmapChip(resolved.bitmap, { pixelSize: 3, color: row.source === 'next' ? '#ffd166' : '#ffe066' })}<div class="tiny">river ${row.left}..${row.right} · width ${row.width}</div></div>${neighborCard(nextRow, 'next')}</div>
  <div class="compare-head" style="margin-top:8px"><div class="tiny">Selected world row bitmap rows</div><button id="copyWorldRowExport" class="tiny-button" type="button">Copy row</button></div>
  <div id="copyWorldRowStatus" class="copy-status"></div>
  <textarea class="bitmap-export" readonly>${escapeHtml(exportText)}</textarea>`;
 const copyButton = document.getElementById('copyWorldRowExport');
 if (copyButton && !copyButton._bound) {
  copyButton._bound = true;
  copyButton.addEventListener('click', copyWorldRowExportText);
 }
 if (prevWorldRowButton) prevWorldRowButton.disabled = !lastWorldRenderRows.length || lastWorldRenderRows[0]?.rowKey === row.rowKey;
 if (nextWorldRowButton) nextWorldRowButton.disabled = !lastWorldRenderRows.length || lastWorldRenderRows.at(-1)?.rowKey === row.rowKey;
 if (jumpCurrentTailButton) jumpCurrentTailButton.disabled = !findWorldRenderRowByKey(riverScrollRowKey('current-tail'));
 if (jumpNextHeadButton) jumpNextHeadButton.disabled = !findWorldRenderRowByKey(riverScrollRowKey('next-head'));
 if (clearWorldPinButton) clearWorldPinButton.disabled = !worldHoverPinned;
}

function riverScrollRowKey(phase) {
 const rows = lastWorldRenderRows;
 if (!rows.length) return '';
 if (phase === 'current-tail') return rows.findLast?.(row => row.source === 'current')?.rowKey ?? rows.filter(row => row.source === 'current').at(-1)?.rowKey ?? '';
 if (phase === 'next-head') return rows.find(row => row.source === 'next')?.rowKey ?? '';
 return '';
}

function renderCompositeRowsViz() {
 if (!compositeRowsVizEl) return;
 if (!lastWorldRenderRows.length) {
  compositeRowsVizEl.innerHTML = '<div class="tiny">No composite rows have been rendered yet.</div>';
  return;
 }
 const frameCnt = visiblePort.getField(memory, 'frameCnt');
 const selectedRowKey = getSelectedWorldRow()?.rowKey ?? '';
 const cards = lastWorldRenderRows.map((row, index) => {
  const slot = row.projectedSlot;
  if (!slot) return '';
  const resolved = resolveSlotSprite(slot, frameCnt);
  const prev = index > 0 ? lastWorldRenderRows[index - 1] : null;
  const widthDelta = prev ? row.width - prev.width : 0;
  const xDelta = prev ? ((slot.inspectX ?? slot.coarseX ?? 0) - (prev.projectedSlot?.inspectX ?? prev.projectedSlot?.coarseX ?? 0)) : 0;
  const accent = row.rowKey === selectedRowKey ? '#ffe066' : row.source === 'next' ? '#ffd166' : '#5cc8ff';
  return `<button type="button" class="bitmap-compare-card clickable" data-world-row-key="${row.rowKey}" style="border:1px solid rgba(255,255,255,0.14);border-top:3px solid ${accent};padding:8px;background:${row.rowKey === selectedRowKey ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%">
   <div class="mono">${index + 1}. ${row.rowKey}</div>
   <div class="tiny">${row.source === 'next' ? 'projected next-head seam row' : 'current visible row'}</div>
   <div class="tiny">${SLOT_NAMES[row.slotIndexWrapped]} · ${slot.shapeName} · ${resolved.variantName}</div>
   ${renderBitmapChip(resolved.bitmap, { pixelSize: 2, color: accent })}
   <div class="tiny">river ${row.left}..${row.right} · width ${row.width}${prev ? ` · ΔW ${widthDelta >= 0 ? '+' : ''}${widthDelta}` : ''}</div>
   <div class="tiny">inspect X ${slot.inspectX ?? slot.coarseX}${prev ? ` · ΔX ${xDelta >= 0 ? '+' : ''}${xDelta}` : ''}</div>
  </button>`;
 }).join('');
 compositeRowsVizEl.innerHTML = `<div class="tiny" style="margin-bottom:8px">Every rendered composite row is now selectable from plain DOM, not only from canvas hover. Current rows stay blue, the projected seam row stays gold, and the selected row gets the bright accent.</div><div class="bitmap-compare">${cards}</div>`;
 compositeRowsVizEl.querySelectorAll('[data-world-row-key]').forEach(card => {
  if (card._bound) return;
  card._bound = true;
  card.addEventListener('click', () => selectWorldRowByKey(card.dataset.worldRowKey));
 });
}

function renderSeamScrollViz() {
 if (!seamScrollVizEl) return;
 const scroll = visiblePort.inspectVisibleRiverScrollState(memory);
 const currentBitmap = scroll.currentTailSlot ? resolveSlotSprite(scroll.currentTailSlot, visiblePort.getField(memory, 'frameCnt')).bitmap : [];
 const nextBitmap = scroll.nextHeadSlot ? resolveSlotSprite(scroll.nextHeadSlot, visiblePort.getField(memory, 'frameCnt')).bitmap : [];
 const diffRows = buildBitmapDiffRows(currentBitmap, nextBitmap);
 const compareCards = scroll.seamCompareRows.map(entry => {
  const color = entry.source === 'next' ? '#ffd166' : '#5cc8ff';
  const bitmap = entry.shapeName ? (resolveSlotSprite({
   shapeName: entry.shapeName,
   shapeId: entry.shapeId,
   slotIndex: 0,
   state1: { refp1Label: 'straight', nusiz: 0 },
   coarseX: entry.inspectX ?? 0,
   inspectX: entry.inspectX ?? 0,
  }, visiblePort.getField(memory, 'frameCnt')).bitmap) : [];
  return `<div class="bitmap-compare-card" style="border-top:3px solid ${color};padding-top:6px">
   <div class="mono">${entry.phase}</div>
   <div class="tiny">${entry.slotLabel} · ${entry.shapeName || 'n/a'} · X ${entry.inspectX ?? 'n/a'}</div>
   ${bitmap?.length ? renderBitmapChip(bitmap, { pixelSize: 3, color }) : '<div class="tiny">no bitmap</div>'}
   <div class="tiny">river ${entry.left}..${entry.right} · width ${entry.width}</div>
  </div>`;
 }).join('');
 const seamExportText = [
  `blockLine=${scroll.blockLine} ${scroll.blockLineHex}`,
  `scrollPct=${Math.round(scroll.scrollProgress * 100)}`,
  `pixelOffset=${scroll.pixelOffset.toFixed(2)}`,
  `sliceLineSpan=${scroll.sliceLineSpan.toFixed(2)}`,
  `rowCounts=current:${scroll.rowSourceCounts.current} next:${scroll.rowSourceCounts.next} total:${scroll.rowSourceCounts.total}`,
  `seamLabels=${scroll.seamDelta.fromSlotLabel}->${scroll.seamDelta.toSlotLabel}`,
  `seamGeometry=left:${scroll.seamDelta.leftDelta >= 0 ? '+' : ''}${scroll.seamDelta.leftDelta} right:${scroll.seamDelta.rightDelta >= 0 ? '+' : ''}${scroll.seamDelta.rightDelta} width:${scroll.seamDelta.widthDelta >= 0 ? '+' : ''}${scroll.seamDelta.widthDelta} (${seamPctLabel(scroll.seamDelta.widthDeltaPct)})`,
  `seamObject=${scroll.seamDelta.fromShapeName}->${scroll.seamDelta.toShapeName} x:${scroll.seamDelta.xDelta >= 0 ? '+' : ''}${scroll.seamDelta.xDelta} (${scroll.seamDelta.xDirection})`,
  ...scroll.seamCompareRows.map(entry => `${entry.phase} ${entry.slotLabel} ${entry.shapeName} river=${entry.left}..${entry.right} width=${entry.width} x=${entry.inspectX ?? 'n/a'}`),
 ].join('\n');
 seamScrollVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start">
   <span style="color:var(--muted)">block line:</span><span>${scroll.blockLine} (${scroll.blockLineHex})</span>
   <span style="color:var(--muted)">scroll:</span><span>${Math.round(scroll.scrollProgress * 100)}% · pixel offset ${scroll.pixelOffset.toFixed(2)} · slice span ${scroll.sliceLineSpan.toFixed(2)}</span>
   <span style="color:var(--muted)">composite rows:</span><span>${scroll.rowSourceCounts.total} total (${scroll.rowSourceCounts.current} current + ${scroll.rowSourceCounts.next} projected seam row)</span>
   <span style="color:var(--muted)">seam labels:</span><span>${scroll.seamDelta.fromSlotLabel} → ${scroll.seamDelta.toSlotLabel}</span>
   <span style="color:var(--muted)">seam geometry:</span><span>ΔL ${scroll.seamDelta.leftDelta >= 0 ? '+' : ''}${scroll.seamDelta.leftDelta}, ΔR ${scroll.seamDelta.rightDelta >= 0 ? '+' : ''}${scroll.seamDelta.rightDelta}, ΔW ${scroll.seamDelta.widthDelta >= 0 ? '+' : ''}${scroll.seamDelta.widthDelta} (${seamPctLabel(scroll.seamDelta.widthDeltaPct)})</span>
   <span style="color:var(--muted)">seam object:</span><span>${scroll.seamDelta.fromShapeName} → ${scroll.seamDelta.toShapeName}${scroll.seamDelta.shapeChanged ? ' (shape changed)' : ' (same family)'} · ΔX ${scroll.seamDelta.xDelta >= 0 ? '+' : ''}${scroll.seamDelta.xDelta} (${scroll.seamDelta.xDirection})</span>
   <span style="color:var(--muted)">scene refresh:</span><span>${scroll.projectedSceneAdvance?.slots?.length || 0} projected slots available for next-head seam preview</span>
  </div>
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Current-tail vs next-head seam compare</div><button id="copySeamExport" class="tiny-button" type="button">Copy seam summary</button></div>
  <div id="copySeamStatus" class="copy-status"></div>
  <div class="bitmap-compare">${compareCards}</div>
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Current-tail vs next-head bitmap diff (A | B | mismatch)</div></div>
  <textarea class="bitmap-export" readonly>${escapeHtml(diffRows.join(String.fromCharCode(10)))}</textarea>
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Seam export text</div></div>
  <textarea class="bitmap-export" readonly>${escapeHtml(seamExportText)}</textarea>
  <div class="tiny" style="margin-top:8px">This panel is a harness-only continuity aid: it compares the outgoing current-tail row against the incoming next-head row without claiming the unseen ROM scrolling stream.</div>`;
 const copyButton = document.getElementById('copySeamExport');
 if (copyButton && !copyButton._bound) {
  copyButton._bound = true;
  copyButton.addEventListener('click', copySeamExportText);
 }
}

function getFilteredTimelineSamples(timeline) {
 const samples = Array.isArray(timeline?.samples) ? timeline.samples : [];
 if (timelineFilterMode === 'changes') {
  const changeSteps = new Set(Array.isArray(timeline?.nextHeadChangeEvents) ? timeline.nextHeadChangeEvents.flatMap(event => [event.fromStep, event.step]) : []);
  return samples.filter(sample => changeSteps.has(sample.step));
 }
 if (timelineFilterMode === 'wraps') return samples.filter(sample => sample.nextStepWrap || sample.wrapsSeen > 0);
 if (timelineFilterMode === 'transitions') return samples.filter(sample => sample.nextStepWrap || sample.wrapsSeen > 0 || (timeline.seamTransitionSteps || []).includes(sample.step));
 return samples;
}

function findTimelineWrapEventBySelectedStep(timeline, sample) {
 const events = Array.isArray(timeline?.wrapEvents) ? timeline.wrapEvents : [];
 if (!sample) return events[0] ?? null;
 return events.find(event => event.previewStep === sample.step || event.postWrapStep === sample.step) ?? events[0] ?? null;
}

function findTimelineNextHeadChangeEventBySelectedStep(timeline, sample) {
 const events = Array.isArray(timeline?.nextHeadChangeEvents) ? timeline.nextHeadChangeEvents : [];
 if (!sample) return events[0] ?? null;
 return events.find(event => event.step === sample.step || event.fromStep === sample.step) ?? events[0] ?? null;
}

function renderWrapEventCards(timeline, selectedWrapEvent) {
 const events = Array.isArray(timeline?.wrapEvents) ? timeline.wrapEvents : [];
 if (!events.length) return '<div class="tiny" style="margin-top:10px">No wrap boundary is inside the current horizon yet. Use a longer horizon or advance the live loop closer to a boundary.</div>';
 return `<div style="margin-top:10px"><div class="tiny" style="margin-bottom:6px">Wrap boundary navigator</div><div class="bitmap-compare">${events.map((event, index) => {
  const selected = selectedWrapEvent && event.previewStep === selectedWrapEvent.previewStep;
  const accent = selected ? '#ffe066' : '#ff8fab';
  return `<button type="button" class="bitmap-compare-card clickable" data-wrap-event-step="${event.previewStep}" style="border:1px solid rgba(255,255,255,0.14);border-top:3px solid ${accent};padding:8px;background:${selected ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%"><div class="mono">wrap ${index + 1}</div><div class="tiny">preview t+${event.previewStep} → post t+${event.postWrapStep ?? 'n/a'}</div><div class="tiny">family ${escapeHtml(formatShapeClassTransition(event.previousShapeClass, event.currentShapeClass))}${event.familyChangedAcrossWrap ? ' · family crossing' : ' · same family'}</div><div class="tiny">ΔW ${event.widthDeltaAcrossWrap == null ? 'n/a' : (event.widthDeltaAcrossWrap >= 0 ? '+' : '') + event.widthDeltaAcrossWrap} · ΔX ${event.xDeltaAcrossWrap == null ? 'n/a' : (event.xDeltaAcrossWrap >= 0 ? '+' : '') + event.xDeltaAcrossWrap}</div><div class="tiny">${event.seamChangedAcrossWrap ? 'seam signature changed' : 'same seam signature across wrap'}</div></button>`;
 }).join('')}</div></div>`;
}

function renderNextHeadChangeCards(timeline, selectedChangeEvent) {
 const events = Array.isArray(timeline?.nextHeadChangeEvents) ? timeline.nextHeadChangeEvents : [];
 if (!events.length) return '<div class="tiny" style="margin-top:10px">No next-head change event is inside the current horizon yet.</div>';
 return `<div style="margin-top:10px"><div class="tiny" style="margin-bottom:6px">Next-head change navigator</div><div class="bitmap-compare">${events.map((event, index) => {
  const selected = selectedChangeEvent && event.step === selectedChangeEvent.step && event.fromStep === selectedChangeEvent.fromStep;
  const accent = selected ? '#ffe066' : '#74f0b8';
  const bits = [];
  if (event.shapeChanged) bits.push('shape change');
  if (event.slotChanged) bits.push('slot change');
  if (event.familyChanged) bits.push('family crossing');
  if (event.nextStepWrap) bits.push('wrap on next step');
  if (event.wrapsSeen > 0) bits.push(`wraps seen ${event.wrapsSeen}`);
  return `<button type="button" class="bitmap-compare-card clickable" data-next-head-change-step="${event.step}" style="border:1px solid rgba(255,255,255,0.14);border-top:3px solid ${accent};padding:8px;background:${selected ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%"><div class="mono">change ${index + 1}</div><div class="tiny">t+${event.fromStep} → t+${event.step}</div><div class="tiny">${event.previousSlotLabel ?? 'n/a'} ${event.previousShapeName ?? 'n/a'} → ${event.currentSlotLabel ?? 'n/a'} ${event.currentShapeName ?? 'n/a'}</div><div class="tiny">family ${escapeHtml(formatShapeClassTransition(event.previousShapeClass, event.currentShapeClass))}</div><div class="tiny">${bits.join(' · ') || event.continuityLabel || 'change'} · ΔX ${event.xDeltaFromPrev == null ? 'n/a' : (event.xDeltaFromPrev >= 0 ? '+' : '') + event.xDeltaFromPrev} · ΔW ${event.widthDeltaFromPrev == null ? 'n/a' : (event.widthDeltaFromPrev >= 0 ? '+' : '') + event.widthDeltaFromPrev}</div></button>`;
 }).join('')}</div></div>`;
}

function renderWrapBoundaryCompare(timeline, wrapEvent) {
 if (!wrapEvent?.beforeSample || !wrapEvent?.afterSample) return '<div class="tiny" style="margin-top:10px">No wrap boundary compare is available for the selected horizon.</div>';
 const before = wrapEvent.beforeSample;
 const after = wrapEvent.afterSample;
 const beforeSlot = before.nextHeadSlot ? { shapeName: before.nextHeadSlot.shapeName, shapeId: before.nextHeadSlot.shapeId, slotIndex: 0, state1: { refp1Label: 'straight', nusiz: 0 }, coarseX: before.nextHeadSlot.inspectX ?? 0, inspectX: before.nextHeadSlot.inspectX ?? 0 } : null;
 const afterSlot = after.nextHeadSlot ? { shapeName: after.nextHeadSlot.shapeName, shapeId: after.nextHeadSlot.shapeId, slotIndex: 0, state1: { refp1Label: 'straight', nusiz: 0 }, coarseX: after.nextHeadSlot.inspectX ?? 0, inspectX: after.nextHeadSlot.inspectX ?? 0 } : null;
 const beforeBitmap = beforeSlot ? resolveSlotSprite(beforeSlot, before.frameCnt).bitmap : [];
 const afterBitmap = afterSlot ? resolveSlotSprite(afterSlot, after.frameCnt).bitmap : [];
 const diffRows = buildBitmapDiffRows(beforeBitmap, afterBitmap);
 const wrapReport = [
  `wrapPreviewStep=${wrapEvent.previewStep}`,
  `postWrapStep=${wrapEvent.postWrapStep ?? 'n/a'}`,
  `before=${before.currentTailSlot?.slotLabel ?? 'n/a'} ${before.currentTailSlot?.shapeName ?? 'n/a'} -> ${before.nextHeadSlot?.slotLabel ?? 'n/a'} ${before.nextHeadSlot?.shapeName ?? 'n/a'}`,
  `after=${after.currentTailSlot?.slotLabel ?? 'n/a'} ${after.currentTailSlot?.shapeName ?? 'n/a'} -> ${after.nextHeadSlot?.slotLabel ?? 'n/a'} ${after.nextHeadSlot?.shapeName ?? 'n/a'}`,
  `familyTransition=${wrapEvent.familyTransitionLabel ?? 'unknown → unknown'}`,
  `familyChangedAcrossWrap=${Boolean(wrapEvent.familyChangedAcrossWrap)}`,
  `widthDeltaAcrossWrap=${wrapEvent.widthDeltaAcrossWrap ?? 'n/a'}`,
  `xDeltaAcrossWrap=${wrapEvent.xDeltaAcrossWrap ?? 'n/a'}`,
  `seamChangedAcrossWrap=${wrapEvent.seamChangedAcrossWrap}`,
 ].join(String.fromCharCode(10));
 return `<div style="margin-top:10px"><div class="compare-head"><div class="tiny">Selected wrap boundary compare</div><button id="copyWrapReport" class="tiny-button" type="button">Copy wrap report</button></div><div id="copyWrapStatus" class="copy-status"></div><div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start"><span style="color:var(--muted)">before wrap:</span><span>t+${before.step} · frame ${before.frameCntHex} · blockLine ${before.blockLineHex} · ${seamDeltaText(before)}</span><span style="color:var(--muted)">after wrap:</span><span>t+${after.step} · frame ${after.frameCntHex} · blockLine ${after.blockLineHex} · ${seamDeltaText(after)}</span><span style="color:var(--muted)">family crossing:</span><span>${escapeHtml(formatShapeClassTransition(wrapEvent.previousShapeClass, wrapEvent.currentShapeClass))} · ${wrapEvent.familyChangedAcrossWrap ? 'family changed across wrap' : 'same object family across wrap'}</span><span style="color:var(--muted)">across wrap:</span><span>ΔW ${wrapEvent.widthDeltaAcrossWrap == null ? 'n/a' : (wrapEvent.widthDeltaAcrossWrap >= 0 ? '+' : '') + wrapEvent.widthDeltaAcrossWrap} · ΔX ${wrapEvent.xDeltaAcrossWrap == null ? 'n/a' : (wrapEvent.xDeltaAcrossWrap >= 0 ? '+' : '') + wrapEvent.xDeltaAcrossWrap} · ${wrapEvent.seamChangedAcrossWrap ? 'signature changed' : 'same signature'}</span></div><div class="bitmap-compare" style="margin-top:10px"><div class="bitmap-compare-card" style="border-top:3px solid #ff8fab;padding-top:6px"><div class="mono">wrap-preview next-head</div><div class="tiny">t+${before.step} · ${before.nextHeadSlot?.slotLabel ?? 'n/a'} · ${before.nextHeadSlot?.shapeName ?? 'n/a'} · ${shapeClassUiLabel(before.nextHeadSlot?.shapeClass ?? wrapEvent.previousShapeClass)} · X ${before.nextHeadSlot?.inspectX ?? 'n/a'}</div>${beforeBitmap.length ? renderBitmapChip(beforeBitmap, { pixelSize: 3, color: '#ff8fab' }) : '<div class="tiny">no bitmap</div>'}<div class="tiny">river ${before.nextHeadSlot?.left ?? 'n/a'}..${before.nextHeadSlot?.right ?? 'n/a'} · width ${before.nextHeadSlot?.width ?? 'n/a'}</div></div><div class="bitmap-compare-card" style="border-top:3px solid #ffd166;padding-top:6px"><div class="mono">post-wrap next-head</div><div class="tiny">t+${after.step} · ${after.nextHeadSlot?.slotLabel ?? 'n/a'} · ${after.nextHeadSlot?.shapeName ?? 'n/a'} · ${shapeClassUiLabel(after.nextHeadSlot?.shapeClass ?? wrapEvent.currentShapeClass)} · X ${after.nextHeadSlot?.inspectX ?? 'n/a'}</div>${afterBitmap.length ? renderBitmapChip(afterBitmap, { pixelSize: 3, color: '#ffd166' }) : '<div class="tiny">no bitmap</div>'}<div class="tiny">river ${after.nextHeadSlot?.left ?? 'n/a'}..${after.nextHeadSlot?.right ?? 'n/a'} · width ${after.nextHeadSlot?.width ?? 'n/a'}</div></div></div><div class="compare-head" style="margin-top:10px"><div class="tiny">Wrap-boundary bitmap diff (A | B | mismatch)</div></div><textarea class="bitmap-export" readonly>${escapeHtml(diffRows.join(String.fromCharCode(10)))}</textarea><div class="compare-head" style="margin-top:10px"><div class="tiny">Wrap report text</div></div><textarea class="bitmap-export" readonly>${escapeHtml(wrapReport)}</textarea></div>`;
}

function renderNextHeadChangeCompare(changeEvent) {
 if (!changeEvent?.beforeSample || !changeEvent?.afterSample) return '<div class="tiny" style="margin-top:10px">No next-head change compare is available for the selected horizon.</div>';
 const before = changeEvent.beforeSample;
 const after = changeEvent.afterSample;
 const beforeSlot = before.nextHeadSlot ? { shapeName: before.nextHeadSlot.shapeName, shapeId: before.nextHeadSlot.shapeId, slotIndex: 0, state1: { refp1Label: 'straight', nusiz: 0 }, coarseX: before.nextHeadSlot.inspectX ?? 0, inspectX: before.nextHeadSlot.inspectX ?? 0 } : null;
 const afterSlot = after.nextHeadSlot ? { shapeName: after.nextHeadSlot.shapeName, shapeId: after.nextHeadSlot.shapeId, slotIndex: 0, state1: { refp1Label: 'straight', nusiz: 0 }, coarseX: after.nextHeadSlot.inspectX ?? 0, inspectX: after.nextHeadSlot.inspectX ?? 0 } : null;
 const beforeBitmap = beforeSlot ? resolveSlotSprite(beforeSlot, before.frameCnt).bitmap : [];
 const afterBitmap = afterSlot ? resolveSlotSprite(afterSlot, after.frameCnt).bitmap : [];
 const diffRows = buildBitmapDiffRows(beforeBitmap, afterBitmap);
 const changeReport = [
  `changeFromStep=${changeEvent.fromStep}`,
  `changeStep=${changeEvent.step}`,
  `before=${before.nextHeadSlot?.slotLabel ?? 'n/a'} ${before.nextHeadSlot?.shapeName ?? 'n/a'}`,
  `after=${after.nextHeadSlot?.slotLabel ?? 'n/a'} ${after.nextHeadSlot?.shapeName ?? 'n/a'}`,
  `familyTransition=${changeEvent.familyTransitionLabel ?? 'unknown → unknown'}`,
  `familyChanged=${Boolean(changeEvent.familyChanged)}`,
  `continuityLabel=${changeEvent.continuityLabel ?? 'n/a'}`,
  `shapeChanged=${Boolean(changeEvent.shapeChanged)}`,
  `slotChanged=${Boolean(changeEvent.slotChanged)}`,
  `xDeltaFromPrev=${changeEvent.xDeltaFromPrev ?? 'n/a'}`,
  `widthDeltaFromPrev=${changeEvent.widthDeltaFromPrev ?? 'n/a'}`,
  `seamSignatureChanged=${Boolean(changeEvent.seamSignatureChanged)}`,
 ].join(String.fromCharCode(10));
 return `<div style="margin-top:10px"><div class="compare-head"><div class="tiny">Selected next-head change compare</div></div><div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start"><span style="color:var(--muted)">before change:</span><span>t+${before.step} · frame ${before.frameCntHex} · blockLine ${before.blockLineHex} · ${seamDeltaText(before)}</span><span style="color:var(--muted)">after change:</span><span>t+${after.step} · frame ${after.frameCntHex} · blockLine ${after.blockLineHex} · ${seamDeltaText(after)}</span><span style="color:var(--muted)">family crossing:</span><span>${escapeHtml(formatShapeClassTransition(changeEvent.previousShapeClass, changeEvent.currentShapeClass))} · ${changeEvent.familyChanged ? 'family changed' : 'same family change'}</span><span style="color:var(--muted)">change kind:</span><span>${changeEvent.continuityLabel ?? 'n/a'} · shape ${Boolean(changeEvent.shapeChanged)} · slot ${Boolean(changeEvent.slotChanged)} · seam signature ${Boolean(changeEvent.seamSignatureChanged)}</span><span style="color:var(--muted)">delta from prev:</span><span>ΔX ${changeEvent.xDeltaFromPrev == null ? 'n/a' : (changeEvent.xDeltaFromPrev >= 0 ? '+' : '') + changeEvent.xDeltaFromPrev} · ΔW ${changeEvent.widthDeltaFromPrev == null ? 'n/a' : (changeEvent.widthDeltaFromPrev >= 0 ? '+' : '') + changeEvent.widthDeltaFromPrev}</span></div><div class="bitmap-compare" style="margin-top:10px"><div class="bitmap-compare-card" style="border-top:3px solid #5cc8ff;padding-top:6px"><div class="mono">before next-head</div><div class="tiny">t+${before.step} · ${before.nextHeadSlot?.slotLabel ?? 'n/a'} · ${before.nextHeadSlot?.shapeName ?? 'n/a'} · ${shapeClassUiLabel(before.nextHeadSlot?.shapeClass ?? changeEvent.previousShapeClass)} · X ${before.nextHeadSlot?.inspectX ?? 'n/a'}</div>${beforeBitmap.length ? renderBitmapChip(beforeBitmap, { pixelSize: 3, color: '#5cc8ff' }) : '<div class="tiny">no bitmap</div>'}<div class="tiny">river ${before.nextHeadSlot?.left ?? 'n/a'}..${before.nextHeadSlot?.right ?? 'n/a'} · width ${before.nextHeadSlot?.width ?? 'n/a'}</div></div><div class="bitmap-compare-card" style="border-top:3px solid #74f0b8;padding-top:6px"><div class="mono">after next-head</div><div class="tiny">t+${after.step} · ${after.nextHeadSlot?.slotLabel ?? 'n/a'} · ${after.nextHeadSlot?.shapeName ?? 'n/a'} · ${shapeClassUiLabel(after.nextHeadSlot?.shapeClass ?? changeEvent.currentShapeClass)} · X ${after.nextHeadSlot?.inspectX ?? 'n/a'}</div>${afterBitmap.length ? renderBitmapChip(afterBitmap, { pixelSize: 3, color: '#74f0b8' }) : '<div class="tiny">no bitmap</div>'}<div class="tiny">river ${after.nextHeadSlot?.left ?? 'n/a'}..${after.nextHeadSlot?.right ?? 'n/a'} · width ${after.nextHeadSlot?.width ?? 'n/a'}</div></div></div><div class="compare-head" style="margin-top:10px"><div class="tiny">Next-head change bitmap diff (A | B | mismatch)</div></div><textarea class="bitmap-export" readonly>${escapeHtml(diffRows.join(String.fromCharCode(10)))}</textarea><div class="compare-head" style="margin-top:10px"><div class="tiny">Next-head change export text</div></div><textarea class="bitmap-export" readonly>${escapeHtml(changeReport)}</textarea><div class="tiny" style="margin-top:8px">This compare is a harness-only next-head change aid. It highlights visible timeline changes without claiming unseen object-stream scheduling.</div></div>`;
}

function renderSeamTimelineViz() {
 if (!seamTimelineVizEl) return;
 const { timeline, sample } = getSelectedTimelineSample();
 if (!sample) {
  seamTimelineVizEl.innerHTML = '<div class="tiny">No future seam samples are available yet.</div>';
  return;
 }
 const filteredSamples = getFilteredTimelineSamples(timeline);
 const visibleSamples = filteredSamples.length ? filteredSamples : timeline.samples;
 if (!visibleSamples.some(entry => entry.step === sample.step)) selectedTimelineStep = visibleSamples[0]?.step ?? sample.step;
 const activeSample = visibleSamples.find(entry => entry.step === selectedTimelineStep) ?? timeline.samples.find(entry => entry.step === selectedTimelineStep) ?? sample;
 const spotlightSource = timelineSelectionSpotlightSource(activeSample);
 const activeSelectionSpotlight = Boolean(spotlightSource);
 const cards = visibleSamples.map(entry => {
  const selected = entry.step === activeSample.step;
  const spotlighted = selected && spotlightSource && entry.step === pendingTimelineSpotlightStep;
  const accent = selected ? '#ffe066' : entry.nextStepWrap ? '#ff8fab' : entry.wrapsSeen > 0 ? '#ffd166' : '#5cc8ff';
  return `<button type="button" class="bitmap-compare-card clickable timeline-sample-card ${selected ? 'timeline-sample-card-active' : ''} ${spotlighted ? 'timeline-sample-card-spotlight' : ''}" data-timeline-step="${entry.step}" data-timeline-role="sample-card" data-selection-source="${escapeAttr(selected ? (timelineSelectionMeta?.source || 'timeline sample card') : '')}" aria-current="${selected ? 'true' : 'false'}" style="border:1px solid rgba(255,255,255,0.14);border-top:3px solid ${accent};padding:8px;background:${selected ? 'rgba(255,224,102,0.08)' : 'rgba(19,27,48,0.38)'};text-align:left;width:100%">
   ${selected ? '<div class="timeline-sample-active-note">Active timeline sample</div>' : ''}
   ${spotlighted ? `<div class="timeline-sample-spotlight-note">Jump target synced from ${escapeHtml(spotlightSource)}</div>` : ''}
   <div class="mono">t+${entry.step} frame${entry.step === 0 ? ' (now)' : ''}</div>
   <div class="tiny">frameCnt ${entry.frameCntHex} · blockLine ${entry.blockLineHex} · scroll ${entry.scrollPct}%</div>
   <div class="tiny">${entry.currentTailSlot?.slotLabel ?? 'n/a'} ${entry.currentTailSlot?.shapeName ?? 'n/a'} → ${entry.nextHeadSlot?.slotLabel ?? 'n/a'} ${entry.nextHeadSlot?.shapeName ?? 'n/a'}</div>
   <div class="tiny">${seamDeltaText(entry)}${entry.nextStepWrap ? ' · wrap on next step' : ''}${entry.wrapsSeen > 0 ? ` · wraps seen ${entry.wrapsSeen}` : ''}</div>
  </button>`;
 }).join('');
 const currentSlot = activeSample.currentTailSlot ? {
  shapeName: activeSample.currentTailSlot.shapeName,
  shapeId: activeSample.currentTailSlot.shapeId,
  slotIndex: 0,
  state1: { refp1Label: 'straight', nusiz: 0 },
  coarseX: activeSample.currentTailSlot.inspectX ?? 0,
  inspectX: activeSample.currentTailSlot.inspectX ?? 0,
 } : null;
 const nextSlot = activeSample.nextHeadSlot ? {
  shapeName: activeSample.nextHeadSlot.shapeName,
  shapeId: activeSample.nextHeadSlot.shapeId,
  slotIndex: 0,
  state1: { refp1Label: 'straight', nusiz: 0 },
  coarseX: activeSample.nextHeadSlot.inspectX ?? 0,
  inspectX: activeSample.nextHeadSlot.inspectX ?? 0,
 } : null;
 const currentBitmap = currentSlot ? resolveSlotSprite(currentSlot, activeSample.frameCnt).bitmap : [];
 const nextBitmap = nextSlot ? resolveSlotSprite(nextSlot, activeSample.frameCnt).bitmap : [];
 const futureDiffRows = buildBitmapDiffRows(currentBitmap, nextBitmap);
 const futureDiffSummary = buildBitmapDiffSummary(currentBitmap, nextBitmap);
 const selectedWrapEvent = findTimelineWrapEventBySelectedStep(timeline, activeSample);
 const selectedChangeEvent = findTimelineNextHeadChangeEventBySelectedStep(timeline, activeSample);
 const continuity = activeSample.nextHeadContinuity ?? {};
 const summaryText = [
  `samples=${timeline.sampleCount}`,
  `visibleSamples=${visibleSamples.length}`,
  `wrapsSeen=${timeline.wrapsSeen}`,
  `wrapEvents=${timeline.wrapEventCount ?? 0}`,
  `firstWrapPreviewStep=${timeline.firstWrapPreviewStep ?? 'n/a'}`,
  `firstPostWrapStep=${timeline.firstPostWrapStep ?? 'n/a'}`,
  `lastWrapPreviewStep=${timeline.lastWrapPreviewStep ?? 'n/a'}`,
  `lastPostWrapStep=${timeline.lastPostWrapStep ?? 'n/a'}`,
  `nextHeadChangeEvents=${timeline.nextHeadChangeCount ?? 0}`,
  `nextHeadFamilyChanged=${timeline.nextHeadChangeSummary?.familyChangedCount ?? 0}`,
  `firstNextHeadChangeStep=${timeline.firstNextHeadChangeStep ?? 'n/a'}`,
  `lastNextHeadChangeStep=${timeline.lastNextHeadChangeStep ?? 'n/a'}`,
  `seamTransitions=${timeline.seamTransitionCount}`,
  `continuityRuns=${timeline.continuityRunCount ?? 0}`,
  `longestContinuityRun=${timeline.longestContinuityRunLength ?? 0}`,
  `nextHeadWidthRange=${timeline.nextHeadWidthRange.min ?? 'n/a'}..${timeline.nextHeadWidthRange.max ?? 'n/a'}`,
  `nextHeadXRange=${timeline.nextHeadXRange.min ?? 'n/a'}..${timeline.nextHeadXRange.max ?? 'n/a'}`,
 ].join(' · ');
 const exportText = [
  `timelineHorizon=${timeline.horizon}`,
  `timelineFilterMode=${timelineFilterMode}`,
  `timelineSummary=${summaryText}`,
  `selectedStep=${activeSample.step}`,
  `frameCnt=${activeSample.frameCnt} ${activeSample.frameCntHex}`,
  `blockLine=${activeSample.blockLine} ${activeSample.blockLineHex}`,
  `scrollPct=${activeSample.scrollPct}`,
  `sectionBlock=${activeSample.sectionBlock} ${activeSample.sectionBlockHex}`,
  `blockOffset=${activeSample.blockOffset} ${activeSample.blockOffsetHex}`,
  `wrapsSeen=${activeSample.wrapsSeen}`,
  `nextStepWrap=${Boolean(activeSample.nextStepWrap)}`,
  `seam=${activeSample.currentTailSlot?.slotLabel ?? 'n/a'} ${activeSample.currentTailSlot?.shapeName ?? 'n/a'} -> ${activeSample.nextHeadSlot?.slotLabel ?? 'n/a'} ${activeSample.nextHeadSlot?.shapeName ?? 'n/a'}`,
  `seamDelta=${seamDeltaText(activeSample)}`,
  `continuity=${continuity.continuityLabel ?? 'n/a'} from t+${continuity.fromStep ?? 'n/a'} sameShape=${Boolean(continuity.sameShape)} sameSlot=${Boolean(continuity.sameSlotLabel)} xDelta=${continuity.xDeltaFromPrev ?? 'n/a'} widthDelta=${continuity.widthDeltaFromPrev ?? 'n/a'}`,
  `selectedNextHeadChange=${selectedChangeEvent ? `${selectedChangeEvent.fromStep}->${selectedChangeEvent.step} ${selectedChangeEvent.previousSlotLabel ?? 'n/a'} ${selectedChangeEvent.previousShapeName ?? 'n/a'} -> ${selectedChangeEvent.currentSlotLabel ?? 'n/a'} ${selectedChangeEvent.currentShapeName ?? 'n/a'} family=${selectedChangeEvent.familyTransitionLabel ?? 'unknown → unknown'}` : 'n/a'}`,
  ...activeSample.seamCompareRows.map(entry => `${entry.phase} ${entry.slotLabel} ${entry.shapeName} river=${entry.left}..${entry.right} width=${entry.width} x=${entry.inspectX ?? 'n/a'}`),
 ].join(String.fromCharCode(10));
 const jumpButtons = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><button class="secondary" type="button" data-timeline-jump="0">Jump to now</button><button class="secondary" type="button" data-timeline-jump="wrap-preview" ${timeline.firstWrapPreviewStep == null ? 'disabled' : ''}>Jump to first wrap preview</button><button class="secondary" type="button" data-timeline-jump="post-wrap" ${timeline.firstPostWrapStep == null ? 'disabled' : ''}>Jump to first post-wrap</button><button class="secondary" type="button" data-timeline-jump="last-wrap-preview" ${timeline.lastWrapPreviewStep == null ? 'disabled' : ''}>Jump to last wrap preview</button><button class="secondary" type="button" data-timeline-jump="last-post-wrap" ${timeline.lastPostWrapStep == null ? 'disabled' : ''}>Jump to last post-wrap</button><button class="secondary" type="button" data-timeline-jump="first-change" ${timeline.firstNextHeadChangeStep == null ? 'disabled' : ''}>Jump to first next-head change</button><button class="secondary" type="button" data-timeline-jump="last-change" ${timeline.lastNextHeadChangeStep == null ? 'disabled' : ''}>Jump to last next-head change</button></div>`;
 const filterButtons = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><button class="secondary ${timelineFilterMode === 'all' ? 'active' : ''}" type="button" data-timeline-filter="all">All samples</button><button class="secondary ${timelineFilterMode === 'wraps' ? 'active' : ''}" type="button" data-timeline-filter="wraps">Wrap-focused</button><button class="secondary ${timelineFilterMode === 'changes' ? 'active' : ''}" type="button" data-timeline-filter="changes">Next-head changes</button><button class="secondary ${timelineFilterMode === 'transitions' ? 'active' : ''}" type="button" data-timeline-filter="transitions">Wraps + transitions</button></div>`;
 const activeSelectionSource = timelineSelectionMeta?.step === activeSample.step ? timelineSelectionMeta.source : 'timeline state sync';
 const activeSelectionLine = `<div class="timeline-selection-status ${activeSelectionSpotlight ? 'timeline-selection-status-spotlight' : ''}" data-timeline-selection-status="true"${activeSelectionSpotlight ? ' data-timeline-reveal-stage-target="status" data-timeline-reveal-stage-active="false"' : ''}><span class="timeline-selection-pill">Active sample</span><span class="mono">t+${activeSample.step}</span><span class="tiny">via ${escapeHtml(activeSelectionSource)}</span>${activeSelectionSpotlight ? `<span class="timeline-selection-spotlight-note">Spotlighted jump target</span>` : ''}</div>`;
 const primaryRevealKind = classifyTimelinePrimaryReveal(activeSample, selectedChangeEvent, selectedWrapEvent, activeSelectionSource);
 const primaryRevealSummary = describeTimelinePrimaryReveal(activeSample);
 const primaryRevealDetail = activeSelectionSpotlight
  ? `<div class="timeline-primary-reveal-note" data-timeline-primary-reveal-note="true" data-timeline-primary-reveal-kind="${escapeAttr(primaryRevealKind)}" data-timeline-primary-reveal-step="${activeSample.step}" data-timeline-primary-reveal-summary="${escapeAttr(primaryRevealSummary)}"><span class="timeline-primary-reveal-pill">Destination card below</span><span class="tiny">${escapeHtml(primaryRevealKind)} · ${escapeHtml(primaryRevealSummary)}</span></div>`
  : '';
 const primaryJumpNote = activeSelectionSpotlight
  ? `<div class="timeline-primary-jump-note" data-timeline-primary-jump-note="true" data-timeline-jump-step="${activeSample.step}" data-timeline-jump-source="${escapeAttr(spotlightSource)}"><span class="timeline-primary-jump-pill">Primary jump destination</span><span class="mono">t+${activeSample.step}</span><span class="tiny">${escapeHtml(spotlightSource)}</span></div>`
  : '';
 const primaryRevealSequenceNote = activeSelectionSpotlight
  ? `<div class="timeline-reveal-sequence-note" data-timeline-reveal-sequence="true" data-timeline-reveal-phase="pending" data-timeline-reveal-source="${escapeAttr(spotlightSource)}" data-timeline-reveal-status-visible="false" data-timeline-reveal-jump-note-visible="false" data-timeline-reveal-context-visible="false" data-timeline-reveal-destination-visible="false" data-timeline-reveal-anchor-band-visible="false" data-timeline-reveal-stack-band-visible="false" data-timeline-reveal-card-visible="false" data-timeline-reveal-fallback="pending" data-timeline-reveal-focus-within="false" data-timeline-reveal-focus-visible="false" data-timeline-reveal-focus-target="pending"><span class="timeline-reveal-sequence-pill">Reveal path</span><span class="timeline-reveal-sequence-step" data-timeline-reveal-step="status" data-timeline-reveal-step-active="false">1 status</span><span class="timeline-reveal-sequence-step" data-timeline-reveal-step="destination" data-timeline-reveal-step-active="false">2 destination</span><span class="timeline-reveal-sequence-step" data-timeline-reveal-step="card" data-timeline-reveal-step-active="false">3 exact card</span><span class="timeline-reveal-viewport-note" data-timeline-reveal-viewport-note="pending">Viewport check pending</span><span class="timeline-reveal-focus-note" data-timeline-reveal-focus-note="pending">Keyboard focus pending</span><span class="tiny">Staged refocus keeps the main landing path obvious after family/wrap/change jumps.</span></div>`
  : '';
 const primaryDestinationAnchor = activeSelectionSpotlight
  ? `<div class="timeline-primary-anchor-note" data-timeline-primary-anchor="true" data-timeline-primary-anchor-step="${activeSample.step}" data-timeline-primary-anchor-kind="${escapeAttr(primaryRevealKind)}" data-timeline-reveal-visible="false" tabindex="-1"><span class="timeline-primary-anchor-pill">Landing anchor</span><span class="mono">t+${activeSample.step}</span><span class="tiny">${escapeHtml(primaryRevealKind)} stays pinned above the exact card during jump refocus.</span></div>`
  : '';
 const primaryStripLeadNote = activeSelectionSpotlight
  ? `<div class="timeline-primary-strip-note" data-timeline-primary-strip-note="true" data-timeline-primary-strip-step="${activeSample.step}" data-timeline-reveal-visible="false" tabindex="-1"><span class="timeline-primary-strip-pill">Exact card lane</span><span class="mono">t+${activeSample.step}</span><span class="tiny">The highlighted sample strip below keeps the excerpt-backed landing card in the same viewport lane after jump refocus.</span></div>`
  : '';
 const summaryGrid = `<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start;margin-top:10px"><span style="color:var(--muted)">timeline:</span><span>${timeline.sampleCount} samples · showing ${visibleSamples.length} · wraps ${timeline.wrapsSeen} · wrap events ${timeline.wrapEventCount ?? 0}</span><span style="color:var(--muted)">wrap steps:</span><span>first preview ${timeline.firstWrapPreviewStep ?? 'n/a'} · first post-wrap ${timeline.firstPostWrapStep ?? 'n/a'} · last preview ${timeline.lastWrapPreviewStep ?? 'n/a'} · last post-wrap ${timeline.lastPostWrapStep ?? 'n/a'}</span><span style="color:var(--muted)">next-head changes:</span><span>${timeline.nextHeadChangeCount ?? 0} total · first ${timeline.firstNextHeadChangeStep ?? 'n/a'} · last ${timeline.lastNextHeadChangeStep ?? 'n/a'} · kinds ${(timeline.nextHeadChangeSummary?.changeKinds || []).join(', ') || 'none'}</span><span style="color:var(--muted)">family crossings:</span><span>${timeline.nextHeadChangeSummary?.familyChangedCount ?? 0} changed · ${timeline.nextHeadChangeSummary?.familyStableCount ?? 0} stable · ${escapeHtml(formatTransitionCountMap(timeline.nextHeadChangeSummary?.familyTransitionCounts))}</span><span style="color:var(--muted)">multi-wrap:</span><span>${Boolean(timeline.multiWrapSummary?.multiWrapDetected)} · gaps ${(timeline.multiWrapSummary?.wrapPreviewGapRange?.min ?? 'n/a')}..${(timeline.multiWrapSummary?.wrapPreviewGapRange?.max ?? 'n/a')} · avg ${timeline.multiWrapSummary?.averageWrapPreviewGap ?? 'n/a'}</span><span style="color:var(--muted)">transitions:</span><span>${timeline.seamTransitionCount} total · steps ${(timeline.seamTransitionSteps || []).join(', ') || 'none'}</span><span style="color:var(--muted)">continuity runs:</span><span>${timeline.continuityRunCount ?? 0} total · longest ${timeline.longestContinuityRunLength ?? 0}</span><span style="color:var(--muted)">next-head width range:</span><span>${timeline.nextHeadWidthRange.min ?? 'n/a'}..${timeline.nextHeadWidthRange.max ?? 'n/a'}</span><span style="color:var(--muted)">next-head X range:</span><span>${timeline.nextHeadXRange.min ?? 'n/a'}..${timeline.nextHeadXRange.max ?? 'n/a'}</span></div>`;
 const widthStrip = renderTimelineMetricStrip(timeline, activeSample, { title: 'Next-head river width strip', label: 'width', getValue: entry => entry.nextHeadSlot?.width, color: '#74f0b8' });
 const xStrip = renderTimelineMetricStrip(timeline, activeSample, { title: 'Next-head inspect X strip', label: 'inspectX', getValue: entry => entry.nextHeadSlot?.inspectX, color: '#c59bff' });
 seamTimelineVizEl.innerHTML = `
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
   <button class="secondary ${seamTimelineHorizon === 8 ? 'active' : ''}" type="button" data-timeline-horizon="8">8 frames</button>
   <button class="secondary ${seamTimelineHorizon === 16 ? 'active' : ''}" type="button" data-timeline-horizon="16">16 frames</button>
   <button class="secondary ${seamTimelineHorizon === 32 ? 'active' : ''}" type="button" data-timeline-horizon="32">32 frames</button>
   <button class="secondary ${seamTimelineHorizon === 64 ? 'active' : ''}" type="button" data-timeline-horizon="64">64 frames</button>
   <button class="secondary ${seamTimelineHorizon === 96 ? 'active' : ''}" type="button" data-timeline-horizon="96">96 frames</button>
   <button id="copyTimelineExport" class="tiny-button" type="button">Copy timeline sample</button>
  </div>
  ${jumpButtons}
  ${filterButtons}
  <div id="copyTimelineStatus" class="copy-status"></div>
  ${activeSelectionLine}
  <div class="timeline-primary-destination" data-timeline-primary-destination="true" data-timeline-reveal-mode="${escapeAttr(pendingTimelineRevealMode || (activeSelectionSpotlight ? 'panel' : 'card-only'))}"${activeSelectionSpotlight ? ' data-timeline-reveal-stage-target="destination" data-timeline-reveal-stage-active="false" data-timeline-reveal-phase="pending" data-timeline-reveal-status-visible="false" data-timeline-reveal-jump-note-visible="false" data-timeline-reveal-context-visible="false" data-timeline-reveal-destination-visible="false" data-timeline-reveal-anchor-band-visible="false" data-timeline-reveal-stack-band-visible="false" data-timeline-reveal-strip-visible="false" data-timeline-reveal-card-visible="false" data-timeline-reveal-fallback="pending" data-timeline-reveal-focus-within="false" data-timeline-reveal-focus-visible="false" data-timeline-reveal-focus-target="pending"' : ''}>
   ${primaryJumpNote}
   ${primaryRevealDetail}
   ${primaryRevealSequenceNote}
   ${primaryDestinationAnchor}
   ${primaryStripLeadNote}
   <div class="tiny" style="margin-bottom:8px">Future samples are derived by stepping the excerpt-limited loop helper on a cloned memory snapshot. Gold cards have already crossed a block wrap; pink cards will wrap on their next step.</div>
   <div class="bitmap-compare timeline-sample-strip" data-timeline-sample-strip="true">${cards}</div>
  </div>
  ${summaryGrid}
  ${renderWrapEventCards(timeline, selectedWrapEvent)}
  ${renderNextHeadChangeCards(timeline, selectedChangeEvent)}
  ${renderWrapTrendSummary(timeline)}
  ${renderMultiWrapCompareCards(timeline, selectedWrapEvent)}
  ${renderFamilyTransitionDiagnostics(timeline, selectedChangeEvent, selectedWrapEvent)}
  ${renderContinuityRuns(timeline, activeSample)}
  ${widthStrip}
  ${xStrip}
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Selected future seam sample: t+${activeSample.step}</div></div>
  <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start">
   <span style="color:var(--muted)">frame:</span><span>${activeSample.frameCnt} (${activeSample.frameCntHex})</span>
   <span style="color:var(--muted)">scroll:</span><span>${activeSample.scrollPct}% · pixel offset ${activeSample.pixelOffset.toFixed(2)}</span>
   <span style="color:var(--muted)">section/block:</span><span>${activeSample.sectionBlock} (${activeSample.sectionBlockHex}) · blockOffset ${activeSample.blockOffsetHex}</span>
   <span style="color:var(--muted)">wraps seen:</span><span>${activeSample.wrapsSeen}${activeSample.nextStepWrap ? ' · next step wraps' : ''}</span>
  <span style="color:var(--muted)">seam:</span><span>${activeSample.currentTailSlot?.slotLabel ?? 'n/a'} ${activeSample.currentTailSlot?.shapeName ?? 'n/a'} → ${activeSample.nextHeadSlot?.slotLabel ?? 'n/a'} ${activeSample.nextHeadSlot?.shapeName ?? 'n/a'}</span>
  <span style="color:var(--muted)">family crossing:</span><span>${selectedChangeEvent ? `${escapeHtml(formatShapeClassTransition(selectedChangeEvent.previousShapeClass, selectedChangeEvent.currentShapeClass))} · ${selectedChangeEvent.familyChanged ? 'selected change crosses families' : 'selected change stays in family'}` : `${shapeClassUiLabel(activeSample.nextHeadSlot?.shapeClass ?? 'unknown')}`}</span>
  <span style="color:var(--muted)">delta:</span><span>${seamDeltaText(activeSample)}</span>
   <span style="color:var(--muted)">continuity:</span><span>${continuity.continuityLabel ?? 'n/a'} from t+${continuity.fromStep ?? 'n/a'} · same shape ${Boolean(continuity.sameShape)} · same slot ${Boolean(continuity.sameSlotLabel)} · ΔX ${continuity.xDeltaFromPrev == null ? 'n/a' : (continuity.xDeltaFromPrev >= 0 ? '+' : '') + continuity.xDeltaFromPrev} · ΔW ${continuity.widthDeltaFromPrev == null ? 'n/a' : (continuity.widthDeltaFromPrev >= 0 ? '+' : '') + continuity.widthDeltaFromPrev}</span>
   <span style="color:var(--muted)">composite rows:</span><span>${activeSample.rowSourceCounts?.total ?? 0} total (${activeSample.rowSourceCounts?.current ?? 0} current + ${activeSample.rowSourceCounts?.next ?? 0} next)</span>
  </div>
  <div class="bitmap-compare" style="margin-top:10px">
   <div class="bitmap-compare-card" style="border-top:3px solid #5cc8ff;padding-top:6px">
    <div class="mono">future current-tail</div>
    <div class="tiny">${activeSample.currentTailSlot?.slotLabel ?? 'n/a'} · ${activeSample.currentTailSlot?.shapeName ?? 'n/a'} · X ${activeSample.currentTailSlot?.inspectX ?? 'n/a'}</div>
    ${currentBitmap?.length ? renderBitmapChip(currentBitmap, { pixelSize: 3, color: '#5cc8ff' }) : '<div class="tiny">no bitmap</div>'}
   </div>
   <div class="bitmap-compare-card" style="border-top:3px solid #ffd166;padding-top:6px">
    <div class="mono">future next-head</div>
    <div class="tiny">${activeSample.nextHeadSlot?.slotLabel ?? 'n/a'} · ${activeSample.nextHeadSlot?.shapeName ?? 'n/a'} · X ${activeSample.nextHeadSlot?.inspectX ?? 'n/a'}</div>
    ${nextBitmap?.length ? renderBitmapChip(nextBitmap, { pixelSize: 3, color: '#ffd166' }) : '<div class="tiny">no bitmap</div>'}
   </div>
  </div>
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Selected future seam bitmap diff (A | B | mismatch)</div></div>
  <div class="tiny" style="margin:6px 0 8px">rows changed ${futureDiffSummary.changedRows}/${futureDiffSummary.rowCount} · mismatch pixels ${futureDiffSummary.mismatchPixels} (${futureDiffSummary.densityPct}%)</div>
  <textarea class="bitmap-export" readonly>${escapeHtml(futureDiffRows.join(String.fromCharCode(10)))}</textarea>
  ${renderWrapBoundaryCompare(timeline, selectedWrapEvent)}
  ${renderNextHeadChangeCompare(selectedChangeEvent)}
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Selected future sample composite rows</div></div>
  ${renderFutureCompositeRows(activeSample, selectedChangeEvent)}
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Adjacent projected row diff evidence</div></div>
  ${renderFutureCompositeRowDiffs(activeSample)}
  <div class="compare-head" style="margin-top:10px"><div class="tiny">Timeline sample export text</div></div>
  <textarea class="bitmap-export" readonly>${escapeHtml(exportText)}</textarea>
  <div class="tiny" style="margin-top:8px">This timeline is a harness-only future seam preview. It does not claim the unseen ROM scheduler or a full continuous stream beyond the excerpt-limited helper.</div>`;
seamTimelineVizEl.querySelectorAll('[data-timeline-step]').forEach(card => {
 if (card._bound) return;
 card._bound = true;
 card.addEventListener('click', () => {
  const sourceLabel = card.dataset.timelineRole === 'paired-change-card'
   ? (card.dataset.timelineSourceLabel || 'paired change-row card')
   : 'timeline sample card';
  setSelectedTimelineStep(card.dataset.timelineStep, sourceLabel);
 });
});
seamTimelineVizEl.querySelectorAll('[data-wrap-event-step]').forEach(card => {
 if (card._bound) return;
 card._bound = true;
 card.addEventListener('click', () => {
  setSelectedTimelineStep(card.dataset.wrapEventStep, 'wrap boundary card');
 });
});
seamTimelineVizEl.querySelectorAll('[data-multi-wrap-target-step]').forEach(card => {
 if (card._bound) return;
 card._bound = true;
 card.addEventListener('click', () => {
  setSelectedTimelineStep(card.dataset.multiWrapTargetStep, 'multi-wrap compare card');
 });
});
seamTimelineVizEl.querySelectorAll('[data-next-head-change-step]').forEach(card => {
 if (card._bound) return;
 card._bound = true;
 card.addEventListener('click', () => {
  setSelectedTimelineStep(card.dataset.nextHeadChangeStep, 'next-head change navigator');
 });
});
seamTimelineVizEl.querySelectorAll('[data-family-target-step]').forEach(card => {
 if (card._bound) return;
 card._bound = true;
 card.addEventListener('click', () => {
  const targetLabel = card.dataset.familyTargetLabel || 'family transition diagnostic';
  setSelectedTimelineStep(card.dataset.familyTargetStep, `family transition diagnostic (${targetLabel})`);
 });
});
seamTimelineVizEl.querySelectorAll('[data-timeline-jump]').forEach(button => {
 if (button._bound) return;
 button._bound = true;
 button.addEventListener('click', () => {
  const mode = button.dataset.timelineJump;
  if (mode === 'wrap-preview' && timeline.firstWrapPreviewStep != null) setSelectedTimelineStep(timeline.firstWrapPreviewStep, 'jump to first wrap preview');
  else if (mode === 'post-wrap' && timeline.firstPostWrapStep != null) setSelectedTimelineStep(timeline.firstPostWrapStep, 'jump to first post-wrap');
  else if (mode === 'last-wrap-preview' && timeline.lastWrapPreviewStep != null) setSelectedTimelineStep(timeline.lastWrapPreviewStep, 'jump to last wrap preview');
  else if (mode === 'last-post-wrap' && timeline.lastPostWrapStep != null) setSelectedTimelineStep(timeline.lastPostWrapStep, 'jump to last post-wrap');
  else if (mode === 'first-change' && timeline.firstNextHeadChangeStep != null) setSelectedTimelineStep(timeline.firstNextHeadChangeStep, 'jump to first next-head change');
  else if (mode === 'last-change' && timeline.lastNextHeadChangeStep != null) setSelectedTimelineStep(timeline.lastNextHeadChangeStep, 'jump to last next-head change');
  else setSelectedTimelineStep(0, 'jump to now');
 });
});
seamTimelineVizEl.querySelectorAll('[data-timeline-filter]').forEach(button => {
  if (button._bound) return;
  button._bound = true;
  button.addEventListener('click', () => {
   timelineFilterMode = button.dataset.timelineFilter || 'all';
   renderSeamTimelineViz();
  });
 });
seamTimelineVizEl.querySelectorAll('[data-timeline-horizon]').forEach(button => {
 if (button._bound) return;
 button._bound = true;
 button.addEventListener('click', () => {
  seamTimelineHorizon = Number(button.dataset.timelineHorizon) || 8;
  selectedTimelineStep = Math.min(selectedTimelineStep, seamTimelineHorizon);
  timelineSelectionMeta = { step: selectedTimelineStep, source: `timeline horizon ${seamTimelineHorizon} frames` };
  pendingTimelineSpotlightStep = selectedTimelineStep;
  renderSeamTimelineViz();
 });
});
const copyButton = document.getElementById('copyTimelineExport');
 if (copyButton && !copyButton._bound) {
  copyButton._bound = true;
  copyButton.addEventListener('click', async () => {
   const textarea = seamTimelineVizEl.querySelector('textarea.bitmap-export:last-of-type') || seamTimelineVizEl.querySelector('textarea.bitmap-export');
   const statusEl = document.getElementById('copyTimelineStatus');
   await writeClipboardTextarea(textarea, statusEl, 'Timeline sample copied.', 'Clipboard unavailable here; use the textarea fallback.');
  });
 }
const wrapCopyButton = document.getElementById('copyWrapReport');
if (wrapCopyButton && !wrapCopyButton._bound) {
 wrapCopyButton._bound = true;
 wrapCopyButton.addEventListener('click', async () => {
  const textareas = seamTimelineVizEl.querySelectorAll('textarea.bitmap-export');
  const textarea = textareas.length >= 2 ? textareas[1] : textareas[0];
  const statusEl = document.getElementById('copyWrapStatus');
  await writeClipboardTextarea(textarea, statusEl, 'Wrap report copied.', 'Clipboard unavailable here; use the textarea fallback.');
 });
}
 const spotlightStep = pendingTimelineSpotlightStep;
if (spotlightStep != null) {
 const revealMode = pendingTimelineRevealMode || 'card-only';
 const sequenceNote = seamTimelineVizEl.querySelector('[data-timeline-reveal-sequence="true"]');
 const activeSelectionStatus = seamTimelineVizEl.querySelector('[data-timeline-selection-status="true"]');
 const primaryDestination = seamTimelineVizEl.querySelector('[data-timeline-primary-destination="true"]');
 const activeCard = seamTimelineVizEl.querySelector(`[data-timeline-role="sample-card"][data-timeline-step="${spotlightStep}"]`);
 if (primaryDestination) primaryDestination.dataset.timelinePrimaryFocusStep = String(spotlightStep);
 if (activeCard) {
  activeCard.dataset.timelineRevealAnchor = 'true';
  activeCard.dataset.timelineRevealStageTarget = 'card';
  activeCard.dataset.timelineRevealStageActive = 'false';
 }
 revealTimelinePrimaryDestination(sequenceNote, activeSelectionStatus, primaryDestination, activeCard, revealMode);
 window.setTimeout(() => {
  const liveSequenceNote = seamTimelineVizEl?.querySelector('[data-timeline-reveal-sequence="true"]');
  const liveSelectionStatus = seamTimelineVizEl?.querySelector('[data-timeline-selection-status="true"]');
  const livePrimaryDestination = seamTimelineVizEl?.querySelector('[data-timeline-primary-destination="true"]');
  const liveActiveCard = seamTimelineVizEl?.querySelector(`[data-timeline-role="sample-card"][data-timeline-step="${spotlightStep}"]`);
  const currentFallback = liveSequenceNote?.dataset.timelineRevealFallback;
  const fallbackMode = currentFallback === 'recentered' || currentFallback === 'context-nudged' || currentFallback === 'strip-nudged' || currentFallback === 'detail-nudged' || currentFallback === 'status-nudged' || currentFallback === 'band-nudged'
   ? currentFallback
   : 'none';
  const viewportState = applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, fallbackMode);
  if (revealMode === 'panel' && livePrimaryDestination && liveActiveCard && viewportState.contextVisible && viewportState.destinationVisible && !viewportState.stripVisible) {
   const liveStripTarget = resolveTimelinePrimaryStripTarget(livePrimaryDestination);
   liveStripTarget?.focus?.({ preventScroll: true });
   liveStripTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
   liveActiveCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
   requestAnimationFrame(() => {
    applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'strip-nudged');
   });
  }
  if (revealMode === 'panel' && livePrimaryDestination && liveActiveCard && viewportState.cardVisible && viewportState.destinationVisible && viewportState.contextVisible && viewportState.stripVisible && !viewportState.cardBandVisible) {
   const liveStripTarget = resolveTimelinePrimaryStripTarget(livePrimaryDestination);
   liveStripTarget?.focus?.({ preventScroll: true });
   liveStripTarget?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
   liveActiveCard.focus({ preventScroll: true });
   liveActiveCard.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
   requestAnimationFrame(() => {
    applyTimelineRevealViewportState(liveSequenceNote, liveSelectionStatus, livePrimaryDestination, liveActiveCard, 'band-nudged');
   });
  }
 }, 260);
 pendingTimelineSpotlightStep = null;
 pendingTimelineRevealMode = '';
}
}

function renderSectionViz(sectionState) {
 const SS = visiblePort.SECTION_STRUCTURE;
 const GC = visiblePort.GAME_CONSTANTS;
 const blocks = SS.blocksPerSection;
 const blockDivs = [];
 for (let i = 0; i < blocks; i++) {
  const bn = blocks - i;
  const isBridge = i === SS.bridgeBlockIndex;
  const isCurrent = bn === sectionState.sectionBlock;
  const bg = isBridge ? '#c9a66b' : (i % 2 === 0 ? '#245b2c' : '#1b5e30');
  const border = isCurrent ? '2px solid #ffd166' : '1px solid rgba(255,255,255,0.15)';
  blockDivs.push(`<div class="blk" style="background:${bg};border:${border};opacity:${isCurrent ? 1 : 0.7}">${bn}</div>`);
 }
 sectionViz.innerHTML = `
  <div style="margin-bottom:8px;font-size:12px;color:var(--muted)">Section (${blocks} raw sectionBlock values; value 1 = bridge sentinel):</div>
  <div class="section-block">${blockDivs.join('')}</div>
  <div style="margin-bottom:8px;font-size:12px;color:var(--muted)">Kernel: ${SS.kernelTotalLines} scanlines/block:</div>
  <div class="kernel-bar"><div class="seg" style="flex:${SS.kernel2LineIterations * 2};background:#2a4d8f">12x2-line</div><div class="seg" style="flex:${SS.kernel1LineIterations};background:#4a2d6f">8x1-line</div></div>
  <div style="font-size:11px;color:var(--muted)">SWITCH_PAGE_ID=${GC.SWITCH_PAGE_ID}; PF pattern >= ${GC.SWITCH_PAGE_ID} uses $FD.</div>
  <div style="font-size:11px;color:var(--muted);margin-top:2px">PF1PatId: ${sectionState.pf1PatIdHex} => page ${sectionState.pf1PatIdPageLabel}; sectionEnd byte: ${sectionState.sectionEndHex} (${sectionState.isSectionEnd ? 'zero sentinel' : 'non-zero byte'})</div>`;
  sectionStateEl.textContent = JSON.stringify(normalize(sectionState), null, 2);
}

function renderSectionEndViz() {
 if (!sectionEndVizEl) return;
 const se = visiblePort.inspectSectionEnd(memory);
 sectionEndVizEl.innerHTML = `
 <div style="font-family:var(--mono);font-size:13px;margin-bottom:4px">sectionEnd = ${se.hex} (${se.raw}) at ${se.addressHex}</div>
 <div>Visible zero-sentinel check: ${se.isSectionEnd ? '<span style="color:var(--warn)">ZERO BYTE</span>' : 'non-zero byte'}</div>
 <div class="tiny" style="margin-top:4px">${se.note}</div>`;
}

// ─── Player/swap inspector ──────────────────────────────────────────
function renderPlayerSwapViz() {
 if (!playerSwapVizEl) return;
 const ps = visiblePort.inspectPlayerSwapState(memory);
 const label = visiblePort.computeSectionBlockLabel(visiblePort.getField(memory, 'sectionBlock'));
 const playerColor = ps.player.isValidPlayerByte ? 'var(--accent2)' : '#f25f5c';
 playerSwapVizEl.innerHTML = `
 <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;margin-bottom:6px">
 <span style="color:var(--muted)">shared ZP window:</span><span>${ps.sharedWindow.rangeHex} (${ps.sharedWindow.length} bytes)</span>
 <span style="color:var(--muted)">gameVariation:</span><span>${ps.gameVariation.hex} (${ps.gameVariation.raw}) at ${ps.gameVariation.addressHex}</span>
 <span style="color:var(--muted)">gameDelay:</span><span>${ps.gameDelay.hex} (${ps.gameDelay.raw}) at ${ps.gameDelay.addressHex}</span>
 <span style="color:var(--muted)">player byte:</span><span style="color:${playerColor}">${ps.player.hex} (${ps.player.raw}) at ${ps.player.addressHex} → ${ps.player.playerLabel}</span>
 <span style="color:var(--muted)">sectionBlock label:</span><span>${label}</span>
 </div>
 <div class="tiny">${ps.note}</div>`;
}

function renderPosYLoViz() {
 if (!posYLoVizEl) return;
 const pl = visiblePort.inspectPosYLo(memory);
 posYLoVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:13px;margin-bottom:4px">posYLo = ${pl.hex} (${pl.raw}) at ${pl.addressHex}</div>
  <div class="tiny">${pl.note}</div>`;
}

function renderPrevPF1PatIdViz() {
 if (!prevPF1PatIdVizEl) return;
 const pi = visiblePort.inspectPrevPF1PatId(memory);
 const pageColor = pi.isOnPageFD ? '#e0a555' : 'var(--accent2)';
 prevPF1PatIdVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">prevPF1PatId:</span><span>${pi.hex} (${pi.raw}) at ${pi.addressHex}</span>
   <span style="color:var(--muted)">page:</span><span style="color:${pageColor}">${pi.pageLabel} (${pi.pageHighByteHex})</span>
  </div>
  <div class="tiny">${pi.note}</div>`;
}

// ─── STATE COLORS ─────────────────────────────────────────────
function renderStateColorViz() {
 if (!stateColorVizEl) return;
 const sc = visiblePort.inspectStateColors(memory);
 let bkBg = visiblePort.ntscColorCss(sc.bkColor);
 let pfBg = visiblePort.ntscColorCss(sc.pfColor);
 stateColorVizEl.innerHTML = `
  <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
   <div style="font-family:var(--mono);font-size:12px;flex:1">
    <div style="font-size:11px;color:var(--muted);margin-bottom:6px">range ${sc.rangeHex}</div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
     <span style="display:inline-block;width:16px;height:16px;background:${bkBg};border:1px solid var(--border);border-radius:2px"></span>
     <span>stateBKColor = ${sc.bkColorHex} at ${sc.bkColorAddressHex} ${sc.bkMatchesExpected ? '(= GREY)' : ''}</span>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
     <span style="display:inline-block;width:16px;height:16px;background:${pfBg};border:1px solid var(--border);border-radius:2px"></span>
     <span>statePFColor = ${sc.pfColorHex} at ${sc.pfColorAddressHex} ${sc.pfMatchesExpected ? '(= YELLOW+2)' : ''}</span>
    </div>
   </div>
  </div>
  <div class="tiny" style="margin-top:4px">"const" fields per excerpt: GREY=0x06 background, YELLOW+2=0x1E playfield. Set by init code NOT in excerpt.</div>`;
}

// ─── PLAYER COLOR ─────────────────────────────────────────────
function renderPlayerColorViz() {
 if (!playerColorVizEl) return;
 const pc = visiblePort.inspectPlayerColor(memory);
 let col = 'var(--muted)';
 if (pc.isYellow) col = visiblePort.ntscColorCss(visiblePort.COLORS.YELLOW);
 else if (pc.isBlack) col = visiblePort.ntscColorCss(visiblePort.COLORS.BLACK);
 else col = visiblePort.ntscColorCss(pc.raw);
 playerColorVizEl.innerHTML = `
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
   <span style="display:inline-block;width:24px;height:24px;border-radius:6px;border:1px solid var(--border);background:${pc.colorCss}"></span>
   <div style="font-family:var(--mono);font-size:12px">${pc.hex} (${pc.raw}) at ${pc.addressHex}
    ${pc.isYellow ? '<span style="color:var(--warn)">YELLOW</span>' : ''}
    ${pc.isBlack ? 'BLACK' : ''}
   </div>
  </div>
  <div class="tiny" style="margin-top:4px">${pc.note}</div>`;
}

function renderKernelLineNumViz() {
 if (!kernelLineNumVizEl) return;
 const kln = visiblePort.inspectKernelLineNum(memory);
 kernelLineNumVizEl.innerHTML = `
 <div style="font-family:var(--mono);font-size:13px;margin-bottom:4px">kernelLineNum = ${kln.hex} (${kln.raw}) at ${kln.addressHex}</div>
 <div class="tiny">${kln.note}</div>`;
}

// PF1PatId inspector ($BC)
function renderPf1PatIdViz() {
  if (!pf1PatIdVizEl) return;
  const p = visiblePort.inspectPF1PatId(memory);
  pf1PatIdVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">PF1PatId:</span><span style="font-weight:bold;color:var(--accent)">${p.hex} (${p.raw}) at ${p.addressHex}</span>
   <span style="color:var(--muted)">Page:</span><span>${p.pageLabel} (high byte ${p.pageHighByteHex.toUpperCase()}) ${p.isOnPageFD ? '<span style="color:var(--warn)">FD page</span>' : '<span style="color:var(--accent2)">FC page</span>'}</span>
   <span style="color:var(--muted)">Threshold:</span><span>SWITCH_PAGE_ID=${p.switchPageId} (ids < ${p.switchPageId} = $FC, >= ${p.switchPageId} = $FD)</span>
  </div>
  <div class="tiny">${p.note}</div>`;
}

// Player1State inspector ($BD..$C1)
function renderPlayer1StateViz() {
  if (!player1StateVizEl) return;
  const p1 = visiblePort.inspectPlayer1State(memory);
  player1StateVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">Range:</span><span>${p1.rangeHex}</span>
   <span style="color:var(--muted)">Hex:</span><span style="color:var(--accent)">${p1.hexDump}</span>
   <span style="color:var(--muted)">level byte:</span><span>${p1.levelHex} (${p1.level}) at ${p1.declaredFields[0].addressHex} <span style="color:var(--muted);font-size:11px">${p1.levelRange}</span></span>
   <span style="color:var(--muted)">randomLoSave byte:</span><span>${p1.randomLoSaveHex} (${p1.randomLoSave}) at ${p1.declaredFields[1].addressHex}</span>
   <span style="color:var(--muted)">randomHiSave byte:</span><span>${p1.randomHiSaveHex} (${p1.randomHiSave}) at ${p1.declaredFields[2].addressHex}</span>
   <span style="color:var(--muted)">saved RNG bytes:</span><span style="color:var(--warn)">${p1.savedRng16Hex}</span>
   <span style="color:var(--muted)">livesPtr low byte:</span><span>${toHex(p1.livesPtrLo)} (${p1.livesPtrLo}) at ${p1.livesPtrLoAddressHex}</span>
   <span style="color:var(--muted)">livesPtr high byte:</span><span>${toHex(p1.livesPtrHi)} (${p1.livesPtrHi}) at ${p1.livesPtrHiAddressHex}</span>
   <span style="color:var(--muted)">livesPtr word:</span><span style="color:var(--accent2)">${p1.livesPtr16Hex}</span>
  </div>
  <div class="tiny">${p1.note}</div>`;
}

function renderFuelDisplayViz() {
 if (!fuelDisplayVizEl) return;
 const fd = visiblePort.inspectFuelDisplayState(memory);
 const barColor = fd.isFuelEmpty ? '#e05555' : fd.fuelPercent < 25 ? '#e0a555' : '#4ecdc4';
 fuelDisplayVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">range:</span><span>${fd.rangeHex}</span>
 <span style="color:var(--muted)">fuelHi:</span><span>${fd.fuelHiHex} (${fd.fuelHi}) at ${fd.fuelHiAddressHex}</span>
 <span style="color:var(--muted)">fuelLo:</span><span>${fd.fuelLoHex} (${fd.fuelLo}) at ${fd.fuelLoAddressHex}</span>
 <span style="color:var(--muted)">fuel16:</span><span>${fd.fuel16Hex} (${fd.fuel16})</span>
 <span style="color:var(--muted)">fuel%:</span><span style="color:${barColor}">${fd.fuelPercentLabel}</span>
 <span style="color:var(--muted)">ballValue:</span><span>${fd.ballValueHex} (${fd.ballValue}) <span style="color:var(--muted);font-size:11px">(fuelHi>>3)+69</span></span>
 <span style="color:var(--muted)">range edge:</span><span>${fd.isFuelFull ? '<span style="color:#4ecdc4">0xFFFF endpoint</span>' : fd.isFuelEmpty ? '<span style="color:#e05555">0x0000 endpoint</span>' : 'interior value'}</span>
 </div>
 <div style="margin-bottom:8px;font-size:11px;color:var(--muted)">MainLoop trace: ${fd.trace.note}</div>
 <div class="mono" style="font-size:10px;color:var(--muted);margin-bottom:4px">LDA=${fd.trace.aAfterLoadHex} LSR1=${fd.trace.lsr1.aAfterLsrHex} LSR2=${fd.trace.lsr2.aAfterLsrHex} LSR3=${fd.trace.lsr3.aAfterLsrHex} ADC=${fd.trace.adc69.afterAddHex} &rarr; SetPosX X=${fd.trace.jsrSetPosX.offset}</div>
 <div class="tiny">${fd.note}</div>`;
}

function renderPlayer2StateViz() {
 if (!player2StateVizEl) return;
 const p2 = visiblePort.inspectPlayer2State(memory);
 player2StateVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">Range:</span><span>${p2.rangeHex}</span>
 <span style="color:var(--muted)">Hex:</span><span style="color:var(--accent)">${p2.hexDump}</span>
 <span style="color:var(--muted)">byte0:</span><span>${p2.declaredFields[0].rawHex} at ${p2.declaredFields[0].addressHex}</span>
 <span style="color:var(--muted)">byte1:</span><span>${p2.declaredFields[1].rawHex} at ${p2.declaredFields[1].addressHex}</span>
 <span style="color:var(--muted)">byte2:</span><span>${p2.declaredFields[2].rawHex} at ${p2.declaredFields[2].addressHex}</span>
 <span style="color:var(--muted)">livesPtr2 alias byte:</span><span>${p2.livesPtr2Hex} (${p2.livesPtr2}) at ${p2.livesPtr2AddressHex} <span style="color:var(--muted);font-size:11px">${p2.livesPtr2Note}</span></span>
 </div>
 <div class="tiny">${p2.note}</div>`;
}

function renderPF1PatIdPageViz() {
 if (!pf1PatIdPageVizEl) return;
 const pp = visiblePort.inspectPF1PatIdPage(memory);
 const pageColor = pp.isOnPageFD ? '#e0a555' : 'var(--accent)';
 const changeColor = pp.pageChanged ? '#e05555' : 'var(--muted)';
 pf1PatIdPageVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">PF1PatId:</span><span>${pp.pf1PatIdHex} (${pp.pf1PatId})</span>
 <span style="color:var(--muted)">page:</span><span style="color:${pageColor}">${pp.pageLabel} (${toHex(pp.pageHighByte, 4)})</span>
 <span style="color:var(--muted)">zone:</span><span>${pp.zoneLabel}</span>
 <span style="color:var(--muted)">SWITCH_PAGE_ID:</span><span>${pp.switchPageId}</span>
 <span style="color:var(--muted)">prevPF1PatId:</span><span>${pp.prevPF1PatIdHex} (${pp.prevPF1PatId}) -> ${pp.prevPageLabel}</span>
 <span style="color:var(--muted)">page change:</span><span style="color:${changeColor}">${pp.pageChangedLabel}</span>
 </div>
 <div class="tiny">${pp.note}</div>`;
}

// ─── Block offset line (computeBlockOffsetLine) ───────────────────────
function renderBlockOffsetLineViz() {
 if (!blockOffsetLineVizEl) return;
 const blockMeta = visiblePort.inspectBlockOffset(memory);
 const blockOff = blockMeta.blockOffset;
 const sectionBlk = visiblePort.getField(memory, 'sectionBlock');
 const bol = visiblePort.computeBlockOffsetLine(blockOff, sectionBlk);
 const phaseColor = bol.isDisplayPhase ? '#4ecdc4' : bol.isSetupPhase ? '#ffa726' : '#e05555';
 const sectionRelativeLabel = bol.sectionRelative == null ? 'n/a' : String(bol.sectionRelative);
 blockOffsetLineVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">blockOffset:</span><span>${toHex(bol.blockOffset)} (${bol.blockOffset}) at ${blockMeta.blockOffsetAddressHex}</span>
 <span style="color:var(--muted)">multiplier:</span><span>${blockMeta.multiplierFormula} = ${blockMeta.blockSize}</span>
 <span style="color:var(--muted)">posYLo:</span><span>${blockMeta.posYLoHex} (${blockMeta.posYLo}) at ${blockMeta.posYLoAddressHex}</span>
 <span style="color:var(--muted)">sectionBlock:</span><span>${toHex(bol.sectionBlock)} (${bol.sectionBlock})</span>
 <span style="color:var(--muted)">sectionRelative:</span><span style="color:var(--accent)">${sectionRelativeLabel}</span>
 <span style="color:var(--muted)">phase:</span><span style="color:${phaseColor}">${bol.phase}</span>
 <span style="color:var(--muted)">valid:</span><span>${bol.isValid ? 'YES' : 'NO'}</span>
 </div>
 <div class="tiny">${bol.note}</div>`;
}

// ─── RNG seed period (rngSeedSequence) ─────────────────────────────────
function renderRngSeedViz() {
 if (!rngSeedVizEl) return;
 const rng16 = visiblePort.readRng16(memory);
 const rs = visiblePort.rngSeedSequence(rng16);
 const periodColor = rs.isMaximal ? '#4ecdc4' : '#e0a555';
 rngSeedVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">seed:</span><span style="color:var(--accent)">${rs.seedHex}</span>
 <span style="color:var(--muted)">period:</span><span style="color:${periodColor}">${rs.period}${rs.isMaximal ? ' (maximal)' : ''}</span>
 <span style="color:var(--muted)">declaredSections:</span><span>${rs.declaredSectionCount}</span>
 </div>
 <div class="tiny">${rs.note}</div>`;
}

// ─── Kernel timing (inspectKernelTiming) ───────────────────────────────
function renderKernelTimingViz() {
 if (!kernelTimingVizEl) return;
 const blockLine = visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.temp3.address);
 const kt = visiblePort.inspectKernelTiming(blockLine);
 const phaseColor = kt.isDisplayPhase ? '#4ecdc4' : kt.isSetupPhase ? '#ffa726' : '#e05555';
 kernelTimingVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">blockLine:</span><span>${kt.blockLineHex} (${kt.blockLine})</span>
 <span style="color:var(--muted)">phase:</span><span style="color:${phaseColor}">${kt.phase}</span>
 <span style="color:var(--muted)">detail:</span><span>${kt.phaseLabel}</span>
 <span style="color:var(--muted)">iteration:</span><span>${kt.iterationInPhase}</span>
 <span style="color:var(--muted)">valid:</span><span>${kt.isValid ? 'YES' : 'NO'}</span>
 <span style="color:var(--muted)">lines/block:</span><span>${kt.totalLinesPerBlock} (display=${kt.twoLinePhaseLines}, setup=${kt.setupPhaseLines})</span>
 </div>
 <div class="tiny">${kt.note}</div>`;
}

// ─── PF1 page address (computePF1PageAddress) ─────────────────────────
function renderPF1PageAddressViz() {
 if (!pf1PageAddressVizEl) return;
 const pf1PatId = visiblePort.getField(memory, 'PF1PatId');
 const pa = visiblePort.computePF1PageAddress(pf1PatId);
 const pageColor = pa.isOnPageFD ? '#e0a555' : 'var(--accent)';
 pf1PageAddressVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">PF1PatId:</span><span>${pa.pf1PatIdHex} (${pa.pf1PatId})</span>
 <span style="color:var(--muted)">page:</span><span style="color:${pageColor}">${pa.pageLabel} (${pa.pageHighByteHex})</span>
 <span style="color:var(--muted)">isOnPageFD:</span><span>${pa.isOnPageFD ? 'YES ($FD)' : 'NO ($FC)'}</span>
 <span style="color:var(--muted)">SWITCH_PAGE_ID:</span><span>${pa.switchPageId}</span>
 </div>
 <div class="tiny">${pa.note}</div>`;
}

// ─── Section block sequence (inspectSectionBlockSequence) ──────────────
function renderSectionBlockSeqViz() {
 if (!sectionBlockSeqVizEl) return;
 const sectionBlk = visiblePort.getField(memory, 'sectionBlock');
 const sbs = visiblePort.inspectSectionBlockSequence(sectionBlk);
 const typeColor = sbs.isBridge ? '#c9a66b' : sbs.isSectionEnd ? '#e05555' : sbs.isNormalBlock ? '#4ecdc4' : '#666';
 const pct = sbs.progressThroughSection == null ? null : Math.round(sbs.progressThroughSection * 100);
 const remainingLabel = sbs.blocksRemaining == null ? 'n/a' : String(sbs.blocksRemaining);
 const progressLabel = pct == null ? 'n/a' : `${pct}%`;
 const progressWidth = pct == null ? 0 : pct;
 sectionBlockSeqVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">sectionBlock:</span><span>${sbs.sectionBlockHex} (${sbs.sectionBlock})</span>
 <span style="color:var(--muted)">label:</span><span style="color:${typeColor}">${sbs.label}</span>
 <span style="color:var(--muted)">remaining:</span><span>${remainingLabel}</span>
 <span style="color:var(--muted)">progress:</span><span>${progressLabel}</span>
 </div>
 <div style="height:6px;background:var(--panel2);border-radius:3px;overflow:hidden;margin-bottom:6px"><div style="width:${progressWidth}%;height:100%;background:${typeColor}"></div></div>
 <div class="tiny">${sbs.note}</div>`;
}

function renderSaverStateViz() {
 if (!saverStateVizEl) return;
 const ss = visiblePort.inspectSaverState(memory);
 const activeColor = ss.isSaverActive ? '#4ecdc4' : '#555';
 saverStateVizEl.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">SS_XOR:</span><span>${ss.xorHex} — ${ss.xorEffect}</span>
 <span style="color:var(--muted)">SS_Mask:</span><span>${ss.maskHex} — ${ss.maskEffect}</span>
 <span style="color:var(--muted)">SS_Delay:</span><span>${ss.delayHex} — <span style="color:${activeColor}">${ss.isSaverActive ? 'delay>0 byte' : 'zero byte'}</span></span>
 </div>
  <div class="tiny">${ss.note}</div>`;
}

// ─── Reset sequence trace (port-only inspector, no memory writes) ────
function renderResetSeqViz() {
  if (!resetSeqVizEl) return;
  const rs = visiblePort.inspectResetSequence(memory);
  const gi = visiblePort.inspectGameInitWindow();
  const rb = visiblePort.inspectResetPreMainBranch(visiblePort.getField(memory, 'random'));
  const sr = visiblePort.inspectSubroutineRegisterSetup();
  let html = '<div style="font-family:var(--mono);font-size:11px">';
  html += `<div style="margin-bottom:6px;color:var(--muted)">Steps: ${rs.totalSteps} | Visible inline: ${rs.visibleInstructions} | JSR calls: ${rs.subroutineCalls}</div>`;
  html += `<div style="margin-bottom:8px;padding:8px 10px;border:1px solid rgba(92,200,255,0.2);border-radius:8px;background:rgba(92,200,255,0.06)"><div style="color:var(--accent);margin-bottom:4px">GameInit window from visible line 311</div><div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px"><span style="color:var(--muted)">ASM:</span><span>${gi.asmLine}</span><span style="color:var(--muted)">X:</span><span>${gi.xRegisterValue} (${gi.xRegisterValueHex})</span><span style="color:var(--muted)">Range:</span><span>${gi.rangeHex} (${gi.totalBytes} bytes)</span><span style="color:var(--muted)">Fields:</span><span>${gi.firstField} → ${gi.lastField} (${gi.fieldCount} declared fields)</span></div></div>`;
  html += `<div style="margin-bottom:8px;padding:8px 10px;border:1px solid rgba(74,240,184,0.25);border-radius:8px;background:rgba(74,240,184,0.07)"><div style="color:#74f0b8;margin-bottom:4px">Subroutine register setup (ASM lines 307-312)</div><div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px">${sr.subroutines.map(s => `<span style="color:var(--muted)">JSR ${s.subroutine}:</span><span>A=${s.registerA.hex ?? '?'} X=${s.registerX.hex}${s.loopCount != null ? ` (loop ${s.loopCount}x)` : ''}${s.byteSpan != null ? ` (${s.byteSpan} bytes ${s.byteSpanStartAddressHex}..${s.byteSpanEndExclusiveHex})` : ''}</span>`).join('')}<span style="color:var(--muted)">Cycles:</span><span>${sr.totalSetupCycles} (${sr.setupCycleBreakdown})</span></div></div>`;
  html += `<div style="margin-bottom:8px;padding:8px 10px;border:1px solid rgba(255,214,102,0.25);border-radius:8px;background:rgba(255,214,102,0.07)"><div style="color:#ffe066;margin-bottom:4px">Live Reset pre-MainLoop branch from visible lines 313-318</div><div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px"><span style="color:var(--muted)">random:</span><span>${rb.rawHex} at ${rb.randomAddressHex}</span><span style="color:var(--muted)">branch:</span><span>${rb.branchOpcode} ${rb.branchOperand} → ${rb.branchOutcome}</span><span style="color:var(--muted)">path:</span><span>${rb.path}</span><span style="color:var(--muted)">first-boot writes:</span><span>${rb.firstBootStepCount ? `livesPtr @ ${rb.livesPtrAddressHex}, scorePtr1+${rb.scorePtr1WriteOffset} @ ${rb.scorePtr1WriteAddressHex}` : 'none (branch taken)'}</span></div></div>`;
  html += '<table style="width:100%;border-collapse:collapse"><tr style="color:var(--accent);text-align:left"><th style="padding:2px 4px">#</th><th style="padding:2px 4px">PC</th><th style="padding:2px 4px">Op</th><th style="padding:2px 4px">Operand</th><th style="padding:2px 4px">Effect</th></tr>';
  rs.steps.forEach((s, i) => {
    const isJsr = s.op === 'JSR';
    const rowColor = isJsr ? 'color:#e05555' : 'color:inherit';
    html += `<tr style="${rowColor}"><td style="padding:2px 4px">${i}</td><td style="padding:2px 4px">${s.pc}</td><td style="padding:2px 4px">${s.op}</td><td style="padding:2px 4px">${s.operand}</td><td style="padding:2px 4px">${s.effect}</td></tr>`;
    if (s.note) html += `<tr style="color:var(--muted);font-size:10px"><td></td><td></td><td></td><td></td><td style="padding:1px 4px">${s.note}</td></tr>`;
  });
  html += '</table>';
  html += `<div class="tiny" style="margin-top:6px">${gi.note}</div>`;
  html += `<div class="tiny" style="margin-top:4px">${sr.note}</div>`;
  html += `<div class="tiny" style="margin-top:4px">${rb.note}</div>`;
  html += `<div class="tiny" style="margin-top:4px">${rs.note}</div>`;
  html += '</div>';
  resetSeqVizEl.innerHTML = html;
}

// ─── Block line / kernel phase (temp3 alias at $FC) ──────────────────
function renderBlockLineViz() {
  if (!blockLineVizEl) return;
  const bl = visiblePort.inspectBlockLineState(memory);
  const phaseColor = bl.phase === '2-line' ? '#4ecdc4' : bl.phase === '1-line' ? '#ffa726' : '#e05555';
  blockLineVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
    <span style="color:var(--muted)">temp3:</span><span>${bl.hex} (${bl.raw})</span>
    <span style="color:var(--muted)">blockLine:</span><span>${bl.blockLine}</span>
    <span style="color:var(--muted)">maxId:</span><span>${bl.maxId} (same byte, different context)</span>
    <span style="color:var(--muted)">Phase:</span><span style="color:${phaseColor}">${bl.phase}</span>
    <span style="color:var(--muted)">In block:</span><span>${bl.inBlock ? 'yes (0..31)' : 'no (>=32)'}</span>
    <span style="color:var(--muted)">2-line loop:</span><span>${bl.inTwoLineLoop}</span>
    <span style="color:var(--muted)">1-line loop:</span><span>${bl.inSingleLineLoop}</span>
  </div>
  <div style="display:flex;gap:2px;height:16px;margin-bottom:6px">
    ${Array.from({length:32}, (_, i) => {
      const active = i === bl.blockLine;
      const c = i < 24 ? '#4ecdc4' : '#ffa726';
      return `<div style="flex:1;background:${active ? c : '#222'};border:1px solid #333" title="line ${i}: ${i < 24 ? '2-line' : '1-line'}"></div>`;
    }).join('')}
  </div>
  <div class="tiny">${bl.note}</div>`;
}

function renderZeroConstsViz() {
 const el = document.getElementById('zeroConstsViz');
 if (!el) return;
 const zc = visiblePort.inspectZeroConsts(memory);
 const z1Color = zc.zero1Invariant ? '#4ecdc4' : '#f25f5c';
 const z2Color = zc.zero2Invariant ? '#4ecdc4' : '#f25f5c';
 el.innerHTML = `
 <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
 <span style="color:var(--muted)">declared endpoints:</span><span>${zc.rangeHex}</span>
 <span style="color:var(--muted)">zero1 ($F3):</span><span style="color:${z1Color}">${zc.zero1Hex} at ${zc.zero1AddressHex} ${zc.zero1Invariant ? 'OK (zero)' : 'VIOLATED (non-zero!)'}</span>
 <span style="color:var(--muted)">zero2 ($F6):</span><span style="color:${z2Color}">${zc.zero2Hex} at ${zc.zero2AddressHex} ${zc.zero2Invariant ? 'OK (zero)' : 'VIOLATED (non-zero!)'}</span>
 <span style="color:var(--muted)">Both zero:</span><span>${zc.bothZero}</span>
 </div>
 <div class="tiny">${zc.note}</div>`;
}

function renderFlagEditor() {
 if (!flagEditorEl) return;
 const blockLstVal = slotModel[selectedSlotIndex].blockLst;
 const state1Val = slotModel[selectedSlotIndex].State1Lst;
 const pfState = visiblePort.getField(memory, 'PF_State');
 function flagBits(value, spec) {
  return spec.map(f => {
   const on = !!(value & f.mask);
   return `<div class="flag-cell ${on ? 'on' : ''}"><div class="bit-num">b${f.bit}</div><div class="bit-name">${f.name}</div><div>${f.desc}</div><input type="checkbox" ${on ? 'checked' : ''} data-flag-area="block" data-mask="${f.mask}"></div>`;
  }).join('');
 }
 // blockLst
 let html = '<div class="flag-group"><h3>blockLst — Slot ' + SLOT_NAMES[selectedSlotIndex] + '</h3><div class="flag-grid">';
 for (const spec of BLOCK_FLAGS_SPEC) {
  const on = !!(blockLstVal & spec.mask);
  html += `<div class="flag-cell ${on ? 'on' : ''}"><div class="bit-num">b${spec.bit}</div><div class="bit-name">${spec.name}</div><div>${spec.desc}</div><input type="checkbox" ${on ? 'checked' : ''} data-flag-area="block" data-mask="${spec.mask}"></div>`;
 }
 html += '</div></div>';
 // State1Lst
 html += '<div class="flag-group"><h3>State1Lst — Slot ' + SLOT_NAMES[selectedSlotIndex] + '</h3><div class="flag-grid">';
 for (const spec of STATE1_FLAGS_SPEC) {
  const on = !!(state1Val & spec.mask);
  html += `<div class="flag-cell ${on ? 'on' : ''}"><div class="bit-num">b${spec.bit}</div><div class="bit-name">${spec.name}</div><div>${spec.desc}</div><input type="checkbox" ${on ? 'checked' : ''} data-flag-area="state" data-mask="${spec.mask}"></div>`;
 }
 html += '</div></div>';
 // PF_State
 html += '<div class="flag-group"><h3>PF_State</h3><div class="flag-grid">';
 const pfSpec = [{ bit: 7, name: 'ISLAND_FLAG', mask: objectPort.ISLAND_FLAG, desc: 'declared PF_State bit name' }, { bit: 6, name: 'CHANGE_FLAG', mask: objectPort.CHANGE_FLAG, desc: 'declared PF_State bit name' }];
 for (const spec of pfSpec) {
  const on = !!(pfState & spec.mask);
  html += `<div class="flag-cell ${on ? 'on' : ''}"><div class="bit-num">b${spec.bit}</div><div class="bit-name">${spec.name}</div><div>${spec.desc}</div><input type="checkbox" ${on ? 'checked' : ''} data-flag-area="pfstate" data-mask="${spec.mask}"></div>`;
 }
 html += '</div></div>';
 html += '<div class="tiny">Click checks to toggle bits. Flags from excerpt FLAGS constants.</div>';
 flagEditorEl.innerHTML = html;
 flagEditorEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
   const mask = Number(cb.dataset.mask), area = cb.dataset.flagArea;
   if (area === 'block') {
    slotModel[selectedSlotIndex].blockLst = cb.checked ? (slotModel[selectedSlotIndex].blockLst | mask) : (slotModel[selectedSlotIndex].blockLst & ~mask);
   } else if (area === 'state') {
    slotModel[selectedSlotIndex].State1Lst = cb.checked ? (slotModel[selectedSlotIndex].State1Lst | mask) : (slotModel[selectedSlotIndex].State1Lst & ~mask);
   } else if (area === 'pfstate') {
    let c = visiblePort.getField(memory, 'PF_State');
    c = cb.checked ? (c | mask) : (c & ~mask);
    visiblePort.setField(memory, 'PF_State', c);
   }
   syncView();
  });
 });
}

function renderJoystickViz() {
 if (!joystickVizEl) return;
 const joy = visiblePort.inspectJoystickState(memory);
 const missileState = visiblePort.inspectMissileBoundsState(memory);
 const dirs = [
  { row: 0, col: 1, n: 'UP', a: joy.up, m: visiblePort.FLAGS.joystick.MOVE_UP, l: 'U' },
  { row: 1, col: 0, n: 'LEFT', a: joy.left, m: visiblePort.FLAGS.joystick.MOVE_LEFT, l: 'L' },
  { row: 1, col: 2, n: 'RIGHT', a: joy.right, m: visiblePort.FLAGS.joystick.MOVE_RIGHT, l: 'R' },
  { row: 2, col: 1, n: 'DOWN', a: joy.down, m: visiblePort.FLAGS.joystick.MOVE_DOWN, l: 'D' },
 ];
 let grid = Array.from({ length: 3 }, () => ['','','']);
 for (const d of dirs) { grid[d.row][d.col] = `<div class="joy-btn ${d.a ? 'active' : ''}" data-dir="${d.n}" data-mask="${d.m}">${d.l}</div>`; }
 joystickVizEl.innerHTML = `
  <div class="joy-pad">${grid.map(r => r.map(c => c || '<div class="joy-btn empty"></div>').join('')).join('')}</div>
  <div class="joy-hex" style="font-family:var(--mono);font-size:11px;margin-top:6px;text-align:center">\$${joy.raw.toString(16).toUpperCase().padStart(2, '0')} = ${joy.directions || 'none'}</div>
  <div style="display:flex;justify-content:center;margin-top:6px"><button id="joyFireBtn" class="secondary" type="button">${missileState.isEnabled ? 'Missile in flight' : 'Fire missile'}</button></div>
  <div class="tiny" style="margin-top:4px">${joy.note}</div>`;
 joystickVizEl.querySelectorAll('.joy-btn[data-dir]').forEach(btn => {
  btn.addEventListener('click', () => {
   const mask = Number(btn.dataset.mask);
   let c = visiblePort.getField(memory, 'joystick');
   c = btn.classList.contains('active') ? (c & ~mask) : (c | mask);
   visiblePort.setField(memory, 'joystick', c); syncView();
  });
 });
 const fireBtn = document.getElementById('joyFireBtn');
 if (fireBtn && !fireBtn._bound) {
  fireBtn._bound = true;
  fireBtn.addEventListener('click', () => fireMissile());
 }
}

function renderMissileViz() {
 if (!missileVizEl) return;
 const ms = visiblePort.inspectMissileBoundsState(memory);
 const range = ms.maxMissile - ms.minMissile;
 const mPct = Math.max(0, Math.min(100, ((ms.missileY - ms.minMissile) / range) * 100));
 const jPct = Math.max(0, Math.min(100, ((ms.jetY - ms.minMissile) / range) * 100));
 missileVizEl.innerHTML = `
  <div class="tiny" style="margin-bottom:2px">missileY = ${ms.missileY} (${ms.missileYHex}) ${ms.isEnabled ? '<span style="color:var(--accent)">$FF sentinel</span>' : 'non-$FF byte'}</div>
  <div class="missile-ruler">
   <div class="zone" style="left:${mPct * 0.5}%;width:50%"></div>
   <div class="current" style="left:${mPct}%"></div>
   <div class="jet-line" style="left:${jPct}%;background:#ffe066"></div>
  </div>
  <div class="missile-labels"><span>MIN=${ms.minMissile}</span><span>JET=${ms.jetY}</span><span>MAX=${ms.maxMissile}</span><span>speed=${ms.missileSpeed}</span></div>
  <div class="tiny">dist=${ms.distFromJet} | ${ms.isAtSpawn ? 'AT SPAWN' : ms.isAboveScreen ? 'ABOVE' : ms.isWithinBounds ? 'IN BOUNDS' : 'OUT'}</div>`;
}

function renderRngViz() {
 if (!rngVizEl) return;
 const rng = visiblePort.inspectRngState(memory);
 rngExCycleCount++;
 rngVizEl.innerHTML = `
  <div style="margin-bottom:6px;font-size:12px">
   <div>Seed: <span class="mono" style="color:var(--accent)">${toHex(rng.seed16, 4)}</span></div>
   <div>Current: <span class="mono" style="color:var(--accent2)">${toHex(rng.rng16, 4)}</span></div>
   <div>Next step (LFSR): <span class="mono">${toHex(rng.rngNextPreview, 4)}</span></div>
   <div>random (8-bit): <span class="mono">${toHex(rng.random8)}</span></div>
  </div>
  <div class="tiny">${rng.note}</div>
  <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
   <button id="rngStepBtn" style="font-size:11px;padding:4px 8px">Step LFSR</button>
   <button id="rngResetBtn" class="secondary" style="font-size:11px;padding:4px 8px">Reset to seed</button>
  </div>`;
 const sb = document.getElementById('rngStepBtn');
 if (sb && !sb._bound) {
  sb._bound = true;
  sb.addEventListener('click', () => { const c = visiblePort.readRng16(memory); visiblePort.writeRng16(memory, visiblePort.rngStep(c)); syncView(); });
 }
 const rb = document.getElementById('rngResetBtn');
 if (rb && !rb._bound) {
  rb._bound = true;
  rb.addEventListener('click', () => { visiblePort.writeRng16(memory, rng.seed16); syncView(); });
 }
}

function renderGameModeViz() {
 if (!gameModeVizEl) return;
 const gm = visiblePort.inspectGameModeState(memory);
 let pb = '';
 if (gm.isScrollInto) pb = `<div style="position:relative;height:16px;background:var(--panel2);border:1px solid var(--border);border-radius:6px;overflow:hidden;margin:6px 0"><div style="width:${gm.scrollProgress * 100}%;height:100%;background:rgba(92,200,255,0.3)"></div><div style="position:absolute;top:1px;left:4px;font-size:10px;font-family:var(--mono)">${gm.scrollProgressPct}</div></div>`;
 gameModeVizEl.innerHTML = `
  <div style="margin-bottom:6px">
   <div style="font-size:14px;font-weight:bold;margin-bottom:4px">${gm.label}</div>
   <div class="mono">raw = ${gm.raw} (${gm.hex})</div>${pb}
  </div>
  <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
   <button class="gm-btn" data-mode="0" ${gm.isRunning ? 'style="opacity:0.5"' : ''}>Running</button>
   <button class="gm-btn" data-mode="255" class="secondary" ${gm.isGameOver ? 'style="opacity:0.5"' : ''}>Game Over</button>
   <button class="gm-btn" data-mode="up" class="secondary">Scroll +1</button>
   <button class="gm-btn" data-mode="dn" class="secondary">Scroll -1</button>
  </div>
  <div class="tiny" style="margin-top:4px">gameMode: $00=running, $FF=game over, 1..48=scroll.</div>`;
 gameModeVizEl.querySelectorAll('.gm-btn').forEach(b => {
  b.addEventListener('click', () => {
   const m = b.dataset.mode;
   if (m === '0') visiblePort.setField(memory, 'gameMode', 0x00);
   else if (m === '255') visiblePort.setField(memory, 'gameMode', 0xff);
   else if (m === 'up') { const c = visiblePort.getField(memory, 'gameMode'); if (c < 48) visiblePort.setField(memory, 'gameMode', c + 1); }
   else if (m === 'dn') { const c = visiblePort.getField(memory, 'gameMode'); if (c > 1) visiblePort.setField(memory, 'gameMode', c - 1); }
   syncView();
  });
 });
}

function renderColorInspector() {
 if (!colorInspectorEl) return;
 const d = visiblePort.ntscDecode(colorInspectorValue);
 const css = visiblePort.ntscColorCss(colorInspectorValue);
 colorInspectorEl.innerHTML = `
  <div style="display:flex;gap:10px;align-items:center">
   <div style="width:50px;height:50px;border-radius:6px;border:1px solid var(--border);background:${css}"></div>
   <div class="mono" style="font-size:11px"><div>Byte: ${toHex(colorInspectorValue)}</div><div>Hue: ${d.hueName} (${d.hue})</div><div>Luma: ${d.luminance}</div><div>CSS: ${css}</div><div>Gray: ${d.grayCss}</div></div>
  </div>`;
}


paletteCanvas?.addEventListener('click', (event) => {
 const hue = Math.floor(event.offsetY / paletteCanvas.height * 8);
 const li = Math.floor(event.offsetX / paletteCanvas.width * 8);
 const lum = ((li * 2) + 2) & 0x0f;
 colorInspectorValue = ((hue * 0x20) | lum) & 0xff;
 syncView();
});

function renderAliasConflict() {
 const el = document.getElementById('aliasConflictViz');
 if (!el) return;
 let rows = '';
 for (const [addr, names] of visiblePort.ALIAS_MAP) {
  rows += `<tr><td class="mono" style="color:var(--accent)">\$${toHex(addr)}</td><td class="mono">${names.join(', ')}</td></tr>`;
 }
 el.innerHTML = `<table><thead><tr><th>Addr</th><th>Shared fields</th></tr></thead><tbody>${rows}</tbody></table><div class="tiny" style="margin-top:4px">Symbolic names sharing same ZP byte per excerpt ZP-VARIABLES.</div>`;
}

function renderCoverageMap() {
 const el = document.getElementById('coverageViz');
 if (!el) return;
 const cc = { 'visible-code': '#59c3c3', 'declared': '#ffd166', 'declared-only': '#666' };
 const cl = { 'visible-code': 'Visible code', 'declared': 'Constant/flag', 'declared-only': 'Declared only' };
 let rows = '';
 for (const [name, entry] of visiblePort.COVERAGE_MAP) {
  const d = cc[entry.coverage] || '#666';
  rows += `<tr><td class="mono" style="color:var(--accent)">\$${toHex(entry.address)}</td><td>${name}</td><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${d};margin-right:4px"></span>${cl[entry.coverage] || entry.coverage}</td></tr>`;
 }
 el.innerHTML = `<table><thead><tr><th>Addr</th><th>Field</th><th>Excerpt coverage</th></tr></thead><tbody>${rows}</tbody></table><div class="tiny" style="margin-top:4px">From ASM excerpt: whether field has visible read/write code, is a constant, or is declaration-only.</div>`;
}

function renderPfStateViz() {
 const el = document.getElementById('pfStateViz');
 if (!el) return;
 const pf = visiblePort.inspectPfState(memory);
 el.innerHTML = `
  <div class="mono" style="font-size:12px;margin-bottom:4px">${pf.hex} = ${pf.binary}</div>
  <div><span style="display:inline-block;width:12px;height:12px;background:${pf.islandFlag ? 'var(--accent2)' : '#333'};border-radius:2px;vertical-align:middle;margin-right:4px"></span>b7 ISLAND_FLAG bit = ${pf.islandFlag ? '1' : '0'}</div>
  <div><span style="display:inline-block;width:12px;height:12px;background:${pf.changeFlag ? 'var(--warn)' : '#333'};border-radius:2px;vertical-align:middle;margin-right:4px"></span>b6 CHANGE_FLAG bit = ${pf.changeFlag ? '1' : '0'}</div>
  <div class="tiny" style="margin-top:6px">${pf.note}</div>`;
}

function renderSoundViz() {
 if (!soundVizEl) return;
 const s = visiblePort.inspectSoundState(memory);
 soundVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px;font-family:var(--mono);margin-bottom:6px">
   <span style="color:var(--muted)">sound0Id:</span><span>${s.sound0IdHex}</span>
   <span style="color:var(--muted)">sound0Cnt:</span><span>${s.sound0CntHex}</span>
   <span style="color:var(--muted)">bridgeSound:</span><span>${s.bridgeSoundHex}${s.bridgeExploding ? ' <span style="color:var(--warn)">non-zero byte</span>' : ' zero byte'}</span>
   <span style="color:var(--muted)">missileSound:</span><span>${s.missileSoundHex}${s.missileFired ? ' <span style="color:var(--accent)">non-zero byte</span>' : ' zero byte'}</span>
  </div>
  <div class="tiny">${s.note}</div>`;
}

function renderBridgeExploViz() {
 if (!bridgeExploVizEl) return;
 const b = visiblePort.inspectBridgeExploState(memory);
 bridgeExploVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:13px;margin-bottom:4px">${b.hex} = ${b.raw}</div>
  <div>bridgeExplode byte: ${b.isExploding ? '<span style="color:var(--warn)">non-zero</span>' : 'zero'}</div>
  <div class="tiny" style="margin-top:4px">${b.note}</div>`;
}

function renderPFcolorViz() {
 if (!pfcVizEl) return;
 const p = visiblePort.inspectPFcolorState(memory);
 pfcVizEl.innerHTML = `
  <div style="display:flex;gap:10px;align-items:center">
   <div style="width:48px;height:48px;border-radius:6px;border:1px solid var(--border);background:${p.pfColorCss}"></div>
   <div style="font-family:var(--mono);font-size:12px"><div>${p.hex} at ${p.addressHex}</div><div class="tiny">${p.alias}</div></div>
  </div>
  <div class="tiny" style="margin-top:4px">${p.note}</div>`;
}

function renderShapePtrViz() {
 if (!shapePtrVizEl) return;
 const s = visiblePort.inspectShapePtrState(memory);
 shapePtrVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">shapePtr0:</span><span>${s.shapePtr0.addressHex}..${s.shapePtr0.endAddressHex} = ${s.shapePtr0.valueHex} (lo ${s.shapePtr0.loHex}, hi ${s.shapePtr0.hiHex})</span>
   <span style="color:var(--muted)">shapePtr1a:</span><span>${s.shapePtr1a.addressHex}..${s.shapePtr1a.endAddressHex} = ${s.shapePtr1a.valueHex} (lo ${s.shapePtr1a.loHex}, hi ${s.shapePtr1a.hiHex})</span>
   <span style="color:var(--muted)">shapePtr1b:</span><span>${s.shapePtr1b.addressHex}..${s.shapePtr1b.endAddressHex} = ${s.shapePtr1b.valueHex} (lo ${s.shapePtr1b.loHex}, hi ${s.shapePtr1b.hiHex})</span>
   <span style="color:var(--muted)">pointer ranges:</span><span>${s.pointerRanges.join(', ')}</span>
   <span style="color:var(--muted)">non-zero pointers:</span><span>${s.nonZeroPointerCount} / ${s.pointerNames.length}${s.allPointersZero ? ' (all zero)' : ''}</span>
  </div>
  <div class="tiny">${s.note}</div>`;
}

function renderJetSpritePtrViz() {
 if (!jetSpritePtrVizEl) return;
 const j = visiblePort.inspectJetSpritePointerTarget(memory);
 const tia = visiblePort.inspectPlayerJetTiaRegisters(memory);
 jetSpritePtrVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">shapePtr0:</span><span>${j.pointerAddressHex}..${j.pointerEndAddressHex} = ${j.pointerValueHex}</span>
   <span style="color:var(--muted)">target:</span><span>${j.targetLabel} (${j.targetStatus})</span>
   <span style="color:var(--muted)">REFP0 source:</span><span>${j.reflect0Hex} at ${j.reflect0AddressHex} → ${j.refp0Interpretation}</span>
   <span style="color:var(--muted)">COLUP0 source:</span><span>${j.playerColorHex} at ${j.playerColorAddressHex}</span>
   <span style="color:var(--muted)">RESP0 source:</span><span>${j.playerXHex} at ${j.playerXAddressHex}; JET_Y=${j.jetY} (${j.jetYHex})</span>
   <span style="color:var(--muted)">NUSIZ0:</span><span>${j.p0NusizStatus}</span>
   <span style="color:var(--muted)">GRP0:</span><span>${tia.grp0.status}</span>
  </div>
  <div class="tiny" style="margin-top:6px">${j.note}</div>
  <div class="tiny" style="margin-top:4px">${tia.note}</div>`;
}

function renderPFptrViz() {
 if (!pfPtrVizEl) return;
 const p = visiblePort.inspectPFptrState(memory);
 pfPtrVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">PF1Ptr:</span><span>${p.pf1Ptr.addressHex}..${p.pf1Ptr.endAddressHex} = ${p.pf1Ptr.valueHex} (lo ${p.pf1Ptr.loHex}, hi ${p.pf1Ptr.hiHex})</span>
   <span style="color:var(--muted)">PF2Ptr:</span><span>${p.pf2Ptr.addressHex}..${p.pf2Ptr.endAddressHex} = ${p.pf2Ptr.valueHex} (lo ${p.pf2Ptr.loHex}, hi ${p.pf2Ptr.hiHex})</span>
  </div>
  <div class="tiny">${p.note}</div>`;
}

function renderColorPtrViz() {
 if (!colorPtrVizEl) return;
 const c = visiblePort.inspectColorPtrState(memory);
 colorPtrVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">colorPtr:</span><span>${c.addressHex}..${c.endAddressHex} = ${c.colorPtrHex}</span>
   <span style="color:var(--muted)">bytes:</span><span>lo ${c.loHex}, hi ${c.hiHex}</span>
  </div>
  <div class="tiny">${c.note}</div>`;
}

function renderSavedRngViz() {
 if (!savedRngVizEl) return;
 const s = visiblePort.inspectSavedRngState(memory);
 savedRngVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">saved:</span><span style="color:var(--accent)">${s.saved16Hex}</span>
   <span style="color:var(--muted)">current:</span><span>${s.current16Hex}</span>
   <span style="color:var(--muted)">match:</span><span>${s.matchesCurrent ? '<span style="color:var(--accent2)">YES</span>' : 'NO'}</span>
  </div>
  <div class="tiny">${s.note}</div>`;
}

function renderNusizDetailViz() {
 if (!nusizDetailVizEl) return;
 const nusizMap = visiblePort.inspectVisibleSlotNUSIZMap(memory);
 let rh = '';
 // Column headers grounded in ASM: slot (State1Lst $9A..$9F), NUSIZ mode (lines 158-162),
 // direction (DIRECTION_FLAG bit3, line 140), pixel width, copy count
 rh += `<div style="padding:2px 4px;font-family:var(--mono);font-size:10px;display:grid;grid-template-columns:20px 1fr auto auto auto;gap:4px;border-bottom:1px solid var(--border);color:var(--muted)">
 <span>slot</span><span>mode</span><span>ASM</span><span>width</span><span>copies</span>
 </div>`;
 for (const s of nusizMap.slots) {
 const d = s.nusizDetail;
 const bg = s.directionFlag ? 'rgba(96,128,160,0.20)' : 'transparent';
 const asmTag = d.asmName ? `<span style="color:var(--accent)">${d.asmName}</span>` : '<span style="color:var(--muted)">—</span>';
 rh += `<div style="background:${bg};padding:2px 4px;font-family:var(--mono);font-size:11px;display:grid;grid-template-columns:20px 1fr auto auto auto;gap:4px;border-bottom:1px solid rgba(46,58,105,0.4)">
 <span style="color:var(--accent)">${s.slotLabel}</span>
 <span>${d.label}${s.directionFlag ? ' ↔' : ''}</span>
 ${asmTag}
 <span style="color:var(--warn)">${d.playerPixelWidth}px</span>
 <span style="color:var(--muted)">${d.copyCount}x</span>
 </div>`;
 }
 nusizDetailVizEl.innerHTML = `
 <div style="margin-bottom:6px;font-family:var(--mono);font-size:11px;color:var(--muted)">NUSIZ per slot (State1Lst $9A..$9F)</div>${rh}
 <div class="tiny" style="margin-top:6px">${nusizMap.note}</div>`;
}

function renderSectionProgressViz() {
 if (!sectionProgressVizEl) return;
 const sp = visiblePort.inspectVisibleSectionProgress(memory);
 const blockLabel = visiblePort.computeSectionBlockLabel(sp.sectionBlock);
 sectionProgressVizEl.innerHTML = `
 <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
 <span style="color:var(--muted)">sectionBlock:</span><span style="color:var(--accent)">${sp.sectionBlockHex} (${sp.remainingInSection} of ${sp.sectionBlocksTotal})</span>
 <span style="color:var(--muted)">label:</span><span>${blockLabel}</span>
 <span style="color:var(--muted)">progress:</span><span>${sp.sectionProgressPct}</span>
 <span style="color:var(--muted)">blockOffset:</span><span>${sp.blockOffsetHex}</span>
 <span style="color:var(--muted)">blockPart:</span><span>${sp.blockPartHex} (${sp.blockPartLabel})</span>
 <span style="color:var(--muted)">blockLine:</span><span>${sp.currentBlockLineHex}</span>
 </div>
 <div class="tiny" style="margin-top:6px">${sp.note}</div>`;
}

function renderBlockListViz() {
 if (!blockListVizEl) return;
 const bl = visiblePort.inspectBlockList(memory);
 let rh = '';
 for (const s of bl.slots) {
  const bg = s.flags.road ? 'rgba(160,128,96,0.30)' : 'transparent';
  rh += `<div style="background:${bg};padding:2px 4px;font-family:var(--mono);font-size:11px;display:grid;grid-template-columns:20px 1fr auto;gap:4px;border-bottom:1px solid rgba(46,58,105,0.4)">
   <span style="color:var(--accent)">${s.label}</span>
   <span>${s.flags.labels.join(', ') || 'none'}</span>
   <span style="color:var(--warn)">${s.hex}</span>
  </div>`;
 }
 blockListVizEl.innerHTML = `
  <div style="margin-bottom:6px;font-family:var(--mono);font-size:11px;color:var(--muted)">\$8E..\$93: ${bl.summary}</div>${rh}
  <div class="tiny" style="margin-top:6px">blockLst per-slot flags. Set/clear NOT in excerpt.</div>`;
}

function updateFrameAutoButton() {
 if (!autoFrameButton) return;
 autoFrameButton.textContent = frameTimer ? 'Auto loop: on' : 'Auto loop: off';
}

function renderFrameCntViz() { if (!frameCntVizEl) return;
 const fc = visiblePort.inspectFrameCounter(memory);
 const parity = (fc.raw & 1) ? 'odd/B' : 'even/A';
 frameCntVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:13px">frameCnt = ${fc.hex} (${fc.raw}) at ${fc.addressHex}</div>
  <div style="font-family:var(--mono);font-size:12px;margin-top:4px">variant parity: <span style="color:var(--accent2)">${parity}</span></div>
  <div class="tiny">${fc.note} Variant-aware ROM sprites in the world view use frameCnt parity to select A/B interlace rows.</div>`;
}

function renderDxSpeedViz() {
 if (!dxSpeedVizEl) return;
 const d = visiblePort.inspectDxSpeed(memory);
 const arrow = d.isPositive ? '→' : d.isNegative ? '←' : '·';
 dxSpeedVizEl.innerHTML = `
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
   <div><span style="font-size:18px;margin-right:6px">${arrow}</span><span style="font-family:var(--mono);font-size:13px">${d.hex} (${d.raw})</span></div>
   <div class="tiny">signed: ${d.signed} | ${d.isZero ? 'zero' : d.isPositive ? 'positive' : 'negative'}</div>
  </div>
  <div class="tiny" style="margin-top:4px">${d.note}</div>`;
}

function renderScorePtrsViz() {
 if (!scorePtrsVizEl) return;
 const sp = visiblePort.inspectScorePtrs(memory);
 scorePtrsVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:11px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">scorePtr1:</span><span>${sp.scorePtr1.addressHex}..${sp.scorePtr1.endAddressHex} (${sp.scorePtr1.length}B)</span>
   <span style="color:var(--muted)">scorePtr1 dump:</span><span style="font-size:10px">${sp.scorePtr1.hexDump}</span>
   <span style="color:var(--muted)">visible Reset init:</span><span>LDX #12-1 → X=${sp.scorePtr1.visibleInitLoopCount} (${sp.scorePtr1.visibleInitLoopCountHex}) before SetScorePtr1</span>
   <span style="color:var(--muted)">first-boot write:</span><span>scorePtr1+${sp.scorePtr1.resetWriteOffset} @ ${sp.scorePtr1.resetWriteAddressHex} = ${sp.scorePtr1.resetWriteValueHex}</span>
   <span style="color:var(--muted)">scorePtr2:</span><span>${sp.scorePtr2.addressHex}..${sp.scorePtr2.endAddressHex} (${sp.scorePtr2.length}B)</span>
   <span style="color:var(--muted)">scorePtr2 dump:</span><span style="font-size:10px">${sp.scorePtr2.hexDump}</span>
  </div>
  <div class="tiny">${sp.note}</div>`;
}

function renderCollisionViz() {
 if (!collisionVizEl) return;
 const c = visiblePort.inspectCollisionState(memory);
 const pm = visiblePort.inspectPlayerMovementState(memory);
 collisionVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">collidedEnemy:</span><span>${c.collidedEnemyHex} = ${c.collidedShapeAsmName} (${c.collidedShapeName})</span>
   <span style="color:var(--muted)">reflect0:</span><span>${c.reflect0Hex} ${c.isReflected ? '<span style="color:var(--accent)">non-zero alias byte</span>' : 'zero byte'}</span>
   <span style="color:var(--muted)">hitEnemyIdx:</span><span>${c.hitEnemyIdxHex} ${c.hasHit ? '<span style="color:var(--warn)">non-zero alias byte</span>' : 'zero byte'}</span>
   <span style="color:var(--muted)">PFCrashFlag:</span><span>${c.pfCrashHex} ${c.hasCrashedIntoPF ? `<span style="color:#f25f5c">bank hit (${pm.bankState})</span>` : 'zero byte'}</span>
  </div>
  <div class="tiny">${c.note}</div>`;
}

// ─── SCOREPTR2 ALIASES ─────────────────────────────────────────────
function renderScorePtr2AliasesViz() {
 if (!scorePtr2AliasesVizEl) return;
 const a = visiblePort.inspectScorePtr2Aliases(memory);
 const f = a.fields;
 const matchColor = a.commentMatchesRange ? 'var(--accent2)' : '#f25f5c';
 scorePtr2AliasesVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">base:</span><span>${a.baseAddressHex} (${a.length}B, ends ${a.endAddressHex})</span>
   <span style="color:var(--muted)">range:</span><span>${a.rangeHex}</span>
   <span style="color:var(--muted)">comment vs range:</span><span style="color:${matchColor}">${a.commentDeclaredBytes}B comment vs ${a.actualBytesFromRange}B visible range</span>
   <span style="color:var(--muted)">alias offsets:</span><span>${a.aliasOffsets.map((n) => '+' + n).join(', ')}</span>
   <span style="color:var(--muted)">unlabeled offsets:</span><span>${a.unlabeledOffsets.map((n) => '+' + n).join(', ')}</span>
   <span style="color:var(--muted)">blockNum:</span><span>${f.blockNum.hex} (alias comment: offset+1)</span>
   <span style="color:var(--muted)">reflect0:</span><span>${f.reflect0.hex} ${f.reflect0.isSet ? '<span style="color:var(--accent)">non-zero alias byte</span>' : 'zero byte'}</span>
   <span style="color:var(--muted)">hitEnemyIdx:</span><span>${f.hitEnemyIdx.hex} ${f.hitEnemyIdx.isSet ? '<span style="color:var(--warn)">non-zero alias byte</span>' : 'zero byte'}</span>
   <span style="color:var(--muted)">PFCrashFlag:</span><span>${f.PFCrashFlag.hex} ${f.PFCrashFlag.hasCrashed ? '<span style="color:#f25f5c">non-zero alias byte</span>' : 'zero byte'}</span>
   <span style="color:var(--muted)">missileFlag:</span><span>${f.missileFlag.hex} ${f.missileFlag.isEnabled ? '<span style="color:var(--accent2)">$FF sentinel</span>' : 'non-$FF byte'}</span>
  </div>
  <div class="tiny">${a.note}</div>`;
}

// ─── STATE AREA ─────────────────────────────────────────────────────
function renderStateAreaViz() {
 if (!stateAreaVizEl) return;
 const sa = visiblePort.inspectStateArea(memory);
 const p1 = sa.player1State;
 const p2 = sa.player2State;
 stateAreaVizEl.innerHTML = `
  <div style="font-family:var(--mono);font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
   <span style="color:var(--muted)">player1State area:</span><span>${p1.baseHex}..$${(p1.base + 4).toString(16).toUpperCase().padStart(2, '0')} (${p1.length}B)</span>
   <span style="color:var(--muted)">player1State bytes:</span><span style="font-size:11px">${p1.hexDump}</span>
   <span style="color:var(--muted)">level alias byte:</span><span>$${p1.bytes[0].toString(16).toUpperCase().padStart(2, '0')}</span>
   <span style="color:var(--muted)">player2State area:</span><span>${p2.baseHex}..$${(p2.base + 3).toString(16).toUpperCase().padStart(2, '0')} (${p2.length}B)</span>
   <span style="color:var(--muted)">player2State bytes:</span><span style="font-size:11px">${p2.hexDump}</span>
   <span style="color:var(--muted)">livesPtr2 alias byte:</span><span>$${p2.bytes[3].toString(16).toUpperCase().padStart(2, '0')}</span>
  </div>
  <div class="tiny">Declared state areas from excerpt ZP-VARIABLES. Swap behavior is not inferred here. ${p2.livesPtr2Note}</div>`;
}

// ─── DRAW WORLD ────────────────────────────────────────────────

function drawWorld(playerX, missileX, missileY, fuelBallX, inspectedSlots, sectionState, frameCnt) {
 const w = worldCtx;
 const cw = worldCanvas.width, ch = worldCanvas.height;
 w.clearRect(0, 0, cw, ch);
 const rx = Math.floor(cw * 0.16), rw = Math.floor(cw * 0.68);
 const { rows: renderRows, riverScroll, mainH } = buildWorldRenderRows(inspectedSlots);
 const playerRiverBounds = visiblePort.inspectVisibleJetRiverBounds(memory, { playerX });
 const xToCanvas = x => rx + (x / 160) * rw;

 w.fillStyle = '#1b5e20';
 w.fillRect(0, 0, cw, mainH);

 const waterGradient = w.createLinearGradient(0, 0, 0, mainH);
 waterGradient.addColorStop(0, '#0f5fa8');
 waterGradient.addColorStop(0.45, '#1383d1');
 waterGradient.addColorStop(1, '#0a4f8a');

 w.fillStyle = waterGradient;
 w.beginPath();
 renderRows.forEach((slice, index) => {
  const left = xToCanvas(slice.left);
  if (index === 0) w.moveTo(left, slice.yTop);
  else w.lineTo(left, slice.yTop);
  if (index === renderRows.length - 1) w.lineTo(left, slice.yBottom);
 });
 for (let index = renderRows.length - 1; index >= 0; index -= 1) {
  const slice = renderRows[index];
  const right = xToCanvas(slice.right);
  w.lineTo(right, slice.yBottom);
  if (index === 0) w.lineTo(right, slice.yTop);
 }
 w.closePath();
 w.fill();

 w.strokeStyle = 'rgba(210, 237, 255, 0.95)';
 w.lineWidth = 2;
 w.beginPath();
 renderRows.forEach((slice, index) => {
  const yMid = Math.floor((slice.yTop + slice.yBottom) / 2);
  const xMid = xToCanvas((slice.left + slice.right) / 2);
  if (index === 0) w.moveTo(xMid, yMid);
  else w.lineTo(xMid, yMid);
 });
 w.stroke();

 const playerRow = renderRows.find(row => row.slotIndex === playerRiverBounds.slice?.slotIndex && row.source === 'current') ?? renderRows[0] ?? null;
 const missileRow = missileY >= visiblePort.GAME_CONSTANTS.MIN_MISSILE
  ? renderRows[Math.max(0, Math.min(renderRows.length - 1, Math.floor(((10 + ((missileY - visiblePort.GAME_CONSTANTS.MIN_MISSILE) / (visiblePort.GAME_CONSTANTS.MAX_MISSILE - visiblePort.GAME_CONSTANTS.MIN_MISSILE)) * mainH) / mainH) * renderRows.length)))]
  : null;

 renderRows.forEach((slice, index) => {
  const yTop = slice.yTop;
  const yBottom = slice.yBottom;
  const rowH = yBottom - yTop;
  if (rowH <= 0) return;
  const slot = slice.projectedSlot ?? inspectedSlots[slice.slotIndexWrapped] ?? inspectedSlots[index % inspectedSlots.length];
  if (!slot) return;
  slot.worldRowMeta = { rowKey: slice.rowKey, source: slice.source, left: slice.left, right: slice.right };
  const centerY = yTop + rowH / 2;
  const left = xToCanvas(slice.left);
  const right = xToCanvas(slice.right);

  w.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.045)';
  w.fillRect(left, yTop, Math.max(1, right - left), rowH);
  if (slice.source === 'next') {
   w.fillStyle = 'rgba(255, 214, 102, 0.08)';
   w.fillRect(left, yTop, Math.max(1, right - left), rowH);
  }
  if (playerRow && slice.rowKey === playerRow.rowKey) {
   w.fillStyle = 'rgba(92, 200, 255, 0.08)';
   w.fillRect(left, yTop, Math.max(1, right - left), rowH);
  }
  if (missileRow && slice.rowKey === missileRow.rowKey) {
   w.fillStyle = 'rgba(255, 107, 107, 0.08)';
   w.fillRect(left, yTop, Math.max(1, right - left), rowH);
  }
  w.strokeStyle = slice.source === 'next' ? 'rgba(255,214,102,0.40)' : 'rgba(255,255,255,0.10)';
  w.beginPath();
  w.moveTo(0, yTop + 0.5);
  w.lineTo(cw, yTop + 0.5);
  w.stroke();

  if (slice.carriesRoadBit) {
   w.strokeStyle = 'rgba(255,255,255,0.35)';
   w.setLineDash([5, 4]);
   w.beginPath();
   w.moveTo((left + right) / 2, yTop + 4);
   w.lineTo((left + right) / 2, yBottom - 4);
   w.stroke();
   w.setLineDash([]);
  }

  if (slice.isBridgeRow) {
   w.fillStyle = '#8d6e63';
   w.fillRect(left - 8, centerY - 5, (right - left) + 16, 10);
   w.strokeStyle = '#d7b98e';
   w.lineWidth = 1.5;
   w.strokeRect(left - 8, centerY - 5, (right - left) + 16, 10);
  }

  if (slice.source === 'next' && riverScroll.currentTailSlot) {
   const ghostSlot = riverScroll.currentTailSlot;
   const ghostResolved = resolveSlotSprite(ghostSlot, frameCnt);
   const ghostBitmap = ghostResolved.bitmap ?? SPRITE_BITMAPS[ghostSlot.shapeId];
   if (ghostBitmap) {
    const ghostX = xToCanvas(Math.max(slice.left + 4, Math.min(slice.right - 4, ghostSlot.inspectX ?? ghostSlot.coarseX ?? slice.left + 4)));
    const ghostScale = ghostSlot.shapeName === 'Bridge'
     ? Math.max(2, Math.floor(rowH / 11))
     : spriteScaleForSlot(ghostSlot, rowH);
    w.save();
    w.globalAlpha = 0.22;
    drawBitmap(w, ghostBitmap, ghostX, centerY, '#ffffff', {
     scale: ghostScale,
     reflect: ghostSlot.state1?.refp1Label === 'reflected',
     copies: copiesForSlot(ghostSlot),
    });
    w.restore();
    const nextX = xToCanvas(Math.max(slice.left + 4, Math.min(slice.right - 4, slot.inspectX ?? slot.coarseX ?? slice.left + 4)));
    w.save();
    w.strokeStyle = 'rgba(255,214,102,0.50)';
    w.setLineDash([4, 3]);
    w.beginPath();
    w.moveTo(ghostX, centerY - 10);
    w.lineTo(nextX, centerY - 10);
    w.stroke();
    w.setLineDash([]);
    w.restore();
   }
  }

  if (slot.coarseX > 0) {
   const clampedX = Math.max(slice.left + 4, Math.min(slice.right - 4, slot.inspectX ?? slot.coarseX));
   const ox = xToCanvas(clampedX);
   const color = shapeColor(slot.shapeId);
   const resolvedSprite = resolveSlotSprite(slot, frameCnt);
   const bitmap = resolvedSprite.bitmap ?? SPRITE_BITMAPS[slot.shapeId];
   const slotScale = slot.shapeName === 'Bridge'
    ? Math.max(2, Math.floor(rowH / 11))
    : spriteScaleForSlot(slot, rowH);
   w.save();
   if (slice.source === 'next') w.globalAlpha = 0.82;
   if (bitmap) {
    drawBitmap(w, bitmap, ox, centerY, color, {
     scale: slotScale,
     reflect: slot.state1.refp1Label === 'reflected',
     copies: copiesForSlot(slot),
    });
   } else {
    w.fillStyle = ['#a04040','#40a040','#4040a0','#a0a040','#a040a0','#40a0a0'][slot.slotIndex % 6];
    const sz = slot.state1.nusiz >= 5 ? 14 : 8;
    w.fillRect(ox - sz/2, centerY - sz/2, sz, sz);
   }
   w.restore();
   if (worldHoverPinned && pinnedWorldHover.rowKey === slice.rowKey) {
    w.strokeStyle = '#ff9de1';
    w.lineWidth = 2;
    w.strokeRect(Math.max(2, left - 3), yTop + 1.5, Math.max(28, right - left + 6), Math.max(8, rowH - 3));
   }
   if (slot.slotIndex === selectedSlotIndex) {
    const highlightW = Math.max(44, (bitmap?.[0]?.length || 8) * slotScale + 18);
    const highlightH = Math.max(28, (bitmap?.length || 8) * slotScale + 18);
    w.strokeStyle = '#ffe066';
    w.lineWidth = 2;
    w.strokeRect(ox - highlightW / 2, centerY - highlightH / 2, highlightW, highlightH);
    w.fillStyle = '#ffe066';
    w.font = '11px ui-monospace, monospace';
    w.fillText(`selected ${SLOT_NAMES[slot.slotIndex]}`, Math.max(4, ox - highlightW / 2), Math.max(12, yTop + 12));
   } else if (slice.rowKey === hoveredWorldRowKey) {
    const hoverW = Math.max(40, (bitmap?.[0]?.length || 8) * slotScale + 10);
    const hoverH = Math.max(24, (bitmap?.length || 8) * slotScale + 10);
    w.strokeStyle = '#5cc8ff';
    w.lineWidth = 1.5;
    w.strokeRect(ox - hoverW / 2, centerY - hoverH / 2, hoverW, hoverH);
   }
  }

  w.fillStyle = '#e8ecff';
  w.font = '10px ui-monospace, monospace';
  const rowLabel = slice.source === 'next'
   ? `${SLOT_NAMES[slice.slotIndexWrapped]} next ${slot.shapeName}${riverScroll.currentTailSlot ? ` ← ${riverScroll.currentTailSlot.shapeName}` : ''}`
   : `${SLOT_NAMES[slice.slotIndexWrapped]} row ${slot.shapeName}`;
  w.fillText(rowLabel, 2, yTop + 12);
 });

 const playerSlice = playerRiverBounds.slice ?? riverScroll.currentProfile.slices[Math.min(riverScroll.currentProfile.slices.length - 1, Math.max(0, Math.floor(riverScroll.currentProfile.slices.length * 0.15)))];
 const playerLeft = playerSlice ? playerSlice.left : 32;
 const playerRight = playerSlice ? playerSlice.right : 128;
 const clampedPlayerX = playerRiverBounds.clampedPlayerX;
 const jy = 10 + (19/160) * mainH, jx = xToCanvas(clampedPlayerX);
 const playerJet = resolvePlayerJetSprite(frameCnt, visiblePort.getField(memory, 'gameMode'));
 drawBitmap(w, playerJet.bitmap, jx, jy, '#ffe066', { scale: 3 });
 if (playerRiverBounds.collidedWithBank) {
  w.strokeStyle = '#ff6b6b';
  w.lineWidth = 3;
  w.beginPath();
  w.moveTo(jx - 10, jy - 12);
  w.lineTo(jx + 10, jy + 12);
  w.moveTo(jx + 10, jy - 12);
  w.lineTo(jx - 10, jy + 12);
  w.stroke();
  w.fillStyle = '#ff6b6b';
  w.font = '11px ui-monospace, monospace';
  w.fillText(playerRiverBounds.crashSide === 'left-bank' ? 'LEFT BANK' : 'RIGHT BANK', Math.max(4, jx - 28), Math.max(12, jy - 16));
 }
 const mFlag = visiblePort.getField(memory, 'missileFlag');
 if (mFlag === 0xff && missileY >= visiblePort.GAME_CONSTANTS.MIN_MISSILE) {
  const my = 10 + ((missileY - visiblePort.GAME_CONSTANTS.MIN_MISSILE) / (visiblePort.GAME_CONSTANTS.MAX_MISSILE - visiblePort.GAME_CONSTANTS.MIN_MISSILE)) * mainH;
  const missileSliceIndex = Math.max(0, Math.min(renderRows.length - 1, Math.floor((my / mainH) * renderRows.length)));
  const missileSlice = renderRows[missileSliceIndex] ?? playerSlice;
  const clampedMissileX = Math.max(missileSlice.left + 2, Math.min(missileSlice.right - 2, missileX));
  const mx = xToCanvas(clampedMissileX);
  w.fillStyle = '#ff6b6b';
  w.fillRect(mx - 2, my - 4, 4, 8);
 }

 w.fillStyle = visiblePort.ntscColorCss(visiblePort.COLORS.YELLOW);
 const fbx = xToCanvas(Math.max(playerLeft, Math.min(playerRight, fuelBallX)));
 w.beginPath();
 w.arc(fbx, jy - 18, 3, 0, Math.PI * 2);
 w.fill();

 w.fillStyle = '#18202a';
 w.fillRect(0, mainH, cw, ch - mainH);
 w.fillStyle = '#ffe066';
 w.font = '14px ui-monospace, monospace';
 const sb = visiblePort.getFieldBytes(memory, 'scorePtr1');
 w.fillText(sb.map(b => b > 0 ? '#' : '_').join(''), 10, mainH + 20);
 const fuelHi2 = visiblePort.getField(memory, 'fuelHi');
 const fPct = fuelHi2 / 255;
 w.fillStyle = '#222';
 w.fillRect(10, mainH + 28, cw - 20, 10);
 w.fillStyle = '#59c3c3';
 w.fillRect(10, mainH + 28, (cw - 20) * fPct, 10);
}

function updateLegend(inspectedSlots, sectionState) {
 const roadCount = inspectedSlots.filter(s => s.blockFlags.road).length;
 const enemyCount = inspectedSlots.filter(s => s.blockFlags.enemyMoving).length;
 const riverScroll = visiblePort.inspectVisibleRiverScrollState(memory);
 const riverProfile = riverScroll.currentProfile;
 const scrollPct = Math.round(riverScroll.scrollProgress * 100);
 const seam = riverScroll.seamDelta;
 bandLegendEl.innerHTML = `
  <span class="pill">PF-road-bit slots: ${roadCount}/6</span>
  <span class="pill">MOVE_ENEMY-bit slots: ${enemyCount}</span>
  <span class="pill">PF_State b7 bit: ${sectionState.islandFlag ? '1' : '0'}</span>
  <span class="pill">river width: ${riverProfile.riverWidth}/160</span>
  <span class="pill">scroll: ${scrollPct}% of 32-line block</span>
  <span class="pill">seam ΔW: ${seam.widthDelta >= 0 ? '+' : ''}${seam.widthDelta}</span>
  <span class="pill">seam ΔW%: ${seamPctLabel(seam.widthDeltaPct)}</span>
  <span class="pill">seam ΔX: ${seam.xDelta >= 0 ? '+' : ''}${seam.xDelta} (${seam.xDirection})</span>
  <span class="pill">seam shape: ${seam.shapeChanged ? `${seam.fromShapeName}→${seam.toShapeName}` : seam.toShapeName}</span>
  <span class="pill">next seam slot: ${seam.toSlotLabel} ${seam.toShapeName}</span>
  <span class="pill">composite rows: ${riverScroll.rowSourceCounts.total}</span>
  <span class="pill">bank clamp: harness silhouette at JET_Y</span>
  <span class="pill">click canvas row to select + pin tooltip</span>
  <span class="pill">Prev/Next + seam jump buttons mirror canvas selection</span>
  <span class="pill">future seam timeline: 8/16/32/64/96 cloned loop samples</span>`;
 if (worldLegend) {
  worldLegend.innerHTML = `
   <span class="tiny">Canvas now includes an inspector-only river/playfield silhouette driven by sectionBlock, blockOffset, PF1PatId, blockPart, the block-line counter, and the six visible slot rows. Current rows now carry current slot sprites, the seam preview row carries the projected next-scene slot sprite, the new DOM row/seam panels mirror the same rendered-row selection, hover/click tracking follows the actual rendered rows, and player/missile bands are called out visually. It still does not claim ROM-complete terrain decoding or the unseen collision routine.</span>`;
 }
}

// ─── diffPF inspector ($F2) ──────────────────────────
function renderDiffPFViz() {
  if (!diffPFVizEl) return;
  const dp = visiblePort.inspectDiffPF(memory);
  const ta = visiblePort.inspectTempAlias(memory);
  diffPFVizEl.innerHTML = `
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12px;font-family:var(--mono);margin-bottom:8px">
   <span style="color:var(--muted)">temp ($F2):</span><span>${dp.hex} (${dp.raw}) at ${dp.addressHex}</span>
   <span style="color:var(--muted)">alias:</span><span>${dp.aliasName} = ${dp.diffPFHex} (${dp.diffPF})</span>
   <span style="color:var(--muted)">shared with:</span><span>temp (${ta.rawHex}) — same byte, different alias</span>
  </div>
  <div style="margin-top:4px;font-size:11px;color:var(--muted)">${dp.note}</div>
  <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
   <label style="font-size:11px;color:var(--muted)">Write $F2: <input id="diffPFWrite" type="number" min="0" max="255" value="${dp.raw}" style="background:var(--bg);color:var(--fg);border:1px solid var(--border);padding:2px 6px;font-family:monospace;font-size:11px;width:60px"></label>
  </div>`;
  const wi = document.getElementById('diffPFWrite');
  if (wi && !wi._bound) { wi._bound = true; wi.addEventListener('input', () => { visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.temp.address, clampByte(wi.value)); syncView(); }); }
}

// ─── ARRAY ENDS VIEW ────────────────────────────────────────────────
function renderArrayEndsViz() {
  const el = document.getElementById('arrayEndsViz');
  if (!el) return;
  const layout = visiblePort.inspectBlockArrayLayout();
  let h = '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  h += '<tr style="border-bottom:1px solid var(--border);color:var(--muted)"><th style="text-align:left;padding:2px 6px">Label</th><th style="text-align:left;padding:2px 6px">Start</th><th style="text-align:left;padding:2px 6px">End</th><th style="text-align:left;padding:2px 6px">Range</th><th style="text-align:left;padding:2px 6px">Formula</th></tr>';
  for (const entry of layout.arrays) {
    h += `<tr style="border-bottom:1px solid var(--border)"><td style="padding:2px 6px;font-family:monospace;color:var(--accent)">${entry.name}</td><td style="padding:2px 6px;font-family:monospace">${entry.startHex}</td><td style="padding:2px 6px;font-family:monospace">${entry.endHex}</td><td style="padding:2px 6px;font-family:monospace">${entry.rangeHex}</td><td style="padding:2px 6px;font-family:monospace">${entry.formula}</td></tr>`;
  }
  h += '</table>';
  h += `<div class="tiny" style="margin-top:6px">${layout.totalArrays} arrays × ${layout.bytesPerArray} bytes = ${layout.totalBytes} contiguous bytes across ${layout.contiguousRangeHex}. Derived from the excerpt declarations only.</div>`;
  el.innerHTML = h;
}

function safeRender(fn, label) {
 try {
  fn();
 } catch (error) {
  console.warn(`safeRender(${label})`, error);
 }
}

// ─── SYNC VIEW ─────────────────────────────────────────────────
function syncView() {
 const fuelHi = clampByte(fuelHiInput.value);
 const missileX = clampPlayfieldX(missileXInput.value);
 const missileY = clampByte(missileYInput.value);
 const joystick = clampByte(joyByteInput.value);
  const frameCnt = clampByte(frameCntInput.value);

 fuelHiInput.value = String(fuelHi);
 missileXInput.value = String(missileX);
 missileYInput.value = String(missileY);
 joyByteInput.value = String(joystick);
  frameCntInput.value = String(frameCnt);
 selectedSlotIndex = Math.max(0, Math.min(SLOT_COUNT - 1, selectedSlotIndex));

 fuelHiValue.textContent = `${fuelHi} / ${toHex(fuelHi)}`;
 visiblePort.setField(memory, 'fuelHi', fuelHi);
 visiblePort.setField(memory, 'missileX', missileX);
 visiblePort.setField(memory, 'missileY', missileY);
 visiblePort.setField(memory, 'joystick', joystick);
  visiblePort.setField(memory, 'frameCnt', frameCnt);
 applySlotModelToMemory();

 const playerXClamp = clampPlayerXToVisibleRiverBounds(playerXInput.value);
 const playerX = playerXClamp.playerX;
 playerXInput.value = String(playerX);
 playerXInput.title = playerXClamp.wasClamped
  ? `clamped to visible river bounds ${toHex(playerXClamp.riverBounds.leftBound)}..${toHex(playerXClamp.riverBounds.rightBound)} (${playerXClamp.riverBounds.sliceLabel})`
  : `visible river bounds ${toHex(playerXClamp.riverBounds.leftBound)}..${toHex(playerXClamp.riverBounds.rightBound)} (${playerXClamp.riverBounds.sliceLabel})`;
 visiblePort.setField(memory, 'playerX', playerX);

 const visibleState = visiblePort.computeMainLoopVisibleState(memory);
 const fuelBallX = visibleState.fuelDisplayBallValue;
 const fuel16 = visibleState.fuel16;
 const namedSnapshot = visiblePort.snapshotNamedState(memory);
 const inspectedSlots = visiblePort.inspectVisibleSlots(memory);
 const selectedSlot = inspectedSlots[selectedSlotIndex];
 const sectionState = visiblePort.inspectSectionState(memory);

 renderStats({
  random: visiblePort.getField(memory, 'random'),
  fuelHi, fuelBallX, fuel16, playerX, missileX, missileY, joystick, frameCnt,
  gameMode: visiblePort.getField(memory, 'gameMode'),
  gameModeLabel: visibleState.gameModeLabel,
  sectionBlock: sectionState.sectionBlock,
  activeRoadSlots: inspectedSlots.filter(s => s.blockFlags.road).length,
  movingObjectSlots: inspectedSlots.filter(s => s.blockFlags.enemyMoving).length,
  selectedSlot: SLOT_NAMES[selectedSlotIndex],
  selectedInspectX: selectedSlot.inspectX,
  setPosXIndex: visibleState.setPosXIndex,
  scorePtr1Byte10: visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.scorePtr1.address + 10),
  livesPtrByte0: visiblePort.readByte(memory, visiblePort.ZERO_PAGE_INDEX.livesPtr.address),
  pf1PatId: sectionState.pf1PatId,
  pf1PatIdPage: toHex(sectionState.pf1PatIdPage, 4),
  blockOffset: sectionState.blockOffset,
 });

namedStateEl.textContent = JSON.stringify(normalize(namedSnapshot), null, 2);
memoryDumpEl.textContent = dumpMemory(memory);
objectStateEl.textContent = JSON.stringify(normalize({ fuelHi, playerX, missileX, missileY, joystick, frameCnt }), null, 2);
renderSlotEditor(inspectedSlots);
renderSelectedSlotDetail(selectedSlot);
renderSelectedSlotPreview(selectedSlot);
renderSpriteDecisionViz(selectedSlot);
renderExplosionFamilyViz(selectedSlot);
renderPFPatternViz(selectedSlot);
renderROMCoverageViz();
renderProvenanceViz();
drawHudPreview(fuelHi, fuelBallX, fuel16);
drawWorld(playerX, missileX, missileY, fuelBallX, inspectedSlots, sectionState, frameCnt);
renderCompositeRowsViz();
renderWorldRowViz();
renderSeamScrollViz();
renderSeamTimelineViz();
updateLegend(inspectedSlots, sectionState);
renderSectionViz(sectionState);
if (worldHoverPinned && pinnedWorldHover.rowKey) {
 const pinnedRow = findWorldRenderRowByKey(pinnedWorldHover.rowKey);
 const pinnedSlot = pinnedRow?.projectedSlot ?? (pinnedWorldHover.slotIndex >= 0 ? inspectedSlots[pinnedWorldHover.slotIndex] : null);
 if (pinnedSlot) {
  updateWorldHoverTooltip(pinnedSlot, pinnedWorldHover, { pinned: true, rowMeta: pinnedRow ?? pinnedSlot.worldRowMeta ?? null });
 }
}
drawPalette();
 safeRender(() => renderFlagEditor(), 'renderFlagEditor');
 safeRender(() => renderJoystickViz(), 'renderJoystickViz');
 safeRender(() => renderMissileViz(), 'renderMissileViz');
 safeRender(() => renderRngViz(), 'renderRngViz');
 safeRender(() => renderGameModeViz(), 'renderGameModeViz');
 safeRender(() => renderColorInspector(), 'renderColorInspector');
 safeRender(() => renderAliasConflict(), 'renderAliasConflict');
 safeRender(() => renderCoverageMap(), 'renderCoverageMap');
 safeRender(() => renderPfStateViz(), 'renderPfStateViz');
 safeRender(() => renderRoadBlockViz(), 'renderRoadBlockViz');
 safeRender(() => renderSoundViz(), 'renderSoundViz');
 safeRender(() => renderBridgeExploViz(), 'renderBridgeExploViz');
 safeRender(() => renderMissileStateViz(), 'renderMissileStateViz');
 safeRender(() => renderPlayerMoveViz(), 'renderPlayerMoveViz');
 safeRender(() => renderPlayerJetViz(), 'renderPlayerJetViz');
 safeRender(() => renderPlayerJetCompareViz(), 'renderPlayerJetCompareViz');
 safeRender(() => renderMainLoopEntryViz(), 'renderMainLoopEntryViz');
 safeRender(() => renderSectionCountdownViz(), 'renderSectionCountdownViz');
 safeRender(() => renderFuelBar(), 'renderFuelBar');
 safeRender(() => renderFuelLoViz(), 'renderFuelLoViz');
 safeRender(() => renderBlockPartViz(), 'renderBlockPartViz');
 safeRender(() => renderSlotAddrLookup(), 'renderSlotAddrLookup');
 safeRender(() => renderHexEditor(hexEditorFilterText), 'renderHexEditor');
 safeRender(() => renderPFcolorViz(), 'renderPFcolorViz');
 safeRender(() => renderShapePtrViz(), 'renderShapePtrViz');
 safeRender(() => renderJetSpritePtrViz(), 'renderJetSpritePtrViz');
 safeRender(() => renderPFptrViz(), 'renderPFptrViz');
 safeRender(() => renderColorPtrViz(), 'renderColorPtrViz');
 safeRender(() => renderSavedRngViz(), 'renderSavedRngViz');
 safeRender(() => renderNusizDetailViz(), 'renderNusizDetailViz');
 safeRender(() => renderSectionProgressViz(), 'renderSectionProgressViz');
 safeRender(() => renderBlockListViz(), 'renderBlockListViz');
 safeRender(() => renderFrameCntViz(), 'renderFrameCntViz');
 updateFrameAutoButton();
 safeRender(() => renderDxSpeedViz(), 'renderDxSpeedViz');
 safeRender(() => renderScorePtrsViz(), 'renderScorePtrsViz');
 safeRender(() => renderCollisionViz(), 'renderCollisionViz');
 safeRender(() => renderScorePtr2AliasesViz(), 'renderScorePtr2AliasesViz');
 safeRender(() => renderStateAreaViz(), 'renderStateAreaViz');
 safeRender(() => renderMainloopTraceViz(), 'renderMainloopTraceViz');
 safeRender(() => renderPlayerSwapViz(), 'renderPlayerSwapViz');
 safeRender(() => renderSectionEndViz(), 'renderSectionEndViz');
 safeRender(() => renderPosYLoViz(), 'renderPosYLoViz');
 safeRender(() => renderPrevPF1PatIdViz(), 'renderPrevPF1PatIdViz');
 safeRender(() => renderStateColorViz(), 'renderStateColorViz');
 safeRender(() => renderPlayerColorViz(), 'renderPlayerColorViz');
 safeRender(() => renderKernelLineNumViz(), 'renderKernelLineNumViz');
 safeRender(() => renderSaverStateViz(), 'renderSaverStateViz');
 safeRender(() => renderResetSeqViz(), 'renderResetSeqViz');
 safeRender(() => renderBlockLineViz(), 'renderBlockLineViz');
 safeRender(() => renderZeroConstsViz(), 'renderZeroConstsViz');
 safeRender(() => renderPf1PatIdViz(), 'renderPf1PatIdViz');
 safeRender(() => renderPlayer1StateViz(), 'renderPlayer1StateViz');
 safeRender(() => renderFuelDisplayViz(), 'renderFuelDisplayViz');
 safeRender(() => renderPlayer2StateViz(), 'renderPlayer2StateViz');
 safeRender(() => renderPF1PatIdPageViz(), 'renderPF1PatIdPageViz');
 safeRender(() => renderBlockOffsetLineViz(), 'renderBlockOffsetLineViz');
 safeRender(() => renderRngSeedViz(), 'renderRngSeedViz');
 safeRender(() => renderKernelTimingViz(), 'renderKernelTimingViz');
 safeRender(() => renderPF1PageAddressViz(), 'renderPF1PageAddressViz');
 safeRender(() => renderSectionBlockSeqViz(), 'renderSectionBlockSeqViz');
 safeRender(() => renderDiffPFViz(), 'renderDiffPFViz');
 safeRender(() => renderArrayEndsViz(), 'renderArrayEndsViz');
}

// ─── EVENT LISTENERS ────────────────────────────────────────────
fuelHiInput.addEventListener('input', syncView);
playerXInput.addEventListener('input', syncView);
missileXInput.addEventListener('input', syncView);
missileYInput.addEventListener('input', syncView);
joyByteInput.addEventListener('input', syncView);
frameCntInput.addEventListener('input', syncView);
frameSpeedInput.addEventListener('input', () => {
 frameSpeedInput.value = String(clampFrameSpeed(frameSpeedInput.value));
 if (!frameTimer) return;
 clearInterval(frameTimer);
 frameTimer = setInterval(() => {
  stepGameplayLoop(1);
 }, clampFrameSpeed(frameSpeedInput.value));
 updateFrameAutoButton();
});
prevWorldRowButton?.addEventListener('click', () => selectWorldRowByOffset(-1));
nextWorldRowButton?.addEventListener('click', () => selectWorldRowByOffset(1));
jumpCurrentTailButton?.addEventListener('click', () => selectWorldRowByKey(riverScrollRowKey('current-tail')));
jumpNextHeadButton?.addEventListener('click', () => selectWorldRowByKey(riverScrollRowKey('next-head')));
clearWorldPinButton?.addEventListener('click', () => {
 clearPinnedWorldHover();
 syncView();
});
prevFrameButton.addEventListener('click', () => {
 frameCntInput.value = String((clampByte(frameCntInput.value) - 1 + 256) & 0xff);
 syncView();
});
nextFrameButton.addEventListener('click', () => {
 stepGameplayLoop(1);
});
autoFrameButton.addEventListener('click', () => {
 if (frameTimer) {
  clearInterval(frameTimer);
  frameTimer = null;
  updateFrameAutoButton();
  return;
 }
 frameSpeedInput.value = String(clampFrameSpeed(frameSpeedInput.value));
 frameTimer = setInterval(() => {
  stepGameplayLoop(1);
 }, clampFrameSpeed(frameSpeedInput.value));
 updateFrameAutoButton();
});
if (fireMissileButton) {
 fireMissileButton.addEventListener('click', () => {
  fireMissile();
 });
}
applyResetButton.addEventListener('click', () => {
 visiblePort.applyVisibleResetLogic(memory);
 fuelHiInput.value = String(clampByte(fuelHiInput.value));
 playerXInput.value = String(clampPlayfieldX(playerXInput.value));
 missileXInput.value = String(clampPlayfieldX(missileXInput.value));
 missileYInput.value = String(clampByte(missileYInput.value));
 joyByteInput.value = String(clampByte(joyByteInput.value));
 frameCntInput.value = String(visiblePort.getField(memory, 'frameCnt'));
 visiblePort.setField(memory, 'fuelHi', clampByte(fuelHiInput.value));
 visiblePort.setField(memory, 'playerX', clampPlayfieldX(playerXInput.value));
 visiblePort.setField(memory, 'missileX', clampPlayfieldX(missileXInput.value));
 visiblePort.setField(memory, 'missileY', clampByte(missileYInput.value));
 visiblePort.setField(memory, 'joystick', clampByte(joyByteInput.value));
 syncView();
});
randomizeFuelButton.addEventListener('click', () => {
 fuelHiInput.value = String(Math.floor(Math.random() * 256)); syncView();
});
clearSlotsButton.addEventListener('click', () => { clearSlotModel(); syncView(); });
worldCanvas.addEventListener('mousemove', (event) => {
 const rect = worldCanvas.getBoundingClientRect();
 const cssY = event.clientY - rect.top;
 const canvasY = (cssY / rect.height) * worldCanvas.height;
 const hoveredRow = findWorldRenderRowByCanvasY(canvasY);
 const nextHover = hoveredRow?.projectedSlot?.slotIndex ?? -1;
 const nextHoverRowKey = hoveredRow?.rowKey ?? '';
 if (nextHover !== hoveredSlotIndex || nextHoverRowKey !== hoveredWorldRowKey) {
  hoveredSlotIndex = nextHover;
  hoveredWorldRowKey = nextHoverRowKey;
  syncView();
 }
 if (!worldHoverPinned) updateWorldHoverTooltip(hoveredRow?.projectedSlot ?? null, event, { rowMeta: hoveredRow ?? null });
 worldCanvas.style.cursor = hoveredRow ? 'pointer' : 'default';
});
worldCanvas.addEventListener('mouseleave', () => {
 hoveredSlotIndex = -1;
 hoveredWorldRowKey = '';
 worldCanvas.style.cursor = 'default';
 if (!worldHoverPinned) updateWorldHoverTooltip(null, null);
 syncView();
});
worldCanvas.addEventListener('click', (event) => {
 const rect = worldCanvas.getBoundingClientRect();
 const cssY = event.clientY - rect.top;
 const canvasY = (cssY / rect.height) * worldCanvas.height;
 const clickedRow = findWorldRenderRowByCanvasY(canvasY);
 if (!clickedRow || !clickedRow.projectedSlot) {
  clearPinnedWorldHover();
  return;
 }
 const clickedSlotIndex = clickedRow.projectedSlot.slotIndex;
 if (worldHoverPinned && pinnedWorldHover.rowKey === clickedRow.rowKey) {
  clearPinnedWorldHover();
  hoveredSlotIndex = clickedSlotIndex;
  hoveredWorldRowKey = clickedRow.rowKey;
  selectedSlotIndex = clickedSlotIndex;
  syncView();
  return;
 }
 selectedSlotIndex = clickedSlotIndex;
 hoveredSlotIndex = selectedSlotIndex;
 hoveredWorldRowKey = clickedRow.rowKey;
 syncView();
 updateWorldHoverTooltip(clickedRow.projectedSlot, event, { pinned: true, rowMeta: clickedRow });
});
paletteCanvas.addEventListener('click', (event) => {
 const rect = paletteCanvas.getBoundingClientRect();
 const cssX = event.clientX - rect.left, cssY = event.clientY - rect.top;
 const canvasX = (cssX / rect.width) * paletteCanvas.width;
 const canvasY = (cssY / rect.height) * paletteCanvas.height;
 const hues = 8, lums = 8;
 const cellW = (paletteCanvas.width - 20) / lums, cellH = (paletteCanvas.height - 40) / hues;
 const li = Math.floor((canvasX - 10) / cellW), hue = Math.floor((canvasY - 10) / cellH);
 if (li >= 0 && li < lums && hue >= 0 && hue < hues) {
  colorInspectorValue = (hue << 5) | ((li * 2) + 2); renderColorInspector();
 }
});

renderAddressMap();
syncView();
