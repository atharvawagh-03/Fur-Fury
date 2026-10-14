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
          </div>
        </header>

        <!-- Milestone Badge -->
        <div class="milestone-badge">
          <span class="pill">STEP 7 ACTIVE</span>
          <span class="milestone-desc">Level Progression & Boss Battles</span>
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
            <span class="label">DRAGON COMPANION</span>
            <span class="value highlight">Rhazakar (Colossal Scarlet Dragon)</span>
          </div>
          <div class="telemetry-item">
            <span class="label">MODEL RIG</span>
            <span class="value">Articulated 3D Kitten + PBR + Cape</span>
          </div>
          <div class="telemetry-item">
            <span class="label">CAMERA</span>
            <span class="value" id="active-cam-readout">Third-Person Follow</span>
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
  }

  public update(): void {
    if (this.fpsDisplay && this.timeRef) {
      this.fpsDisplay.textContent = `${this.timeRef.fps} FPS`;
    }
  }
}
