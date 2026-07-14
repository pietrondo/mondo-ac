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
});
