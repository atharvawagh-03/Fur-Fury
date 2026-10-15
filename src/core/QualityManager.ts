/**
 * Dynamic Quality & Performance Scaling Manager - Step 10
 * Monitors real-time frame rates and dynamically adapts pixel ratio, shadow fidelity,
 * and particle budgets to ensure rock-solid 60 FPS gameplay.
 */

import * as THREE from 'three';
import { EventBus } from './EventBus';
import type { PerformanceMetrics } from './Profiler';
import { GameConfig } from '../config/GameConfig';

export type QualityPreset = 'AUTO_60FPS' | 'ULTRA' | 'HIGH' | 'BALANCED' | 'LOW';

export interface QualityProfile {
  preset: QualityPreset;
  pixelRatio: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  particlesEnabled: boolean;
  particleBudgetScale: number;
  autoScaleActive: boolean;
}

export class QualityManager {
  private static instance: QualityManager | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private currentPreset: QualityPreset = 'AUTO_60FPS';
  private currentPixelRatio: number = 1.0;
  private targetMaxPixelRatio: number = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1.5, GameConfig.GRAPHICS.PIXEL_RATIO_MAX);
  private currentShadows: boolean = true;
  private currentShadowMapSize: number = 2048;
  private currentParticleScale: number = 1.0;

  // Adaptive throttling counters
  private degradedFrameCount: number = 0;
  private stableFrameCount: number = 0;
  private eventBus = EventBus.getInstance();

  public static getInstance(): QualityManager {
    if (!this.instance) {
      this.instance = new QualityManager();
    }
    return this.instance;
  }

  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.applyProfile();
  }

  public setPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
    switch (preset) {
      case 'ULTRA':
        this.currentPixelRatio = this.targetMaxPixelRatio;
        this.currentShadows = true;
        this.currentShadowMapSize = 2048;
        this.currentParticleScale = 1.0;
        break;
      case 'HIGH':
        this.currentPixelRatio = Math.min(1.5, this.targetMaxPixelRatio);
        this.currentShadows = true;
        this.currentShadowMapSize = 1024;
        this.currentParticleScale = 1.0;
        break;
      case 'BALANCED':
        this.currentPixelRatio = 1.0;
        this.currentShadows = true;
        this.currentShadowMapSize = 1024;
        this.currentParticleScale = 0.75;
        break;
      case 'LOW':
        this.currentPixelRatio = 0.85;
        this.currentShadows = false;
        this.currentShadowMapSize = 512;
        this.currentParticleScale = 0.5;
        break;
      case 'AUTO_60FPS':
      default:
        this.currentPixelRatio = Math.min(1.5, this.targetMaxPixelRatio);
        this.currentShadows = true;
        this.currentShadowMapSize = 1024;
        this.currentParticleScale = 1.0;
        break;
    }

    this.applyProfile();
    this.eventBus.emit('QUALITY_SETTINGS_CHANGED', this.getProfile());
  }

  /**
   * Called every frame to run dynamic auto-scaling when in AUTO_60FPS mode
   */
  public update(metrics: PerformanceMetrics): void {
    if (this.currentPreset !== 'AUTO_60FPS') return;

    if (metrics.fps < 45) {
      this.degradedFrameCount++;
      this.stableFrameCount = 0;

      // If lagging consistently for over 45 frames (approx 0.75-1 sec)
      if (this.degradedFrameCount > 45) {
        this.degradedFrameCount = 0;
        if (this.currentPixelRatio > 0.85) {
          this.currentPixelRatio = Math.max(0.75, Math.round((this.currentPixelRatio - 0.2) * 100) / 100);
          this.currentParticleScale = Math.max(0.5, this.currentParticleScale - 0.25);
          this.applyProfile();
          console.log(`[QualityManager] Throttled resolution to DPR ${this.currentPixelRatio} to sustain 60 FPS.`);
        }
      }
    } else if (metrics.fps >= 58) {
      this.stableFrameCount++;
      this.degradedFrameCount = 0;

      // If rock-solid 60 FPS for over 300 frames (~5 seconds), gently recover quality
      if (this.stableFrameCount > 300) {
        this.stableFrameCount = 0;
        if (this.currentPixelRatio < this.targetMaxPixelRatio) {
          this.currentPixelRatio = Math.min(this.targetMaxPixelRatio, Math.round((this.currentPixelRatio + 0.1) * 100) / 100);
          this.currentParticleScale = Math.min(1.0, this.currentParticleScale + 0.25);
          this.applyProfile();
          console.log(`[QualityManager] Recovered resolution to DPR ${this.currentPixelRatio}.`);
        }
      }
    } else {
      this.degradedFrameCount = 0;
      this.stableFrameCount = 0;
    }
  }

  private applyProfile(): void {
    if (!this.renderer) return;

    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.shadowMap.enabled = this.currentShadows;
  }

  public getProfile(): QualityProfile {
    return {
      preset: this.currentPreset,
      pixelRatio: this.currentPixelRatio,
      shadowsEnabled: this.currentShadows,
      shadowMapSize: this.currentShadowMapSize,
      particlesEnabled: this.currentParticleScale > 0.3,
      particleBudgetScale: this.currentParticleScale,
      autoScaleActive: this.currentPreset === 'AUTO_60FPS',
    };
  }
}
