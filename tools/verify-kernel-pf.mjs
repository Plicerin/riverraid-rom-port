// Checks riverraidRiver.mjs kernelPlayfieldLines/playfieldPixels against the
// ROM kernel: per-pixel playfield, COLUPF and COLUBK on all 160 lines.
import { longRun } from './atari/longrun.mjs';
import { TIA } from './atari/vcs.mjs';
import { registerAt, playfieldLine } from './atari/tia-lines.mjs';
import { kernelPlayfieldLines, playfieldPixels, kernelBackgroundColor } from '../riverraidRiver.mjs';

const frames = Number(process.argv[2] ?? 20000), seed = Number(process.argv[3] ?? 5), every = Number(process.argv[4] ?? 3);
const FIRST = 40;
let zp = null, n = 0, checked = 0, bad = 0;
const onCpu = (cpu, vcs) => { if (cpu.pc === 0xf027) zp = vcs.zeroPage(); };
for (const vcs of longRun({ frames, seed, onCpu })) {
  n += 1;
  if (n < 30 || n % every) continue;
  const w = vcs.lastFrameWrites;
  const model = kernelPlayfieldLines(zp);
  const bg = kernelBackgroundColor(zp);
  checked += 1;
  const problems = [];
  for (let s = 0; s < 160 && problems.length < 3; s += 1) {
    const L = FIRST + s;
    const emuBits = playfieldLine(w, L, { PF0: 0xff });
    const modelBits = playfieldPixels(model[s]);
    const px = emuBits.findIndex((b, x) => b !== modelBits[x]);
    const emuColor = registerAt(w, TIA.COLUPF, L, 20), emuBg = registerAt(w, TIA.COLUBK, L, 20, 0x84);
    if (px >= 0) problems.push(`line ${s} pixel ${px} (block ${model[s].block} row ${model[s].row})`);
    else if (emuColor !== model[s].colupf) problems.push(`line ${s} COLUPF rom ${emuColor.toString(16)} js ${model[s].colupf.toString(16)} (block ${model[s].block} row ${model[s].row})`);
    else if (emuBg !== bg) problems.push(`line ${s} COLUBK rom ${emuBg.toString(16)} js ${bg.toString(16)}`);
  }
  if (problems.length) { bad += 1; if (bad <= 6) console.log(`frame ${n} blockOffset ${zp[0x8b]} blk ${[...zp.subarray(0x8e, 0x94)].map((b) => b.toString(16)).join(' ')}:`, problems.join('; ')); }
}
console.log({ checked, bad });
process.exit(bad ? 1 : 0);
