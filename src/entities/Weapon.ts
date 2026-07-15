import * as THREE from 'three';

export type WeaponType = 'rifle' | 'shotgun' | 'melee';

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

    if (input.reloadPressed && this.type !== 'melee' && this.magazineAmmo < this.magazineCapacity && this.reserveAmmo > 0) {
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
