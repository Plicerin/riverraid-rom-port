import { romReset, runFrame, Z, LOW } from './riverraidFrame.mjs';
import { NTSC_PALETTE_RGB } from './riverraidVisiblePort.mjs';
import { KERNEL_LINES } from './riverraidRiver.mjs';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const fuelEl = document.getElementById('fuel');
const livesEl = document.getElementById('lives');
const sectionEl = document.getElementById('section');
const debugEl = document.getElementById('debug');

const logicalWidth = canvas.width;
const logicalHeight = canvas.height;
const SCREEN_TITLE = 'title';
const SCREEN_PLAYING = 'playing';
const SCREEN_GAME_OVER = 'game-over';
const frameStepMs = 1000 / 60;
const RESET_HOLD_FRAMES = 2;

// The ROM's zero page; every variable lives at its ROM address.
const memory = new Uint8Array(0x100);
const pressed = new Set();
const io = { swcha: 0xff, swchb: 0x0b, inpt4: 0x80, inpt5: 0x80 };
let display = null;
let screenState = SCREEN_TITLE;
let paused = false;
let resetHold = 0;
let lastFrameTime = 0;
let accumulatorMs = 0;

// 160x160 kernel image, scaled to the canvas
const screen = document.createElement('canvas');
screen.width = 160;
screen.height = KERNEL_LINES;
const screenCtx = screen.getContext('2d');
const screenImage = screenCtx.createImageData(160, KERNEL_LINES);

const BLOCK_GLYPHS = Object.freeze({
  '0': ['111','101','101','101','111'],
  '1': ['010','110','010','010','111'],
  '2': ['111','001','111','100','111'],
  '3': ['111','001','111','001','111'],
  '4': ['101','101','111','001','001'],
  '5': ['111','100','111','001','111'],
  '6': ['111','100','111','101','111'],
  '7': ['111','001','010','010','010'],
  '8': ['111','101','111','101','111'],
  '9': ['111','101','111','001','111'],
  'A': ['010','101','111','101','101'],
  'B': ['110','101','110','101','110'],
  'C': ['111','100','100','100','111'],
  'D': ['110','101','101','101','110'],
  'E': ['111','100','110','100','111'],
  'F': ['111','100','110','100','100'],
  'G': ['111','100','101','101','111'],
  'H': ['101','101','111','101','101'],
  'I': ['111','010','010','010','111'],
  'J': ['001','001','001','101','111'],
  'K': ['101','101','110','101','101'],
  'L': ['100','100','100','100','111'],
  'M': ['101','111','111','101','101'],
  'N': ['101','111','111','111','101'],
  'O': ['111','101','101','101','111'],
  'P': ['111','101','111','100','100'],
  'Q': ['111','101','101','111','001'],
  'R': ['111','101','111','110','101'],
  'S': ['111','100','111','001','111'],
  'T': ['111','010','010','010','010'],
  'U': ['101','101','101','101','111'],
  'V': ['101','101','101','101','010'],
  'W': ['101','101','111','111','101'],
  'X': ['101','101','010','101','101'],
  'Y': ['101','101','010','010','010'],
  'Z': ['111','001','010','100','111'],
  '-': ['000','000','111','000','000'],
  '.': ['000','000','000','000','010'],
  ':': ['000','010','000','010','000'],
  '!': ['010','010','010','000','010'],
  ' ': ['000','000','000','000','000'],
});

function blockTextWidth(text, scale = 3) {
  return [...String(text).toUpperCase()].reduce((width, char, index) => {
    const glyph = BLOCK_GLYPHS[char] ?? BLOCK_GLYPHS[' '];
    return width + (glyph[0].length * scale) + (index === 0 ? 0 : scale);
  }, 0);
}

