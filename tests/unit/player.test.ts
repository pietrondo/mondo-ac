import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Player } from '../../src/entities/Player';
import type { InputManager } from '../../src/controls/input';
import type { HeightMap } from '../../src/world/heightmap';

const groundHeight = 10;

function createPlayer(): { player: Player; input: InputManager; heightMap: HeightMap } {
  const input = {
    state: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      interact: false,
      attack: false,
      run: false,
      mouseX: 0,
      mouseY: 0,
    },
    resetMouse: () => undefined,
  } as InputManager;
  const player = new Player(new THREE.PerspectiveCamera(), input);
  player.mesh.position.y = groundHeight;
  const heightMap = { getInterpolated: () => groundHeight } as HeightMap;

  return { player, input, heightMap };
}

describe('Player jump physics', () => {
  it('jumps only while grounded and gravity returns it to terrain height', () => {
    const { player, input, heightMap } = createPlayer();

    input.state.jump = true;
    player.update(0.1, heightMap);
    expect(player.mesh.position.y).toBeGreaterThan(groundHeight);

    input.state.jump = false;
    player.update(0.1, heightMap);
    const heightBeforeMidairJump = player.mesh.position.y;

    input.state.jump = true;
    player.update(0.1, heightMap);
    expect(player.mesh.position.y - heightBeforeMidairJump).toBeLessThan(0.2);

    input.state.jump = false;
    for (let i = 0; i < 20; i++) player.update(0.1, heightMap);

    expect(player.mesh.position.y).toBe(groundHeight);
  });
});

describe('Player first-person aiming', () => {
  it('allows aiming below the horizon', () => {
    const { player, input, heightMap } = createPlayer();
    input.state.mouseY = 1;

    player.update(0, heightMap);

    const direction = new THREE.Vector3();
    player.camera.getWorldDirection(direction);
    expect(direction.y).toBeLessThan(0);
  });
});

describe('Player AABB sliding collision', () => {
  it('repositions player along the axis of minimum overlap and zeroes the velocity component (X-axis)', () => {
    const { player, heightMap } = createPlayer();
    player.mesh.position.set(1.7, groundHeight, 2.0);
    (player as any).velocity.set(5, 0, 0);

    const structureBox = new THREE.Box3(
      new THREE.Vector3(2, 0, 0),
      new THREE.Vector3(4, 20, 4)
    );
    player.setColliders([{ box: structureBox, type: 'solid' }], []);

    player.update(0.1, heightMap);

    expect(player.mesh.position.x).toBeCloseTo(1.5, 5);
    expect(player.mesh.position.z).toBeCloseTo(2.0, 5);
    expect((player as any).velocity.x).toBe(0);
  });

  it('allows unimpeded motion on non-colliding axis (sliding)', () => {
    const { player, heightMap } = createPlayer();
    player.mesh.position.set(1.7, groundHeight, 2.0);
    (player as any).velocity.set(5, 0, 10);

    const structureBox = new THREE.Box3(
      new THREE.Vector3(2, 0, 0),
      new THREE.Vector3(4, 20, 4)
    );
    player.setColliders([{ box: structureBox, type: 'solid' }], []);

    player.update(0.1, heightMap);

    expect(player.mesh.position.x).toBeCloseTo(1.5, 5);
    expect(player.mesh.position.z).toBeCloseTo(2.8, 5);
    expect((player as any).velocity.x).toBe(0);
    expect((player as any).velocity.z).toBe(8);
  });

  it('performs iterative sequential resolution for multiple colliders', () => {
    const { player, heightMap } = createPlayer();
    player.mesh.position.set(1.7, groundHeight, 1.7);
    (player as any).velocity.set(5, 0, 5);

    const box1 = new THREE.Box3(new THREE.Vector3(2, 0, 0), new THREE.Vector3(4, 20, 4));
    const box2 = new THREE.Box3(new THREE.Vector3(0, 0, 2), new THREE.Vector3(4, 20, 4));
    player.setColliders([
      { box: box1, type: 'solid' },
      { box: box2, type: 'solid' }
    ], []);

    player.update(0.1, heightMap);

    expect(player.mesh.position.x).toBeCloseTo(1.5, 5);
    expect(player.mesh.position.z).toBeCloseTo(1.5, 5);
    expect((player as any).velocity.x).toBe(0);
    expect((player as any).velocity.z).toBe(0);
  });
});

