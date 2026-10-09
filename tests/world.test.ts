import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PhysicsWorld } from '../src/physics/PhysicsWorld';
import { GrandArena } from '../src/world/GrandArena';
import { PropFactory } from '../src/world/PropFactory';
import { ArenaMaterials } from '../src/world/ArenaMaterials';
import { CameraManager } from '../src/camera/CameraManager';
import { ArenaCameraController } from '../src/camera/ArenaCameraController';

// Mock document for canvas texture generation in Node environment if missing
if (typeof document === 'undefined') {
  (globalThis as unknown as { document: unknown }).document = {
    createElement: () => ({
      getContext: () => ({
        fillStyle: '',
        fillRect: () => {},
        strokeStyle: '',
        lineWidth: 1,
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        ellipse: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
      }),
      width: 512,
      height: 512,
    }),
  };
}

describe('ArenaMaterials & Textures', () => {
  it('creates PBR materials with proper roughness, metalness, and maps', () => {
    const limestone = ArenaMaterials.createLimestoneMaterial();
    assert.equal(limestone.roughness, 0.8);
    assert.equal(limestone.metalness, 0.08);

    const iron = ArenaMaterials.createWroughtIronMaterial();
    assert.equal(iron.metalness, 0.85);

    const gold = ArenaMaterials.createBurnishedGoldMaterial();
    assert.equal(gold.metalness, 0.92);
  });
});

describe('PropFactory', () => {
  let pw: PhysicsWorld;

  before(async () => {
    await PhysicsWorld.initialize();
    pw = new PhysicsWorld();
    pw.init();
  });

  it('builds an animated royal banner with cloth wave function', () => {
    const banner = PropFactory.createBanner(true, 2.0, 5.0);
    assert.notEqual(banner.mesh, null);
    assert.equal(typeof banner.update, 'function');
    assert.doesNotThrow(() => banner.update(1.5));
  });

  it('builds a wooden crate with Rapier 3D dynamic body', () => {
    const crate = PropFactory.createCrate(0, 5, 0, 1.0, pw);
    assert.equal(crate.type, 'crate');
    assert.notEqual(crate.body, undefined);
    assert.equal(crate.body!.translation().y, 5);
  });

  it('builds a training pell / dummy with shield and helmet', () => {
    const dummy = PropFactory.createTrainingDummy(0, 0, 0);
    assert.equal(dummy.type, 'dummy');
    assert.ok(dummy.mesh.children.length >= 5);
  });

  it('builds a tournament weapon rack holding weapons', () => {
    const rack = PropFactory.createWeaponRack(0, 0, 0);
    assert.equal(rack.type, 'weaponRack');
    assert.ok(rack.mesh.children.length >= 4);
  });
});

describe('GrandArena Construction', () => {
  let pw: PhysicsWorld;

  before(async () => {
    await PhysicsWorld.initialize();
    pw = new PhysicsWorld();
    pw.init();
  });

  it('builds full arena structure with floor, perimeter, gates, and props', () => {
    const arena = new GrandArena(pw);
    arena.build();

    const root = arena.getRoot();
    assert.ok(root.children.length > 5, 'Arena should contain multiple structural children');

    const props = arena.getProps();
    assert.ok(props.length >= 6, 'Arena should contain tournament props');

    // Update step without errors
    assert.doesNotThrow(() => arena.update(0.016, 1.0));

    arena.dispose();
  });
});

describe('ArenaCameraController & Presets', () => {
  it('smoothly switches presets and computes camera positions', () => {
    const cameraManager = new CameraManager();
    const controller = new ArenaCameraController(cameraManager);

    controller.applyPreset('GATE', true);
    controller.update(0.1);
    const cam = cameraManager.getCamera();
    assert.ok(cam.position.z !== 0 || cam.position.x !== 0);

    controller.applyPreset('ROYAL_BOX', true);
    controller.update(0.1);
    assert.ok(cam.position.y > 0);

    const toggled = controller.toggleAutoOrbit();
    assert.equal(toggled, true);
  });
});
