import { VCS, loadRom } from './vcs.mjs';
const vcs = new VCS(loadRom());
const hex = (b) => b.toString(16).padStart(2, '0');
const z = (a) => vcs.ramByte(a);
const dump = (label) => console.log(label, 'frame', vcs.frame, 'lines', Math.round((vcs.cpu.cycles - vcs.frameStart) / 76),
  'gameMode', hex(z(0xc6)), 'level', z(0xbd), 'secBlk', z(0xb9), 'blkOff', z(0x8b), 'posYLo', hex(z(0x8c)), 'speedY', hex(z(0xb5)),
  'PF1Pat', z(0xbc), 'PF1Lst', [...Array(6)].map((_, i) => hex(z(0xa6 + i))).join(' '), 'PF2Lst', [...Array(6)].map((_, i) => hex(z(0xac + i))).join(' '),
  'blk', [...Array(6)].map((_, i) => hex(z(0x8e + i))).join(' '), 'shape', [...Array(6)].map((_, i) => z(0xa0 + i)).join(','), 'rnd', hex(z(0xe9)) + hex(z(0xea)));
vcs.runFrames(10); dump('boot');
vcs.swchb &= ~1; vcs.runFrames(5); vcs.swchb |= 1; dump('reset');
for (let i = 0; i < 8; i++) { vcs.runFrames(30); dump('play'); }
console.log('frame cycles', vcs.lastFrameWrites.length, 'writes; last frame lines', Math.round(vcs.lastFrameWrites.at(-1)?.cycle / 76));
