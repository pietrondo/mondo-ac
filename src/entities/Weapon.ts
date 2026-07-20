import * as THREE from 'three';

export type WeaponType = 'rifle' | 'shotgun' | 'flamethrower' | 'grenadelauncher' | 'plasma' | 'sniper' | 'sword' | 'spear' | 'bow' | 'staff' | 'rock' | 'melee';

export interface WeaponOptions {
  onShot?: (hit: THREE.Intersection<THREE.Object3D> | undefined) => void;
  onReload?: () => void;
}

export class Weapon {
  readonly type: WeaponType;
  readonly name: string;
  readonly magazineCapacity: number;
  magazineAmmo: number;
  reserveAmmo: number;
  readonly maxReserveAmmo: number;
  readonly reloadDuration: number;
  readonly shotInterval: number;
  readonly range: number;
  readonly damage: number;
  isReloading = false;
  reloadRemaining = 0;
  shotCooldown = 0;

  private readonly onShot?: (hit: THREE.Intersection<THREE.Object3D> | undefined) => void;
  private readonly onReload?: () => void;
  private readonly raycaster = new THREE.Raycaster();

  constructor(type: WeaponType, options: WeaponOptions = {}) {
    this.type = type;
    this.onShot = options.onShot;
    this.onReload = options.onReload;

    switch (type) {
      case 'rifle':
        this.name = 'Assault Rifle';
        this.magazineCapacity = 30;
        this.maxReserveAmmo = 120;
        this.reloadDuration = 1.0;
        this.shotInterval = 60 / 600; // 0.1s
        this.range = 120;
        this.damage = 25;
        this.magazineAmmo = 30;
        this.reserveAmmo = 90;
        break;
      case 'shotgun':
        this.name = 'Shotgun';
        this.magazineCapacity = 6;
        this.maxReserveAmmo = 24;
        this.reloadDuration = 2.0;
        this.shotInterval = 0.8;
        this.range = 25;
        this.damage = 15; // per pellet
        this.magazineAmmo = 6;
        this.reserveAmmo = 12;
        break;
      case 'flamethrower':
        this.name = 'Flamethrower';
        this.magazineCapacity = 100;
        this.maxReserveAmmo = 300;
        this.reloadDuration = 2.5;
        this.shotInterval = 0.05;
        this.range = 16;
        this.damage = 8;
        this.magazineAmmo = 100;
        this.reserveAmmo = 200;
        break;
      case 'grenadelauncher':
        this.name = 'Grenade Launcher';
        this.magazineCapacity = 6;
        this.maxReserveAmmo = 30;
        this.reloadDuration = 2.4;
        this.shotInterval = 0.7;
        this.range = 60;
        this.damage = 110;
        this.magazineAmmo = 6;
        this.reserveAmmo = 18;
        break;
      case 'plasma':
        this.name = 'Heavy Plasma Cannon';
        this.magazineCapacity = 40;
        this.maxReserveAmmo = 160;
        this.reloadDuration = 1.8;
        this.shotInterval = 0.12;
        this.range = 100;
        this.damage = 38;
        this.magazineAmmo = 40;
        this.reserveAmmo = 120;
        break;
      case 'sniper':
        this.name = 'Sniper Rifle 50Cal';
        this.magazineCapacity = 5;
        this.maxReserveAmmo = 25;
        this.reloadDuration = 2.8;
        this.shotInterval = 1.2;
        this.range = 250;
        this.damage = 180;
        this.magazineAmmo = 5;
        this.reserveAmmo = 15;
        break;
      case 'sword':
        this.name = 'Longsword';
        this.magazineCapacity = 1;
        this.maxReserveAmmo = 0;
        this.reloadDuration = 0.0;
        this.shotInterval = 0.35;
        this.range = 4.2;
        this.damage = 65;
        this.magazineAmmo = 1;
        this.reserveAmmo = 0;
        break;
      case 'spear':
        this.name = 'Iron Spear';
        this.magazineCapacity = 1;
        this.maxReserveAmmo = 0;
        this.reloadDuration = 0.0;
        this.shotInterval = 0.45;
        this.range = 5.8;
        this.damage = 75;
        this.magazineAmmo = 1;
        this.reserveAmmo = 0;
        break;
      case 'bow':
        this.name = 'Hunting Bow';
        this.magazineCapacity = 12;
        this.maxReserveAmmo = 60;
        this.reloadDuration = 1.6;
        this.shotInterval = 0.55;
        this.range = 140;
        this.damage = 85;
        this.magazineAmmo = 12;
        this.reserveAmmo = 48;
        break;
      case 'staff':
        this.name = 'Arcane Staff';
        this.magazineCapacity = 20;
        this.maxReserveAmmo = 80;
        this.reloadDuration = 1.4;
        this.shotInterval = 0.22;
        this.range = 110;
        this.damage = 55;
        this.magazineAmmo = 20;
        this.reserveAmmo = 60;
        break;
      case 'rock':
        this.name = 'Thrown Rock';
        this.magazineCapacity = 15;
        this.maxReserveAmmo = 60;
        this.reloadDuration = 1.0;
        this.shotInterval = 0.3;
        this.range = 40;
        this.damage = 35;
        this.magazineAmmo = 15;
        this.reserveAmmo = 45;
        break;
      case 'melee':
      default:
        this.name = 'Knife';
        this.magazineCapacity = 1;
        this.maxReserveAmmo = 0;
        this.reloadDuration = 0.0;
        this.shotInterval = 0.4;
        this.range = 3.5;
        this.damage = 45;
        this.magazineAmmo = 1;
        this.reserveAmmo = 0;
        break;
    }
  }

