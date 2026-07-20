import * as THREE from 'three';
import { rng } from '../config';

export interface Collider {
  box: THREE.Box3;
  type: 'solid' | 'trigger';
}

export interface HouseOptions {
  scale?: number;
  wallColor?: number;
  roofColor?: number;
  variant?: 'small' | 'medium' | 'large';
}

export function createHouse(options: HouseOptions = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'house';

  const variant = options.variant || 'medium';
  const scale = options.scale || (variant === 'small' ? 0.7 : variant === 'large' ? 1.3 : 1.0);
  const wallColor = options.wallColor || 0x8D6E63;
  const roofColor = options.roofColor || 0x5D4037;

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, flatShading: true });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });

  const baseSize = 3 * scale;
  const wallHeight = 2.5 * scale;

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(baseSize, 0.2, baseSize), floorMat);
  floor.position.y = 0.1;
  group.add(floor);

  // Walls with door opening on south side
  // Back wall (north)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(baseSize, wallHeight, 0.3), wallMat);
  backWall.position.set(0, wallHeight / 2, -(baseSize / 2 - 0.15));
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, baseSize), wallMat);
  leftWall.position.set(-(baseSize / 2 - 0.15), wallHeight / 2, 0);
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, baseSize), wallMat);
  rightWall.position.set(baseSize / 2 - 0.15, wallHeight / 2, 0);
  group.add(rightWall);

  // Front wall left part
  const doorWidth = baseSize * 0.47;
  const sideWidth = (baseSize - doorWidth) / 2;
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, wallHeight, 0.3), wallMat);
  frontLeft.position.set(-(baseSize / 2 - sideWidth / 2), wallHeight / 2, baseSize / 2 - 0.15);
  group.add(frontLeft);

  // Front wall right part
  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, wallHeight, 0.3), wallMat);
  frontRight.position.set(baseSize / 2 - sideWidth / 2, wallHeight / 2, baseSize / 2 - 0.15);
  group.add(frontRight);

  // Front wall top (above door)
  const doorHeight = wallHeight * 0.68;
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, wallHeight - doorHeight, 0.3), wallMat);
  frontTop.position.set(0, wallHeight - (wallHeight - doorHeight) / 2, baseSize / 2 - 0.15);
  group.add(frontTop);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(baseSize * 0.83, 2 * scale, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, flatShading: true })
  );
  roof.position.y = wallHeight + scale;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Foundation spanning y = -4 to 0 (dark slate 0x37474F)
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(baseSize * 1.03, 4, baseSize * 1.03),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // Chimney box
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.5 * scale, 1.2 * scale, 0.5 * scale),
    new THREE.MeshStandardMaterial({ color: 0x705d55, flatShading: true })
  );
  chimney.position.set(0.8 * scale, wallHeight + 1.2 * scale, -0.8 * scale);
  group.add(chimney);

  // Window helper function
  function createArchedWindow(): THREE.Group {
    const windowGroup = new THREE.Group();
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xFFEE58,
      emissive: 0xFFEE58,
      emissiveIntensity: 0.8,
      flatShading: true
    });
    
    const winScale = 0.6 * scale;
    // Bottom rectangular part
    const rect = new THREE.Mesh(new THREE.BoxGeometry(winScale, 0.5 * scale, 0.1), windowMat);
    rect.position.y = 0.25 * scale;
    windowGroup.add(rect);

    // Top arch part: semi-cylinder
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.1, 8, 1, false, 0, Math.PI),
      windowMat
    );
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI / 2;
    arch.position.y = 0.5 * scale;
    windowGroup.add(arch);

    return windowGroup;
  }

  // Left window
  const wLeft = createArchedWindow();
  wLeft.position.set(-(baseSize / 2 + 0.01), 1.0 * scale, 0);
  wLeft.rotation.y = -Math.PI / 2;
  group.add(wLeft);

  // Right window
  const wRight = createArchedWindow();
  wRight.position.set(baseSize / 2 + 0.01, 1.0 * scale, 0);
  wRight.rotation.y = Math.PI / 2;
  group.add(wRight);

  // Back window
  const wBack = createArchedWindow();
  wBack.position.set(0, 1.0 * scale, -(baseSize / 2 + 0.01));
  wBack.rotation.y = Math.PI;
  group.add(wBack);

  // Interior furniture
  // Bed
  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.4 * scale, 1.5 * scale), woodMat);
  bed.position.set(-0.7 * scale, 0.3 * scale, -0.5 * scale);
  group.add(bed);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(0.7 * scale, 0.15 * scale, 1.4 * scale),
    new THREE.MeshStandardMaterial({ color: 0xE57373, flatShading: true })
  );
  mattress.position.set(-0.7 * scale, 0.55 * scale, -0.5 * scale);
  group.add(mattress);

  // Small table
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.05 * scale, 0.6 * scale), woodMat);
  table.position.set(0.7 * scale, 0.6 * scale, -0.8 * scale);
  group.add(table);

  for (let lx = -0.2; lx <= 0.2; lx += 0.4) {
    for (let lz = -0.2; lz <= 0.2; lz += 0.4) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05 * scale, 0.6 * scale, 0.05 * scale), woodMat);
      leg.position.set(0.7 * scale + lx * scale, 0.3 * scale, -0.8 * scale + lz * scale);
      group.add(leg);
    }
  }

  // Chair
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.05 * scale, 0.4 * scale), woodMat);
  chairSeat.position.set(0.7 * scale, 0.4 * scale, -0.2 * scale);
  group.add(chairSeat);

  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.5 * scale, 0.05 * scale), woodMat);
  chairBack.position.set(0.7 * scale, 0.65 * scale, -0.4 * scale);
  group.add(chairBack);

  // Fireplace
  const fireplace = new THREE.Mesh(
    new THREE.BoxGeometry(0.6 * scale, 0.8 * scale, 0.3 * scale),
    new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true })
  );
  fireplace.position.set(0, 0.4 * scale, -(baseSize / 2 - 0.4) * scale);
  group.add(fireplace);

  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.15 * scale, 0.3 * scale, 6),
    new THREE.MeshBasicMaterial({ color: 0xFF6F00 })
  );
  fire.position.set(0, 0.4 * scale, -(baseSize / 2 - 0.5) * scale);
  group.add(fire);

  // Cache chimney offset (local space) in userData
  group.userData = {
    chimneyOffset: new THREE.Vector3(0.8 * scale, wallHeight + 1.8 * scale, -0.8 * scale)
  };

  // Colliders for walls (excluding door area)
  const halfBase = baseSize / 2;
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-halfBase, -4, -halfBase), new THREE.Vector3(halfBase, wallHeight, -halfBase + 0.3)), type: 'solid' }, // back wall
    { box: new THREE.Box3(new THREE.Vector3(-halfBase, -4, -halfBase), new THREE.Vector3(-halfBase + 0.3, wallHeight, halfBase)), type: 'solid' }, // left wall
    { box: new THREE.Box3(new THREE.Vector3(halfBase - 0.3, -4, -halfBase), new THREE.Vector3(halfBase, wallHeight, halfBase)), type: 'solid' }, // right wall
    { box: new THREE.Box3(new THREE.Vector3(-halfBase, -4, halfBase - 0.3), new THREE.Vector3(-halfBase + sideWidth, wallHeight, halfBase)), type: 'solid' }, // front left
    { box: new THREE.Box3(new THREE.Vector3(halfBase - sideWidth, -4, halfBase - 0.3), new THREE.Vector3(halfBase, wallHeight, halfBase)), type: 'solid' }, // front right
    { box: new THREE.Box3(new THREE.Vector3(-doorWidth / 2, -4, halfBase - 0.3), new THREE.Vector3(doorWidth / 2, doorHeight, halfBase)), type: 'solid' } // front top
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createTower(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tower';

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
    new THREE.CylinderGeometry(1.9, 1.9, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // Stone reliefs on towers
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x616161, flatShading: true });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xFFEE58,
    emissive: 0xFFEE58,
    emissiveIntensity: 0.8,
    flatShading: true
  });

  const numReliefs = 6;
  for (let i = 0; i < numReliefs; i++) {
    const h = 1.5 + rng.next() * 5.5; // heights between 1.5 and 7
    const theta = rng.next() * Math.PI * 2;
    const r = 1.8 - (h / 8) * 0.3;
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.1),
      stoneMat
    );
    stone.position.set(Math.cos(theta) * r, h, Math.sin(theta) * r);
    stone.rotation.y = -theta;
    group.add(stone);
  }

  // Windows on towers
  const numTowerWindows = 3;
  for (let i = 0; i < numTowerWindows; i++) {
    const h = 2.0 + rng.next() * 4.5; // heights between 2 and 6.5
    const theta = rng.next() * Math.PI * 2;
    const r = 1.8 - (h / 8) * 0.3;
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.4, 0.08),
      windowMat
    );
    win.position.set(Math.cos(theta) * r, h, Math.sin(theta) * r);
    win.rotation.y = -theta;
    group.add(win);
  }

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
  group.name = 'castle';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x616161, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xFFEE58,
    emissive: 0xFFEE58,
    emissiveIntensity: 0.8,
    flatShading: true
  });
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, flatShading: true });

  // 1. Foundation base spanning y = -4 to 0 (dark slate)
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(32, 4, 32),
    new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
  );
  foundation.position.y = -2;
  group.add(foundation);

  // 2. Cobblestone Courtyard Floor (26x26)
  const courtyard = new THREE.Mesh(
    new THREE.BoxGeometry(26, 0.2, 26),
    new THREE.MeshStandardMaterial({ color: 0x616161, flatShading: true })
  );
  courtyard.position.set(0, 0.1, 0);
  group.add(courtyard);

  // Helper for grand towers
  function buildGrandTower(radius: number, height: number): THREE.Group {
    const tGroup = new THREE.Group();
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.9, radius, height, 12),
      new THREE.MeshStandardMaterial({ color: 0x858585, flatShading: true })
    );
    cyl.position.y = height / 2;
    tGroup.add(cyl);

    // Conical roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 1.15, height * 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x3E2723, flatShading: true })
    );
    roof.position.y = height + (height * 0.2);
    tGroup.add(roof);

    // Flagpole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), woodMat);
    pole.position.y = height + (height * 0.4) + 1.25;
    tGroup.add(pole);

    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), flagMat);
    banner.position.set(0.4, height + (height * 0.4) + 2.0, 0);
    tGroup.add(banner);

    // Windows
    for (let h = 3; h < height - 1; h += 3.5) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.1), windowMat);
        win.position.set(Math.cos(angle) * (radius + 0.02), h, Math.sin(angle) * (radius + 0.02));
        win.rotation.y = -angle;
        tGroup.add(win);
      }
    }

    return tGroup;
  }

  // 3. Four Corner Towers (at corners [-13, -13], [13, -13], [13, 13], [-13, 13])
  const cornerPositions = [
    [-13, -13], [13, -13], [13, 13], [-13, 13]
  ];
  for (const [tx, tz] of cornerPositions) {
    const tower = buildGrandTower(2.6, 12);
    tower.position.set(tx, 0, tz);
    group.add(tower);
  }

  // 4. Gatehouse Flanking Towers
  const gateTowerLeft = buildGrandTower(2.0, 10);
  gateTowerLeft.position.set(-4.0, 0, 13);
  group.add(gateTowerLeft);

  const gateTowerRight = buildGrandTower(2.0, 10);
  gateTowerRight.position.set(4.0, 0, 13);
  group.add(gateTowerRight);

  // 5. Outer Curtain Walls (Height 7, Thickness 1.4)
  const wallH = 7.0;
  const wallThick = 1.4;

  // North Wall
  const nWall = new THREE.Mesh(new THREE.BoxGeometry(22, wallH, wallThick), wallMat);
  nWall.position.set(0, wallH / 2, -13);
  group.add(nWall);

  // East Wall
  const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, 22), wallMat);
  eWall.position.set(13, wallH / 2, 0);
  group.add(eWall);

  // West Wall
  const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, 22), wallMat);
  wWall.position.set(-13, wallH / 2, 0);
  group.add(wWall);

  // South Wall Left & Right
  const sWallLeft = new THREE.Mesh(new THREE.BoxGeometry(8, wallH, wallThick), wallMat);
  sWallLeft.position.set(-8.5, wallH / 2, 13);
  group.add(sWallLeft);

  const sWallRight = new THREE.Mesh(new THREE.BoxGeometry(8, wallH, wallThick), wallMat);
  sWallRight.position.set(8.5, wallH / 2, 13);
  group.add(sWallRight);

  // Gate Arch Overhang
  const gateArch = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, wallThick + 0.4), wallMat);
  gateArch.position.set(0, wallH - 0.75, 13);
  group.add(gateArch);

  // Wooden Gate Portcullis
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, flatShading: true });
  const gateLeft = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.5, 0.2), gateMat);
  gateLeft.position.set(-1.25, 2.25, 13);
  group.add(gateLeft);

  const gateRight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.5, 0.2), gateMat);
  gateRight.position.set(1.25, 2.25, 13);
  group.add(gateRight);

  // Crenellations on outer walls
  const crenMat = new THREE.MeshStandardMaterial({ color: 0x616161, flatShading: true });
  for (let x = -10; x <= 10; x += 2.2) {
    const crenN = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, wallThick + 0.2), crenMat);
    crenN.position.set(x, wallH + 0.4, -13);
    group.add(crenN);
  }
  for (let z = -10; z <= 10; z += 2.2) {
    const crenE = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.2, 0.8, 1.2), crenMat);
    crenE.position.set(13, wallH + 0.4, z);
    group.add(crenE);

    const crenW = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.2, 0.8, 1.2), crenMat);
    crenW.position.set(-13, wallH + 0.4, z);
    group.add(crenW);
  }

  // 6. Central Fortress Keep (Donjon) - 2 Tier Citadel
  const keepBaseMat = new THREE.MeshStandardMaterial({ color: 0x9E9E9E, flatShading: true });

  // Tier 1 Base Keep (14x12, Height 8)
  const keepTier1 = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 12), keepBaseMat);
  keepTier1.position.set(0, 4, -3);
  group.add(keepTier1);

  // Tier 2 Upper Keep (10x8, Height 6)
  const keepTier2 = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), keepBaseMat);
  keepTier2.position.set(0, 11, -3);
  group.add(keepTier2);

  // Central Spire Roof
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 5, 4), new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true }));
  keepRoof.rotation.y = Math.PI / 4;
  keepRoof.position.set(0, 16.5, -3);
  group.add(keepRoof);

  // Keep Main Flag
  const keepPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6), woodMat);
  keepPole.position.set(0, 19.5, -3);
  group.add(keepPole);

  const keepBanner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.06), flagMat);
  keepBanner.position.set(0.7, 20.2, -3);
  group.add(keepBanner);

  // Keep Entrance Portico
  const portico = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.0, 2.5), keepBaseMat);
  portico.position.set(0, 2.0, 4.0);
  group.add(portico);

  // Royal Throne Inside Keep
  const throne = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.0), new THREE.MeshStandardMaterial({ color: 0x7B1FA2, flatShading: true }));
  throne.position.set(0, 1.1, -6.5);
  group.add(throne);

  const throneBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x7B1FA2, flatShading: true }));
  throneBack.position.set(0, 2.2, -7.0);
  group.add(throneBack);

  // Large Glowing Wall Torches
  const torchMat = new THREE.MeshBasicMaterial({ color: 0xFF6F00 });
  for (const tx of [-4.5, 4.5]) {
    const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), woodMat);
    torch.position.set(tx, 3.2, 5.25);
    group.add(torch);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), torchMat);
    flame.position.set(tx, 3.6, 5.25);
    group.add(flame);

    const light = new THREE.PointLight(0xff8c00, 2.0, 12);
    light.position.set(tx, 3.6, 5.25);
    group.add(light);
  }

  // Courtyard Well & Supplies
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 8), stoneMat);
  wellBase.position.set(6, 0.5, 5);
  group.add(wellBase);

  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.0, 8), woodMat);
  wellRoof.position.set(6, 2.2, 5);
  group.add(wellRoof);

  // Barrels and Crate Stacks
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
  const bPositions: [number, number, number][] = [
    [-8, 0.5, 7], [-8, 0.5, 8.2], [-7, 0.5, 7.6], [8, 0.5, -7], [8, 0.5, -8.2]
  ];
  for (const [bx, by, bz] of bPositions) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.0, 10), barrelMat);
    barrel.position.set(bx, by, bz);
    group.add(barrel);
  }

  // 7. Solid Colliders for Massive Castle Walls & Keep
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-15, -4, -15), new THREE.Vector3(15, 14, -11.5)), type: 'solid' }, // North Wall
    { box: new THREE.Box3(new THREE.Vector3(11.5, -4, -15), new THREE.Vector3(15, 14, 15)), type: 'solid' },  // East Wall
    { box: new THREE.Box3(new THREE.Vector3(-15, -4, -15), new THREE.Vector3(-11.5, 14, 15)), type: 'solid' }, // West Wall
    { box: new THREE.Box3(new THREE.Vector3(-15, -4, 11.5), new THREE.Vector3(-2.0, 14, 15)), type: 'solid' },  // South Wall Left
    { box: new THREE.Box3(new THREE.Vector3(2.0, -4, 11.5), new THREE.Vector3(15, 14, 15)), type: 'solid' },   // South Wall Right
    { box: new THREE.Box3(new THREE.Vector3(-2.0, 4.5, 11.5), new THREE.Vector3(2.0, 14, 15)), type: 'solid' }, // South Gate Arch
    { box: new THREE.Box3(new THREE.Vector3(-7.5, -4, -9.5), new THREE.Vector3(7.5, 18, 5.5)), type: 'solid' }, // Central Keep
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createRuin(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ruin';
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
    new THREE.BoxGeometry(3.1, 4, 0.6),
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
  group.name = 'pyramid';
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
  group.name = 'lighthouse';

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

  // Spotlight pivot & volumetric beam (additive-blended cone mesh)
  const spotlightPivot = new THREE.Group();
  spotlightPivot.name = 'spotlightPivot';
  spotlightPivot.position.set(0, 13.2, 0);

  const beamGeom = new THREE.ConeGeometry(3, 15, 16, 1, true);
  beamGeom.translate(0, -7.5, 0); // shift apex to (0,0,0)

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xFFFF88,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const beamMesh = new THREE.Mesh(beamGeom, beamMat);
  beamMesh.name = 'spotlightBeam';
  beamMesh.rotation.x = Math.PI / 2; // point along Z axis
  
  spotlightPivot.add(beamMesh);
  group.add(spotlightPivot);

  group.userData = {
    spotlightPivot: spotlightPivot
  };

  // AABB collider covering [-2, -4, -2] to [2, 12, 2]
  const colliderBox = new THREE.Box3(
    new THREE.Vector3(-2, -4, -2),
    new THREE.Vector3(2, 12, 2)
  );
  (group as any).collider = { box: colliderBox, type: 'solid' };

  return group;
}

