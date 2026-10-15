/**
 * Settings & Accessibility Manager - Step 9: UI/UX, Audio, Visual Effects & Polish
 * Conforming strictly to PRD Section 9, 14, 15 ("UX / UI and accessibility"), 16, 20 (FR-07, FR-08).
 */

import { SaveManager } from '../save/SaveManager';
import { EventBus } from '../core/EventBus';

export type DifficultyMode = 'STORY' | 'KNIGHT' | 'LEGEND';
export type ParticleDensity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ArmorFinishId = 'SILVER_ENGRAVED' | 'GOLDEN_SUN' | 'OBSIDIAN_NIGHT';
export type CapeDyeId = 'IVORY_PEARL' | 'ROYAL_CRIMSON' | 'VEYRHOLM_NAVY' | 'AMETHYST_VELVET';
export type ColorFilterId = 'NONE' | 'GOLDEN_HOUR' | 'NOIR' | 'MYTHIC' | 'VIBRANT';

export interface GameSettings {
  // Gameplay & Difficulty (PRD FR-07)
  difficulty: DifficultyMode;
  parryTimingAssist: boolean; // +50ms parry buffer for accessibility
  damageReceivedMultiplier: number; // 0.7 for Story, 1.0 for Knight, 1.3 for Legend
  parryWindowDuration: number; // 0.28s for Story, 0.22s for Knight, 0.16s for Legend

  // Audio Mix Volumes (PRD Section 15 & 16)
  masterVolume: number; // 0..100
  musicVolume: number;  // 0..100
  sfxVolume: number;    // 0..100
  voiceVolume: number;  // 0..100

  // Accessibility (PRD Section 15 & FR-08)
  cameraShake: number; // 0..100
  highContrastText: boolean;
  largeSubtitles: boolean;
  reducedMotion: boolean;

  // Graphics & VFX (PRD Section 16 & 18)
  particleDensity: ParticleDensity;
  bloomEnabled: boolean;
  dynamicShadows: boolean;

  // Cosmetics & Unlocks (PRD Section 14)
  selectedArmorFinish: ArmorFinishId;
  selectedCapeDye: CapeDyeId;
}

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'KNIGHT',
  parryTimingAssist: false,
  damageReceivedMultiplier: 1.0,
  parryWindowDuration: 0.22,
  masterVolume: 85,
  musicVolume: 75,
  sfxVolume: 85,
  voiceVolume: 90,
  cameraShake: 80,
  highContrastText: false,
  largeSubtitles: false,
  reducedMotion: false,
  particleDensity: 'HIGH',
  bloomEnabled: true,
  dynamicShadows: true,
  selectedArmorFinish: 'SILVER_ENGRAVED',
  selectedCapeDye: 'IVORY_PEARL',
};

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: GameSettings;
  private saveManager: SaveManager;
  private eventBus = EventBus.getInstance();

  public static getInstance(saveManager?: SaveManager): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager(saveManager);
    }
    return this.instance;
  }

  constructor(saveManager?: SaveManager) {
    this.saveManager = saveManager || new SaveManager();
    this.settings = this.loadSettings();
  }

  private loadSettings(): GameSettings {
    const data = this.saveManager.getData() as any;
    if (data && data.settings) {
      return {
        ...DEFAULT_SETTINGS,
        ...data.settings,
      };
    }
    return { ...DEFAULT_SETTINGS };
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public setDifficulty(mode: DifficultyMode): void {
    this.settings.difficulty = mode;
    switch (mode) {
      case 'STORY':
        this.settings.damageReceivedMultiplier = 0.7;
        this.settings.parryWindowDuration = 0.28;
        break;
      case 'KNIGHT':
        this.settings.damageReceivedMultiplier = 1.0;
        this.settings.parryWindowDuration = 0.22;
        break;
      case 'LEGEND':
        this.settings.damageReceivedMultiplier = 1.35;
        this.settings.parryWindowDuration = 0.16;
        break;
    }
    this.save();
    this.eventBus.emit('DIFFICULTY_CHANGED', {
      mode,
      damageMultiplier: this.settings.damageReceivedMultiplier,
      parryWindow: this.settings.parryWindowDuration,
    });
  }

  public setAudioVolume(channel: 'master' | 'music' | 'sfx' | 'voice', value: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    if (channel === 'master') this.settings.masterVolume = clamped;
    else if (channel === 'music') this.settings.musicVolume = clamped;
    else if (channel === 'sfx') this.settings.sfxVolume = clamped;
    else if (channel === 'voice') this.settings.voiceVolume = clamped;

    this.save();
    this.eventBus.emit('AUDIO_VOLUME_CHANGED', { channel, value: clamped });
  }

  public setCameraShake(intensity: number): void {
    this.settings.cameraShake = Math.max(0, Math.min(100, Math.round(intensity)));
    this.save();
    this.eventBus.emit('CAMERA_SHAKE_SETTING_CHANGED', this.settings.cameraShake);
  }

  public setParryAssist(enabled: boolean): void {
    this.settings.parryTimingAssist = enabled;
    this.save();
    this.eventBus.emit('PARRY_ASSIST_CHANGED', enabled);
  }

  public setHighContrastText(enabled: boolean): void {
    this.settings.highContrastText = enabled;
    this.save();
    this.eventBus.emit('HIGH_CONTRAST_CHANGED', enabled);
  }

  public setLargeSubtitles(enabled: boolean): void {
    this.settings.largeSubtitles = enabled;
    this.save();
    this.eventBus.emit('SUBTITLE_SIZE_CHANGED', enabled);
  }

  public setParticleDensity(density: ParticleDensity): void {
    this.settings.particleDensity = density;
    this.save();
    this.eventBus.emit('PARTICLE_DENSITY_CHANGED', density);
  }

  public setCosmetics(armor: ArmorFinishId, cape: CapeDyeId): void {
    this.settings.selectedArmorFinish = armor;
    this.settings.selectedCapeDye = cape;
    this.save();
    this.eventBus.emit('COSMETICS_CHANGED', { armor, cape });
  }

  private save(): void {
    const data = this.saveManager.getData() as any;
    data.settings = { ...this.settings };
    this.saveManager.save(data);
  }
}
