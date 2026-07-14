export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  interact: boolean;
  reload: boolean;
  attack: boolean;
  run: boolean;
  mouseX: number;
  mouseY: number;
}

export class InputManager {
  state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    interact: false,
    reload: false,
    attack: false,
    run: false,
    mouseX: 0,
    mouseY: 0
  };

  private mouseSensitivity = 0.002;
  private isPointerLocked = false;

  constructor() {
    this.setupKeyboard();
    this.setupMouse();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
  }

  private onKey(e: KeyboardEvent, pressed: boolean): void {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = pressed;
        break;
      case 'Space':
        this.state.jump = pressed;
        break;
      case 'KeyE':
        this.state.interact = pressed;
        break;
      case 'KeyR':
        this.state.reload = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.run = pressed;
        break;
    }
  }

  private setupMouse(): void {
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
      if (!this.isPointerLocked) this.state.attack = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.state.mouseX += e.movementX * this.mouseSensitivity;
        this.state.mouseY += e.movementY * this.mouseSensitivity;
        this.state.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.state.mouseY));
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.isPointerLocked) this.state.attack = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.state.attack = false;
    });

    window.addEventListener('blur', () => {
      this.state.attack = false;
    });

    document.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock();
      }
    });

    // Escape to release pointer lock
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        document.exitPointerLock();
      }
    });
  }

  get pointerLocked(): boolean {
    return this.isPointerLocked;
  }

  resetMouse(): void {
    this.state.mouseX = 0;
    this.state.mouseY = 0;
  }

  reset(): void {
    this.state.forward = false;
    this.state.backward = false;
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.interact = false;
    this.state.reload = false;
    this.state.attack = false;
    this.state.run = false;
    this.state.mouseX = 0;
    this.state.mouseY = 0;
  }
}