export function createTavern(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tavern';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x795548, flatShading: true });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 6), floorMat);
  floor.position.y = 0.1;
  group.add(floor);

  // Walls with door opening on south side
  // Back wall (north)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.3), wallMat);
  backWall.position.set(0, 1.6, -2.85);
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 6), wallMat);
  leftWall.position.set(-2.85, 1.6, 0);
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 6), wallMat);
  rightWall.position.set(2.85, 1.6, 0);
  group.add(rightWall);

  // Front wall left part
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.3), wallMat);
  frontLeft.position.set(-1.95, 1.6, 2.85);
  group.add(frontLeft);

  // Front wall right part
  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.3), wallMat);
  frontRight.position.set(1.95, 1.6, 2.85);
  group.add(frontRight);

  // Front wall top (above door)
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 0.3), wallMat);
  frontTop.position.set(0, 2.6, 2.85);
  group.add(frontTop);

  // Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), roofMat);
  roof.position.y = 4.25;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Bar counter
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 0.8), woodMat);
  bar.position.set(-1, 0.7, -1.5);
  group.add(bar);

  // Bar stools
  for (let i = 0; i < 3; i++) {
    const stool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8),
      woodMat
    );
    stool.position.set(-1.5 + i * 1, 0.3, -0.8);
    group.add(stool);
  }

  // Tables
  const tablePositions = [[1, 0.5, 0.5], [1, 0.5, -1.5]];
  for (const [tx, ty, tz] of tablePositions) {
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), woodMat);
    tableTop.position.set(tx, ty + 0.5, tz);
    group.add(tableTop);

    // Table legs
    for (let lx = -0.5; lx <= 0.5; lx += 1) {
      for (let lz = -0.5; lz <= 0.5; lz += 1) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), woodMat);
        leg.position.set(tx + lx, ty + 0.25, tz + lz);
        group.add(leg);
      }
    }
  }

  // Chairs
  const chairPositions = [[1.8, 0.3, 0.5], [0.2, 0.3, 0.5], [1.8, 0.3, -1.5]];
  for (const [cx, cy, cz] of chairPositions) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), woodMat);
    seat.position.set(cx, cy + 0.3, cz);
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.1), woodMat);
    back.position.set(cx, cy + 0.6, cz - 0.2);
    group.add(back);
  }

  // Barrels
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12), barrelMat);
  barrel1.position.set(2.2, 0.4, -2.2);
  group.add(barrel1);

  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12), barrelMat);
  barrel2.position.set(2.2, 0.4, -1.5);
  group.add(barrel2);

  // Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true }));
  chimney.position.set(2, 4.5, -2);
  group.add(chimney);

  // Sign above door
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: 0x3E2723 }));
  sign.position.set(0, 3.2, 3);
  group.add(sign);

  // Colliders for walls (excluding door area)
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-3, -4, -3), new THREE.Vector3(3, 4, -2.7)), type: 'solid' }, // back wall
    { box: new THREE.Box3(new THREE.Vector3(-3, -4, -3), new THREE.Vector3(-2.7, 4, 3)), type: 'solid' }, // left wall
    { box: new THREE.Box3(new THREE.Vector3(2.7, -4, -3), new THREE.Vector3(3, 4, 3)), type: 'solid' }, // right wall
    { box: new THREE.Box3(new THREE.Vector3(-3, -4, 2.7), new THREE.Vector3(-1.05, 4, 3)), type: 'solid' }, // front left
    { box: new THREE.Box3(new THREE.Vector3(1.05, -4, 2.7), new THREE.Vector3(3, 4, 3)), type: 'solid' }, // front right
    { box: new THREE.Box3(new THREE.Vector3(-1.05, -4, 2.7), new THREE.Vector3(1.05, 2.1, 3)), type: 'solid' } // front top
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createTemple(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'temple';

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xBDBDBD, flatShading: true });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x9E9E9E, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.3, flatShading: true });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 10), floorMat);
  floor.position.y = 0.15;
  group.add(floor);

  // Steps at entrance
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 0.8), stoneMat);
    step.position.set(0, i * 0.2, 5.4 + i * 0.8);
    group.add(step);
  }

  // Walls with entrance
  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.4), stoneMat);
  backWall.position.set(0, 2.65, -4.8);
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 10), stoneMat);
  leftWall.position.set(-3.8, 2.65, 0);
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 10), stoneMat);
  rightWall.position.set(3.8, 2.65, 0);
  group.add(rightWall);

  // Front wall left
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5, 0.4), stoneMat);
  frontLeft.position.set(-2.65, 2.65, 4.8);
  group.add(frontLeft);

  // Front wall right
  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5, 0.4), stoneMat);
  frontRight.position.set(2.65, 2.65, 4.8);
  group.add(frontRight);

  // Front wall top (arch)
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 0.4), stoneMat);
  frontTop.position.set(0, 4.4, 4.8);
  group.add(frontTop);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 11), stoneMat);
  roof.position.y = 5.4;
  group.add(roof);

  // Pillars
  const pillarPositions = [[-2.5, 0, 3], [2.5, 0, 3], [-2.5, 0, -3], [2.5, 0, -3]];
  for (const [px, py, pz] of pillarPositions) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), stoneMat);
    pillar.position.set(px, py + 2.65, pz);
    group.add(pillar);

    // Pillar cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 1), stoneMat);
    cap.position.set(px, py + 5.2, pz);
    group.add(cap);
  }

  // Altar at back
  const altar = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), stoneMat);
  altar.position.set(0, 0.65, -3.5);
  group.add(altar);

  // Golden idol on altar
  const idol = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1, 6), goldMat);
  idol.position.set(0, 1.65, -3.5);
  group.add(idol);

  // Pews (benches)
  for (let row = 0; row < 4; row++) {
    const pew = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.4), woodMat);
    pew.position.set(0, 0.4, 2 - row * 1.5);
    group.add(pew);
  }

  // Stained glass windows (colored panels)
  const windowColors = [0x2196F3, 0x4CAF50, 0xFFEB3B, 0xE91E63];
  const windowPositions = [[-3.6, 3, 2], [-3.6, 3, -2], [3.6, 3, 2], [3.6, 3, -2]];
  for (let i = 0; i < 4; i++) {
    const [wx, wy, wz] = windowPositions[i];
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.5, 0.8),
      new THREE.MeshStandardMaterial({
        color: windowColors[i],
        emissive: windowColors[i],
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
      })
    );
    window.position.set(wx, wy, wz);
    group.add(window);
  }

  // Candles on altar
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xFFF9C4 });
  for (let i = -0.6; i <= 0.6; i += 0.6) {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), candleMat);
    candle.position.set(i, 1.3, -3.5);
    group.add(candle);

    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xFFEB3B })
    );
    flame.position.set(i, 1.5, -3.5);
    group.add(flame);
  }

  // Colliders (excluding entrance)
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-4, -4, -5), new THREE.Vector3(4, 5, -4.6)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-4, -4, -5), new THREE.Vector3(-3.6, 5, 5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(3.6, -4, -5), new THREE.Vector3(4, 5, 5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-4, -4, 4.6), new THREE.Vector3(-1.4, 5, 5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(1.4, -4, 4.6), new THREE.Vector3(4, 5, 5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-1.4, -4, 4.6), new THREE.Vector3(1.4, 3.65, 5)), type: 'solid' }
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createWarehouse(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'warehouse';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x78909C, flatShading: true });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x546E7A, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xA1887F, flatShading: true });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 8), floorMat);
  floor.position.y = 0.15;
  group.add(floor);

  // Walls with large door opening
  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.3), wallMat);
  backWall.position.set(0, 2.15, -3.85);
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 8), wallMat);
  leftWall.position.set(-4.85, 2.15, 0);
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 8), wallMat);
  rightWall.position.set(4.85, 2.15, 0);
  group.add(rightWall);

  // Front wall left
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 0.3), wallMat);
  frontLeft.position.set(-3.6, 2.15, 3.85);
  group.add(frontLeft);

  // Front wall right
  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 0.3), wallMat);
  frontRight.position.set(3.6, 2.15, 3.85);
  group.add(frontRight);

  // Front wall top (above door)
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 0.3), wallMat);
  frontTop.position.set(0, 3.65, 3.85);
  group.add(frontTop);

  // Roof (flat with slight slope)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 9), wallMat);
  roof.position.y = 4.35;
  roof.rotation.x = 0.05;
  group.add(roof);

  // Shelving units
  const shelfPositions = [[-3, 0, -2], [-3, 0, 1], [3, 0, -2], [3, 0, 1]];
  for (const [sx, sy, sz] of shelfPositions) {
    // Shelf frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.6), woodMat);
    frame.position.set(sx, sy + 1.65, sz);
    group.add(frame);

    // Shelf boards
    for (let level = 0; level < 3; level++) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.5), woodMat);
      board.position.set(sx, sy + 0.5 + level * 1, sz);
      group.add(board);
    }
  }

  // Crates scattered
  const crateSizes = [[0.8, 0.8, 0.8], [1, 0.6, 1], [0.6, 0.6, 0.6], [1.2, 0.8, 0.8]];
  const cratePositions = [[1, 0.4, -2], [1.5, 0.3, -1], [0, 0.4, 0], [-1, 0.3, 2], [2, 0.4, 2]];
  for (let i = 0; i < cratePositions.length; i++) {
    const [cx, cy, cz] = cratePositions[i];
    const [cw, ch, cd] = crateSizes[i % crateSizes.length];
    const crate = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), crateMat);
    crate.position.set(cx, cy, cz);
    crate.rotation.y = rng.next() * 0.5;
    group.add(crate);
  }

  // Barrels
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const barrelPositions = [[-2, 0.5, 2], [-1.5, 0.5, 2.5], [2.5, 0.5, -2.5]];
  for (const [bx, by, bz] of barrelPositions) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), barrelMat);
    barrel.position.set(bx, by, bz);
    group.add(barrel);
  }

  // Colliders (excluding large door)
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-5, -4, -4), new THREE.Vector3(5, 4, -3.7)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-5, -4, -4), new THREE.Vector3(-4.7, 4, 4)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(4.7, -4, -4), new THREE.Vector3(5, 4, 4)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-5, -4, 3.7), new THREE.Vector3(-2.35, 4, 4)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(2.35, -4, 3.7), new THREE.Vector3(5, 4, 4)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-2.35, -4, 3.7), new THREE.Vector3(2.35, 3.15, 4)), type: 'solid' }
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createLibrary(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'library';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const bookColors = [0xD32F2F, 0x1976D2, 0x388E3C, 0xF57C00, 0x7B1FA2];

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 7), floorMat);
  floor.position.y = 0.1;
  group.add(floor);

  // Walls with door
  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 0.3), wallMat);
  backWall.position.set(0, 2.1, -3.35);
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 7), wallMat);
  leftWall.position.set(-3.35, 2.1, 0);
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 7), wallMat);
  rightWall.position.set(3.35, 2.1, 0);
  group.add(rightWall);

  // Front wall left
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 0.3), wallMat);
  frontLeft.position.set(-2.25, 2.1, 3.35);
  group.add(frontLeft);

  // Front wall right
  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 0.3), wallMat);
  frontRight.position.set(2.25, 2.1, 3.35);
  group.add(frontRight);

  // Front wall top
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 0.3), wallMat);
  frontTop.position.set(0, 3.35, 3.35);
  group.add(frontTop);

  // Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2, 4), new THREE.MeshStandardMaterial({ color: 0x4E342E, flatShading: true }));
  roof.position.y = 5.1;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Bookshelves along walls
  const shelfPositions = [
    { x: -2.5, z: -2.5, rot: 0 },
    { x: 0, z: -2.5, rot: 0 },
    { x: 2.5, z: -2.5, rot: 0 },
    { x: -2.8, z: 0, rot: Math.PI / 2 },
    { x: 2.8, z: 0, rot: Math.PI / 2 }
  ];

  for (const pos of shelfPositions) {
    // Shelf frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.5), woodMat);
    frame.position.set(pos.x, 1.6, pos.z);
    frame.rotation.y = pos.rot;
    group.add(frame);

    // Books on shelves
    for (let level = 0; level < 4; level++) {
      for (let b = 0; b < 5; b++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.4, 0.3),
          new THREE.MeshStandardMaterial({
            color: bookColors[Math.floor(rng.next() * bookColors.length)],
            flatShading: true
          })
        );
        const bookX = pos.x + (b - 2) * 0.2;
        const bookZ = pos.z + (pos.rot === 0 ? 0.1 : (b - 2) * 0.2);
        book.position.set(bookX, 0.5 + level * 0.7, bookZ);
        book.rotation.y = pos.rot;
        group.add(book);
      }
    }
  }

  // Reading desk
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1), woodMat);
  desk.position.set(0, 0.8, 0);
  group.add(desk);

  // Desk legs
  for (let lx = -0.6; lx <= 0.6; lx += 1.2) {
    for (let lz = -0.4; lz <= 0.4; lz += 0.8) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), woodMat);
      leg.position.set(lx, 0.4, lz);
      group.add(leg);
    }
  }

  // Open book on desk
  const openBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xFFF9C4 })
  );
  openBook.position.set(0, 0.88, 0);
  group.add(openBook);

  // Chair
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), woodMat);
  chair.position.set(0, 0.5, 0.8);
  group.add(chair);

  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.1), woodMat);
  chairBack.position.set(0, 0.8, 1);
  group.add(chairBack);

  // Chandelier
  const chandelier = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFEB3B })
  );
  chandelier.position.set(0, 3.5, 0);
  group.add(chandelier);

  const chandelierLight = new THREE.PointLight(0xFFEB3B, 2, 8);
  chandelierLight.position.set(0, 3.5, 0);
  group.add(chandelierLight);

  // Colliders (excluding door)
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-3.5, -4, -3.5), new THREE.Vector3(3.5, 4, -3.2)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-3.5, -4, -3.5), new THREE.Vector3(-3.2, 4, 3.5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(3.2, -4, -3.5), new THREE.Vector3(3.5, 4, 3.5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-3.5, -4, 3.2), new THREE.Vector3(-1.3, 4, 3.5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(1.3, -4, 3.2), new THREE.Vector3(3.5, 4, 3.5)), type: 'solid' },
    { box: new THREE.Box3(new THREE.Vector3(-1.3, -4, 3.2), new THREE.Vector3(1.3, 2.6, 3.5)), type: 'solid' }
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createBunker(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bunker';

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x616161, flatShading: true });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true });

  // Entrance structure (above ground)
  const entrance = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), concreteMat);
  entrance.position.set(0, 1, 0);
  group.add(entrance);

  // Entrance door frame
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.2), metalMat);
  doorFrame.position.set(0, 1, 1.5);
  group.add(doorFrame);

  // Stairs going down
  for (let i = 0; i < 8; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.5), concreteMat);
    step.position.set(0, -i * 0.5, -1 - i * 0.5);
    group.add(step);
  }

  // Underground chamber
  const chamberFloor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 6), floorMat);
  chamberFloor.position.set(0, -4.15, -5);
  group.add(chamberFloor);

  // Chamber walls
  const chamberBack = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.3), concreteMat);
  chamberBack.position.set(0, -2.5, -7.85);
  group.add(chamberBack);

  const chamberLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 6), concreteMat);
  chamberLeft.position.set(-2.85, -2.5, -5);
  group.add(chamberLeft);

  const chamberRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 6), concreteMat);
  chamberRight.position.set(2.85, -2.5, -5);
  group.add(chamberRight);

  const chamberFront = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.3), concreteMat);
  chamberFront.position.set(0, -2.5, -2.15);
  group.add(chamberFront);

  // Chamber ceiling
  const chamberCeiling = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 6), concreteMat);
  chamberCeiling.position.set(0, -1.15, -5);
  group.add(chamberCeiling);

  // Equipment: crates
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), crateMat);
  crate1.position.set(-2, -3.5, -6);
  group.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat);
  crate2.position.set(-2, -3.5, -4.5);
  group.add(crate2);

  // Metal barrels
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true });
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), barrelMat);
  barrel1.position.set(2, -3.5, -6);
  group.add(barrel1);

  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), barrelMat);
  barrel2.position.set(2, -3.5, -4.5);
  group.add(barrel2);

  // Work table
  const table = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), metalMat);
  table.position.set(0, -3.4, -6.5);
  group.add(table);

  // Table legs
  for (let lx = -0.8; lx <= 0.8; lx += 1.6) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), metalMat);
    leg.position.set(lx, -3.85, -6.5);
    group.add(leg);
  }

  // Light fixture
  const lightFixture = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
  );
  lightFixture.position.set(0, -1.3, -5);
  group.add(lightFixture);

  const bunkerLight = new THREE.PointLight(0xFFFF00, 2, 8);
  bunkerLight.position.set(0, -1.5, -5);
  group.add(bunkerLight);

  // Colliders (entrance + chamber walls, with opening for stairs)
  const colliders: Collider[] = [
    { box: new THREE.Box3(new THREE.Vector3(-1.5, -4, -1.5), new THREE.Vector3(1.5, 2, -0.5)), type: 'solid' }, // entrance back
    { box: new THREE.Box3(new THREE.Vector3(-1.5, -4, -0.5), new THREE.Vector3(-0.75, 2, 1.5)), type: 'solid' }, // entrance left
    { box: new THREE.Box3(new THREE.Vector3(0.75, -4, -0.5), new THREE.Vector3(1.5, 2, 1.5)), type: 'solid' }, // entrance right
    { box: new THREE.Box3(new THREE.Vector3(-3, -4, -8), new THREE.Vector3(3, -1, -7.7)), type: 'solid' }, // chamber back
    { box: new THREE.Box3(new THREE.Vector3(-3, -4, -8), new THREE.Vector3(-2.7, -1, -2)), type: 'solid' }, // chamber left
    { box: new THREE.Box3(new THREE.Vector3(2.7, -4, -8), new THREE.Vector3(3, -1, -2)), type: 'solid' }, // chamber right
    { box: new THREE.Box3(new THREE.Vector3(-3, -4, -2.3), new THREE.Vector3(3, -1, -2)), type: 'solid' } // chamber front
  ];
  (group as any).colliders = colliders;

  return group;
}

