/**
 * Level Progression & Campaign State Manager - Step 7: Level Progression & Boss Battles
 * Conforming strictly to PRD Section 6 ("Campaign and boss roster"), Section 8, and Section 14.
 */

import { SaveManager } from '../save/SaveManager';
import { EventBus } from '../core/EventBus';

export type StageId = 'grand_arena' | 'castle_hub' | 'rosebridge_keep' | 'bellforge_foundry';

export interface StageInfo {
  id: StageId;
  name: string;
  regionTitle: string;
  bossName: string;
  bossTitle: string;
  sealId: string;
  sealName: string;
  sealDescription: string;
  sealIcon: string;
  environmentTheme: string;
  requiredSeal?: string;
}

export interface UpgradeBranch {
  id: 'swiftPaw' | 'silverClaw' | 'dragonheart';
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  bonusText: string;
}

export const CAMPAIGN_STAGES: Record<StageId, StageInfo> = {
  grand_arena: {
    id: 'grand_arena',
    name: 'Grand Arena',
    regionTitle: 'Prologue • The North Gate',
    bossName: 'Sir Garrick Ironjaw',
    bossTitle: 'The Gatekeeper',
    sealId: 'SEAL_GARRICK',
    sealName: "Gatekeeper's Iron Seal",
    sealDescription: 'Awarded by Sir Garrick for unwavering courage at the North Gate.',
    sealIcon: '🛡️',
    environmentTheme: 'Sunlit limestone colosseum, royal banners & fire braziers',
  },
  castle_hub: {
    id: 'castle_hub',
    name: 'Sanctuary of Veyrholm',
    regionTitle: 'Castle Hub • Cloister & Archives',
    bossName: 'Squire Pippin & Loremaster',
    bossTitle: 'Friendly Sanctuary',
    sealId: 'SEAL_HUB',
    sealName: 'Sanctuary Crest',
    sealDescription: 'The peaceful cloisters where spared knights, squires, and scholars gather.',
    sealIcon: '🏰',
    environmentTheme: 'Sunlit limestone cloisters, crystal spring & perched dragon watchtower',
  },
  rosebridge_keep: {
    id: 'rosebridge_keep',
    name: 'Rosebridge Keep',
    regionTitle: 'Stage I • Castle Courtyard',
    bossName: 'Dame Elowen Vale',
    bossTitle: 'The Rose Sentinel',
    sealId: 'SEAL_ELOWEN',
    sealName: "Sentinel's Rose Seal",
    sealDescription: "Etched in polished steel; reveals the mystery of Veyrholm's missing villagers.",
    sealIcon: '🌹',
    environmentTheme: 'Rain-dark battlements, rose gardens & vaulted Gothic cloisters',
    requiredSeal: 'SEAL_GARRICK',
  },
  bellforge_foundry: {
    id: 'bellforge_foundry',
    name: 'Bellforge Foundry',
    regionTitle: 'Stage II • Subterranean Forges',
    bossName: 'Sir Brannoc Cinderhand',
    bossTitle: 'The Forge Warden',
    sealId: 'SEAL_BRANNOC',
    sealName: "Forge Warden's Cinder Seal",
    sealDescription: 'Forged from living magma; bears the eternal flame of the Bellforge smiths.',
    sealIcon: '🌋',
    environmentTheme: 'Furnaces, molten bronze floor lanes, smoke shafts & heavy chains',
    requiredSeal: 'SEAL_ELOWEN',
  },
};

export class LevelProgressionManager {
  private static instance: LevelProgressionManager | null = null;
  private saveManager: SaveManager;
  private currentStageId: StageId = 'grand_arena';
  private eventBus = EventBus.getInstance();

  public static getInstance(): LevelProgressionManager {
    if (!this.instance) {
      this.instance = new LevelProgressionManager();
    }
    return this.instance;
  }

  constructor(saveManager?: SaveManager) {
    this.saveManager = saveManager || new SaveManager();
    const data = this.saveManager.getData();
    // Default to grand arena
    this.currentStageId = 'grand_arena';
    // If checkpoint is saved
    if (data.currentCheckpoint && data.currentCheckpoint.zone) {
      const match = Object.values(CAMPAIGN_STAGES).find((s) => s.name === data.currentCheckpoint.zone);
      if (match) this.currentStageId = match.id;
    }

    // Auto-award seal upon boss surrender / defeat
    this.eventBus.on('BOSS_DEFEATED', () => {
      this.awardOathSeal(this.currentStageId);
    });
    this.eventBus.on('SPARE_BOSS_DECISION', () => {
      this.awardOathSeal(this.currentStageId);
    });
  }

  public getCurrentStageId(): StageId {
    return this.currentStageId;
  }

  public getCurrentStage(): StageInfo {
    return CAMPAIGN_STAGES[this.currentStageId];
  }

