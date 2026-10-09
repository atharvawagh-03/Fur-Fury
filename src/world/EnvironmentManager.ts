/**
 * Environment Manager
 * Controls atmospheric sky dome, directional sunlight, soft fill lights,
 * distance mountain silhouettes, and floating dust / fire ember particle systems.
 */

import * as THREE from 'three';

export class EnvironmentManager {
  private scene: THREE.Scene;
  private emberParticles: THREE.Points | null = null;
  private dustParticles: THREE.Points | null = null;
  private particleCountEmbers = 180;
  private particleCountDust = 400;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setupAtmosphere(): void {
    // Veyrholm sky color palette
    this.scene.background = new THREE.Color(0x1a2133);
    this.scene.fog = new THREE.FogExp2(0x1f273b, 0.009);

    this.createSkyDome();
    this.createDistantMountains();
    this.setupLighting();
    this.createDustParticles();
    this.createEmberParticles();
  }

  private createSkyDome(): void {
    // Large hemisphere sky dome with vertical gradient
    const skyGeo = new THREE.SphereGeometry(300, 32, 16);
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Golden hour sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#101726');   // Deep azure zenith
    grad.addColorStop(0.5, '#2b3952'); // Atmospheric midtone
    grad.addColorStop(0.75, '#c28352'); // Warm amber cloud layer
    grad.addColorStop(0.9, '#e0a96d');  // Golden horizon
    grad.addColorStop(1.0, '#3a2d24');  // Terrain base
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);
  }

  private createDistantMountains(): void {
    // Distant mountain ring surrounding Veyrholm
    const mountainGroup = new THREE.Group();
    const peakCount = 18;
    const radius = 240;

    for (let i = 0; i < peakCount; i++) {
      const angle = (i / peakCount) * Math.PI * 2;
      const height = 40 + Math.sin(i * 1.7) * 20 + Math.cos(i * 2.3) * 15;
      const width = 35 + Math.random() * 15;

      const coneGeo = new THREE.ConeGeometry(width, height, 5);
      const coneMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.62, 0.25, 0.12 + Math.random() * 0.05),
      });

      const peak = new THREE.Mesh(coneGeo, coneMat);
      peak.position.set(Math.cos(angle) * radius, height / 2 - 5, Math.sin(angle) * radius);
      mountainGroup.add(peak);
    }

    this.scene.add(mountainGroup);
  }

  private setupLighting(): void {
    // Ambient hemisphere light (Cool blue sky fill + warm earth bounce)
    const hemiLight = new THREE.HemisphereLight(0xdfe8ff, 0x3d3022, 0.75);
    this.scene.add(hemiLight);

    // Primary Sun Light (Veyrholm golden sunlight)
    const sunLight = new THREE.DirectionalLight(0xffecd0, 2.2);
    sunLight.position.set(35, 45, 25);
    sunLight.castShadow = true;

    // Shadow map tuning for high-detail arena coverage
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 120;
    const d = 32;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Secondary fill / rim light (Cool northern sky fill)
    const rimLight = new THREE.DirectionalLight(0x7090d0, 0.5);
    rimLight.position.set(-30, 25, -20);
    this.scene.add(rimLight);
  }

  private createDustParticles(): void {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCountDust * 3);

    for (let i = 0; i < this.particleCountDust; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 15 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffe8c2,
      size: 0.15,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  private createEmberParticles(): void {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCountEmbers * 3);

    for (let i = 0; i < this.particleCountEmbers; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 8 + 1.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xff6611,
      size: 0.22,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.emberParticles = new THREE.Points(geo, mat);
    this.scene.add(this.emberParticles);
  }

  public update(deltaTime: number, elapsedTime: number): void {
    // Animate subtle dust floating
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) - 0.3 * deltaTime;
        if (y < 0.2) y = 15;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(elapsedTime * 0.5 + i) * 0.05 * deltaTime);
      }
      pos.needsUpdate = true;
    }

    // Animate glowing ember drift upwards
    if (this.emberParticles) {
      const pos = this.emberParticles.geometry.attributes.position as THREE.BufferAttribute;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + (1.2 + Math.sin(i) * 0.4) * deltaTime;
        if (y > 9.0) y = 1.0;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(elapsedTime * 2.0 + i) * 0.25 * deltaTime);
        pos.setZ(i, pos.getZ(i) + Math.cos(elapsedTime * 2.0 + i) * 0.25 * deltaTime);
      }
      pos.needsUpdate = true;
    }
  }

  public dispose(): void {
    if (this.dustParticles) {
      this.dustParticles.geometry.dispose();
      (this.dustParticles.material as THREE.Material).dispose();
      this.scene.remove(this.dustParticles);
    }
    if (this.emberParticles) {
      this.emberParticles.geometry.dispose();
      (this.emberParticles.material as THREE.Material).dispose();
      this.scene.remove(this.emberParticles);
    }
  }
}
