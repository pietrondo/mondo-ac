import * as THREE from 'three';

export class WeaponView {
  readonly group: THREE.Group;
  private readonly muzzleFlash: THREE.Mesh;
  private flashRemaining = 0;
  private recoil = 0;

  private rifleModel!: THREE.Group;
  private shotgunModel!: THREE.Group;
  private knifeModel!: THREE.Group;
  private activeType: 'rifle' | 'shotgun' | 'melee' = 'rifle';

  constructor(camera: THREE.PerspectiveCamera) {
    this.group = new THREE.Group();
    this.group.position.set(0.38, -0.42, -0.95);
    this.group.rotation.set(-0.08, 0.28, -0.05);

    this.createRifleModel();
    this.createShotgunModel();
    this.createKnifeModel();

    // Muzzle flash
    const muzzleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffeb3b,
      transparent: true,
      opacity: 0.0,
    });
    this.muzzleFlash = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 6), muzzleMaterial);
    this.muzzleFlash.rotation.z = Math.PI / 2;
    this.muzzleFlash.position.set(0.42, 0.02, -0.44);
    this.muzzleFlash.visible = false;
    this.group.add(this.muzzleFlash);

    camera.add(this.group);
    this.setWeapon('rifle');
  }

  private createRifleModel(): void {
    this.rifleModel = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.18, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true, metalness: 0.1, roughness: 0.8 })
    );
    this.rifleModel.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.62, 10),
      new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true, metalness: 0.35, roughness: 0.55 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.11, 0.03, -0.4);
    this.rifleModel.add(barrel);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.3, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1b, flatShading: true })
    );
    grip.position.set(-0.09, -0.18, -0.04);
    grip.rotation.z = -0.28;
    this.rifleModel.add(grip);

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.24, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5f6368, flatShading: true })
    );
    magazine.position.set(-0.03, -0.1, 0.08);
    magazine.rotation.z = 0.14;
    this.rifleModel.add(magazine);

    this.group.add(this.rifleModel);
  }

  private createShotgunModel(): void {
    this.shotgunModel = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.22, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true })
    );
    this.shotgunModel.add(body);

    const barrelLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.58, 8),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true, metalness: 0.6, roughness: 0.4 })
    );
    barrelLeft.rotation.z = Math.PI / 2;
    barrelLeft.position.set(0.15, 0.04, -0.12);
    this.shotgunModel.add(barrelLeft);

    const barrelRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.58, 8),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true, metalness: 0.6, roughness: 0.4 })
    );
    barrelRight.rotation.z = Math.PI / 2;
    barrelRight.position.set(0.15, 0.04, 0.12);
    this.shotgunModel.add(barrelRight);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.22, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true })
    );
    grip.position.set(-0.16, -0.16, 0);
    grip.rotation.z = -0.35;
    this.shotgunModel.add(grip);

    this.group.add(this.shotgunModel);
  }

  private createKnifeModel(): void {
    this.knifeModel = new THREE.Group();

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1, flatShading: true })
    );
    blade.position.set(0.05, 0.05, -0.25);
    blade.rotation.y = 0.08;
    this.knifeModel.add(blade);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.03, 0.03, -0.05);
    this.knifeModel.add(handle);

    this.group.add(this.knifeModel);
  }

  setWeapon(type: 'rifle' | 'shotgun' | 'melee'): void {
    this.activeType = type;
    this.rifleModel.visible = (type === 'rifle');
    this.shotgunModel.visible = (type === 'shotgun');
    this.knifeModel.visible = (type === 'melee');

    if (type === 'melee') {
      this.group.position.set(0.28, -0.48, -0.75);
      this.group.rotation.set(0.4, 0.1, -0.2);
    } else if (type === 'shotgun') {
      this.group.position.set(0.35, -0.44, -0.85);
      this.group.rotation.set(-0.06, 0.24, -0.04);
      this.muzzleFlash.position.set(0.44, 0.04, -0.41);
    } else {
      this.group.position.set(0.38, -0.42, -0.95);
      this.group.rotation.set(-0.08, 0.28, -0.05);
      this.muzzleFlash.position.set(0.42, 0.02, -0.44);
    }
  }

  fire(): void {
    if (this.activeType === 'melee') {
      this.recoil = 1.5;
    } else {
      this.flashRemaining = 0.06;
      this.recoil = 1.0;
      this.muzzleFlash.visible = true;
      (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1;
    }
  }

  update(delta: number): void {
    if (this.activeType === 'melee') {
      this.recoil = Math.max(0, this.recoil - delta * 12);
      this.group.position.set(
        0.28,
        -0.48 + this.recoil * 0.1,
        -0.75 - this.recoil * 0.2
      );
      this.group.rotation.set(
        0.4 + this.recoil * 0.2,
        0.1 - this.recoil * 0.1,
        -0.2
      );
    } else {
      this.recoil = Math.max(0, this.recoil - delta * 18);
      const basePos = this.activeType === 'shotgun' ? [0.35, -0.44, -0.85] : [0.38, -0.42, -0.95];
      const baseRotZ = this.activeType === 'shotgun' ? -0.04 : -0.05;

      this.group.position.set(
        basePos[0],
        basePos[1] - this.recoil * 0.02,
        basePos[2] + this.recoil * (this.activeType === 'shotgun' ? 0.14 : 0.08)
      );
      this.group.rotation.z = baseRotZ - this.recoil * 0.02;

      if (this.flashRemaining > 0) {
        this.flashRemaining -= delta;
        const flashMaterial = this.muzzleFlash.material as THREE.MeshBasicMaterial;
        flashMaterial.opacity = Math.max(0, this.flashRemaining / 0.06);
        if (this.flashRemaining <= 0) {
          this.muzzleFlash.visible = false;
        }
      }
    }
  }

  isFlashVisible(): boolean {
    return this.muzzleFlash.visible;
  }
}
