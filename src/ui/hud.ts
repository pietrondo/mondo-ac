declare const __COMMIT_HASH__: string;

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  kills: number;
  survivalTimeSec?: number;
  waveReached?: number;
  accuracyPct?: number;
  favoriteWeapon?: string;
  date: string;
}

export interface PlayerEndStats {
  score: number;
  kills: number;
  survivalTimeSec: number;
  waveReached: number;
  accuracyPct: number;
  favoriteWeapon: string;
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
  private waveElement: HTMLDivElement;
  private waveNotificationElement: HTMLDivElement;
  private controlsElement: HTMLDivElement;

  private coinsElement: HTMLDivElement;
  private questElement: HTMLDivElement;
  private compassElement: HTMLDivElement;
  private skillsBarElement: HTMLDivElement;

  private score = 0;
  private coins = 50; // Starting money
  private kills = 0;
  private combo = 0;
  private isControlsCollapsed = localStorage.getItem('mondo_controls_collapsed') === 'true';

  setQuestText(text: string): void {
    if (this.questElement) {
      this.questElement.textContent = text;
    }
  }

  updateCompass(yawRad: number, nearestPoiName?: string, nearestPoiDist?: number): void {
    if (!this.compassElement) return;

    let deg = Math.round(((-yawRad * 180 / Math.PI) % 360 + 360) % 360);
    let cardinal = 'N';
    if (deg >= 22.5 && deg < 67.5) cardinal = 'NE';
    else if (deg >= 67.5 && deg < 112.5) cardinal = 'E';
    else if (deg >= 112.5 && deg < 157.5) cardinal = 'SE';
    else if (deg >= 157.5 && deg < 202.5) cardinal = 'S';
    else if (deg >= 202.5 && deg < 247.5) cardinal = 'SW';
    else if (deg >= 247.5 && deg < 292.5) cardinal = 'W';
    else if (deg >= 292.5 && deg < 337.5) cardinal = 'NW';

    let poiStr = '';
    if (nearestPoiName && nearestPoiDist !== undefined) {
      poiStr = ` <span style="color: #fbbf24; border-left: 1px solid #334155; padding-left: 10px;">📍 ${nearestPoiName} (${Math.round(nearestPoiDist)}m)</span>`;
    }

    this.compassElement.innerHTML = `🧭 ${cardinal} ${deg}°${poiStr}`;
  }

  addCoins(amount: number): void {
    this.coins += amount;
    this.updateCoinsDisplay();
  }

  spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.updateCoinsDisplay();
      return true;
    }
    return false;
  }

  getCoins(): number {
    return this.coins;
  }

  private updateCoinsDisplay(): void {
    if (this.coinsElement) {
      this.coinsElement.textContent = `💰 MONETE: $${this.coins}`;
    }
  }
  private comboTimer = 0;
  private readonly comboDuration = 3.0; // Seconds to maintain combo

  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private minimapSize = 150;
  private minimapRange = 100;

  private enemyAlertTimer = 0;
  private playerName = localStorage.getItem('mondo_player_name') || 'Giocatore';
  private isMinimapExpanded = false;

  setPlayerName(name: string): void {
    this.playerName = name.trim().substring(0, 20) || 'Giocatore';
    localStorage.setItem('mondo_player_name', this.playerName);
  }

  toggleMinimapExpanded(): void {
    this.isMinimapExpanded = !this.isMinimapExpanded;
    this.minimapSize = this.isMinimapExpanded ? 300 : 150;
    this.minimapRange = this.isMinimapExpanded ? 220 : 100;
    this.minimapCanvas.width = this.minimapSize;
    this.minimapCanvas.height = this.minimapSize;
    this.minimapCanvas.style.width = `${this.minimapSize}px`;
    this.minimapCanvas.style.height = `${this.minimapSize}px`;
  }

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

    this.coinsElement = document.createElement('div');
    this.coinsElement.style.cssText = `
      position: fixed;
      top: 52px;
      left: 20px;
      color: #FFD700;
      font-family: system-ui, sans-serif;
      font-size: 20px;
      font-weight: 800;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.6);
      z-index: 100;
    `;
    this.coinsElement.textContent = '💰 MONETE: $50';
    document.body.appendChild(this.coinsElement);

    this.questElement = document.createElement('div');
    this.questElement.style.cssText = `
      position: fixed;
      top: 82px;
      left: 20px;
      color: #E2E8F0;
      background: rgba(15, 23, 42, 0.75);
      border-left: 3px solid #38BDF8;
      border-radius: 0 6px 6px 0;
      padding: 6px 12px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
      z-index: 100;
      pointer-events: none;
      user-select: none;
      max-width: 380px;
    `;
    this.questElement.textContent = '📜 Nessuna missione attiva';
    document.body.appendChild(this.questElement);

    this.compassElement = document.createElement('div');
    this.compassElement.style.cssText = `
      position: fixed;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid #38bdf8;
      border-radius: 20px;
      padding: 6px 18px;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 700;
      z-index: 100;
      pointer-events: none;
      user-select: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      gap: 12px;
      align-items: center;
    `;
    this.compassElement.textContent = '🧭 N 0°';
    document.body.appendChild(this.compassElement);

    this.skillsBarElement = document.createElement('div');
    this.skillsBarElement.style.cssText = `
      position: fixed;
      bottom: 35px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 100;
      pointer-events: none;
      user-select: none;
    `;
    this.skillsBarElement.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #38bdf8; border-radius: 10px; padding: 6px 12px; text-align: center; color: #f8fafc; font-family: sans-serif; font-size: 12px; font-weight: bold;">
        <div>⚡ DASH [Q]</div>
        <div id="skill-dash-cd" style="color: #4ade80; margin-top: 2px;">PRONTO</div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #38bdf8; border-radius: 10px; padding: 6px 12px; text-align: center; color: #f8fafc; font-family: sans-serif; font-size: 12px; font-weight: bold;">
        <div>🛡️ SCUDO [E]</div>
        <div id="skill-shield-cd" style="color: #4ade80; margin-top: 2px;">PRONTO</div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #38bdf8; border-radius: 10px; padding: 6px 12px; text-align: center; color: #f8fafc; font-family: sans-serif; font-size: 12px; font-weight: bold;">
        <div>💣 GRANATA [F]</div>
        <div id="skill-grenade-cd" style="color: #4ade80; margin-top: 2px;">PRONTO</div>
      </div>
    `;
    document.body.appendChild(this.skillsBarElement);

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

    this.controlsElement = document.createElement('div');
    this.controlsElement.style.cssText = `
      position: fixed;
      top: 30px;
      right: 20px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 12px;
      padding: 10px 14px;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      z-index: 100;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      user-select: none;
      transition: all 0.25s ease;
      min-width: 170px;
    `;
    this.renderControlsCard();
    document.body.appendChild(this.controlsElement);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyH' && !e.repeat) {
          this.toggleControls();
        }
      });
    }

    this.waveElement = document.createElement('div');
    this.waveElement.style.cssText = `
      position: fixed;
      top: 55px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffd54f;
      font-family: system-ui, sans-serif;
      font-size: 16px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      z-index: 100;
      pointer-events: none;
      user-select: none;
      background: rgba(15, 23, 42, 0.7);
      padding: 4px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255, 213, 79, 0.4);
    `;
    this.waveElement.textContent = 'ONDATA 1 | Nemici: 0';
    document.body.appendChild(this.waveElement);

    this.waveNotificationElement = document.createElement('div');
    this.waveNotificationElement.style.cssText = `
      position: fixed;
      top: 35%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      background: rgba(10, 10, 20, 0.9);
      border: 2px solid #ffd54f;
      border-radius: 12px;
      padding: 18px 36px;
      text-align: center;
      font-family: system-ui, sans-serif;
      z-index: 200;
      pointer-events: none;
      user-select: none;
      display: none;
      box-shadow: 0 0 24px rgba(255, 213, 79, 0.5);
    `;
    document.body.appendChild(this.waveNotificationElement);

    // Boss Health Bar UI
    this.bossBarContainer = document.createElement('div');
    this.bossBarContainer.style.cssText = `
      position: fixed;
      top: 92px;
      left: 50%;
      transform: translateX(-50%);
      width: 450px;
      max-width: 90vw;
      background: rgba(15, 5, 5, 0.85);
      border: 2px solid #FF1744;
      border-radius: 8px;
      padding: 6px 12px;
      z-index: 150;
      display: none;
      box-shadow: 0 0 20px rgba(255, 23, 68, 0.5);
      font-family: system-ui, sans-serif;
    `;
    this.bossBarContainer.innerHTML = `
      <div id="boss-name" style="color: #FF5252; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin-bottom: 4px;">👑 BOSS TITANO</div>
      <div style="width: 100%; height: 14px; background: rgba(0,0,0,0.6); border-radius: 6px; overflow: hidden; border: 1px solid #ff1744;">
        <div id="boss-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ff1744, #ff5252); transition: width 0.15s ease-out;"></div>
      </div>
    `;
    document.body.appendChild(this.bossBarContainer);

    // Skill Bar UI
    this.skillBarElement = document.createElement('div');
    this.skillBarElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 150;
      font-family: system-ui, sans-serif;
    `;
    this.skillBarElement.innerHTML = `
      <div id="skill-dash" style="background: rgba(0,229,255,0.2); border: 2px solid #00E5FF; border-radius: 8px; padding: 6px 12px; color: white; font-weight: bold; font-size: 13px; text-align: center; min-width: 75px; box-shadow: 0 0 10px rgba(0,229,255,0.3);">
        <div style="font-size: 11px; color: #80DEEA;">[Q] DASH</div>
        <div id="cd-dash" style="font-size: 12px; color: #76FF03; margin-top: 2px;">PRONTO</div>
      </div>
      <div id="skill-grenade" style="background: rgba(255,145,0,0.2); border: 2px solid #FF9100; border-radius: 8px; padding: 6px 12px; color: white; font-weight: bold; font-size: 13px; text-align: center; min-width: 75px; box-shadow: 0 0 10px rgba(255,145,0,0.3);">
        <div style="font-size: 11px; color: #FFE082;">[F] GRANATA</div>
        <div id="cd-grenade" style="font-size: 12px; color: #76FF03; margin-top: 2px;">PRONTO</div>
      </div>
      <div id="skill-shield" style="background: rgba(179,136,255,0.2); border: 2px solid #B388FF; border-radius: 8px; padding: 6px 12px; color: white; font-weight: bold; font-size: 13px; text-align: center; min-width: 75px; box-shadow: 0 0 10px rgba(179,136,255,0.3);">
        <div style="font-size: 11px; color: #D1C4E9;">[C] SCUDO</div>
        <div id="cd-shield" style="font-size: 12px; color: #76FF03; margin-top: 2px;">PRONTO</div>
      </div>
    `;
    document.body.appendChild(this.skillBarElement);

    // Time & Weather UI
    this.timeWeatherElement = document.createElement('div');
    this.timeWeatherElement.style.cssText = `
      position: fixed;
      top: 25px;
      right: 120px;
      color: #E0E0E0;
      font-family: system-ui, monospace;
      font-size: 14px;
      font-weight: bold;
      background: rgba(0,0,0,0.5);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 100;
    `;
    // Dungeon Status UI
    this.dungeonStatusElement = document.createElement('div');
    this.dungeonStatusElement.style.cssText = `
      position: fixed;
      top: 55px;
      left: 20px;
      color: #b388ff;
      background: rgba(15, 10, 25, 0.85);
      border: 1.5px solid #b388ff;
      border-radius: 8px;
      padding: 6px 14px;
      font-family: system-ui, sans-serif;
      font-size: 15px;
      font-weight: bold;
      z-index: 100;
      display: none;
      box-shadow: 0 0 12px rgba(179, 136, 255, 0.4);
    `;
    this.dungeonStatusElement.textContent = '🏰 DUNGEON SUBTERRANEO';
    document.body.appendChild(this.dungeonStatusElement);

    // Lore Notification UI
    this.loreNotificationElement = document.createElement('div');
    this.loreNotificationElement.style.cssText = `
      position: fixed;
      bottom: 110px;
      right: 20px;
      background: rgba(12, 24, 36, 0.92);
      border: 1.5px solid #80DEEA;
      border-radius: 10px;
      padding: 10px 16px;
      color: #80DEEA;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 120;
      display: none;
      box-shadow: 0 0 16px rgba(128, 222, 234, 0.4);
      user-select: none;
      pointer-events: none;
    `;
    document.body.appendChild(this.loreNotificationElement);
  }

  private bossBarContainer: HTMLDivElement;
  private skillBarElement: HTMLDivElement;
  private timeWeatherElement: HTMLDivElement;
  private dungeonStatusElement: HTMLDivElement;
  private loreNotificationElement: HTMLDivElement;

  showLoreNotification(title: string, category: string = 'Lore'): void {
    this.loreNotificationElement.innerHTML = `
      <div style="font-size: 11px; color: #B2EBF2; text-transform: uppercase; letter-spacing: 1px;">📖 NUOVA LORE (${category.toUpperCase()}) [Premi L]</div>
      <div style="font-size: 15px; color: #FFFFFF; font-weight: 800; margin-top: 2px;">${title}</div>
    `;
    this.loreNotificationElement.style.display = 'block';
    setTimeout(() => {
      this.loreNotificationElement.style.display = 'none';
    }, 4500);
  }

  setDungeonStatus(visible: boolean, name: string = 'Cripta Subterranea', monstersRemaining: number = 0): void {
    if (visible) {
      this.dungeonStatusElement.textContent = `🏰 ${name.toUpperCase()} | Nemici: ${monstersRemaining}`;
      this.dungeonStatusElement.style.display = 'block';
    } else {
      this.dungeonStatusElement.style.display = 'none';
    }
  }

  updateSkillCooldowns(dashCd: number, grenadeCd: number, shieldCd: number): void {
    const cdDash = document.getElementById('cd-dash') || document.getElementById('skill-dash-cd');
    const cdGrenade = document.getElementById('cd-grenade') || document.getElementById('skill-grenade-cd');
    const cdShield = document.getElementById('cd-shield') || document.getElementById('skill-shield-cd');
    if (cdDash) {
      cdDash.textContent = dashCd > 0 ? `${dashCd.toFixed(1)}s` : 'PRONTO';
      cdDash.style.color = dashCd > 0 ? '#f87171' : '#4ade80';
    }
    if (cdGrenade) {
      cdGrenade.textContent = grenadeCd > 0 ? `${grenadeCd.toFixed(1)}s` : 'PRONTO';
      cdGrenade.style.color = grenadeCd > 0 ? '#f87171' : '#4ade80';
    }
    if (cdShield) {
      cdShield.textContent = shieldCd > 0 ? `${shieldCd.toFixed(1)}s` : 'PRONTO';
      cdShield.style.color = shieldCd > 0 ? '#f87171' : '#4ade80';
    }
  }

  showBossHealthBar(name: string, hp: number, maxHp: number, phase?: number): void {
    this.bossBarContainer.style.display = 'block';
    const nameEl = document.getElementById('boss-name');
    const fillEl = document.getElementById('boss-hp-fill');
    const phaseText = phase ? ` (FASE ${phase})` : '';
    if (nameEl) nameEl.textContent = `👑 ${name}${phaseText}`;
    if (fillEl) fillEl.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  }

  hideBossHealthBar(): void {
    this.bossBarContainer.style.display = 'none';
  }

  updateEnvironmentUI(timeStr: string, weatherIcon: string): void {
    this.timeWeatherElement.textContent = `${weatherIcon} ${timeStr}`;
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

  updateWaveInfo(wave: number, enemiesRemaining: number, isBossActive: boolean): void {
    const bossText = isBossActive ? ' | ⚠️ BOSS PRESENTE!' : '';
    this.waveElement.textContent = `ONDATA ${wave} | Nemici: ${enemiesRemaining}${bossText}`;
  }

  showWaveBanner(title: string, subtitle: string, durationSec = 3): void {
    this.waveNotificationElement.innerHTML = `
      <h1 style="margin: 0; font-size: 32px; color: #ffd54f; text-shadow: 0 0 10px rgba(255,213,79,0.5);">${title}</h1>
      <p style="margin: 6px 0 0 0; font-size: 18px; color: #ddd;">${subtitle}</p>
    `;
    this.waveNotificationElement.style.display = 'block';
    setTimeout(() => {
      this.waveNotificationElement.style.display = 'none';
    }, durationSec * 1000);
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

    const dx = nearestEnemy.x - playerPos.x;
    const dz = nearestEnemy.z - playerPos.z;
    const enemyAngle = Math.atan2(dx, -dz);
    let relAngle = enemyAngle - playerYaw;

    while (relAngle > Math.PI) relAngle -= Math.PI * 2;
    while (relAngle < -Math.PI) relAngle += Math.PI * 2;

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

  deductScore(amount: number): boolean {
    if (this.score >= amount) {
      this.score -= amount;
      this.scoreElement.textContent = `SCORE: ${this.score} | KILLS: ${this.kills}`;
      return true;
    }
    return false;
  }

  toggleUpgradeMenu(onUpgrade: (type: 'hp' | 'speed' | 'damage' | 'cooldown') => boolean): void {
    let overlay = document.getElementById('skill-tree-overlay') as HTMLDivElement;
    if (overlay) {
      overlay.remove();
      return;
    }

    overlay = document.createElement('div');
    overlay.id = 'skill-tree-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 460px;
      max-width: 90vw;
      background: rgba(12, 16, 28, 0.95);
      border: 2px solid #76FF03;
      border-radius: 16px;
      padding: 24px;
      color: white;
      font-family: system-ui, sans-serif;
      z-index: 10000;
      box-shadow: 0 0 30px rgba(118, 255, 3, 0.4);
      pointer-events: auto;
    `;

    overlay.innerHTML = `
      <h2 style="color: #76FF03; text-align: center; margin-bottom: 8px; font-weight: 900; letter-spacing: 2px;">⚡ ALBERO DELLE ABILITÀ</h2>
      <p style="text-align: center; color: #b0bec5; font-size: 13px; margin-bottom: 20px;">Punti disponibili: <strong id="skill-points-txt" style="color:#00E5FF">${this.score}</strong> (Costo upgrade: 100 Punti)</p>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="up-hp" style="background: rgba(255,23,68,0.2); border: 1.5px solid #FF1744; color: white; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>❤️ SALUTE MASSIMA (+25 HP)</span>
          <span style="background: #FF1744; padding: 4px 10px; border-radius: 6px; font-size: 12px;">100 PTS</span>
        </button>
        <button id="up-speed" style="background: rgba(0,230,118,0.2); border: 1.5px solid #00E676; color: white; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>⚡ VELOCITÀ MOVIMENTO (+15%)</span>
          <span style="background: #00E676; padding: 4px 10px; border-radius: 6px; font-size: 12px;">100 PTS</span>
        </button>
        <button id="up-damage" style="background: rgba(255,214,0,0.2); border: 1.5px solid #FFD600; color: white; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🎯 DANNO CRITICO ARMI (+20%)</span>
          <span style="background: #FFD600; color: black; padding: 4px 10px; border-radius: 6px; font-size: 12px;">100 PTS</span>
        </button>
      </div>

      <button id="close-skills-btn" style="width: 100%; margin-top: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">
        CHIUDI (Premere U)
      </button>
    `;

    document.body.appendChild(overlay);

    const updatePointsTxt = () => {
      const el = document.getElementById('skill-points-txt');
      if (el) el.textContent = `${this.score}`;
    };

    document.getElementById('up-hp')?.addEventListener('click', () => {
      if (this.deductScore(100)) {
        onUpgrade('hp');
        updatePointsTxt();
      }
    });

    document.getElementById('up-speed')?.addEventListener('click', () => {
      if (this.deductScore(100)) {
        onUpgrade('speed');
        updatePointsTxt();
      }
    });

    document.getElementById('up-damage')?.addEventListener('click', () => {
      if (this.deductScore(100)) {
        onUpgrade('damage');
        updatePointsTxt();
      }
    });

    document.getElementById('close-skills-btn')?.addEventListener('click', () => {
      overlay.remove();
    });
  }

  openShopMenu(onBuy: (item: 'health' | 'ammo' | 'shield' | 'damage' | 'grenadelauncher' | 'plasma' | 'sniper' | 'sword' | 'spear' | 'bow' | 'staff' | 'rock') => boolean): void {
    let overlay = document.getElementById('merchant-shop-overlay') as HTMLDivElement;
    if (overlay) {
      overlay.remove();
      return;
    }

    overlay = document.createElement('div');
    overlay.id = 'merchant-shop-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 540px;
      max-width: 94vw;
      max-height: 88vh;
      overflow-y: auto;
      background: rgba(18, 22, 34, 0.96);
      border: 2px solid #FFD700;
      border-radius: 16px;
      padding: 24px;
      color: white;
      font-family: system-ui, sans-serif;
      z-index: 10000;
      box-shadow: 0 0 35px rgba(255, 215, 0, 0.4);
      pointer-events: auto;
    `;

    overlay.innerHTML = `
      <h2 style="color: #FFD700; text-align: center; margin-bottom: 6px; font-weight: 900; letter-spacing: 2px;">🏪 ARMERIA DEL MERCANTE</h2>
      <p style="text-align: center; color: #b0bec5; font-size: 13px; margin-bottom: 18px;">Le tue monete: <strong id="shop-coins-txt" style="color:#FFD700">$${this.coins}</strong></p>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="buy-health" style="background: rgba(255,23,68,0.2); border: 1.5px solid #FF1744; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🧪 POZIONE DI VITA (+50 HP)</span>
          <span style="background: #FF1744; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$30</span>
        </button>
        <button id="buy-ammo" style="background: rgba(0,229,255,0.2); border: 1.5px solid #00E5FF; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>📦 CASSA MUNIZIONI (MAX AMMO)</span>
          <span style="background: #00E5FF; color: black; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$20</span>
        </button>

        <div style="border-top: 1px solid rgba(255,255,255,0.2); margin: 4px 0;"></div>
        <div style="color: #FFD700; font-size: 12px; font-weight: 800; letter-spacing: 1px;">⚔️ ARMI MEDIEVALI & MAGIA:</div>

        <button id="buy-sword" style="background: rgba(255,193,7,0.2); border: 1.5px solid #FFC107; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🗡️ SPADA LUNGA (65 DANNO CORPO A CORPO)</span>
          <span style="background: #FFC107; color: black; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$60</span>
        </button>
        <button id="buy-spear" style="background: rgba(121,85,72,0.2); border: 1.5px solid #795548; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🔱 LANCIA DI FERRO (75 DANNO ALLUNGO 5.8m)</span>
          <span style="background: #795548; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$80</span>
        </button>
        <button id="buy-bow" style="background: rgba(139,195,74,0.2); border: 1.5px solid #8BC34A; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🏹 ARCO DA CACCIA (85 DANNO FRECCIA)</span>
          <span style="background: #8BC34A; color: black; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$100</span>
        </button>
        <button id="buy-staff" style="background: rgba(156,39,176,0.2); border: 1.5px solid #9C27B0; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🔮 BASTONE MAGICO (PROIETTI ARCANO 55 DANNO)</span>
          <span style="background: #9C27B0; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$120</span>
        </button>
        <button id="buy-rock" style="background: rgba(158,158,158,0.2); border: 1.5px solid #9E9E9E; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🪨 SASSO DA LANCIO (35 DANNO ECONOMICO)</span>
          <span style="background: #9E9E9E; color: black; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$15</span>
        </button>

        <div style="border-top: 1px solid rgba(255,255,255,0.2); margin: 4px 0;"></div>
        <div style="color: #FFD700; font-size: 12px; font-weight: 800; letter-spacing: 1px;">💥 ARMI PESANTI E SPECIALE:</div>

        <button id="buy-grenadelauncher" style="background: rgba(255,109,0,0.2); border: 1.5px solid #FF6D00; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>💣 LANCIA-GRANATE (110 DANNO AOE)</span>
          <span style="background: #FF6D00; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$150</span>
        </button>
        <button id="buy-plasma" style="background: rgba(0,230,118,0.2); border: 1.5px solid #00E676; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>⚡ CANNONE PLASMA (40 COLPI RAPIDI)</span>
          <span style="background: #00E676; color: black; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$200</span>
        </button>
        <button id="buy-sniper" style="background: rgba(224,64,251,0.2); border: 1.5px solid #E040FB; color: white; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <span>🎯 SNIPER 50CAL (180 DANNO CRITICO)</span>
          <span style="background: #E040FB; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px;">$250</span>
        </button>
      </div>

      <button id="close-shop-btn" style="width: 100%; margin-top: 18px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">
        ESCI DAL NEGOZIO
      </button>
    `;

    document.body.appendChild(overlay);

    const updateShopCoinsTxt = () => {
      const el = document.getElementById('shop-coins-txt');
      if (el) el.textContent = `$${this.coins}`;
    };

    document.getElementById('buy-health')?.addEventListener('click', () => {
      if (this.spendCoins(30)) {
        onBuy('health');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-ammo')?.addEventListener('click', () => {
      if (this.spendCoins(20)) {
        onBuy('ammo');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-sword')?.addEventListener('click', () => {
      if (this.spendCoins(60)) {
        onBuy('sword');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-spear')?.addEventListener('click', () => {
      if (this.spendCoins(80)) {
        onBuy('spear');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-bow')?.addEventListener('click', () => {
      if (this.spendCoins(100)) {
        onBuy('bow');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-staff')?.addEventListener('click', () => {
      if (this.spendCoins(120)) {
        onBuy('staff');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-rock')?.addEventListener('click', () => {
      if (this.spendCoins(15)) {
        onBuy('rock');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-shield')?.addEventListener('click', () => {
      if (this.spendCoins(50)) {
        onBuy('shield');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-damage')?.addEventListener('click', () => {
      if (this.spendCoins(100)) {
        onBuy('damage');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-grenadelauncher')?.addEventListener('click', () => {
      if (this.spendCoins(150)) {
        onBuy('grenadelauncher');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-plasma')?.addEventListener('click', () => {
      if (this.spendCoins(200)) {
        onBuy('plasma');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('buy-sniper')?.addEventListener('click', () => {
      if (this.spendCoins(250)) {
        onBuy('sniper');
        updateShopCoinsTxt();
      }
    });

    document.getElementById('close-shop-btn')?.addEventListener('click', () => {
      overlay.remove();
    });
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
    playerYaw: number,
    enemies: { x: number; z: number }[],
    pois: { x: number; z: number; type: string }[],
    nextTargets?: { x: number; z: number; type: string }[]
  ): void {
    this.minimapCtx.clearRect(0, 0, this.minimapSize, this.minimapSize);

    const scale = this.minimapSize / (this.minimapRange * 2);
    const centerX = this.minimapSize / 2;
    const centerY = this.minimapSize / 2;

    this.minimapCtx.save();
    this.minimapCtx.fillStyle = 'rgba(10, 15, 25, 0.75)';
    this.minimapCtx.fillRect(0, 0, this.minimapSize, this.minimapSize);

    // Rotate map around center so UP on minimap is forward player heading
    this.minimapCtx.save();
    this.minimapCtx.translate(centerX, centerY);
    // playerYaw 0 is looking towards -Z. Rotating by (playerYaw - Math.PI/2) aligns forward with UP on canvas.
    this.minimapCtx.rotate(playerYaw - Math.PI / 2);

    for (const poi of pois) {
      const relX = (poi.x - playerPos.x) * scale;
      const relZ = (poi.z - playerPos.z) * scale;
      const maxOffset = (this.minimapSize / 2) - 8;
      const isInside = Math.abs(relX) <= maxOffset && Math.abs(relZ) <= maxOffset;

      let poiColor = '#ffd54f';
      if (poi.type === 'village') poiColor = '#4CAF50';
      else if (poi.type === 'castle') poiColor = '#9C27B0';
      else if (poi.type === 'temple') poiColor = '#2196F3';
      else if (poi.type === 'windmill') poiColor = '#FF9800';
      else if (poi.type === 'watchtower') poiColor = '#E91E63';
      else if (poi.type === 'blacksmith') poiColor = '#FF5722';
      else if (poi.type === 'dungeon_entrance') poiColor = '#AB47BC';

      if (isInside) {
        this.minimapCtx.fillStyle = poiColor;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(relX, relZ, 4, 0, Math.PI * 2);
        this.minimapCtx.fill();
      } else {
        // Draw offscreen POI indicator on minimap edge
        const angle = Math.atan2(relZ, relX);
        const edgeX = Math.cos(angle) * maxOffset;
        const edgeY = Math.sin(angle) * maxOffset;

        this.minimapCtx.save();
        this.minimapCtx.fillStyle = poiColor;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(edgeX, edgeY, poi.type === 'village' || poi.type === 'castle' ? 4 : 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
        this.minimapCtx.restore();
      }
    }

    const drawAlertPulsing = this.enemyAlertTimer > 0;

    for (const enemy of enemies) {
      const relX = (enemy.x - playerPos.x) * scale;
      const relZ = (enemy.z - playerPos.z) * scale;
      const maxOffset = (this.minimapSize / 2) - 10;

      const isInside = Math.abs(relX) <= maxOffset && Math.abs(relZ) <= maxOffset;

      if (isInside) {
        this.minimapCtx.fillStyle = drawAlertPulsing ? '#ff9900' : '#ff4444';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(relX, relZ, drawAlertPulsing ? 4 : 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }

      if (!isInside || drawAlertPulsing) {
        const angle = Math.atan2(relZ, relX);
        const edgeX = Math.cos(angle) * maxOffset;
        const edgeY = Math.sin(angle) * maxOffset;

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

    // When 0 enemies are nearby, render directional arrows pointing to nearest POIs / spawn points
    if (enemies.length === 0 && nextTargets && nextTargets.length > 0) {
      const maxOffset = (this.minimapSize / 2) - 10;
      for (const target of nextTargets.slice(0, 3)) {
        const relX = (target.x - playerPos.x) * scale;
        const relZ = (target.z - playerPos.z) * scale;
        const angle = Math.atan2(relZ, relX);
        const edgeX = Math.cos(angle) * maxOffset;
        const edgeY = Math.sin(angle) * maxOffset;

        this.minimapCtx.save();
        this.minimapCtx.translate(edgeX, edgeY);
        this.minimapCtx.rotate(angle);

        this.minimapCtx.fillStyle = target.type === 'dungeon_entrance' ? '#ab47bc' : '#00e5ff';
        this.minimapCtx.beginPath();
        this.minimapCtx.moveTo(7, 0);
        this.minimapCtx.lineTo(-5, -4);
        this.minimapCtx.lineTo(-2, 0);
        this.minimapCtx.lineTo(-5, 4);
        this.minimapCtx.closePath();
        this.minimapCtx.fill();

        this.minimapCtx.restore();
      }
    }

    this.minimapCtx.restore(); // restore map rotation

    // Label when area is clear of enemies
    if (enemies.length === 0) {
      this.minimapCtx.save();
      this.minimapCtx.fillStyle = 'rgba(0, 229, 255, 0.9)';
      this.minimapCtx.font = 'bold 9px sans-serif';
      this.minimapCtx.textAlign = 'center';
      this.minimapCtx.fillText('AREA PULITA', centerX, 14);
      this.minimapCtx.restore();
    }

    // Draw Player Arrow at Center pointing UP
    this.minimapCtx.fillStyle = '#00ff00';
    this.minimapCtx.beginPath();
    this.minimapCtx.moveTo(centerX, centerY - 9);
    this.minimapCtx.lineTo(centerX - 6, centerY + 5);
    this.minimapCtx.lineTo(centerX, centerY + 2);
    this.minimapCtx.lineTo(centerX + 6, centerY + 5);
    this.minimapCtx.closePath();
    this.minimapCtx.fill();
    this.minimapCtx.strokeStyle = '#ffffff';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.stroke();

    this.minimapCtx.restore();
  }

  async showLeaderboardOverlay(stats: PlayerEndStats, onRespawn: () => void): Promise<void> {
    this.leaderboardOverlay.style.display = 'flex';
    document.exitPointerLock();

    const formattedTime = `${Math.floor(stats.survivalTimeSec / 60).toString().padStart(2, '0')}:${Math.floor(stats.survivalTimeSec % 60).toString().padStart(2, '0')}`;

    let scoresList: ScoreEntry[] = [];
    const payload = {
      name: this.playerName,
      score: stats.score,
      kills: stats.kills,
      survivalTimeSec: Math.round(stats.survivalTimeSec),
      waveReached: stats.waveReached,
      accuracyPct: Math.round(stats.accuracyPct),
      favoriteWeapon: stats.favoriteWeapon
    };

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        <div style="background: rgba(20, 20, 30, 0.95); border: 2px solid #ff4444; border-radius: 12px; padding: 24px 32px; max-width: 600px; width: 92%; box-shadow: 0 0 25px rgba(255,68,68,0.3); text-align: center;">
          <h2 style="color: #ff4444; font-size: 28px; margin-top: 0; text-shadow: 0 0 10px rgba(255,68,68,0.5);">SEI CADUTO!</h2>
          
          <div style="display: flex; justify-content: space-around; background: rgba(0,0,0,0.5); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 15px; color: #ddd;">
            <div>Punti: <b style="color: #4CAF50;">${stats.score}</b></div>
            <div>Ondata: <b style="color: #ffd54f;">${stats.waveReached}</b></div>
            <div>Kill: <b style="color: #ff9800;">${stats.kills}</b></div>
            <div>Tempo: <b style="color: #2196F3;">${formattedTime}</b></div>
          </div>
          
          <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 8px; align-items: center;">
            <label style="font-size: 14px; color: #ccc;">Nome Giocatore:</label>
            <input id="player-name-input" type="text" value="${this.playerName}" maxlength="20" style="background: #111; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 6px 12px; font-size: 14px;" />
            <button id="save-name-btn" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer;">Salva</button>
          </div>

          <h3 style="color: #ffd54f; margin-bottom: 12px; font-size: 18px;">🏆 CLASSIFICA E STATISTICHE GIOCATORI (DOCKER PERSISTENT)</h3>
          <div style="max-height: 220px; overflow-y: auto; background: #0a0a10; border-radius: 6px; border: 1px solid #333; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="border-bottom: 1px solid #444; color: #ffd54f; background: #151522;">
                  <th style="padding: 6px 8px;">#</th>
                  <th style="padding: 6px 8px;">Nome</th>
                  <th style="padding: 6px 8px;">Punti</th>
                  <th style="padding: 6px 8px;">Ondata</th>
                  <th style="padding: 6px 8px;">Kill</th>
                  <th style="padding: 6px 8px;">Tempo</th>
                </tr>
              </thead>
              <tbody>
                ${scoresList.length === 0 ? '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #777;">Nessun punteggio ancora registrato.</td></tr>' : ''}
                ${scoresList.map((entry, idx) => {
                  const t = entry.survivalTimeSec ? `${Math.floor(entry.survivalTimeSec / 60)}m ${entry.survivalTimeSec % 60}s` : '-';
                  return `
                    <tr style="border-bottom: 1px solid #222; ${entry.name === this.playerName && entry.score === stats.score ? 'background: rgba(33, 150, 243, 0.25); font-weight: bold;' : ''}">
                      <td style="padding: 6px 8px; color: #aaa;">${idx + 1}</td>
                      <td style="padding: 6px 8px;">${entry.name}</td>
                      <td style="padding: 6px 8px; color: #4CAF50;">${entry.score}</td>
                      <td style="padding: 6px 8px; color: #ffd54f;">W${entry.waveReached || 1}</td>
                      <td style="padding: 6px 8px; color: #ff9800;">${entry.kills || 0}</td>
                      <td style="padding: 6px 8px; color: #888;">${t}</td>
                    </tr>
                  `;
                }).join('')}
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
              body: JSON.stringify({ ...payload, name: newName })
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

  toggleControls(): void {
    this.isControlsCollapsed = !this.isControlsCollapsed;
    localStorage.setItem('mondo_controls_collapsed', String(this.isControlsCollapsed));
    this.renderControlsCard();
  }

  private renderControlsCard(): void {
    if (!this.controlsElement) return;
    if (this.isControlsCollapsed) {
      this.controlsElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 10px;" id="toggle-controls-btn">
          <span style="font-weight: 700; color: #38bdf8; letter-spacing: 0.5px;">🎮 COMANDI</span>
          <span style="background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #94a3b8;">[H] Mostra</span>
        </div>
      `;
    } else {
      this.controlsElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 6px; gap: 12px;" id="toggle-controls-btn">
          <span style="font-weight: 700; color: #38bdf8; letter-spacing: 0.5px;">🎮 COMANDI</span>
          <span style="background: rgba(255,255,255,0.18); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #cbd5e1;">[H] Nascondi</span>
        </div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; color: #cbd5e1; font-size: 12px; line-height: 1.45;">
          <b style="color: #f1f5f9;">WASD</b><span>Muoviti / Guida</span>
          <b style="color: #f1f5f9;">SHIFT</b><span>Scatto / Boost</span>
          <b style="color: #f1f5f9;">SPACE</b><span>Salta / Vola Su</span>
          <b style="color: #f1f5f9;">MOUSE</b><span>Mira & Sparo</span>
          <b style="color: #f1f5f9;">E</b><span>Interact / Sali / Parla</span>
          <b style="color: #f1f5f9;">R</b><span>Ricarica Arma</span>
          <b style="color: #f1f5f9;">L</b><span>Codex Storie</span>
          <b style="color: #f1f5f9;">1 - 9</b><span>Selezione Armi</span>
        </div>
      `;
    }

    this.controlsElement.onclick = (e) => {
      e.stopPropagation();
      this.toggleControls();
    };
  }

  hideLeaderboardOverlay(): void {
    this.leaderboardOverlay.style.display = 'none';
  }
}
