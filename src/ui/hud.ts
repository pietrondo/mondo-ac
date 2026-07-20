export class HUD {
  private scoreElement: HTMLDivElement;
  private ammoElement: HTMLDivElement;
  private reloadElement: HTMLDivElement;
  private crosshairElement: HTMLDivElement;
  private statusElement: HTMLDivElement;
  private buffsElement: HTMLDivElement;
  private interactPromptElement: HTMLDivElement;
  private comboElement: HTMLDivElement;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private readonly comboDuration = 3.0; // Seconds to maintain combo
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private minimapSize = 150;
  private minimapRange = 100;

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
    this.interactPromptElement.style.display = 'none';
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
  }

  addScore(amount: number): void {
    this.score += amount;
    this.scoreElement.textContent = `Score: ${this.score}`;
  }

  incrementCombo(): void {
    this.combo++;
    this.comboTimer = this.comboDuration;
    this.updateComboDisplay();
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

  update(delta: number): void {
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboElement.style.opacity = '0';
      }
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

    for (const enemy of enemies) {
      const relX = (enemy.x - playerPos.x) * scale;
      const relZ = (enemy.z - playerPos.z) * scale;
      if (Math.abs(relX) < this.minimapSize / 2 && Math.abs(relZ) < this.minimapSize / 2) {
        const px = centerX + relX;
        const py = centerY + relZ;
        
        this.minimapCtx.fillStyle = '#ff4444';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(px, py, 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }
    }

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
}
