/**
 * Anuki Visual Effects & Footstep Particle System
 * Emits ground dust motes, sprint kicks, landing impacts, and sword trail effects.
 */

import * as THREE from 'three';

export interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export class AnukiEffects {
  private scene: THREE.Scene;
  private particleGroup: THREE.Group;
  private dustParticles: DustParticle[] = [];
  private dustGeometry: THREE.BufferGeometry;
  private dustPoints: THREE.Points;
  private maxParticles = 120;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGroup = new THREE.Group();
    this.particleGroup.name = 'Anuki_Effects';
    this.scene.add(this.particleGroup);

    // Particle buffers
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.dustGeometry = new THREE.BufferGeometry();
    this.dustGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.dustGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.dustGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Custom dust texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(235, 215, 180, 0.9)');
    grad.addColorStop(0.5, 'rgba(210, 185, 145, 0.4)');
    grad.addColorStop(1, 'rgba(180, 150, 110, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const dustTex = new THREE.CanvasTexture(canvas);

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.35,
      map: dustTex,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.dustPoints = new THREE.Points(this.dustGeometry, dustMaterial);
    this.particleGroup.add(this.dustPoints);
  }

  /**
   * Spawns ground dust at paw contact during running or jumping
   */
  public emitFootstep(pos: THREE.Vector3, isSprint: boolean = false): void {
    const count = isSprint ? 4 : 2;
    for (let i = 0; i < count; i++) {
      if (this.dustParticles.length >= this.maxParticles) {
        this.dustParticles.shift();
      }

      this.dustParticles.push({
        position: new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.15,
          pos.y + 0.05,
          pos.z + (Math.random() - 0.5) * 0.15
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * (isSprint ? 0.6 : 0.25),
          0.15 + Math.random() * 0.2,
          (Math.random() - 0.5) * (isSprint ? 0.6 : 0.25)
        ),
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        size: isSprint ? 0.45 : 0.28,
      });
    }
  }

  /**
   * Spawns a radial burst of dust upon landing or dodging
   */
  public emitBurst(pos: THREE.Vector3, count: number = 12): void {
    for (let i = 0; i < count; i++) {
      if (this.dustParticles.length >= this.maxParticles) {
        this.dustParticles.shift();
      }

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 0.5 + Math.random() * 0.8;

      this.dustParticles.push({
        position: new THREE.Vector3(pos.x, pos.y + 0.05, pos.z),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.25 + Math.random() * 0.3, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        size: 0.5,
      });
    }
  }

  public update(deltaTime: number): void {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        this.dustParticles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, deltaTime);
      p.velocity.y -= 0.6 * deltaTime; // subtle settling
      p.velocity.multiplyScalar(0.94); // drag
    }

    // Update geometry attributes
    const posAttr = this.dustGeometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.dustGeometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.dustGeometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.dustParticles.length) {
        const p = this.dustParticles[i];
        posAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);

        const fade = 1 - p.life / p.maxLife;
        colAttr.setXYZ(i, 0.9 * fade, 0.82 * fade, 0.7 * fade);
        sizeAttr.setX(i, p.size * (1 + (p.life / p.maxLife) * 0.8));
      } else {
        posAttr.setXYZ(i, 0, -100, 0); // off-screen
        colAttr.setXYZ(i, 0, 0, 0);
        sizeAttr.setX(i, 0);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.scene.remove(this.particleGroup);
    this.dustGeometry.dispose();
  }
}
