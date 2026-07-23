import { EventName, EventPayload } from './events';

type Listener<K extends EventName> = (payload: EventPayload<K>) => void;

export class EventBus {
  private listeners = new Map<EventName, Set<Listener<EventName>>>();

  on<K extends EventName>(event: K, listener: Listener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<EventName>);
    return () => this.off(event, listener);
  }

  off<K extends EventName>(event: K, listener: Listener<K>): void {
    const set = this.listeners.get(event);
    if (set) set.delete(listener as Listener<EventName>);
  }

  emit<K extends EventName>(event: K, payload: EventPayload<K>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        (listener as Listener<K>)(payload);
      } catch (err) {
        console.error(`[EventBus] Listener for "${event}" threw:`, err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = new EventBus();
