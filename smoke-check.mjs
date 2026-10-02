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
