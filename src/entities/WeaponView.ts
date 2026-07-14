import * as THREE from 'three';

export class WeaponView {
  readonly group: THREE.Group;
  private readonly muzzleFlash: THREE.Mesh;
  private flashRemaining = 0;
  private recoil = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.group = new THREE.Group();
    this.group.position.set(0.38, -0.42, -0.95);
    this.group.rotation.set(-0.08, 0.28, -0.05);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.18, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true, metalness: 0.1, roughness: 0.8 })
    );
    body.position.set(0, 0, 0);
    this.group.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.62, 10),
      new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true, metalness: 0.35, roughness: 0.55 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.11, 0.03, -0.4);
    this.group.add(barrel);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.3, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1b, flatShading: true })
    );
    grip.position.set(-0.09, -0.18, -0.04);
    grip.rotation.z = -0.28;
    this.group.add(grip);

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.24, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5f6368, flatShading: true })
    );
    magazine.position.set(-0.03, -0.1, 0.08);
    magazine.rotation.z = 0.14;
    this.group.add(magazine);

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
  }

  fire(): void {
    this.flashRemaining = 0.06;
    this.recoil = 1;
    this.muzzleFlash.visible = true;
    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1;
  }

  update(delta: number): void {
    this.recoil = Math.max(0, this.recoil - delta * 18);
    this.group.position.set(0.38, -0.42 - this.recoil * 0.015, -0.95 + this.recoil * 0.08);
    this.group.rotation.z = -0.05 - this.recoil * 0.02;

    if (this.flashRemaining > 0) {
      this.flashRemaining -= delta;
      const flashMaterial = this.muzzleFlash.material as THREE.MeshBasicMaterial;
      flashMaterial.opacity = Math.max(0, this.flashRemaining / 0.06);
      if (this.flashRemaining <= 0) {
        this.muzzleFlash.visible = false;
      }
    }
  }

  isFlashVisible(): boolean {
    return this.muzzleFlash.visible;
  }
}
