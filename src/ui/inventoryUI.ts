import { requestPointerLockSafe } from '../controls/pointerLock';

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  icon: string;
  category: 'weapon' | 'consumable' | 'relic';
  description: string;
}

export class InventoryUI {
  private container: HTMLDivElement;
  private isVisible = false;
  private items: Map<string, InventoryItem> = new Map();
  private onEquipWeaponCallback?: (weaponId: string) => void;
  private onUseConsumableCallback?: (itemId: string) => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 620px;
      max-width: 92vw;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 2px solid rgba(56, 189, 248, 0.4);
      border-radius: 16px;
      padding: 24px;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 250;
      display: none;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      user-select: none;
    `;

    // Default starting inventory
    this.addItem({
      id: 'potion',
      name: 'Pozione della Vita',
      count: 3,
      icon: '🧪',
      category: 'consumable',
      description: 'Ripristina +50 Salute.'
    });
    this.addItem({
      id: 'relic_titan',
      name: 'Stemma del Titano',
      count: 1,
      icon: '👑',
      category: 'relic',
      description: 'Antico artefatto trovato nelle rovine.'
    });

    document.body.appendChild(this.container);
  }

  setOnEquipWeapon(cb: (weaponId: string) => void): void {
    this.onEquipWeaponCallback = cb;
  }

  setOnUseConsumable(cb: (itemId: string) => void): void {
    this.onUseConsumableCallback = cb;
  }

  addItem(item: InventoryItem): void {
    if (this.items.has(item.id)) {
      const existing = this.items.get(item.id)!;
      existing.count += item.count;
    } else {
      this.items.set(item.id, { ...item });
    }
    if (this.isVisible) this.render();
  }

  useItem(id: string): void {
    const item = this.items.get(id);
    if (!item || item.count <= 0) return;

    if (item.category === 'consumable') {
      item.count--;
      if (item.count <= 0) {
        this.items.delete(id);
      }
      this.onUseConsumableCallback?.(id);
    } else if (item.category === 'weapon') {
      this.onEquipWeaponCallback?.(id);
    }
    this.render();
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    try { document.exitPointerLock(); } catch (_) {}
    this.isVisible = true;
    this.render();
    this.container.style.display = 'block';
  }

  hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
    requestPointerLockSafe(document.body);
  }

  isOpen(): boolean {
    return this.isVisible;
  }

  private render(): void {
    const itemsList = Array.from(this.items.values());
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
        <h2 style="margin: 0; color: #38bdf8; font-size: 22px; display: flex; align-items: center; gap: 10px;">
          🎒 INVENTARIO E CASSE DEL TESORO
        </h2>
        <button id="inv-close-btn" style="background: rgba(255,255,255,0.1); border: none; color: #94a3b8; font-size: 18px; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; transition: all 0.2s;">✕</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 14px; max-height: 360px; overflow-y: auto; padding-right: 6px;">
        ${itemsList.length === 0 ? '<div style="grid-column: 1/-1; color: #64748b; text-align: center; padding: 30px;">Inventario Vuoto</div>' : ''}
        ${itemsList.map(item => `
          <div class="inv-item-card" data-id="${item.id}" style="background: rgba(30, 41, 59, 0.8); border: 1.5px solid ${item.category === 'relic' ? '#fbbf24' : item.category === 'weapon' ? '#38bdf8' : '#4ade80'}; border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; transition: transform 0.15s, border-color 0.15s; position: relative;">
            <div style="font-size: 28px; margin-bottom: 6px;">${item.icon}</div>
            <div style="font-weight: bold; font-size: 13px; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">x${item.count}</div>
            ${item.category === 'consumable' ? '<div style="margin-top: 6px; font-size: 10px; background: #22c55e; color: black; font-weight: bold; padding: 2px 6px; border-radius: 4px;">USA [CLICK]</div>' : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 20px; text-align: center; color: #64748b; font-size: 12px;">
        Premi <kbd style="background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; color: white;">[I]</kbd> per aprire/chiudere l'inventario in qualsiasi momento.
      </div>
    `;

    const closeBtn = this.container.querySelector('#inv-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const cards = this.container.querySelectorAll('.inv-item-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (id) this.useItem(id);
      });
    });
  }
}
