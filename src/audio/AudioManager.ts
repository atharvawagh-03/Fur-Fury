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

  public setMasterVolume(val: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, val));
  }
}