  public getAllStages(): StageInfo[] {
    return Object.values(CAMPAIGN_STAGES);
  }

  public isStageUnlocked(stageId: StageId): boolean {
    const stage = CAMPAIGN_STAGES[stageId];
    if (!stage) return false;
    if (!stage.requiredSeal) return true; // Grand Arena always unlocked

    const data = this.saveManager.getData();
    return data.oathSeals.includes(stage.requiredSeal);
  }

  public hasOathSeal(sealId: string): boolean {
    const data = this.saveManager.getData();
    return data.oathSeals.includes(sealId);
  }

  public getCollectedSeals(): string[] {
    return [...this.saveManager.getData().oathSeals];
  }

  /**
   * Awards an Oath Seal upon defeating/sparing a boss and unlocks the next region
   */
  public awardOathSeal(stageId: StageId): { success: boolean; seal: StageInfo; newlyUnlockedStage?: StageInfo } {
    const stage = CAMPAIGN_STAGES[stageId];
    if (!stage) return { success: false, seal: CAMPAIGN_STAGES.grand_arena };

    const data = this.saveManager.getData();
    const alreadyHad = data.oathSeals.includes(stage.sealId);

    if (!alreadyHad) {
      data.oathSeals.push(stage.sealId);
      data.unlockedChapters = Math.max(data.unlockedChapters, data.oathSeals.length + 1);
      this.saveManager.save(data);
    }

    // Determine if next stage unlocked
    let newlyUnlockedStage: StageInfo | undefined;
    if (stageId === 'grand_arena') {
      newlyUnlockedStage = CAMPAIGN_STAGES.rosebridge_keep;
    } else if (stageId === 'rosebridge_keep') {
      newlyUnlockedStage = CAMPAIGN_STAGES.bellforge_foundry;
    }

    this.eventBus.emit('OATH_SEAL_AWARDED', {
      sealId: stage.sealId,
      sealName: stage.sealName,
      sealIcon: stage.sealIcon,
      newlyUnlockedStage: newlyUnlockedStage?.name,
    });

    return {
      success: true,
      seal: stage,
      newlyUnlockedStage,
    };
  }

  /**
   * Fast-travel to a specified stage
   */
  public selectStage(stageId: StageId): boolean {
    if (!this.isStageUnlocked(stageId)) {
      return false;
    }

    this.currentStageId = stageId;
    const stage = CAMPAIGN_STAGES[stageId];

    // Update checkpoint in save
    this.saveManager.save({
      currentCheckpoint: {
        zone: stage.name,
        position: [0, 0, 0],
      },
    });

    this.eventBus.emit('STAGE_TRANSITION_REQUESTED', stageId);
    return true;
  }

  /**
   * Upgrades branches
   */
  public getUpgrades(): UpgradeBranch[] {
    const data = this.saveManager.getData();
    return [
      {
        id: 'swiftPaw',
        name: 'Swift Paw',
        description: 'Increases dodge roll velocity and reduces sprint stamina consumption.',
        level: data.upgrades.swiftPawLevel,
        maxLevel: 3,
        bonusText: `+${(data.upgrades.swiftPawLevel + 1) * 15}% Dodge Speed`,
      },
      {
        id: 'silverClaw',
        name: 'Silver Claw',
        description: "Sharpens Moonfang's edge, increasing combo damage multiplier.",
        level: data.upgrades.silverClawLevel,
        maxLevel: 3,
        bonusText: `+${(data.upgrades.silverClawLevel + 1) * 20}% Combo Multiplier`,
      },
      {
        id: 'dragonheart',
        name: 'Dragonheart',
        description: 'Rhazakar’s shared vigor enhances maximum vitality and elixir healing.',
        level: data.upgrades.dragonheartLevel,
        maxLevel: 3,
        bonusText: `+${(data.upgrades.dragonheartLevel + 1) * 25} Max HP`,
      },
    ];
  }

  public purchaseUpgrade(branchId: 'swiftPaw' | 'silverClaw' | 'dragonheart'): boolean {
    const data = this.saveManager.getData();
    const currentLevel =
      branchId === 'swiftPaw'
        ? data.upgrades.swiftPawLevel
        : branchId === 'silverClaw'
        ? data.upgrades.silverClawLevel
        : data.upgrades.dragonheartLevel;

    if (currentLevel >= 3) return false;

    if (branchId === 'swiftPaw') data.upgrades.swiftPawLevel++;
    else if (branchId === 'silverClaw') data.upgrades.silverClawLevel++;
    else if (branchId === 'dragonheart') data.upgrades.dragonheartLevel++;

    this.saveManager.save(data);
    this.eventBus.emit('UPGRADE_PURCHASED', { branchId, newLevel: currentLevel + 1 });
    return true;
  }

  public resetProgression(): void {
    this.saveManager.reset();
    this.currentStageId = 'grand_arena';
  }
}
