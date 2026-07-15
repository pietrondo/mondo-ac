import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Weapon } from '../../src/entities/Weapon';

describe('Weapon inventory properties', () => {
  it('correctly initializes Assault Rifle stats', () => {
    const weapon = new Weapon('rifle');
    expect(weapon.name).toBe('Assault Rifle');
    expect(weapon.magazineCapacity).toBe(30);
    expect(weapon.range).toBe(120);
    expect(weapon.damage).toBe(25);
  });

  it('correctly initializes Shotgun stats', () => {
    const weapon = new Weapon('shotgun');
    expect(weapon.name).toBe('Shotgun');
    expect(weapon.magazineCapacity).toBe(6);
    expect(weapon.range).toBe(25);
    expect(weapon.damage).toBe(15);
  });

  it('correctly initializes Knife stats', () => {
    const weapon = new Weapon('melee');
    expect(weapon.name).toBe('Knife');
    expect(weapon.magazineCapacity).toBe(1);
    expect(weapon.range).toBe(3.5);
    expect(weapon.damage).toBe(45);
  });
});
