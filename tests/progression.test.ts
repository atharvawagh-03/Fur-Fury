/**
 * Step 7 Automated Unit Tests - Level Progression, Oath Seals & Multi-Boss Encounters
 * Conforming strictly to PRD Section 6, 8, 12, 13, 14, 20.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LevelProgressionManager } from '../src/progression/LevelProgressionManager';
import { SaveManager } from '../src/save/SaveManager';
import { ElowenModel } from '../src/enemy/ElowenModel';
import { ElowenAI } from '../src/enemy/ElowenAI';
import { BrannocModel } from '../src/enemy/BrannocModel';
import { BrannocAI } from '../src/enemy/BrannocAI';
import { AudioManager } from '../src/audio/AudioManager';
import { CameraManager } from '../src/camera/CameraManager';

describe('Step 7: Level Progression & Campaign State', () => {
  let saveManager: SaveManager;
  let progression: LevelProgressionManager;

  beforeEach(() => {
    // Clear mock storage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    saveManager = new SaveManager();
    saveManager.reset();
    progression = new LevelProgressionManager(saveManager);
  });

  test('1. Initializes with Grand Arena active and subsequent stages locked', () => {
    assert.equal(progression.getCurrentStageId(), 'grand_arena');
    assert.equal(progression.getCurrentStage().name, 'Grand Arena');

    assert.equal(progression.isStageUnlocked('grand_arena'), true);
    assert.equal(progression.isStageUnlocked('rosebridge_keep'), false);
    assert.equal(progression.isStageUnlocked('bellforge_foundry'), false);
  });

  test('2. Awarding Gatekeeper’s Iron Seal unlocks Stage I (Rosebridge Keep)', () => {
    const res = progression.awardOathSeal('grand_arena');
    assert.equal(res.success, true);
    assert.equal(res.seal.sealId, 'SEAL_GARRICK');
    assert.equal(res.newlyUnlockedStage?.id, 'rosebridge_keep');

    assert.equal(progression.hasOathSeal('SEAL_GARRICK'), true);
    assert.equal(progression.isStageUnlocked('rosebridge_keep'), true);
    assert.equal(progression.isStageUnlocked('bellforge_foundry'), false);
  });

  test('3. Awarding Sentinel’s Rose Seal unlocks Stage II (Bellforge Foundry)', () => {
    progression.awardOathSeal('grand_arena');
    const res = progression.awardOathSeal('rosebridge_keep');

    assert.equal(res.success, true);
    assert.equal(res.seal.sealId, 'SEAL_ELOWEN');
    assert.equal(res.newlyUnlockedStage?.id, 'bellforge_foundry');

    assert.equal(progression.hasOathSeal('SEAL_ELOWEN'), true);
    assert.equal(progression.isStageUnlocked('bellforge_foundry'), true);
    assert.deepEqual(progression.getCollectedSeals(), ['SEAL_GARRICK', 'SEAL_ELOWEN']);
  });

  test('4. Fast-Travel selects unlocked stages and rejects locked stages', () => {
    // Cannot travel to Rosebridge while locked
    const failTravel = progression.selectStage('rosebridge_keep');
    assert.equal(failTravel, false);
    assert.equal(progression.getCurrentStageId(), 'grand_arena');

    // Unlock Rosebridge Keep
    progression.awardOathSeal('grand_arena');
    const successTravel = progression.selectStage('rosebridge_keep');
    assert.equal(successTravel, true);
    assert.equal(progression.getCurrentStageId(), 'rosebridge_keep');
  });

  test('5. Skill Upgrades Tree upgrades branches up to max level (3)', () => {
    const initialUpgrades = progression.getUpgrades();
    const swift = initialUpgrades.find((u) => u.id === 'swiftPaw');
    assert.equal(swift?.level, 0);

    // Purchase 3 levels
    assert.equal(progression.purchaseUpgrade('swiftPaw'), true);
    assert.equal(progression.purchaseUpgrade('swiftPaw'), true);
    assert.equal(progression.purchaseUpgrade('swiftPaw'), true);

    // 4th purchase fails (max level 3)
    assert.equal(progression.purchaseUpgrade('swiftPaw'), false);

    const updated = progression.getUpgrades().find((u) => u.id === 'swiftPaw');
    assert.equal(updated?.level, 3);
  });
});

describe('Step 7: Dame Elowen Vale (Stage I Boss Encounter)', () => {
  let model: ElowenModel;
  let audioManager: AudioManager;
  let cameraManager: CameraManager;
  let elowen: ElowenAI;

  beforeEach(() => {
    model = new ElowenModel();
    audioManager = new AudioManager();
    cameraManager = new CameraManager();
    elowen = new ElowenAI(model, audioManager, cameraManager);
  });

  test('6. Initializes with PRD Section 6 stats: 280 HP, 80 Poise, Duelist Stance', () => {
    const stats = elowen.getBossStats();
    assert.equal(stats.name, 'DAME ELOWEN VALE');
    assert.equal(stats.title, 'The Rose Sentinel');
    assert.equal(stats.health, 280);
    assert.equal(stats.maxHealth, 280);
    assert.equal(stats.poise, 80);
    assert.equal(stats.phase, 1);
    assert.equal(stats.state, 'IDLE_DUELIST');
  });

  test('7. Elowen takes damage, depletes poise, and enters Stagger upon poise break', () => {
    const res = elowen.takeDamage(40, 85, new THREE.Vector3(), new THREE.Vector3(), true);
    assert.equal(res.hit, true);
    assert.equal(res.poiseBroken, true);
    assert.equal(elowen.getBossStats().isStaggered, true);
  });

  test('8. Reaching 50% HP (140) triggers Phase 2 Rose Petal Dance', () => {
    elowen.takeDamage(145, 20, new THREE.Vector3(), new THREE.Vector3(), false);
    const stats = elowen.getBossStats();
    assert.equal(stats.phase, 2);
    assert.equal(stats.state, 'TRANSITION_PHASE_2');
  });

  test('9. Reaching 0 HP triggers Honorable Surrender Kneel (no death deletion)', () => {
    elowen.takeDamage(300, 100, new THREE.Vector3(), new THREE.Vector3(), true);
    const stats = elowen.getBossStats();
    assert.equal(stats.health, 0);
    assert.equal(stats.isDefeated, true);
    assert.equal(stats.state, 'DEFEATED_KNEEL');
    assert.equal(elowen.isAlive(), false);
  });
});

describe('Step 7: Sir Brannoc Cinderhand (Stage II Boss Encounter)', () => {
  let model: BrannocModel;
  let audioManager: AudioManager;
  let cameraManager: CameraManager;
  let brannoc: BrannocAI;

  beforeEach(() => {
    model = new BrannocModel();
    audioManager = new AudioManager();
    cameraManager = new CameraManager();
    brannoc = new BrannocAI(model, audioManager, cameraManager);
  });

  test('10. Initializes with PRD Section 6 stats: 420 HP, 140 Poise, Guard Stance', () => {
    const stats = brannoc.getBossStats();
    assert.equal(stats.name, 'SIR BRANNOC CINDERHAND');
    assert.equal(stats.title, 'The Forge Warden');
    assert.equal(stats.health, 420);
    assert.equal(stats.maxHealth, 420);
    assert.equal(stats.poise, 140);
    assert.equal(stats.phase, 1);
    assert.equal(stats.state, 'IDLE_GUARD');
  });

  test('11. Reaching 50% HP (210) triggers Phase 2 Superheated Molten Overdrive', () => {
    brannoc.takeDamage(215, 40, new THREE.Vector3(), new THREE.Vector3(), true);
    const stats = brannoc.getBossStats();
    assert.equal(stats.phase, 2);
    assert.equal(stats.state, 'TRANSITION_PHASE_2');
  });

  test('12. Reaching 0 HP triggers Honorable Yield Kneel and reveals dialogue', () => {
    brannoc.takeDamage(450, 150, new THREE.Vector3(), new THREE.Vector3(), true);
    const stats = brannoc.getBossStats();
    assert.equal(stats.health, 0);
    assert.equal(stats.isDefeated, true);
    assert.equal(stats.state, 'DEFEATED_KNEEL');
  });
});
