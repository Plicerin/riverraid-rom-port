// River Raid — Entry point.
//
// Sets up a 320x240 internal canvas (scaled 2x to 640x480) and starts
// a requestAnimationFrame-driven Game loop. Also exposes a small
// public surface for headless tests / Node.js PNG dumps.

import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { PixTest } from './pixtest.js';
import { AudioBus } from './audio.js';
import { W, H } from './data.js';

const SCALE = 2;

export function createGame(internalCtx, input) {
  const renderer = new Renderer(internalCtx);
  const game = new Game(renderer, input);
  game.renderer.drawTitle();           // paint initial frame
  return game;
}

export function startGame(canvasEl) {
  const W_IN = W, H_IN = H;
  canvasEl.width  = W_IN * SCALE;
  canvasEl.height = H_IN * SCALE;
  const ctx = canvasEl.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Offscreen buffer at internal resolution.
  const buf = document.createElement('canvas');
  buf.width = W_IN;
  buf.height = H_IN;
  const g = buf.getContext('2d');

  const input = new Input(window);
  const renderer = new Renderer(g);
  const audio = new AudioBus();
  const game = new Game(renderer, input, audio);

  // Runtime pixel-test harness: reads back the INTERNAL 320x240 canvas
  // via getImageData after every blit and compares each alive sprite's
  // pixel rect against its LSB-first expected grid (bytesToPixels).
  // Fails loudly in the browser (red chip + side-by-side ASCII dump in
  // console) the moment the decoder convention is flipped again.
  // UI chip is gated behind `?pixtest=1` to keep the shipping page clean;
  // console + window.__pixtest aggregate are always on.
  const pixtestHarness = new PixTest(g, game, () => game.state);

  let lastTs = 0;
  const FRAME_MS = 1000 / 60;

  function loop(ts) {
    if (!lastTs || ts - lastTs >= FRAME_MS) {
      lastTs = ts;
      const beforeState = game.state;

      try {
        game.tick();
      } catch (e) {
        console.error('[TICK EXCEPTION] before=', beforeState, 'after=', game.state,
                      'msg=', e && e.message, '\n', e && e.stack);
      }

      try {
        ctx.imageSmoothingEnabled = false;
        // Defensive: reset any non-default blend / opacity state on the
        // visible context before blitting. If something earlier in the
        // session set globalAlpha=0 or composite 'destination-out', every
        // drawImage call would silently produce zero pixels — exactly the
        // symptom we saw when "internal full / visible black".
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.drawImage(buf, 0, 0, W_IN, H_IN, 0, 0, canvasEl.width, canvasEl.height);
      } catch (e) {
        console.error('[BLIT EXCEPTION]', e && e.message, '\n', e && e.stack);
      }

      // ── Runtime pixel-test: sample the Internal 320x240 buffer ──
      // Reads back the actual sprite pixels and compares against the
      // LSB-first expected grid. Self-throttles (LOG_THROTTLE_MS).
      // onlyDuring PLAYING — Title/Score-Scroll-In/Game-Over have no
      // sprites. We sample the internal buffer (not the 2x visible
      // canvas) because bbox coords match the sprite's 8x18 grid 1:1.
      try {
        if (pixtestHarness && game.state === 'PLAYING') {
          pixtestHarness.sample();
        }
      } catch (e) {
        console.error('[pixtest EXCEPTION]', e && e.message, '\n', e && e.stack);
      }

      // ┌── DIAGNOSTIC ──────────────────────────────────────────────
      // Sample pixel histograms of BOTH buffers side-by-side to verify
      // that the blit actually transfers pixels from internal → visible.
      // Off by default — set `window.__diag = true` to enable.
      if (typeof window !== 'undefined' && window.__diag) {
        try {
          const bufctx = buf.getContext('2d');
          const bufData = bufctx.getImageData(0, 0, W_IN, H_IN).data;
          let bufNb = 0;
          for (let i = 0; i < bufData.length; i += 4) {
            if (bufData[i] + bufData[i + 1] + bufData[i + 2] + bufData[i + 3] > 0) bufNb++;
          }

          const visData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height).data;
          let visNb = 0;
          let centerRgba = [0, 0, 0, 0];
          const cx = Math.floor(canvasEl.width / 2);
          const cy = Math.floor(canvasEl.height / 2);
          const centerIdx = (cy * canvasEl.width + cx) * 4;
          if (centerIdx >= 0 && centerIdx + 3 < visData.length) {
            centerRgba = [visData[centerIdx], visData[centerIdx + 1],
                           visData[centerIdx + 2], visData[centerIdx + 3]];
          }
          for (let i = 0; i < visData.length; i += 4) {
            if (visData[i] + visData[i + 1] + visData[i + 2] + visData[i + 3] > 0) visNb++;
          }

          console.log('[diag] state=', game.state,
                      'bufNonBlack=', bufNb,
                      'visibleNonBlack=', visNb,
                      'visibleCenterRGBA=', centerRgba.join(','),
                      'bufW=', buf.width, 'bufH=', buf.height,
                      'visibleW=', canvasEl.width, 'visibleH=', canvasEl.height,
                      'ctxAlpha=', ctx.globalAlpha,
                      'ctxComposite=', ctx.globalCompositeOperation);
        } catch (e) {
          console.error('[diag exception]', e && e.message);
        }
      }
      // ────────────────────────────────────────────────────────────
    }
    requestAnimationFrame(loop);
  }

  game.renderer.drawTitle();
  requestAnimationFrame(loop);

  // Expose for browser-console debugging / verification.
  window.__game = game;
  window.__input = input;

  return { game, buf, ctx, input };
}

// Browser auto-start.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Defensive boot: if our module loads AFTER DOMContentLoaded has
  // already fired (e.g. cached/preloaded module, or the document was
  // parsed before our listener was attached), start synchronously.
  // Otherwise wait for DOMContentLoaded normally.
  const boot = () => {
    const canvas = document.getElementById('game');
    if (!canvas) return;
    const handles = startGame(canvas);
    canvas.addEventListener('click', () => {
      window.focus();
      if (handles.game.state === 'TITLE' || handles.game.state === 'GAME_OVER') {
        handles.game.newGame();
      }
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
