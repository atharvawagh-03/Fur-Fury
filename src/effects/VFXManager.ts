/**
 * VFX & Polish Manager - Step 9
 * Conforming strictly to PRD Section 9 ("Hit feedback: weapon trails, hit-stop under 100 ms, camera impulse")
 * and Section 16 ("Audio and cinematic direction: calibrated effects, restrained particle noise").
 */

import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import { CameraManager } from '../camera/CameraManager';
import { SettingsManager } from '../settings/SettingsManager';

export class VFXManager {
  private static instance: VFXManager | null = null;
  private scene: THREE.Scene;
  private cameraManager: CameraManager;
  private settingsManager = SettingsManager.getInstance();
  private eventBus = EventBus.getInstance();

  private hitStopRemainingTime: number = 0;
  private isHitStopActive: boolean = false;

  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

  // Particle pool for spark bursts
  private sparkParticles: THREE.Points | null = null;
  private sparkPositions: Float32Array = new Float32Array(300);
  private sparkVelocities: Float32Array = new Float32Array(300);
  private sparkLifetimes: Float32Array = new Float32Array(100);

  public static getInstance(scene?: THREE.Scene, cameraManager?: CameraManager): VFXManager {
    if (!this.instance && scene && cameraManager) {
      this.instance = new VFXManager(scene, cameraManager);
    }
    return this.instance!;
  }

  constructor(scene: THREE.Scene, cameraManager: CameraManager) {
    this.scene = scene;
    this.cameraManager = cameraManager;
    this.initSparkPool();
    this.subscribeEvents();
  }

  private initSparkPool(): void {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.sparkParticles = new THREE.Points(geo, mat);
    this.sparkParticles.frustumCulled = false;
    this.scene.add(this.sparkParticles);
  }

  private subscribeEvents(): void {
    // Heavy Strike or Critical Riposte trigger hit-stop
    this.eventBus.on<{ position: THREE.Vector3; isCritical?: boolean }>('COMBAT_IMPACT_EFFECT', (payload) => {
      this.triggerHitStop(payload.isCritical ? 0.08 : 0.05); // 50ms - 80ms hit-stop (<100ms per PRD)
      this.triggerCameraShake(payload.isCritical ? 0.25 : 0.12, payload.isCritical ? 0.28 : 0.18);
      this.spawnSparks(payload.position, payload.isCritical ? 40 : 20);
    });

    // Parried strike trigger deflection sparks & impulse
    this.eventBus.on<{ position: THREE.Vector3 }>('PARRY_DEFLECTION_EFFECT', (payload) => {
      this.triggerHitStop(0.06);
      this.triggerCameraShake(0.18, 0.22);
      this.spawnSparks(payload.position, 30);
    });
  }

  public triggerHitStop(durationSeconds: number): void {
    // PRD: "hit-stop under 100 ms"
    const clamped = Math.min(0.095, Math.max(0.03, durationSeconds));
    this.hitStopRemainingTime = clamped;
    this.isHitStopActive = true;
    this.eventBus.emit('HIT_STOP_STATE', true);
  }

  public isHitStopping(): boolean {
    return this.isHitStopActive;
  }

  public triggerCameraShake(intensity: number, duration: number = 0.2): void {
    const settingMult = this.settingsManager.getSettings().cameraShake / 100;
    this.shakeIntensity = intensity * settingMult;
    this.shakeDuration = duration;
  }

  public spawnSparks(origin: THREE.Vector3, count: number = 20): void {
    const density = this.settingsManager.getSettings().particleDensity;
    const finalCount = density === 'LOW' ? Math.floor(count * 0.4) : density === 'MEDIUM' ? Math.floor(count * 0.7) : count;

    for (let i = 0; i < finalCount; i++) {
      const idx = (Math.floor(Math.random() * 100)) * 3;
      this.sparkPositions[idx] = origin.x;
      this.sparkPositions[idx + 1] = origin.y;
      this.sparkPositions[idx + 2] = origin.z;

      this.sparkVelocities[idx] = (Math.random() - 0.5) * 8.0;
      this.sparkVelocities[idx + 1] = Math.random() * 6.0 + 2.0;
      this.sparkVelocities[idx + 2] = (Math.random() - 0.5) * 8.0;

      this.sparkLifetimes[Math.floor(idx / 3)] = 0.35 + Math.random() * 0.25;
    }

    if (this.sparkParticles) {
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  public update(deltaTime: number): void {
    // 1. Process Hit-Stop
    if (this.isHitStopActive) {
      this.hitStopRemainingTime -= deltaTime;
      if (this.hitStopRemainingTime <= 0) {
        this.isHitStopActive = false;
        this.eventBus.emit('HIT_STOP_STATE', false);
      }
    }

    // 2. Process Camera Screenshake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;
      const cam = this.cameraManager.getCamera();

      // Remove previous frame's offset
      cam.position.sub(this.shakeOffset);

      if (this.shakeDuration > 0) {
        const factor = this.shakeIntensity * (this.shakeDuration / 0.25);
        this.shakeOffset.set(
          (Math.random() - 0.5) * factor,
          (Math.random() - 0.5) * factor,
          (Math.random() - 0.5) * factor
        );
        cam.position.add(this.shakeOffset);
      } else {
        this.shakeOffset.set(0, 0, 0);
      }
    }

    // 3. Update active spark particles
    let hasActive = false;
    for (let i = 0; i < 100; i++) {
      if (this.sparkLifetimes[i] > 0) {
        this.sparkLifetimes[i] -= deltaTime;
        const idx = i * 3;

        this.sparkPositions[idx] += this.sparkVelocities[idx] * deltaTime;
        this.sparkPositions[idx + 1] += this.sparkVelocities[idx + 1] * deltaTime;
        this.sparkPositions[idx + 2] += this.sparkVelocities[idx + 2] * deltaTime;

        // Gravity pull
        this.sparkVelocities[idx + 1] -= 18.0 * deltaTime;
        hasActive = true;
      }
    }

    if (hasActive && this.sparkParticles) {
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
