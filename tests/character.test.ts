import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PhysicsWorld } from '../src/physics/PhysicsWorld';
import { AnukiMaterials } from '../src/character/AnukiMaterials';
import { AnukiModel } from '../src/character/AnukiModel';
import { AnukiAnimator } from '../src/character/AnukiAnimator';
import { AnukiController } from '../src/character/AnukiController';
import { ThirdPersonCamera } from '../src/camera/ThirdPersonCamera';
import { CameraManager } from '../src/camera/CameraManager';
import { InputManager } from '../src/input/InputManager';
import { AudioManager } from '../src/audio/AudioManager';

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

describe('AnukiMaterials & PBR Properties', () => {
  it('creates PBR materials conforming to PRD specifications', () => {
    const furMat = AnukiMaterials.createFurMaterial();
    assert.equal(furMat.roughness, 0.85);
    assert.equal(furMat.metalness, 0.05);

    const eyeMat = AnukiMaterials.createEyeMaterial();
    assert.equal(eyeMat.roughness, 0.05);

    const armorMat = AnukiMaterials.createSilverArmorMaterial();
    assert.equal(armorMat.metalness, 0.9);

    const capeMat = AnukiMaterials.createCapeMaterial();
    assert.equal(capeMat.side, THREE.DoubleSide);

    const bowMat = AnukiMaterials.createPinkBowMaterial();
    assert.equal(bowMat.color.getHexString(), 'f8a5c2');

    const bladeMat = AnukiMaterials.createSteelBladeMaterial();
    assert.equal(bladeMat.metalness, 0.98);
  });
});

describe('AnukiModel Articulated Rig', () => {
  it('builds Lady Anuki complete hierarchical rig with all required bones and accessories', () => {
    const model = new AnukiModel();
    const rig = model.getRig();

    // Verify vital rig joints
    assert.ok(rig.root, 'Rig must contain root group');
    assert.ok(rig.hips, 'Rig must contain hips');
    assert.ok(rig.spine, 'Rig must contain spine');
    assert.ok(rig.chest, 'Rig must contain chest');
    assert.ok(rig.head, 'Rig must contain head');
    assert.ok(rig.bow, 'Rig must contain pink ear bow');
    assert.ok(rig.leftEar && rig.rightEar, 'Rig must contain both ears');
    assert.ok(rig.leftEye && rig.rightEye, 'Rig must contain expressive sapphire eyes');

    // Limbs & gauntlets
    assert.ok(rig.leftArm && rig.rightArm, 'Rig must contain arms');
    assert.ok(rig.leftForearm && rig.rightForearm, 'Rig must contain forearms with gauntlets');
    assert.ok(rig.leftThigh && rig.rightThigh, 'Rig must contain thighs');
    assert.ok(rig.leftCalf && rig.rightCalf, 'Rig must contain calves with greaves');

    // Tail & Cape
    assert.equal(rig.tailSegments.length, 5, 'Tail must have 5 articulated segments');
    assert.equal(rig.capeBones.length, 4, 'Cape must have 4 cloth bone segments');
    assert.ok(rig.capeMesh, 'Cape must contain dynamic cloth mesh');

    // Weapon & Scabbard
    assert.ok(rig.swordMesh, 'Must carry Moonfang knight sword');
    assert.ok(rig.scabbardMesh, 'Must carry hip scabbard');
    assert.equal(rig.swordMesh.name, 'Weapon_Moonfang');
  });
});

describe('AnukiAnimator State Machine', () => {
  it('manages locomotion states, transitions, and procedural updates cleanly', () => {
    const model = new AnukiModel();
    const animator = new AnukiAnimator(model.getRig());

    assert.equal(animator.getState(), 'IDLE');

    // State changes
    animator.setState('WALK');
    animator.update(0.016, 2.5);
    animator.update(0.2, 2.5);
    assert.equal(animator.getState(), 'WALK');

    animator.setState('SPRINT');
    animator.update(0.2, 6.0);
    assert.equal(animator.getState(), 'SPRINT');

    animator.setState('DODGE');
    animator.update(0.2, 8.0);
    assert.equal(animator.getState(), 'DODGE');

    // Attack state
    animator.setState('ATTACK_LIGHT');
    animator.update(0.2, 0);
    assert.equal(animator.getState(), 'ATTACK_LIGHT');

    // Parry state
    animator.setState('PARRY');
    animator.update(0.2, 0);
    assert.equal(animator.getState(), 'PARRY');
  });
});

describe('ThirdPersonCamera', () => {
  it('tracks hero target, calculates chase position, and clamps collision bounds', () => {
    const cm = new CameraManager();
    const tpc = new ThirdPersonCamera(cm);

    const targetGroup = new THREE.Group();
    targetGroup.position.set(2, 0, 3);
    tpc.setTarget(targetGroup);

    tpc.update(0.016);
    assert.ok(cm.getCamera().position.length() > 0, 'Camera position must be populated');

    // Lock-on toggle
    const locked = tpc.toggleLockOn(new THREE.Vector3(0, 1.2, 0));
    assert.equal(locked, true);
    assert.equal(tpc.lockedOn, true);
    assert.ok(tpc.getLockOnPoint(), 'Lock on point must be set');

    tpc.update(0.016);
    assert.ok(cm.getCamera().position.y >= 0.35, 'Camera floor collision clamp must hold');
  });
});

describe('AnukiController & Kinematic Rapier Physics', () => {
  let pw: PhysicsWorld;

  before(async () => {
    await PhysicsWorld.initialize();
    pw = new PhysicsWorld();
    pw.init();
  });

  it('spawns Lady Anuki with Rapier capsule and manages stats and stamina', () => {
    const scene = new THREE.Scene();
    const input = new InputManager();
    const audio = new AudioManager();

    const anuki = new AnukiController(scene, pw, input, audio, 0, 0, 0);
    const stats = anuki.getStats();

    assert.equal(stats.health, 100);
    assert.equal(stats.stamina, 100);
    assert.equal(stats.isInvulnerable, false);
    assert.equal(stats.state, 'IDLE');

    // Step physics & controller
    anuki.update(0.016, 0);
    anuki.fixedUpdate(1 / 60);

    const pos = anuki.getPosition();
    assert.ok(!isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z));

    anuki.dispose();
    input.detach();
  });
});
