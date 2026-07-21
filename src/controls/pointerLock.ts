export function requestPointerLockSafe(target: HTMLElement = document.body): void {
  try {
    const res = target.requestPointerLock();
    if (res && typeof (res as any).catch === 'function') {
      (res as any).catch(() => {
        // Ignore browser pointer lock security exceptions
      });
    }
  } catch (_) {
    // Ignore synchronous errors
  }
}
