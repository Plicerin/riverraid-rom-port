// Turns a frame's timed TIA write log into per-scanline register values sampled
// at given color clocks (pixel x = 3 * cpuCycleInLine - 68, write lands 1 clock later).
import { CYCLES_PER_LINE, TIA } from './vcs.mjs';

export function registerAt(writes, reg, line, pixelX, initial = 0) {
  const t = line * CYCLES_PER_LINE + (pixelX + 68) / 3;
  let value = initial;
  for (const w of writes) {
    if (w.cycle + 1 > t) break;
    if (w.reg === reg) value = w.value;
  }
  return value;
}

// playfield pixel bits (0..159) for one line, CTRLPF reflect, sampling each PF
// register at the pixel being drawn
export function playfieldLine(writes, line, regsBefore = {}) {
  const bits = new Uint8Array(160);
  for (let x = 0; x < 160; x += 1) {
    const half = x < 80 ? x : 159 - x; // reflected
    const pf = Math.floor(half / 4);
    let on;
    if (pf < 4) on = (registerAt(writes, TIA.PF0, line, x, regsBefore.PF0 ?? 0) >> (4 + pf)) & 1;
    else if (pf < 12) on = (registerAt(writes, TIA.PF1, line, x, regsBefore.PF1 ?? 0) >> (7 - (pf - 4))) & 1;
    else on = (registerAt(writes, TIA.PF2, line, x, regsBefore.PF2 ?? 0) >> (pf - 12)) & 1;
    bits[x] = on;
  }
  return bits;
}

// Displayed object graphics per kernel line, sampled just after HBLANK:
// GRP0 (VDELP0 off in the main kernel), GRP1 through VDELP1 (the "old" copy is
// latched on every GRP0 write), ENAM0, COLUP1, NUSIZ1, REFP0/REFP1.
// (cycle 25 of the scanline; frame cycles count from the start of the VSYNC line)
export function objectLines(writes, firstLine, count, sampleCycle = 25) {
  const out = [];
  let i = 0;
  const st = { GRP0: 0, newGRP1: 0, oldGRP1: 0, ENAM0: 0, COLUP1: 0, NUSIZ1: 0, REFP0: 0, REFP1: 0 };
  for (let s = 0; s < count; s += 1) {
    const t = (firstLine + s) * CYCLES_PER_LINE + sampleCycle;
    while (i < writes.length && writes[i].cycle < t) {
      const w = writes[i++];
      if (w.reg === TIA.GRP0) { st.GRP0 = w.value; st.oldGRP1 = st.newGRP1; }
      else if (w.reg === TIA.GRP1) st.newGRP1 = w.value;
      else if (w.reg === TIA.ENAM0) st.ENAM0 = w.value;
      else if (w.reg === TIA.COLUP1) st.COLUP1 = w.value;
      else if (w.reg === TIA.NUSIZ1) st.NUSIZ1 = w.value;
      else if (w.reg === TIA.REFP0) st.REFP0 = w.value;
      else if (w.reg === TIA.REFP1) st.REFP1 = w.value;
    }
    out.push({ grp0: st.GRP0, grp1: st.oldGRP1, enam0: (st.ENAM0 >> 1) & 1, colup1: st.COLUP1, nusiz1: st.NUSIZ1, refp0: (st.REFP0 >> 3) & 1, refp1: (st.REFP1 >> 3) & 1 });
  }
  return out;
}
