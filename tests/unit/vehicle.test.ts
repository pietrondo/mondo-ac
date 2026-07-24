import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { Hovercar } from '../../src/entities/Hovercar';
import { Spaceship } from '../../src/entities/Spaceship';
import { Monster } from '../../src/entities/Monster';
import type { HeightMap } from '../../src/world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../../src/config';

function createMockInput() {
  return {
    state: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      interact: false,
      reload: false,
      attack: false,
      run: false,
      mouseX: 0,
      mouseY: 0,
    },
    resetMouse: () => undefined,
    reset: () => undefined,
  } as any;
}

describe('Hovercar WASD steering & terrain alignment', () => {
  it('steers left and right by modifying yaw', () => {
    const car = new Hovercar(new THREE.Vector3(0, 0, 0));
    car.yaw = 3.0;
    const input = createMockInput();
    const heightMap = { getInterpolated: () => 0 } as any;

    expect(car.yaw).toBe(3.0);

    input.state.left = true;
    car.update(0.1, input, heightMap);
    expect(car.yaw).toBeGreaterThan(3.0);

    const prevYaw = car.yaw;
    input.state.left = false;
    input.state.right = true;
    car.update(0.2, input, heightMap);
    expect(car.yaw).toBeLessThan(prevYaw);
  });

  it('accelerates forward on W and decelerates/reverses on S', () => {
    const car = new Hovercar(new THREE.Vector3(0, 0, 0));
    const input = createMockInput();
    const heightMap = { getInterpolated: () => 0 } as any;

    expect(car.speed).toBe(0);

    input.state.forward = true;
    car.update(0.1, input, heightMap);
    expect(car.speed).toBeGreaterThan(0);

    input.state.forward = false;
    input.state.backward = true;
    // Decelerate
    car.update(0.1, input, heightMap);
    const speedAfterBraking = car.speed;
    
    // Continue reverse
    car.update(0.5, input, heightMap);
    expect(car.speed).toBeLessThan(speedAfterBraking);
  });

  it('locks to heightmap elevation and calculates pitch based on slope', () => {
    const startPos = new THREE.Vector3(0, 0, 0);
    const car = new Hovercar(startPos);
    const input = createMockInput();
    
    // Sloping terrain heightmap: y = x (slope of 1m per meter in X direction)
    const slopingHeightMap = {
      getInterpolated: (hx: number, hz: number) => {
        // Map back to world X coord: x = (hx - WORLD_SIZE / 2) * WORLD_SCALE
        const x_world = (hx - WORLD_SIZE / 2) * WORLD_SCALE;
        return x_world;
      }
    } as HeightMap;

    // Face hovercar along +X direction (yaw = -PI/2)
    car.yaw = -Math.PI / 2;
    input.state.forward = true;

    // Run update to compute height and pitch
    car.update(0.1, input, slopingHeightMap);

    // Height should lock to current position.x (which is > 0 since it moved forward)
    expect(car.mesh.position.y).toBeCloseTo(car.mesh.position.x, 3);

    // Since slope is y = x, pitch should align to the slope angle of 45 deg (Math.PI / 4 radians)
    expect(car.pitch).toBeCloseTo(Math.PI / 4, 2);
  });
});

describe('Spaceship elevation, pitch, roll & flying controls', () => {
  it('controls elevation with Space (climb) and Shift/run (descend)', () => {
    const ship = new Spaceship(new THREE.Vector3(0, 20, 0));
    const input = createMockInput();
    const heightMap = { getInterpolated: () => 0 } as any;

    expect(ship.mesh.position.y).toBe(20);

    // Space (jump) climbs
    input.state.jump = true;
    ship.update(0.1, input, heightMap);
    expect(ship.mesh.position.y).toBeGreaterThan(20);

    const heightAfterClimbing = ship.mesh.position.y;
    input.state.jump = false;

    // Shift (run) descends
    input.state.run = true;
    ship.update(0.1, input, heightMap);
    expect(ship.mesh.position.y).toBeLessThan(heightAfterClimbing);
  });

  it('prevents crashing below terrain height', () => {
    const ship = new Spaceship(new THREE.Vector3(0, 10, 0));
    const input = createMockInput();
    const heightMap = { getInterpolated: () => 10 } as any;

    // Shift tries to fly down below 10
    input.state.run = true;
    ship.update(0.1, input, heightMap);
    expect(ship.mesh.position.y).toBe(10);
  });

  it('applies bank roll when turning and returns to zero when straight', () => {
    const ship = new Spaceship(new THREE.Vector3(0, 10, 0));
    const input = createMockInput();
    const heightMap = { getInterpolated: () => 0 } as any;

    expect(ship.roll).toBe(0);

    // Turn left (A) should bank roll to the left (positive roll)
    input.state.left = true;
    ship.update(0.1, input, heightMap);
    expect(ship.roll).toBeGreaterThan(0);

    // Turn off steering, roll should decay back towards 0
    input.state.left = false;
    const bankedRoll = ship.roll;
    ship.update(0.2, input, heightMap);
    expect(Math.abs(ship.roll)).toBeLessThan(bankedRoll);
  });

  it('adjusts pitch up when climbing and down when descending', () => {
    const ship = new Spaceship(new THREE.Vector3(0, 10, 0));
    const input = createMockInput();
    const heightMap = { getInterpolated: () => 0 } as any;

    expect(ship.pitch).toBe(0);

    // Climb (Space) should pitch up (positive pitch)
    input.state.jump = true;
    ship.update(0.1, input, heightMap);
    expect(ship.pitch).toBeGreaterThan(0);

    // Descend (Shift) should pitch down (negative pitch)
    input.state.jump = false;
    input.state.run = true;
    ship.update(0.5, input, heightMap);
    expect(ship.pitch).toBeLessThan(0);
  });
});

describe('Monster Variant Visuals and Hover updates', () => {
  it('creates 4 capsule limbs for crawler monsters', () => {
    const crawler = new Monster(new THREE.Vector3(0, 0, 0), { variant: 'crawler' });
    let legCylinders = 0;
    crawler.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CapsuleGeometry) {
        // Cylinder legs are added with radius 0.08
        if (child.geometry.parameters.radius === 0.1) {
          legCylinders++;
        }
      }
    });
    expect(legCylinders).toBe(4);
  });

  it('spawns and updates drone monster to hover 3 meters above terrain', () => {
    const terrainHeight = 12.5;
    const heightMap = { getInterpolated: () => terrainHeight } as any;
    const drone = new Monster(new THREE.Vector3(0, terrainHeight, 0), { variant: 'drone' });

    // In constructor, drone spawns +3.0m
    expect(drone.mesh.position.y).toBe(terrainHeight + 3.0);

    // Update drone and verify it remains 3 meters above terrain height
    drone.update(0.1, heightMap, new THREE.Vector3(0, 0, 0));
    expect(drone.mesh.position.y).toBe(terrainHeight + 3.0);
  });
});
