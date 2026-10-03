// Minimal Atari 2600 bus for dev-time verification: 4K ROM, 128 bytes RAM,
// RIOT timer and switches, and a timed log of TIA register writes.
// Collision registers read as 0 unless a collision callback is supplied.
// Not used by the game itself.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { M6502 } from './m6502.mjs';

export const ROM_MD5 = '393948436d1f4cc3192410bb918f9724';
export const CYCLES_PER_LINE = 76;

export const TIA = Object.freeze({
  VSYNC: 0x00, VBLANK: 0x01, WSYNC: 0x02, NUSIZ0: 0x04, NUSIZ1: 0x05, COLUP0: 0x06, COLUP1: 0x07,
  COLUPF: 0x08, COLUBK: 0x09, CTRLPF: 0x0a, REFP0: 0x0b, REFP1: 0x0c, PF0: 0x0d, PF1: 0x0e, PF2: 0x0f,
  RESP0: 0x10, RESP1: 0x11, RESM0: 0x12, GRP0: 0x1b, GRP1: 0x1c, ENAM0: 0x1d, HMP0: 0x20, HMP1: 0x21,
  HMM0: 0x22, VDELP0: 0x25, VDELP1: 0x26, HMOVE: 0x2a, HMCLR: 0x2b, CXCLR: 0x2c,
});

export function loadRom(path = 'reference/river-raid-wiz-main/baserom.a26') {
  const rom = readFileSync(path);
  const md5 = createHash('md5').update(rom).digest('hex');
  if (md5 !== ROM_MD5) throw new Error(`unexpected ROM md5 ${md5}`);
  return rom;
}

export class VCS {
  constructor(rom, options = {}) {
    this.rom = rom;
    this.ram = new Uint8Array(128);
    this.swcha = 0xff;
    this.swchb = 0x0b;          // reset/select released, color, both difficulties B
    this.inpt4 = 0x80;          // fire released
    this.inpt5 = 0x80;
    this.collisions = options.collisions ?? null; // (reg) => byte
    this.timer = { value: 0, interval: 1024, setAt: 0 };
    this.frame = 0;
    this.frameStart = 0;
    this.writes = [];           // current frame's TIA writes: {reg, value, cycle}
    this.lastFrameWrites = [];
    this.onFrame = null;
    this.cpu = new M6502(this);
    this.cpu.reset();
  }

  // RIOT timer as Stella models it: the written value is decremented on the
  // cycle after the write and then once per interval; after it passes 0 it
  // wraps to $FF and counts down once per cycle. cycles is the CPU count after
  // the reading instruction, whose read is on its last cycle.
  intim(cycles) {
    const { value, interval, setAt } = this.timer;
    const d = cycles - 1 - setAt;
    const ticks = Math.floor((d + interval - 1) / interval);
    if (ticks <= value) return value - ticks;
    return (0xff - (d - (value * interval + 1))) & 0xff;
  }

  read(addr) {
    const a = addr & 0x1fff;
    if (this.onRead) this.onRead(a, this.cpu);
    if (a & 0x1000) return this.rom[a & 0x0fff];
    if ((a & 0x280) === 0x80) return this.ram[a & 0x7f];
    if ((a & 0x280) === 0x280) {
      switch (a & 0x7) {
        case 0x0: return this.swcha;
        case 0x2: return this.swchb;
        case 0x4: case 0x6: return this.intim(this.cpu.cycles);
        default: return 0;
      }
    }
    const reg = a & 0x0f;
    if (reg <= 0x07) {
      if (this.onCollisionRead) this.onCollisionRead(reg, this.cpu.cycles - 1 - this.frameStart);
      return this.collisions ? this.collisions(reg, this.cpu.cycles - 1 - this.frameStart) & 0xc0 : 0;
    }
    if (reg === 0x0c) return this.inpt4;
    if (reg === 0x0d) return this.inpt5;
    return 0x80;
  }

  write(addr, value, endCycles) {
    // a store writes on its last cycle; the CPU's counter is already past it
    const cycles = endCycles - 1;
    const a = addr & 0x1fff;
    if (a & 0x1000) return;
    if ((a & 0x280) === 0x80) { this.ram[a & 0x7f] = value; return; }
    if ((a & 0x280) === 0x280) {
      const intervals = { 0x14: 1, 0x15: 8, 0x16: 64, 0x17: 1024 };
      const iv = intervals[a & 0x17];
      if (iv) this.timer = { value, interval: iv, setAt: cycles };
      return;
    }
    const reg = a & 0x3f;
    this.writes.push({ reg, value, cycle: cycles - this.frameStart });
    if (reg === TIA.WSYNC) {
      this.cpu.cycles = (Math.floor(cycles / CYCLES_PER_LINE) + 1) * CYCLES_PER_LINE;
    } else if (reg === TIA.VSYNC && (value & 0x02)) {
      this.lastFrameWrites = this.writes;
      this.writes = [];
      this.frame += 1;
      this.frameStart = cycles - (cycles % CYCLES_PER_LINE); // the beam keeps its place in the line
      if (this.onFrame) this.onFrame(this);
    }
  }

  runFrames(n, hook) {
    const target = this.frame + n;
    while (this.frame < target) {
      if (hook) hook(this.cpu, this);
      this.cpu.step();
    }
  }

  ramByte(zpAddr) { return this.ram[zpAddr & 0x7f]; }
  zeroPage() { const zp = new Uint8Array(256); zp.set(this.ram, 0x80); return zp; }
}
