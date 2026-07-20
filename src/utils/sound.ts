import * as THREE from 'three';
import { BiomeType } from '../world/biomeMap';

function createShotBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.15;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.4;
  }
  return buffer;
}

function createReloadBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const sampleRate = ctx.sampleRate;
  const click1 = 0;
  const click2 = Math.floor(sampleRate * 0.25);
  for (let i = 0; i < data.length; i++) {
    data[i] = 0;
  }
  for (let i = 0; i < sampleRate * 0.05; i++) {
    const t = i / (sampleRate * 0.05);
    data[click1 + i] = Math.sin(t * 100) * Math.exp(-t * 10) * 0.3;
  }
  for (let i = 0; i < sampleRate * 0.05; i++) {
    const t = i / (sampleRate * 0.05);
    data[click2 + i] = Math.sin(t * 120) * Math.exp(-t * 10) * 0.3;
  }
  return buffer;
}

function createCollectBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.3;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const sampleRate = ctx.sampleRate;
  const noteLen = Math.floor(sampleRate * 0.1);
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
  for (let n = 0; n < 3; n++) {
    const start = n * noteLen;
    const freq = freqs[n];
    for (let i = 0; i < noteLen; i++) {
      const t = i / noteLen;
      data[start + i] = Math.sin((i / sampleRate) * freq * Math.PI * 2) * Math.exp(-t * 4) * 0.2;
    }
  }
  return buffer;
}

function createHurtBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.25;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.sin(t * 15) * Math.exp(-t * 5) * 0.4;
  }
  return buffer;
}

function createMonsterAttackBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.3;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const sampleRate = ctx.sampleRate;
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    const freq = 300 - t * 220; // 300Hz down to 80Hz
    data[i] = Math.sin((i / sampleRate) * freq * Math.PI * 2) * Math.exp(-t * 3) * 0.35;
  }
  return buffer;
}

function createWindBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 6.0;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate;
    const envelope = 0.3 + 0.7 * Math.sin(t * 0.5) * Math.sin(t * 0.5);
    const white = Math.random() * 2 - 1;
    lastOut = 0.98 * lastOut + 0.02 * white;
    data[i] = lastOut * envelope * 0.6;
  }
  return buffer;
}

function createMeleeBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.12;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const sampleRate = ctx.sampleRate;
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    const freq = 100 + t * 450;
    data[i] = Math.sin((i / sampleRate) * freq * Math.PI * 2) * Math.exp(-t * 9) * 0.25;
  }
  return buffer;
}

export class SoundManager {
  private listener: THREE.AudioListener;
  private ctx: AudioContext;

  private shotBuffer!: AudioBuffer;
  private reloadBuffer!: AudioBuffer;
  private collectBuffer!: AudioBuffer;
  private hurtBuffer!: AudioBuffer;
  private monsterAttackBuffer!: AudioBuffer;
  private windBuffer!: AudioBuffer;
  private meleeBuffer!: AudioBuffer;

  private ambientSound!: THREE.Audio;

  constructor(camera: THREE.PerspectiveCamera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    this.ctx = THREE.AudioContext.getContext();
    this.initBuffers();

    this.ambientSound = new THREE.Audio(this.listener);
    this.ambientSound.setBuffer(this.windBuffer);
    this.ambientSound.setLoop(true);
    this.ambientSound.setVolume(0.04);
  }

  private initBuffers(): void {
    this.shotBuffer = createShotBuffer(this.ctx);
    this.reloadBuffer = createReloadBuffer(this.ctx);
    this.collectBuffer = createCollectBuffer(this.ctx);
    this.hurtBuffer = createHurtBuffer(this.ctx);
    this.monsterAttackBuffer = createMonsterAttackBuffer(this.ctx);
    this.windBuffer = createWindBuffer(this.ctx);
    this.meleeBuffer = createMeleeBuffer(this.ctx);
  }

  playShot(): void {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(this.shotBuffer);
    sound.setVolume(0.35);
    sound.onEnded = () => { sound.disconnect(); };
    sound.play();
  }

  playReload(): void {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(this.reloadBuffer);
    sound.setVolume(0.4);
    sound.onEnded = () => { sound.disconnect(); };
    sound.play();
  }

  playCollect(): void {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(this.collectBuffer);
    sound.setVolume(0.25);
    sound.onEnded = () => { sound.disconnect(); };
    sound.play();
  }

  playHurt(): void {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(this.hurtBuffer);
    sound.setVolume(0.5);
    sound.onEnded = () => { sound.disconnect(); };
    sound.play();
  }

  playMelee(): void {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(this.meleeBuffer);
    sound.setVolume(0.3);
    sound.onEnded = () => { sound.disconnect(); };
    sound.play();
  }

  startAmbient(): void {
    if (!this.ambientSound.isPlaying) {
      this.ambientSound.play();
    }
  }

  playPositionalAttack(mesh: THREE.Object3D): void {
    const sound = new THREE.PositionalAudio(this.listener);
    sound.setBuffer(this.monsterAttackBuffer);
    sound.setRefDistance(10);
    sound.setVolume(0.8);
    mesh.add(sound);
    sound.play();

    sound.onEnded = () => {
      mesh.remove(sound);
      sound.disconnect();
    };
  }

  updateAmbient(biome: BiomeType): void {
    if (!this.ambientSound.isPlaying) return;

    switch (biome) {
      case BiomeType.MOUNTAIN:
      case BiomeType.SNOW:
        this.ambientSound.setVolume(0.08);
        this.ambientSound.setPlaybackRate(0.8);
        break;
      case BiomeType.FOREST:
        this.ambientSound.setVolume(0.03);
        this.ambientSound.setPlaybackRate(1.15);
        break;
      case BiomeType.DESERT:
        this.ambientSound.setVolume(0.05);
        this.ambientSound.setPlaybackRate(0.9);
        break;
      case BiomeType.COAST:
        this.ambientSound.setVolume(0.06);
        this.ambientSound.setPlaybackRate(1.0);
        break;
      case BiomeType.PLAINS:
      default:
        this.ambientSound.setVolume(0.04);
        this.ambientSound.setPlaybackRate(1.0);
        break;
    }
  }
}
