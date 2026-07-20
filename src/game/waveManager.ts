export type WaveState = 'preparing' | 'in_progress' | 'wave_cleared';

export interface WaveConfig {
  waveNumber: number;
  totalEnemies: number;
  difficultyMultiplier: number;
  hasBoss: boolean;
}

export class WaveManager {
  currentWave = 0;
  state: WaveState = 'preparing';
  totalEnemiesInWave = 0;
  enemiesRemaining = 0;
  waveTimer = 5; // Initial countdown before Wave 1
  difficultyMultiplier = 1.0;
  hasBoss = false;

  private onWaveStartCallbacks: ((config: WaveConfig) => void)[] = [];
  private onWaveClearCallbacks: ((waveNumber: number, rewardScore: number) => void)[] = [];

  onWaveStart(cb: (config: WaveConfig) => void): void {
    this.onWaveStartCallbacks.push(cb);
  }

  onWaveClear(cb: (waveNumber: number, rewardScore: number) => void): void {
    this.onWaveClearCallbacks.push(cb);
  }

  update(delta: number): void {
    if (this.state === 'preparing' || this.state === 'wave_cleared') {
      this.waveTimer -= delta;
      if (this.waveTimer <= 0) {
        this.nextWave();
      }
    }
  }

  nextWave(): void {
    this.currentWave++;
    this.state = 'in_progress';
    this.totalEnemiesInWave = 4 + this.currentWave * 3;
    this.enemiesRemaining = this.totalEnemiesInWave;
    this.difficultyMultiplier = 1.0 + (this.currentWave - 1) * 0.25;
    this.hasBoss = this.currentWave % 5 === 0;

    const config: WaveConfig = {
      waveNumber: this.currentWave,
      totalEnemies: this.totalEnemiesInWave,
      difficultyMultiplier: this.difficultyMultiplier,
      hasBoss: this.hasBoss,
    };

    for (const cb of this.onWaveStartCallbacks) {
      cb(config);
    }
  }

  notifyEnemyKilled(): void {
    if (this.state !== 'in_progress') return;
    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);

    if (this.enemiesRemaining === 0) {
      this.state = 'wave_cleared';
      this.waveTimer = 6; // 6s rest between waves
      const bonusScore = this.currentWave * 100;

      for (const cb of this.onWaveClearCallbacks) {
        cb(this.currentWave, bonusScore);
      }
    }
  }

  getWaveNumber(): number {
    return this.currentWave;
  }

  getEnemiesRemaining(): number {
    return this.enemiesRemaining;
  }

  getWaveProgressRatio(): number {
    if (this.totalEnemiesInWave === 0) return 0;
    return (this.totalEnemiesInWave - this.enemiesRemaining) / this.totalEnemiesInWave;
  }
}
