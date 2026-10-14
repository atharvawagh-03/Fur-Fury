import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AnukiModel } from '../src/character/AnukiModel';
import { AnukiAnimator } from '../src/character/AnukiAnimator';
import { CombatSystem } from '../src/combat/CombatSystem';
import { CombatVFX } from '../src/combat/CombatVFX';
import { DamageableDummy, DamageableCrate } from '../src/combat/DamageableProp';
import { AudioManager } from '../src/audio/AudioManager';
import { CameraManager } from '../src/camera/CameraManager';

// Mock browser DOM environment if running in headless node
if (typeof document === 'undefined') {
  (globalThis as unknown as { document: unknown }).document = {
    createElement: () => ({
      getContext: () => ({
        fillStyle: '',
        fillRect: () => {},
        fillText: () => {},
        strokeText: () => {},
        measureText: () => ({ width: 40 }),
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
        clearRect: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      }),
      style: {},
      width: 1920,
      height: 1080,
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };
}

if (typeof window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1920,
    innerHeight: 1080,
  };
}

describe('Step 5: Sword Combat & Player Abilities', () => {
  function createTestCombatContext() {
    const scene = new THREE.Scene();
    const model = new AnukiModel();
    scene.add(model.getRoot());
    const animator = new AnukiAnimator(model.getRig());
    const vfx = new CombatVFX(scene);
    const audioManager = new AudioManager();
    const cameraManager = new CameraManager();
    const combat = new CombatSystem(model, animator, vfx, audioManager, cameraManager);
    return { scene, model, animator, vfx, audioManager, cameraManager, combat };
  }

  it('1. Executes 3-hit light combo sequence with proper stamina costs', () => {
    const { combat, animator } = createTestCombatContext();
    const mockCamera = new THREE.PerspectiveCamera();

    // Step 1: Moonfang Cross-Slash
    const res1 = combat.executeLightAttack(100);
    assert.equal(res1.success, true);
    assert.equal(res1.staminaCost, 12);
    assert.equal(combat.isAttacking(), true);
    assert.equal(animator.getState(), 'ATTACK_LIGHT_1');

    // Advance attack duration past completion
    combat.update(0.40, mockCamera);
    assert.equal(combat.isAttacking(), false);

    // Step 2: Backhand Cleave
    const res2 = combat.executeLightAttack(100);
    assert.equal(res2.success, true);
    assert.equal(res2.staminaCost, 14);
    assert.equal(animator.getState(), 'ATTACK_LIGHT_2');

    combat.update(0.45, mockCamera);
    assert.equal(combat.isAttacking(), false);

    // Step 3: Rising Spin Leap Finisher
    const res3 = combat.executeLightAttack(100);
    assert.equal(res3.success, true);
    assert.equal(res3.staminaCost, 20);
    assert.equal(animator.getState(), 'ATTACK_LIGHT_3');

    combat.update(0.60, mockCamera);
    assert.equal(combat.isAttacking(), false);

    // Next light attack wraps back to Step 1
    const res4 = combat.executeLightAttack(100);
    assert.equal(res4.success, true);
    assert.equal(animator.getState(), 'ATTACK_LIGHT_1');
  });

  it('2. Resets combo chain if delay exceeds combo window', () => {
    const { combat } = createTestCombatContext();
    const mockCamera = new THREE.PerspectiveCamera();

    combat.executeLightAttack(100);
    combat.update(0.40, mockCamera);

    // Wait longer than COMBO_WINDOW (1.25s)
    combat.update(1.5, mockCamera);

    // Attack should restart at Step 1 rather than Step 2
    const res = combat.executeLightAttack(100);
    assert.equal(res.success, true);
    assert.equal(res.staminaCost, 12); // Light 1 stamina cost
  });

  it('3. Executes Heavy Breaker Strike and resets combo chain', () => {
    const { combat, animator } = createTestCombatContext();
    const mockCamera = new THREE.PerspectiveCamera();

    // Perform light attack 1
    combat.executeLightAttack(100);
    combat.update(0.40, mockCamera);

    // Execute heavy attack
    const heavyRes = combat.executeHeavyAttack(100);
    assert.equal(heavyRes.success, true);
    assert.equal(heavyRes.staminaCost, 26);
    assert.equal(animator.getState(), 'ATTACK_HEAVY');

    combat.update(0.65, mockCamera);
    assert.equal(combat.isAttacking(), false);

    // Next light attack should be Step 1
    const nextLight = combat.executeLightAttack(100);
    assert.equal(nextLight.success, true);
    assert.equal(nextLight.staminaCost, 12);
  });

  it('4. Rejects attacks when stamina is insufficient', () => {
    const { combat } = createTestCombatContext();

    // Light 1 requires 12 stamina
    const resLight = combat.executeLightAttack(5);
    assert.equal(resLight.success, false);

    // Heavy requires 26 stamina
    const resHeavy = combat.executeHeavyAttack(15);
    assert.equal(resHeavy.success, false);
  });

  it('5. Timed parry window activates, parries incoming strike, and opens Riposte', () => {
    const { combat, animator } = createTestCombatContext();
    const mockCamera = new THREE.PerspectiveCamera();

    // Trigger timed parry (Q key)
    const parryRes = combat.executeParry();
    assert.equal(parryRes, true);
    assert.equal(combat.isParrying(), true);
    assert.equal(animator.getState(), 'PARRY');

    // Simulate incoming attack during parry window
    const parrySuccess = combat.handleIncomingAttack(30, 20);
    assert.equal(parrySuccess.deflected, true);
    assert.equal(parrySuccess.damageTaken, 0);

    // Riposte window is now active
    const stats = combat.getStats();
    assert.equal(stats.riposteActive, true);

    // Triggering light attack now executes critical Riposte
    const riposteRes = combat.executeLightAttack(100);
    assert.equal(riposteRes.success, true);
    assert.equal(combat.getStats().riposteActive, false); // Riposte consumed

    combat.update(0.6, mockCamera);
  });

  it('6. Guard block mitigates incoming damage and consumes stamina', () => {
    const { combat, animator } = createTestCombatContext();

    // Raise Guard
    combat.setGuarding(true);
    assert.equal(combat.isBlocking(), true);
    assert.equal(animator.getState(), 'GUARD');

    // Block incoming strike (damage 40, poise 20) with 50 stamina
    const blockRes = combat.handleIncomingAttack(40, 20, 50);
    assert.equal(blockRes.deflected, false);
    assert.equal(blockRes.blocked, true);
    assert.equal(blockRes.damageTaken, 6); // 85% damage mitigation: 40 * 0.15 = 6
    assert.equal(blockRes.staminaCost, 16); // 20 poise * 0.8 = 16 stamina

    // Guard break when stamina is zero or less
    const breakRes = combat.handleIncomingAttack(40, 50, 10);
    assert.equal(breakRes.guardBroken, true);

    combat.setGuarding(false);
  });

  it('7. Consumable Elixir restores health and decrements charges', () => {
    const { combat, animator } = createTestCombatContext();
    const mockCamera = new THREE.PerspectiveCamera();

    const statsInitial = combat.getStats();
    assert.equal(statsInitial.elixirCount, 3);

    // Drink elixir (H key)
    const healRes = combat.executeHeal(50, 100);
    assert.equal(healRes.success, true);
    assert.equal(healRes.amountHealed, 40);
    assert.equal(animator.getState(), 'HEAL');

    // Healing completes after drink duration
    combat.update(0.8, mockCamera);
    const statsAfter = combat.getStats();
    assert.equal(statsAfter.elixirCount, 2);

    // Use remaining elixirs until empty
    combat.executeHeal(50, 100);
    combat.update(0.8, mockCamera);
    combat.executeHeal(50, 100);
    combat.update(0.8, mockCamera);

    // No elixirs remaining
    const emptyRes = combat.executeHeal(50, 100);
    assert.equal(emptyRes.success, false);
  });

  it('8. Damageable Dummy takes damage, triggers spring wobble physics, and breaks poise', () => {
    const dummyGroup = new THREE.Group();
    const torsoMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.3, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: 0x9c8868 })
    );
    torsoMesh.position.y = 1.5;
    dummyGroup.add(torsoMesh);

    const dummy = new DamageableDummy(dummyGroup, 'Test Pell');
    assert.equal(dummy.isAlive(), true);
    assert.equal(dummy.getHitboxRadius(), 0.75);

    // Strike dummy with heavy attack (35 damage, 50 poise damage)
    const hitResult = dummy.takeDamage(35, 50, new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 0, -1), true);
    assert.equal(hitResult.hit, true);
    assert.equal(hitResult.damageDealt, 35);
    assert.equal(hitResult.poiseBroken, true); // 50 poise damage breaks 45 max poise

    // Update spring wobble physics
    dummy.update(0.016);
    assert.notEqual(dummyGroup.rotation.x, 0); // Wobble angular deflection active
  });

  it('9. Damageable Crate takes damage and applies physical impulse', () => {
    const crateGroup = new THREE.Group();
    let appliedImpulse: { x: number; y: number; z: number } | null = null;
    const mockBody = {
      applyImpulse: (imp: { x: number; y: number; z: number }) => {
        appliedImpulse = imp;
      },
      applyTorqueImpulse: () => {},
    } as unknown as import('@dimforge/rapier3d-compat').RigidBody;

    const crate = new DamageableCrate(crateGroup, mockBody, 'Breakable Crate');
    const res = crate.takeDamage(25, 10, new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0, 1), false);

    assert.equal(res.hit, true);
    assert.equal(res.damageDealt, 25);
    assert.notEqual(appliedImpulse, null);
  });

  it('10. Hitbox tracing detects targets within forward blade sweep arc', () => {
    const { model, combat } = createTestCombatContext();
    const mockCamera = new THREE.PerspectiveCamera();

    // Place dummy directly in front of Anuki (Anuki faces -Z)
    model.getRoot().position.set(0, 0, 0);
    model.getRoot().rotation.y = 0; // Forward is -Z

    const targetDummyGroup = new THREE.Group();
    targetDummyGroup.position.set(0, 0, -1.0); // 1.0m ahead
    const targetDummy = new DamageableDummy(targetDummyGroup, 'In-Front Pell');
    combat.registerTarget(targetDummy);

    // Place dummy behind Anuki (should NOT be hit due to forward arc)
    const behindDummyGroup = new THREE.Group();
    behindDummyGroup.position.set(0, 0, 1.5);
    const behindDummy = new DamageableDummy(behindDummyGroup, 'Behind Pell');
    combat.registerTarget(behindDummy);

    combat.executeLightAttack(100);

    // Simulate swing across hit window
    combat.update(0.15, mockCamera);
    combat.update(0.10, mockCamera); // inside hit window (0.25 - 0.65 of duration)

    const stats = combat.getStats();
    assert.ok(stats.totalDamageDealt > 0, 'Target in front received damage');
  });
});
