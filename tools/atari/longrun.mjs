// Plays the real ROM for many frames with random joystick input and fuel held
// full, yielding per-frame hooks. Used by the verification scripts.
import { VCS, loadRom } from './vcs.mjs';
import { attachOracleCollisions } from './collisions.mjs';

export function* longRun({ frames = 20000, seed = 1, onCpu, collisions = false, keepFuel = true, autoRestart = false } = {}) {
  const vcs = new VCS(loadRom());
  if (collisions) attachOracleCollisions(vcs);
  const hook = (cpu, v) => { if (collisions && cpu.pc === 0xf027) v.onFrameStartRam(v.zeroPage()); if (onCpu) onCpu(cpu, v); };
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  vcs.runFrames(5);
  vcs.swchb &= ~1; vcs.runFrames(4); vcs.swchb |= 1;
  let stick = 0xef; // up = accelerate, starts the game
  let wantPlayers = null;
  for (let f = 0; f < frames; f += 1) {
    if (f % 24 === 0) {
      const r = rand();
      stick = r < 0.35 ? 0xef : r < 0.55 ? 0xdf : r < 0.7 ? 0x7f : r < 0.85 ? 0xbf : 0xff;
    }
    vcs.swcha = (stick & 0xf0) | (stick >> 4); // player 2 mirrors player 1
    vcs.inpt4 = rand() < 0.3 ? 0x00 : 0x80;
    vcs.inpt5 = vcs.inpt4;
    if (autoRestart) {
      // after a game over: pick 1 or 2 players (SELECT toggles gameVariation), then press RESET
      const over = vcs.ram[0xc6 & 0x7f] === 0xff;
      vcs.swchb = 0x0b;
      if (!over) wantPlayers = null;
      else {
        if (wantPlayers === null) wantPlayers = rand() < 0.5 ? 1 : 0;
        if (vcs.ram[0x80 & 0x7f] !== wantPlayers) vcs.swchb &= ~2;
        else if (f % 8 === 0) vcs.swchb &= ~1;
      }
    }
    if (keepFuel) vcs.ram[0xb7 & 0x7f] = 0xff; // fuelHi: keep fuel full so the run reaches high levels
    vcs.runFrames(1, hook);
    yield vcs;
  }
}
