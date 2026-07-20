import { describe, expect, it, vi } from 'vitest';
import { WaveManager } from '../../src/game/waveManager';

describe('WaveManager', () => {
  it('initializes in preparing state and transitions to wave 1 after timer', () => {
    const waveManager = new WaveManager();
    const onStart = vi.fn();
    waveManager.onWaveStart(onStart);

    expect(waveManager.getWaveNumber()).toBe(0);
    waveManager.update(5.0); // Complete timer

    expect(waveManager.getWaveNumber()).toBe(1);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ waveNumber: 1, hasBoss: false })
    );
  });

  it('triggers wave clear and bonus when all enemies are killed', () => {
    const waveManager = new WaveManager();
    const onClear = vi.fn();
    waveManager.onWaveClear(onClear);

    waveManager.nextWave(); // Wave 1 has 7 enemies
    const totalEnemies = waveManager.getEnemiesRemaining();

    for (let i = 0; i < totalEnemies; i++) {
      waveManager.notifyEnemyKilled();
    }

    expect(waveManager.state).toBe('wave_cleared');
    expect(onClear).toHaveBeenCalledWith(1, 100);
  });
});
