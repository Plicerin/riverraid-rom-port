// Checks the JS kernel collision model (line models + applyKernelCollisions)
// against the ROM with oracle collision registers: hitEnemyIdx, PFCrashFlag,
// missileFlag, collidedEnemy and the PF_COLLIDE flags after the last check ($F489).
import { longRun } from './atari/longrun.mjs';
import { kernelPlayfieldLines, kernelObjectLines, kernelLineMasks, collisionTimes, applyKernelCollisions } from '../riverraidRiver.mjs';
import { KERNEL_SHAPE_BYTES } from '../riverraidKernelSprites.mjs';
import { JET_PAGE_TAIL } from '../riverraidPlayfieldData.mjs';

const frames = Number(process.argv[2] ?? 6000), seed = Number(process.argv[3] ?? 3);
const jetTable = (lo) => Array.from({ length: 18 }, (_, i) => JET_PAGE_TAIL[lo + 1 + i - 0xbc]);
let zpK = null, expected = null, n = 0, checked = 0, bad = 0, events = 0;
const onCpu = (cpu, v) => {
  if (cpu.pc === 0xf027) zpK = v.zeroPage();
  else if (cpu.pc === 0xf489 && zpK) expected = v.zeroPage();
};
const watch = [0xe2, 0xe4, 0xe6, 0xe8, 0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94];
for (const _ of longRun({ frames, seed, onCpu, collisions: true, keepFuel: false })) {
  n += 1;
  if (!expected || !zpK) continue;
  const mem = zpK.slice();
  for (const a of [0xe2, 0xe4, 0xe6, 0xe8]) mem[a] = 0xff; // pre-kernel clears the collision variables
  const masks = kernelLineMasks(mem, kernelPlayfieldLines(mem), kernelObjectLines(mem, KERNEL_SHAPE_BYTES, jetTable(mem[0xba])));
  applyKernelCollisions(mem, collisionTimes(masks));
  checked += 1;
  if ([0xe2, 0xe4, 0xe6, 0xe8].some((a) => expected[a] !== 0xff)) events += 1;
  const diffs = watch.filter((a) => mem[a] !== expected[a]).map((a) => `$${a.toString(16)} js ${mem[a].toString(16)} rom ${expected[a].toString(16)}`);
  if (diffs.length) { bad += 1; if (bad <= 8) console.log(`frame ${n} blockOffset ${zpK[0x8b]}:`, diffs.join(', ')); }
  expected = null;
}
console.log({ checked, framesWithCollisions: events, bad });
process.exit(bad ? 1 : 0);
