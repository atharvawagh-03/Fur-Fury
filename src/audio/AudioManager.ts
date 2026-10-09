/**
 * Web Audio API Manager
 * Controls master, music, and sfx bus gains, with procedural sound fallbacks.
 */

import { GameConfig } from '../config/GameConfig';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isUnlocked: boolean = false;
  public get unlocked(): boolean {
    return this.isUnlocked;
  }

  constructor() {
    // AudioContext will be initialized or resumed on first interaction
  }

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = GameConfig.AUDIO.MASTER_VOLUME;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = GameConfig.AUDIO.MUSIC_VOLUME;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = GameConfig.AUDIO.SFX_VOLUME;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      });
    } else {
      this.isUnlocked = true;
    }
  }

  public unlock(): void {
    this.initContext();
  }

  /**
   * Procedural audio cue for physical impact / sword hit feedback
   */
  public playHitSound(pitch: number = 220): void {
    if (!this.ctx || !this.sfxGain) {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Procedural audio cue for UI interaction / menu click
   */
  public playUiClick(): void {
    if (!this.ctx || !this.sfxGain) {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  /**
   * Kitten paw footstep with subtle armor plate jingle
   */
  public playFootstep(isSprint: boolean = false): void {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Low frequency paw tap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = isSprint ? 180 : 150;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.06);

    gain.gain.setValueAtTime(isSprint ? 0.08 : 0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);

    // High subtle armor metal jingle
    const armorOsc = this.ctx.createOscillator();
    const armorGain = this.ctx.createGain();
    armorOsc.type = 'triangle';
    armorOsc.frequency.setValueAtTime(2400 + Math.random() * 600, t);
    armorOsc.frequency.exponentialRampToValueAtTime(1800, t + 0.04);

    armorGain.gain.setValueAtTime(0.02, t);
    armorGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    armorOsc.connect(armorGain);
    armorGain.connect(this.sfxGain);
    armorOsc.start(t);
    armorOsc.stop(t + 0.04);
  }

  /**
   * Evasive dodge roll swoosh
   */
  public playDodgeWhoosh(): void {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Moonfang sword swing whoosh
   */
  public playSwordSwing(heavy: boolean = false): void {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const dur = heavy ? 0.35 : 0.22;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = heavy ? 380 : 540;
    const endFreq = heavy ? 110 : 160;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

    gain.gain.setValueAtTime(heavy ? 0.24 : 0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  /**
   * Jumping hop audio cue
   */
  public playJumpSound(): void {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Steel blade parry clang
   */
  public playParryClang(): void {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Resonant low-frequency dragon wing flap displacement whoosh
   */
  public playDragonWingFlap(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.45);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  /**
   * Colossal multi-layered dragon roar (guttural growl + brass resonance + screech)
   */
  public playDragonRoar(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Low sub growl
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(85, t);
    subOsc.frequency.linearRampToValueAtTime(120, t + 0.4);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 1.8);
    subGain.gain.setValueAtTime(0.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 1.8);

    // 2. Brass draconic roar resonance
    const midOsc = this.ctx.createOscillator();
    const midGain = this.ctx.createGain();
    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(220, t);
    midOsc.frequency.linearRampToValueAtTime(340, t + 0.5);
    midOsc.frequency.exponentialRampToValueAtTime(110, t + 1.6);
    midGain.gain.setValueAtTime(0.28, t);
    midGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    midOsc.connect(midGain);
    midGain.connect(this.sfxGain);
    midOsc.start(t);
    midOsc.stop(t + 1.6);

    // 3. High harmonic screech
    const highOsc = this.ctx.createOscillator();
    const highGain = this.ctx.createGain();
    highOsc.type = 'sine';
    highOsc.frequency.setValueAtTime(650, t + 0.1);
    highOsc.frequency.exponentialRampToValueAtTime(320, t + 1.2);
    highGain.gain.setValueAtTime(0.18, t + 0.1);
    highGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    highOsc.connect(highGain);
    highGain.connect(this.sfxGain);
    highOsc.start(t + 0.1);
    highOsc.stop(t + 1.2);
  }

  /**
   * Earth-shattering touchdown landing impact (sub-bass drop + heavy crunch)
   */
  public playDragonImpact(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.6);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  /**
   * Muffled tense cinematic heartbeat
   */
  public playHeartbeat(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Lub
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    gain1.gain.setValueAtTime(0.25, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Dub
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55, t + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(30, t + 0.32);
    gain2.gain.setValueAtTime(0.2, t + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.18);
    osc2.stop(t + 0.32);
  }

  /**
   * Majestic heroic fanfare stinger for Anuki's arrival
   */
  public playCinematicFanfare(): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5 major chord

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.15);

      gain.gain.setValueAtTime(0.08, t + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.15 + 1.5);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + idx * 0.15);
      osc.stop(t + idx * 0.15 + 1.5);
    });
  }

  public setMasterVolume(val: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, val));
  }
}
