/**
 * UI Manager
 * Handles HUD rendering, diagnostics overlay, controls prompt, and interactive testing panels.
 */

import { GameConfig } from '../config/GameConfig';
import { EventBus } from '../core/EventBus';
import { Time } from '../core/Time';
import { AudioManager } from '../audio/AudioManager';

export class UIManager {
  private overlayContainer: HTMLElement;
  private fpsDisplay: HTMLElement | null = null;
  private timeRef: Time | null = null;
  private eventBus = EventBus.getInstance();
  private audioManager: AudioManager;

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.overlayContainer = container;
    this.audioManager = audioManager;
    this.createHud();
  }

  public setTimeReference(time: Time): void {
    this.timeRef = time;
  }

  private createHud(): void {
    this.overlayContainer.innerHTML = `
      <div class="game-hud">
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
          <span class="pill">STEP 2 ACTIVE</span>
          <span class="milestone-desc">3D World: Grand Arena & Medieval Environment</span>
        </div>

        <!-- Telemetry & Diagnostic Panel -->
        <div class="telemetry-panel">
          <div class="telemetry-item">
            <span class="label">FRAME RATE</span>
            <span class="value" id="fps-counter">60 FPS</span>
          </div>
          <div class="telemetry-item">
            <span class="label">PHYSICS ENGINE</span>
            <span class="value highlight">Rapier 3D (36m Colosseum Bounds)</span>
          </div>
          <div class="telemetry-item">
            <span class="label">RENDERER</span>
            <span class="value">Three.js PBR + ACES ToneMap</span>
          </div>
          <div class="telemetry-item">
            <span class="label">ZONE</span>
            <span class="value">Grand Arena of Veyrholm</span>
          </div>
        </div>

        <!-- Camera Vantage Controls -->
        <div class="camera-controls-deck">
          <span class="deck-title">CINEMATIC VANTAGE</span>
          <div class="preset-btn-group">
            <button class="preset-btn active" data-preset="OVERVIEW">Arena Overview</button>
            <button class="preset-btn" data-preset="GATE">North Gate (Garrick)</button>
            <button class="preset-btn" data-preset="ROYAL_BOX">Regent's Box</button>
            <button class="preset-btn" data-preset="DUEL_CENTER">Center Ring</button>
            <button class="preset-btn toggle" id="btn-toggle-orbit">Auto Orbit: OFF</button>
          </div>
        </div>

        <!-- Interactive Control Deck -->
        <div class="control-deck">
          <button id="btn-spawn-crest" class="btn-action">
            <span class="icon">✨</span>
            <span>Drop Physical Prop (Space)</span>
          </button>
          <button id="btn-test-sound" class="btn-action secondary">
            <span class="icon">🔔</span>
            <span>Test Audio Synth</span>
          </button>
        </div>

        <!-- Combat & Keybinding Hints per PRD -->
        <footer class="hud-footer">
          <div class="controls-legend">
            <span class="legend-chip"><kbd>WASD</kbd> Move</span>
            <span class="legend-chip"><kbd>SPACE</kbd> Dodge / Drop Crest</span>
            <span class="legend-chip"><kbd>J</kbd> Light Attack</span>
            <span class="legend-chip"><kbd>K</kbd> Heavy Attack</span>
            <span class="legend-chip"><kbd>Q / F</kbd> Parry</span>
            <span class="legend-chip"><kbd>SHIFT</kbd> Guard</span>
            <span class="legend-chip"><kbd>R</kbd> Lock-on</span>
            <span class="legend-chip"><kbd>T</kbd> Call Dragon (Rhazakar)</span>
          </div>
        </footer>
      </div>
    `;

    this.fpsDisplay = document.getElementById('fps-counter');

    // Attach camera preset listeners
    const presetButtons = document.querySelectorAll<HTMLButtonElement>('.preset-btn[data-preset]');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetButtons.forEach((b) => b.classList.remove('active'));
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
      this.eventBus.on<boolean>('AUTO_ORBIT_STATE', (active) => {
        btnOrbit.textContent = `Auto Orbit: ${active ? 'ON' : 'OFF'}`;
        if (active) btnOrbit.classList.add('active');
        else btnOrbit.classList.remove('active');
      });

      btnOrbit.addEventListener('click', () => {
        this.eventBus.emit('TOGGLE_AUTO_ORBIT');
      });
    }

    // Attach prop drop listener
    const btnSpawn = document.getElementById('btn-spawn-crest');
    if (btnSpawn) {
      btnSpawn.addEventListener('click', () => {
        this.audioManager.unlock();
        this.eventBus.emit('SPAWN_PHYSICS_PROP');
      });
    }

    const btnSound = document.getElementById('btn-test-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        this.audioManager.unlock();
        this.audioManager.playUiClick();
        this.audioManager.playHitSound(440);
      });
    }

    // Auto unlock audio on any document interaction
    window.addEventListener('pointerdown', () => this.audioManager.unlock(), { once: true });
    window.addEventListener('keydown', () => this.audioManager.unlock(), { once: true });
  }

  public update(): void {
    if (this.fpsDisplay && this.timeRef) {
      this.fpsDisplay.textContent = `${this.timeRef.fps} FPS`;
    }
  }
}
