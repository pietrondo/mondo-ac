import * as THREE from 'three';
import { rng } from '../config';

export interface Collider {
  box: THREE.Box3;
  type: 'solid' | 'trigger';
}

export function createHouse(): THREE.Group {
  const group = new THREE.Group();

  // Walls
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.5, 3),
    new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true })
  );
  walls.position.y = 1.25;
  group.add(walls);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true })
  );
  roof.position.y = 2.5 + 1;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.5, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x3E2723 })
  );
  door.position.set(0, 0.75, 1.51);
  group.add(door);

  // Foundation spanning y = -4 to 0 (dark slate 0x37474F)
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(3, 4, 3),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // Collision box for house starting at y = -4
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-1.5, -4, -1.5),
    new THREE.Vector3(1.5, 2.5, 1.5)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}

export function createTower(): THREE.Group {
  const group = new THREE.Group();

  // Main tower
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.8, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x9E9E9E, flatShading: true })
  );
  tower.position.y = 4;
  group.add(tower);

  // Crenellations
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const cren = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true })
    );
    cren.position.set(
      Math.cos(angle) * 1.6,
      8.3,
      Math.sin(angle) * 1.6
    );
    group.add(cren);
  }

  // Foundation spanning y = -4 to 0 (dark slate 0x37474F)
  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // Collision box for tower starting at y = -4
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-1.8, -4, -1.8),
    new THREE.Vector3(1.8, 8, 1.8)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}

export function createCastle(): THREE.Group {
  const group = new THREE.Group();

  // 4 Corner towers
  const positions = [
    [-6, -6], [6, -6], [6, 6], [-6, 6]
  ];
  for (const [tx, tz] of positions) {
    const tower = createTower();
    tower.position.set(tx, 0, tz);
    group.add(tower);
  }

  // Walls between towers
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });

  // North wall
  const nWall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1), wallMat);
  nWall.position.set(0, 2.5, -6);
  group.add(nWall);

  // South wall
  const sWall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1), wallMat);
  sWall.position.set(0, 2.5, 6);
  group.add(sWall);

  // East wall
  const eWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), wallMat);
  eWall.position.set(6, 2.5, 0);
  group.add(eWall);

  // West wall
  const wWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), wallMat);
  wWall.position.set(-6, 2.5, 0);
  group.add(wWall);

  // Gate
  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 3, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x5D4037 })
  );
  gate.position.set(0, 1.5, 6.5);
  group.add(gate);

  // Main foundation base spanning y = -4 to 0 (dark slate 0x37474F)
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(14, 4, 14),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // Collision box for castle starting at y = -4
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-7, -4, -7),
    new THREE.Vector3(7, 8, 7)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}

export function createRuin(): THREE.Group {
  const group = new THREE.Group();
  const debrisCount = Math.floor(3 + rng.next() * 5);

  for (let i = 0; i < debrisCount; i++) {
    const size = 0.5 + rng.next() * 1.5;
    const rock = new THREE.Mesh(
      new THREE.BoxGeometry(size, size * 0.6, size),
      new THREE.MeshStandardMaterial({ color: 0x616161, flatShading: true })
    );
    rock.position.set(
      (rng.next() - 0.5) * 4,
      size * 0.3,
      (rng.next() - 0.5) * 4
    );
    rock.rotation.set(
      rng.next() * 0.5,
      rng.next() * Math.PI,
      rng.next() * 0.5
    );
    group.add(rock);
  }

  // One standing wall
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(3, 4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true })
  );
  wall.position.set(0, 2, 0);
  wall.rotation.z = rng.next() * 0.3;
  group.add(wall);

  // Foundation spanning y = -4 to 0 (dark slate 0x37474F)
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // Collision box for ruin starting at y = -4
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-3, -4, -3),
    new THREE.Vector3(3, 4, 3)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}

export function createPyramid(): THREE.Group {
  const group = new THREE.Group();
  const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xDEC29B, flatShading: true });

  // Layer 1: 8x2x8 (spans y = 0 to 2)
  const layer1 = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), sandstoneMat);
  layer1.position.y = 1;
  group.add(layer1);

  // Layer 2: 6x2x6 (spans y = 2 to 4)
  const layer2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), sandstoneMat);
  layer2.position.y = 3;
  group.add(layer2);

  // Layer 3: 4x2x4 (spans y = 4 to 6)
  const layer3 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4), sandstoneMat);
  layer3.position.y = 5;
  group.add(layer3);

  // Golden Cone: 2x2 (spans y = 6 to 8)
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, flatShading: true })
  );
  cone.position.y = 7;
  cone.rotation.y = Math.PI / 4;
  group.add(cone);

  // Foundation: sandstone block spanning y = -4 to 0
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandstoneMat);
  foundation.position.y = -2;
  group.add(foundation);

  // AABB collider covering [-4, -4, -4] to [4, 8, 4]
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-4, -4, -4),
    new THREE.Vector3(4, 8, 4)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}

export function createLighthouse(): THREE.Group {
  const group = new THREE.Group();

  // Cylindrical foundation (y = -4 to 2, top radius 2, bottom radius 2, height 6)
  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -1;
  group.add(foundation);

  // Alternating red (0xD32F2F) and white (0xF5F5F5) cylindrical bands (y = 2 to 12)
  const redMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, flatShading: true });

  const bandHeights = [
    { y: 3, mat: redMat },
    { y: 5, mat: whiteMat },
    { y: 7, mat: redMat },
    { y: 9, mat: whiteMat },
    { y: 11, mat: redMat }
  ];

  for (const band of bandHeights) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2, 12), band.mat);
    mesh.position.y = band.y;
    group.add(mesh);
  }

  // Gallery deck: flat cylinder (y = 12)
  const gallery = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true })
  );
  gallery.position.y = 12.1;
  group.add(gallery);

  // Glass lantern room (y = 12.2 to 14.2)
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xE0E0E0, transparent: true, opacity: 0.5 })
  );
  lantern.position.y = 13.2;
  group.add(lantern);

  // Glowing yellow core (y = 13.2)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
  );
  core.position.y = 13.2;
  group.add(core);

  // Black cone roof (y = 14.2 to 16.2)
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true })
  );
  roof.position.y = 15.2;
  group.add(roof);

  // Functional yellow PointLight (color 0xFFFF00, range 20, intensity 3) at y = 13.2
  const light = new THREE.PointLight(0xFFFF00, 3, 20);
  light.position.y = 13.2;
  group.add(light);

  // AABB collider covering [-2, -4, -2] to [2, 12, 2]
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-2, -4, -2),
    new THREE.Vector3(2, 12, 2)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}
