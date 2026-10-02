// Draws one frame of the port into a 160 x SCREEN_LINES ImageData: the
// 160-line kernel, the kernel's last playfield line once more, then the ROM's
// status display. Colors are TIA bytes looked up in Stella's NTSC palette;
// HMOVE on every line blanks the first 8 pixels; priority P0/M0 > P1 > PF > BK.

import { KERNEL_LINES } from './riverraidRiver.mjs';
import { statusLinePixels } from './riverraidStatus.mjs';
import { NTSC_PALETTE_RGB } from './riverraidPalette.mjs';

export const SCREEN_WIDTH = 160;
export const SCREEN_LINES = KERNEL_LINES + 1 + 38;

// display: runFrame(...).display; io: the io object after runFrame (colubk, colup0)
export function drawScreen(display, io, image) {
  const { pf, objs, masks, ssXor, ssMask, status } = display;
  const tint = (c) => ((c ^ ssXor) & ssMask) >> 1;
  const bg = (io.colubk ?? 0x84) >> 1;
  const p0 = (io.colup0 ?? 0x1c) >> 1;
  const data = image.data;
  const put = (s, x, index) => {
    const rgb = x < 8 ? 0 : NTSC_PALETTE_RGB[index];
    const o = (s * SCREEN_WIDTH + x) * 4;
    data[o] = rgb >> 16;
    data[o + 1] = (rgb >> 8) & 0xff;
    data[o + 2] = rgb & 0xff;
    data[o + 3] = 255;
  };
  for (let s = 0; s < KERNEL_LINES; s += 1) {
    const pfColor = tint(pf[s].colupf);
    const p1Color = tint(objs[s].colup1);
    const m = masks[s];
    for (let x = 0; x < SCREEN_WIDTH; x += 1) {
      put(s, x, (m.p0[x] || m.m0[x]) ? p0 : m.p1[x] ? p1Color : m.pf[x] ? pfColor : bg);
    }
  }
  const lastPf = masks[KERNEL_LINES - 1].pf, lastColor = tint(pf[KERNEL_LINES - 1].colupf);
  for (let x = 0; x < SCREEN_WIDTH; x += 1) put(KERNEL_LINES, x, lastPf[x] ? lastColor : bg);
  status.forEach((line, i) => {
    const row = statusLinePixels(line);
    for (let x = 0; x < SCREEN_WIDTH; x += 1) put(KERNEL_LINES + 1 + i, x, row[x] >> 1);
  });
}
