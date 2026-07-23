import { describe, it, expect } from 'vitest';
import { calculateRenderSize, MAX_RENDER_WIDTH, MAX_RENDER_HEIGHT } from '../../src/render/viewport';

describe('calculateRenderSize', () => {
  it('returns viewport unchanged when smaller than max', () => {
    const size = calculateRenderSize(800, 600);
    expect(size).toEqual({ width: 800, height: 600 });
  });

  it('returns viewport unchanged when equal to max', () => {
    const size = calculateRenderSize(MAX_RENDER_WIDTH, MAX_RENDER_HEIGHT);
    expect(size).toEqual({ width: MAX_RENDER_WIDTH, height: MAX_RENDER_HEIGHT });
  });

  it('scales down by width when viewport is wider relative to max', () => {
    const size = calculateRenderSize(2560, 720);
    expect(size.width).toBe(1280);
    expect(size.height).toBe(Math.round(1280 / (2560 / 720)));
  });

  it('scales down by height when viewport is taller relative to max', () => {
    const size = calculateRenderSize(1280, 1440);
    expect(size.height).toBe(720);
    expect(size.width).toBe(Math.round(720 * (1280 / 1440)));
  });

  it('preserves aspect ratio on downscaling', () => {
    const w = 1920, h = 1080;
    const size = calculateRenderSize(w, h);
    const ratio = size.width / size.height;
    const originalRatio = w / h;
    expect(Math.abs(ratio - originalRatio)).toBeLessThan(0.02);
  });

  it('honours custom max bounds', () => {
    const size = calculateRenderSize(2560, 1440, 800, 600);
    expect(size.width).toBeLessThanOrEqual(800);
    expect(size.height).toBeLessThanOrEqual(600);
  });
});
