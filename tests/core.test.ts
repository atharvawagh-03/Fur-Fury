import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import { Time } from '../src/core/Time';
import { SaveManager } from '../src/save/SaveManager';
import { DefaultKeyBindings } from '../src/input/InputManager';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();
  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  public removeItem(key: string): void {
    this.store.delete(key);
  }
  public clear(): void {
    this.store.clear();
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = new MockLocalStorage();
}

describe('EventBus Subsystem', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = EventBus.getInstance();
    bus.clear();
  });

  it('delivers typed payloads to registered subscribers', () => {
    let captured = '';
    const unbind = bus.on<string>('HERO_SPAWNED', (name) => {
      captured = name;
    });

    bus.emit('HERO_SPAWNED', 'Lady Anuki');
    assert.equal(captured, 'Lady Anuki');

    // Test unbind
    unbind();
    bus.emit('HERO_SPAWNED', 'Ignored Name');
    assert.equal(captured, 'Lady Anuki');
  });

  it('handles multiple listeners cleanly', () => {
    let countA = 0;
    let countB = 0;
    bus.on('CREST_DROP', () => countA++);
    bus.on('CREST_DROP', () => countB++);

    bus.emit('CREST_DROP');
    assert.equal(countA, 1);
    assert.equal(countB, 1);
  });
});

describe('Time Engine & Delta Clamping', () => {
  it('computes delta time and clamps spikes to 100ms maximum', () => {
    const time = new Time();
    time.update(1000);
    time.update(1016.6); // ~16.6ms normal 60fps frame

    assert.ok(time.deltaTime > 0);
    assert.ok(time.deltaTime < 0.05);
    assert.equal(time.frameCount, 2);

    // Extreme jump (e.g. 5 seconds tab switch) must be clamped to 100ms
    time.update(6016.6);
    assert.equal(time.deltaTime, 0.1);
  });
});

describe('SaveManager & Persistence Schema', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default PRD hero and empty seals', () => {
    const sm = new SaveManager();
    const data = sm.getData();
    assert.equal(data.characterName, 'Anuki');
    assert.deepEqual(data.oathSeals, []);
    assert.equal(data.upgrades.swiftPawLevel, 0);
    assert.equal(data.upgrades.silverClawLevel, 0);
    assert.equal(data.upgrades.dragonheartLevel, 0);
  });

  it('persists and recovers boss progress and upgrades', () => {
    const sm = new SaveManager();
    sm.save({
      oathSeals: ['Sir Garrick Ironjaw'],
      upgrades: {
        swiftPawLevel: 2,
        silverClawLevel: 3,
        dragonheartLevel: 1,
      },
    });

    const reloaded = sm.load();
    assert.ok(reloaded.oathSeals.includes('Sir Garrick Ironjaw'));
    assert.equal(reloaded.upgrades.silverClawLevel, 3);
  });
});

describe('Input Mappings Specification', () => {
  it('maps essential PRD action keys', () => {
    assert.ok(DefaultKeyBindings.forward.includes('KeyW'));
    assert.ok(DefaultKeyBindings.dodge.includes('Space'));
    assert.ok(DefaultKeyBindings.lightAttack.includes('KeyJ'));
    assert.ok(DefaultKeyBindings.heavyAttack.includes('KeyK'));
    assert.ok(DefaultKeyBindings.parry.includes('KeyQ') || DefaultKeyBindings.parry.includes('KeyF'));
    assert.ok(DefaultKeyBindings.lockOn.includes('KeyR'));
    assert.ok(DefaultKeyBindings.dragonCall.includes('KeyT') || DefaultKeyBindings.dragonCall.includes('KeyX'));
  });
});
