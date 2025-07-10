import { EventType, VectorizationEvent, EventHandler } from './types';

/**
 * 事件总线
 * @class EventBus
 */
export class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  subscribe(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  unsubscribe(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.handlers.set(type, handlers);
    }
  }

  async publish(event: VectorizationEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler.handle(event)));
  }
}