/**
 * Camera System
 * Controls perspective projection, resize adaptations, dynamic framing, and shake impulses.
 */

import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0; // Decay rate per second
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private basePosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  constructor(aspect: number = window.innerWidth / window.innerHeight) {
    this.camera = new THREE.PerspectiveCamera(
      GameConfig.GRAPHICS.FOV,
      aspect,
      GameConfig.GRAPHICS.NEAR,
      GameConfig.GRAPHICS.FAR
    );
    this.camera.position.set(0, 5, 12);
    this.basePosition.copy(this.camera.position);
    this.camera.lookAt(this.targetLookAt);
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.basePosition.set(x, y, z);
    this.camera.position.copy(this.basePosition);
  }

  public setLookAt(target: THREE.Vector3): void {
    this.targetLookAt.copy(target);
    this.camera.lookAt(this.targetLookAt);
  }

  public handleResize(width: number, height: number): void {
    if (height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Adds camera impulse / screen shake (e.g., boss ground slams, dragon landing)
   */
  public addShake(intensity: number): void {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 1.5);
  }

  public update(deltaTime: number): void {
    if (this.shakeIntensity > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * this.shakeIntensity,
        (Math.random() - 0.5) * 2 * this.shakeIntensity,
        (Math.random() - 0.5) * 2 * this.shakeIntensity
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * deltaTime);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    this.camera.position.copy(this.basePosition).add(this.shakeOffset);
    this.camera.lookAt(this.targetLookAt);
  }
}
