import * as THREE from 'three';
import { disposeObject3D, markSharedMaterial, markSharedGeometry } from '../utils/dispose';

export class Collectible {
  mesh: THREE.Mesh;
  readonly type: 'coin' | 'crystal' | 'potion' | 'ammo' | 'boss_chest';
  private bobOffset = Math.random() * Math.PI * 2;
  private value: number;

  private static readonly geoCoin = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
  private static readonly geoCrystal = new THREE.OctahedronGeometry(0.4);
  private static readonly geoPotion = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
  private static readonly geoAmmo = new THREE.BoxGeometry(0.45, 0.35, 0.5);
  private static readonly geoChest = new THREE.BoxGeometry(0.8, 0.6, 0.6);

  private static readonly matCoin = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.3, flatShading: true });
  private static readonly matCrystal = new THREE.MeshStandardMaterial({ color: 0x00BCD4, emissive: 0x00BCD4, emissiveIntensity: 0.3, flatShading: true });
  private static readonly matPotion = new THREE.MeshStandardMaterial({ color: 0xE91E63, emissive: 0xE91E63, emissiveIntensity: 0.3, flatShading: true });
  private static readonly matAmmo = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00E5FF, emissiveIntensity: 0.3, flatShading: true });
  private static readonly matChest = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.6, flatShading: true });

  static {
    markSharedGeometry(Collectible.geoCoin);
    markSharedGeometry(Collectible.geoCrystal);
    markSharedGeometry(Collectible.geoPotion);
    markSharedGeometry(Collectible.geoAmmo);
    markSharedGeometry(Collectible.geoChest);
    markSharedMaterial(Collectible.matCoin);
    markSharedMaterial(Collectible.matCrystal);
    markSharedMaterial(Collectible.matPotion);
    markSharedMaterial(Collectible.matAmmo);
    markSharedMaterial(Collectible.matChest);
  }

  constructor(position: THREE.Vector3, type: 'coin' | 'crystal' | 'potion' | 'ammo' | 'boss_chest' = 'coin') {
    this.type = type;
    this.value = type === 'coin' ? 1 : type === 'crystal' ? 5 : type === 'potion' ? 10 : type === 'ammo' ? 15 : 50;
    this.type = type;
    this.value = type === 'coin' ? 1 : type === 'crystal' ? 5 : type === 'potion' ? 10 : type === 'ammo' ? 15 : 50;

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (type) {
      case 'coin':
        geometry = Collectible.geoCoin;
        material = Collectible.matCoin;
        break;
      case 'crystal':
        geometry = Collectible.geoCrystal;
        material = Collectible.matCrystal;
        break;
      case 'potion':
        geometry = Collectible.geoPotion;
        material = Collectible.matPotion;
        break;
      case 'ammo':
        geometry = Collectible.geoAmmo;
        material = Collectible.matAmmo;
        break;
      case 'boss_chest':
        geometry = Collectible.geoChest;
        material = Collectible.matChest;
        break;
      default:
        geometry = Collectible.geoAmmo;
        material = Collectible.matAmmo;
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.position.y += 0.5;
  }

  update(time: number): void {
    this.mesh.position.y += Math.sin(time * 3 + this.bobOffset) * 0.005;
    this.mesh.rotation.y += 0.02;
  }

  collect(): number {
    this.mesh.visible = false;
    return this.value;
  }

  isVisible(): boolean {
    return this.mesh.visible;
  }

  dispose(): void {
    disposeObject3D(this.mesh);
  }
}