export function createWell(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'well';

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4FC3F7,
    emissive: 0x4FC3F7,
    emissiveIntensity: 0.3,
    flatShading: true
  });

  // Well base (stone cylinder)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.8, 12), stoneMat);
  base.position.y = 0.4;
  group.add(base);

  // Water inside
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 12), waterMat);
  water.position.y = 0.5;
  group.add(water);

  // Roof support posts
  for (let i = 0; i < 2; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), woodMat);
    post.position.set(i === 0 ? -0.7 : 0.7, 1.65, 0);
    group.add(post);
  }

  // Cross beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.15), woodMat);
  beam.position.y = 2.9;
  group.add(beam);

  // Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 4), woodMat);
  roof.position.y = 3.3;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Bucket
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8), woodMat);
  bucket.position.set(0, 1.5, 0);
  group.add(bucket);

  // Rope
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), woodMat);
  rope.position.set(0, 2.2, 0);
  group.add(rope);

  return group;
}

export function createMarketStall(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'market_stall';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xE57373, flatShading: true });

  // Table
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.2), woodMat);
  table.position.y = 0.9;
  group.add(table);

  // Table legs
  for (let lx = -1; lx <= 1; lx += 2) {
    for (let lz = -0.4; lz <= 0.4; lz += 0.8) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), woodMat);
      leg.position.set(lx, 0.45, lz);
      group.add(leg);
    }
  }

  // Support posts for canopy
  for (let lx = -1.1; lx <= 1.1; lx += 2.2) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), woodMat);
    post.position.set(lx, 1.5, -0.5);
    group.add(post);
  }

  // Canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 1.8), canvasMat);
  canopy.position.set(0, 2.6, 0);
  canopy.rotation.x = -0.15;
  group.add(canopy);

  // Goods on table (crates, barrels, baskets)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), crateMat);
  crate1.position.set(-0.8, 1.15, 0);
  group.add(crate1);

  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.3, 8), woodMat);
  basket.position.set(0, 1.1, 0.2);
  group.add(basket);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10), crateMat);
  barrel.position.set(0.8, 1.2, -0.1);
  group.add(barrel);

  return group;
}

