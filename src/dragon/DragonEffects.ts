/**
 * Dragon VFX & Atmospheric Particle Systems
 * Produces:
 * - High-speed dive wind vapor streaks and aerodynamic speed lines
 * - Ground touchdown impact shockwave dust ring and radiant ember explosion
 * - Dragon throat heartfire smoke and fiery breath embers
 */

import * as THREE from 'three';

export class DragonEffects {
  private scene: THREE.Scene;

  // 1. High speed wind lines
  private speedLinesMesh: THREE.LineSegments | null = null;
  private speedLinesGeo: THREE.BufferGeometry | null = null;
  private speedLinesActive: boolean = false;

  // 2. Touchdown dust & ember shockwave
  private shockwaveRing: THREE.Mesh | null = null;
  private shockwaveActive: boolean = false;
  private shockwaveProgress: number = 0;

  // 3. Embers particle system
  private emberParticles: THREE.Points | null = null;
  private emberGeo: THREE.BufferGeometry | null = null;
  private emberPositions: Float32Array | null = null;
  private emberVelocities: Float32Array | null = null;
  private emberLifetimes: Float32Array | null = null;
  private emberCount = 150;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initSpeedLines();
    this.initShockwaveRing();
    this.initEmbers();
  }

  private initSpeedLines(): void {
    const lineCount = 60;
    const positions = new Float32Array(lineCount * 2 * 3);
    const colors = new Float32Array(lineCount * 2 * 3);

    for (let i = 0; i < lineCount; i++) {
      const idx = i * 6;
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 40;
      const len = 4 + Math.random() * 8;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      positions[idx + 3] = x;
      positions[idx + 4] = y + len; // vertical streak
      positions[idx + 5] = z;

      // Ivory-gold wind streak color
      for (let v = 0; v < 2; v++) {
        colors[idx + v * 3] = 0.95;
        colors[idx + v * 3 + 1] = 0.88;
        colors[idx + v * 3 + 2] = 0.72;
      }
    }

    this.speedLinesGeo = new THREE.BufferGeometry();
    this.speedLinesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.speedLinesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    this.speedLinesMesh = new THREE.LineSegments(this.speedLinesGeo, lineMat);
    this.speedLinesMesh.visible = false;
    this.scene.add(this.speedLinesMesh);
  }

  private initShockwaveRing(): void {
    const ringGeo = new THREE.RingGeometry(0.5, 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6622,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.rotation.x = -Math.PI * 0.5;
    this.shockwaveRing.position.y = 0.08;
    this.shockwaveRing.visible = false;
    this.scene.add(this.shockwaveRing);
  }

  private initEmbers(): void {
    this.emberPositions = new Float32Array(this.emberCount * 3);
    this.emberVelocities = new Float32Array(this.emberCount * 3);
    this.emberLifetimes = new Float32Array(this.emberCount);

    for (let i = 0; i < this.emberCount; i++) {
      this.resetEmber(i, false);
    }

    this.emberGeo = new THREE.BufferGeometry();
    this.emberGeo.setAttribute('position', new THREE.BufferAttribute(this.emberPositions, 3));

    // Particle sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ffaa33');
    grad.addColorStop(0.7, '#ff3300');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const emberMat = new THREE.PointsMaterial({
      size: 0.85,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.emberParticles = new THREE.Points(this.emberGeo, emberMat);
    this.emberParticles.visible = false;
    this.scene.add(this.emberParticles);
  }

  private resetEmber(i: number, active: boolean): void {
    if (!this.emberPositions || !this.emberVelocities || !this.emberLifetimes) return;
    const idx = i * 3;

    if (!active) {
      this.emberPositions[idx] = 0;
      this.emberPositions[idx + 1] = -100;
      this.emberPositions[idx + 2] = 0;
      this.emberLifetimes[i] = 0;
      return;
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 2.5;
    this.emberPositions[idx] = Math.cos(angle) * dist;
    this.emberPositions[idx + 1] = 0.2 + Math.random() * 0.5;
    this.emberPositions[idx + 2] = Math.sin(angle) * dist;

    const speed = 3.0 + Math.random() * 6.0;
    this.emberVelocities[idx] = Math.cos(angle) * speed;
    this.emberVelocities[idx + 1] = 2.0 + Math.random() * 5.0;
    this.emberVelocities[idx + 2] = Math.sin(angle) * speed;

    this.emberLifetimes[i] = 1.0 + Math.random() * 1.5;
  }

  public setSpeedLinesActive(active: boolean, intensity: number = 1.0): void {
    this.speedLinesActive = active;
    if (this.speedLinesMesh) {
      this.speedLinesMesh.visible = active;
      const mat = this.speedLinesMesh.material as THREE.LineBasicMaterial;
      mat.opacity = active ? Math.min(0.7, 0.45 * intensity) : 0;
    }
  }

  public triggerTouchdownImpact(position: THREE.Vector3): void {
    // 1. Shockwave ring burst
    if (this.shockwaveRing) {
      this.shockwaveRing.position.set(position.x, 0.08, position.z);
      this.shockwaveRing.scale.set(1, 1, 1);
      this.shockwaveRing.visible = true;
      const mat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.9;
      this.shockwaveActive = true;
      this.shockwaveProgress = 0;
    }

    // 2. Ember burst
    if (this.emberParticles && this.emberPositions && this.emberVelocities && this.emberLifetimes) {
      this.emberParticles.visible = true;
      for (let i = 0; i < this.emberCount; i++) {
        const idx = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.5 + Math.random() * 3.0;
        this.emberPositions[idx] = position.x + Math.cos(angle) * dist;
        this.emberPositions[idx + 1] = position.y + 0.2;
        this.emberPositions[idx + 2] = position.z + Math.sin(angle) * dist;

        const speed = 4.0 + Math.random() * 8.0;
        this.emberVelocities[idx] = Math.cos(angle) * speed;
        this.emberVelocities[idx + 1] = 3.5 + Math.random() * 6.0;
        this.emberVelocities[idx + 2] = Math.sin(angle) * speed;

        this.emberLifetimes[i] = 1.2 + Math.random() * 1.5;
      }
      if (this.emberGeo) {
        this.emberGeo.attributes.position.needsUpdate = true;
      }
    }
  }

  public update(deltaTime: number, centerPos?: THREE.Vector3): void {
    // Update speed lines position tracking
    if (this.speedLinesActive && this.speedLinesMesh && centerPos) {
      this.speedLinesMesh.position.copy(centerPos);
    }

    // Update shockwave ring expansion
    if (this.shockwaveActive && this.shockwaveRing) {
      this.shockwaveProgress += deltaTime * 1.8;
      const scale = 1.0 + this.shockwaveProgress * 14.0;
      this.shockwaveRing.scale.set(scale, scale, 1);
      const mat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.9 * (1.0 - this.shockwaveProgress));

      if (this.shockwaveProgress >= 1.0) {
        this.shockwaveActive = false;
        this.shockwaveRing.visible = false;
      }
    }

    // Update embers
    if (this.emberParticles && this.emberParticles.visible && this.emberPositions && this.emberVelocities && this.emberLifetimes) {
      let activeCount = 0;
      for (let i = 0; i < this.emberCount; i++) {
        if (this.emberLifetimes[i] > 0) {
          this.emberLifetimes[i] -= deltaTime;
          const idx = i * 3;

          this.emberPositions[idx] += this.emberVelocities[idx] * deltaTime;
          this.emberPositions[idx + 1] += this.emberVelocities[idx + 1] * deltaTime;
          this.emberPositions[idx + 2] += this.emberVelocities[idx + 2] * deltaTime;

          // Gravity and drag
          this.emberVelocities[idx] *= 0.96;
          this.emberVelocities[idx + 1] -= 9.8 * deltaTime * 0.7;
          this.emberVelocities[idx + 2] *= 0.96;

          // Floor bounce / clamp
          if (this.emberPositions[idx + 1] < 0.1) {
            this.emberPositions[idx + 1] = 0.1;
            this.emberVelocities[idx + 1] = -this.emberVelocities[idx + 1] * 0.4;
          }

          activeCount++;
        }
      }

      if (this.emberGeo) {
        this.emberGeo.attributes.position.needsUpdate = true;
      }

      if (activeCount === 0 && !this.shockwaveActive) {
        this.emberParticles.visible = false;
      }
    }
  }

  public dispose(): void {
    if (this.speedLinesMesh) {
      this.scene.remove(this.speedLinesMesh);
      this.speedLinesGeo?.dispose();
    }
    if (this.shockwaveRing) {
      this.scene.remove(this.shockwaveRing);
      this.shockwaveRing.geometry.dispose();
    }
    if (this.emberParticles) {
      this.scene.remove(this.emberParticles);
      this.emberGeo?.dispose();
    }
  }
}
