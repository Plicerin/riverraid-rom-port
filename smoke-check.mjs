import * as visiblePort from './riverraidVisiblePort.mjs';
import { resolvePlayerJetBitmap } from './playerJetSprite.mjs';
import { VERIFIED_SPRITE_VARIANT_META } from './riverraid_verified_sprite_meta.mjs';
import * as objectPort from './riverraid_port.js';

const memory = visiblePort.createZeroPageMemory();
visiblePort.applyVisibleResetLogic(memory);
visiblePort.setField(memory, 'gameMode', visiblePort.GAME_CONSTANTS.INTRO_SCROLL);
visiblePort.setField(memory, 'fuelHi', 183);
visiblePort.setField(memory, 'fuelLo', 0xff);
visiblePort.writeByte(memory, visiblePort.ZERO_PAGE_INDEX.livesPtr.address, 3);
visiblePort.advanceVisibleSlotScene(memory);

const beforeFrame = visiblePort.getField(memory, 'frameCnt');
const step = visiblePort.stepVisibleGameplayLoop(memory);
const slots = visiblePort.inspectVisibleSlots(memory);
const jet = resolvePlayerJetBitmap(1, 0);

if (visiblePort.getField(memory, 'frameCnt') !== ((beforeFrame + 1) & 0xff)) {
  throw new Error('frame counter did not advance');
}
if (!step?.lastStep) throw new Error('gameplay step did not return lastStep');
if (!Array.isArray(slots) || slots.length !== visiblePort.GAME_CONSTANTS.NUM_BLOCKS) {
  throw new Error('visible slot inspection failed');
}
if (!Array.isArray(jet) || jet.length === 0) throw new Error('player jet bitmap failed');
if (!VERIFIED_SPRITE_VARIANT_META || typeof VERIFIED_SPRITE_VARIANT_META !== 'object') {
  throw new Error('verified sprite metadata missing');
}
if (objectPort.NUM_BLOCKS !== visiblePort.GAME_CONSTANTS.NUM_BLOCKS) {
  throw new Error('object-port constants do not match visible-port constants');
}

console.log('smoke-check ok');

// *** ROM port: power on, RESET, start screen, play ***
const { romReset, runFrame, Z } = await import('./riverraidFrame.mjs');
const rom = new Uint8Array(0x100);
const io = { swcha: 0xff, swchb: 0x0b, inpt4: 0x80, inpt5: 0x80 };
const frameOf = () => runFrame(rom, io).display;
romReset(rom, 0);
for (let i = 0; i < 5; i += 1) frameOf();
io.swchb = 0x0a;
for (let i = 0; i < 4; i += 1) frameOf();
io.swchb = 0x0b;
let start;
for (let i = 0; i < 200; i += 1) start = frameOf();
if (rom[Z.gameMode] !== 48) throw new Error(`expected the ready state after RESET, gameMode ${rom[Z.gameMode]}`);
if (rom[Z.livesPtr] !== 0x18) throw new Error('expected three lives after RESET');
// checksum of the start screen, which matches the Stella snapshot pixel for pixel
const START_SCREEN_HASH = 0x3a599da4;
let hash = 0x811c9dc5;
start.masks.forEach((m, s) => {
  for (let x = 0; x < 160; x += 1) {
    const v = (m.p0[x] || m.m0[x]) ? 1 : m.p1[x] ? 2 + start.objs[s].colup1 : m.pf[x] ? 3 + start.pf[s].colupf : 0;
    hash = Math.imul(hash ^ v, 0x01000193) >>> 0;
  }
});
if (hash !== START_SCREEN_HASH) throw new Error(`start screen changed: hash ${hash.toString(16)}`);
io.swcha = 0xef; // push up: start and accelerate
const shapesBefore = [...rom.subarray(Z.Shape1IdLst, Z.Shape1IdLst + 6)].join(',');
let ran = false;
for (let i = 0; i < 60; i += 1) { frameOf(); ran ||= rom[Z.gameMode] === 0; }
if (!ran) throw new Error('game did not start running');
if ([...rom.subarray(Z.Shape1IdLst, Z.Shape1IdLst + 6)].join(',') === shapesBefore) throw new Error('no new river blocks were generated');

console.log('rom-port smoke-check ok');