export function createLantern(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lantern';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFEB3B });

  // Post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.5, 8), woodMat);
  post.position.y = 1.25;
  group.add(post);

  // Lantern cage
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), metalMat);
  cage.position.y = 2.7;
  group.add(cage);

  // Light inside
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), lightMat);
  light.position.y = 2.7;
  group.add(light);

  // Point light
  const pointLight = new THREE.PointLight(0xFFEB3B, 1.5, 8);
  pointLight.position.y = 2.7;
  group.add(pointLight);

  // Top cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 4), metalMat);
  cap.position.y = 3.0;
  cap.rotation.y = Math.PI / 4;
  group.add(cap);

  return group;
}

export function createFarmField(rows: number = 4, cols: number = 6): THREE.Group {
  const group = new THREE.Group();
  group.name = 'farm_field';

  const soilMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
  const cropMat = new THREE.MeshStandardMaterial({ color: 0x8BC34A, flatShading: true });
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });

  const fieldWidth = cols * 1.2;
  const fieldDepth = rows * 1.2;

  // Soil patches
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const soil = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 1.0), soilMat);
      soil.position.set(c * 1.2 - fieldWidth / 2 + 0.6, 0.07, r * 1.2 - fieldDepth / 2 + 0.6);
      group.add(soil);

      // Crop on top
      if (rng.next() > 0.2) {
        const crop = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), cropMat);
        crop.position.set(c * 1.2 - fieldWidth / 2 + 0.6, 0.4, r * 1.2 - fieldDepth / 2 + 0.6);
        group.add(crop);
      }
    }
  }

  // Fence around field
  const fenceHeight = 0.8;
  const fenceThickness = 0.1;

  // Front and back fences
  for (let side = 0; side < 2; side++) {
    const z = side === 0 ? -fieldDepth / 2 : fieldDepth / 2;
    const fence = new THREE.Mesh(new THREE.BoxGeometry(fieldWidth + 0.2, fenceHeight, fenceThickness), fenceMat);
    fence.position.set(0, fenceHeight / 2, z);
    group.add(fence);
  }

  // Left and right fences
  for (let side = 0; side < 2; side++) {
    const x = side === 0 ? -fieldWidth / 2 : fieldWidth / 2;
    const fence = new THREE.Mesh(new THREE.BoxGeometry(fenceThickness, fenceHeight, fieldDepth + 0.2), fenceMat);
    fence.position.set(x, fenceHeight / 2, 0);
    group.add(fence);
  }

  return group;
}

