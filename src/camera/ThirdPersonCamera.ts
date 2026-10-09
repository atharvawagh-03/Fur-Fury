/**
 * Third-Person Chase & Combat Camera Controller
 * Provides AAA third-person camera mechanics for Lady Anuki:
 * - Smooth spring-damped target following
 * - Pitch & yaw mouse orbit control with sensitivity and angle clamping
 * - Wall and ground collision avoidance (prevents clipping through arena architecture)
 * - Duel lock-on target tracking (frames Anuki and her opponent)
 * - Dynamic shoulder offset for cinematic action framing
 */

import * as THREE from 'three';
import { CameraManager } from './CameraManager';

export interface CameraCollisionBounds {
  floorY: number;
  maxRadius: number;
}

export class ThirdPersonCamera {
  private cameraManager: CameraManager;
  private target: THREE.Object3D | null = null;
  private lockOnTarget: THREE.Vector3 | null = null;
  private isLockedOn: boolean = false;

  // Spherical orbit parameters
  private currentYaw: number = 0;
  private currentPitch: number = 0.28; // ~16 degrees downward look
  private targetYaw: number = 0;
  private targetPitch: number = 0.28;
  private distance: number = 4.2;
  private targetDistance: number = 4.2;

  // Framing offsets
  private targetOffset: THREE.Vector3 = new THREE.Vector3(0, 0.75, 0); // Kitten chest level
  private shoulderOffset: THREE.Vector3 = new THREE.Vector3(0.25, 0.1, 0); // Slight right shoulder bias

  // Damping positions
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3();

  // Mouse state
  private mouseSensitivity: number = 0.0024;
  private isRightMouseDown: boolean = false;

  // Collision limits
  private bounds: CameraCollisionBounds = {
    floorY: 0.35,
    maxRadius: 17.2, // Grand Arena colosseum boundary
  };

  constructor(cameraManager: CameraManager) {
    this.cameraManager = cameraManager;
    this.setupControls();
  }

  public setTarget(target: THREE.Object3D): void {
    this.target = target;
    const initialPos = this.computeDesiredPosition();
    this.currentCameraPos.copy(initialPos);
    this.currentLookTarget.copy(target.position).add(this.targetOffset);
  }

  public toggleLockOn(targetPoint?: THREE.Vector3): boolean {
    this.isLockedOn = !this.isLockedOn;
    if (this.isLockedOn) {
      this.lockOnTarget = targetPoint ? targetPoint.clone() : new THREE.Vector3(0, 1.2, 0);
    } else {
      this.lockOnTarget = null;
    }
    return this.isLockedOn;
  }

  public setLockOn(locked: boolean, targetPoint?: THREE.Vector3): void {
    this.isLockedOn = locked;
    if (locked) {
      this.lockOnTarget = targetPoint ? targetPoint.clone() : new THREE.Vector3(0, 1.2, 0);
    } else {
      this.lockOnTarget = null;
    }
  }

  public get lockedOn(): boolean {
    return this.isLockedOn;
  }

  public getLockOnPoint(): THREE.Vector3 | null {
    return this.lockOnTarget;
  }

  public getYaw(): number {
    return this.currentYaw;
  }

  private setupControls(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('.btn-action, .preset-btn, .hud-header, .btn-mode')) return;
      if (e.button === 0 || e.button === 2) {
        this.isRightMouseDown = true;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isRightMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isLockedOn) return; // Orbit is auto-controlled in lock-on mode

