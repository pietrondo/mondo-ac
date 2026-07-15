import * as THREE from 'three';

export interface RifleUpdateInput {
  fireHeld: boolean;
  reloadPressed: boolean;
  canFire: boolean;
  camera?: THREE.Camera;
  targets?: THREE.Object3D[];
}

export interface AutomaticRifleOptions {
  magazineAmmo?: number;
  reserveAmmo?: number;
  roundsPerMinute?: number;
  reloadDuration?: number;
  onShot?: (hit: THREE.Intersection<THREE.Object3D> | undefined) => void;
  onReload?: () => void;
}

export class AutomaticRifle {
  readonly magazineCapacity = 30;
  magazineAmmo: number;
  reserveAmmo: number;
  isReloading = false;

  private readonly shotInterval: number;
  private readonly reloadDuration: number;
  private readonly onShot?: (hit: THREE.Intersection<THREE.Object3D> | undefined) => void;
  private readonly onReload?: () => void;
  private readonly raycaster = new THREE.Raycaster();
  private shotCooldown = 0;
  private reloadRemaining = 0;

  constructor(options: AutomaticRifleOptions = {}) {
    this.magazineAmmo = options.magazineAmmo ?? this.magazineCapacity;
    this.reserveAmmo = options.reserveAmmo ?? 90;
    this.shotInterval = 60 / (options.roundsPerMinute ?? 600);
    this.reloadDuration = options.reloadDuration ?? 1;
    this.onShot = options.onShot;
    this.onReload = options.onReload;
  }

  update(delta: number, input: RifleUpdateInput): void {
    this.shotCooldown = Math.max(0, this.shotCooldown - delta);

    if (this.isReloading) {
      this.reloadRemaining -= delta;
      if (this.reloadRemaining <= 1e-8) this.completeReload();
      return;
    }

    if (input.reloadPressed && this.magazineAmmo < this.magazineCapacity && this.reserveAmmo > 0) {
      this.isReloading = true;
      this.reloadRemaining = this.reloadDuration;
      this.onReload?.();
      return;
    }

    if (!input.fireHeld || !input.canFire || this.magazineAmmo === 0) return;

    while (this.shotCooldown <= 1e-8 && this.magazineAmmo > 0) {
      this.fire(input.camera, input.targets);
      this.shotCooldown += this.shotInterval;
    }
  }

  private fire(camera?: THREE.Camera, targets: THREE.Object3D[] = []): void {
    this.magazineAmmo -= 1;

    let hit: THREE.Intersection<THREE.Object3D> | undefined;
    if (camera && targets.length > 0) {
      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3();
      camera.getWorldPosition(origin);
      camera.getWorldDirection(direction);
      this.raycaster.set(origin, direction);
      for (const target of targets) target.updateWorldMatrix(true, true);
      hit = this.raycaster.intersectObjects(targets, true)[0];
    }

    this.onShot?.(hit);
  }

  private completeReload(): void {
    const transferred = Math.min(this.magazineCapacity - this.magazineAmmo, this.reserveAmmo);
    this.magazineAmmo += transferred;
    this.reserveAmmo -= transferred;
    this.isReloading = false;
    this.reloadRemaining = 0;
  }
}
