// Playable River Raid for the tribute page: the ROM port (riverraidFrame.mjs)
// on a canvas, keyboard input while the game has focus, a gamepad, touch
// buttons on phones, and the TIA sound worklet. Mount with mountPlayer(rootElement).

import { romReset, runFrame, Z } from './riverraidFrame.mjs';
import { drawScreen, SCREEN_WIDTH, SCREEN_LINES } from './riverraidScreen.mjs';
import { createTiaAudio } from './riverraidAudio.mjs';
import { readGamepad, gamepadEdges } from './riverraidGamepad.mjs';

const FRAME_MS = 1000 / 60;
const KEYS = {
  ArrowRight: 'right', KeyD: 'right', ArrowLeft: 'left', KeyA: 'left',
  ArrowDown: 'down', KeyS: 'down', ArrowUp: 'up', KeyW: 'up', Space: 'fire', KeyZ: 'fire',
};

export function mountPlayer(root) {
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const playButton = root.querySelector('[data-play]');
  const poster = root.querySelector('[data-poster]');
  const hint = root.querySelector('[data-hint]');
  const muteButton = root.querySelector('[data-mute]');
  const pauseButton = root.querySelector('[data-pause]');

  const memory = new Uint8Array(0x100);
  const io = { swcha: 0xff, swchb: 0x0b, inpt4: 0x80, inpt5: 0x80 };
  const held = new Set();
  const audio = createTiaAudio(new URL('./tiaSound.worklet.js', import.meta.url).href);
  const screen = document.createElement('canvas');
  screen.width = SCREEN_WIDTH;
  screen.height = SCREEN_LINES;
  const screenCtx = screen.getContext('2d');
  const image = screenCtx.createImageData(SCREEN_WIDTH, SCREEN_LINES);

  let started = false, paused = false, muted = false, resetHold = 0;
  let display = null, last = 0, acc = 0, pad = null;

  const restore = window.claude?.hot?.data;
  if (restore?.memory) memory.set(restore.memory);
  else romReset(memory, 0); // power on: the cartridge runs its attract mode until RESET
  window.claude?.hot?.snapshot?.(() => ({ memory: Array.from(memory) }));

  const setHint = (text) => { hint.textContent = text; };
  const silence = () => audio.setSilent(muted || paused || !started);

  function step() {
    const on = (control) => held.has(control) || !!pad?.[control];
    let swcha = 0xff;
    if (on('right')) swcha &= ~0x80;
    if (on('left')) swcha &= ~0x40;
    if (on('down')) swcha &= ~0x20;
    if (on('up')) swcha &= ~0x10;
    io.swcha = swcha;
    io.inpt4 = on('fire') ? 0x00 : 0x80;
    io.swchb = resetHold > 0 ? 0x0a : 0x0b; // bit 0 low: the RESET switch
    io.swchbNext = undefined;
    const before = memory[Z.gameMode];
    display = runFrame(memory, io).display;
    if (resetHold > 0) resetHold -= 1;
    audio.update(io.audio);
    const mode = memory[Z.gameMode];
    if (started && mode !== before) {
      if (mode === 48) setHint('Push up or fire to take off.');
      else if (mode === 0) setHint('Arrows, WASD or a gamepad fly; Space, Z or A fires. P pauses, M mutes.');
      else if (mode === 0xff) setHint('Game over. Press Enter or Reset to play again.');
    }
  }

  function draw() {
    if (!display) return;
    drawScreen(display, io, image);
    screenCtx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(screen, 0, 0, canvas.width, canvas.height);
  }

  function frame(t) {
    if (!last) last = t;
    const dt = Math.min(100, t - last);
    last = t;
    pad = readGamepad();
    const edges = gamepadEdges(pad);
    if (edges.start) (started ? pressReset() : play());
    if (edges.back && started) togglePause();
    if (!paused && !document.hidden) {
      acc += dt;
      while (acc >= FRAME_MS) { step(); acc -= FRAME_MS; }
    }
    draw();
    requestAnimationFrame(frame);
  }

  function pressReset() {
    resetHold = 2;
    paused = false;
    pauseButton.textContent = 'Pause';
    silence();
  }

  async function play() {
    started = true;
    poster.hidden = true;
    canvas.focus({ preventScroll: true });
    await audio.start();
    silence();
    pressReset();
  }

  function togglePause() {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    silence();
  }

  function toggleMute() {
    muted = !muted;
    muteButton.textContent = muted ? 'Sound on' : 'Mute';
    muteButton.setAttribute('aria-pressed', String(muted));
    silence();
  }

  playButton.addEventListener('click', play);
  pauseButton.addEventListener('click', () => { if (started) togglePause(); });
  muteButton.addEventListener('click', toggleMute);
  root.querySelector('[data-reset]').addEventListener('click', () => { if (started) pressReset(); else play(); });

  canvas.addEventListener('keydown', (event) => {
    const control = KEYS[event.code];
    if (control) { event.preventDefault(); held.add(control); }
    if (event.code === 'Enter') { event.preventDefault(); started ? pressReset() : play(); }
    if (event.code === 'KeyP') togglePause();
    if (event.code === 'KeyM') toggleMute();
  });
  canvas.addEventListener('keyup', (event) => { const control = KEYS[event.code]; if (control) held.delete(control); });
  canvas.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', () => { if (!started) play(); });

  // touch controls: hold to press
  root.querySelectorAll('[data-hold]').forEach((button) => {
    const control = button.dataset.hold;
    const down = (event) => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); held.add(control); if (!started) play(); };
    const up = () => held.delete(control);
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  });

  document.addEventListener('visibilitychange', () => (document.hidden ? audio.suspend() : audio.resume()));

  if (restore?.memory) { started = true; poster.hidden = true; }
  step();
  draw();
  requestAnimationFrame(frame);
}
