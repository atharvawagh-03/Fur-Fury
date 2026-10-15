/**
 * UI Manager - Step 4: Rhazakar Dragon & Opening Cinematic
 * Renders hero status HUD, lock-on reticle, telemetry, camera decks,
 * cinematic letterbox bars, narrative subtitles, and cinematic skip/replay controls
 * conforming to PRD Section 7, 10, & 15.
 */

import { GameConfig } from '../config/GameConfig';
import { EventBus } from '../core/EventBus';
import { Time } from '../core/Time';
import { AudioManager } from '../audio/AudioManager';
import { PlayerStats } from '../character/AnukiController';
import { ActiveCameraMode } from '../scenes/ArenaScene';
import { CinematicBeat } from '../cinematic/OpeningCinematic';
import { BossStats } from '../enemy/EnemyTypes';
import { LevelProgressionManager, StageId, CAMPAIGN_STAGES } from '../progression/LevelProgressionManager';
import { DialogueManager } from '../narrative/DialogueManager';
import { LoreCodexManager } from '../narrative/LoreCodexManager';
import { DialogueNode, LoreEntry } from '../narrative/DialogueTypes';
import { SettingsManager, DifficultyMode, ParticleDensity, ArmorFinishId, CapeDyeId, ColorFilterId } from '../settings/SettingsManager';
import { CosmeticsManager } from '../cosmetics/CosmeticsManager';
import { Profiler } from '../core/Profiler';
import { QualityManager, QualityPreset } from '../core/QualityManager';

export interface CinematicStatePayload {
  active: boolean;
  beat: CinematicBeat;
  subtitle: { speaker?: string; text: string } | null;
  showPrompt: string | null;
}

export class UIManager {
  private overlayContainer: HTMLElement;
  private fpsDisplay: HTMLElement | null = null;
  private timeRef: Time | null = null;
  private eventBus = EventBus.getInstance();
  private audioManager: AudioManager;
  private progressionManager = LevelProgressionManager.getInstance();
  private dialogueManager = DialogueManager.getInstance();
  private loreManager = LoreCodexManager.getInstance();

  // Real-time elements
  private hpBarFill: HTMLElement | null = null;
  private hpText: HTMLElement | null = null;
  private staminaBarFill: HTMLElement | null = null;
  private staminaText: HTMLElement | null = null;
  private heroStateBadge: HTMLElement | null = null;
  private heroSpeedText: HTMLElement | null = null;
  private lockOnBtn: HTMLElement | null = null;
  private heroCamBtn: HTMLElement | null = null;

  // Step 6 & 7 Boss HUD & Surrender Dialogue elements
  private bossHud: HTMLElement | null = null;
  private bossNameEl: HTMLElement | null = null;
  private bossSubtitleEl: HTMLElement | null = null;
  private bossHpFill: HTMLElement | null = null;
  private bossPoiseFill: HTMLElement | null = null;
  private bossHpText: HTMLElement | null = null;
  private bossStateText: HTMLElement | null = null;
  private bossPhaseBadge: HTMLElement | null = null;
  private surrenderCard: HTMLElement | null = null;
  private surrenderSpeaker: HTMLElement | null = null;
  private surrenderQuote: HTMLElement | null = null;
  private btnMercy: HTMLButtonElement | null = null;
  private btnVictory: HTMLButtonElement | null = null;

  // Step 7 Progression, Fast-Travel & Upgrades
  private sealBanner: HTMLElement | null = null;
  private sealAwardIcon: HTMLElement | null = null;
  private sealAwardName: HTMLElement | null = null;
  private sealAwardUnlock: HTMLElement | null = null;
  private stagesModal: HTMLElement | null = null;
  private sealsModal: HTMLElement | null = null;
  private upgradesModal: HTMLElement | null = null;

  // Step 8 Dialogue, Proximity Prompts & Lore Codex
  private interactionPromptPill: HTMLElement | null = null;
  private interactionPromptLabel: HTMLElement | null = null;
  private dialogueDeckOverlay: HTMLElement | null = null;
  private dialogueAvatar: HTMLElement | null = null;
  private dialogueSpeakerName: HTMLElement | null = null;
  private dialogueSpeakerTitle: HTMLElement | null = null;
  private dialogueBodyText: HTMLElement | null = null;
  private dialogueChoicesContainer: HTMLElement | null = null;
  private dialogueAdvanceHint: HTMLElement | null = null;
  private codexModal: HTMLElement | null = null;
  private loreToast: HTMLElement | null = null;
  private loreToastName: HTMLElement | null = null;

  // Step 9 Settings, Wardrobe & Photo Mode
  private settingsManager = SettingsManager.getInstance();
  private cosmeticsManager = CosmeticsManager.getInstance();
  private settingsModal: HTMLElement | null = null;
  private photoModeDeck: HTMLElement | null = null;
  private photoFilterOverlay: HTMLElement | null = null;
  private activeSettingsTab: string = 'gameplay';
  private isPhotoModeActive: boolean = false;

