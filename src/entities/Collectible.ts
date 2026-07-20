import * as THREE from 'three';

export class Collectible {
  mesh: THREE.Mesh;
  private bobOffset = Math.random() * Math.PI * 2;
  private value: number;

  constructor(position: THREE.Vector3, type: 'coin' | 'crystal' | 'potion' | 'boss_chest' = 'coin') {
    this.value = type === 'coin' ? 1 : type === 'crystal' ? 5 : type === 'potion' ? 10 : 50;

    let geometry: THREE.BufferGeometry;
    let color: number;

    switch (type) {
      case 'coin':
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        color = 0xFFD700;
        break;
      case 'crystal':
        geometry = new THREE.OctahedronGeometry(0.4);
        color = 0x00BCD4;
        break;
      case 'potion':
        geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
        color = 0xE91E63;
        break;
      case 'boss_chest':
        geometry = new THREE.BoxGeometry(0.8, 0.6, 0.6);
        color = 0xFFD700;
        break;
      default:
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        color = 0xFFFFFF;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: type === 'boss_chest' ? 0.6 : 0.3,
      flatShading: true
    });

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
}
