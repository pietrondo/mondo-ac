import { HUD } from './hud';
import { WeaponType } from '../entities/Weapon';
import { requestPointerLockSafe } from '../controls/pointerLock';

export interface ShopItem {
  id: WeaponType | 'health_potion' | 'max_ammo';
  name: string;
  category: 'weapon' | 'consumable';
  price: number;
  description: string;
  icon: string;
}

export class ShopUI {
  private element: HTMLElement;
  private isVisible = false;
  private hud: HUD;
  private onBuyWeapon: (type: WeaponType) => void;
  private onBuyHealth: (amount: number) => void;
  private onBuyAmmo: () => void;

  private items: ShopItem[] = [
    {
      id: 'sniper',
      name: 'Sniper Rifle 50Cal',
      category: 'weapon',
      price: 120,
      description: 'Fucile ad alta precisione con danni devastanti a lunghissima distanza.',
      icon: '🎯',
    },
    {
      id: 'flamethrower',
      name: 'Lanciafiamme Vulcano',
      category: 'weapon',
      price: 150,
      description: 'Proietta un cono continuo di fuoco per incenerire orde di nemici.',
      icon: '🔥',
    },
    {
      id: 'plasma',
      name: 'Heavy Plasma Cannon',
      category: 'weapon',
      price: 180,
      description: 'Spara sfere ad energia al plasma che perforano le corazze dei Golem.',
      icon: '⚡',
    },
    {
      id: 'sword',
      name: 'Spada Lunare',
      category: 'weapon',
      price: 50,
      description: 'Lama d\'acciaio da mischia con elevata cadenza di colpi ravvicinati.',
      icon: '🗡️',
    },
    {
      id: 'health_potion',
      name: 'Elisir di Rigenerazione (+50 HP)',
      category: 'consumable',
      price: 30,
      description: 'Ristora immediatamente 50 punti salute del personaggio.',
      icon: '🧪',
    },
    {
      id: 'max_ammo',
      name: 'Rifornimento Munizioni Max',
      category: 'consumable',
      price: 20,
      description: 'Ricarica al massimo la scorta di munizioni di tutte le armi nell\'arsenale.',
      icon: '📦',
    },
  ];

  constructor(
    hud: HUD,
    callbacks: {
      onBuyWeapon: (type: WeaponType) => void;
      onBuyHealth: (amount: number) => void;
      onBuyAmmo: () => void;
    }
  ) {
    this.hud = hud;
    this.onBuyWeapon = callbacks.onBuyWeapon;
    this.onBuyHealth = callbacks.onBuyHealth;
    this.onBuyAmmo = callbacks.onBuyAmmo;

    this.element = document.createElement('div');
    this.element.id = 'shop-modal-overlay';
    this.element.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 15, 30, 0.85);
      backdrop-filter: blur(10px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1200;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    document.body.appendChild(this.element);
    this.render();
  }

  show(): void {
    this.isVisible = true;
    this.element.style.display = 'flex';
    this.render();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
    requestPointerLockSafe(document.body);
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }

  private render(): void {
    const currentCoins = this.hud.getCoins();

    let itemsHtml = '';
    for (const item of this.items) {
      const canAfford = currentCoins >= item.price;
      itemsHtml += `
        <div style="
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid ${canAfford ? '#38bdf8' : '#64748b'};
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        ">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 32px; background: rgba(15, 23, 42, 0.6); padding: 8px 12px; border-radius: 8px;">${item.icon}</div>
            <div>
              <div style="color: #f8fafc; font-weight: bold; font-size: 16px;">${item.name}</div>
              <div style="color: #94a3b8; font-size: 13px; margin-top: 2px; max-width: 320px;">${item.description}</div>
            </div>
          </div>
          <button data-id="${item.id}" class="shop-buy-btn" style="
            background: ${canAfford ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#475569'};
            color: #ffffff;
            border: none;
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: bold;
            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            transition: all 0.2s ease;
          ">
            ${item.price} 💰 Acquista
          </button>
        </div>
      `;
    }

    this.element.innerHTML = `
      <div style="
        background: #0f172a;
        border: 2px solid #0284c7;
        border-radius: 18px;
        width: 580px;
        max-width: 90vw;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
        color: #f8fafc;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <h2 style="margin: 0; font-size: 22px; color: #38bdf8;">🛒 Armeria del Mercante</h2>
            <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Acquista provviste ed armi leggendarie</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #fbbf24; padding: 6px 14px; border-radius: 20px; font-weight: bold; color: #fbbf24; font-size: 16px;">
            💰 ${currentCoins} Monete
          </div>
        </div>

        <div style="max-height: 380px; overflow-y: auto; padding-right: 6px;">
          ${itemsHtml}
        </div>

        <div style="margin-top: 18px; text-align: right;">
          <button id="shop-close-btn" style="
            background: #dc2626;
            color: #ffffff;
            border: none;
            padding: 10px 22px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          ">Chiudi Negozio</button>
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('#shop-close-btn');
    if (closeBtn) {
      (closeBtn as HTMLElement).onclick = () => this.hide();
    }

    const buyBtns = this.element.querySelectorAll('.shop-buy-btn');
    buyBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const itemId = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (!itemId) return;
        const shopItem = this.items.find(i => i.id === itemId);
        if (!shopItem) return;

        if (this.hud.getCoins() >= shopItem.price) {
          this.hud.addCoins(-shopItem.price);

          if (shopItem.id === 'health_potion') {
            this.onBuyHealth(50);
          } else if (shopItem.id === 'max_ammo') {
            this.onBuyAmmo();
          } else {
            this.onBuyWeapon(shopItem.id as WeaponType);
          }

          this.hud.showLoreNotification(`Acquistato: ${shopItem.name}`, 'Armeria');
          this.render();
        }
      });
    });
  }
}
