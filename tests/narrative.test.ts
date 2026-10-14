/**
 * Step 8 Automated Unit Tests - Storytelling, Branching Dialogue & Lore Codex
 * Conforming strictly to PRD Section 5, 6, 8, 14, 15, 16, 20.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DialogueManager } from '../src/narrative/DialogueManager';
import { LoreCodexManager } from '../src/narrative/LoreCodexManager';
import { DIALOGUE_TREES } from '../src/narrative/DialogueData';
import { SaveManager } from '../src/save/SaveManager';
import { EventBus } from '../src/core/EventBus';

describe('Step 8: Storytelling, Branching Dialogue & Lore Codex', () => {
  let saveManager: SaveManager;
  let dialogueManager: DialogueManager;
  let loreManager: LoreCodexManager;
  let eventBus: EventBus;

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    saveManager = new SaveManager();
    saveManager.reset();
    eventBus = EventBus.getInstance();
    dialogueManager = new DialogueManager(saveManager);
    loreManager = new LoreCodexManager(saveManager);
  });

  test('1. Master Dialogue Trees are authored and registered', () => {
    assert.ok(DIALOGUE_TREES.squire_pippin, 'Squire Pippin dialogue tree must exist');
    assert.ok(DIALOGUE_TREES.archivist_kenneth, 'Archivist Kenneth dialogue tree must exist');
    assert.ok(DIALOGUE_TREES.sir_garrick_hub, 'Sir Garrick hub dialogue tree must exist');
    assert.ok(DIALOGUE_TREES.dame_elowen_hub, 'Dame Elowen hub dialogue tree must exist');
    assert.ok(DIALOGUE_TREES.relic_dragon_binding, 'Dragon Conduit relic dialogue tree must exist');
    assert.ok(DIALOGUE_TREES.ancient_fountain, 'Sanctuary Spring dialogue tree must exist');

    assert.equal(DIALOGUE_TREES.squire_pippin.startNodeId, 'pippin_intro');
    assert.ok(DIALOGUE_TREES.squire_pippin.nodes.pippin_intro.choices?.length);
  });

  test('2. DialogueManager starts a dialogue and tracks active node', () => {
    let startedPayload: any = null;
    eventBus.on('DIALOGUE_STARTED', (payload) => {
      startedPayload = payload;
    });

    const success = dialogueManager.startDialogue('squire_pippin');
    assert.equal(success, true);
    assert.equal(dialogueManager.isActive(), true);
    assert.equal(dialogueManager.getCurrentTreeId(), 'squire_pippin');

    const node = dialogueManager.getCurrentNode();
    assert.ok(node);
    assert.equal(node?.id, 'pippin_intro');
    assert.equal(node?.speaker, 'Squire Pippin');
    assert.equal(startedPayload?.treeId, 'squire_pippin');
  });

  test('3. DialogueManager navigates choices and sets narrative save flags', () => {
    dialogueManager.startDialogue('squire_pippin');
    const rootNode = dialogueManager.getCurrentNode();
    assert.ok(rootNode?.choices);

    const familyChoice = rootNode?.choices?.find((c) => c.nextNodeId === 'pippin_family_resp');
    assert.ok(familyChoice);

    dialogueManager.selectChoice(familyChoice!);
    const nextNode = dialogueManager.getCurrentNode();
    assert.equal(nextNode?.id, 'pippin_family_resp');

    // Verify flag was persisted in SaveManager
    assert.equal(saveManager.getFlag('pippin_knows_rhaz_bond'), true);
  });

  test('4. DialogueManager auto-advances sequential nodes without choices', () => {
    dialogueManager.startDialogue('relic_dragon_binding');
    const rootNode = dialogueManager.getCurrentNode();
    assert.ok(rootNode?.choices);

    const inspectChoice = rootNode?.choices?.find((c) => c.nextNodeId === 'relic_inspect_result');
    assert.ok(inspectChoice);
    dialogueManager.selectChoice(inspectChoice!);

    const inspectNode = dialogueManager.getCurrentNode();
    assert.equal(inspectNode?.id, 'relic_inspect_result');
    assert.equal(inspectNode?.choices, undefined);
    assert.equal(inspectNode?.nextNodeId, 'relic_leave');
    assert.equal(saveManager.getFlag('inspected_binding_machine'), true);

    // Advance to sequential leave line
    const advanced = dialogueManager.advance();
    assert.equal(advanced, true);
    const nextNode = dialogueManager.getCurrentNode();
    assert.equal(nextNode?.id, 'relic_leave');
  });

  test('5. LoreCodexManager registers all 5 core Veyrholm chronicles', () => {
    const all = loreManager.getAllEntries();
    assert.equal(all.length, 5);

    const ids = all.map((e) => e.id);
    assert.ok(ids.includes('LORE_RITE_OF_EIGHT'));
    assert.ok(ids.includes('LORE_CROWN_OF_EMBERS'));
    assert.ok(ids.includes('LORE_RHAZAKAR_ORIGIN'));
    assert.ok(ids.includes('LORE_BELLFORGE_SECRETS'));
    assert.ok(ids.includes('LORE_MOONFANG_BLADE'));
  });

  test('6. Lore discovery triggers event and persists into save flags', () => {
    let discoveredEventFired = false;
    eventBus.on<any>('LORE_DISCOVERED', (entry) => {
      discoveredEventFired = true;
      assert.equal(entry.id, 'LORE_RITE_OF_EIGHT');
    });

    assert.equal(loreManager.isDiscovered('LORE_RITE_OF_EIGHT'), false);

    const entry = loreManager.discover('LORE_RITE_OF_EIGHT');
    assert.ok(entry);
    assert.equal(entry?.isUnlocked, true);
    assert.equal(loreManager.isDiscovered('LORE_RITE_OF_EIGHT'), true);
    assert.equal(discoveredEventFired, true);

    // Verify persisted in save data
    const savedFlags = saveManager.getFlags();
    assert.equal(savedFlags['lore_LORE_RITE_OF_EIGHT'], true);

    // Rediscovering returns null (already discovered)
    const secondTry = loreManager.discover('LORE_RITE_OF_EIGHT');
    assert.equal(secondTry, null);
  });

  test('7. Close dialogue resets active state and emits DIALOGUE_CLOSED', () => {
    let closedEventFired = false;
    eventBus.on('DIALOGUE_CLOSED', () => {
      closedEventFired = true;
    });

    dialogueManager.startDialogue('ancient_fountain');
    assert.equal(dialogueManager.isActive(), true);

    dialogueManager.closeDialogue();
    assert.equal(dialogueManager.isActive(), false);
    assert.equal(dialogueManager.getCurrentNode(), null);
    assert.equal(closedEventFired, true);
  });
});
