// Keyboard and mouse state, converted into the game's logical coordinates.
// Buttons and menus read click edges from here; the simulation reads held keys.
import { VIEW_H, VIEW_W } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = VIEW_W / 2;
    this.mouseY = VIEW_H / 2 - 120;
    this.mouseDown = false;
    this.clicked = false;
    this.clickedX = 0;
    this.clickedY = 0;
    this.wheel = 0;
    this.anyGesture = false;

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.keys.add(event.code);
      this.pressed.add(event.code);
      this.anyGesture = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
    });
    canvas.addEventListener('pointermove', (event) => {
      const point = this.toLogical(event.clientX, event.clientY);
      this.mouseX = point.x;
      this.mouseY = point.y;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const point = this.toLogical(event.clientX, event.clientY);
      this.mouseX = point.x;
      this.mouseY = point.y;
      this.mouseDown = true;
      this.clicked = true;
      this.clickedX = point.x;
      this.clickedY = point.y;
      this.anyGesture = true;
      canvas.focus();
    });
    window.addEventListener('pointerup', () => {
      this.mouseDown = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  toLogical(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW_W,
      y: ((clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  down(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  moveAxis() {
    let x = 0;
    let y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  consumeClick() {
    const click = this.clicked
      ? { x: this.clickedX, y: this.clickedY }
      : null;
    this.clicked = false;
    return click;
  }

  endFrame() {
    this.pressed.clear();
    this.clicked = false;
    this.wheel = 0;
  }

  // Scripted input for deterministic scenes and automated play-testing.
  drive(script) {
    if (script.keys) {
      this.keys = new Set(script.keys);
    }
    if (script.mouse) {
      this.mouseX = script.mouse.x;
      this.mouseY = script.mouse.y;
      this.mouseDown = Boolean(script.mouse.down);
    }
  }
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
