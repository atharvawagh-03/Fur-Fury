/**
 * Type-Safe Event Bus for decoupled communication between game systems.
 */

export type GameEventCallback<T = unknown> = (payload: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<GameEventCallback<any>>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T = unknown>(event: string, callback: GameEventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unbind handler
    return () => this.off(event, callback);
  }

  public off<T = unknown>(event: string, callback: GameEventCallback<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = unknown>(event: string, payload?: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
