import { describe, expect, it } from 'vitest';
import { generateDungeon } from '../src/world/dungeonGenerator';

describe('dungeonGenerator', () => {
  it('generates a procedural dungeon with deterministic seed', () => {
    const dungeon1 = generateDungeon(12345, -150);
    const dungeon2 = generateDungeon(12345, -150);

    expect(dungeon1.floorY).toBe(-150);
    expect(dungeon1.rooms.length).toBeGreaterThanOrEqual(3);
    expect(dungeon1.entrancePos).toBeDefined();
    expect(dungeon1.bossSpawnPos).toBeDefined();
    expect(dungeon1.exitPortalPos).toBeDefined();

    // Deterministic positions
    expect(dungeon1.entrancePos.x).toBe(dungeon2.entrancePos.x);
    expect(dungeon1.entrancePos.z).toBe(dungeon2.entrancePos.z);
    expect(dungeon1.bossSpawnPos.x).toBe(dungeon2.bossSpawnPos.x);
    expect(dungeon1.bossSpawnPos.z).toBe(dungeon2.bossSpawnPos.z);
  });

  it('creates entrance room, regular rooms, and boss room', () => {
    const dungeon = generateDungeon(54321, -150);
    const entranceRoom = dungeon.rooms.find(r => r.type === 'entrance');
    const bossRoom = dungeon.rooms.find(r => r.type === 'boss');
    const regularRooms = dungeon.rooms.filter(r => r.type === 'regular');

    expect(entranceRoom).toBeDefined();
    expect(bossRoom).toBeDefined();
    expect(regularRooms.length).toBeGreaterThan(0);
    expect(bossRoom!.width).toBeGreaterThanOrEqual(25);
  });

  it('generates non-empty colliders and spawn points', () => {
    const dungeon = generateDungeon(9999, -150);
    expect(dungeon.colliders.length).toBeGreaterThan(0);
    expect(dungeon.monsterSpawns.length).toBeGreaterThan(0);
    expect(dungeon.itemSpawns.length).toBeGreaterThan(0);

    for (const collider of dungeon.colliders) {
      expect(collider.box.isEmpty()).toBe(false);
      expect(collider.type).toMatch(/solid|trigger/);
    }
  });
});
