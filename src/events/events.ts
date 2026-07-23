import * as THREE from 'three';

export type GameEvents = {
  'player.damaged': { amount: number; attacker?: string; position: THREE.Vector3 };
  'player.healed': { amount: number; source: string };
  'player.died': { position: THREE.Vector3 };
  'player.respawned': { position: THREE.Vector3 };

  'monster.spawned': { monster: { id: string; position: THREE.Vector3; hp: number } };
  'monster.damaged': { monsterId: string; damage: number; position: THREE.Vector3 };
  'monster.killed': { monsterId: string; position: THREE.Vector3; killer: string };

  'powerup.collected': { kind: string; position: THREE.Vector3 };

  'skill.activated': { skill: 'dash' | 'grenade' | 'shield' };
  'skill.cooldown': { dash: number; grenade: number; shield: number };

  'chunk.loaded': { cx: number; cz: number };
  'chunk.unloaded': { cx: number; cz: number };

  'weapon.fired': { weapon: string; position: THREE.Vector3 };
  'weapon.hit': { damage: number; isCritical: boolean; position: THREE.Vector3 };

  'wave.started': { wave: number };
  'wave.completed': { wave: number };
  'boss.spawned': { name: string; hp: number };
  'boss.killed': { name: string };

  'quest.completed': { questId: string };
  'npc.interacted': { npcId: string };
};

export type EventName = keyof GameEvents;
export type EventPayload<K extends EventName> = GameEvents[K];
