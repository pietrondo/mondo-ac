import * as THREE from 'three';

interface ActiveTracer {
  line: THREE.Line;
  remaining: number;
  duration: number;
}

export interface ShotTracerOptions {
  duration?: number;
  color?: number;
}

export class ShotTracer {
  private readonly scene: THREE.Scene;
  private readonly duration: number;
  private readonly color: number;
  private readonly active: ActiveTracer[] = [];
  
  // Object pool for lines
  private readonly pool: THREE.Line[] = [];
  private readonly poolSize = 32;

  constructor(scene: THREE.Scene, options: ShotTracerOptions = {}) {
    this.scene = scene;
    this.duration = options.duration ?? 0.08;
    this.color = options.color ?? 0xffff66;

    // Pre-allocate pool
    for (let i = 0; i < this.poolSize; i++) {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(6); // 2 points (x,y,z each)
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      
      const material = new THREE.LineBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0,
      });

      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.pool.push(line);
    }
  }

  spawn(origin: THREE.Vector3, end: THREE.Vector3): void {
    // Find an idle line (not visible and not in scene children)
    let line: THREE.Line | undefined;
    for (const item of this.pool) {
      if (!item.visible) {
        line = item;
        break;
      }
    }

    // Fallback: if pool is empty, reuse oldest active
    if (!line) {
      if (this.active.length > 0) {
        const oldest = this.active.shift()!;
        line = oldest.line;
        this.scene.remove(line);
      } else {
        return;
      }
    }

    // Update positions in-place
    const positions = line.geometry.attributes.position.array as Float32Array;
    positions[0] = origin.x;
    positions[1] = origin.y;
    positions[2] = origin.z;
    positions[3] = end.x;
    positions[4] = end.y;
    positions[5] = end.z;
    line.geometry.attributes.position.needsUpdate = true;

    // Setup material opacity and visibility
    const material = line.material as THREE.LineBasicMaterial;
    material.opacity = 1;
    line.visible = true;

    // Add to scene
    this.scene.add(line);

    this.active.push({
      line,
      remaining: this.duration,
      duration: this.duration,
    });
  }

  update(delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const tracer = this.active[i];
      tracer.remaining -= delta;

      const material = tracer.line.material as THREE.LineBasicMaterial;
      material.opacity = Math.max(0, tracer.remaining / tracer.duration);

      if (tracer.remaining <= 0) {
        // Return to pool
        tracer.line.visible = false;
        this.scene.remove(tracer.line);
        this.active.splice(i, 1);
      }
    }
  }
}
