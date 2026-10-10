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

  // Real-time elements
  private hpBarFill: HTMLElement | null = null;
  private hpText: HTMLElement | null = null;
  private staminaBarFill: HTMLElement | null = null;
  private staminaText: HTMLElement | null = null;
  private heroStateBadge: HTMLElement | null = null;
  private heroSpeedText: HTMLElement | null = null;
  private lockOnBtn: HTMLElement | null = null;
  private heroCamBtn: HTMLElement | null = null;

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
        </header>

        <!-- Milestone Badge -->
        <div class="milestone-badge">
          <span class="pill">STEP 4 ACTIVE</span>
          <span class="milestone-desc">Rhazakar Dragon & Opening Cinematic</span>
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
            <span class="legend-chip"><kbd>J</kbd> Light Attack / Draw Blade</span>
            <span class="legend-chip"><kbd>K</kbd> Heavy Strike</span>
            <span class="legend-chip"><kbd>Q / F</kbd> Parry</span>
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

    this.attachDomListeners();
  }

  private attachDomListeners(): void {
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
  }

  public update(): void {
    if (this.fpsDisplay && this.timeRef) {
      this.fpsDisplay.textContent = `${this.timeRef.fps} FPS`;
    }
  }
}
