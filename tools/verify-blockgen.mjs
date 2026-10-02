// Differential test: the JS block generator (riverraidRiver.mjs runSetBlockVars)
// must turn every zero-page state captured at the ROM's .setBlockVars ($F85D)
// into exactly the state the ROM reaches at .mainLoopJmp ($F85A).
import { longRun } from './atari/longrun.mjs';
import { runSetBlockVars } from '../riverraidRiver.mjs';

const frames = Number(process.argv[2] ?? 30000);
const seed = Number(process.argv[3] ?? 1);
let before = null, checked = 0, newBlocks = 0, failures = 0;
const levels = new Set();
const onCpu = (cpu, vcs) => {
  if (cpu.pc === 0xf85d) before = vcs.zeroPage();
  else if (cpu.pc === 0xf85a && before) {
    const expected = vcs.zeroPage();
    const actual = before.slice();
    runSetBlockVars(actual);
    checked += 1;
    if (expected[0x8e + 5] !== before[0x8e + 5] || expected[0xa0 + 5] !== before[0xa0 + 5]) newBlocks += 1;
    levels.add(expected[0xbd]);
    const diffs = [];
    for (let a = 0x80; a <= 0xfd; a += 1) if (actual[a] !== expected[a]) diffs.push(`$${a.toString(16)}: js ${actual[a].toString(16)} rom ${expected[a].toString(16)} (was ${before[a].toString(16)})`);
    if (diffs.length && failures < 5) console.log(`MISMATCH #${checked}:`, diffs.join(', '));
    if (diffs.length) failures += 1;
    before = null;
  }
};
for (const _ of longRun({ frames, seed, onCpu })) { /* run */ }
console.log({ checked, framesWithNewBlockData: newBlocks, levels: levels.size, failures });
process.exit(failures ? 1 : 0);
