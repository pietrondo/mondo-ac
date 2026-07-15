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
  size: number;
}

export class EnemyProjectileSystem {
  private readonly scene: THREE.Scene;
  private readonly projectiles: ActiveProjectile[] = [];
  private readonly projectileGeometry: THREE.SphereGeometry;
  private readonly projectileMaterial: THREE.MeshBasicMaterial;
  private readonly defaultSpeed: number;
  private readonly defaultDamage: number;
  private readonly defaultSize: number;
  private readonly defaultColor: number;

  // Cache materials by color to avoid continuous cloning
  private readonly materialsByColor = new Map<number, THREE.MeshBasicMaterial>();

  // Object pool for projectile meshes
  private readonly pool: THREE.Mesh[] = [];
  private readonly poolSize = 32;

  constructor(scene: THREE.Scene, options: EnemyProjectileOptions = {}) {
    this.scene = scene;
    this.defaultSpeed = options.speed ?? 25;
    this.defaultDamage = options.damage ?? 15;
    this.defaultSize = options.size ?? 0.15;
    this.defaultColor = options.color ?? 0xff3333;

    this.projectileGeometry = new THREE.SphereGeometry(this.defaultSize, 8, 8);
    this.projectileMaterial = new THREE.MeshBasicMaterial({
      color: this.defaultColor,
      transparent: true,
      opacity: 0.9,
    });

    // Cache the default material
    this.materialsByColor.set(this.defaultColor, this.projectileMaterial);

    // Pre-allocate mesh pool
    for (let i = 0; i < this.poolSize; i++) {
      const mesh = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial);
      mesh.visible = false;
      this.pool.push(mesh);
    }
  }

  private getMaterial(colorHex: number): THREE.MeshBasicMaterial {
    let mat = this.materialsByColor.get(colorHex);
    if (!mat) {
      mat = this.projectileMaterial.clone();
      mat.color.setHex(colorHex);
      this.materialsByColor.set(colorHex, mat);
    }
    return mat;
  }

  spawn(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    options?: Partial<EnemyProjectileOptions>
  ): void {
    const speed = options?.speed ?? this.defaultSpeed;
    const damage = options?.damage ?? this.defaultDamage;
    const size = options?.size ?? this.defaultSize;
    const color = options?.color ?? this.defaultColor;

    // Find an idle mesh in the pool
    let mesh: THREE.Mesh | undefined;
    for (const item of this.pool) {
      if (!item.visible) {
        mesh = item;
        break;
      }
    }

    // Fallback: reuse the oldest active projectile if pool is empty
    if (!mesh) {
      if (this.projectiles.length > 0) {
        const oldest = this.projectiles.shift()!;
        mesh = oldest.mesh;
        this.scene.remove(mesh);
      } else {
        return;
      }
    }

    // Update material, scale, position
    mesh.material = this.getMaterial(color);
    mesh.scale.setScalar(size / this.defaultSize);
    mesh.position.copy(origin);
    mesh.visible = true;

    // Add to scene
    this.scene.add(mesh);

    const velocity = direction.clone().normalize().multiplyScalar(speed);

    this.projectiles.push({
      mesh,
      velocity,
      damage,
      remainingLife: 3.0,
      maxLife: 3.0,
      size,
    });
  }

  update(
    delta: number,
    heightMap: HeightMap,
    playerPos: THREE.Vector3,
    playerRadius: number = 0.5
  ): { hit: boolean; damage: number } {
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
      if (distToPlayer < playerRadius + proj.size) {
        hitResult = { hit: true, damage: proj.damage };
        this.removeProjectile(i);
        continue;
      }
    }

    return hitResult;
  }

  private removeProjectile(index: number): void {
    const proj = this.projectiles[index];
    proj.mesh.visible = false;
    this.scene.remove(proj.mesh);
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