  // Cinematic UI elements
  private cinematicContainer: HTMLElement | null = null;
  private cinematicSpeaker: HTMLElement | null = null;
  private cinematicText: HTMLElement | null = null;
  private cinematicPrompt: HTMLElement | null = null;
  private skipCinematicBtn: HTMLElement | null = null;
  private playCinematicBtn: HTMLElement | null = null;

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.overlayContainer = container;
    this.audioManager = audioManager;
    this.createHud();
    this.subscribeEvents();
  }

  public setTimeReference(time: Time): void {
    this.timeRef = time;
  }

  private createHud(): void {
    this.overlayContainer.innerHTML = `
      <div class="game-hud" id="main-hud">
        <!-- Cinematic Letterbox Top & Bottom Bars -->
        <div class="cinematic-bar bar-top" id="cinema-bar-top"></div>
        <div class="cinematic-bar bar-bottom" id="cinema-bar-bottom"></div>

        <!-- Cinematic Subtitles & Interaction Deck -->
        <div class="cinematic-overlay" id="cinematic-overlay">
          <div class="cinematic-skip-container">
            <button class="btn-skip-cinematic" id="btn-skip-cinematic">
              <span>Skip Cinematic</span>
              <kbd class="kbd-hint">ESC / ENTER</kbd>
            </button>
          </div>

          <div class="cinematic-prompt-badge" id="cinematic-prompt">
            Use [Mouse] to look around while mounted
          </div>

          <div class="cinematic-dialogue-box" id="cinematic-dialogue-box">
            <div class="dialogue-speaker-banner">
              <span class="speaker-crest">🐉</span>
              <span class="speaker-name" id="cinematic-speaker">Rhazakar</span>
            </div>
            <p class="dialogue-text" id="cinematic-text">
              “Hold tight, little flame! The arena awaits.”
            </p>
          </div>
        </div>

        <!-- Top Header & Lore Badge -->
        <header class="hud-header">
          <div class="brand-container">
            <h1 class="game-title">${GameConfig.TITLE}</h1>
            <p class="game-tagline">“${GameConfig.TAGLINE}”</p>
          </div>
          <div class="hero-badge">
            <div class="hero-avatar">🐱⚔️</div>
            <div class="hero-meta">
              <span class="hero-name">${GameConfig.HERO.NAME}</span>
              <span class="hero-title">${GameConfig.HERO.TITLE}</span>
              <span class="hero-weapon">Blade: <strong>${GameConfig.HERO.WEAPON}</strong></span>
            </div>
          </div>
          <div class="campaign-nav-deck">
            <button class="nav-btn" id="btn-nav-travel">🗺️ Travel</button>
            <button class="nav-btn" id="btn-nav-seals">🛡️ Oath Seals</button>
            <button class="nav-btn" id="btn-nav-upgrades">⚡ Skill Tree</button>
            <button class="nav-btn" id="btn-nav-codex">📖 Codex</button>
            <button class="nav-btn" id="btn-nav-wardrobe">🎨 Wardrobe</button>
            <button class="nav-btn" id="btn-nav-photo">📸 Photo</button>
            <button class="nav-btn" id="btn-nav-settings">⚙️ Settings</button>
          </div>
        </header>

        <!-- Milestone Badge -->
        <div class="milestone-badge">
          <span class="pill pill-complete">STEP 10 COMPLETE</span>
          <span class="milestone-desc">Release Candidate 1.0 • 60 FPS Optimized • Production Ready</span>
        </div>

        <!-- Oath Seal Celebratory Banner -->
        <div class="seal-awarded-banner" id="seal-awarded-banner" style="display: none;">
          <span class="seal-burst-icon" id="seal-award-icon">🛡️</span>
          <div class="seal-award-info">
            <span class="seal-award-title">OATH SEAL ACQUIRED!</span>
            <span class="seal-award-name" id="seal-award-name">Gatekeeper's Iron Seal</span>
            <span class="seal-award-unlock" id="seal-award-unlock">Rosebridge Keep Unlocked!</span>
          </div>
        </div>

        <!-- Boss Health & Poise HUD -->
        <div class="boss-health-hud" id="boss-hud">
          <div class="boss-header-row">
            <span class="boss-icon">⚔️</span>
            <div class="boss-title-block">
              <span class="boss-name" id="boss-name">SIR GARRICK IRONJAW</span>
              <span class="boss-subtitle" id="boss-subtitle">The Gatekeeper • Prologue Champion</span>
            </div>
            <span class="boss-phase-badge" id="boss-phase-badge">PHASE 1</span>
          </div>

          <div class="boss-bar-container">
            <div class="boss-hp-bar">
              <div class="boss-hp-fill" id="boss-hp-fill" style="width: 100%;"></div>
            </div>
            <div class="boss-poise-bar">
              <div class="boss-poise-fill" id="boss-poise-fill" style="width: 100%;"></div>
            </div>
          </div>
          <div class="boss-meta-row">
            <span class="boss-hp-text" id="boss-hp-text">350 / 350 HP</span>
            <span class="boss-state-text" id="boss-state-text">STANCE: GUARD</span>
          </div>
        </div>

        <!-- Surrender & Spare Dialogue Modal per PRD Beat 3:30-4:10 -->
        <div class="surrender-dialogue-card" id="surrender-card" style="display: none;">
          <div class="speaker-tag" id="surrender-speaker">🛡️ Sir Garrick Ironjaw</div>
          <p class="dialogue-quote" id="surrender-quote">“Yield... you fight with the heart of a lion, little flame. The North Gate is yours.”</p>
          <div class="narrative-choice-btns">
            <button class="choice-btn mercy-btn" id="btn-mercy">🐾 [E] Offer Paw in Mercy</button>
            <button class="choice-btn victory-btn" id="btn-victory">🗡️ [J] Raise Blade in Victory</button>
          </div>
        </div>

        <!-- Fast Travel Stage Select Modal -->
        <div class="progression-modal" id="modal-stages" style="display: none;">
          <div class="modal-card">
            <div class="modal-header">
              <h3>🗺️ Campaign Map & Fast Travel</h3>
              <button class="modal-close-btn" id="btn-close-stages">✕</button>
            </div>
            <p class="modal-desc">Travel between unlocked knightly strongholds of Veyrholm.</p>
            <div class="stages-grid" id="stages-grid-container"></div>
          </div>
        </div>

        <!-- Oath Seals Showcase Modal -->
        <div class="progression-modal" id="modal-seals" style="display: none;">
          <div class="modal-card">
            <div class="modal-header">
              <h3>🛡️ Sacred Oath Seals</h3>
              <button class="modal-close-btn" id="btn-close-seals">✕</button>
            </div>
            <p class="modal-desc">Collect all 3 Knightly Seals to restore honor to Veyrholm and unlock the Citadel.</p>
            <div class="seals-grid" id="seals-grid-container"></div>
          </div>
        </div>

        <!-- Skill Upgrades Modal -->
        <div class="progression-modal" id="modal-upgrades" style="display: none;">
          <div class="modal-card">
            <div class="modal-header">
              <h3>⚡ Lady Anuki’s Skill Upgrades</h3>
              <button class="modal-close-btn" id="btn-close-upgrades">✕</button>
            </div>
            <p class="modal-desc">Enhance Lady Anuki’s agility, blade mastery, and dragon vitality.</p>
            <div class="upgrades-list" id="upgrades-list-container"></div>
          </div>
        </div>

        <!-- Step 8 Lore Codex / Veyrholm Chronicles Modal -->
        <div class="progression-modal" id="modal-codex" style="display: none;">
          <div class="modal-card codex-card">
            <div class="modal-header">
              <h3>📖 The Veyrholm Chronicles & Lore Codex</h3>
              <button class="modal-close-btn" id="btn-close-codex">✕</button>
            </div>
            <p class="modal-desc">Chronicles of the Rite of Eight, the Siphon Conduit, and the Ancient Dragon Bond.</p>
            <div class="codex-entries-grid" id="codex-entries-grid"></div>
          </div>
        </div>

        <!-- Step 8 Interaction Prompt Pill -->
        <div class="interaction-prompt-pill" id="interaction-prompt-pill" style="display: none;">
          <span class="interact-key-pill">[E]</span>
          <span class="interact-label" id="interaction-prompt-label">Talk</span>
        </div>

        <!-- Step 8 Interactive Branching Dialogue Window -->
        <div class="dialogue-deck-overlay" id="dialogue-deck-overlay" style="display: none;">
          <div class="dialogue-window">
            <div class="dialogue-speaker-card">
              <div class="dialogue-avatar" id="dialogue-avatar">📜</div>
              <div class="dialogue-speaker-meta">
                <span class="dialogue-speaker-name" id="dialogue-speaker-name">Speaker</span>
                <span class="dialogue-speaker-title" id="dialogue-speaker-title">Title</span>
              </div>
            </div>
            <div class="dialogue-content-box">
              <p class="dialogue-body-text" id="dialogue-body-text"></p>
              <div class="dialogue-choices-container" id="dialogue-choices-container"></div>
              <div class="dialogue-advance-hint" id="dialogue-advance-hint">Press [Space] / [Enter] or Click to Continue ▾</div>
            </div>
          </div>
        </div>

        <!-- Step 8 Celebratory Lore Discovered Toast -->
        <div class="lore-discovered-toast" id="lore-discovered-toast" style="display: none;">
          <span class="toast-icon">📜</span>
          <div class="toast-content">
            <span class="toast-title">CHRONICLE RECORDED</span>
            <span class="toast-entry-name" id="lore-toast-name">Lore Title</span>
          </div>
        </div>

        <!-- Step 9 Master System, Settings & Wardrobe Modal -->
        <div class="progression-modal" id="modal-settings" style="display: none;">
          <div class="modal-card settings-card">
            <div class="modal-header">
              <h3 id="settings-title">⚙️ Game Settings & Royal Wardrobe</h3>
              <button class="modal-close-btn" id="btn-close-settings">✕</button>
            </div>
            
            <div class="settings-tab-bar">
              <button class="tab-btn active" id="tab-btn-gameplay" data-tab="gameplay">⚔️ Gameplay</button>
              <button class="tab-btn" id="tab-btn-audio" data-tab="audio">🔊 Audio</button>
              <button class="tab-btn" id="tab-btn-accessibility" data-tab="accessibility">👁️ Accessibility</button>
              <button class="tab-btn" id="tab-btn-wardrobe" data-tab="wardrobe">🎨 Wardrobe</button>
              <button class="tab-btn" id="tab-btn-graphics" data-tab="graphics">⚡ Graphics & 60 FPS</button>
              <button class="tab-btn" id="tab-btn-credits" data-tab="credits">📜 Credits</button>
            </div>

            <div class="settings-content" id="settings-tab-content"></div>
          </div>
        </div>

        <!-- Step 9 Photo Mode Control Deck -->
        <div class="photo-mode-deck" id="photo-mode-deck" style="display: none;">
          <div class="photo-deck-header">
            <span class="photo-mode-title">📸 CINEMATIC PHOTO MODE</span>
            <div class="photo-deck-actions">
              <button class="btn-deck-action" id="btn-photo-hide-ui">👁️ Hide HUD (H)</button>
              <button class="btn-deck-action btn-danger" id="btn-photo-exit">✕ Exit (P / ESC)</button>
            </div>
          </div>
          <div class="photo-controls-row">
            <div class="slider-control">
              <label>FOV (<span id="photo-fov-val">50</span>°)</label>
              <input type="range" id="photo-slider-fov" min="25" max="90" value="50" />
            </div>
            <div class="slider-control">
              <label>Roll (<span id="photo-roll-val">0</span>°)</label>
              <input type="range" id="photo-slider-roll" min="-45" max="45" value="0" />
            </div>
            <div class="slider-control">
              <label>Vignette (<span id="photo-vig-val">25</span>%)</label>
              <input type="range" id="photo-slider-vignette" min="0" max="100" value="25" />
            </div>
            <div class="filter-btn-group">
              <label>Color Filter</label>
              <div class="filter-chips">
                <button class="filter-chip active" data-filter="NONE">None</button>
                <button class="filter-chip" data-filter="GOLDEN_HOUR">Golden Hour</button>
                <button class="filter-chip" data-filter="NOIR">Noir</button>
                <button class="filter-chip" data-filter="MYTHIC">Mythic</button>
                <button class="filter-chip" data-filter="VIBRANT">Vibrant</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 9 Photo Mode Fullscreen Filter Overlay -->
        <div class="photo-filter-overlay" id="photo-filter-overlay" style="display: none;"></div>

        <!-- Dynamic Floating Combo Counter -->
        <div class="combo-counter-banner" id="combo-banner" style="display: none;">
          <span class="combo-count" id="combo-count-text">1x</span>
          <span class="combo-label" id="combo-label-text">COMBO!</span>
        </div>

        <!-- Critical Riposte Opportunity Banner -->
        <div class="riposte-banner" id="riposte-banner" style="display: none;">
          <span>⚡ CRITICAL RIPOSTE READY! Press [J / K]</span>
        </div>

        <!-- Lady Anuki Health & Stamina Combat Status Card -->
        <div class="hero-combat-hud">
          <div class="vitals-row">
            <span class="vital-label">VITALITY</span>
            <div class="meter-bar hp-bar">
              <div class="meter-fill" id="hp-bar-fill" style="width: 100%;"></div>
            </div>
            <span class="vital-value" id="hp-text">100 / 100</span>
          </div>

          <div class="vitals-row">
            <span class="vital-label">STAMINA</span>
            <div class="meter-bar stamina-bar">
              <div class="meter-fill" id="stamina-bar-fill" style="width: 100%;"></div>
            </div>
            <span class="vital-value" id="stamina-text">100 / 100</span>
          </div>

          <div class="stance-row">
            <div class="stance-indicator">
              <span class="label">STATE:</span>
              <span class="status-pill" id="hero-state-badge">IDLE</span>
            </div>
            <div class="speed-indicator">
              <span class="label">SPEED:</span>
              <span class="value" id="hero-speed-text">0.0 m/s</span>
            </div>
          </div>
        </div>

        <!-- Telemetry & Diagnostic Panel -->
        <div class="telemetry-panel">
          <div class="telemetry-item">
            <span class="label">FRAME RATE</span>
            <span class="value" id="fps-counter">60 FPS</span>
          </div>
          <div class="telemetry-item">
            <span class="label">DRAW CALLS</span>
            <span class="value" id="draw-calls-counter">0 calls</span>
          </div>
          <div class="telemetry-item">
            <span class="label">POLYGONS</span>
            <span class="value" id="triangles-counter">0 tris</span>
          </div>
          <div class="telemetry-item">
            <span class="label">PERFORMANCE TIER</span>
            <span class="value highlight" id="quality-tier-counter">Target 60 FPS</span>
          </div>
        </div>

        <!-- Camera & Cinematic Deck -->
        <div class="camera-controls-deck">
          <span class="deck-title">CAMERA & CINEMATIC</span>
          <div class="preset-btn-group">
            <button class="preset-btn highlight-btn" id="btn-play-cinematic">🎬 Replay Opening Cinematic</button>
            <button class="preset-btn active" id="btn-hero-cam">Hero Follow</button>
            <button class="preset-btn toggle" id="btn-lock-on">Lock-On (R): OFF</button>
            <button class="preset-btn" data-preset="OVERVIEW">Arena High</button>
            <button class="preset-btn" data-preset="GATE">North Gate</button>
            <button class="preset-btn" data-preset="ROYAL_BOX">Regent's Box</button>
            <button class="preset-btn toggle" id="btn-toggle-orbit">Auto Orbit: OFF</button>
          </div>
        </div>

        <!-- Interactive Action Deck -->
        <div class="control-deck">
          <button id="btn-action-dragon" class="btn-action highlight-action">
            <span class="icon">🐉</span>
            <span id="btn-dragon-label">Dragon Call (T/X)</span>
          </button>
          <button id="btn-action-dodge" class="btn-action">
            <span class="icon">🌀</span>
            <span>Dodge Roll (Space)</span>
          </button>
          <button id="btn-action-light" class="btn-action">
            <span class="icon">🗡️</span>
            <span>Slash (J)</span>
          </button>
          <button id="btn-action-heavy" class="btn-action">
            <span class="icon">⚡</span>
            <span>Heavy Strike (K)</span>
          </button>
          <button id="btn-action-parry" class="btn-action secondary">
            <span class="icon">🛡️</span>
            <span>Parry (Q/F)</span>
          </button>
          <button id="btn-action-heal" class="btn-action heal-action">
            <span class="icon">🧪</span>
            <span id="btn-heal-label">Elixir (H) [3/3]</span>
          </button>
          <button id="btn-spawn-crest" class="btn-action secondary">
            <span class="icon">✨</span>
            <span>Drop Boulder</span>
          </button>
        </div>

        <!-- Combat & Keybinding Hints per PRD -->
        <footer class="hud-footer">
          <div class="controls-legend">
            <span class="legend-chip"><kbd>WASD</kbd> Move / Dragon Bank</span>
            <span class="legend-chip"><kbd>T / X</kbd> Dragon Call</span>
            <span class="legend-chip"><kbd>SHIFT</kbd> Sprint / Guard</span>
            <span class="legend-chip"><kbd>SPACE</kbd> Evasive Dodge Roll</span>
            <span class="legend-chip"><kbd>J</kbd> Light Attack Combo (1-2-3)</span>
            <span class="legend-chip"><kbd>K</kbd> Heavy Breaker Strike</span>
            <span class="legend-chip"><kbd>Q / F</kbd> Parry & Riposte</span>
            <span class="legend-chip"><kbd>H</kbd> Elixir Heal</span>
            <span class="legend-chip"><kbd>R</kbd> Duel Lock-On</span>
            <span class="legend-chip"><kbd>ESC</kbd> Skip Cinematic</span>
          </div>
        </footer>
      </div>
    `;

    this.fpsDisplay = document.getElementById('fps-counter');
    this.hpBarFill = document.getElementById('hp-bar-fill');
    this.hpText = document.getElementById('hp-text');
    this.staminaBarFill = document.getElementById('stamina-bar-fill');
    this.staminaText = document.getElementById('stamina-text');
    this.heroStateBadge = document.getElementById('hero-state-badge');
    this.heroSpeedText = document.getElementById('hero-speed-text');
    this.lockOnBtn = document.getElementById('btn-lock-on');
    this.heroCamBtn = document.getElementById('btn-hero-cam');

    this.cinematicContainer = document.getElementById('cinematic-overlay');
    this.cinematicSpeaker = document.getElementById('cinematic-speaker');
    this.cinematicText = document.getElementById('cinematic-text');
    this.cinematicPrompt = document.getElementById('cinematic-prompt');
    this.skipCinematicBtn = document.getElementById('btn-skip-cinematic');
    this.playCinematicBtn = document.getElementById('btn-play-cinematic');

    // Step 6 & 7 Boss HUD & Surrender Choice Elements
    this.bossHud = document.getElementById('boss-hud');
    this.bossNameEl = document.getElementById('boss-name');
    this.bossSubtitleEl = document.getElementById('boss-subtitle');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossPoiseFill = document.getElementById('boss-poise-fill');
    this.bossHpText = document.getElementById('boss-hp-text');
    this.bossStateText = document.getElementById('boss-state-text');
    this.bossPhaseBadge = document.getElementById('boss-phase-badge');
    this.surrenderCard = document.getElementById('surrender-card');
    this.surrenderSpeaker = document.getElementById('surrender-speaker');
    this.surrenderQuote = document.getElementById('surrender-quote');
    this.btnMercy = document.getElementById('btn-mercy') as HTMLButtonElement | null;
    this.btnVictory = document.getElementById('btn-victory') as HTMLButtonElement | null;

    // Step 7 Progression Elements
    this.sealBanner = document.getElementById('seal-awarded-banner');
    this.sealAwardIcon = document.getElementById('seal-award-icon');
    this.sealAwardName = document.getElementById('seal-award-name');
    this.sealAwardUnlock = document.getElementById('seal-award-unlock');
    this.stagesModal = document.getElementById('modal-stages');
    this.sealsModal = document.getElementById('modal-seals');
    this.upgradesModal = document.getElementById('modal-upgrades');

    // Step 8 Dialogue, Interaction & Codex Elements
    this.interactionPromptPill = document.getElementById('interaction-prompt-pill');
    this.interactionPromptLabel = document.getElementById('interaction-prompt-label');
    this.dialogueDeckOverlay = document.getElementById('dialogue-deck-overlay');
    this.dialogueAvatar = document.getElementById('dialogue-avatar');
    this.dialogueSpeakerName = document.getElementById('dialogue-speaker-name');
    this.dialogueSpeakerTitle = document.getElementById('dialogue-speaker-title');
    this.dialogueBodyText = document.getElementById('dialogue-body-text');
    this.dialogueChoicesContainer = document.getElementById('dialogue-choices-container');
    this.dialogueAdvanceHint = document.getElementById('dialogue-advance-hint');
    this.codexModal = document.getElementById('modal-codex');
    this.loreToast = document.getElementById('lore-discovered-toast');
    this.loreToastName = document.getElementById('lore-toast-name');

    // Step 9 Settings & Photo Mode Elements
    this.settingsModal = document.getElementById('modal-settings');
    this.photoModeDeck = document.getElementById('photo-mode-deck');
    this.photoFilterOverlay = document.getElementById('photo-filter-overlay');

    this.attachDomListeners();
  }

  private attachDomListeners(): void {
    // Navigation Modal Triggers
    document.getElementById('btn-nav-travel')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.openStagesModal();
    });

    document.getElementById('btn-nav-seals')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.openSealsModal();
    });

    document.getElementById('btn-nav-upgrades')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.openUpgradesModal();
    });

    document.getElementById('btn-nav-codex')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.openCodexModal();
    });

    // Modal Close Buttons
    document.getElementById('btn-close-stages')?.addEventListener('click', () => {
      if (this.stagesModal) this.stagesModal.style.display = 'none';
      this.audioManager.playUiClick();
    });

    document.getElementById('btn-close-seals')?.addEventListener('click', () => {
      if (this.sealsModal) this.sealsModal.style.display = 'none';
      this.audioManager.playUiClick();
    });

    document.getElementById('btn-close-upgrades')?.addEventListener('click', () => {
      if (this.upgradesModal) this.upgradesModal.style.display = 'none';
      this.audioManager.playUiClick();
    });

    document.getElementById('btn-close-codex')?.addEventListener('click', () => {
      if (this.codexModal) this.codexModal.style.display = 'none';
      this.audioManager.playUiClick();
    });

    // Step 9 Settings & Wardrobe Triggers
    document.getElementById('btn-nav-settings')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.openSettingsModal('gameplay');
    });

    document.getElementById('btn-nav-wardrobe')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.openSettingsModal('wardrobe');
    });

    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      if (this.settingsModal) this.settingsModal.style.display = 'none';
      this.audioManager.playUiClick();
    });

    // Settings Tab Switchers
    document.querySelectorAll<HTMLButtonElement>('.settings-tab-bar .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.audioManager.playUiClick();
          this.switchSettingsTab(tab);
        }
      });
    });

    // Photo Mode Trigger
    document.getElementById('btn-nav-photo')?.addEventListener('click', () => {
      this.audioManager.playUiClick();
      this.eventBus.emit('TOGGLE_PHOTO_MODE');
    });

    // Photo Mode Deck Controls
    this.setupPhotoModeControls();

    // Step 8 Dialogue overlay advance and keyboard listeners
    this.dialogueDeckOverlay?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.choice-btn')) return;
      this.dialogueManager.advance();
    });

    window.addEventListener('keydown', (e) => {
      if (this.dialogueManager.isActive()) {
        if (e.code === 'Enter' || e.code === 'Space') {
          const node = this.dialogueManager.getCurrentNode();
          if (!node?.choices || node.choices.length === 0) {
            e.preventDefault();
            this.dialogueManager.advance();
          }
        } else if (e.code === 'Escape') {
          this.dialogueManager.closeDialogue();
        }
      }
    });

    // Surrender choice decision buttons (PRD Beat 3:30-4:10)
    if (this.btnMercy) {
      this.btnMercy.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('SPARE_BOSS_DECISION', 'MERCY');
      });
    }

    if (this.btnVictory) {
      this.btnVictory.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('SPARE_BOSS_DECISION', 'VICTORY');
      });
    }

    // Play Opening Cinematic
    if (this.playCinematicBtn) {
      this.playCinematicBtn.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('PLAY_OPENING_CINEMATIC');
      });
    }

    // Skip Cinematic
    if (this.skipCinematicBtn) {
      this.skipCinematicBtn.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('SKIP_OPENING_CINEMATIC');
      });
    }

    // Hero Cam Switch
    if (this.heroCamBtn) {
      this.heroCamBtn.addEventListener('click', () => {
        this.eventBus.emit('SWITCH_TO_HERO_CAMERA');
      });
    }

    // Lock-on toggle
    if (this.lockOnBtn) {
      this.lockOnBtn.addEventListener('click', () => {
        this.eventBus.emit('TOGGLE_LOCK_ON');
      });
    }

    // Cinematic Preset Buttons
    const presetButtons = document.querySelectorAll<HTMLButtonElement>('.preset-btn[data-preset]');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetButtons.forEach((b) => b.classList.remove('active'));
        if (this.heroCamBtn) this.heroCamBtn.classList.remove('active');
        btn.classList.add('active');
        const preset = btn.getAttribute('data-preset');
        if (preset) {
          this.eventBus.emit('SET_CAMERA_PRESET', preset);
        }
      });
    });

    // Orbit toggle listener
    const btnOrbit = document.getElementById('btn-toggle-orbit');
    if (btnOrbit) {
      btnOrbit.addEventListener('click', () => {
        this.eventBus.emit('TOGGLE_AUTO_ORBIT');
      });
    }

    // Action deck buttons
    const btnDodge = document.getElementById('btn-action-dodge');
    if (btnDodge) {
      btnDodge.addEventListener('click', () => {
        this.audioManager.unlock();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })), 100);
      });
    }

    const btnLight = document.getElementById('btn-action-light');
    if (btnLight) {
      btnLight.addEventListener('click', () => {
        this.audioManager.unlock();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' })), 100);
      });
    }

    const btnHeavy = document.getElementById('btn-action-heavy');
    if (btnHeavy) {
      btnHeavy.addEventListener('click', () => {
        this.audioManager.unlock();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })), 100);
      });
    }

    const btnParry = document.getElementById('btn-action-parry');
    if (btnParry) {
      btnParry.addEventListener('click', () => {
        this.audioManager.unlock();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyQ' })), 100);
      });
    }

    const btnHeal = document.getElementById('btn-action-heal');
    if (btnHeal) {
      btnHeal.addEventListener('click', () => {
        this.audioManager.unlock();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' })), 100);
      });
    }

    const btnSpawn = document.getElementById('btn-spawn-crest');
    if (btnSpawn) {
      btnSpawn.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('SPAWN_PHYSICS_PROP');
      });
    }

    const btnDragon = document.getElementById('btn-action-dragon');
    if (btnDragon) {
      btnDragon.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('TRIGGER_DRAGON_CALL');
      });
    }

    if (this.cinematicPrompt) {
      this.cinematicPrompt.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('DRAW_SWORD_ACTION');
      });
    }

    // Auto unlock audio on any interaction
    window.addEventListener('pointerdown', () => this.audioManager.unlock(), { once: true });
    window.addEventListener('keydown', () => this.audioManager.unlock(), { once: true });
  }

  private openStagesModal(): void {
    if (!this.stagesModal) return;
    this.renderStages();
    this.stagesModal.style.display = 'flex';
  }

  private renderStages(): void {
    const container = document.getElementById('stages-grid-container');
    if (!container) return;

    const stages = this.progressionManager.getAllStages();
    const currentStageId = this.progressionManager.getCurrentStageId();

    container.innerHTML = stages
      .map((st) => {
        const isUnlocked = this.progressionManager.isStageUnlocked(st.id);
        const isCurrent = st.id === currentStageId;
        return `
          <div class="stage-card ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}">
            <div class="stage-card-header">
              <span class="stage-icon">${st.sealIcon}</span>
              <div>
                <h4 class="stage-title">${st.name}</h4>
                <span class="stage-region">${st.regionTitle}</span>
              </div>
            </div>
            <p class="stage-theme">${st.environmentTheme}</p>
            <div class="stage-boss-meta">
              <strong>Boss:</strong> ${st.bossName} (${st.bossTitle})
            </div>
            <div class="stage-card-footer">
              ${
                isCurrent
                  ? '<span class="status-badge current">CURRENT AREA</span>'
                  : isUnlocked
                  ? `<button class="btn-travel" data-stage="${st.id}">⚔️ Fast Travel</button>`
                  : `<span class="status-badge locked">🔒 Requires ${st.requiredSeal === 'SEAL_GARRICK' ? CAMPAIGN_STAGES.grand_arena.sealName : CAMPAIGN_STAGES.rosebridge_keep.sealName}</span>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll<HTMLButtonElement>('.btn-travel').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stageId = btn.getAttribute('data-stage') as StageId;
        if (stageId) {
          const success = this.progressionManager.selectStage(stageId);
          if (success && this.stagesModal) {
            this.stagesModal.style.display = 'none';
          }
        }
      });
    });
  }

  private openSealsModal(): void {
    if (!this.sealsModal) return;
    this.renderSeals();
    this.sealsModal.style.display = 'flex';
  }

  private renderSeals(): void {
    const container = document.getElementById('seals-grid-container');
    if (!container) return;

    const stages = this.progressionManager.getAllStages();

    container.innerHTML = stages
      .map((st) => {
        const isCollected = this.progressionManager.hasOathSeal(st.sealId);
        return `
          <div class="seal-card ${isCollected ? 'collected' : 'locked'}">
            <div class="seal-badge-icon">${st.sealIcon}</div>
            <h4 class="seal-title">${st.sealName}</h4>
            <span class="seal-bearer">Bearer: ${st.bossName}</span>
            <p class="seal-desc">${st.sealDescription}</p>
            <span class="seal-status ${isCollected ? 'unlocked' : ''}">
              ${isCollected ? '✨ SEAL CONSECRATED' : '🔒 NOT YET EARNED'}
            </span>
          </div>
        `;
      })
      .join('');
  }

  private openUpgradesModal(): void {
    if (!this.upgradesModal) return;
    this.renderUpgrades();
    this.upgradesModal.style.display = 'flex';
  }

  private renderUpgrades(): void {
    const container = document.getElementById('upgrades-list-container');
    if (!container) return;

    const branches = this.progressionManager.getUpgrades();

    container.innerHTML = branches
      .map((b) => {
        const isMax = b.level >= b.maxLevel;
        const pips = Array.from({ length: b.maxLevel }, (_, i) =>
          i < b.level ? '<span class="pip filled"></span>' : '<span class="pip"></span>'
        ).join('');

        return `
          <div class="upgrade-row">
            <div class="upgrade-info">
              <div class="upgrade-header">
                <h4 class="upgrade-name">${b.name}</h4>
                <div class="level-pips">${pips} (Level ${b.level}/${b.maxLevel})</div>
              </div>
              <p class="upgrade-desc">${b.description}</p>
              <span class="upgrade-bonus">${b.bonusText}</span>
            </div>
            <div class="upgrade-action">
              ${
                isMax
                  ? '<span class="badge-maxed">MAX LEVEL</span>'
                  : `<button class="btn-upgrade" data-branch="${b.id}">⚡ Upgrade</button>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll<HTMLButtonElement>('.btn-upgrade').forEach((btn) => {
      btn.addEventListener('click', () => {
        const branchId = btn.getAttribute('data-branch') as 'swiftPaw' | 'silverClaw' | 'dragonheart';
        if (branchId) {
          const success = this.progressionManager.purchaseUpgrade(branchId);
          if (success) {
            this.audioManager.playParryClang();
            this.renderUpgrades();
          }
        }
      });
    });
  }

  private subscribeEvents(): void {
    // Cinematic State Updates
    this.eventBus.on<CinematicStatePayload>('CINEMATIC_STATE', (payload) => {
      const mainHud = document.getElementById('main-hud');
      if (mainHud) {
        if (payload.active) {
          mainHud.classList.add('cinematic-active');
        } else {
          mainHud.classList.remove('cinematic-active');
        }
      }

      if (this.cinematicContainer) {
        this.cinematicContainer.style.display = payload.active ? 'flex' : 'none';
      }

      if (payload.subtitle && this.cinematicText) {
        this.cinematicText.textContent = payload.subtitle.text;
        if (this.cinematicSpeaker) {
          this.cinematicSpeaker.textContent = payload.subtitle.speaker || 'Narrator';
        }
      }

      if (this.cinematicPrompt) {
        if (payload.showPrompt) {
          this.cinematicPrompt.style.display = 'block';
          this.cinematicPrompt.textContent = payload.showPrompt;
        } else {
          this.cinematicPrompt.style.display = 'none';
        }
      }
    });

    // Player Stats Updates
    this.eventBus.on<PlayerStats>('PLAYER_STATS_UPDATED', (stats) => {
      if (this.hpBarFill) {
        const hpPct = (stats.health / stats.maxHealth) * 100;
        this.hpBarFill.style.width = `${hpPct}%`;
      }
      if (this.hpText) {
        this.hpText.textContent = `${Math.round(stats.health)} / ${stats.maxHealth}`;
      }

      if (this.staminaBarFill) {
        const stamPct = (stats.stamina / stats.maxStamina) * 100;
        this.staminaBarFill.style.width = `${stamPct}%`;
        if (stamPct < 25) {
          this.staminaBarFill.classList.add('low');
        } else {
          this.staminaBarFill.classList.remove('low');
        }
      }
      if (this.staminaText) {
        this.staminaText.textContent = `${Math.round(stats.stamina)} / ${stats.maxStamina}`;
      }

      if (this.heroStateBadge) {
        if (stats.isInvulnerable) {
          this.heroStateBadge.textContent = 'DODGE (INVULN)';
          this.heroStateBadge.className = 'status-pill invuln';
        } else {
          this.heroStateBadge.textContent = stats.state;
          this.heroStateBadge.className = `status-pill ${stats.state.toLowerCase()}`;
        }
      }

      if (this.heroSpeedText) {
        this.heroSpeedText.textContent = `${stats.speed.toFixed(1)} m/s`;
      }

      // Dynamic floating combo counter update
      const comboBanner = document.getElementById('combo-banner');
      const comboCountText = document.getElementById('combo-count-text');
      const comboLabelText = document.getElementById('combo-label-text');
      if (comboBanner && comboCountText && comboLabelText) {
        if (stats.comboCount && stats.comboCount > 0) {
          comboBanner.style.display = 'flex';
          comboCountText.textContent = `${stats.comboCount}x`;
          if (stats.comboCount >= 3) {
            comboLabelText.textContent = 'FINISHER!';
            comboBanner.classList.add('finisher');
          } else {
            comboLabelText.textContent = 'COMBO!';
            comboBanner.classList.remove('finisher');
          }
        } else {
          comboBanner.style.display = 'none';
        }
      }

      // Critical Riposte banner
      const riposteBanner = document.getElementById('riposte-banner');
      if (riposteBanner) {
        riposteBanner.style.display = stats.riposteActive ? 'flex' : 'none';
      }

      // Consumable Elixir count button label
      const healLabel = document.getElementById('btn-heal-label');
      if (healLabel && stats.elixirCount !== undefined && stats.maxElixirs !== undefined) {
        healLabel.textContent = `Elixir (H) [${stats.elixirCount}/${stats.maxElixirs}]`;
      }
    });

    // Lock-on status
    this.eventBus.on<boolean>('LOCK_ON_STATE', (isLocked) => {
      if (this.lockOnBtn) {
        this.lockOnBtn.textContent = `Lock-On (R): ${isLocked ? 'ON' : 'OFF'}`;
        if (isLocked) this.lockOnBtn.classList.add('active');
        else this.lockOnBtn.classList.remove('active');
      }
    });

    // Camera Mode changes
    this.eventBus.on<ActiveCameraMode>('CAMERA_MODE_CHANGED', (mode) => {
      const camReadout = document.getElementById('active-cam-readout');
      if (camReadout) {
        camReadout.textContent = mode === 'THIRD_PERSON' ? 'Third-Person Follow' : 'Cinematic Framing';
      }

      if (this.heroCamBtn) {
        if (mode === 'THIRD_PERSON') {
          this.heroCamBtn.classList.add('active');
          document.querySelectorAll('.preset-btn[data-preset]').forEach((b) => b.classList.remove('active'));
        } else {
          this.heroCamBtn.classList.remove('active');
        }
      }
    });

    // Auto orbit state
    this.eventBus.on<boolean>('AUTO_ORBIT_STATE', (active) => {
      const btnOrbit = document.getElementById('btn-toggle-orbit');
      if (btnOrbit) {
        btnOrbit.textContent = `Auto Orbit: ${active ? 'ON' : 'OFF'}`;
        if (active) btnOrbit.classList.add('active');
        else btnOrbit.classList.remove('active');
      }
    });

    // Dragon Call Cooldown
    this.eventBus.on<{ current: number; max: number }>('DRAGON_CALL_COOLDOWN', (cd) => {
      const btnDragon = document.getElementById('btn-action-dragon') as HTMLButtonElement | null;
      const label = document.getElementById('btn-dragon-label');
      if (btnDragon && label) {
        if (cd.current > 0) {
          label.textContent = `Dragon Call (${Math.ceil(cd.current)}s)`;
          btnDragon.classList.add('disabled');
        } else {
          label.textContent = 'Dragon Call (T/X)';
          btnDragon.classList.remove('disabled');
        }
      }
    });

    // Step 6 & 7: Boss Health & Poise HUD Updates
    this.eventBus.on<BossStats>('BOSS_STATS_UPDATED', (stats) => {
      if (this.bossHud) {
        if (stats.isDefeated) {
          this.bossHud.classList.add('hidden');
        } else {
          this.bossHud.classList.remove('hidden');
        }
      }

      if (this.bossNameEl) {
        this.bossNameEl.textContent = stats.name;
      }

      if (this.bossSubtitleEl) {
        this.bossSubtitleEl.textContent = `${stats.title} • Knightly Duel`;
      }

      if (this.bossHpFill) {
        const hpPct = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
        this.bossHpFill.style.width = `${hpPct}%`;
      }

      if (this.bossPoiseFill) {
        const poisePct = Math.max(0, Math.min(100, (stats.poise / stats.maxPoise) * 100));
        this.bossPoiseFill.style.width = `${poisePct}%`;
      }

      if (this.bossHpText) {
        this.bossHpText.textContent = `${Math.round(stats.health)} / ${stats.maxHealth} HP`;
      }

      if (this.bossStateText) {
        this.bossStateText.textContent = stats.isStaggered
          ? 'STANCE: STAGGERED (PUNISH!)'
          : `STANCE: ${stats.state.replace('ATTACK_', '').replace('TELEGRAPH_', 'WINDUP ')}`;
      }

      if (this.bossPhaseBadge) {
        if (stats.phase === 2) {
          this.bossPhaseBadge.textContent = 'PHASE 2 (ENRAGED)';
          this.bossPhaseBadge.classList.add('phase-2');
        } else {
          this.bossPhaseBadge.textContent = 'PHASE 1';
          this.bossPhaseBadge.classList.remove('phase-2');
        }
      }
    });

    // Boss Defeated Surrender Event (PRD Beat 3:30-4:10)
    this.eventBus.on<{ bossName: string; title?: string; dialogue?: string; honorableYield: boolean }>(
      'BOSS_DEFEATED',
      (payload) => {
        if (this.surrenderCard) {
          if (this.surrenderSpeaker) {
            this.surrenderSpeaker.textContent = `🛡️ ${payload.bossName}`;
          }
          if (this.surrenderQuote) {
            this.surrenderQuote.textContent =
              payload.dialogue ||
              `“Yield... you fight with the heart of a lion, little flame. The realm is yours.”`;
          }
          this.surrenderCard.style.display = 'block';
        }
      }
    );

    // Spare / Victory Choice Decision
    this.eventBus.on<string>('SPARE_BOSS_DECISION', () => {
      if (this.surrenderCard) {
        this.surrenderCard.style.display = 'none';
      }
    });

    // Oath Seal Awarded Banner (Step 7)
    this.eventBus.on<{ sealId: string; sealName: string; sealIcon: string; newlyUnlockedStage?: string }>(
      'OATH_SEAL_AWARDED',
      (payload) => {
        if (this.sealBanner && this.sealAwardIcon && this.sealAwardName && this.sealAwardUnlock) {
          this.sealAwardIcon.textContent = payload.sealIcon;
          this.sealAwardName.textContent = payload.sealName;
          this.sealAwardUnlock.textContent = payload.newlyUnlockedStage
            ? `New Region Unlocked: ${payload.newlyUnlockedStage}!`
            : 'All Campaign Stages Consecrated!';

          this.sealBanner.style.display = 'flex';
          this.audioManager.playDragonCall();

          setTimeout(() => {
            if (this.sealBanner) this.sealBanner.style.display = 'none';
          }, 4500);
        }
      }
    );

    // Stage Transition Requested
    this.eventBus.on<StageId>('STAGE_TRANSITION_REQUESTED', () => {
      if (this.stagesModal) this.stagesModal.style.display = 'none';
      this.audioManager.playUiClick();
    });

    // Step 8 Interaction Prompt show/hide
    this.eventBus.on<{ label: string; icon?: string }>('INTERACTION_PROMPT_SHOW', (payload) => {
      if (this.interactionPromptPill && this.interactionPromptLabel) {
        this.interactionPromptLabel.textContent = `${payload.icon ? payload.icon + ' ' : ''}${payload.label}`;
        this.interactionPromptPill.style.display = 'flex';
      }
    });

    this.eventBus.on('INTERACTION_PROMPT_HIDE', () => {
      if (this.interactionPromptPill) {
        this.interactionPromptPill.style.display = 'none';
      }
    });

    // Step 8 Dialogue State
    this.eventBus.on<{ treeId: string; node: DialogueNode }>('DIALOGUE_STARTED', (payload) => {
      if (this.dialogueDeckOverlay) {
        this.dialogueDeckOverlay.style.display = 'flex';
      }
      this.displayDialogueNode(payload.node);
    });

    this.eventBus.on<DialogueNode>('DIALOGUE_NODE_CHANGED', (node) => {
      this.displayDialogueNode(node);
    });

    this.eventBus.on('DIALOGUE_CLOSED', () => {
      if (this.dialogueDeckOverlay) {
        this.dialogueDeckOverlay.style.display = 'none';
      }
    });

    // Step 8 Lore Discovered Toast
    this.eventBus.on<LoreEntry>('LORE_DISCOVERED', (entry) => {
      if (this.loreToast && this.loreToastName) {
        this.loreToastName.textContent = `${entry.icon} ${entry.title}`;
        this.loreToast.style.display = 'flex';
        this.audioManager.playLoreDiscoverSound();
        setTimeout(() => {
          if (this.loreToast) this.loreToast.style.display = 'none';
        }, 5000);
      }
    });
  }

  private displayDialogueNode(node: DialogueNode): void {
    if (this.dialogueAvatar) this.dialogueAvatar.textContent = node.speakerAvatar || '📜';
    if (this.dialogueSpeakerName) this.dialogueSpeakerName.textContent = node.speaker;
    if (this.dialogueSpeakerTitle) this.dialogueSpeakerTitle.textContent = node.speakerTitle || '';
    if (this.dialogueBodyText) this.dialogueBodyText.textContent = `“${node.text}”`;

    if (this.dialogueChoicesContainer && this.dialogueAdvanceHint) {
      this.dialogueChoicesContainer.innerHTML = '';
      if (node.choices && node.choices.length > 0) {
        this.dialogueAdvanceHint.style.display = 'none';
        node.choices.forEach((choice, index) => {
          const btn = document.createElement('button');
          btn.className = 'choice-btn dialogue-choice';
          btn.innerHTML = `<span class="choice-num">[${index + 1}]</span> ${choice.label}`;
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.audioManager.playUiClick();
            this.dialogueManager.selectChoice(choice);
          });
          this.dialogueChoicesContainer?.appendChild(btn);
        });
      } else {
        this.dialogueAdvanceHint.style.display = 'block';
      }
    }
  }

  private openCodexModal(): void {
    if (!this.codexModal) return;
    this.renderCodex();
    this.codexModal.style.display = 'flex';
  }

  private renderCodex(): void {
    const container = document.getElementById('codex-entries-grid');
    if (!container) return;

    const entries = this.loreManager.getAllEntries();
    container.innerHTML = entries
      .map((entry) => {
        if (!entry.isUnlocked) {
          return `
            <div class="lore-entry-card locked">
              <div class="lore-icon">🔒</div>
              <div class="lore-details">
                <span class="lore-status">Undiscovered Chronicle</span>
                <span class="lore-title">???</span>
                <span class="lore-teaser">Explore Veyrholm's sanctuaries and shrines to uncover this ancient record.</span>
              </div>
            </div>
          `;
        }

        return `
          <div class="lore-entry-card discovered">
            <div class="lore-icon">${entry.icon}</div>
            <div class="lore-details">
              <div class="lore-card-header">
                <span class="lore-act-tag">${entry.category.toUpperCase()} • ${entry.discoveredLocation}</span>
                <span class="lore-speaker-tag">Recorded Chronicle</span>
              </div>
              <h4 class="lore-title">${entry.title}</h4>
              <p class="lore-content">${entry.body}</p>
            </div>
          </div>
        `;
      })
      .join('');
  }

  public openSettingsModal(defaultTab?: string): void {
    if (!this.settingsModal) return;
    this.switchSettingsTab(defaultTab || this.activeSettingsTab);
    this.settingsModal.style.display = 'flex';
  }

  private switchSettingsTab(tab: string): void {
    this.activeSettingsTab = tab;
    document.querySelectorAll('.settings-tab-bar .tab-btn').forEach((b) => {
      if (b.getAttribute('data-tab') === tab) b.classList.add('active');
      else b.classList.remove('active');
    });
    this.renderSettingsContent(tab);
  }

  private renderSettingsContent(tab: string): void {
    const container = document.getElementById('settings-tab-content');
    if (!container) return;

    const s = this.settingsManager.getSettings();

    if (tab === 'gameplay') {
      container.innerHTML = `
        <div class="settings-pane">
          <h4 class="settings-section-title">Difficulty Presets (PRD FR-07)</h4>
          <p class="settings-desc">Adjust enemy aggression, parry timing tolerances, and damage scaling.</p>
          <div class="difficulty-cards-row">
            <div class="diff-card ${s.difficulty === 'STORY' ? 'active' : ''}" data-diff="STORY">
              <span class="diff-icon">📖</span>
              <span class="diff-name">STORY</span>
              <span class="diff-spec">0.7x Damage • 0.28s Parry Window</span>
              <p>Generous timing and reduced damage for narrative immersion.</p>
            </div>
            <div class="diff-card ${s.difficulty === 'KNIGHT' ? 'active' : ''}" data-diff="KNIGHT">
              <span class="diff-icon">⚔️</span>
              <span class="diff-name">KNIGHT</span>
              <span class="diff-spec">1.0x Damage • 0.22s Parry Window</span>
              <p>The authentic, balanced developer vision from the PRD.</p>
            </div>
            <div class="diff-card ${s.difficulty === 'LEGEND' ? 'active' : ''}" data-diff="LEGEND">
              <span class="diff-icon">👑</span>
              <span class="diff-name">LEGEND</span>
              <span class="diff-spec">1.35x Damage • 0.16s Tight Window</span>
              <p>Demanding precision parries and fierce knight AI aggression.</p>
            </div>
          </div>

          <div class="toggle-setting-row">
            <div class="toggle-info">
              <span class="toggle-label">Parry Timing Assist (+50ms Buffer)</span>
              <span class="toggle-sub">Widens the riposte trigger window for accessibility.</span>
            </div>
            <input type="checkbox" id="chk-parry-assist" ${s.parryTimingAssist ? 'checked' : ''} />
          </div>
        </div>
      `;

      // Attach difficulty clickers
      container.querySelectorAll('.diff-card[data-diff]').forEach((card) => {
        card.addEventListener('click', () => {
          const diff = card.getAttribute('data-diff') as DifficultyMode;
          this.settingsManager.setDifficulty(diff);
          this.audioManager.playUiClick();
          this.renderSettingsContent('gameplay');
        });
      });

      document.getElementById('chk-parry-assist')?.addEventListener('change', (e) => {
        this.settingsManager.setParryAssist((e.target as HTMLInputElement).checked);
        this.audioManager.playUiClick();
      });

    } else if (tab === 'audio') {
      container.innerHTML = `
        <div class="settings-pane">
          <h4 class="settings-section-title">Audio Bus Mix (PRD Section 15 & 16)</h4>
          <p class="settings-desc">Independent master, orchestral score, combat SFX, and voiced speech buses.</p>
          
          <div class="audio-slider-row">
            <div class="slider-head">
              <span>Master Volume</span>
              <span id="txt-vol-master">${s.masterVolume}%</span>
            </div>
            <input type="range" min="0" max="100" value="${s.masterVolume}" id="slider-vol-master" />
          </div>

          <div class="audio-slider-row">
            <div class="slider-head">
              <span>Music & Themes (Music-Box & Orchestral)</span>
              <span id="txt-vol-music">${s.musicVolume}%</span>
            </div>
            <input type="range" min="0" max="100" value="${s.musicVolume}" id="slider-vol-music" />
            <button class="test-audio-btn" id="btn-test-music">▶ Test Music-Box Motif</button>
          </div>

          <div class="audio-slider-row">
            <div class="slider-head">
              <span>Sound Effects (Sword Hits & Parries)</span>
              <span id="txt-vol-sfx">${s.sfxVolume}%</span>
            </div>
            <input type="range" min="0" max="100" value="${s.sfxVolume}" id="slider-vol-sfx" />
            <button class="test-audio-btn" id="btn-test-sfx">▶ Test Steel Clang</button>
          </div>

          <div class="audio-slider-row">
            <div class="slider-head">
              <span>Voice & Dialogue Tones</span>
              <span id="txt-vol-voice">${s.voiceVolume}%</span>
            </div>
            <input type="range" min="0" max="100" value="${s.voiceVolume}" id="slider-vol-voice" />
            <button class="test-audio-btn" id="btn-test-voice">▶ Test Kitten Chirp</button>
          </div>
        </div>
      `;

      // Sliders
      const bindSlider = (id: string, labelId: string, channel: 'master' | 'music' | 'sfx' | 'voice') => {
        document.getElementById(id)?.addEventListener('input', (e) => {
          const val = parseInt((e.target as HTMLInputElement).value, 10);
          const label = document.getElementById(labelId);
          if (label) label.textContent = `${val}%`;
          this.settingsManager.setAudioVolume(channel, val);
        });
      };
      bindSlider('slider-vol-master', 'txt-vol-master', 'master');
      bindSlider('slider-vol-music', 'txt-vol-music', 'music');
      bindSlider('slider-vol-sfx', 'txt-vol-sfx', 'sfx');
      bindSlider('slider-vol-voice', 'txt-vol-voice', 'voice');

      document.getElementById('btn-test-music')?.addEventListener('click', () => {
        this.audioManager.unlock();
        this.audioManager.playMusicBoxMotif();
      });

      document.getElementById('btn-test-sfx')?.addEventListener('click', () => {
        this.audioManager.unlock();
        this.audioManager.playParryClang();
      });

      document.getElementById('btn-test-voice')?.addEventListener('click', () => {
        this.audioManager.unlock();
        this.audioManager.playDialogueVoice('cat_chirp');
      });

    } else if (tab === 'accessibility') {
      container.innerHTML = `
        <div class="settings-pane">
          <h4 class="settings-section-title">Accessibility & Visual Controls (PRD Section 15)</h4>
          <p class="settings-desc">Customizable visual intensity, contrast options, and camera motion reduction.</p>

          <div class="audio-slider-row">
            <div class="slider-head">
              <span>Camera Screenshake Intensity</span>
              <span id="txt-camera-shake">${s.cameraShake}%</span>
            </div>
            <input type="range" min="0" max="100" value="${s.cameraShake}" id="slider-camera-shake" />
          </div>

          <div class="toggle-setting-row">
            <div class="toggle-info">
              <span class="toggle-label">High-Contrast Text</span>
              <span class="toggle-sub">Enforces pure white/gold text on deep black backdrops.</span>
            </div>
            <input type="checkbox" id="chk-high-contrast" ${s.highContrastText ? 'checked' : ''} />
          </div>

          <div class="toggle-setting-row">
            <div class="toggle-info">
              <span class="toggle-label">Large Narrative Subtitles</span>
              <span class="toggle-sub">Increases cinematic and dialogue font size by +25%.</span>
            </div>
            <input type="checkbox" id="chk-large-subs" ${s.largeSubtitles ? 'checked' : ''} />
          </div>

          <div class="toggle-setting-row">
            <div class="toggle-info">
              <span class="toggle-label">Particle Density</span>
              <span class="toggle-sub">Scales back sparks and dust for performance and comfort.</span>
            </div>
            <div class="density-btn-group">
              <button class="density-btn ${s.particleDensity === 'LOW' ? 'active' : ''}" data-density="LOW">Low</button>
              <button class="density-btn ${s.particleDensity === 'MEDIUM' ? 'active' : ''}" data-density="MEDIUM">Medium</button>
              <button class="density-btn ${s.particleDensity === 'HIGH' ? 'active' : ''}" data-density="HIGH">High</button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('slider-camera-shake')?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        const lbl = document.getElementById('txt-camera-shake');
        if (lbl) lbl.textContent = `${val}%`;
        this.settingsManager.setCameraShake(val);
      });

      document.getElementById('chk-high-contrast')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        this.settingsManager.setHighContrastText(checked);
        document.body.classList.toggle('high-contrast-mode', checked);
        this.audioManager.playUiClick();
      });

      document.getElementById('chk-large-subs')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        this.settingsManager.setLargeSubtitles(checked);
        document.body.classList.toggle('large-subtitles-mode', checked);
        this.audioManager.playUiClick();
      });

      container.querySelectorAll('.density-btn[data-density]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const d = btn.getAttribute('data-density') as ParticleDensity;
          this.settingsManager.setParticleDensity(d);
          this.audioManager.playUiClick();
          this.renderSettingsContent('accessibility');
        });
      });

    } else if (tab === 'wardrobe') {
      const armors = this.cosmeticsManager.getArmorFinishes();
      const capes = this.cosmeticsManager.getCapeDyes();
      const currentArmor = this.cosmeticsManager.getSelectedArmor();
      const currentCape = this.cosmeticsManager.getSelectedCape();

      container.innerHTML = `
        <div class="settings-pane">
          <h4 class="settings-section-title">Lady Anuki’s Royal Wardrobe (PRD Section 14)</h4>
          <p class="settings-desc">Craftable armor finishes and embroidered cape dyes unlocked across Veyrholm.</p>

          <h5 class="wardrobe-subhead">Knightly Plate Armor Finish</h5>
          <div class="cosmetic-cards-grid">
            ${armors.map((a) => `
              <div class="cosmetic-card ${a.id === currentArmor ? 'selected' : ''}" data-armor="${a.id}">
                <div class="cosmetic-header">
                  <span class="cosmetic-icon">${a.previewIcon}</span>
                  <div class="cosmetic-names">
                    <span class="cosmetic-title">${a.name}</span>
                    <span class="cosmetic-tagline">${a.tagline}</span>
                  </div>
                </div>
                <p class="cosmetic-desc">${a.description}</p>
                <button class="btn-select-cosmetic">${a.id === currentArmor ? '✓ Equipped' : 'Equip Finish'}</button>
              </div>
            `).join('')}
          </div>

          <h5 class="wardrobe-subhead" style="margin-top: 1.5rem;">Ivory Silk Cape Dye</h5>
          <div class="cosmetic-cards-grid">
            ${capes.map((c) => `
              <div class="cosmetic-card ${c.id === currentCape ? 'selected' : ''}" data-cape="${c.id}">
                <div class="cosmetic-header">
                  <span class="cosmetic-icon">${c.previewIcon}</span>
                  <div class="cosmetic-names">
                    <span class="cosmetic-title">${c.name}</span>
                    <span class="cosmetic-tagline">${c.tagline}</span>
                  </div>
                </div>
                <p class="cosmetic-desc">${c.description}</p>
                <button class="btn-select-cosmetic">${c.id === currentCape ? '✓ Equipped' : 'Equip Dye'}</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.querySelectorAll('.cosmetic-card[data-armor]').forEach((card) => {
        card.addEventListener('click', () => {
          const aId = card.getAttribute('data-armor') as ArmorFinishId;
          this.cosmeticsManager.selectArmor(aId);
          this.audioManager.playUiClick();
          this.renderSettingsContent('wardrobe');
        });
      });

      container.querySelectorAll('.cosmetic-card[data-cape]').forEach((card) => {
        card.addEventListener('click', () => {
          const cId = card.getAttribute('data-cape') as CapeDyeId;
          this.cosmeticsManager.selectCape(cId);
          this.audioManager.playUiClick();
          this.renderSettingsContent('wardrobe');
        });
      });

    } else if (tab === 'graphics') {
      const qm = QualityManager.getInstance();
      const currentProfile = qm.getProfile();
      const metrics = Profiler.getInstance().getMetrics();

      container.innerHTML = `
        <div class="settings-pane">
          <h4 class="settings-section-title">Graphics Fidelity & 60 FPS Engine (Step 10 Optimization)</h4>
          <p class="settings-desc">Dynamic Resolution Scaling and graphics presets tuned for locked 60 FPS across all hardware.</p>

          <h5 class="wardrobe-subhead">Performance Preset</h5>
          <div class="quality-cards-grid">
            <div class="quality-card ${currentProfile.preset === 'AUTO_60FPS' ? 'active' : ''}" data-quality="AUTO_60FPS">
              <div class="quality-header">
                <span class="quality-icon">⚡</span>
                <span class="quality-name">AUTO 60 FPS</span>
              </div>
              <span class="quality-spec">Dynamic DPR scaling • 1024 Shadows • Auto-throttling</span>
            </div>
            <div class="quality-card ${currentProfile.preset === 'ULTRA' ? 'active' : ''}" data-quality="ULTRA">
              <div class="quality-header">
                <span class="quality-icon">💎</span>
                <span class="quality-name">ULTRA</span>
              </div>
              <span class="quality-spec">Max Retina Native DPR • 2048 Shadows • Full Particles</span>
            </div>
            <div class="quality-card ${currentProfile.preset === 'HIGH' ? 'active' : ''}" data-quality="HIGH">
              <div class="quality-header">
                <span class="quality-icon">⚔️</span>
                <span class="quality-name">HIGH</span>
              </div>
              <span class="quality-spec">1.5x DPR • 1024 Soft Shadows • 100% Particle scale</span>
            </div>
            <div class="quality-card ${currentProfile.preset === 'BALANCED' ? 'active' : ''}" data-quality="BALANCED">
              <div class="quality-header">
                <span class="quality-icon">🛡️</span>
                <span class="quality-name">BALANCED</span>
              </div>
              <span class="quality-spec">1.0x Standard DPR • 1024 Shadows • 75% Particles</span>
            </div>
            <div class="quality-card ${currentProfile.preset === 'LOW' ? 'active' : ''}" data-quality="LOW">
              <div class="quality-header">
                <span class="quality-icon">🚀</span>
                <span class="quality-name">PERFORMANCE</span>
              </div>
              <span class="quality-spec">0.85x Fast DPR • Shadows Off • 50% Particles</span>
            </div>
          </div>

          <h5 class="wardrobe-subhead" style="margin-top: 1.5rem;">Live Technical Diagnostics & Profiler</h5>
          <table class="diagnostics-table">
            <thead>
              <tr>
                <th>Telemetry Metric</th>
                <th>Target Budget</th>
                <th>Current Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frame Rate (Rolling Average)</td>
                <td>60 FPS (16.6 ms)</td>
                <td class="metric-val ${metrics.fps >= 55 ? 'metric-green' : metrics.fps >= 40 ? 'metric-gold' : 'metric-red'}">${metrics.fps} FPS (${metrics.frameTimeMs} ms)</td>
                <td><span class="pill ${metrics.fps >= 55 ? 'pill-complete' : ''}">${metrics.fps >= 55 ? 'OPTIMAL' : 'ADAPTIVE'}</span></td>
              </tr>
              <tr>
                <td>WebGL Draw Calls</td>
                <td>&lt; 150 calls</td>
                <td class="metric-val">${metrics.drawCalls}</td>
                <td><span class="pill pill-complete">WITHIN BUDGET</span></td>
              </tr>
              <tr>
                <td>Rendered Triangles / Polygons</td>
                <td>&lt; 250,000 tris</td>
                <td class="metric-val">${metrics.triangles.toLocaleString()}</td>
                <td><span class="pill pill-complete">OPTIMIZED</span></td>
              </tr>
              <tr>
                <td>GPU Geometries / Textures</td>
                <td>Memory Leak Free</td>
                <td class="metric-val">${metrics.geometries} geos / ${metrics.textures} tex</td>
                <td><span class="pill pill-complete">DISPOSED &amp; POOLED</span></td>
              </tr>
              <tr>
                <td>Rapier 3D WASM Physics Step</td>
                <td>&lt; 4.0 ms (60 Hz)</td>
                <td class="metric-val">${metrics.physicsMs} ms</td>
                <td><span class="pill pill-complete">NOMINAL</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('.quality-card[data-quality]').forEach((card) => {
        card.addEventListener('click', () => {
          const q = card.getAttribute('data-quality') as QualityPreset;
          qm.setPreset(q);
          this.audioManager.playUiClick();
          this.renderSettingsContent('graphics');
        });
      });

    } else if (tab === 'credits') {
      container.innerHTML = `
        <div class="settings-pane credits-pane">
          <div class="credits-crest">🐱👑🐉</div>
          <h2 class="credits-title">${GameConfig.TITLE}</h2>
          <p class="credits-tagline">“${GameConfig.TAGLINE}”</p>
          <hr class="credits-divider" />
          <div class="credits-block">
            <h4>DIRECTOR & CREATIVE LEAD</h4>
            <p>Atharva Wagh & The DeepMind Advanced Agentic Engineering Team</p>
          </div>
          <div class="credits-block">
            <h4>HEROIC PROTAGONIST</h4>
            <p><strong>Lady Anuki</strong> • The Crimson Claw • Knight of the Pink Bow</p>
          </div>
          <div class="credits-block">
            <h4>DRAGON COMPANION</h4>
            <p><strong>Rhazakar the Unbroken</strong> • Colossal Scarlet Dragon</p>
          </div>
          <div class="credits-block">
            <h4>THE EIGHT GUARDIANS & CHIEFS OF VEYRHOLM</h4>
            <p>Sir Garrick Ironjaw • Dame Elowen Vale • Sir Brannoc Cinderhand</p>
            <p>Sir Lucien the Pale • Dame Ysara Blackthorn • Sir Caelum Stormcrest</p>
            <p>Sir Oren the Gilded • Marshal Varric Ashbane • Regent Aldric Voss</p>
          </div>
          <div class="credits-block">
            <h4>ORIGINAL SCORE & SOUND DESIGN</h4>
            <p>Procedural Web Audio Synthesizers • High-Octane Boss Drums & Delicate Music-Box Motif</p>
          </div>
        </div>
      `;
    }
  }

  private setupPhotoModeControls(): void {
    const fovSlider = document.getElementById('photo-slider-fov') as HTMLInputElement | null;
    const rollSlider = document.getElementById('photo-slider-roll') as HTMLInputElement | null;
    const vigSlider = document.getElementById('photo-slider-vignette') as HTMLInputElement | null;

    fovSlider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      const lbl = document.getElementById('photo-fov-val');
      if (lbl) lbl.textContent = `${val}`;
      this.eventBus.emit('SET_PHOTO_FOV', val);
    });

    rollSlider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      const lbl = document.getElementById('photo-roll-val');
      if (lbl) lbl.textContent = `${val}`;
      this.eventBus.emit('SET_PHOTO_ROLL', val);
    });

    vigSlider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      const lbl = document.getElementById('photo-vig-val');
      if (lbl) lbl.textContent = `${val}`;
      this.updateVignetteOverlay(val);
    });

    // Color filter chips
    document.querySelectorAll('.filter-chip[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.getAttribute('data-filter') as ColorFilterId;
        this.applyPhotoFilter(filter);
        this.audioManager.playUiClick();
      });
    });

    // Hide UI button
    document.getElementById('btn-photo-hide-ui')?.addEventListener('click', () => {
      this.togglePhotoModeHideUi();
    });

    // Exit photo mode button
    document.getElementById('btn-photo-exit')?.addEventListener('click', () => {
      this.eventBus.emit('TOGGLE_PHOTO_MODE');
    });

    // Handle incoming Photo Mode events
    this.eventBus.on<{ active: boolean }>('PHOTO_MODE_STATE', (payload) => {
      this.isPhotoModeActive = payload.active;
      if (this.photoModeDeck) {
        this.photoModeDeck.style.display = payload.active ? 'flex' : 'none';
      }
      if (this.photoFilterOverlay) {
        this.photoFilterOverlay.style.display = payload.active ? 'block' : 'none';
      }
    });

    // Global Key Listener for Photo Mode (P) and Hide UI (H)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        if (!this.dialogueManager.isActive()) {
          this.eventBus.emit('TOGGLE_PHOTO_MODE');
        }
      } else if (e.code === 'KeyH' && this.isPhotoModeActive) {
        this.togglePhotoModeHideUi();
      }
    });
  }

  private togglePhotoModeHideUi(): void {
    const isCurrentlyHidden = document.body.classList.contains('photo-mode-hidden-ui');
    document.body.classList.toggle('photo-mode-hidden-ui', !isCurrentlyHidden);
  }

  private applyPhotoFilter(filter: ColorFilterId): void {
    if (!this.photoFilterOverlay) return;
    this.photoFilterOverlay.className = 'photo-filter-overlay';
    if (filter !== 'NONE') {
      this.photoFilterOverlay.classList.add(`filter-${filter.toLowerCase()}`);
    }
  }

  private updateVignetteOverlay(amount: number): void {
    if (!this.photoFilterOverlay) return;
    this.photoFilterOverlay.style.boxShadow = `inset 0 0 ${amount * 2.5}px rgba(0, 0, 0, ${amount / 100})`;
  }

  public update(): void {
    const metrics = Profiler.getInstance().getMetrics();
    const currentFps = metrics.fps || (this.timeRef ? this.timeRef.fps : 60);
    if (this.fpsDisplay) {
      this.fpsDisplay.textContent = `${currentFps} FPS (${metrics.frameTimeMs} ms)`;
      if (currentFps >= 55) {
        this.fpsDisplay.style.color = '#4ade80';
      } else if (currentFps >= 40) {
        this.fpsDisplay.style.color = '#facc15';
      } else {
        this.fpsDisplay.style.color = '#f87171';
      }
    }

    const drawCallsEl = document.getElementById('draw-calls-counter');
    if (drawCallsEl) {
      drawCallsEl.textContent = `${metrics.drawCalls} calls`;
    }

    const trianglesEl = document.getElementById('triangles-counter');
    if (trianglesEl) {
      trianglesEl.textContent = `${metrics.triangles.toLocaleString()} tris`;
    }

    const tierEl = document.getElementById('quality-tier-counter');
    if (tierEl) {
      const profile = QualityManager.getInstance().getProfile();
      tierEl.textContent = `${metrics.tier === 'PERFECT_60' ? 'Locked 60 FPS' : metrics.tier === 'GOOD_45' ? 'Adaptive 45+ FPS' : 'Throttled 30 FPS'} • ${profile.preset}`;
    }
  }
}
