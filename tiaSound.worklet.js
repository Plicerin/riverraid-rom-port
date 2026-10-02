// TIA sound generator (two channels) as an AudioWorklet, after Ron Fries'
// TIASound: each channel divides the 31.4 kHz audio clock by AUDF+1 (x3 for
// AUDC $C-$F) and on each tick steps the waveform its AUDC selects. River Raid
// uses AUDC 4 (pure tone), $C (pure tone, divide by 3) and 8 (9-bit noise).
// The game posts { c0, f0, v0, c1, f1, v1 } whenever the registers change.

const TIA_AUDIO_CLOCK = 3579545 / 114;

function lfsr(bits, tap, length) {
  // maximal-length shift register sequences used by the TIA polynomial counters
  const out = new Uint8Array(length);
  let reg = (1 << bits) - 1;
  for (let i = 0; i < length; i += 1) {
    out[i] = reg & 1;
    const fb = ((reg >> 0) ^ (reg >> tap)) & 1;
    reg = (reg >> 1) | (fb << (bits - 1));
  }
  return out;
}

const POLY4 = Uint8Array.from([1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0]);
const POLY5 = Uint8Array.from([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1]);
const DIV31 = Uint8Array.from({ length: 31 }, (_, i) => (i === 0 || i === 18 ? 1 : 0));
const POLY9 = lfsr(9, 4, 511);

class Channel {
  constructor() {
    this.audc = 0; this.audf = 0; this.audv = 0;
    this.divMax = 0; this.divCount = 0; this.out = 0;
    this.p4 = 0; this.p5 = 0; this.p9 = 0;
  }

  set(audc, audf, audv) {
    this.audc = audc & 0x0f; this.audf = audf & 0x1f; this.audv = audv & 0x0f;
    let max;
    if (this.audc === 0x00 || this.audc === 0x0b) { // set to 1
      max = 0;
      this.out = this.audv;
    } else {
      max = this.audf + 1;
      if ((this.audc & 0x0c) === 0x0c) max *= 3;
    }
    if (max !== this.divMax) {
      this.divMax = max;
      if (this.divCount === 0 || max === 0) this.divCount = max;
    }
    if (this.out) this.out = this.audv; // keep the current phase at the new volume
  }

  tick() {
    if (this.divCount > 1) { this.divCount -= 1; return; }
    if (this.divCount !== 1) return;
    this.divCount = this.divMax;
    this.p5 = (this.p5 + 1) % 31;
    const c = this.audc;
    const clocked = (c & 0x02) === 0 || ((c & 0x01) === 0 && DIV31[this.p5]) || ((c & 0x01) === 1 && POLY5[this.p5]);
    if (!clocked) return;
    if (c & 0x04) this.out = this.out ? 0 : this.audv; // pure tone
    else if (c & 0x08) {
      if (c === 0x08) { this.p9 = (this.p9 + 1) % 511; this.out = POLY9[this.p9] ? this.audv : 0; }
      else this.out = POLY5[this.p5] ? this.audv : 0;
    } else { this.p4 = (this.p4 + 1) % 15; this.out = POLY4[this.p4] ? this.audv : 0; }
  }
}

class TiaSound extends AudioWorkletProcessor {
  constructor() {
    super();
    this.channels = [new Channel(), new Channel()];
    this.phase = 0;
    this.dcIn = 0; this.dcOut = 0; // one-pole DC blocker: the TIA output only swings between 0 and AUDV
    this.port.onmessage = ({ data }) => {
      this.channels[0].set(data.c0 ?? 0, data.f0 ?? 0, data.v0 ?? 0);
      this.channels[1].set(data.c1 ?? 0, data.f1 ?? 0, data.v1 ?? 0);
    };
  }

  process(inputs, outputs) {
    const out = outputs[0][0];
    const ticksPerSample = TIA_AUDIO_CLOCK / sampleRate;
    for (let i = 0; i < out.length; i += 1) {
      // average the TIA output over the clock ticks inside this sample
      this.phase += ticksPerSample;
      let sum = 0, n = 0;
      while (this.phase >= 1) {
        this.phase -= 1;
        this.channels[0].tick();
        this.channels[1].tick();
        sum += this.channels[0].out + this.channels[1].out;
        n += 1;
      }
      const level = n ? sum / n : this.channels[0].out + this.channels[1].out;
      const x = (level / 30) * 0.6;
      this.dcOut = x - this.dcIn + 0.995 * this.dcOut;
      this.dcIn = x;
      out[i] = this.dcOut;
    }
    for (let ch = 1; ch < outputs[0].length; ch += 1) outputs[0][ch].set(out);
    return true;
  }
}

registerProcessor('tia-sound', TiaSound);
