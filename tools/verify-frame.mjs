// End-to-end differential test of the frame port (riverraidFrame.mjs runFrame)
// against the ROM on the 6502 core with oracle collisions: every MainLoop
// state must turn into the next one, apart from kernel scratch bytes.
import { longRun } from './atari/longrun.mjs';
import { runFrame } from '../riverraidFrame.mjs';

const frames = Number(process.argv[2] ?? 5000), seed = Number(process.argv[3] ?? 3), keepFuel = process.argv[4] === 'fuel';
const SCRATCH = new Set([0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xd9, 0xda, 0xdb, 0xdc, 0xde, 0xed, 0xee, 0xf2, 0xfc, 0xfd, 0xfe, 0xff]);
const names = { 0x82: 'frameCnt', 0x84: 'joystick', 0x8b: 'blockOffset', 0xb2: 'missileY', 0xb3: 'playerX', 0xb5: 'speedY', 0xb7: 'fuelHi', 0xb8: 'fuelLo', 0xc0: 'livesPtr', 0xc6: 'gameMode', 0xe2: 'hitEnemyIdx', 0xe4: 'PFCrashFlag', 0xe6: 'missileFlag', 0xe8: 'collidedEnemy' };

let prev = null, io = { swcha: 0xff, swchb: 0x0b, inpt4: 0x80, inpt5: 0x80 }, vsyncSeen = false, n = 0, checked = 0, bad = 0;
const stats = { deaths: 0, hits: 0, refuels: 0, gameOvers: 0, twoPlayerFrames: 0, maxLevel: 0 };
const fresh = () => ({ swcha: 0xff, swchb: 0x0b, inpt4: 0x80, inpt5: 0x80 });
const attach = (vcs) => {
  vcs.onRead = (a) => {
    if ((a & 0x1280) === 0x280) {
      if ((a & 7) === 0) io.swcha = vcs.swcha;
      else if ((a & 7) === 2) { if (vsyncSeen) io.swchbNext = vcs.swchb; else io.swchb = vcs.swchb; }
    } else if ((a & 0x1080) === 0 && (a & 0x0f) === 0x0c) io.inpt4 = vcs.inpt4;
    else if ((a & 0x1080) === 0 && (a & 0x0f) === 0x0d) io.inpt5 = vcs.inpt5;
  };
  const w = vcs.write.bind(vcs);
  vcs.write = (addr, value, c) => { if ((addr & 0x1280) === 0 && (addr & 0x3f) === 0 && (value & 2)) vsyncSeen = true; w(addr, value, c); };
};
let attached = false;
const onCpu = (cpu, vcs) => {
  if (!attached) { attach(vcs); attached = true; }
  if (cpu.pc !== 0xf027) return;
  const zp = vcs.zeroPage();
  if (prev) {
    const mem = prev.slice();
    runFrame(mem, io);
    checked += 1;
    const diffs = [];
    for (let a = 0x80; a <= 0xff; a += 1) if (!SCRATCH.has(a) && mem[a] !== zp[a]) diffs.push(`${names[a] ?? '$' + a.toString(16)} js ${mem[a].toString(16)} rom ${zp[a].toString(16)}`);
    if (diffs.length) { bad += 1; if (bad <= 6) console.log(`frame ${n}: ${diffs.slice(0, 8).join(', ')}`); }
    if (prev[0xc6] === 0 && zp[0xc6] !== 0) stats.deaths += 1;
    if (zp[0xc6] === 0xff && prev[0xc6] !== 0xff) stats.gameOvers += 1;
    if (zp[0x80]) stats.twoPlayerFrames += 1;
    stats.maxLevel = Math.max(stats.maxLevel, zp[0xbd]);
    if (prev[0xb7] < zp[0xb7] && zp[0xc6] === 0) stats.refuels += 1;
    if ([0xcd, 0xcf, 0xd1, 0xd3, 0xd5].some((a) => prev[a] !== zp[a]) && zp[0xc6] !== 0xff) stats.hits += 1;
  }
  if (keepFuel) { vcs.ram[0xb7 & 0x7f] = 0xff; zp[0xb7] = 0xff; } // full fuel, applied where both sides see it
  prev = zp; io = fresh(); vsyncSeen = false;
  if (process.env.DEBUG_FRAME && n + 1 === Number(process.env.DEBUG_FRAME)) {
    console.log('state before frame', n + 1, JSON.stringify({ gameMode: zp[0xc6], blockOffset: zp[0x8b], playerX: zp[0xb3], reflect0: zp[0xe0], missileX: zp[0xf5], missileY: zp[0xb2], shapePtr0: zp[0xba].toString(16), blk: [...zp.subarray(0x8e, 0x94)].map((b) => b.toString(16)) }));
    vcs.onCollisionRead = (reg, c) => console.log('  rom read', reg, 'line', Math.floor(c / 76) - 40, 'cyc', c % 76, 'x', vcs.cpu.x, 'val', vcs.collisions(reg, c).toString(16));
  } else if (process.env.DEBUG_FRAME) vcs.onCollisionRead = null;
};
for (const _ of longRun({ frames, seed, onCpu, collisions: true, keepFuel: false, autoRestart: true })) n += 1;
console.log({ checked, bad, ...stats });
process.exit(bad ? 1 : 0);
