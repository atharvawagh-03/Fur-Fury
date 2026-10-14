import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GarrickMaterials } from '../src/enemy/GarrickMaterials';
import { GarrickModel } from '../src/enemy/GarrickModel';
import { GarrickAnimator } from '../src/enemy/GarrickAnimator';
import { GarrickAI } from '../src/enemy/GarrickAI';
import { AudioManager } from '../src/audio/AudioManager';
import { CameraManager } from '../src/camera/CameraManager';

// Mock headless browser environment
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
        closePath: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      }),
      style: {},
      width: 512,
      height: 512,
    }),
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

describe('Step 6: Human Knight Enemies & Intelligent AI', () => {
  it('1. GarrickMaterials & PBR Textures conform to PRD Section 12', () => {
    const ironMat = GarrickMaterials.createHeavyIronPlateMaterial();
    assert.equal(ironMat.metalness, 0.82);
    assert.equal(ironMat.roughness, 0.38);

    const bladeMat = GarrickMaterials.createHalberdBladeMaterial();
    assert.equal(bladeMat.metalness, 0.92);
    assert.equal(bladeMat.roughness, 0.22);

    const faceMat = GarrickMaterials.createFaceMaterial();
    assert.ok(faceMat.map !== null);
  });

  it('2. GarrickModel builds complete articulated human knight rig & halberd', () => {
    const model = new GarrickModel();
    const rig = model.getRig();

    assert.ok(rig.root !== null);
    assert.ok(rig.hips !== null);
    assert.ok(rig.chest !== null);
    assert.ok(rig.head !== null);
    assert.ok(rig.helmet !== null);
    assert.ok(rig.rightHand !== null);
    assert.ok(rig.halberd !== null);
    assert.ok(rig.halberdBlade !== null);
    assert.ok(rig.halberdTip !== null);

    const tipPos = new THREE.Vector3();
    model.getHalberdTipWorldPosition(tipPos);
    assert.ok(!isNaN(tipPos.x));
  });

  it('3. GarrickAnimator manages procedural combat poses and transitions', () => {
    const model = new GarrickModel();
    const animator = new GarrickAnimator(model.getRig());

    animator.setState('IDLE_GUARD', 1.0);
    assert.equal(animator.getState(), 'IDLE_GUARD');
    animator.update(0.1);

    animator.setState('TELEGRAPH_SWEEP', 0.8);
    assert.equal(animator.getState(), 'TELEGRAPH_SWEEP');
    animator.update(0.4);
    assert.ok(animator.getProgress() > 0.4);

    animator.setState('ATTACK_SLAM', 0.5);
    assert.equal(animator.getState(), 'ATTACK_SLAM');
    animator.update(0.2);

    animator.setState('DEFEATED_KNEEL', 2.0);
    assert.equal(animator.getState(), 'DEFEATED_KNEEL');
    animator.update(1.0);
  });

  it('4. GarrickAI initializes with 350 HP, 100 Poise, Phase 1 Guard stance', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    const stats = ai.getBossStats();
    assert.equal(stats.name, 'SIR GARRICK IRONJAW');
    assert.equal(stats.title, 'The Gatekeeper');
    assert.equal(stats.health, 350);
    assert.equal(stats.maxHealth, 350);
    assert.equal(stats.poise, 100);
    assert.equal(stats.phase, 1);
    assert.equal(stats.state, 'IDLE_GUARD');
    assert.equal(ai.isAlive(), true);
  });

  it('5. GarrickAI approaches player when far away and attacks when in range', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    model.getRoot().position.set(0, 0, 0);
    const distantPlayer = new THREE.Vector3(0, 0, 6.0); // 6m away

    // Update past cooldown -> transitions to APPROACH
    ai.update(1.5, distantPlayer);
    assert.equal(ai.getBossStats().state, 'APPROACH');

    // Simulate approach closer to player
    model.getRoot().position.set(0, 0, 3.5);
    const closePlayer = new THREE.Vector3(0, 0, 5.0); // 1.5m away
    ai.update(0.1, closePlayer);

    // Within reach -> transitions to telegraph attack
    const state = ai.getBossStats().state;
    assert.ok(state === 'TELEGRAPH_SWEEP' || state === 'TELEGRAPH_SLAM');
  });

  it('6. Telegraphed Ground Slam transitions into PRD Punish Recovery Window (1.4s)', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    // Damage player callback hook
    let playerHit = false;
    ai.onAttackPlayerHit = () => {
      playerHit = true;
    };

    model.getRoot().position.set(0, 0, 0);
    model.getRoot().rotation.y = 0; // facing +Z
    const playerInFront = new THREE.Vector3(0, 0, 1.5); // directly in front

    // Force slam attack
    (ai as unknown as { startTelegraph: (atk: unknown) => void }).startTelegraph((ai as unknown as { attacks: { SLAM: unknown } }).attacks.SLAM);
    assert.equal(ai.getBossStats().state, 'TELEGRAPH_SLAM');

    // Advance past telegraph duration (1.05s)
    ai.update(1.1, playerInFront);
    assert.equal(ai.getBossStats().state, 'ATTACK_SLAM');

    // Advance through attack strike frame (0.25s)
    ai.update(0.25, playerInFront);
    assert.equal(playerHit, true);

    // Advance past attack completion (0.25s more) -> enters 1.4s Punish Recovery
    ai.update(0.25, playerInFront);
    assert.equal(ai.getBossStats().state, 'PUNISH_RECOVERY');
  });

  it('7. Player attacks deplete poise and trigger Stagger vulnerability (1.8s)', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    // Strike Garrick with heavy attacks (55 poise damage each)
    const res1 = ai.takeDamage(40, 55, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), true);
    assert.equal(res1.hit, true);
    assert.equal(res1.poiseBroken, false);
    assert.equal(ai.getBossStats().poise, 45);

    // Second heavy attack breaks remaining 45 poise
    const res2 = ai.takeDamage(40, 55, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), true);
    assert.equal(res2.poiseBroken, true);
    assert.equal(ai.getBossStats().state, 'STAGGERED');
    assert.equal(ai.getBossStats().isStaggered, true);
  });

  it('8. Boss parried by player immediately triggers deflection and stagger', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    ai.onParriedByPlayer();
    assert.equal(ai.getBossStats().state, 'STAGGERED');
    assert.equal(ai.getBossStats().poise, 50); // 50 poise damage from parry
  });

  it('9. Reaching 50% HP triggers Phase 2 Enraged state transition', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    // Deal 180 damage (350 - 180 = 170 HP <= 175)
    ai.takeDamage(180, 20, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), false);
    assert.equal(ai.getBossStats().phase, 2);
    assert.equal(ai.getBossStats().state, 'TRANSITION_PHASE_2');
  });

  it('10. Reaching 0 HP triggers Honorable Defeat Surrender Kneel (no death/deletion)', () => {
    const model = new GarrickModel();
    const audio = new AudioManager();
    const camera = new CameraManager();
    const ai = new GarrickAI(model, audio, camera);

    // Deal lethal damage
    const res = ai.takeDamage(400, 100, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), true);
    assert.equal(res.currentHealth, 0);
    assert.equal(ai.getBossStats().state, 'DEFEATED_KNEEL');
    assert.equal(ai.getBossStats().isDefeated, true);
    assert.equal(ai.isAlive(), false);

    // Updating keeps him kneeling honorably
    ai.update(1.0, new THREE.Vector3(0, 0, 2));
    assert.equal(ai.getBossStats().state, 'DEFEATED_KNEEL');
  });
});
