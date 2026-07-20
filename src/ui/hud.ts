declare const __COMMIT_HASH__: string;

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  kills: number;
  date: string;
}

export class HUD {
  private scoreElement: HTMLDivElement;
  private ammoElement: HTMLDivElement;
  private reloadElement: HTMLDivElement;
  private crosshairElement: HTMLDivElement;
  private statusElement: HTMLDivElement;
  private buffsElement: HTMLDivElement;
  private interactPromptElement: HTMLDivElement;
  private comboElement: HTMLDivElement;
  private enemyTrackerElement: HTMLDivElement;
  private leaderboardOverlay: HTMLDivElement;
  private versionElement: HTMLDivElement;

  private score = 0;
  private kills = 0;
  private combo = 0;
  private comboTimer = 0;
  private readonly comboDuration = 3.0; // Seconds to maintain combo

  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private minimapSize = 150;
  private minimapRange = 100;

  private enemyAlertTimer = 0;
  private playerName = localStorage.getItem('mondo_player_name') || 'Giocatore';

  constructor() {
    this.scoreElement = document.createElement('div');
    this.scoreElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 100;
    `;
    this.scoreElement.textContent = 'Score: 0';
    document.body.appendChild(this.scoreElement);

    this.ammoElement = document.createElement('div');
    this.ammoElement.style.cssText = `
      position: fixed;
      left: 20px;
      bottom: 40px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 22px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 100;
    `;
    this.ammoElement.textContent = 'Ammo: 30 / 90';
    document.body.appendChild(this.ammoElement);

    this.reloadElement = document.createElement('div');
    this.reloadElement.style.cssText = `
      position: fixed;
      left: 20px;
      bottom: 16px;
      color: #ffaa00;
      font-family: system-ui, sans-serif;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 100;
    `;
    this.reloadElement.textContent = '';
    document.body.appendChild(this.reloadElement);

    this.crosshairElement = document.createElement('div');
    this.crosshairElement.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      width: 16px;
      height: 16px;
      transform: translate(-50%, -50%);
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 18px;
      font-weight: bold;
      line-height: 16px;
      text-align: center;
      text-shadow: 0 0 6px rgba(0,0,0,0.8);
      z-index: 100;
      pointer-events: none;
      user-select: none;
    `;
    this.crosshairElement.textContent = '+';
    document.body.appendChild(this.crosshairElement);

    this.statusElement = document.createElement('div');
    this.statusElement.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      color: #ffffff;
      font-family: system-ui, sans-serif;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(0,0,0,0.75);
      z-index: 100;
      pointer-events: none;
      user-select: none;
    `;
    this.statusElement.textContent = '';
    document.body.appendChild(this.statusElement);

    this.buffsElement = document.createElement('div');
    this.buffsElement.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 20px;
      font-weight: bold;
      text-align: right;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 100;
      pointer-events: none;
      white-space: pre-line;
    `;
    this.buffsElement.textContent = '';
    document.body.appendChild(this.buffsElement);

    this.interactPromptElement = document.createElement('div');
    this.interactPromptElement.style.cssText = `
      position: fixed;
      left: 50%;
      top: 60%;
      transform: translate(-50%, -50%);
      color: #ffd54f;
      font-family: system-ui, sans-serif;
      font-size: 20px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      z-index: 100;
      pointer-events: none;
      user-select: none;
      display: none;
      background: rgba(0, 0, 0, 0.6);
      padding: 8px 16px;
      border-radius: 4px;
      border: 1px solid #ffd54f;
    `;
    document.body.appendChild(this.interactPromptElement);

    this.comboElement = document.createElement('div');
    this.comboElement.style.cssText = `
      position: fixed;
      top: 120px;
      left: 20px;
      color: #ff6b35;
      font-family: system-ui, sans-serif;
      font-size: 20px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 100;
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    this.comboElement.textContent = '';
    document.body.appendChild(this.comboElement);

    this.enemyTrackerElement = document.createElement('div');
    this.enemyTrackerElement.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      color: #ff3333;
      background: rgba(20, 0, 0, 0.75);
      padding: 8px 16px;
      border-radius: 20px;
      border: 1.5px solid #ff4444;
      font-family: system-ui, sans-serif;
      font-size: 16px;
      font-weight: bold;
      text-shadow: 0 0 6px rgba(255, 0, 0, 0.8);
      z-index: 100;
      pointer-events: none;
      user-select: none;
      display: none;
      box-shadow: 0 0 12px rgba(255, 0, 0, 0.5);
    `;
    document.body.appendChild(this.enemyTrackerElement);

    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = this.minimapSize;
    this.minimapCanvas.height = this.minimapSize;
    this.minimapCanvas.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: ${this.minimapSize}px;
      height: ${this.minimapSize}px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.6);
      z-index: 100;
      pointer-events: none;
    `;
    document.body.appendChild(this.minimapCanvas);
    const ctx = this.minimapCanvas.getContext('2d');
    if (!ctx) throw new Error('Cannot create minimap context');
    this.minimapCtx = ctx;

    this.leaderboardOverlay = document.createElement('div');
    this.leaderboardOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 10, 15, 0.88);
      backdrop-filter: blur(8px);
      z-index: 300;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
      color: white;
    `;
    document.body.appendChild(this.leaderboardOverlay);

