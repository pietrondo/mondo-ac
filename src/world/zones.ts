import * as THREE from 'three';
import { HUD } from '../ui/hud';

export interface ZoneRegion {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  center: THREE.Vector3;
  radius: number;
}

export class ZoneManager {
  private zones: ZoneRegion[] = [];
  private currentZoneId: string | null = null;

  constructor() {
    this.zones = [
      {
        id: 'citadel',
        name: '🏰 CITTADELLA SANCTUARY',
        subtitle: 'Zona di Sicurezza e Commercio Principale',
        color: '#00E5FF',
        center: new THREE.Vector3(0, 0, 0),
        radius: 120
      },
      {
        id: 'volcano',
        name: '🔥 VULCANO INFOCATO',
        subtitle: 'Territorio di Caccia dei Titani del Fuoco',
        color: '#FF3D00',
        center: new THREE.Vector3(500, 0, 500),
        radius: 200
      },
      {
        id: 'shadow_vale',
        name: '🌲 VALLE DELLE OMBRE',
        subtitle: 'Foresta Nebbiosa Infestata da Spettri',
        color: '#AB47BC',
        center: new THREE.Vector3(-450, 0, 450),
        radius: 220
      },
      {
        id: 'crystal_shrine',
        name: '❄️ SANTUARIO DI CRISTALLO',
        subtitle: 'Picchi Glaciali e Altari Ancestrali',
        color: '#80DEEA',
        center: new THREE.Vector3(-550, 0, -550),
        radius: 250
      },
      {
        id: 'cyber_ravine',
        name: '⚡ CANYON METALLICO',
        subtitle: 'Rovine Tecnologiche e Avamposti Deserti',
        color: '#FFD700',
        center: new THREE.Vector3(600, 0, -400),
        radius: 200
      }
    ];
  }

  update(playerPos: THREE.Vector3, hud: HUD): void {
    let activeZone: ZoneRegion | null = null;

    for (const zone of this.zones) {
      const dist = new THREE.Vector2(playerPos.x - zone.center.x, playerPos.z - zone.center.z).length();
      if (dist <= zone.radius) {
        activeZone = zone;
        break;
      }
    }

    if (activeZone && activeZone.id !== this.currentZoneId) {
      this.currentZoneId = activeZone.id;
      hud.showWaveBanner(activeZone.name, activeZone.subtitle);
    } else if (!activeZone && this.currentZoneId !== null) {
      this.currentZoneId = null;
      hud.showWaveBanner('🗺️ TERRE SELVAGGE', 'Esplorazione dei Territori Inesplorati');
    }
  }
}
