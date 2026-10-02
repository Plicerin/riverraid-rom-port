import { longRun } from './longrun.mjs';
const seen = new Set(); let runs = 0;
const onCpu = (cpu, vcs) => {
  const op = vcs.rom[cpu.pc & 0xfff], operand = vcs.rom[(cpu.pc + 1) & 0xfff];
  if (op === 0xb1 && (operand === 0xd9 || operand === 0xdb)) {
    const base = vcs.ram[operand & 0x7f] | (vcs.ram[(operand + 1) & 0x7f] << 8);
    seen.add((base + cpu.y) & 0xffff);
  }
};
let maxLevel = 0;
for (const vcs of longRun({ frames: 60000, onCpu })) { maxLevel = Math.max(maxLevel, vcs.ram[0xbd & 0x7f]); runs++; }
const addrs = [...seen].sort((a, b) => a - b);
const ranges = []; for (const a of addrs) { const r = ranges.at(-1); if (r && a === r[1] + 1) r[1] = a; else ranges.push([a, a]); }
console.log('frames', runs, 'max level', maxLevel, 'distinct PF addrs', addrs.length);
console.log(ranges.map(([a, b]) => `$${a.toString(16)}-$${b.toString(16)}`).join(' '));
