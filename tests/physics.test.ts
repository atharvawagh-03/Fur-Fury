import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PhysicsWorld } from '../src/physics/PhysicsWorld';

describe('Rapier 3D Physics Subsystem', () => {
  let physicsWorld: PhysicsWorld;

  before(async () => {
    await PhysicsWorld.initialize();
  });

  it('initializes WASM physics world instance', () => {
    physicsWorld = new PhysicsWorld();
    physicsWorld.init();
    assert.equal(physicsWorld.ready, true);
    assert.notEqual(physicsWorld.getRawWorld(), null);
  });

  it('creates static floor collider and dynamic falling body with downward gravity', () => {
    physicsWorld = new PhysicsWorld();
    physicsWorld.init();

    // Floor collider
    const floor = physicsWorld.createStaticBox(0, 0, 0, 10, 0.5, 10);
    assert.notEqual(floor, null);

    // Dynamic sphere dropped from y = 10
    const ball = physicsWorld.createDynamicSphere(0, 10, 0, 0.5);
    assert.notEqual(ball, null);

    const initialY = ball!.body.translation().y;
    assert.ok(Math.abs(initialY - 10) < 0.01);

    // Step simulation 15 steps
    for (let i = 0; i < 15; i++) {
      physicsWorld.step();
    }

    const afterY = ball!.body.translation().y;
    assert.ok(afterY < initialY, `Expected afterY (${afterY}) < initialY (${initialY})`);

    physicsWorld.dispose();
  });
});
