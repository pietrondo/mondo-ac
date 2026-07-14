import { afterEach, describe, expect, it, vi } from 'vitest';
import { HUD } from '../../src/ui/hud';

type FakeElement = {
  style: { cssText: string; [key: string]: string };
  textContent: string;
  id?: string;
  appendChild: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

function createFakeElement(): FakeElement {
  return {
    style: { cssText: '' },
    textContent: '',
    appendChild: vi.fn(),
    remove: vi.fn(),
  };
}

function setupDocument() {
  const body = {
    appendChild: vi.fn(),
  };
  const document = {
    body,
    createElement: vi.fn(() => createFakeElement()),
  } as any;
  vi.stubGlobal('document', document);
  return { body, document };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HUD weapon feedback', () => {
  it('renders a crosshair and shows ammo plus reload state', () => {
    const { body } = setupDocument();

    const hud = new HUD();
    hud.setWeaponState(12, 48, true);

    expect(body.appendChild).toHaveBeenCalledTimes(5);
    expect(hud.getScore()).toBe(0);
    expect(hud.getWeaponText()).toBe('Ammo: 12 / 48');
    expect(hud.getReloadText()).toBe('Reloading...');
    expect(hud.getCrosshairVisible()).toBe(true);
    hud.setStatus('Adrenaline boost');
    expect(hud.getStatusText()).toBe('Adrenaline boost');
  });

  it('preserves score updates alongside weapon feedback', () => {
    setupDocument();

    const hud = new HUD();
    hud.addScore(10);
    hud.setWeaponState(30, 90, false);

    expect(hud.getScore()).toBe(10);
    expect(hud.getWeaponText()).toBe('Ammo: 30 / 90');
    expect(hud.getReloadText()).toBe('');
  });
});
