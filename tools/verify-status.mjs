// Checks riverraidStatus.mjs against the ROM's status display, rendered pixel
// by pixel from the ROM's TIA writes (tools/atari/tia-render.mjs), on the lines
// after the 160-line kernel.
import { longRun } from './atari/longrun.mjs';
import { renderFrame } from './atari/tia-render.mjs';
import { statusLines, statusLinePixels } from '../riverraidStatus.mjs';
import { preKernel, kernel, statusTail } from '../riverraidFrame.mjs';

const frames = Number(process.argv[2] ?? 3000), seed = Number(process.argv[3] ?? 3), every = Number(process.argv[4] ?? 7);
const FIRST = 40 + 161; // the line after the kernel's last line
const ORACLE_SHIFT = 6;
let zp = null, n = 0, checked = 0, bad = 0;
const onCpu = (cpu, v) => { if (cpu.pc === 0xf027) zp = v.zeroPage(); };
for (const vcs of longRun({ frames, seed, onCpu, collisions: true, keepFuel: false, autoRestart: true })) {
  n += 1;
  if (n < 10 || n % every) continue;
  // the status display is drawn after MainLoop's setup, the kernel and DisplayState's RAM writes
  const mem = zp.slice();
  preKernel(mem, { swchb: 0x0b });
  kernel(mem);
  statusTail(mem);
  const model = statusLines(mem);
  const rom = renderFrame(vcs.lastFrameWrites, FIRST, model.length);
  checked += 1;
  const problems = [];
  model.forEach((line, i) => {
    const px = statusLinePixels(line);
    // the oracle renderer places status-area objects 6 pixels left of Stella; positions are checked against Stella separately
    const x = px.findIndex((c, k) => k >= 16 && k < 154 && (c & 0xfe) !== (rom[i][k - ORACLE_SHIFT] & 0xfe));
    if (x >= 0 && problems.length < 3) problems.push(`status line ${i} x ${x}: rom ${rom[i][x].toString(16)} js ${px[x].toString(16)}`);
  });
  if (problems.length) { bad += 1; if (bad <= 6) console.log(`frame ${n} gameMode ${zp[0xc6]} fuelHi ${zp[0xb7]}:`, problems.join('; ')); }
}
console.log({ checked, bad });
process.exit(bad ? 1 : 0);
