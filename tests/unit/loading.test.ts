import { describe, it, expect, vi } from 'vitest';

interface MockElement {
  id: string;
  style: Record<string, string>;
  textContent: string;
  innerHTML: string;
  classList: { add: () => void; remove: () => void };
}

function createMockElement(id: string): MockElement {
  return {
    id,
    style: {},
    textContent: '',
    innerHTML: '',
    classList: { add: () => {}, remove: () => {} },
  };
}

const elements = new Map<string, MockElement>();

vi.stubGlobal('document', {
  getElementById: (id: string) => elements.get(id) ?? null,
  createElement: (id: string) => createMockElement(id),
  body: { appendChild: () => {} },
  exitPointerLock: () => {},
});

elements.set('loading-bar-fill', createMockElement('loading-bar-fill'));
elements.set('loading-status', createMockElement('loading-status'));
elements.set('loading', createMockElement('loading'));
elements.set('error-overlay', createMockElement('error-overlay'));
elements.set('error-message', createMockElement('error-message'));

const { detectWebGL, setLoadingProgress, hideLoadingOverlay, showSystemError } = await import('../../src/ui/loading');

describe('detectWebGL', () => {
  it('returns a boolean based on canvas availability', () => {
    expect(typeof detectWebGL()).toBe('boolean');
  });
});

describe('setLoadingProgress', () => {
  it('updates the fill bar width', async () => {
    await setLoadingProgress(50, 'Loading', 0);
    expect(elements.get('loading-bar-fill')!.style.width).toBe('50%');
  });

  it('updates the status text with percent', async () => {
    await setLoadingProgress(75, 'Building world', 0);
    expect(elements.get('loading-status')!.textContent).toBe('Building world (75%)');
  });

  it('handles missing elements gracefully', async () => {
    const original = elements.get('loading-bar-fill');
    elements.delete('loading-bar-fill');
    await expect(setLoadingProgress(50, 'NoOp', 0)).resolves.toBeUndefined();
    elements.set('loading-bar-fill', original!);
  });
});

describe('hideLoadingOverlay', () => {
  it('sets display none on loading element after delay', async () => {
    hideLoadingOverlay(0);
    await new Promise(r => setTimeout(r, 10));
    expect(elements.get('loading')!.style.display).toBe('none');
  });
});

describe('showSystemError', () => {
  it('shows the overlay and sets the message', () => {
    showSystemError('Something broke');
    expect(elements.get('error-overlay')!.style.display).toBe('flex');
    expect(elements.get('error-message')!.textContent).toBe('Something broke');
  });
});
