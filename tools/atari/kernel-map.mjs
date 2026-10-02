import { longRun } from './longrun.mjs';
import { TIA } from './vcs.mjs';
import { registerAt } from './tia-lines.mjs';
const FIRST = 40;
const want = new Set(process.argv.slice(2).map(Number));
let n = 0, zp = null;
const onCpu = (cpu, vcs) => { if (cpu.pc === 0xf027) zp = vcs.zeroPage(); };
const hx = (v) => v.toString(16).padStart(2, '0');
for (const vcs of longRun({ frames: Math.max(...want) + 1, seed: 3, onCpu })) {
  n += 1;
  if (!want.has(n)) continue;
  const w = vcs.lastFrameWrites, z = zp;
  console.log(`frame ${n}: level ${z[0xbd]} blockOffset ${z[0x8b]} PF1Lst ${[...z.subarray(0xa6, 0xac)].map(hx).join(' ')} PF2Lst ${[...z.subarray(0xac, 0xb2)].map(hx).join(' ')} blk ${[...z.subarray(0x8e, 0x94)].map(hx).join(' ')}`);
  const runs = [];
  for (let s = 0; s < 160; s += 1) {
    const v = `${hx(registerAt(w, TIA.PF1, FIRST + s, 20))}/${hx(registerAt(w, TIA.PF2, FIRST + s, 50))}/${hx(registerAt(w, TIA.COLUPF, FIRST + s, 10))}`;
    if (runs.length && runs.at(-1).v === v) runs.at(-1).n += 1; else runs.push({ s, v, n: 1 });
  }
  console.log(runs.map((r) => `${r.s}x${r.n}:${r.v}`).join(' '));
}
