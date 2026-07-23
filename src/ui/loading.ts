export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export async function setLoadingProgress(percent: number, message: string, minDelayMs = 40): Promise<void> {
  const fill = document.getElementById('loading-bar-fill');
  const status = document.getElementById('loading-status');
  if (fill) fill.style.width = `${percent}%`;
  if (status) status.textContent = `${message} (${percent}%)`;
  await new Promise((resolve) => setTimeout(resolve, minDelayMs));
}

export function hideLoadingOverlay(delayMs = 300): void {
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }, delayMs);
}

export function showSystemError(message: string): { halted: boolean } {
  try {
    document.exitPointerLock();
  } catch (e) {}

  const overlay = document.getElementById('error-overlay');
  const msgEl = document.getElementById('error-message');
  if (overlay) overlay.style.display = 'flex';
  if (msgEl) msgEl.textContent = message;
  return { halted: true };
}
