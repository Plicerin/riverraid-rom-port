// Plays the ROM's TIA sound registers through tiaSound.worklet.js. Browsers
// only allow audio after a user gesture, so call start() from an input event.
// update(io.audio) after each frame; registers the ROM did not write keep
// their values. setSilent() mutes without losing the register state.

export function createTiaAudio(workletUrl) {
  const regs = { c0: 0, f0: 0, v0: 0, c1: 0, f1: 0, v1: 0 };
  let ctx = null;
  let node = null;
  let silent = false;

  const send = () => {
    if (node) node.port.postMessage(silent ? { ...regs, v0: 0, v1: 0 } : regs);
  };

  return {
    async start() {
      if (ctx) { if (ctx.state === 'suspended') await ctx.resume(); return; }
      try {
        ctx = new AudioContext();
        await ctx.audioWorklet.addModule(workletUrl);
        node = new AudioWorkletNode(ctx, 'tia-sound', { outputChannelCount: [2] });
        node.connect(ctx.destination);
        send();
      } catch (error) {
        console.warn('TIA sound unavailable:', error);
      }
    },
    update(audio = {}) {
      let changed = false;
      for (const [key, value] of Object.entries(audio)) {
        if (regs[key] !== value) { regs[key] = value; changed = true; }
      }
      if (changed) send();
    },
    setSilent(value) {
      if (silent !== value) { silent = value; send(); }
    },
    suspend() { if (ctx) ctx.suspend(); },
    resume() { if (ctx) ctx.resume(); },
  };
}
