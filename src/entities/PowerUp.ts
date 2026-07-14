import * as THREE from 'three';

import type { PowerUpKind } from '../game/powerUpEffects';

const powerUpProfiles: Record<PowerUpKind, { color: number; labelColor: number }> = {
  health: { color: 0xff5252, labelColor: 0xff8a80 },
  ammo: { color: 0x40c4ff, labelColor: 0x80d8ff },
  adrenaline: { color: 0xffc107, labelColor: 0xffe082 },
  overclock: { color: 0x9c27b0, labelColor: 0xe1bee7 },
};

export class PowerUp {
  readonly mesh: THREE.Group;
  readonly kind: PowerUpKind;
  private bobOffset: number;
  private collected = false;

  constructor(position: THREE.Vector3, kind: PowerUpKind) {
    this.kind = kind;
    this.bobOffset = (Math.abs(position.x * 13 + position.z * 7) % 1) * Math.PI * 2;
    this.mesh = new THREE.Group();

    const profile = powerUpProfiles[kind];

    const core = new THREE.Mesh(
      kind === 'ammo'
        ? new THREE.BoxGeometry(0.5, 0.35, 0.28)
        : kind === 'health'
          ? new THREE.BoxGeometry(0.34, 0.34, 0.34)
          : kind === 'adrenaline'
            ? new THREE.OctahedronGeometry(0.32)
            : new THREE.TorusGeometry(0.28, 0.1, 8, 14),
      new THREE.MeshStandardMaterial({
        color: profile.color,
        emissive: profile.labelColor,
        emissiveIntensity: 0.55,
        flatShading: true,
      })
    );
    core.position.y = 0.6;
    this.mesh.add(core);

    if (kind === 'health') {
      const cross = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.42, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.2,
          flatShading: true,
        })
      );
      cross.position.y = 0.6;
      this.mesh.add(cross);
    }

    if (kind === 'ammo') {
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.15, 0.36),
        new THREE.MeshStandardMaterial({
          color: 0x1b1b1b,
          flatShading: true,
        })
      );
      strap.position.set(0.22, 0.6, 0);
      this.mesh.add(strap);
    }

    if (kind === 'adrenaline') {
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshBasicMaterial({ color: profile.labelColor })
      );
      pulse.position.y = 0.6;
      this.mesh.add(pulse);
    }

    if (kind === 'overclock') {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.05, 8, 12),
        new THREE.MeshBasicMaterial({ color: profile.labelColor })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.6;
      this.mesh.add(ring);
    }

    this.mesh.position.copy(position);
    this.mesh.position.y += 0.4;
  }

  update(time: number): void {
    if (this.collected) return;
    this.mesh.position.y += Math.sin(time * 3 + this.bobOffset) * 0.006;
    this.mesh.rotation.y += 0.02;
    this.mesh.rotation.x += 0.004;
  }

  collect(): PowerUpKind {
    this.collected = true;
    this.mesh.visible = false;
    return this.kind;
  }

  isVisible(): boolean {
    return this.mesh.visible;
  }
}
