import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/events/EventBus';

describe('EventBus', () => {
  it('emits and receives events', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player.damaged', handler);
    bus.emit('player.damaged', { amount: 25, position: { x: 0, y: 0, z: 0 } as any });
    expect(handler).toHaveBeenCalledWith({ amount: 25, position: { x: 0, y: 0, z: 0 } });
  });

  it('supports multiple listeners for the same event', () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('monster.killed', a);
    bus.on('monster.killed', b);
    bus.emit('monster.killed', { monsterId: 'm1', position: { x: 0, y: 0, z: 0 } as any, killer: 'player' });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('off() removes a specific listener', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player.died', handler);
    bus.off('player.died', handler);
    bus.emit('player.died', { position: { x: 0, y: 0, z: 0 } as any });
    expect(handler).not.toHaveBeenCalled();
  });

  it('on() returns an unsubscribe function', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on('skill.activated', handler);
    unsub();
    bus.emit('skill.activated', { skill: 'dash' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('catches listener errors so other listeners still run', () => {
    const bus = new EventBus();
    const errorHandler = vi.fn(() => { throw new Error('boom'); });
    const okHandler = vi.fn();
    bus.on('weapon.fired', errorHandler);
    bus.on('weapon.fired', okHandler);
    expect(() => bus.emit('weapon.fired', { weapon: 'rifle', position: { x: 0, y: 0, z: 0 } as any })).not.toThrow();
    expect(okHandler).toHaveBeenCalledOnce();
  });

  it('clear() removes all listeners', () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('chunk.loaded', a);
    bus.on('chunk.unloaded', b);
    bus.clear();
    bus.emit('chunk.loaded', { cx: 0, cz: 0 });
    bus.emit('chunk.unloaded', { cx: 0, cz: 0 });
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('listenerCount() returns correct count', () => {
    const bus = new EventBus();
    expect(bus.listenerCount('player.damaged')).toBe(0);
    bus.on('player.damaged', () => {});
    bus.on('player.damaged', () => {});
    expect(bus.listenerCount('player.damaged')).toBe(2);
  });
});
