/**
 * Cinematic Photo Mode Controller - Step 9
 * Conforming strictly to PRD Section 14 ("Optional content: photo mode") and Section 15 ("UX / UI and accessibility").
 */

import * as THREE from 'three';
import { CameraManager } from './CameraManager';
import { EventBus } from '../core/EventBus';

export type PhotoFilterMode = 'NONE' | 'GOLDEN_HOUR' | 'NOIR' | 'MYTHIC' | 'VIBRANT';

export interface PhotoModeSettings {
  fov: number; // 25 to 90 degrees
  roll: number; // -45 to 45 degrees
  distance: number; // 1.2 to 12.0 meters
  pitch: number; // -1.2 to 1.2 radians
  yaw: number; // 0 to 2PI radians
  vignette: number; // 0 to 100%
  filter: PhotoFilterMode;
  hideUI: boolean;
}

export class PhotoModeController {
  private camera: THREE.PerspectiveCamera;
  private eventBus = EventBus.getInstance();

  private isActive: boolean = false;
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0.8, 0);
  private initialCameraPos: THREE.Vector3 = new THREE.Vector3();
  private initialFov: number = 55;

  private settings: PhotoModeSettings = {
    fov: 50,
    roll: 0,
    distance: 3.5,
    pitch: 0.15,
    yaw: 0,
    vignette: 25,
    filter: 'NONE',
    hideUI: false,
  };

  private isDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;

  constructor(cameraManager: CameraManager) {
    this.camera = cameraManager.getCamera();
    this.setupMouseEvents();
  }

  public getSettings(): PhotoModeSettings {
    return { ...this.settings };
  }

  public isPhotoModeActive(): boolean {
    return this.isActive;
  }

  public setTargetPosition(pos: THREE.Vector3): void {
    this.targetPosition.copy(pos);
    this.targetPosition.y += 0.45; // Focus on Anuki's chest/face
  }

  public activate(target?: THREE.Vector3): void {
    if (this.isActive) return;

    this.isActive = true;
    this.initialCameraPos.copy(this.camera.position);
    this.initialFov = this.camera.fov;

    if (target) {
      this.setTargetPosition(target);
    }

    // Compute initial spherical angles from current camera relative to target
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.targetPosition);
    this.settings.distance = Math.max(1.5, Math.min(10.0, offset.length()));
    this.settings.yaw = Math.atan2(offset.x, offset.z);
    this.settings.pitch = Math.asin(Math.max(-0.95, Math.min(0.95, offset.y / this.settings.distance)));
    this.settings.fov = 50;
    this.settings.roll = 0;

    this.applyCameraTransform();
    this.eventBus.emit('PHOTO_MODE_STATE', { active: true, settings: this.settings });
  }

  public deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.camera.fov = this.initialFov;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();

    this.eventBus.emit('PHOTO_MODE_STATE', { active: false });
  }

  public setFov(fov: number): void {
    this.settings.fov = Math.max(25, Math.min(90, fov));
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.eventBus.emit('PHOTO_MODE_SETTINGS_UPDATED', this.settings);
  }

  public setRoll(degrees: number): void {
    this.settings.roll = Math.max(-45, Math.min(45, degrees));
    this.applyCameraTransform();
    this.eventBus.emit('PHOTO_MODE_SETTINGS_UPDATED', this.settings);
  }

  public setDistance(dist: number): void {
    this.settings.distance = Math.max(1.2, Math.min(12.0, dist));
    this.applyCameraTransform();
    this.eventBus.emit('PHOTO_MODE_SETTINGS_UPDATED', this.settings);
  }

  public setVignette(vignette: number): void {
    this.settings.vignette = Math.max(0, Math.min(100, vignette));
    this.eventBus.emit('PHOTO_MODE_SETTINGS_UPDATED', this.settings);
  }

  public setFilter(filter: PhotoFilterMode): void {
    this.settings.filter = filter;
    this.eventBus.emit('PHOTO_MODE_SETTINGS_UPDATED', this.settings);
  }

  public setHideUI(hide: boolean): void {
    this.settings.hideUI = hide;
    this.eventBus.emit('PHOTO_MODE_HIDE_UI', hide);
  }

  public toggleHideUI(): boolean {
    this.settings.hideUI = !this.settings.hideUI;
    this.eventBus.emit('PHOTO_MODE_HIDE_UI', this.settings.hideUI);
    return this.settings.hideUI;
  }

  private setupMouseEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      if ((e.target as HTMLElement).closest('#photo-mode-deck')) return;
      if (e.button === 0) {
        this.isDragging = true;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDragging) return;

      const deltaX = e.clientX - this.previousMouseX;
      const deltaY = e.clientY - this.previousMouseY;
      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;

      this.settings.yaw -= deltaX * 0.006;
      this.settings.pitch += deltaY * 0.006;
      this.settings.pitch = Math.max(-1.15, Math.min(1.15, this.settings.pitch));

      this.applyCameraTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
      if (!this.isActive) return;
      if ((e.target as HTMLElement).closest('#photo-mode-deck')) return;
      this.setDistance(this.settings.distance + e.deltaY * 0.005);
    }, { passive: true });
  }

  private applyCameraTransform(): void {
    const cosPitch = Math.cos(this.settings.pitch);
    const sinPitch = Math.sin(this.settings.pitch);
    const sinYaw = Math.sin(this.settings.yaw);
    const cosYaw = Math.cos(this.settings.yaw);

    const x = this.targetPosition.x + this.settings.distance * cosPitch * sinYaw;
    const y = this.targetPosition.y + this.settings.distance * sinPitch;
    const z = this.targetPosition.z + this.settings.distance * cosPitch * cosYaw;

    this.camera.position.set(x, Math.max(0.2, y), z);
    this.camera.lookAt(this.targetPosition);

    // Apply roll tilt
    if (this.settings.roll !== 0) {
      this.camera.rotateZ((this.settings.roll * Math.PI) / 180);
    }
  }

  public update(): void {
    if (this.isActive) {
      this.applyCameraTransform();
    }
  }
}
