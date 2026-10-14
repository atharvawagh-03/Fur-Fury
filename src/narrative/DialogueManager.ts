/**
 * Dialogue Manager - Step 8: Storytelling & Interactive Systems
 * Coordinates branching conversation trees, choice resolution, audio cues, and save flags.
 */

import { DIALOGUE_TREES } from './DialogueData';
import { DialogueNode, DialogueTree } from './DialogueTypes';
import { SaveManager } from '../save/SaveManager';
import { LoreCodexManager } from './LoreCodexManager';
import { AudioManager } from '../audio/AudioManager';
import { EventBus } from '../core/EventBus';

export class DialogueManager {
  private static instance: DialogueManager | null = null;
  private saveManager: SaveManager;
  private loreManager: LoreCodexManager;
  private audioManager: AudioManager;
  private eventBus = EventBus.getInstance();

  private activeTree: DialogueTree | null = null;
  private currentNode: DialogueNode | null = null;
  private isDialogueActive: boolean = false;

  public static getInstance(audioManager?: AudioManager, saveManager?: SaveManager): DialogueManager {
    if (!this.instance) {
      this.instance = new DialogueManager(audioManager, saveManager);
    }
    return this.instance;
  }

  constructor(arg1?: AudioManager | SaveManager, arg2?: AudioManager | SaveManager) {
    if (arg1 instanceof SaveManager) {
      this.saveManager = arg1;
      this.audioManager = arg2 instanceof AudioManager ? arg2 : new AudioManager();
    } else if (arg1 instanceof AudioManager) {
      this.audioManager = arg1;
      this.saveManager = arg2 instanceof SaveManager ? arg2 : new SaveManager();
    } else {
      this.saveManager = new SaveManager();
      this.audioManager = new AudioManager();
    }
    this.loreManager = LoreCodexManager.getInstance();
  }

  public setAudioManager(audio: AudioManager): void {
    this.audioManager = audio;
  }

  public isActive(): boolean {
    return this.isDialogueActive;
  }

  public getCurrentNode(): DialogueNode | null {
    return this.currentNode;
  }

  public getActiveTree(): DialogueTree | null {
    return this.activeTree;
  }

  public getCurrentTreeId(): string | null {
    return this.activeTree ? this.activeTree.id : null;
  }

  public startDialogue(treeId: string, startNodeId?: string): boolean {
    const tree = DIALOGUE_TREES[treeId];
    if (!tree) return false;

    this.activeTree = tree;
    const targetNodeId = startNodeId || tree.startNodeId;
    const node = tree.nodes[targetNodeId];
    if (!node) return false;

    this.isDialogueActive = true;
    this.enterNode(node);

    this.eventBus.emit('DIALOGUE_STARTED', {
      treeId: tree.id,
      node: this.currentNode,
    });

    return true;
  }

  public selectChoice(choiceOrId: string | { id: string; nextNodeId: string; setFlag?: string; awardLoreId?: string }): boolean {
    if (!this.isDialogueActive || !this.currentNode || !this.activeTree) return false;

    const choice = typeof choiceOrId === 'string'
      ? this.currentNode.choices?.find((c) => c.id === choiceOrId)
      : choiceOrId;

    if (!choice) return false;

    // Apply narrative flag
    if (choice.setFlag) {
      this.setFlag(choice.setFlag, true);
    }

    // Award lore if configured
    if (choice.awardLoreId) {
      this.loreManager.discoverLore(choice.awardLoreId);
    }

    // Advance to next node
    const nextNode = this.activeTree.nodes[choice.nextNodeId];
    if (nextNode) {
      this.enterNode(nextNode);
      this.eventBus.emit('DIALOGUE_NODE_CHANGED', { node: this.currentNode });
      return true;
    } else {
      this.closeDialogue();
      return true;
    }
  }

  public advance(): boolean {
    if (!this.isDialogueActive || !this.currentNode || !this.activeTree) return false;

    // If choices are present, player must click a choice
    if (this.currentNode.choices && this.currentNode.choices.length > 0) {
      return false;
    }

    if (this.currentNode.nextNodeId) {
      const nextNode = this.activeTree.nodes[this.currentNode.nextNodeId];
      if (nextNode) {
        this.enterNode(nextNode);
        this.eventBus.emit('DIALOGUE_NODE_CHANGED', { node: this.currentNode });
        return true;
      }
    }

    // End of dialogue
    this.closeDialogue();
    return true;
  }

  public closeDialogue(): void {
    if (!this.isDialogueActive) return;

    this.isDialogueActive = false;
    this.activeTree = null;
    this.currentNode = null;
    this.eventBus.emit('DIALOGUE_CLOSED');
  }

  private enterNode(node: DialogueNode): void {
    this.currentNode = node;

    // Apply node flags and lore
    if (node.setFlag) {
      this.setFlag(node.setFlag, true);
    }

    if (node.awardLoreId) {
      this.loreManager.discoverLore(node.awardLoreId);
    }

    // Play voiced speech tone
    this.playVoiceTone(node.voiceTone);
  }

  private playVoiceTone(tone: string): void {
    if (this.audioManager && typeof this.audioManager.playDialogueVoice === 'function') {
      this.audioManager.playDialogueVoice(tone);
    }
  }

  public hasFlag(flag: string): boolean {
    const data = this.saveManager.getData();
    return Boolean(data.dialogueFlags[flag]);
  }

  public setFlag(flag: string, value: boolean): void {
    const data = this.saveManager.getData();
    data.dialogueFlags[flag] = value;
    this.saveManager.save(data);
  }
}
