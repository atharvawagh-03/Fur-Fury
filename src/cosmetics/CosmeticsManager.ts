/**
 * Cosmetics & Armor Customization System - Step 9
 * Conforming strictly to PRD Section 14 ("Rewards: craftable armor finishes and cape colors as cosmetic unlocks").
 */

import { ArmorFinishId, CapeDyeId, SettingsManager } from '../settings/SettingsManager';
import { SaveManager } from '../save/SaveManager';

export interface CosmeticArmorOption {
  id: ArmorFinishId;
  name: string;
  tagline: string;
  description: string;
  hexColor: number;
  previewIcon: string;
  isUnlocked: boolean;
  unlockRequirement: string;
}

export interface CosmeticCapeOption {
  id: CapeDyeId;
  name: string;
  tagline: string;
  description: string;
  hexColor: number;
  previewIcon: string;
  isUnlocked: boolean;
  unlockRequirement: string;
}

export const ARMOR_FINISHES: Record<ArmorFinishId, CosmeticArmorOption> = {
  SILVER_ENGRAVED: {
    id: 'SILVER_ENGRAVED',
    name: 'Silver Filigree Plate',
    tagline: 'The North Star of Veyrholm',
    description: 'Hand-engraved sterling silver plate with floral filigree. The signature battle armor of Lady Anuki.',
    hexColor: 0xe0e0e8,
    previewIcon: '🛡️',
    isUnlocked: true,
    unlockRequirement: 'Default Armor',
  },
  GOLDEN_SUN: {
    id: 'GOLDEN_SUN',
    name: 'Sunfire Gold Plate',
    tagline: 'Blessed by the Rite of Eight',
    description: 'Burnished royal gold-leaf armor reflecting solar radiance. Forged for champions who spare their rivals.',
    hexColor: 0xffd700,
    previewIcon: '☀️',
    isUnlocked: true,
    unlockRequirement: 'Spared Sir Garrick at the North Gate',
  },
  OBSIDIAN_NIGHT: {
    id: 'OBSIDIAN_NIGHT',
    name: 'Obsidian Cinder Armor',
    tagline: 'Tempered in Volcanic Slag',
    description: 'Forged from basalt slag and cooled with living magma. Possesses an intimidating dark silhouette.',
    hexColor: 0x383842,
    previewIcon: '🌋',
    isUnlocked: true,
    unlockRequirement: 'Explored the Castle Sanctuary Hub',
  },
};

export const CAPE_DYES: Record<CapeDyeId, CosmeticCapeOption> = {
  IVORY_PEARL: {
    id: 'IVORY_PEARL',
    name: 'Ivory Pearl Silk',
    tagline: 'Traditional Champion Weave',
    description: 'Pure warm ivory weave with weighted hem. Flutters gracefully behind Anuki in full sprint.',
    hexColor: 0xfffef9,
    previewIcon: '🧣',
    isUnlocked: true,
    unlockRequirement: 'Default Cape',
  },
  ROYAL_CRIMSON: {
    id: 'ROYAL_CRIMSON',
    name: 'Rhazakar Dragon-Crimson',
    tagline: 'Woven with Dragonfire Pride',
    description: 'Velvet cape dyed with deep dragon scarlet, matching the glorious scales of Rhazakar.',
    hexColor: 0x9e1b26,
    previewIcon: '🐉',
    isUnlocked: true,
    unlockRequirement: 'Earned Gatekeeper’s Oath Seal',
  },
  VEYRHOLM_NAVY: {
    id: 'VEYRHOLM_NAVY',
    name: 'Veyrholm Royal Navy',
    tagline: 'Emblem of the High Court',
    description: 'Deep sapphire mantle emblazoned with the noble crest of the Eight Guardians.',
    hexColor: 0x1e3a5f,
    previewIcon: '🌊',
    isUnlocked: true,
    unlockRequirement: 'Unlocked Rosebridge Keep',
  },
  AMETHYST_VELVET: {
    id: 'AMETHYST_VELVET',
    name: 'Amethyst Twilight',
    tagline: 'Mystic Cloister Shadow',
    description: 'Enchanted violet velvet that glimmers under torchlight and starry mountain skies.',
    hexColor: 0x5b2c6f,
    previewIcon: '✨',
    isUnlocked: true,
    unlockRequirement: 'Discovered any Lore Codex Chronicle',
  },
};

export class CosmeticsManager {
  private static instance: CosmeticsManager | null = null;
  private settingsManager: SettingsManager;

  public static getInstance(saveManager?: SaveManager): CosmeticsManager {
    if (!this.instance) {
      this.instance = new CosmeticsManager(saveManager);
    }
    return this.instance;
  }

  constructor(saveManager?: SaveManager) {
    this.settingsManager = SettingsManager.getInstance(saveManager);
  }

  public getArmorFinishes(): CosmeticArmorOption[] {
    return Object.values(ARMOR_FINISHES);
  }

  public getCapeDyes(): CosmeticCapeOption[] {
    return Object.values(CAPE_DYES);
  }

  public getSelectedArmor(): ArmorFinishId {
    return this.settingsManager.getSettings().selectedArmorFinish;
  }

  public getSelectedCape(): CapeDyeId {
    return this.settingsManager.getSettings().selectedCapeDye;
  }

  public selectArmor(armorId: ArmorFinishId): void {
    const currentCape = this.getSelectedCape();
    this.settingsManager.setCosmetics(armorId, currentCape);
  }

  public selectCape(capeId: CapeDyeId): void {
    const currentArmor = this.getSelectedArmor();
    this.settingsManager.setCosmetics(currentArmor, capeId);
  }
}
