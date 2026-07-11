import * as THREE from 'three';
import { rng } from '../config';

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

  return group;
}
