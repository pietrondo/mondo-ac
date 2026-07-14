import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { selectMonsterSpawns } from '../../src/world/spawnSelection';

describe('selectMonsterSpawns', () => {
  it('prefers the closest monster spawns to the player', () => {
    const anchor = new THREE.Vector3(0, 0, 0);
    const candidates = [
      new THREE.Vector3(100, 0, 0),
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(50, 0, 0),
      new THREE.Vector3(25, 0, 0),
    ];

    const selected = selectMonsterSpawns(candidates, anchor, 2);

    expect(selected.map((pos) => pos.x)).toEqual([10, 25]);
  });

  it('falls back to a nearby pack when every candidate is too far away', () => {
    const anchor = new THREE.Vector3(0, 0, 0);
    const candidates = [new THREE.Vector3(1000, 0, 1000)];

    const selected = selectMonsterSpawns(candidates, anchor, 4, 100);

    expect(selected).toHaveLength(4);
    expect(selected.every((pos) => pos.distanceTo(anchor) <= 40)).toBe(true);
  });
});
