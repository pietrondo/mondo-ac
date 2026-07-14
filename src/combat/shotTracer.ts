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

  constructor(scene: THREE.Scene, options: ShotTracerOptions = {}) {
    this.scene = scene;
    this.duration = options.duration ?? 0.08;
    this.color = options.color ?? 0xffff66;
  }

  spawn(origin: THREE.Vector3, end: THREE.Vector3): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([origin.clone(), end.clone()]);
    const material = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 1,
    });
    const line = new THREE.Line(geometry, material);
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
        this.scene.remove(tracer.line);
        tracer.line.geometry.dispose();
        material.dispose();
        this.active.splice(i, 1);
      }
    }
  }
}
