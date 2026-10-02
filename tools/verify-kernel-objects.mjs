// Checks riverraidRiver.mjs kernelObjectLines against the ROM kernel's TIA
// writes: displayed GRP0 (jet), GRP1 (enemy, VDELP1), COLUP1 and ENAM0 on all
// 160 kernel lines.
import { longRun } from './atari/longrun.mjs';
import { objectLines } from './atari/tia-lines.mjs';
import { kernelObjectLines } from '../riverraidRiver.mjs';
import { KERNEL_SHAPE_BYTES } from '../riverraidKernelSprites.mjs';

const frames = Number(process.argv[2] ?? 8000), seed = Number(process.argv[3] ?? 5), every = Number(process.argv[4] ?? 3);
let zp = null, rom = null, n = 0, checked = 0, bad = 0;
const onCpu = (cpu, vcs) => { if (cpu.pc === 0xf027) zp = vcs.zeroPage(); rom = vcs.rom; };
const jetTableAt = (lo) => Array.from({ length: 18 }, (_, i) => rom[(0xc00 | ((lo + 1 + i) & 0xff))]); // shapePtr0 = table-1 in page $FC
for (const vcs of longRun({ frames, seed, onCpu })) {
  n += 1;
  if (n < 30 || n % every) continue;
  const emu = objectLines(vcs.lastFrameWrites, 40, 160);
  const model = kernelObjectLines(zp, KERNEL_SHAPE_BYTES, jetTableAt(zp[0xba]));
  checked += 1;
  const problems = [];
  for (let s = 0; s < 160 && problems.length < 4; s += 1) {
    const e = emu[s], m = model[s];
    if (e.grp0 !== m.grp0) problems.push(`line ${s} GRP0 rom ${e.grp0.toString(16)} js ${m.grp0.toString(16)}`);
    if (e.grp1 !== m.grp1) problems.push(`line ${s} GRP1 rom ${e.grp1.toString(16)} js ${m.grp1.toString(16)}`);
    if (e.grp1 && e.colup1 !== m.colup1) problems.push(`line ${s} COLUP1 rom ${e.colup1.toString(16)} js ${m.colup1.toString(16)}`);
    if (e.enam0 !== m.enam0) problems.push(`line ${s} ENAM0 rom ${e.enam0} js ${m.enam0} (missileY ${zp[0xb2]})`);
  }
  if (problems.length) { bad += 1; if (bad <= 6) console.log(`frame ${n} blockOffset ${zp[0x8b]}:`, problems.join('; ')); }
}
console.log({ checked, bad });
process.exit(bad ? 1 : 0);
