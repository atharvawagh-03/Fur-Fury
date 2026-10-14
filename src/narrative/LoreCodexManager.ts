/**
 * Lore Codex & Collectible Chronicles Manager - Step 8: Storytelling & Interactive Systems
 * Conforming strictly to PRD Section 7, 8, 14.
 */

import { LoreEntry } from './DialogueTypes';
import { SaveManager } from '../save/SaveManager';
import { EventBus } from '../core/EventBus';

export const MASTER_LORE_CHRONICLES: Record<string, LoreEntry> = {
  LORE_RITE_OF_EIGHT: {
    id: 'LORE_RITE_OF_EIGHT',
    title: 'The Legend of the Eight Champions',
    category: 'The Champions',
    icon: '🛡️',
    summary: 'The eight hundred year covenant between the kingdom’s eight guardian knights and the royal crown.',
    body: 'In the ancient era of Veyrholm, eight mortal knights swore solemn oaths upon sacred stone to safeguard the roads, forges, and sanctuaries of the realm. Each was bestowed a sacred Oath Seal: Iron for Courage, Rose for Grace, Cinder for Endurance, and Ash for Vigilance. The Rite was established to ensure that no tyrant could rule without proving themselves before the virtues of the Eight.',
    discoveredLocation: 'Sanctuary Archives of Veyrholm',
    isUnlocked: false,
  },
  LORE_CROWN_OF_EMBERS: {
    id: 'LORE_CROWN_OF_EMBERS',
    title: 'The Siphon of Embers & Regent’s Heresy',
    category: 'Ancient Relics',
    icon: '👑',
    summary: 'How an ancient alliance relic was perverted into a machine of dragon binding.',
    body: 'The Crown of Embers was originally fashioned from fallen dragon scales and star-metal, symbolizing mutual respect between humanity and the winged serpents of Mount Veyr. Regent Aldric Voss, fearing his own mortality, altered the Crown’s conduits into a siphon engine. By drawing upon the eternal heartfire of a living dragon, he intends to turn his knights into an unfeeling legion of ashbound thralls.',
    discoveredLocation: 'Regent’s Conduit Machinery & Archives',
    isUnlocked: false,
  },
  LORE_RHAZAKAR_ORIGIN: {
    id: 'LORE_RHAZAKAR_ORIGIN',
    title: 'Rhazakar the Unbroken & The Scarlet Brood',
    category: 'Dragon Mythology',
    icon: '🐉',
    summary: 'The history of the last free scarlet dragon and his tender bond with Lady Anuki.',
    body: 'Rhazakar was the fiercest among the Great Scarlet Brood of the volcanic crags. When hunters under the Regent’s bounty claimed his kin, Rhazakar retreated above the storm clouds. It was in the high mountain valleys that he discovered a tiny, shivering cream-colored kitten in an abandoned armory. Rather than striking, the colossal beast sheltered her beneath his leathery wings. To this day, Rhazakar answers to her call and guards her with unyielding devotion.',
    discoveredLocation: 'Archivist Kenneth’s Forbidden Tomes',
    isUnlocked: false,
  },
  LORE_BELLFORGE_SECRETS: {
    id: 'LORE_BELLFORGE_SECRETS',
    title: 'The Subterranean Molten Forges',
    category: 'Kingdom of Veyrholm',
    icon: '🌋',
    summary: 'The deep volcanic caverns where Sir Brannoc guards the realm’s eternal flame.',
    body: 'Deep beneath the basalt ridges lies Bellforge Foundry, fueled by subterranean rivers of living magma. Here, the legendary smiths forged the weapons of kings. Under the Regent’s reign, however, the civilian craftspeople of Veyrholm were secretly drafted into the foundry to construct impenetrable barbed chains and harpoon ballistas capable of grounding a dragon in flight.',
    discoveredLocation: 'Rosebridge Keep & Sanctuary Cloister',
    isUnlocked: false,
  },
  LORE_MOONFANG_BLADE: {
    id: 'LORE_MOONFANG_BLADE',
    title: 'Moonfang, Blade of the Fallen Stars',
    category: 'Ancient Relics',
    icon: '🗡️',
    summary: 'The miniature masterwork blade wielded by Lady Anuki.',
    body: 'Forged from meteorite silver that fell during the Great Alignment, Moonfang never tarnishes and never dulls. Though small enough to be wielded by a kitten biped, its silver fuller channels kinetic deflection with peerless resonance, allowing Anuki to turn aside halberds and greatswords four times her size with flawless parry timing.',
    discoveredLocation: 'Discovered upon Anuki’s Arrival at the Grand Arena',
    isUnlocked: true, // Discovered from the beginning
  },
};

export class LoreCodexManager {
  private static instance: LoreCodexManager | null = null;
  private saveManager: SaveManager;
  private eventBus = EventBus.getInstance();
  private entries: Map<string, LoreEntry> = new Map();

  public static getInstance(): LoreCodexManager {
    if (!this.instance) {
      this.instance = new LoreCodexManager();
    }
    return this.instance;
  }

  constructor(saveManager?: SaveManager) {
    this.saveManager = saveManager || new SaveManager();
    this.initializeEntries();
  }

  private initializeEntries(): void {
    const data = this.saveManager.getData();
    const unlockedIds = data.dialogueFlags || {};

    Object.values(MASTER_LORE_CHRONICLES).forEach((lore) => {
      const isAlreadyUnlocked = lore.isUnlocked || Boolean(unlockedIds[`lore_${lore.id}`]);
      this.entries.set(lore.id, {
        ...lore,
        isUnlocked: isAlreadyUnlocked,
      });
    });
  }

  public discoverLore(loreId: string): { newlyDiscovered: boolean; entry?: LoreEntry } {
    const entry = this.entries.get(loreId);
    if (!entry) return { newlyDiscovered: false };

    if (entry.isUnlocked) {
      return { newlyDiscovered: false, entry };
    }

    entry.isUnlocked = true;

    // Persist to SaveManager
    const data = this.saveManager.getData();
    data.dialogueFlags[`lore_${loreId}`] = true;
    this.saveManager.save(data);

    // Notify listeners
    this.eventBus.emit('LORE_DISCOVERED', entry);

    return { newlyDiscovered: true, entry };
  }

  public hasDiscovered(loreId: string): boolean {
    const entry = this.entries.get(loreId);
    return entry ? entry.isUnlocked : false;
  }

  public isDiscovered(loreId: string): boolean {
    return this.hasDiscovered(loreId);
  }

  public discover(loreId: string): LoreEntry | null {
    const res = this.discoverLore(loreId);
    return res.newlyDiscovered && res.entry ? res.entry : null;
  }

  public getAllEntries(): LoreEntry[] {
    return Array.from(this.entries.values());
  }

  public getDiscoveredEntries(): LoreEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.isUnlocked);
  }
}
