import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE } from '../config';

export interface Particle {
  mesh: THREE.Mesh;
  type: 'spark' | 'blood' | 'shell';
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticlePool {
  private particles: Particle[] = [];
  private maxCapacity: number;
  private scene: THREE.Scene;

  private sparkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  private bloodGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  private shellGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6);

  constructor(scene: THREE.Scene, maxCapacity: number = 300) {
    this.scene = scene;
    this.maxCapacity = maxCapacity;
  }

  private createMesh(type: 'spark' | 'blood' | 'shell'): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    let mat: THREE.Material;

    if (type === 'spark') {
      geo = this.sparkGeo;
      mat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 1.0,
      });
    } else if (type === 'blood') {
      geo = this.bloodGeo;
      mat = new THREE.MeshBasicMaterial({
        color: 0x990000,
        transparent: true,
        opacity: 1.0,
      });
    } else {
      geo = this.shellGeo;
      mat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // brass/gold
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0,
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  spawn(
    type: 'spark' | 'blood' | 'shell',
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    maxLife: number = 1.0
  ): Particle {
    // 1. Find inactive particle of same type
    let p = this.particles.find(part => !part.active && part.type === type);

    // 2. Create if capacity allows
    if (!p && this.particles.length < this.maxCapacity) {
      const mesh = this.createMesh(type);
      p = {
        mesh,
        type,
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        rotationVelocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
      };
      this.particles.push(p);
    }

    // 3. Recycle oldest active particle of same type if possible, or any type
    if (!p) {
      let oldestSameType: Particle | null = null;
      let minLifeSame = Infinity;
      for (const part of this.particles) {
        if (part.active && part.type === type && part.life < minLifeSame) {
          minLifeSame = part.life;
          oldestSameType = part;
        }
      }

      if (oldestSameType) {
        p = oldestSameType;
      } else {
        let oldestAny: Particle | null = null;
        let minLifeAny = Infinity;
        for (const part of this.particles) {
          if (part.active && part.life < minLifeAny) {
            minLifeAny = part.life;
            oldestAny = part;
          }
        }
        if (oldestAny) {
          p = oldestAny;
          p.type = type;
          if (type === 'spark') {
            p.mesh.geometry = this.sparkGeo;
            p.mesh.material = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1.0 });
          } else if (type === 'blood') {
            p.mesh.geometry = this.bloodGeo;
            p.mesh.material = new THREE.MeshBasicMaterial({ color: 0x990000, transparent: true, opacity: 1.0 });
          } else {
            p.mesh.geometry = this.shellGeo;
            p.mesh.material = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 1.0 });
          }
        }
      }
    }

    if (p) {
      p.active = true;
      p.life = maxLife;
      p.maxLife = maxLife;
      p.position.copy(position);
      p.velocity.copy(velocity);

      if (type === 'shell') {
        p.rotationVelocity.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );
        p.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      } else {
        p.rotationVelocity.set(0, 0, 0);
        p.mesh.rotation.set(0, 0, 0);
      }

      p.mesh.position.copy(p.position);
      p.mesh.visible = true;
      p.mesh.scale.set(1, 1, 1);
      if (p.mesh.material) {
        (p.mesh.material as any).opacity = 1.0;
      }
    }

    return p!;
  }

  update(delta: number, heightMap: HeightMap): void {
    const gravity = -9.81;

    for (const p of this.particles) {
      if (!p.active) continue;

      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      let pGravity = gravity;
      if (p.type === 'spark') {
        pGravity = -4.0;
      } else if (p.type === 'blood') {
        pGravity = -6.0;
      }

      p.velocity.y += pGravity * delta;
      p.position.addScaledVector(p.velocity, delta);

      const hx = (p.position.x / WORLD_SCALE) + 128;
      const hz = (p.position.z / WORLD_SCALE) + 128;
      const groundY = heightMap.getInterpolated(hx, hz);

      if (p.position.y <= groundY) {
        p.position.y = groundY;
        if (p.type === 'shell') {
          if (p.velocity.y < 0) {
            p.velocity.y = -p.velocity.y * 0.4; // bouncing shell
            p.velocity.x *= 0.6;
            p.velocity.z *= 0.6;
            p.rotationVelocity.multiplyScalar(0.6);
          }
          if (Math.abs(p.velocity.y) < 0.1) {
            p.velocity.y = 0;
            p.velocity.x = 0;
            p.velocity.z = 0;
            p.rotationVelocity.set(0, 0, 0);
          }
        } else {
          p.velocity.set(0, 0, 0);
        }
      }

      p.mesh.position.copy(p.position);

      if (p.type === 'shell') {
        p.mesh.rotateX(p.rotationVelocity.x * delta);
        p.mesh.rotateY(p.rotationVelocity.y * delta);
        p.mesh.rotateZ(p.rotationVelocity.z * delta);
      }

      const ratio = Math.max(0, p.life / p.maxLife);
      if (p.type === 'spark' || p.type === 'blood') {
        p.mesh.scale.setScalar(ratio);
      }

      if (p.mesh.material) {
        const mat = p.mesh.material as any;
        if (mat.transparent !== undefined) {
          mat.opacity = ratio;
        }
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }
}
