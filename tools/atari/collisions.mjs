// Collision registers for the dev oracle: rasterizes the ROM's own TIA writes
// (playfield, displayed GRP0/GRP1, ENAM0, NUSIZ1/REFP1 per line) with the
// object geometry from riverraidRiver.mjs and latches overlaps between the
// last CXCLR and the read, like the TIA. Positions come from RAM at MainLoop.
import { CYCLES_PER_LINE, TIA } from './vcs.mjs';
import { registerAt, objectLines } from './tia-lines.mjs';
import { playerPixels, objectX } from '../../riverraidRiver.mjs';

const FIRST = 39, LINES = 160;
const pixelTime = (cycleInFrame) => {
  const line = Math.floor(cycleInFrame / CYCLES_PER_LINE) - FIRST;
  return line * 160 + 3 * (cycleInFrame % CYCLES_PER_LINE) - 68;
};

export function attachOracleCollisions(vcs) {
  let zp = null, clearT = -Infinity;
  const origWrite = vcs.write.bind(vcs);
  vcs.write = (addr, value, endCycles) => {
    origWrite(addr, value, endCycles);
    if ((addr & 0x1000) === 0 && (addr & 0x280) === 0 && (addr & 0x3f) === TIA.CXCLR) clearT = pixelTime(endCycles - 1 - vcs.frameStart) + 3;
  };
  vcs.onFrameStartRam = (z) => { zp = z; };
  vcs.collisions = (reg, cycleInFrame) => {
    if (!zp) return 0;
    const endT = Math.min(pixelTime(cycleInFrame), LINES * 160);
    if (endT <= clearT) return 0;
    const fromLine = Math.max(0, Math.floor(clearT / 160)), toLine = Math.min(LINES - 1, Math.floor((endT - 1) / 160));
    const w = vcs.writes;
    const objs = objectLines(w, FIRST, LINES);
    // P1 block per line: the block positioned by the latest RESP1 (pre-kernel positions block 5)
    const top = zp[0x8b] - 34;
    const resp1Lines = w.filter((x) => x.reg === TIA.RESP1).map((x) => Math.floor(x.cycle / CYCLES_PER_LINE) - FIRST);
    const blockAt = (s) => {
      const last = resp1Lines.filter((l) => l <= s).pop();
      if (last === undefined || last < 0) return 5;
      return 5 - Math.round((last - (top + 4)) / 32);
    };
    const jetX = zp[0xb3] + (zp[0xe0] ? 1 : 0), missileX = zp[0xf5] - 1;
    for (let s = fromLine; s <= toLine; s += 1) {
      const L = FIRST + s, o = objs[s];
      const p0 = new Set(playerPixels(o.grp0, jetX, 0, !!o.refp0));
      const b = blockAt(s);
      const p1 = new Set(b >= 0 && b <= 5 ? playerPixels(o.grp1, objectX(zp[0x94 + b], zp[0x9a + b]), o.nusiz1 & 7, !!o.refp1) : []);
      const pf0 = registerAt(w, TIA.PF0, L, 2, 0xff), pf1 = registerAt(w, TIA.PF1, L, 20), pf2 = registerAt(w, TIA.PF2, L, 50);
      for (let x = 0; x < 160; x += 1) {
        const t = s * 160 + x;
        if (t < clearT || t >= endT) continue;
        const half = x < 80 ? x : 159 - x, pf = half >> 2;
        const pfOn = pf < 4 ? (pf0 >> (4 + pf)) & 1 : pf < 12 ? (pf1 >> (11 - pf)) & 1 : (pf2 >> (pf - 12)) & 1;
        const m0 = o.enam0 && x === ((missileX % 160) + 160) % 160;
        const hit = reg === 0 ? m0 && p1.has(x) : reg === 2 ? pfOn && p0.has(x) : reg === 3 ? pfOn && p1.has(x) : reg === 4 ? pfOn && m0 : reg === 7 ? p0.has(x) && p1.has(x) : false;
        if (hit) return 0x80;
      }
    }
    return 0;
  };
  return vcs;
}
