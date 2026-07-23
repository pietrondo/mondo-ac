export const MAX_RENDER_WIDTH = 1280;
export const MAX_RENDER_HEIGHT = 720;

export interface RenderSize {
  width: number;
  height: number;
}

export function calculateRenderSize(
  viewportWidth: number,
  viewportHeight: number,
  maxW: number = MAX_RENDER_WIDTH,
  maxH: number = MAX_RENDER_HEIGHT
): RenderSize {
  if (viewportWidth <= maxW && viewportHeight <= maxH) {
    return { width: viewportWidth, height: viewportHeight };
  }

  const aspect = viewportWidth / viewportHeight;
  const wRatio = viewportWidth / maxW;
  const hRatio = viewportHeight / maxH;

  if (wRatio > hRatio) {
    return { width: maxW, height: Math.round(maxW / aspect) };
  }
  return { width: Math.round(maxH * aspect), height: maxH };
}
