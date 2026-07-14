import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ShotTracer } from '../../src/combat/shotTracer';

describe('ShotTracer', () => {
  it('adds a tracer line and removes it after its lifetime expires', () => {
    const scene = new THREE.Scene();
    const tracer = new ShotTracer(scene, { duration: 0.1 });
    const origin = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 0, -10);

    tracer.spawn(origin, end);

    expect(scene.children).toHaveLength(1);

    tracer.update(0.05);
    expect(scene.children).toHaveLength(1);

    tracer.update(0.05);
    expect(scene.children).toHaveLength(0);
  });
});
