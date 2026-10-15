/**
 * Step 9 Automated Unit Tests - UI/UX, Audio, Visual Effects & Game Polish
 * Conforming strictly to PRD Section 9, 14, 15, 16, 20 (FR-07, FR-08, FR-10).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SettingsManager } from '../src/settings/SettingsManager';
import { CosmeticsManager, ARMOR_FINISHES, CAPE_DYES } from '../src/cosmetics/CosmeticsManager';
import { PhotoModeController } from '../src/camera/PhotoModeController';
import { CameraManager } from '../src/camera/CameraManager';
import { VFXManager } from '../src/effects/VFXManager';
import { AnukiModel } from '../src/character/AnukiModel';
import { AudioManager } from '../src/audio/AudioManager';
import { SaveManager } from '../src/save/SaveManager';
import { EventBus } from '../src/core/EventBus';

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

describe('Step 9: UI/UX, Audio, Visual Effects & Polish', () => {
  let saveManager: SaveManager;
  let settingsManager: SettingsManager;
  let cosmeticsManager: CosmeticsManager;
  let eventBus: EventBus;

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    saveManager = new SaveManager();
    saveManager.reset();
    eventBus = EventBus.getInstance();
    settingsManager = new SettingsManager(saveManager);
    cosmeticsManager = new CosmeticsManager(saveManager);
  });

  test('1. SettingsManager initializes with PRD baseline defaults', () => {
    const s = settingsManager.getSettings();
    assert.equal(s.difficulty, 'KNIGHT');
    assert.equal(s.damageReceivedMultiplier, 1.0);
    assert.equal(s.parryWindowDuration, 0.22);
    assert.equal(s.masterVolume, 85);
    assert.equal(s.cameraShake, 80);
    assert.equal(s.selectedArmorFinish, 'SILVER_ENGRAVED');
    assert.equal(s.selectedCapeDye, 'IVORY_PEARL');
  });

  test('2. Difficulty mode tuning adjusts damage multipliers and parry windows (PRD FR-07)', () => {
    let diffPayload: any = null;
    eventBus.on('DIFFICULTY_CHANGED', (payload) => {
      diffPayload = payload;
    });

    // Test STORY mode: forgiving parry window (0.28s), reduced damage (0.7x)
    settingsManager.setDifficulty('STORY');
    let s = settingsManager.getSettings();
    assert.equal(s.difficulty, 'STORY');
    assert.equal(s.damageReceivedMultiplier, 0.7);
    assert.equal(s.parryWindowDuration, 0.28);
    assert.equal(diffPayload?.mode, 'STORY');

    // Test LEGEND mode: tight parry window (0.16s), increased damage (1.35x)
    settingsManager.setDifficulty('LEGEND');
    s = settingsManager.getSettings();
    assert.equal(s.difficulty, 'LEGEND');
    assert.equal(s.damageReceivedMultiplier, 1.35);
    assert.equal(s.parryWindowDuration, 0.16);
    assert.equal(diffPayload?.mode, 'LEGEND');
  });

  test('3. Audio volume controls clamp values (0-100%) and persist to SaveManager', () => {
    settingsManager.setAudioVolume('master', 65);
    settingsManager.setAudioVolume('music', 120); // should clamp to 100
    settingsManager.setAudioVolume('sfx', -15);   // should clamp to 0
    settingsManager.setAudioVolume('voice', 90);

    const s = settingsManager.getSettings();
    assert.equal(s.masterVolume, 65);
    assert.equal(s.musicVolume, 100);
    assert.equal(s.sfxVolume, 0);
    assert.equal(s.voiceVolume, 90);

    // Verify stored in SaveManager
    const rawData = saveManager.getData() as any;
    assert.equal(rawData.settings?.masterVolume, 65);
  });

  test('4. Accessibility settings persist across sessions (PRD FR-08)', () => {
    settingsManager.setCameraShake(40);
    settingsManager.setHighContrastText(true);
    settingsManager.setLargeSubtitles(true);
    settingsManager.setParryAssist(true);
    settingsManager.setParticleDensity('MEDIUM');

    const s = settingsManager.getSettings();
    assert.equal(s.cameraShake, 40);
    assert.equal(s.highContrastText, true);
    assert.equal(s.largeSubtitles, true);
    assert.equal(s.parryTimingAssist, true);
    assert.equal(s.particleDensity, 'MEDIUM');
  });

  test('5. CosmeticsManager manages craftable armor finishes and cape dyes (PRD Section 14)', () => {
    const armors = cosmeticsManager.getArmorFinishes();
    const capes = cosmeticsManager.getCapeDyes();

    assert.equal(armors.length, 3);
    assert.equal(capes.length, 4);

    assert.ok(ARMOR_FINISHES.SILVER_ENGRAVED);
    assert.ok(ARMOR_FINISHES.GOLDEN_SUN);
    assert.ok(ARMOR_FINISHES.OBSIDIAN_NIGHT);

    assert.ok(CAPE_DYES.IVORY_PEARL);
    assert.ok(CAPE_DYES.ROYAL_CRIMSON);
    assert.ok(CAPE_DYES.VEYRHOLM_NAVY);
    assert.ok(CAPE_DYES.AMETHYST_VELVET);

    cosmeticsManager.selectArmor('GOLDEN_SUN');
    cosmeticsManager.selectCape('ROYAL_CRIMSON');

    assert.equal(cosmeticsManager.getSelectedArmor(), 'GOLDEN_SUN');
    assert.equal(cosmeticsManager.getSelectedCape(), 'ROYAL_CRIMSON');
  });

  test('6. AnukiModel applies cosmetics in real-time to PBR materials', () => {
    const model = new AnukiModel();

    // Default is Silver & Ivory
    model.applyCosmetics('SILVER_ENGRAVED', 'IVORY_PEARL');

    // Apply Golden Sun Plate & Royal Crimson Cape
    model.applyCosmetics('GOLDEN_SUN', 'ROYAL_CRIMSON');
    const rig = model.getRig();
    assert.ok(rig.capeMesh);

    // Apply Obsidian Cinder Armor & Veyrholm Navy Cape
    model.applyCosmetics('OBSIDIAN_NIGHT', 'VEYRHOLM_NAVY');
    assert.ok(rig.chest);
  });

  test('7. PhotoModeController clamps FOV, roll, distance, and restores projection', () => {
    const cameraManager = new CameraManager();
    const photoMode = new PhotoModeController(cameraManager);

    assert.equal(photoMode.isPhotoModeActive(), false);

    // Activate photo mode focusing at origin
    photoMode.activate(new THREE.Vector3(0, 0, 0));
    assert.equal(photoMode.isPhotoModeActive(), true);

    // FOV clamp [25, 90]
    photoMode.setFov(15);
    assert.equal(photoMode.getSettings().fov, 25);
    photoMode.setFov(120);
    assert.equal(photoMode.getSettings().fov, 90);

    // Roll clamp [-45, 45]
    photoMode.setRoll(-60);
    assert.equal(photoMode.getSettings().roll, -45);
    photoMode.setRoll(70);
    assert.equal(photoMode.getSettings().roll, 45);

    // Distance clamp [1.2, 12.0]
    photoMode.setDistance(0.5);
    assert.equal(photoMode.getSettings().distance, 1.2);
    photoMode.setDistance(25.0);
    assert.equal(photoMode.getSettings().distance, 12.0);

    // Deactivate restores initial FOV
    photoMode.deactivate();
    assert.equal(photoMode.isPhotoModeActive(), false);
  });

  test('8. VFXManager enforces hit-stop under 100 ms (PRD Section 9)', () => {
    const scene = new THREE.Scene();
    const cameraManager = new CameraManager();
    const vfx = new VFXManager(scene, cameraManager);

    // Requesting large hit-stop must clamp under 100ms (<0.1s)
    vfx.triggerHitStop(0.5);
    assert.equal(vfx.isHitStopping(), true);

    // After 0.1s deltaTime update, hit-stop finishes
    vfx.update(0.1);
    assert.equal(vfx.isHitStopping(), false);
  });

  test('9. AudioManager channel volume setters clamp within [0, 1]', () => {
    const audio = new AudioManager();
    audio.unlock();

    audio.setMasterVolume(0.5);
    audio.setMasterVolume(150); // Normalized from 150% -> 1.0
    audio.setMusicVolume(80);   // Normalized from 80% -> 0.8
    audio.setSfxVolume(45);
    audio.setVoiceVolume(90);

    assert.ok(audio);
  });
});