export function createPath(length: number, width: number = 2): THREE.Group {
  const group = new THREE.Group();
  group.name = 'path';

  const pathMat = new THREE.MeshStandardMaterial({ color: 0x9E9E9E, flatShading: true });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });

  // Main path
  const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, length), pathMat);
  path.position.y = 0.025;
  group.add(path);

  // Stone details along path
  for (let i = 0; i < length / 2; i++) {
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.3 + rng.next() * 0.3, 0.08, 0.3 + rng.next() * 0.3),
      stoneMat
    );
    const side = rng.next() > 0.5 ? 1 : -1;
    stone.position.set(
      side * (width / 2 + 0.2),
      0.04,
      -length / 2 + i * 2 + rng.next()
    );
    group.add(stone);
  }

  return group;
}

export function createCart(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cart';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });

  // Cart bed
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 1.2), woodMat);
  bed.position.y = 0.6;
  group.add(bed);

  // Side walls
  const side1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), woodMat);
  side1.position.set(0, 0.9, -0.55);
  group.add(side1);

  const side2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), woodMat);
  side2.position.set(0, 0.9, 0.55);
  group.add(side2);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 1.2), woodMat);
  back.position.set(-0.95, 0.9, 0);
  group.add(back);

  // Wheels
  for (let wx = -0.7; wx <= 0.7; wx += 1.4) {
    for (let wz = -0.7; wz <= 0.7; wz += 1.4) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), darkWoodMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.3, wz);
      group.add(wheel);
    }
  }

  // Handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), darkWoodMat);
  handle.position.set(1.7, 0.6, 0);
  group.add(handle);

  // Cargo (crates/barrels)
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), darkWoodMat);
  crate.position.set(-0.3, 0.95, 0);
  group.add(crate);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 10), woodMat);
  barrel.position.set(0.4, 0.95, 0.1);
  group.add(barrel);

  return group;
}

export function createTreeStump(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tree_stump';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, flatShading: true });
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });

  // Stump
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8), woodMat);
  stump.position.y = 0.3;
  group.add(stump);

  // Bark details
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const bark = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.05), barkMat);
    bark.position.set(Math.cos(angle) * 0.45, 0.3, Math.sin(angle) * 0.45);
    bark.rotation.y = -angle;
    group.add(bark);
  }

  // Rings on top
  const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.25, 8), woodMat);
  ring1.rotation.x = -Math.PI / 2;
  ring1.position.y = 0.61;
  group.add(ring1);

  return group;
}

export function createHayBale(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hay_bale';

  const hayMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F, flatShading: true });

  // Main bale
  const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12), hayMat);
  bale.rotation.z = Math.PI / 2;
  bale.position.y = 0.5;
  group.add(bale);

  // Texture lines
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.82, 0.02), hayMat);
    line.rotation.z = Math.PI / 2;
    line.position.set(0, 0.5, -0.3 + i * 0.3);
    group.add(line);
  }

  return group;
}
