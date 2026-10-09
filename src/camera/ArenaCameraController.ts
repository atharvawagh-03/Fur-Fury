/**
 * Arena Camera Controller
 * Provides cinematic camera orbits, smooth interpolation, and preset vantage points
 * for inspecting the Grand Arena environment.
 */

import * as THREE from 'three';
import { CameraManager } from './CameraManager';

export type CameraPreset = 'OVERVIEW' | 'GATE' | 'ROYAL_BOX' | 'DUEL_CENTER';

export class ArenaCameraController {
  private cameraManager: CameraManager;

  // Spherical coordinates for orbit control
  private radius: number = 32;
  private theta: number = 0.4; // Azimuth
  private phi: number = 1.1;   // Polar angle
  private target: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);

  // Smooth lerp targets
  private targetRadius: number = 32;
  private targetTheta: number = 0.4;
  private targetPhi: number = 1.1;
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);

  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private autoOrbit: boolean = false;
  private autoOrbitSpeed: number = 0.15;

  constructor(cameraManager: CameraManager) {
    this.cameraManager = cameraManager;
    this.setupMouseEvents();
    this.applyPreset('OVERVIEW', true);
  }

  private setupMouseEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on UI buttons
      if ((e.target as HTMLElement).closest('.btn-action, .preset-btn, .hud-header')) return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetTheta -= deltaX * 0.005;
      this.targetPhi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, this.targetPhi - deltaY * 0.005));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('wheel', (e) => {
      this.targetRadius = Math.max(8, Math.min(60, this.targetRadius + e.deltaY * 0.03));
    });
  }

  public setAutoOrbit(active: boolean): void {
    this.autoOrbit = active;
  }

  public toggleAutoOrbit(): boolean {
    this.autoOrbit = !this.autoOrbit;
    return this.autoOrbit;
  }

  public applyPreset(preset: CameraPreset, immediate: boolean = false): void {
    switch (preset) {
      case 'OVERVIEW':
        this.targetRadius = 38;
        this.targetTheta = 0.7;
        this.targetPhi = 1.05;
        this.targetLookAt.set(0, 1.0, 0);
        break;
      case 'GATE':
        this.targetRadius = 24;
        this.targetTheta = Math.PI / 2;
        this.targetPhi = 1.35;
        this.targetLookAt.set(0, 4.5, -16);
        break;
      case 'ROYAL_BOX':
        this.targetRadius = 24;
        this.targetTheta = -Math.PI / 2;
        this.targetPhi = 1.35;
        this.targetLookAt.set(0, 5.0, 16);
        break;
      case 'DUEL_CENTER':
        this.targetRadius = 14;
        this.targetTheta = 0.2;
        this.targetPhi = 1.4;
        this.targetLookAt.set(0, 1.2, 0);
        break;
    }

    if (immediate) {
      this.radius = this.targetRadius;
      this.theta = this.targetTheta;
      this.phi = this.targetPhi;
      this.target.copy(this.targetLookAt);
      this.updateCameraTransform();
    }
  }

  public update(deltaTime: number): void {
    if (this.autoOrbit && !this.isDragging) {
      this.targetTheta += this.autoOrbitSpeed * deltaTime;
    }

    // Smooth spherical interpolation (damping)
    const factor = Math.min(1.0, deltaTime * 8.0);
    this.radius += (this.targetRadius - this.radius) * factor;
    this.theta += (this.targetTheta - this.theta) * factor;
    this.phi += (this.targetPhi - this.phi) * factor;
    this.target.lerp(this.targetLookAt, factor);

    this.updateCameraTransform();
  }

  private updateCameraTransform(): void {
    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.cameraManager.setPosition(x, y, z);
    this.cameraManager.setLookAt(this.target);
  }
}