function drawBlockText(text, x, y, options = {}) {
  const scale = options.scale ?? 3;
  const align = options.align ?? 'left';
  const color = options.color ?? '#e8f0ff';
  let cursorX = Math.floor(x);
  const width = blockTextWidth(text, scale);
  if (align === 'center') cursorX -= Math.floor(width / 2);
  if (align === 'right') cursorX -= width;

  ctx.fillStyle = color;
  for (const char of String(text).toUpperCase()) {
    const glyph = BLOCK_GLYPHS[char] ?? BLOCK_GLYPHS[' '];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') {
          ctx.fillRect(cursorX + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    cursorX += (glyph[0].length + 1) * scale;
  }
}

// *** ROM state readers ***

// The score lives in six digit pointers (scorePtr1+0..+10, low bytes); Space = blank.
function scoreText() {
  let text = '';
  for (let offset = 0; offset <= 10; offset += 2) {
    const low = memory[Z.scorePtr1 + offset];
    if (low === LOW.Space) text += ' ';
    else if (low === LOW.MaxOut) text += '!';
    else text += String(Math.min(9, low >> 3));
  }
  return text.trim() || '0';
}

function livesCount() {
  const low = memory[Z.livesPtr];
  return low <= LOW.Nine ? low >> 3 : 0;
}

function fuelPercent() {
  return Math.round((memory[Z.fuelHi] / 255) * 100);
}

function gameModeLabel() {
  const mode = memory[Z.gameMode];
  if (mode === 0) return 'running';
  if (mode === 0xff) return 'game over';
  if (mode === 48) return 'ready';
  if (mode & 0x80) return 'crashed';
  return `scroll ${mode}`;
}

// *** frame stepping ***

function readInputs() {
  let swcha = 0xff;
  if (pressed.has('ArrowRight') || pressed.has('KeyD')) swcha &= ~0x80;
  if (pressed.has('ArrowLeft') || pressed.has('KeyA')) swcha &= ~0x40;
  if (pressed.has('ArrowDown') || pressed.has('KeyS')) swcha &= ~0x20;
  if (pressed.has('ArrowUp') || pressed.has('KeyW')) swcha &= ~0x10;
  io.swcha = screenState === SCREEN_PLAYING ? swcha : 0xff;
  io.inpt4 = screenState === SCREEN_PLAYING && (pressed.has('Space') || pressed.has('KeyZ')) ? 0x00 : 0x80;
  io.inpt5 = 0x80;
  io.swchb = resetHold > 0 ? 0x0a : 0x0b; // bit 0 low = RESET switch pressed
  io.swchbNext = undefined;
}

function stepGame() {
  readInputs();
  const wasOver = memory[Z.gameMode] === 0xff;
  display = runFrame(memory, io).display;
  if (resetHold > 0) resetHold -= 1;
  if (screenState === SCREEN_PLAYING && !wasOver && memory[Z.gameMode] === 0xff) screenState = SCREEN_GAME_OVER;
}

function pressReset() {
  resetHold = RESET_HOLD_FRAMES;
  screenState = SCREEN_PLAYING;
  paused = false;
  pauseButton.textContent = 'Pause';
}

// *** drawing ***

function drawKernel() {
  if (!display) return;
  const { pf, objs, masks, ssXor, ssMask } = display;
  const tint = (c) => ((c ^ ssXor) & ssMask) >> 1;
  const bg = (io.colubk ?? 0x84) >> 1;
  const p0 = (io.colup0 ?? 0x1c) >> 1;
  const data = screenImage.data;
  for (let s = 0; s < KERNEL_LINES; s += 1) {
    const pfColor = tint(pf[s].colupf);
    const p1Color = tint(objs[s].colup1);
    const m = masks[s];
    for (let x = 0; x < 160; x += 1) {
      // HMOVE every line blanks the first 8 pixels; TIA priority P0/M0 > P1 > PF > BK
      let rgb = 0;
      if (x >= 8) {
        const index = (m.p0[x] || m.m0[x]) ? p0 : m.p1[x] ? p1Color : m.pf[x] ? pfColor : bg;
        rgb = NTSC_PALETTE_RGB[index];
      }
      const o = (s * 160 + x) * 4;
      data[o] = rgb >> 16;
      data[o + 1] = (rgb >> 8) & 0xff;
      data[o + 2] = rgb & 0xff;
      data[o + 3] = 255;
    }
  }
  screenCtx.putImageData(screenImage, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(screen, 0, 0, logicalWidth, logicalHeight);
}

function drawCanvasHud() {
  const fuelPct = fuelPercent();
  const fuelBarWidth = Math.max(0, Math.min(102, Math.round((fuelPct / 100) * 102)));
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, logicalWidth, 42);
  drawBlockText(scoreText(), 14, 13, { scale: 3, color: '#ffd166' });
  drawBlockText(`LIVES ${livesCount()}`, 116, 13, { scale: 3, color: '#e8f0ff' });
  drawBlockText(`SEC ${memory[Z.level]}`, 238, 13, { scale: 3, color: '#e8f0ff' });
  ctx.strokeStyle = '#e8f0ff';
  ctx.strokeRect(logicalWidth - 128, 12, 104, 18);
  ctx.fillStyle = fuelPct <= 25 ? '#ff6b6b' : '#5cc8ff';
  ctx.fillRect(logicalWidth - 127, 13, fuelBarWidth, 16);
  drawBlockText('FUEL', logicalWidth - 138, 15, { scale: 2, color: '#e8f0ff', align: 'right' });
  ctx.restore();
}

function drawCenteredText(lines) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 10, 18, 0.62)';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  lines.forEach((line) => {
    drawBlockText(line.text, logicalWidth / 2, (logicalHeight / 2) + line.yOffset, {
      align: 'center',
      color: line.color ?? '#e8f0ff',
      scale: line.scale,
    });
  });
  ctx.restore();
}

