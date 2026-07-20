import * as THREE from 'three';

export type AttackPatternType =
  | 'single'      // One straight shot
  | 'burst'        // Multiple rapid shots
  | 'spread'       // Fan of projectiles
  | 'spiral'       // Rotating spiral pattern
  | 'ring'         // Circular burst
  | 'wave'         // Sine-wave trajectory
  | 'charge'       // Lunge + shoot
  | 'barrage';     // Sustained fire for duration

export interface AttackPattern {
  type: AttackPatternType;
  projectileCount: number;
  spacing: number;         // Time between projectiles (seconds)
  duration: number;        // Total pattern duration
  arc?: number;            // Spread arc in degrees (for spread/ring)
  spiralRotation?: number;  // Rotation per shot (for spiral)
  chargeDistance?: number; // Distance to lunge (for charge)
}

export const PATTERNS: Record<string, AttackPattern> = {
  // Scout: Quick single shot
  scout: {
    type: 'single',
    projectileCount: 1,
    spacing: 0,
    duration: 0,
  },

  // Brute: Heavy single + ground slam shockwave
  brute: {
    type: 'single',
    projectileCount: 1,
    spacing: 0,
    duration: 0,
    chargeDistance: 3,
  },

  // Stalker: Aimed 3-round burst
  stalker: {
    type: 'burst',
    projectileCount: 3,
    spacing: 0.12,
    duration: 0.24,
    arc: 5,
  },

  // Golem: Spiral pattern
  golem: {
    type: 'spiral',
    projectileCount: 8,
    spacing: 0.15,
    duration: 1.2,
    spiralRotation: 45,
  },

  // Crawler: Spread burst
  crawler: {
    type: 'spread',
    projectileCount: 5,
    spacing: 0.08,
    duration: 0.32,
    arc: 30,
  },

  // Drone: Ring burst
  drone: {
    type: 'ring',
    projectileCount: 8,
    spacing: 0.05,
    duration: 0.4,
    arc: 360,
  },

  sentinel: {
    type: 'wave',
    projectileCount: 5,
    spacing: 0.1,
    duration: 0.4,
    arc: 20,
  },

  annihilator: {
    type: 'barrage',
    projectileCount: 12,
    spacing: 0.08,
    duration: 0.96,
    arc: 60,
  },

  phantom: {
    type: 'spiral',
    projectileCount: 6,
    spacing: 0.08,
    duration: 0.48,
    spiralRotation: 60,
  },

  titan: {
    type: 'ring',
    projectileCount: 16,
    spacing: 0.04,
    duration: 0.64,
    arc: 360,
  },
};

export class PatternState {
  pattern: AttackPattern;
  shotCount: number = 0;
  elapsed: number = 0;
  active: boolean = false;
  chargeTimer: number = 0;
  isCharging: boolean = false;

  constructor(pattern: AttackPattern) {
    this.pattern = pattern;
  }

  reset(): void {
    this.shotCount = 0;
    this.elapsed = 0;
    this.active = false;
    this.chargeTimer = 0;
    this.isCharging = false;
  }

  start(): void {
    this.active = true;
    this.shotCount = 0;
    this.elapsed = 0;
  }

  shouldFire(): boolean {
    if (!this.active || this.shotCount >= this.pattern.projectileCount) return false;
    const fireAt = this.shotCount * this.pattern.spacing;
    return this.elapsed >= fireAt;
  }

  advance(delta: number): boolean {
    this.elapsed += delta;
    return this.elapsed < this.pattern.duration + this.pattern.spacing;
  }

  isComplete(): boolean {
    return this.shotCount >= this.pattern.projectileCount && this.elapsed > this.pattern.duration;
  }
}

export function getPatternForVariant(variant: string): AttackPattern {
  const patternKey = variant in PATTERNS ? variant : 'scout';
  return { ...PATTERNS[patternKey] };
}

export function calculateDirection(
  pattern: AttackPattern,
  shotIndex: number,
  baseDir: THREE.Vector3,
  _variant: string
): THREE.Vector3 {
  const dir = new THREE.Vector3();

  switch (pattern.type) {
    case 'single':
    case 'burst':
      dir.copy(baseDir);
      if (pattern.arc) {
        const offset = (shotIndex - (pattern.projectileCount - 1) / 2) * (pattern.arc / pattern.projectileCount);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(offset));
      }
      break;

    case 'spread':
      const spreadAngle = pattern.arc || 30;
      const angle = ((shotIndex / (pattern.projectileCount - 1)) - 0.5) * spreadAngle;
      dir.copy(baseDir);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(angle));
      break;

    case 'spiral':
      const rotAngle = (pattern.spiralRotation || 45) * shotIndex;
      dir.copy(baseDir);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(rotAngle));
      break;

    case 'ring':
      const ringAngle = (360 / pattern.projectileCount) * shotIndex;
      dir.set(Math.cos(THREE.MathUtils.degToRad(ringAngle)), 0, Math.sin(THREE.MathUtils.degToRad(ringAngle)));
      break;

    case 'wave':
      const waveAngle = ((shotIndex / (pattern.projectileCount - 1)) - 0.5) * (pattern.arc || 20);
      const yOffset = Math.sin(shotIndex * Math.PI) * 0.3;
      dir.copy(baseDir);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(waveAngle));
      dir.y += yOffset;
      dir.normalize();
      break;

    case 'barrage':
      const barrageAngle = ((shotIndex / (pattern.projectileCount - 1)) - 0.5) * (pattern.arc || 60);
      dir.copy(baseDir);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(barrageAngle));
      break;

    default:
      dir.copy(baseDir);
  }

  return dir.normalize();
}