      // Allow camera drag with mouse
      if (this.isRightMouseDown || document.pointerLockElement) {
        const dx = e.movementX ?? 0;
        const dy = e.movementY ?? 0;

        this.targetYaw -= dx * this.mouseSensitivity;
        this.targetPitch += dy * this.mouseSensitivity;

        // Clamp pitch to avoid flipping over head or clipping into floor
        this.targetPitch = Math.max(-0.2, Math.min(1.15, this.targetPitch));
      }
    });

    window.addEventListener('wheel', (e) => {
      this.targetDistance = Math.max(2.5, Math.min(8.0, this.targetDistance + e.deltaY * 0.005));
    });
  }

  public update(deltaTime: number): void {
    if (!this.target) return;

    const followSmoothing = Math.min(1.0, deltaTime * 12.0);
    const orbitSmoothing = Math.min(1.0, deltaTime * 14.0);

    if (this.isLockedOn && this.lockOnTarget) {
      // Calculate yaw and framing to keep both Anuki and Target in frame
      const targetPos = this.target.position;
      const toBoss = new THREE.Vector3().subVectors(this.lockOnTarget, targetPos);
      const angleToBoss = Math.atan2(toBoss.x, toBoss.z);

      // Camera sits behind Anuki relative to target
      this.targetYaw = angleToBoss + Math.PI;
      this.targetPitch = 0.32; // Elevated duel perspective
      this.targetDistance = Math.max(4.0, Math.min(7.0, toBoss.length() * 0.55 + 2.5));
    }

    // Smooth angle interpolation
    this.currentYaw += (this.targetYaw - this.currentYaw) * orbitSmoothing;
    this.currentPitch += (this.targetPitch - this.currentPitch) * orbitSmoothing;
    this.distance += (this.targetDistance - this.distance) * followSmoothing;

    // Desired camera position
    const desiredPos = this.computeDesiredPosition();

    // Prevent wall and ground clipping
    this.applyCollisionAvoidance(desiredPos);

    // Smooth position interpolation
    this.currentCameraPos.lerp(desiredPos, followSmoothing);

    // Look-at point calculation
    const heroLookPoint = new THREE.Vector3().copy(this.target.position).add(this.targetOffset);
    if (this.isLockedOn && this.lockOnTarget) {
      // Midpoint framing with slight bias towards Anuki
      heroLookPoint.lerp(this.lockOnTarget, 0.35);
      heroLookPoint.y = Math.max(0.8, heroLookPoint.y);
    }
    this.currentLookTarget.lerp(heroLookPoint, followSmoothing);

    // Apply to Three.js camera
    this.cameraManager.setPosition(this.currentCameraPos.x, this.currentCameraPos.y, this.currentCameraPos.z);
    this.cameraManager.setLookAt(this.currentLookTarget);
  }

  private computeDesiredPosition(): THREE.Vector3 {
    if (!this.target) return new THREE.Vector3();

    const heroPos = this.target.position;
    const focusPos = new THREE.Vector3().copy(heroPos).add(this.targetOffset);

    // Spherical offset
    const cosPitch = Math.cos(this.currentPitch);
    const sinPitch = Math.sin(this.currentPitch);
    const sinYaw = Math.sin(this.currentYaw);
    const cosYaw = Math.cos(this.currentYaw);

    const camOffset = new THREE.Vector3(
      this.distance * cosPitch * sinYaw,
      this.distance * sinPitch,
      this.distance * cosPitch * cosYaw
    );

    // Shoulder lateral offset
    const rightVec = new THREE.Vector3(cosYaw, 0, -sinYaw);
    camOffset.addScaledVector(rightVec, this.shoulderOffset.x);

    return focusPos.clone().add(camOffset);
  }

  private applyCollisionAvoidance(desiredPos: THREE.Vector3): void {
    if (!this.target) return;

    // 1. Ground floor clamp
    if (desiredPos.y < this.bounds.floorY) {
      desiredPos.y = this.bounds.floorY;
    }

    // 2. Colosseum outer perimeter wall clamp
    const horizontalDist = Math.hypot(desiredPos.x, desiredPos.z);
    if (horizontalDist > this.bounds.maxRadius) {
      const scale = this.bounds.maxRadius / horizontalDist;
      desiredPos.x *= scale;
      desiredPos.z *= scale;
    }
  }
}
