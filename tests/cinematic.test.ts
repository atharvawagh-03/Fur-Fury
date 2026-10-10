/**
 * Automated Unit Tests for OpeningCinematic Sequence Director
 * Tests beat progression, flight banking agency, landing, dismount, and skip handling.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PhysicsWorld } from '../src/physics/PhysicsWorld';
import { AnukiController } from '../src/character/AnukiController';
import { CameraManager } from '../src/camera/CameraManager';
import { InputManager } from '../src/input/InputManager';
import { AudioManager } from '../src/audio/AudioManager';
import { RhazakarModel } from '../src/dragon/RhazakarModel';
import { RhazakarAnimator } from '../src/dragon/RhazakarAnimator';
import { DragonEffects } from '../src/dragon/DragonEffects';
import { OpeningCinematic } from '../src/cinematic/OpeningCinematic';

// Mock browser document & canvas if running in headless node
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
        quadraticCurveTo: () => {},
        bezierCurveTo: () => {},
        setLineDash: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      }),
      width: 512,
      height: 512,
    }),
  };
}

if (typeof window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    innerWidth: 1920,
    innerHeight: 1080,
  };
}

describe('OpeningCinematic Sequence Director', () => {
  let physics: PhysicsWorld;
  let scene: THREE.Scene;
  let cameraManager: CameraManager;
  let inputManager: InputManager;
  let audioManager: AudioManager;
  let anuki: AnukiController;
  let dragon: RhazakarModel;
  let animator: RhazakarAnimator;
  let fx: DragonEffects;
  let cinematic: OpeningCinematic;

  before(async () => {
    await PhysicsWorld.initialize();
    physics = new PhysicsWorld();
    physics.init();
    scene = new THREE.Scene();
    cameraManager = new CameraManager();
    inputManager = new InputManager();
    audioManager = new AudioManager();

    anuki = new AnukiController(scene, physics, inputManager, audioManager, 0, 0, 0);
    dragon = new RhazakarModel();
    scene.add(dragon.getRoot());
    animator = new RhazakarAnimator(dragon);
    fx = new DragonEffects(scene);

    cinematic = new OpeningCinematic(
      dragon,
      animator,
      fx,
      anuki,
      cameraManager,
      audioManager
    );
  });

  it('starts in idle inactive state and plays Beat 1 Cloudbreak', () => {
    assert.strictEqual(cinematic.isPlaying(), false);
    cinematic.play();
    assert.strictEqual(cinematic.isPlaying(), true);
    assert.strictEqual(cinematic.getCurrentBeat(), 'BEAT_1_CLOUDBREAK');
    assert.strictEqual(animator.getState(), 'FLY_GLIDE');
  });

  it('handles player banking input and transitions through beats', () => {
    // Test bank input
    cinematic.handleBankInput(0.8);

    // Fast-forward through Beat 1 to Beat 2
    cinematic.update(9.0);
    assert.strictEqual(cinematic.getCurrentBeat(), 'BEAT_2_GRAND_DIVE');
    assert.strictEqual(animator.getState(), 'DIVE');

    // Fast-forward through Beat 2 to Beat 3 (Touchdown)
    cinematic.update(8.0);
    assert.strictEqual(cinematic.getCurrentBeat(), 'BEAT_3_TOUCHDOWN');

    // Update through touchdown landing
    cinematic.update(3.0);
    assert.strictEqual(animator.getState(), 'TOUCHDOWN_LAND');

    // Advance to sword draw prompt (reaches 5.6s in Beat 3)
    cinematic.update(2.6);
    assert.strictEqual(cinematic.isAwaitingSwordDraw(), true);

    // Trigger sword draw
    cinematic.triggerSwordDraw();
    assert.strictEqual(cinematic.isAwaitingSwordDraw(), false);
    assert.strictEqual(animator.getState(), 'GROUND_ROAR');
  });

  it('fast-forward skips cleanly to duel state with Anuki grounded and Rhazakar on overhead patrol', () => {
    cinematic.play();
    assert.strictEqual(cinematic.isPlaying(), true);

    cinematic.skip();
    assert.strictEqual(cinematic.isPlaying(), false);
    assert.strictEqual(cinematic.getCurrentBeat(), 'COMPLETED');
    assert.strictEqual(animator.getState(), 'OVERHEAD_PATROL');

    // Verify Anuki is positioned on the arena floor (y near 0)
    const anukiPos = anuki.getPosition();
    assert.ok(Math.abs(anukiPos.y) < 1.0, 'Anuki is grounded on the arena floor');
  });
});
