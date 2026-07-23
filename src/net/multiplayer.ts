import * as THREE from 'three';
import { disposeObject3D } from '../utils/dispose';

export interface RemotePlayerData {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  weapon: string;
}

export class RemotePlayer {
  mesh: THREE.Group;
  nameTag: HTMLDivElement;
  targetPos = new THREE.Vector3();
  targetYaw = 0;

  constructor(public id: string, public name: string, scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    // Body Capsule/Cylinder mesh for Remote Player
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, roughness: 0.4, metalness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    this.mesh.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    this.mesh.add(head);

    // Visor / Eyes
    const visorGeo = new THREE.BoxGeometry(0.35, 0.1, 0.25);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00E5FF, emissiveIntensity: 0.6 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.85, -0.15);
    this.mesh.add(visor);

    this.mesh.userData.remotePlayerId = id;
    scene.add(this.mesh);

    // HTML Name tag banner floating over player
    this.nameTag = document.createElement('div');
    this.nameTag.style.cssText = `
      position: fixed;
      color: #00E5FF;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      font-weight: 800;
      background: rgba(10, 15, 25, 0.8);
      border: 1px solid #00E5FF;
      padding: 3px 8px;
      border-radius: 6px;
      pointer-events: none;
      transform: translate(-50%, -100%);
      white-space: nowrap;
      box-shadow: 0 0 10px rgba(0,229,255,0.4);
      z-index: 99;
    `;
    this.nameTag.textContent = name;
    document.body.appendChild(this.nameTag);
  }

  update(delta: number, camera: THREE.PerspectiveCamera): void {
    // Smooth lerp interpolation for remote player movement
    this.mesh.position.lerp(this.targetPos, delta * 12);
    this.mesh.rotation.y += (this.targetYaw - this.mesh.rotation.y) * delta * 12;

    // Project 3D position to 2D screen coordinates for Name Tag
    const headPos = this.mesh.position.clone().add(new THREE.Vector3(0, 2.3, 0));
    headPos.project(camera);

    if (headPos.z < 1) {
      const x = (headPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(headPos.y * 0.5) + 0.5) * window.innerHeight;
      this.nameTag.style.left = `${x}px`;
      this.nameTag.style.top = `${y}px`;
      this.nameTag.style.display = 'block';
    } else {
      this.nameTag.style.display = 'none';
    }
  }

  destroy(scene: THREE.Scene): void {
    disposeObject3D(this.mesh);
    scene.remove(this.mesh);
    this.nameTag.remove();
  }
}

export class MultiplayerManager {
  private ws: WebSocket | null = null;
  private myId: string | null = null;
  private remotePlayers = new Map<string, RemotePlayer>();
  private updateTimer = 0;
  onDamageReceived?: (damage: number, attackerName: string) => void;

  constructor(private scene: THREE.Scene, private camera: THREE.PerspectiveCamera) {}

  getRemoteMeshes(): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    for (const remote of this.remotePlayers.values()) {
      meshes.push(remote.mesh);
    }
    return meshes;
  }

  sendHitPlayer(targetId: string, damage: number): void {
    this.send({
      type: 'hit_player',
      targetId,
      damage
    });
  }

  connect(playerName: string): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to Multiplayer Server');
        this.send({ type: 'join', name: playerName });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {}
      };

      this.ws.onclose = () => {
        console.log('Multiplayer Disconnected');
      };
    } catch (e) {
      console.warn('Multiplayer WebSocket unavailable offline.');
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  update(delta: number, playerPos: THREE.Vector3, playerYaw: number, playerHp: number, activeWeapon: string): void {
    // Send local player state 20 times per second
    this.updateTimer += delta;
    if (this.updateTimer >= 0.05) {
      this.updateTimer = 0;
      this.send({
        type: 'move',
        x: playerPos.x,
        y: playerPos.y,
        z: playerPos.z,
        yaw: playerYaw,
        hp: playerHp,
        weapon: activeWeapon
      });
    }

    // Update remote player meshes & name tags
    for (const remote of this.remotePlayers.values()) {
      remote.update(delta, this.camera);
    }
  }

  sendShot(origin: THREE.Vector3, dir: THREE.Vector3, weapon: string): void {
    this.send({
      type: 'shoot',
      ox: origin.x, oy: origin.y, oz: origin.z,
      dx: dir.x, dy: dir.y, dz: dir.z,
      weapon
    });
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'init':
        this.myId = data.yourId;
        for (const p of data.players) {
          if (p.id !== this.myId) {
            this.addRemotePlayer(p);
          }
        }
        break;
      case 'player_joined':
        if (data.player.id !== this.myId) {
          this.addRemotePlayer(data.player);
        }
        break;
      case 'player_update':
        if (data.id !== this.myId) {
          const remote = this.remotePlayers.get(data.id);
          if (remote) {
            remote.targetPos.set(data.x, data.y, data.z);
            remote.targetYaw = data.yaw;
          }
        }
        break;
      case 'player_left':
        const remote = this.remotePlayers.get(data.id);
        if (remote) {
          remote.destroy(this.scene);
          this.remotePlayers.delete(data.id);
        }
        break;
      case 'hit_player':
        if (data.targetId === this.myId) {
          this.onDamageReceived?.(data.damage, data.attackerName || 'Nemico');
        }
        break;
    }
  }

  private addRemotePlayer(data: any): void {
    if (this.remotePlayers.has(data.id)) return;
    const remote = new RemotePlayer(data.id, data.name || 'Giocatore', this.scene);
    remote.targetPos.set(data.x || 0, data.y || 0, data.z || 0);
    remote.targetYaw = data.yaw || 0;
    this.remotePlayers.set(data.id, remote);
  }
}
