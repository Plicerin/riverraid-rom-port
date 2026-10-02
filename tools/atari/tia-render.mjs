// Pixel-level TIA renderer for the dev oracle: replays a frame's timed register
// writes (players with VDEL/NUSIZ/REFP, missile 0, ball, playfield, colors,
// RESPx/HMOVE positioning) and returns palette indices for visible lines.
// The positioning constants are calibrated against Stella (see README).
import { CYCLES_PER_LINE, TIA } from './vcs.mjs';

const REG = {
  ...TIA, RESBL: 0x14, ENABL: 0x1f, HMBL: 0x24, VDELBL: 0x27, RESMP0: 0x28,
};
const signed4 = (v) => { const n = (v >> 4) & 0x0f; return n >= 8 ? n - 16 : n; };
const COPIES = [[0], [0, 16], [0, 32], [0, 16, 32], [0, 64], [0], [0, 32, 64], [0]];
const SCALE = [1, 1, 1, 1, 1, 2, 1, 4];

export const POSITION = { player: 5, missile: 4, ball: 4, hblank: 3 };

// returns { lines: [[palette byte per pixel]], hmoveLines: Set }
export function renderFrame(writes, firstLine, count, initial = {}) {
  const st = {
    COLUP0: 0, COLUP1: 0, COLUPF: 0, COLUBK: 0, CTRLPF: 0, PF0: 0, PF1: 0, PF2: 0,
    NUSIZ0: 0, NUSIZ1: 0, REFP0: 0, REFP1: 0, newGRP0: 0, oldGRP0: 0, newGRP1: 0, oldGRP1: 0,
    VDELP0: 0, VDELP1: 0, ENAM0: 0, ENABL: 0, HMP0: 0, HMP1: 0, HMM0: 0, HMBL: 0,
    P0: 0, P1: 0, M0: 0, BL: 0, ...initial,
  };
  const out = [];
  let w = 0;
  const apply = (wr) => {
    const v = wr.value;
    const clock = (wr.cycle % CYCLES_PER_LINE + 1) * 3; // color clock after the write cycle
    const pos = (delay) => (clock < 68 ? POSITION.hblank : clock - 68 + delay) % 160;
    switch (wr.reg) {
      case REG.GRP0: st.newGRP0 = v; st.oldGRP1 = st.newGRP1; break;
      case REG.GRP1: st.newGRP1 = v; st.oldGRP0 = st.newGRP0; break;
      case REG.RESP0: st.P0 = pos(POSITION.player); break;
      case REG.RESP1: st.P1 = pos(POSITION.player); break;
      case REG.RESM0: st.M0 = pos(POSITION.missile); break;
      case REG.RESBL: st.BL = pos(POSITION.ball); break;
      case REG.HMOVE:
        st.P0 = (st.P0 - signed4(st.HMP0) + 160) % 160;
        st.P1 = (st.P1 - signed4(st.HMP1) + 160) % 160;
        st.M0 = (st.M0 - signed4(st.HMM0) + 160) % 160;
        st.BL = (st.BL - signed4(st.HMBL) + 160) % 160;
        break;
      case REG.HMCLR: st.HMP0 = st.HMP1 = st.HMM0 = st.HMBL = 0; break;
      default: {
        const name = Object.keys(REG).find((k) => REG[k] === wr.reg);
        if (name && name in st) st[name] = v;
      }
    }
  };
  // fast-forward to the first line
  while (w < writes.length && writes[w].cycle < firstLine * CYCLES_PER_LINE) apply(writes[w++]);
  const playerBit = (graphics, pos, nusiz, reflect, x) => {
    if (!graphics) return 0;
    const scale = SCALE[nusiz & 7];
    const start = pos + (scale > 1 ? 1 : 0);
    for (const c of COPIES[nusiz & 7]) {
      const d = (x - start - c + 320) % 160;
      if (d < 8 * scale) {
        const bit = Math.floor(d / scale);
        return (graphics >> (reflect ? bit : 7 - bit)) & 1;
      }
    }
    return 0;
  };
  for (let s = 0; s < count; s += 1) {
    const lineStart = (firstLine + s) * CYCLES_PER_LINE;
    const row = new Array(160);
    // an HMOVE strobed at the very end of the previous line blanks this line's first 8 pixels too
    let hmove = writes.some((wr) => wr.reg === REG.HMOVE && wr.cycle >= lineStart - 3 && wr.cycle < lineStart);
    for (let x = 0; x < 160; x += 1) {
      const clock = 68 + x;
      while (w < writes.length && writes[w].cycle < lineStart + CYCLES_PER_LINE && (writes[w].cycle - lineStart + 1) * 3 <= clock) {
        if (writes[w].reg === REG.HMOVE && writes[w].cycle - lineStart < 3) hmove = true;
        else if (writes[w].reg === REG.HMOVE && writes[w].cycle - lineStart >= CYCLES_PER_LINE - 3) hmove = true;
        apply(writes[w++]);
      }
      const half = x < 80 ? x : (st.CTRLPF & 1 ? 159 - x : x - 80);
      const pfi = half >> 2;
      const pf = pfi < 4 ? (st.PF0 >> (4 + pfi)) & 1 : pfi < 12 ? (st.PF1 >> (11 - pfi)) & 1 : (st.PF2 >> (pfi - 12)) & 1;
      const g0 = st.VDELP0 & 1 ? st.oldGRP0 : st.newGRP0;
      const g1 = st.VDELP1 & 1 ? st.oldGRP1 : st.newGRP1;
      const p0 = playerBit(g0, st.P0, st.NUSIZ0, st.REFP0 & 8, x);
      const p1 = playerBit(g1, st.P1, st.NUSIZ1, st.REFP1 & 8, x);
      const m0 = (st.ENAM0 & 2) && x === st.M0;
      const ballWidth = 1 << ((st.CTRLPF >> 4) & 3);
      const bl = (st.ENABL & 2) && ((x - st.BL + 160) % 160) < ballWidth;
      let c;
      if (hmove && x < 8) c = 0;
      else if (p0 || m0) c = st.COLUP0;
      else if (p1) c = st.COLUP1;
      else if (pf || bl) c = st.COLUPF;
      else c = st.COLUBK;
      row[x] = c;
    }
    while (w < writes.length && writes[w].cycle < lineStart + CYCLES_PER_LINE) apply(writes[w++]);
    out.push(row);
  }
  return out;
}
