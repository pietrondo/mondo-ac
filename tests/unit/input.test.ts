import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../../src/controls/input';

function keyboardEvent(type: 'keydown' | 'keyup', code: string): KeyboardEvent {
  const event = new Event(type);
  Object.defineProperty(event, 'code', { value: code });

  return event as KeyboardEvent;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InputManager keyboard input', () => {
  it('updates jump state when the physical Space key is pressed and released', () => {
    const keyboardTarget = new EventTarget();
    const documentTarget = new EventTarget();
    vi.stubGlobal('window', keyboardTarget);
    vi.stubGlobal('document', documentTarget);

    const input = new InputManager();

    keyboardTarget.dispatchEvent(keyboardEvent('keydown', 'Space'));
    expect(input.state.jump).toBe(true);

    keyboardTarget.dispatchEvent(keyboardEvent('keyup', 'Space'));
    expect(input.state.jump).toBe(false);
  });

  it('reset() clears keys and mouse offsets', () => {
    const keyboardTarget = new EventTarget();
    const documentTarget = new EventTarget();
    vi.stubGlobal('window', keyboardTarget);
    vi.stubGlobal('document', documentTarget);

    const input = new InputManager();

    // Set keys and mouse offsets to non-default values
    input.state.forward = true;
    input.state.jump = true;
    input.state.mouseX = 0.5;
    input.state.mouseY = -0.3;

    // Execute reset
    input.reset();

    // Verify key states and mouse offsets are cleared
    expect(input.state.forward).toBe(false);
    expect(input.state.jump).toBe(false);
    expect(input.state.mouseX).toBe(0);
    expect(input.state.mouseY).toBe(0);
  });

  it('reset() clears other key states (reload, attack, run) and keeps false states false', () => {
    const keyboardTarget = new EventTarget();
    const documentTarget = new EventTarget();
    vi.stubGlobal('window', keyboardTarget);
    vi.stubGlobal('document', documentTarget);

    const input = new InputManager();

    // Set other keys
    input.state.reload = true;
    input.state.attack = true;
    input.state.run = true;
    input.state.left = false;

    input.reset();

    expect(input.state.reload).toBe(false);
    expect(input.state.attack).toBe(false);
    expect(input.state.run).toBe(false);
    expect(input.state.left).toBe(false);
  });
});
