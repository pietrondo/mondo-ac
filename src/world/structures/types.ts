import * as THREE from 'three';

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
