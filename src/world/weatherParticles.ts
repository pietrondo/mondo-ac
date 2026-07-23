import * as THREE from 'three';
import { ParticlePool } from '../combat/particles';
import { DayNightManager } from './dayNight';

const STORM_RAIN_RATE = 80;
const CALM_RAIN_RATE = 40;
const SPAWN_RADIUS = 25;
const HEIGHT_MIN = 15;
const HEIGHT_RANGE = 15;
const FALL_SPEED_MIN = -16;
const FALL_SPEED_VARIANCE = -6;

export function updateWeatherParticles(
  delta: number,
  dayNight: DayNightManager,
  particlePool: ParticlePool,
  playerPosition: THREE.Vector3
): void {
  if (dayNight.weather !== 'rain' && dayNight.weather !== 'storm') return;

  const rainRate = dayNight.weather === 'storm' ? STORM_RAIN_RATE : CALM_RAIN_RATE;
  const count = Math.floor(delta * rainRate) + (Math.random() < (delta * rainRate) % 1 ? 1 : 0);

  for (let r = 0; r < count; r++) {
    const rx = (Math.random() - 0.5) * SPAWN_RADIUS * 2;
    const rz = (Math.random() - 0.5) * SPAWN_RADIUS * 2;
    const ry = HEIGHT_MIN + Math.random() * HEIGHT_RANGE;
    const pos = playerPosition.clone().add(new THREE.Vector3(rx, ry, rz));
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      FALL_SPEED_MIN - Math.random() * Math.abs(FALL_SPEED_VARIANCE),
      (Math.random() - 0.5) * 0.5
    );
    particlePool.spawn('spark', pos, vel, 0.8);
  }
}
