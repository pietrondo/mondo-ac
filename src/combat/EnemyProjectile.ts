import * as THREE from 'three';
import { WORLD_SCALE } from '../config';
import { HeightMap } from '../world/heightmap';

export interface EnemyProjectileOptions {
  speed?: number;
  damage?: number;
  color?: number;
  size?: number;
}

interface ActiveProjectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  remainingLife: number;
  maxLife: number;
}

export class EnemyProjectileSystem {
  private readonly scene: THREE.Scene;
  private readonly projectiles: ActiveProjectile[] = [];
  private readonly projectileGeometry: THREE.SphereGeometry;
  private readonly projectileMaterial: THREE.MeshBasicMaterial;
  private readonly defaultSpeed: number;
  private readonly defaultDamage: number;
  private readonly defaultSize: number;

  constructor(scene: THREE.Scene, options: EnemyProjectileOptions = {}) {
    this.scene = scene;
    this.defaultSpeed = options.speed ?? 25;
    this.defaultDamage = options.damage ?? 15;
    this.defaultSize = options.size ?? 0.15;
    const color = options.color ?? 0xff3333;

    this.projectileGeometry = new THREE.SphereGeometry(this.defaultSize, 8, 8);
    this.projectileMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });
  }

  spawn(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    options?: Partial<EnemyProjectileOptions>
  ): void {
    const speed = options?.speed ?? this.defaultSpeed;
    const damage = options?.damage ?? this.defaultDamage;
    const size = options?.size ?? this.defaultSize;

    const mesh = new THREE.Mesh(
      size !== this.defaultSize
        ? new THREE.SphereGeometry(size, 8, 8)
        : this.projectileGeometry,
      this.projectileMaterial.clone()
    );

    mesh.position.copy(origin);
    this.scene.add(mesh);

    const velocity = direction.clone().normalize().multiplyScalar(speed);

    this.projectiles.push({
      mesh,
      velocity,
      damage,
      remainingLife: 3.0,
      maxLife: 3.0,
    });
  }

  update(delta: number, heightMap: HeightMap, playerPos: THREE.Vector3, playerRadius: number = 0.5): { hit: boolean; damage: number } {
    let hitResult = { hit: false, damage: 0 };

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      proj.remainingLife -= delta;

      if (proj.remainingLife <= 0) {
        this.removeProjectile(i);
        continue;
      }

      proj.mesh.position.addScaledVector(proj.velocity, delta);

      const opacity = Math.max(0.3, proj.remainingLife / proj.maxLife);
      (proj.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      const hx = (proj.mesh.position.x / WORLD_SCALE) + 128;
      const hz = (proj.mesh.position.z / WORLD_SCALE) + 128;
      const groundHeight = heightMap.getInterpolated(hx, hz);

      if (proj.mesh.position.y < groundHeight) {
        this.removeProjectile(i);
        continue;
      }

      const distToPlayer = proj.mesh.position.distanceTo(playerPos);
      if (distToPlayer < playerRadius + this.defaultSize) {
        hitResult = { hit: true, damage: proj.damage };
        this.removeProjectile(i);
        continue;
      }
    }

    return hitResult;
  }

  private removeProjectile(index: number): void {
    const proj = this.projectiles[index];
    this.scene.remove(proj.mesh);
    proj.mesh.geometry.dispose();
    (proj.mesh.material as THREE.MeshBasicMaterial).dispose();
    this.projectiles.splice(index, 1);
  }

  clear(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.removeProjectile(i);
    }
  }

  getProjectileCount(): number {
    return this.projectiles.length;
  }
}
