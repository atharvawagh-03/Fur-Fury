/**
 * Save System
 * Implements PRD FR-06: boss progress, oath seals, upgrades, dialogue flags, checkpoint states.
 */

import { GameConfig } from '../config/GameConfig';

export interface SaveData {
  version: number;
  characterName: string;
  oathSeals: string[]; // e.g., 'Garrick', 'Elowen', etc.
  upgrades: {
    swiftPawLevel: number;
    silverClawLevel: number;
    dragonheartLevel: number;
  };
  unlockedChapters: number;
  currentCheckpoint: {
    zone: string;
    position: [number, number, number];
  };
  dialogueFlags: Record<string, boolean>;
  timestamp: number;
}

export const InitialSaveData: SaveData = {
  version: 1,
  characterName: GameConfig.HERO.NAME,
  oathSeals: [],
  upgrades: {
    swiftPawLevel: 0,
    silverClawLevel: 0,
    dragonheartLevel: 0,
  },
  unlockedChapters: 1,
  currentCheckpoint: {
    zone: 'Grand Arena',
    position: [0, 0, 0],
  },
  dialogueFlags: {},
  timestamp: Date.now(),
};

export class SaveManager {
  private currentData: SaveData;

  constructor() {
    this.currentData = this.load();
  }

  public getData(): SaveData {
    return JSON.parse(JSON.stringify(this.currentData));
  }

  public save(data?: Partial<SaveData>): void {
    if (data) {
      this.currentData = {
        ...this.currentData,
        ...data,
        timestamp: Date.now(),
      };
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(GameConfig.SAVE_KEY, JSON.stringify(this.currentData));
      } catch (err) {
        console.warn('Unable to persist save data to localStorage:', err);
      }
    }
  }

  public load(): SaveData {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(GameConfig.SAVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.version === 1) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse save data from localStorage:', err);
      }
    }
    return JSON.parse(JSON.stringify(InitialSaveData));
  }

  public reset(): void {
    this.currentData = JSON.parse(JSON.stringify(InitialSaveData));
    this.currentData.timestamp = Date.now();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(GameConfig.SAVE_KEY);
      } catch {
        // ignore
      }
    }
  }

  public getFlag(key: string): boolean {
    return Boolean(this.currentData.dialogueFlags?.[key]);
  }

  public setFlag(key: string, value: boolean): void {
    if (!this.currentData.dialogueFlags) {
      this.currentData.dialogueFlags = {};
    }
    this.currentData.dialogueFlags[key] = value;
    this.save();
  }

  public getFlags(): Record<string, boolean> {
    return { ...(this.currentData.dialogueFlags || {}) };
  }
}
