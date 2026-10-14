/**
 * Dialogue & Storytelling System Type Definitions - Step 8
 * Conforming strictly to PRD Section 5, 8, 14, 16.
 */

export type VoiceTone =
  | 'cat_chirp'
  | 'knight_grunt'
  | 'scholar_whisper'
  | 'squire_eager'
  | 'dragon_rumble';

export interface DialogueChoice {
  id: string;
  label: string;
  nextNodeId: string;
  requiredFlag?: string;
  setFlag?: string;
  awardLoreId?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  speakerTitle: string;
  speakerAvatar: string;
  voiceTone: VoiceTone;
  text: string;
  choices?: DialogueChoice[];
  nextNodeId?: string; // Direct auto-progression on click/space if no choices
  awardLoreId?: string;
  setFlag?: string;
}

export interface DialogueTree {
  id: string;
  title: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface LoreEntry {
  id: string;
  title: string;
  category: 'Kingdom of Veyrholm' | 'Dragon Mythology' | 'The Champions' | 'Ancient Relics';
  icon: string;
  summary: string;
  body: string;
  discoveredLocation: string;
  isUnlocked: boolean;
}