function renderHud() {
  scoreEl.textContent = scoreText();
  fuelEl.textContent = `${fuelPercent()}%`;
  livesEl.textContent = String(livesCount());
  sectionEl.textContent = String(memory[Z.level]);
  statusEl.textContent = screenState === SCREEN_TITLE
    ? 'title'
    : paused
      ? 'paused'
      : gameModeLabel();
  debugEl.textContent = `level ${memory[Z.level]} · block ${memory[Z.sectionBlock]} · offset ${memory[Z.blockOffset]} · playerX ${memory[Z.playerX]} · speedY ${memory[Z.speedY]}`;
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  drawKernel();
  drawCanvasHud();
  if (screenState === SCREEN_TITLE) {
    drawCenteredText([
      { text: 'RIVER RAID', yOffset: -88, scale: 8, color: '#ffd166' },
      { text: 'ROM PORT', yOffset: -28, scale: 4, color: '#e8f0ff' },
      { text: 'PRESS SPACE OR ENTER', yOffset: 34, scale: 3, color: '#5cc8ff' },
      { text: 'ARROWS WASD MOVE  SPACE Z FIRE', yOffset: 74, scale: 2, color: '#8fa6c1' },
    ]);
  } else if (screenState === SCREEN_GAME_OVER) {
    drawCenteredText([
      { text: 'GAME OVER', yOffset: -70, scale: 7, color: '#ff6b6b' },
      { text: `SCORE ${scoreText()}`, yOffset: -8, scale: 4, color: '#ffd166' },
      { text: 'PRESS SPACE OR ENTER', yOffset: 52, scale: 3, color: '#5cc8ff' },
    ]);
  }
  renderHud();
}

function frame(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const delta = Math.min(100, timestamp - lastFrameTime);
  lastFrameTime = timestamp;
  if (!paused) {
    accumulatorMs += delta;
    while (accumulatorMs >= frameStepMs) {
      stepGame();
      accumulatorMs -= frameStepMs;
    }
  }
  render();
  window.requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if ((event.code === 'Space' || event.code === 'Enter') && screenState !== SCREEN_PLAYING) {
    pressReset();
    return;
  }
  pressed.add(event.code);
  if (event.code === 'KeyP' && screenState === SCREEN_PLAYING) {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
  }
  if (event.code === 'KeyR') pressReset();
});

window.addEventListener('keyup', (event) => {
  pressed.delete(event.code);
});

pauseButton.addEventListener('click', () => {
  if (screenState !== SCREEN_PLAYING) return;
  paused = !paused;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
});

resetButton.addEventListener('click', () => {
  pressReset();
});

// power on: the ROM clears RAM and runs its attract mode until RESET
romReset(memory, 0);
stepGame();
render();
window.requestAnimationFrame(frame);
