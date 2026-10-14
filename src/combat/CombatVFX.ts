/**
 * Combat Visual Effects (VFX) Manager
 * Implements PRD Section 9 ("Hit feedback: weapon trails restrained, accurate contact VFX, subtle camera impulse"):
 * - Golden-silver ribbon sword arc trail following Moonfang's blade tip and hilt
 * - Contact impact sparks and directional slash particles
 * - Parry deflection flash & golden starburst
 * - Heavy breaker shockwave ring
 * - Healing elixir spiral helix aura
 * - Floating combat damage numbers with critical styling
 */

import * as THREE from 'three';
import { FloatingDamageText } from './CombatTypes';

export class CombatVFX {
  private scene: THREE.Scene;

  // Blade Ribbon Trail
  private trailMesh: THREE.Mesh | null = null;
  private trailGeo: THREE.BufferGeometry | null = null;
  private trailPositions: Float32Array;
  private trailAlphas: Float32Array;
  private trailHistory: { tip: THREE.Vector3; base: THREE.Vector3; time: number }[] = [];
  private maxTrailPoints = 16;
  private isTrailActive = false;

  // Spark Particles
  private sparksGroup = new THREE.Group();
  private activeSparks: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Shockwave Rings
  private shockwaves: {
    mesh: THREE.Mesh;
    scaleSpeed: number;
    opacitySpeed: number;
    life: number;
  }[] = [];

  // Healing Helix Particles
  private healGroup = new THREE.Group();
  private healParticles: {
    mesh: THREE.Mesh;
    angle: number;
    radius: number;
    height: number;
    speed: number;
    life: number;
  }[] = [];

  // Floating Combat Damage Canvas Overlay
  private floatingTexts: FloatingDamageText[] = [];
  private nextTextId = 1;
  private textCanvas: HTMLCanvasElement | null = null;
  private textCtx: CanvasRenderingContext2D | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.trailPositions = new Float32Array(this.maxTrailPoints * 2 * 3);
    this.trailAlphas = new Float32Array(this.maxTrailPoints * 2);

