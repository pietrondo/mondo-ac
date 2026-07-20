// HitMarker - DOM-based hit feedback overlay

interface HitMarkerState {
  active: boolean;
  life: number;
  maxLife: number;
}

export class HitMarker {
  private element: HTMLDivElement;
  private crosshairLines: HTMLDivElement[] = [];
  private xMarker: HTMLDivElement;
  private state: HitMarkerState = {
    active: false,
    life: 0,
    maxLife: 0.15, // 150ms per il crosshair che pulsa
  };

  constructor() {
    // Container principale al centro dello schermo
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      pointer-events: none;
      z-index: 1001;
      display: none;
    `;

    // Crea le 4 linee del crosshair
    const positions = [
      { top: '0', left: '50%', width: '2px', height: '12px', transform: 'translateX(-50%)' }, // Top
      { bottom: '0', left: '50%', width: '2px', height: '12px', transform: 'translateX(-50%)' }, // Bottom
      { left: '0', top: '50%', width: '12px', height: '2px', transform: 'translateY(-50%)' }, // Left
      { right: '0', top: '50%', width: '12px', height: '2px', transform: 'translateY(-50%)' }, // Right
    ];

    for (const pos of positions) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 1px;
        ${Object.entries(pos)
          .map(([k, v]) => `${k}: ${v};`)
          .join(' ')}
        transition: transform 0.05s ease-out;
      `;
      this.element.appendChild(line);
      this.crosshairLines.push(line);
    }

    // X rossa che appare al centro quando colpisci
    this.xMarker = document.createElement('div');
    this.xMarker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      transform: translate(-50%, -50%);
      opacity: 0;
      pointer-events: none;
    `;

    // Crea la X con due linee diagonali
    const xLine1 = document.createElement('div');
    xLine1.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 3px;
      background: #ff3333;
      transform: translateY(-50%) rotate(45deg);
      border-radius: 1.5px;
      box-shadow: 0 0 4px rgba(255, 51, 51, 0.8);
    `;

    const xLine2 = document.createElement('div');
    xLine2.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 3px;
      background: #ff3333;
      transform: translateY(-50%) rotate(-45deg);
      border-radius: 1.5px;
      box-shadow: 0 0 4px rgba(255, 51, 51, 0.8);
    `;

    this.xMarker.appendChild(xLine1);
    this.xMarker.appendChild(xLine2);
    this.element.appendChild(this.xMarker);

    document.body.appendChild(this.element);
  }

  /**
   * Attiva l'hit marker quando colpisci un nemico
   * @param playSound - Se true, dovrebbe riprodurre un suono (gestito esternamente)
   */
  trigger(playSound = true): void {
    this.state.active = true;
    this.state.life = 0;
    this.element.style.display = 'block';

    // Mostra la X rossa
    this.xMarker.style.opacity = '1';
    this.xMarker.style.transform = 'translate(-50%, -50%) scale(1.2)';

    // Espandi le linee del crosshair
    for (const line of this.crosshairLines) {
      line.style.transform = line.style.transform.replace(
        /scale\([^)]+\)/,
        ''
      );
      // Espandi le linee
      if (line.style.width === '2px') {
        // Linee verticali
        line.style.height = '18px';
      } else {
        // Linee orizzontali
        line.style.width = '18px';
      }
    }

    // Nota: il suono dovrebbe essere gestito dal chiamante usando soundManager.playHit()
    // Questo è solo un placeholder per future implementazioni
    if (playSound) {
      // Suono gestito esternamente via soundManager.playHit()
    }
  }

  /**
   * Aggiorna l'hit marker (da chiamare nel game loop)
   * @param delta - Delta time in secondi
   */
  update(delta: number): void {
    if (!this.state.active) return;

    this.state.life += delta;

    if (this.state.life >= this.state.maxLife) {
      // Resetta lo stato
      this.state.active = false;
      this.element.style.display = 'none';

      // Ripristina dimensioni linee
      for (const line of this.crosshairLines) {
        if (line.style.width === '2px') {
          line.style.height = '12px';
        } else {
          line.style.width = '12px';
        }
      }

      // Nascondi la X
      this.xMarker.style.opacity = '0';
      this.xMarker.style.transform = 'translate(-50%, -50%) scale(1)';
      return;
    }

    // Calcola progresso
    const progress = this.state.life / this.state.maxLife;

    // Scala la X (cresce poi torna normale)
    const xScale = 1.0 + Math.sin(progress * Math.PI) * 0.4;
    this.xMarker.style.transform = `translate(-50%, -50%) scale(${xScale})`;

    // Fade out della X verso la fine
    if (progress > 0.6) {
      const fadeProgress = (progress - 0.6) / 0.4;
      this.xMarker.style.opacity = (1 - fadeProgress).toString();
    }

    // Le linee tornano alla dimensione normale
    const lineScale = 1.0 - progress * 0.5;
    for (const line of this.crosshairLines) {
      if (line.style.width === '2px') {
        line.style.height = `${12 + 6 * (1 - lineScale)}px`;
      } else {
        line.style.width = `${12 + 6 * (1 - lineScale)}px`;
      }
    }
  }

  /**
   * Verifica se l'hit marker è attivo
   */
  isActive(): boolean {
    return this.state.active;
  }

  /**
   * Distrugge l'hit marker e rimuove gli elementi DOM
   */
  destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
