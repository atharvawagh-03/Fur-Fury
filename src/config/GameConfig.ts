/**
 * FUR & FURY - Global Game Configuration
 * Adorable by Nature. Dangerous by Destiny.
 */

export const GameConfig = {
  TITLE: 'FUR & FURY',
  TAGLINE: 'Adorable by Nature. Dangerous by Destiny.',
  HERO: {
    NAME: 'Anuki',
    TITLE: 'Lady Anuki, The Crimson Claw',
    WEAPON: 'Moonfang',
  },
  COMPANION: {
    NAME: 'Rhazakar',
    NICKNAME: 'Rhaz',
  },
  REALM: 'Kingdom of Veyrholm',

  // Graphics & Rendering
  GRAPHICS: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 1000,
    SHADOW_MAP_SIZE: 2048,
    PIXEL_RATIO_MAX: 2,
    ANTIALIAS: true,
  },

  // Physics
  PHYSICS: {
    GRAVITY: { x: 0, y: -9.81, z: 0 },
    FIXED_DELTA_TIME: 1 / 60, // 60 Hz fixed timestep
    MAX_SUB_STEPS: 4,
  },

  // Audio Defaults
  AUDIO: {
    MASTER_VOLUME: 0.8,
    MUSIC_VOLUME: 0.7,
    SFX_VOLUME: 0.9,
  },

  // Storage
  SAVE_KEY: 'FUR_AND_FURY_SAVE_SLOT_V1',
} as const;

export type GameConfigType = typeof GameConfig;
