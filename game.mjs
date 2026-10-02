import { romReset, runFrame, Z, LOW } from './riverraidFrame.mjs';
import { drawScreen, SCREEN_WIDTH, SCREEN_LINES } from './riverraidScreen.mjs';
import { createTiaAudio } from './riverraidAudio.mjs';
import { readGamepad, gamepadEdges } from './riverraidGamepad.mjs';

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

// sound: the ROM's TIA audio registers, played by tiaSound.worklet.js
const audio = createTiaAudio('./tiaSound.worklet.js');
let muted = false;
const startAudio = () => audio.start();
const sendAudio = () => audio.setSilent(muted || paused);

// the 160x199 Atari picture, scaled to the canvas at Stella's 2:1 pixel aspect
const screen = document.createElement('canvas');
screen.width = SCREEN_WIDTH;
screen.height = SCREEN_LINES;
const screenCtx = screen.getContext('2d');
const screenImage = screenCtx.createImageData(SCREEN_WIDTH, SCREEN_LINES);

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

let pad = null;

function readInputs() {
  let swcha = 0xff;
  if (pressed.has('ArrowRight') || pressed.has('KeyD') || pad?.right) swcha &= ~0x80;
  if (pressed.has('ArrowLeft') || pressed.has('KeyA') || pad?.left) swcha &= ~0x40;
  if (pressed.has('ArrowDown') || pressed.has('KeyS') || pad?.down) swcha &= ~0x20;
  if (pressed.has('ArrowUp') || pressed.has('KeyW') || pad?.up) swcha &= ~0x10;
  io.swcha = screenState === SCREEN_PLAYING ? swcha : 0xff;
  io.inpt4 = screenState === SCREEN_PLAYING && (pressed.has('Space') || pressed.has('KeyZ') || pad?.fire) ? 0x00 : 0x80;
  io.inpt5 = 0x80;
  io.swchb = resetHold > 0 ? 0x0a : 0x0b; // bit 0 low = RESET switch pressed
  io.swchbNext = undefined;
}

function stepGame() {
  readInputs();
  const wasOver = memory[Z.gameMode] === 0xff;
  display = runFrame(memory, io).display;
  audio.update(io.audio);
  if (resetHold > 0) resetHold -= 1;
  if (screenState === SCREEN_PLAYING && !wasOver && memory[Z.gameMode] === 0xff) screenState = SCREEN_GAME_OVER;
}

function pressReset() {
  resetHold = RESET_HOLD_FRAMES;
  screenState = SCREEN_PLAYING;
  paused = false;
  pauseButton.textContent = 'Pause';
  sendAudio();
}

// *** drawing ***

function drawKernel() {
  if (!display) return;
  drawScreen(display, io, screenImage);
  screenCtx.putImageData(screenImage, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(screen, 0, 0, logicalWidth, logicalHeight);
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
  pad = readGamepad();
  const edges = gamepadEdges(pad);
  if (edges.start) pressReset();
  if (edges.back && screenState === SCREEN_PLAYING) {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    sendAudio();
  }
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
  startAudio(); // browsers only allow audio after a user gesture
  if (event.code === 'KeyM') { muted = !muted; sendAudio(); }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if ((event.code === 'Space' || event.code === 'Enter') && screenState !== SCREEN_PLAYING) {
    pressReset();
    return;
  }
  pressed.add(event.code);
  if (event.code === 'KeyP' && screenState === SCREEN_PLAYING) {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    sendAudio();
  }
  if (event.code === 'KeyR') pressReset();
});

// the game loop stops while the page is hidden, so the last tone must not hang
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.suspend();
  else audio.resume();
});

window.addEventListener('keyup', (event) => {
  pressed.delete(event.code);
});

pauseButton.addEventListener('click', () => {
  startAudio();
  if (screenState !== SCREEN_PLAYING) return;
  paused = !paused;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
  sendAudio();
});

resetButton.addEventListener('click', () => {
  startAudio();
  pressReset();
});

// power on: the ROM clears RAM and runs its attract mode until RESET
romReset(memory, 0);
stepGame();
render();
window.requestAnimationFrame(frame);