  update(delta: number, input: { fireHeld: boolean; reloadPressed: boolean; canFire: boolean; camera?: THREE.Camera; targets?: THREE.Object3D[] }): void {
    this.shotCooldown = Math.max(0, this.shotCooldown - delta);

    if (this.isReloading) {
      this.reloadRemaining -= delta;
      if (this.reloadRemaining <= 1e-8) {
        this.completeReload();
      }
      return;
    }

    if ((input.reloadPressed || (input.fireHeld && this.magazineAmmo === 0)) && this.type !== 'melee' && this.magazineAmmo < this.magazineCapacity && this.reserveAmmo > 0) {
      this.isReloading = true;
      this.reloadRemaining = this.reloadDuration;
      this.onReload?.();
      return;
    }

    if (!input.fireHeld || !input.canFire || (this.type !== 'melee' && this.magazineAmmo === 0)) return;

    while (this.shotCooldown <= 1e-8 && (this.type === 'melee' || this.magazineAmmo > 0)) {
      this.fire(input.camera, input.targets);
      this.shotCooldown += this.shotInterval;
      if (this.type === 'melee') break; // only once for melee
    }

    // Auto-reload when magazine drops to 0 after firing
    if (this.type !== 'melee' && this.magazineAmmo === 0 && this.reserveAmmo > 0 && !this.isReloading) {
      this.isReloading = true;
      this.reloadRemaining = this.reloadDuration;
      this.onReload?.();
    }
  }

  private fire(camera?: THREE.Camera, targets: THREE.Object3D[] = []): void {
    if (this.type !== 'melee') {
      this.magazineAmmo -= 1;
    }

    if (this.type === 'shotgun') {
      if (camera && targets.length > 0) {
        const origin = new THREE.Vector3();
        camera.getWorldPosition(origin);

        for (let i = 0; i < 8; i++) {
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);

          direction.x += (Math.random() - 0.5) * 0.08;
          direction.y += (Math.random() - 0.5) * 0.08;
          direction.z += (Math.random() - 0.5) * 0.08;
          direction.normalize();

          this.raycaster.set(origin, direction);
          this.raycaster.far = this.range;
          for (const target of targets) target.updateWorldMatrix(true, true);
          const hit = this.raycaster.intersectObjects(targets, true)[0];
          this.onShot?.(hit);
        }
      } else {
        this.onShot?.(undefined);
      }
    } else {
      let hit: THREE.Intersection<THREE.Object3D> | undefined;
      if (camera && targets.length > 0) {
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3();
        camera.getWorldPosition(origin);
        camera.getWorldDirection(direction);
        this.raycaster.set(origin, direction);
        this.raycaster.far = this.range;
        for (const target of targets) target.updateWorldMatrix(true, true);
        hit = this.raycaster.intersectObjects(targets, true)[0];
      }
      this.onShot?.(hit);
    }
  }

  private completeReload(): void {
    const transferred = Math.min(this.magazineCapacity - this.magazineAmmo, this.reserveAmmo);
    this.magazineAmmo += transferred;
    this.reserveAmmo -= transferred;
    this.isReloading = false;
    this.reloadRemaining = 0;
  }
}