    this.initBladeTrail();
    this.scene.add(this.sparksGroup);
    this.scene.add(this.healGroup);
    this.initDamageCanvas();
  }

  private initBladeTrail(): void {
    this.trailGeo = new THREE.BufferGeometry();
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeo.setAttribute('alpha', new THREE.BufferAttribute(this.trailAlphas, 1));

    // Dynamic indices forming triangle strip quad ribbon
    const indices: number[] = [];
    for (let i = 0; i < this.maxTrailPoints - 1; i++) {
      const top1 = i * 2;
      const bot1 = i * 2 + 1;
      const top2 = (i + 1) * 2;
      const bot2 = (i + 1) * 2 + 1;

      indices.push(top1, bot1, top2);
      indices.push(bot1, bot2, top2);
    }
    this.trailGeo.setIndex(indices);

    // Elegant gold-silver blade trail material
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xffdf88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailMesh = new THREE.Mesh(this.trailGeo, trailMat);
    this.trailMesh.frustumCulled = false;
    this.trailMesh.visible = false;
    this.scene.add(this.trailMesh);
  }

  private initDamageCanvas(): void {
    if (typeof document === 'undefined' || !document.createElement) return;

    try {
      this.textCanvas = document.createElement('canvas');
      if (!this.textCanvas || !this.textCanvas.style || typeof this.textCanvas.getContext !== 'function') {
        this.textCanvas = null;
        return;
      }
      this.textCanvas.id = 'combat-damage-canvas';
      this.textCanvas.style.position = 'absolute';
      this.textCanvas.style.top = '0';
      this.textCanvas.style.left = '0';
      this.textCanvas.style.width = '100%';
      this.textCanvas.style.height = '100%';
      this.textCanvas.style.pointerEvents = 'none';
      this.textCanvas.style.zIndex = '35';

      this.resizeCanvas();
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('resize', () => this.resizeCanvas());
      }
      if (document.body && document.body.appendChild) {
        document.body.appendChild(this.textCanvas);
      }
      this.textCtx = this.textCanvas.getContext('2d');
    } catch {
      this.textCanvas = null;
      this.textCtx = null;
    }
  }

  private resizeCanvas(): void {
    if (!this.textCanvas) return;
    this.textCanvas.width = window.innerWidth;
    this.textCanvas.height = window.innerHeight;
  }

  public setTrailActive(active: boolean, color: number = 0xffe090): void {
    this.isTrailActive = active;
    if (this.trailMesh) {
      this.trailMesh.visible = active;
      if (active) {
        (this.trailMesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      } else {
        this.trailHistory = [];
      }
    }
  }

  public updateBladeTrail(tipPos: THREE.Vector3, basePos: THREE.Vector3, deltaTime: number): void {
    if (!this.trailGeo || !this.trailMesh) return;

    if (this.isTrailActive) {
      this.trailHistory.unshift({
        tip: tipPos.clone(),
        base: basePos.clone(),
        time: 0,
      });

      if (this.trailHistory.length > this.maxTrailPoints) {
        this.trailHistory.pop();
      }
    } else if (this.trailHistory.length > 0) {
      // Fade out remaining segments
      this.trailHistory.pop();
    }

    // Age existing points
    for (const pt of this.trailHistory) {
      pt.time += deltaTime;
    }

    const posAttr = this.trailGeo.attributes.position as THREE.BufferAttribute;
    const count = this.trailHistory.length;

    for (let i = 0; i < this.maxTrailPoints; i++) {
      if (i < count) {
        const pt = this.trailHistory[i];
        posAttr.setXYZ(i * 2, pt.tip.x, pt.tip.y, pt.tip.z);
        posAttr.setXYZ(i * 2 + 1, pt.base.x, pt.base.y, pt.base.z);
      } else if (count > 0) {
        // Collapse unused tail vertices to last known point
        const last = this.trailHistory[count - 1];
        posAttr.setXYZ(i * 2, last.tip.x, last.tip.y, last.tip.z);
        posAttr.setXYZ(i * 2 + 1, last.base.x, last.base.y, last.base.z);
      } else {
        posAttr.setXYZ(i * 2, 0, 0, 0);
        posAttr.setXYZ(i * 2 + 1, 0, 0, 0);
      }
    }

    posAttr.needsUpdate = true;
    this.trailMesh.visible = count >= 2;
  }

  /**
   * Spawns dynamic contact sparks at sword impact point
   */
  public triggerHitSparks(point: THREE.Vector3, normal: THREE.Vector3, isHeavy: boolean = false): void {
    const sparkCount = isHeavy ? 18 : 10;
    const baseColor = isHeavy ? 0xff8822 : 0xffcc44;

    const sparkGeo = new THREE.SphereGeometry(isHeavy ? 0.045 : 0.03, 4, 4);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < sparkCount; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
      mesh.position.copy(point);
      this.sparksGroup.add(mesh);

      // Eject in cone around surface normal
      const spread = isHeavy ? 1.4 : 0.9;
      const vel = normal.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.3) * spread + 0.4,
          (Math.random() - 0.5) * spread
        )
      ).normalize().multiplyScalar(isHeavy ? 5.5 + Math.random() * 4.0 : 3.5 + Math.random() * 3.0);

      this.activeSparks.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: isHeavy ? 0.35 : 0.22,
      });
    }

    // Add contact shockwave ring
    this.triggerShockwave(point, isHeavy ? 0xffaa22 : 0xffeedd, isHeavy ? 4.5 : 2.5);
  }

  /**
   * Spawns expanding shockwave ring on heavy impact or parry
   */
  public triggerShockwave(point: THREE.Vector3, color: number = 0xffdf88, maxScale: number = 3.0): void {
    const ringGeo = new THREE.RingGeometry(0.1, 0.25, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(ringGeo, ringMat);
    mesh.position.copy(point).add(new THREE.Vector3(0, 0.05, 0));
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      scaleSpeed: maxScale / 0.25,
      opacitySpeed: 1.0 / 0.25,
      life: 0,
    });
  }

  /**
   * Spawns parry deflection golden starburst flash
   */
  public triggerParryBurst(point: THREE.Vector3): void {
    this.triggerShockwave(point, 0xffd700, 3.8);

    const sparkGeo = new THREE.BoxGeometry(0.04, 0.04, 0.16);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
      mesh.position.copy(point);
      this.sparksGroup.add(mesh);

      const angle = (i / 16) * Math.PI * 2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * (4.5 + Math.random() * 3),
        (Math.random() - 0.2) * 3,
        Math.sin(angle) * (4.5 + Math.random() * 3)
      );

      mesh.lookAt(point.clone().add(vel));

      this.activeSparks.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.28,
      });
    }
  }

  /**
   * Spawns healing elixir swirling golden helix aura around Lady Anuki
   */
  public triggerHealAura(centerPos: THREE.Vector3): void {
    const count = 28;
    const mat = new THREE.MeshBasicMaterial({
      color: 0x44ffaa,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const geo = new THREE.SphereGeometry(0.04, 6, 6);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      const angle = (i / count) * Math.PI * 4;
      const radius = 0.5 + Math.random() * 0.3;
      const height = (i / count) * 1.4;

      mesh.position.set(
        centerPos.x + Math.cos(angle) * radius,
        centerPos.y + height,
        centerPos.z + Math.sin(angle) * radius
      );
      this.healGroup.add(mesh);

      this.healParticles.push({
        mesh,
        angle,
        radius,
        height,
        speed: 4.5 + Math.random() * 2.0,
        life: 0,
      });
    }
  }

  /**
   * Adds floating combat damage number in 3D world coordinates
   */
  public addFloatingDamage(
    position: THREE.Vector3,
    damage: number,
    isCritical: boolean = false,
    textOverride?: string
  ): void {
    const text = textOverride ? textOverride : `${Math.round(damage)}`;
    const color = isCritical ? '#ffcc00' : '#ffffff';

    this.floatingTexts.push({
      id: this.nextTextId++,
      position: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.4, (Math.random() - 0.5) * 0.4)),
      text,
      isCritical,
      life: 0,
      maxLife: isCritical ? 1.1 : 0.85,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.8 + (isCritical ? 0.6 : 0), (Math.random() - 0.5) * 0.6),
      color,
    });
  }

  public update(deltaTime: number, camera: THREE.Camera): void {
    // 1. Update Sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const s = this.activeSparks[i];
      s.life += deltaTime;
      s.velocity.y -= 9.8 * deltaTime; // Gravity
      s.mesh.position.addScaledVector(s.velocity, deltaTime);

      const alpha = 1.0 - s.life / s.maxLife;
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, alpha);

      if (s.life >= s.maxLife) {
        this.sparksGroup.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.activeSparks.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life += deltaTime;
      const s = 1.0 + sw.life * sw.scaleSpeed;
      sw.mesh.scale.set(s, s, s);

      const mat = sw.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.9 - sw.life * sw.opacitySpeed);

      if (mat.opacity <= 0.01) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        mat.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Healing Helix
    for (let i = this.healParticles.length - 1; i >= 0; i--) {
      const p = this.healParticles[i];
      p.life += deltaTime;
      p.angle += p.speed * deltaTime;
      p.height += deltaTime * 0.6;

      p.mesh.position.x += Math.cos(p.angle) * 0.03;
      p.mesh.position.z += Math.sin(p.angle) * 0.03;
      p.mesh.position.y += deltaTime * 0.8;

      const alpha = 1.0 - p.life / 0.85;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, alpha);

      if (p.life >= 0.85) {
        this.healGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.healParticles.splice(i, 1);
      }
    }

    // 4. Render Floating Combat Damage Canvas
    this.renderDamageCanvas(deltaTime, camera);
  }

  private renderDamageCanvas(deltaTime: number, camera: THREE.Camera): void {
    if (!this.textCtx || !this.textCanvas) return;

    this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const txt = this.floatingTexts[i];
      txt.life += deltaTime;
      txt.position.addScaledVector(txt.velocity, deltaTime);
      txt.velocity.y *= 0.94; // Decelerate upward velocity

      // Project 3D position to 2D screen space
      const screenPos = txt.position.clone().project(camera);

      // Check if behind camera
      if (screenPos.z > 1.0) continue;

      const x = (screenPos.x * 0.5 + 0.5) * this.textCanvas.width;
      const y = (-(screenPos.y * 0.5) + 0.5) * this.textCanvas.height;

      const progress = txt.life / txt.maxLife;
      const alpha = Math.max(0, 1.0 - Math.pow(progress, 1.5));
      const fontSize = txt.isCritical ? 26 + (1.0 - progress) * 6 : 18;

      this.textCtx.save();
      this.textCtx.globalAlpha = alpha;
      this.textCtx.font = `900 ${Math.round(fontSize)}px 'Cinzel', 'Trajan Pro', serif`;
      this.textCtx.textAlign = 'center';
      this.textCtx.textBaseline = 'middle';

      // Drop shadow / stroke
      this.textCtx.strokeStyle = txt.isCritical ? '#4a1100' : '#111111';
      this.textCtx.lineWidth = txt.isCritical ? 5 : 3.5;
      this.textCtx.strokeText(txt.text, x, y);

      this.textCtx.fillStyle = txt.color;
      this.textCtx.fillText(txt.text, x, y);
      this.textCtx.restore();

      if (txt.life >= txt.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public dispose(): void {
    if (this.trailMesh) {
      this.scene.remove(this.trailMesh);
      this.trailGeo?.dispose();
      (this.trailMesh.material as THREE.Material).dispose();
    }
    this.scene.remove(this.sparksGroup);
    this.scene.remove(this.healGroup);
    if (this.textCanvas && this.textCanvas.parentNode) {
      this.textCanvas.parentNode.removeChild(this.textCanvas);
    }
  }
}
