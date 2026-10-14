/**
 * Master Dialogue Trees & Narrative Script - Step 8: Storytelling & Interactive Systems
 * Conforming strictly to PRD Section 5 ("Three-act arc"), Section 6, 8, 14, 16.
 */

import { DialogueTree } from './DialogueTypes';

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  // 1. Squire Pippin - Castle Pageboy & Loyal Friend
  squire_pippin: {
    id: 'squire_pippin',
    title: 'Conversation with Squire Pippin',
    startNodeId: 'pippin_intro',
    nodes: {
      pippin_intro: {
        id: 'pippin_intro',
        speaker: 'Squire Pippin',
        speakerTitle: 'Apprentice Knight of Veyrholm',
        speakerAvatar: '👦⚔️',
        voiceTone: 'squire_eager',
        text: 'Milady Anuki! By the stars, when you leaped off that colossal red dragon, the whole court nearly dropped their flagons! How did you tame such a creature?',
        choices: [
          {
            id: 'c_pippin_family',
            label: '🐾 “Rhaz is not tamed—he is family.”',
            nextNodeId: 'pippin_family_resp',
            setFlag: 'pippin_knows_rhaz_bond',
          },
          {
            id: 'c_pippin_advice',
            label: '⚔️ “Tell me about the champions of the Rite.”',
            nextNodeId: 'pippin_champions_intel',
          },
          {
            id: 'c_pippin_gossip',
            label: '🏰 “What is the Regent plotting in secret?”',
            nextNodeId: 'pippin_court_gossip',
          },
        ],
      },
      pippin_family_resp: {
        id: 'pippin_family_resp',
        speaker: 'Squire Pippin',
        speakerTitle: 'Apprentice Knight of Veyrholm',
        speakerAvatar: '👦⚔️',
        voiceTone: 'squire_eager',
        text: 'Family... I see the way he watches over you from the high watchtower. No chain could ever command such loyalty. The Regent thinks beasts only obey fear, but you prove him wrong!',
        choices: [
          {
            id: 'c_ask_weakness',
            label: '🛡️ “Do you have tactical advice for battle?”',
            nextNodeId: 'pippin_combat_tips',
          },
          {
            id: 'c_farewell',
            label: '👋 “Keep your guard up, Pippin.”',
            nextNodeId: 'pippin_farewell',
          },
        ],
      },
      pippin_champions_intel: {
        id: 'pippin_champions_intel',
        speaker: 'Squire Pippin',
        speakerTitle: 'Apprentice Knight of Veyrholm',
        speakerAvatar: '👦⚔️',
        voiceTone: 'squire_eager',
        text: 'The Eight Champions were meant to be guardians of Veyrholm, but Regent Voss has filled their heads with whispers of glory. Sir Garrick values honor above all; Dame Elowen fights to protect her missing villagers; and Sir Brannoc will never surrender his magma forges easily.',
        choices: [
          {
            id: 'c_ask_combat',
            label: '🗡️ “How do I counter their heavy strikes?”',
            nextNodeId: 'pippin_combat_tips',
          },
        ],
      },
      pippin_combat_tips: {
        id: 'pippin_combat_tips',
        speaker: 'Squire Pippin',
        speakerTitle: 'Apprentice Knight of Veyrholm',
        speakerAvatar: '👦⚔️',
        voiceTone: 'squire_eager',
        text: 'Watch for their windups, Milady! When a champion raises their weapon high, that is your cue to dodge or prepare a parry. After their heaviest smash, their blade sticks in the stone—that is your punish window to strike!',
        choices: [
          {
            id: 'c_farewell_2',
            label: '🐾 “Thank you for the wisdom, little squire.”',
            nextNodeId: 'pippin_farewell',
          },
        ],
      },
      pippin_court_gossip: {
        id: 'pippin_court_gossip',
        speaker: 'Squire Pippin',
        speakerTitle: 'Apprentice Knight of Veyrholm',
        speakerAvatar: '👦⚔️',
        voiceTone: 'squire_eager',
        text: 'Late at night, wagons haul blackened chains into the lower crypts. I overheard the Regent commanding his blacksmiths: "Forge them strong enough to bind a living dragon." Please be careful with Rhazakar!',
        setFlag: 'pippin_warned_chains',
        choices: [
          {
            id: 'c_farewell_3',
            label: '🔥 “Rhaz’s fire will never be bound. Thank you, Pippin.”',
            nextNodeId: 'pippin_farewell',
          },
        ],
      },
      pippin_farewell: {
        id: 'pippin_farewell',
        speaker: 'Squire Pippin',
        speakerTitle: 'Apprentice Knight of Veyrholm',
        speakerAvatar: '👦⚔️',
        voiceTone: 'squire_eager',
        text: 'May Moonfang strike true, Lady Anuki! I will keep watch on the gates while you are in the courtyard.',
      },
    },
  },

  // 2. Archivist Kenneth - Royal Scholar of Ancient Veyrholm
  archivist_kenneth: {
    id: 'archivist_kenneth',
    title: 'The Archives of Veyrholm',
    startNodeId: 'kenneth_intro',
    nodes: {
      kenneth_intro: {
        id: 'kenneth_intro',
        speaker: 'Archivist Kenneth',
        speakerTitle: 'Royal Loremaster & Keeper of Tomes',
        speakerAvatar: '📜👴',
        voiceTone: 'scholar_whisper',
        text: 'Welcome, little scholar. For sixty winters I have tended these scrolls. Men call you a novelty, but I have read the ancient prophecies of the Crimson Claw and the Unbroken Drake.',
        choices: [
          {
            id: 'c_kenneth_crown',
            label: '👑 “What is the true origin of the Crown of Embers?”',
            nextNodeId: 'kenneth_crown_lore',
          },
          {
            id: 'c_kenneth_rhaz',
            label: '🐉 “Do the archives speak of Rhazakar?”',
            nextNodeId: 'kenneth_rhaz_lore',
          },
          {
            id: 'c_kenneth_seals',
            label: '🛡️ “What power lies within the Oath Seals?”',
            nextNodeId: 'kenneth_seals_lore',
          },
        ],
      },
      kenneth_crown_lore: {
        id: 'kenneth_crown_lore',
        speaker: 'Archivist Kenneth',
        speakerTitle: 'Royal Loremaster & Keeper of Tomes',
        speakerAvatar: '📜👴',
        voiceTone: 'scholar_whisper',
        text: 'Eight hundred years ago, the Crown was forged as an alliance between dragons and mortals. But Regent Aldric Voss has corrupted its sacred runes into a siphon engine. He seeks to siphon Rhazakar’s heartfire to forge an invincible ashbound army!',
        awardLoreId: 'LORE_CROWN_OF_EMBERS',
        choices: [
          {
            id: 'c_kenneth_stop_him',
            label: '⚔️ “How do we shatter the Crown’s binding conduits?”',
            nextNodeId: 'kenneth_conduits_lore',
          },
        ],
      },
      kenneth_conduits_lore: {
        id: 'kenneth_conduits_lore',
        speaker: 'Archivist Kenneth',
        speakerTitle: 'Royal Loremaster & Keeper of Tomes',
        speakerAvatar: '📜👴',
        voiceTone: 'scholar_whisper',
        text: 'Only the combined resonance of the Eight Oath Seals, consecrated in honor and mercy, can break the Regent’s conduits. You must win the champions not by slaughter, but by proving your righteous cause.',
        setFlag: 'kenneth_explained_mercy',
        nextNodeId: 'kenneth_farewell',
      },
      kenneth_rhaz_lore: {
        id: 'kenneth_rhaz_lore',
        speaker: 'Archivist Kenneth',
        speakerTitle: 'Royal Loremaster & Keeper of Tomes',
        speakerAvatar: '📜👴',
        voiceTone: 'scholar_whisper',
        text: 'Rhazakar is the last of the Great Scarlet Brood. When the other dragons fell to the hunters, he vanished into the volcanic clouds. That he chose to raise a kitten in his nest... truly, the destiny of beasts is nobler than that of kings.',
        awardLoreId: 'LORE_RHAZAKAR_ORIGIN',
        nextNodeId: 'kenneth_farewell',
      },
      kenneth_seals_lore: {
        id: 'kenneth_seals_lore',
        speaker: 'Archivist Kenneth',
        speakerTitle: 'Royal Loremaster & Keeper of Tomes',
        speakerAvatar: '📜👴',
        voiceTone: 'scholar_whisper',
        text: 'Each seal carries the sworn vow of an ancient guardian knight: Courage, Grace, Endurance, and Faith. As you collect them, the sanctuary murals will awaken, revealing forgotten truths.',
        awardLoreId: 'LORE_RITE_OF_EIGHT',
        nextNodeId: 'kenneth_farewell',
      },
      kenneth_farewell: {
        id: 'kenneth_farewell',
        speaker: 'Archivist Kenneth',
        speakerTitle: 'Royal Loremaster & Keeper of Tomes',
        speakerAvatar: '📜👴',
        voiceTone: 'scholar_whisper',
        text: 'Read the ancient stone tablets as you journey, Lady Anuki. Knowledge is as sharp as Moonfang’s edge.',
      },
    },
  },

  // 3. Sir Garrick Ironjaw - Spared Champion in Castle Sanctuary
  sir_garrick_hub: {
    id: 'sir_garrick_hub',
    title: 'Audience with Sir Garrick Ironjaw',
    startNodeId: 'garrick_hub_intro',
    nodes: {
      garrick_hub_intro: {
        id: 'garrick_hub_intro',
        speaker: 'Sir Garrick Ironjaw',
        speakerTitle: 'Gatekeeper of the North Gate',
        speakerAvatar: '🛡️🧔',
        voiceTone: 'knight_grunt',
        text: 'Lady Anuki. My halberd arm still aches from your parry. Few warriors possess your speed, and fewer still possess the nobility to spare a beaten foe.',
        choices: [
          {
            id: 'c_garrick_regent',
            label: '🏰 “Did Regent Voss order you to trap us?”',
            nextNodeId: 'garrick_regent_orders',
          },
          {
            id: 'c_garrick_seal',
            label: '🛡️ “Your seal opened the road to Rosebridge Keep.”',
            nextNodeId: 'garrick_rosebridge_warning',
          },
        ],
      },
      garrick_regent_orders: {
        id: 'garrick_regent_orders',
        speaker: 'Sir Garrick Ironjaw',
        speakerTitle: 'Gatekeeper of the North Gate',
        speakerAvatar: '🛡️🧔',
        voiceTone: 'knight_grunt',
        text: 'Aye. The Regent sent private couriers before the duel: "Lure the scarlet dragon to the arena sand, then drop the iron portcullises." But a knight’s oath is sworn to the realm, not to treachery. I fought you openly as a warrior.',
        setFlag: 'garrick_confirmed_conspiracy',
        choices: [
          {
            id: 'c_garrick_fellowship',
            label: '🐾 “You are an honorable knight, Garrick.”',
            nextNodeId: 'garrick_praise',
          },
        ],
      },
      garrick_rosebridge_warning: {
        id: 'garrick_rosebridge_warning',
        speaker: 'Sir Garrick Ironjaw',
        speakerTitle: 'Gatekeeper of the North Gate',
        speakerAvatar: '🛡️🧔',
        voiceTone: 'knight_grunt',
        text: 'Dame Elowen Vale guards Rosebridge. She is swift as a swallow and her needle rapier will pierce any careless guard. Do not attempt to overpower her; wait for her lunge and strike when she overreaches.',
        nextNodeId: 'garrick_farewell',
      },
      garrick_praise: {
        id: 'garrick_praise',
        speaker: 'Sir Garrick Ironjaw',
        speakerTitle: 'Gatekeeper of the North Gate',
        speakerAvatar: '🛡️🧔',
        voiceTone: 'knight_grunt',
        text: 'If the day comes when you face the Regent’s ashbound legion, you will not stand alone, little flame. My shield is pledged to your cause.',
        nextNodeId: 'garrick_farewell',
      },
      garrick_farewell: {
        id: 'garrick_farewell',
        speaker: 'Sir Garrick Ironjaw',
        speakerTitle: 'Gatekeeper of the North Gate',
        speakerAvatar: '🛡️🧔',
        voiceTone: 'knight_grunt',
        text: 'Rest your paws by the hearth, Lady Anuki. You have a long road ahead.',
      },
    },
  },

  // 4. Dame Elowen Vale - Spared Rose Sentinel in the Cloisters
  dame_elowen_hub: {
    id: 'dame_elowen_hub',
    title: 'Rose Cloister with Dame Elowen',
    startNodeId: 'elowen_hub_intro',
    nodes: {
      elowen_hub_intro: {
        id: 'elowen_hub_intro',
        speaker: 'Dame Elowen Vale',
        speakerTitle: 'The Rose Sentinel',
        speakerAvatar: '🌹🤺',
        voiceTone: 'cat_chirp',
        text: 'Ah, the little fencer of destiny. These castle roses bloom brighter under the warmth of Rhazakar’s overhead flight. Have you spoken with the blacksmiths of Bellforge yet?',
        choices: [
          {
            id: 'c_elowen_villagers',
            label: '🏘️ “Tell me what happened to the villagers of Rosebridge.”',
            nextNodeId: 'elowen_villagers_truth',
          },
          {
            id: 'c_elowen_fencing',
            label: '🗡️ “Can you teach me the secret of the duelist thrust?”',
            nextNodeId: 'elowen_fencing_lesson',
          },
        ],
      },
      elowen_villagers_truth: {
        id: 'elowen_villagers_truth',
        speaker: 'Dame Elowen Vale',
        speakerTitle: 'The Rose Sentinel',
        speakerAvatar: '🌹🤺',
        voiceTone: 'cat_chirp',
        text: 'Regent Voss drafted our craftspeople by night, claiming they were building grain storehouses. In truth, they are forced to labor in the subterranean heat of Bellforge Foundry, churning out magma harpoons and dragon chains.',
        awardLoreId: 'LORE_BELLFORGE_SECRETS',
        setFlag: 'elowen_revealed_villagers',
        choices: [
          {
            id: 'c_elowen_promise',
            label: '🔥 “I will liberate them and break their chains, Elowen.”',
            nextNodeId: 'elowen_blessing',
          },
        ],
      },
      elowen_fencing_lesson: {
        id: 'elowen_fencing_lesson',
        speaker: 'Dame Elowen Vale',
        speakerTitle: 'The Rose Sentinel',
        speakerAvatar: '🌹🤺',
        voiceTone: 'cat_chirp',
        text: 'A rapier finds gaps in plate armor, but your Moonfang has something rarer: star-forged silver. When you parry an enemy attack, do not hesitate—press into a Riposte immediately to deal triple damage!',
        nextNodeId: 'elowen_farewell',
      },
      elowen_blessing: {
        id: 'elowen_blessing',
        speaker: 'Dame Elowen Vale',
        speakerTitle: 'The Rose Sentinel',
        speakerAvatar: '🌹🤺',
        voiceTone: 'cat_chirp',
        text: 'Sir Brannoc is stubborn, but he has an honest heart. Break his warhammer’s poise, show him your courage, and he too will see the light.',
        nextNodeId: 'elowen_farewell',
      },
      elowen_farewell: {
        id: 'elowen_farewell',
        speaker: 'Dame Elowen Vale',
        speakerTitle: 'The Rose Sentinel',
        speakerAvatar: '🌹🤺',
        voiceTone: 'cat_chirp',
        text: 'Walk gracefully between the thorns, Lady Anuki.',
      },
    },
  },

  // 5. Dragon-Binding Relic Machinery - Interactive Investigation
  relic_dragon_binding: {
    id: 'relic_dragon_binding',
    title: 'The Dragon-Binding Machine',
    startNodeId: 'relic_intro',
    nodes: {
      relic_intro: {
        id: 'relic_intro',
        speaker: 'Conduit Relic',
        speakerTitle: 'Regent’s Flame Siphon Machinery',
        speakerAvatar: '⚙️🔥',
        voiceTone: 'dragon_rumble',
        text: 'A towering mechanism of cold-forged volcanic iron and barbed chains. Glyphs etched into the conduits glow with a sinister violet pulse, humming with unnatural energy.',
        choices: [
          {
            id: 'c_relic_inspect',
            label: '🔍 Inspect the glyphs and siphon runes',
            nextNodeId: 'relic_inspect_result',
          },
          {
            id: 'c_relic_step_back',
            label: '🐾 Step back toward the sanctuary',
            nextNodeId: 'relic_leave',
          },
        ],
      },
      relic_inspect_result: {
        id: 'relic_inspect_result',
        speaker: 'Conduit Relic',
        speakerTitle: 'Regent’s Flame Siphon Machinery',
        speakerAvatar: '⚙️🔥',
        voiceTone: 'dragon_rumble',
        text: 'The runes reveal the mechanism’s purpose: to funnel living dragon breath through liquid ash conduits, infusing human armor with stolen dragon vitality. A tiny kitten paw print is etched near the base by a friendly hand.',
        awardLoreId: 'LORE_CROWN_OF_EMBERS',
        setFlag: 'inspected_binding_machine',
        nextNodeId: 'relic_leave',
      },
      relic_leave: {
        id: 'relic_leave',
        speaker: 'Conduit Relic',
        speakerTitle: 'Regent’s Flame Siphon Machinery',
        speakerAvatar: '⚙️🔥',
        voiceTone: 'dragon_rumble',
        text: 'You step away from the ominous machine. Rhazakar lets out a reassuring deep rumble from the tower above.',
      },
    },
  },

  // 6. Ancient Sanctuary Fountain
  ancient_fountain: {
    id: 'ancient_fountain',
    title: 'Sanctuary Spring of Veyrholm',
    startNodeId: 'fountain_intro',
    nodes: {
      fountain_intro: {
        id: 'fountain_intro',
        speaker: 'Sanctuary Spring',
        speakerTitle: 'Living Water of Mount Veyr',
        speakerAvatar: '⛲✨',
        voiceTone: 'cat_chirp',
        text: 'Clear glacial water ripples over smooth limestone river stones. White water-lilies float serenely in the basin, glowing faintly under the morning sun.',
        choices: [
          {
            id: 'c_drink_water',
            label: '🐾 Drink from the crystalline spring (Restore Vitality)',
            nextNodeId: 'fountain_drink',
          },
          {
            id: 'c_sit_water',
            label: '🐱 Rest and wash paws beside Rhazakar',
            nextNodeId: 'fountain_rest',
          },
        ],
      },
      fountain_drink: {
        id: 'fountain_drink',
        speaker: 'Sanctuary Spring',
        speakerTitle: 'Living Water of Mount Veyr',
        speakerAvatar: '⛲✨',
        voiceTone: 'cat_chirp',
        text: 'The sweet mountain water invigorates Lady Anuki. Your vitality and elixir supply are completely restored!',
        setFlag: 'visited_fountain',
      },
      fountain_rest: {
        id: 'fountain_rest',
        speaker: 'Sanctuary Spring',
        speakerTitle: 'Living Water of Mount Veyr',
        speakerAvatar: '⛲✨',
        voiceTone: 'cat_chirp',
        text: 'Anuki curls up on the sun-warmed stone rim. Rhazakar lowers his snout, nudging your pink ear bow with a warm breath of protective affection.',
      },
    },
  },
};
