import * as THREE from 'three';

interface DamageNumberInstance {
  value: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: string;
  isCritical: boolean;
  element: HTMLDivElement | null;
}

export class DamageNumber {
  private instances: DamageNumberInstance[] = [];
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Mostra un numero di danno in posizione 3D
   * @param damage - Valore del danno da mostrare
   * @param position - Posizione 3D nel mondo
   * @param isCritical - Se true, usa colore giallo e dimensione maggiore
   * @param isHeavy - Se true (e non critico), usa colore rosso
   */
  show(
    damage: number,
    position: THREE.Vector3,
    isCritical = false,
    isHeavy = false
  ): void {
    // Determina colore: bianco (normale), giallo (critico), rosso (pesante)
    let color = '#ffffff';
    if (isCritical) {
      color = '#ffdd00'; // Giallo per critico
    } else if (isHeavy) {
      color = '#ff4444'; // Rosso per danno pesante
    }

    const instance: DamageNumberInstance = {
      value: Math.round(damage),
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        1.5,
        0
      ),
      life: 0,
      maxLife: 1.0, // 1 secondo
      color,
      isCritical,
      element: null,
    };

    // Crea elemento DOM
    const el = document.createElement('div');
    el.textContent = instance.value.toString();
    el.style.cssText = `
      position: absolute;
      color: ${color};
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 900;
      font-size: ${isCritical ? '28px' : '22px'};
      text-shadow:
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        2px 2px 0 #000,
        0 0 4px rgba(0,0,0,0.8);
      pointer-events: none;
      user-select: none;
      transform: translate(-50%, -50%);
      white-space: nowrap;
    `;

    this.container.appendChild(el);
    instance.element = el;
    this.instances.push(instance);
  }

  /**
   * Aggiorna tutti i damage numbers (da chiamare nel game loop)
   * @param delta - Delta time in secondi
   * @param camera - Camera per la proiezione 3D -> 2D
   */
  update(delta: number, camera: THREE.Camera): void {
    // Rimuovi istanze scadute
    this.instances = this.instances.filter((instance) => {
      instance.life += delta;

      if (instance.life >= instance.maxLife) {
        // Rimuovi elemento DOM
        if (instance.element && instance.element.parentNode) {
          instance.element.parentNode.removeChild(instance.element);
        }
        return false;
      }

      // Aggiorna posizione
      instance.position.addScaledVector(instance.velocity, delta);
      instance.velocity.y += delta * 2.0; // Accelerazione verso l'alto ridotta

      // Calcola alpha (fade out)
      const progress = instance.life / instance.maxLife;
      const alpha = 1.0 - Math.pow(progress, 2); // Fade out quadratico

      // Scala: cresce all'inizio, poi si stabilizza
      const scale = instance.isCritical
        ? 1.0 + Math.sin(progress * Math.PI) * 0.3
        : 1.0;

      // Proietta posizione 3D su schermo 2D
      const projected = instance.position.clone();
      projected.project(camera);

      // Verifica se il punto è davanti alla camera
      if (projected.z > 1) {
        if (instance.element) {
          instance.element.style.opacity = '0';
        }
        return true;
      }

      // Converti in coordinate schermo
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      // Aggiorna stile elemento
      if (instance.element) {
        instance.element.style.left = `${x}px`;
        instance.element.style.top = `${y}px`;
        instance.element.style.opacity = alpha.toString();
        instance.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      return true;
    });
  }

  /**
   * Pulisce tutte le istanze attive
   */
  clear(): void {
    for (const instance of this.instances) {
      if (instance.element && instance.element.parentNode) {
        instance.element.parentNode.removeChild(instance.element);
      }
    }
    this.instances = [];
  }

  /**
   * Distrugge il sistema e rimuove il container
   */
  destroy(): void {
    this.clear();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
