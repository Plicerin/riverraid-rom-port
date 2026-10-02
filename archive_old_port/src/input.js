// River Raid — Keyboard input.
//
// Tracks keys held this frame, plus a "just pressed" set cleared after
// each tick(). Wires DOM keydown/keyup events and prevents the page
// from scrolling when the user hits arrows/space.
//
// Designed to work under Node.js (no DOM) for headless tests via
// `setState()`. The Game constructs an Input and calls attach() when it
// has a document; for tests the caller injects events directly.

const TRACKED = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Space', 'Enter',
  'KeyA', 'KeyD', 'KeyW', 'KeyS',
  'KeyR',
]);

export class Input {
  constructor(target = typeof window !== 'undefined' ? window : null) {
    this.target = target;
    this._held = new Set();
    this._just = new Set();
    this._preventDefaultCodes = new Set([
      'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    ]);
    if (target && target.addEventListener) this.attach();
  }

  attach() {
    if (!this.target) return;
    this._keydown = (e) => {
      if (!TRACKED.has(e.code)) return;
      if (this._preventDefaultCodes.has(e.code)) e.preventDefault();
      if (!this._held.has(e.code)) this._just.add(e.code);
      this._held.add(e.code);
    };
    this._keyup = (e) => {
      if (!TRACKED.has(e.code)) return;
      this._held.delete(e.code);
    };
    this.target.addEventListener('keydown', this._keydown);
    this.target.addEventListener('keyup', this._keyup);
  }

  detach() {
    if (!this.target || !this._keydown) return;
    this.target.removeEventListener('keydown', this._keydown);
    this.target.removeEventListener('keyup', this._keyup);
  }

  tick() {
    // Called once per frame: clears just-pressed but keeps held.
    this._just.clear();
  }

  // True if the given code is currently held.
  held(code) { return this._held.has(code); }
  // True only on the frame the key was first pressed.
  just(code) { return this._just.has(code); }

  left()      { return this._held.has('ArrowLeft')  || this._held.has('KeyA'); }
  right()     { return this._held.has('ArrowRight') || this._held.has('KeyD'); }
  up()        { return this._held.has('ArrowUp')    || this._held.has('KeyW'); }
  down()      { return this._held.has('ArrowDown')  || this._held.has('KeyS'); }
  fire()      { return this._held.has('Space'); }
  justFire()  { return this._just.has('Space') || this._just.has('Enter'); }

  // Test/injection helper.
  setState({ code, down }) {
    if (down) {
      if (!this._held.has(code)) this._just.add(code);
      this._held.add(code);
    } else {
      this._held.delete(code);
    }
  }
}
