/**
 * Automated Unit Tests for Rhazakar Dragon Subsystem
 * Tests materials, articulated 3D skeletal rig, procedural kinematics, and VFX.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';

// Provide canvas mock in Node test environment if not present
if (typeof document === 'undefined') {
  (global as unknown as { document: unknown }).document = {
    createElement: () => ({
      getContext: () => ({
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        bezierCurveTo: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        save: () => {},
        restore: () => {},
        arc: () => {},
        ellipse: () => {},
      }),
      width: 512,
      height: 512,
    }),
  };
}

import { RhazakarMaterials } from '../src/dragon/RhazakarMaterials';
import { RhazakarModel } from '../src/dragon/RhazakarModel';
import { RhazakarAnimator } from '../src/dragon/RhazakarAnimator';
import { DragonEffects } from '../src/dragon/DragonEffects';

describe('RhazakarMaterials & PBR Properties', () => {
  it('creates PBR scarlet scales, obsidian horns, and leathery wings conforming to PRD Section 10', () => {
    const scales = RhazakarMaterials.createScarletScalesMaterial();
    assert.strictEqual(scales.color.getHex(), 0xba1a1a);
    assert.strictEqual(scales.roughness, 0.52);

    const horns = RhazakarMaterials.createHornMaterial();
    assert.strictEqual(horns.roughness, 0.38);

    const wings = RhazakarMaterials.createWingMembraneMaterial();
    assert.strictEqual(wings.side, THREE.DoubleSide);

    const eyes = RhazakarMaterials.createAmberEyeMaterial();
    assert.ok(eyes.emissive.getHex() > 0);
  });
});

describe('RhazakarModel Articulated 3D Dragon Rig', () => {
  it('builds full skeletal hierarchy including wings, serpentine neck, talons, and horn mount socket', () => {
    const dragon = new RhazakarModel();
    const rig = dragon.getRig();

    assert.ok(rig.root, 'Master root bone exists');
    assert.ok(rig.pelvis, 'Pelvis exists');
    assert.ok(rig.chest, 'Chest exists');
    assert.ok(rig.neck1 && rig.neck2 && rig.neck3, 'Multi-segment neck exists');
    assert.ok(rig.head, 'Head exists');
    assert.ok(rig.jaw, 'Hinged jaw exists');
    assert.ok(rig.perchSocket, 'Dedicated perch socket for Lady Anuki exists');

    // Wings
    assert.ok(rig.wingShoulderL && rig.wingElbowL && rig.wingWristL, 'Left wing bones exist');
    assert.ok(rig.wingShoulderR && rig.wingElbowR && rig.wingWristR, 'Right wing bones exist');
    assert.strictEqual(rig.wingFingersL.length, 4, 'Left wing has 4 finger phalanges');
    assert.strictEqual(rig.wingFingersR.length, 4, 'Right wing has 4 finger phalanges');

    // Legs
    assert.ok(rig.frontThighL && rig.frontFootL, 'Front left leg exists');
    assert.ok(rig.hindThighR && rig.hindFootR, 'Hind right leg exists');

    // Tail
    assert.ok(rig.tailSegments.length >= 5, 'Tail has at least 5 articulated segments');

    // Perch position extraction
    const perchWorld = new THREE.Vector3();
    dragon.getPerchWorldPosition(perchWorld);
    assert.ok(typeof perchWorld.y === 'number');
  });
});

describe('RhazakarAnimator Kinematic State Machine', () => {
  it('manages flight, flapping, dive, touchdown, roar, and patrol updates cleanly', () => {
    const dragon = new RhazakarModel();
    const animator = new RhazakarAnimator(dragon);

    assert.strictEqual(animator.getState(), 'FLY_GLIDE');

    // Update glide
    animator.update(0.016);

    // Switch to Dive
    animator.setState('DIVE');
    animator.setBankAngle(0.35);
    animator.update(0.016);
    assert.strictEqual(animator.getState(), 'DIVE');

    // Switch to Flare Brake
    animator.setState('FLARE_BRAKE');
    animator.update(0.016);
    assert.strictEqual(animator.getState(), 'FLARE_BRAKE');

    // Switch to Touchdown
    animator.setState('TOUCHDOWN_LAND');
    animator.update(0.016);
    assert.strictEqual(animator.getState(), 'TOUCHDOWN_LAND');

    // Switch to Roar
    animator.setState('GROUND_ROAR');
    animator.update(0.016);
    assert.strictEqual(animator.getState(), 'GROUND_ROAR');

    // Switch to Overhead Patrol
    animator.setState('OVERHEAD_PATROL');
    animator.update(0.016);
    assert.strictEqual(animator.getState(), 'OVERHEAD_PATROL');

    // Root position should be elevated in the sky during overhead patrol
    const rootPos = dragon.getRoot().position;
    assert.ok(rootPos.y > 20, 'Dragon altitude should be above 20m in overhead patrol');
  });
});

describe('DragonEffects Subsystem', () => {
  it('initializes speed lines, triggers touchdown shockwave and clears resources', () => {
    const scene = new THREE.Scene();
    const fx = new DragonEffects(scene);

    fx.setSpeedLinesActive(true, 1.0);
    fx.update(0.016, new THREE.Vector3(0, 20, 0));

    fx.triggerTouchdownImpact(new THREE.Vector3(0, 0, 0));
    fx.update(0.016);

    fx.dispose();
  });
});