    const versionStr = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
    this.versionElement = document.createElement('div');
    this.versionElement.style.cssText = `
      position: fixed;
      top: 6px;
      right: 20px;
      color: rgba(255, 255, 255, 0.6);
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      z-index: 100;
      pointer-events: none;
      user-select: none;
    `;
    this.versionElement.textContent = `v:${versionStr}`;
    document.body.appendChild(this.versionElement);
  }

  getVersionText(): string {
    return this.versionElement.textContent ?? '';
  }

  addScore(amount: number): void {
    this.score += amount;
    this.scoreElement.textContent = `Score: ${this.score}`;
  }

  incrementKills(): void {
    this.kills++;
  }

  getKills(): number {
    return this.kills;
  }

  incrementCombo(): void {
    this.combo++;
    this.comboTimer = this.comboDuration;
    this.updateComboDisplay();
  }

  triggerEnemyDeathAlert(): void {
    this.enemyAlertTimer = 6.0; // Show tracker alert for 6 seconds
  }

  private updateComboDisplay(): void {
    if (this.combo > 1) {
      this.comboElement.textContent = `${this.combo}x COMBO`;
      this.comboElement.style.opacity = '1';
    } else {
      this.comboElement.style.opacity = '0';
    }
  }

  setWeaponState(magazineAmmo: number, reserveAmmo: number, isReloading: boolean, weaponName?: string): void {
    const name = weaponName ?? 'Ammo';
    if (name === 'Knife') {
      this.ammoElement.textContent = 'Knife: Infinite';
    } else {
      this.ammoElement.textContent = `${name}: ${magazineAmmo} / ${reserveAmmo}`;
    }
    this.reloadElement.textContent = isReloading ? 'Reloading...' : '';
  }

  setStatus(message: string): void {
    this.statusElement.textContent = message;
  }

  updateBuffs(speed: number, damage: number, shield: number): void {
    const lines: string[] = [];
    if (speed > 0) lines.push(`Adrenaline: ${speed.toFixed(1)}s`);
    if (damage > 0) lines.push(`Overclock: ${damage.toFixed(1)}s`);
    if (shield > 0) lines.push(`Shield: ${shield.toFixed(1)}s`);
    this.buffsElement.textContent = lines.join('\n');
  }

  updateEnemyTracker(
    playerPos: { x: number; z: number },
    playerYaw: number,
    enemies: { x: number; z: number }[]
  ): void {
    if (this.enemyAlertTimer <= 0 || enemies.length === 0) {
      this.enemyTrackerElement.style.display = 'none';
      return;
    }

    // Find nearest enemy
    let nearestDist = Infinity;
    let nearestEnemy: { x: number; z: number } | null = null;

    for (const enemy of enemies) {
      const dx = enemy.x - playerPos.x;
      const dz = enemy.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    if (!nearestEnemy) {
      this.enemyTrackerElement.style.display = 'none';
      return;
    }

    // Calculate relative angle to player's forward direction
    const dx = nearestEnemy.x - playerPos.x;
    const dz = nearestEnemy.z - playerPos.z;
    // Enemy world angle relative to player
    const enemyAngle = Math.atan2(dx, -dz); // 0 = north (-Z)
    let relAngle = enemyAngle - playerYaw;

    // Normalize relAngle to [-PI, PI]
    while (relAngle > Math.PI) relAngle -= Math.PI * 2;
    while (relAngle < -Math.PI) relAngle += Math.PI * 2;

    // Convert relative angle to arrow direction symbol
    let arrow = '⬆️';
    const deg = (relAngle * 180) / Math.PI;
    if (deg > -22.5 && deg <= 22.5) arrow = '⬆️ AVANTI';
    else if (deg > 22.5 && deg <= 67.5) arrow = '↗️ DESTRA';
    else if (deg > 67.5 && deg <= 112.5) arrow = '➡️ DESTRA';
    else if (deg > 112.5 && deg <= 157.5) arrow = '↘️ DIETRO';
    else if (deg < -22.5 && deg >= -67.5) arrow = '↖️ SINISTRA';
    else if (deg < -67.5 && deg >= -112.5) arrow = '⬅️ SINISTRA';
    else if (deg < -112.5 && deg >= -157.5) arrow = '↙️ DIETRO';
    else arrow = '⬇️ DIETRO';

    const distMeters = Math.round(nearestDist);
    const countText = enemies.length > 1 ? ` (${enemies.length} rimasti)` : '';
    this.enemyTrackerElement.textContent = `🎯 NEMICI VICINI: ${arrow} - ${distMeters}m${countText}`;
    this.enemyTrackerElement.style.display = 'block';
  }

  update(delta: number): void {
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboElement.style.opacity = '0';
      }
    }

    if (this.enemyAlertTimer > 0) {
      this.enemyAlertTimer -= delta;
    }
  }

  getScore(): number {
    return this.score;
  }

  getWeaponText(): string {
    return this.ammoElement.textContent ?? '';
  }

  getReloadText(): string {
    return this.reloadElement.textContent ?? '';
  }

  getCrosshairVisible(): boolean {
    return this.crosshairElement.style.display !== 'none';
  }

  getStatusText(): string {
    return this.statusElement.textContent ?? '';
  }

  getBuffsText(): string {
    return this.buffsElement.textContent ?? '';
  }

  showInteractPrompt(text: string): void {
    this.interactPromptElement.textContent = text;
    this.interactPromptElement.style.display = 'block';
  }

  hideInteractPrompt(): void {
    this.interactPromptElement.style.display = 'none';
  }

  getInteractPromptText(): string {
    return this.interactPromptElement.textContent ?? '';
  }

  getInteractPromptVisible(): boolean {
    return this.interactPromptElement.style.display === 'block';
  }

  updateMinimap(
    playerPos: { x: number; z: number },
    enemies: { x: number; z: number }[],
    pois: { x: number; z: number; type: string }[]
  ): void {
    this.minimapCtx.clearRect(0, 0, this.minimapSize, this.minimapSize);

    const scale = this.minimapSize / (this.minimapRange * 2);
    const centerX = this.minimapSize / 2;
    const centerY = this.minimapSize / 2;

    this.minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.minimapCtx.fillRect(0, 0, this.minimapSize, this.minimapSize);

    // Points of Interest
    for (const poi of pois) {
      const relX = (poi.x - playerPos.x) * scale;
      const relZ = (poi.z - playerPos.z) * scale;
      if (Math.abs(relX) < this.minimapSize / 2 && Math.abs(relZ) < this.minimapSize / 2) {
        const px = centerX + relX;
        const py = centerY + relZ;
        
        this.minimapCtx.fillStyle = '#ffd54f';
        if (poi.type === 'village') this.minimapCtx.fillStyle = '#4CAF50';
        else if (poi.type === 'castle') this.minimapCtx.fillStyle = '#9C27B0';
        else if (poi.type === 'temple') this.minimapCtx.fillStyle = '#2196F3';
        
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(px, py, 4, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }
    }

    // Enemies & Edge Directional Arrows
    const drawAlertPulsing = this.enemyAlertTimer > 0;

    for (const enemy of enemies) {
      const relX = (enemy.x - playerPos.x) * scale;
      const relZ = (enemy.z - playerPos.z) * scale;
      const maxOffset = (this.minimapSize / 2) - 8;

      const isInside = Math.abs(relX) <= maxOffset && Math.abs(relZ) <= maxOffset;

      if (isInside) {
        const px = centerX + relX;
        const py = centerY + relZ;
        
        this.minimapCtx.fillStyle = drawAlertPulsing ? '#ff9900' : '#ff4444';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(px, py, drawAlertPulsing ? 4 : 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }

      // Draw directional arrow on edge if outside or if death alert is active
      if (!isInside || drawAlertPulsing) {
        const angle = Math.atan2(relZ, relX);
        const edgeRadius = maxOffset;
        const edgeX = centerX + Math.cos(angle) * edgeRadius;
        const edgeY = centerY + Math.sin(angle) * edgeRadius;

        this.minimapCtx.save();
        this.minimapCtx.translate(edgeX, edgeY);
        this.minimapCtx.rotate(angle);

        this.minimapCtx.fillStyle = drawAlertPulsing ? '#ffff00' : '#ff3333';
        this.minimapCtx.beginPath();
        this.minimapCtx.moveTo(6, 0);
        this.minimapCtx.lineTo(-5, -4);
        this.minimapCtx.lineTo(-2, 0);
        this.minimapCtx.lineTo(-5, 4);
        this.minimapCtx.closePath();
        this.minimapCtx.fill();

        this.minimapCtx.restore();
      }
    }

    // Player marker at center
    this.minimapCtx.fillStyle = '#00ff00';
    this.minimapCtx.beginPath();
    this.minimapCtx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    this.minimapCtx.fill();
    
    this.minimapCtx.strokeStyle = '#00ff00';
    this.minimapCtx.lineWidth = 2;
    this.minimapCtx.beginPath();
    this.minimapCtx.moveTo(centerX, centerY);
    this.minimapCtx.lineTo(centerX, centerY - 6);
    this.minimapCtx.stroke();
  }

  async showLeaderboardOverlay(score: number, kills: number, onRespawn: () => void): Promise<void> {
    this.leaderboardOverlay.style.display = 'flex';
    document.exitPointerLock();

    // Submit current score
    let scoresList: ScoreEntry[] = [];
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.playerName, score, kills })
      });
      if (res.ok) {
        scoresList = await res.json();
      }
    } catch (err) {
      console.warn('Could not post score to server API:', err);
      try {
        const res = await fetch('/api/scores');
        if (res.ok) scoresList = await res.json();
      } catch (e) {}
    }

    const render = () => {
      this.leaderboardOverlay.innerHTML = `
        <div style="background: rgba(20, 20, 30, 0.95); border: 2px solid #ff4444; border-radius: 12px; padding: 24px 32px; max-width: 500px; width: 90%; box-shadow: 0 0 25px rgba(255,68,68,0.3); text-align: center;">
          <h2 style="color: #ff4444; font-size: 28px; margin-top: 0; text-shadow: 0 0 10px rgba(255,68,68,0.5);">SEI CADUTO!</h2>
          <p style="font-size: 18px; color: #aaa; margin-bottom: 16px;">Punteggio Finale: <b style="color: #fff;">${score}</b> | Uccisioni: <b style="color: #fff;">${kills}</b></p>
          
          <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 8px; align-items: center;">
            <label style="font-size: 14px; color: #ccc;">Nome Giocatore:</label>
            <input id="player-name-input" type="text" value="${this.playerName}" maxlength="20" style="background: #111; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 6px 12px; font-size: 14px;" />
            <button id="save-name-btn" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer;">Salva</button>
          </div>

          <h3 style="color: #ffd54f; margin-bottom: 12px; font-size: 20px;">🏆 CLASSIFICA GIOCATORI (DOCKER PERSISTENT)</h3>
          <div style="max-height: 220px; overflow-y: auto; background: #0a0a10; border-radius: 6px; border: 1px solid #333; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 1px solid #444; color: #ffd54f; background: #151522;">
                  <th style="padding: 8px;">#</th>
                  <th style="padding: 8px;">Nome</th>
                  <th style="padding: 8px;">Punti</th>
                  <th style="padding: 8px;">Kill</th>
                </tr>
              </thead>
              <tbody>
                ${scoresList.length === 0 ? '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #777;">Nessun punteggio ancora registrato.</td></tr>' : ''}
                ${scoresList.map((entry, idx) => `
                  <tr style="border-bottom: 1px solid #222; ${entry.name === this.playerName && entry.score === score ? 'background: rgba(33, 150, 243, 0.25); font-weight: bold;' : ''}">
                    <td style="padding: 8px; color: #aaa;">${idx + 1}</td>
                    <td style="padding: 8px;">${entry.name}</td>
                    <td style="padding: 8px; color: #4CAF50;">${entry.score}</td>
                    <td style="padding: 8px; color: #ff9800;">${entry.kills || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <button id="respawn-btn" style="background: #ff4444; color: white; border: none; padding: 12px 28px; font-size: 18px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: transform 0.1s; box-shadow: 0 0 10px rgba(255,68,68,0.5);">
            RINASCI (R)
          </button>
        </div>
      `;

      const input = document.getElementById('player-name-input') as HTMLInputElement;
      const saveBtn = document.getElementById('save-name-btn');
      const respawnBtn = document.getElementById('respawn-btn');

      if (saveBtn && input) {
        saveBtn.addEventListener('click', async () => {
          const newName = input.value.trim() || 'Giocatore';
          this.playerName = newName;
          localStorage.setItem('mondo_player_name', newName);
          try {
            const res = await fetch('/api/scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newName, score, kills })
            });
            if (res.ok) scoresList = await res.json();
          } catch (e) {}
          render();
        });
      }

      if (respawnBtn) {
        respawnBtn.addEventListener('click', () => {
          this.leaderboardOverlay.style.display = 'none';
          onRespawn();
        });
      }
    };

    render();
  }

  hideLeaderboardOverlay(): void {
    this.leaderboardOverlay.style.display = 'none';
  }
}
