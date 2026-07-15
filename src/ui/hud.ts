export class HUD {
  private scoreElement: HTMLDivElement;
  private ammoElement: HTMLDivElement;
  private reloadElement: HTMLDivElement;
  private crosshairElement: HTMLDivElement;
  private statusElement: HTMLDivElement;
  private buffsElement: HTMLDivElement;
  private score = 0;

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
  }

  addScore(amount: number): void {
    this.score += amount;
    this.scoreElement.textContent = `Score: ${this.score}`;
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
}
