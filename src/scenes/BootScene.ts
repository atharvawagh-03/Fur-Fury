/**
 * Boot Scene - Architecture Showcase & Engine Verification
 * Staging ground for Step 1: verifies Three.js rendering, Rapier 3D rigid bodies,
 * lighting, shadows, materials, and input reactivity.
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { IScene, SceneContext } from '../scene/IScene';
import { EventBus } from '../core/EventBus';

interface PhysicsEntity {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
}

export class BootScene implements IScene {
  public readonly id = 'BootScene';
  private scene: THREE.Scene;
  private context!: SceneContext;
  private physicsEntities: PhysicsEntity[] = [];
  private braziers: { light: THREE.PointLight; baseIntensity: number }[] = [];
  private timeAccumulator: number = 0;
  private eventBus = EventBus.getInstance();

  constructor() {
    this.scene = new THREE.Scene();
  }

  public getThreeScene(): THREE.Scene {
    return this.scene;
  }

  public async init(context: SceneContext): Promise<void> {
    this.context = context;

    // Atmospheric setup
    this.scene.background = new THREE.Color(0x0e111a);
    this.scene.fog = new THREE.FogExp2(0x0e111a, 0.02);

    // Setup authored lighting
    this.setupLighting();

    // Setup architectural environment
    this.setupEnvironment();

    // Setup Rapier 3D static colliders
    this.setupPhysicsEnvironment();

    // Spawn initial showcase physics entities
    this.spawnPhysicsShowcase();

    // Camera initial framing
    this.context.cameraManager.setPosition(0, 6, 14);
    this.context.cameraManager.setLookAt(new THREE.Vector3(0, 1.5, 0));

    // Listen for drop interactive request
    this.eventBus.on('SPAWN_PHYSICS_CREST', () => {
      this.spawnInteractiveCrest();
    });
  }

  private setupLighting(): void {
    // Soft ambient hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xdde6ff, 0x221a15, 0.6);
    this.scene.add(hemiLight);

    // Key sunlight (Veyrholm golden hour)
    const sunLight = new THREE.DirectionalLight(0xffecd0, 1.8);
    sunLight.position.set(12, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    const d = 15;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Rim light for stylized definition
    const rimLight = new THREE.DirectionalLight(0x7090ff, 0.5);
    rimLight.position.set(-10, 10, -10);
    this.scene.add(rimLight);
  }

  private createStoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base stone color
    ctx.fillStyle = '#6b665f';
    ctx.fillRect(0, 0, 512, 512);

    // Procedural stone noise & tile grid
    ctx.strokeStyle = '#44403b';
    ctx.lineWidth = 4;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Speckles
    for (let i = 0; i < 2000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const gray = Math.floor(80 + Math.random() * 60);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(px, py, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  private setupEnvironment(): void {
    const stoneTex = this.createStoneTexture();

    // Arena Floor
    const floorGeo = new THREE.CylinderGeometry(14, 14.5, 0.8, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.75,
      metalness: 0.1,
      color: 0x8a847b,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.4;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Central raised dais / tournament platform
    const daisGeo = new THREE.CylinderGeometry(7, 7.5, 0.6, 24);
    const daisMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.65,
      metalness: 0.2,
      color: 0xa8a195,
    });
    const daisMesh = new THREE.Mesh(daisGeo, daisMat);
    daisMesh.position.y = 0.2;
    daisMesh.receiveShadow = true;
    daisMesh.castShadow = true;
    this.scene.add(daisMesh);

    // Stone rim ring with gold trim
    const trimGeo = new THREE.TorusGeometry(7.2, 0.15, 12, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25,
    });
    const trimMesh = new THREE.Mesh(trimGeo, goldMat);
    trimMesh.rotation.x = Math.PI / 2;
    trimMesh.position.y = 0.5;
    trimMesh.castShadow = true;
    this.scene.add(trimMesh);

    // 4 Grand Arena Fire Braziers / Pillars
    const brazierPositions = [
      { x: -6, z: -6 },
      { x: 6, z: -6 },
      { x: -6, z: 6 },
      { x: 6, z: 6 },
    ];

    brazierPositions.forEach((pos) => {
      // Pillar shaft
      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 3.5, 12);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x5a554e,
        roughness: 0.85,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pos.x, 1.75, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Brazier bowl
      const bowlGeo = new THREE.ConeGeometry(0.9, 0.7, 8, 1, true);
      const bowlMat = new THREE.MeshStandardMaterial({
        color: 0x2c2b29,
        metalness: 0.8,
        roughness: 0.4,
      });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.rotation.x = Math.PI;
      bowl.position.set(pos.x, 3.7, pos.z);
      bowl.castShadow = true;
      this.scene.add(bowl);

      // Glowing flame core
      const flameGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff7722,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(pos.x, 4.0, pos.z);
      this.scene.add(flame);

      // Fire Point Light
      const fireLight = new THREE.PointLight(0xff7722, 1.5, 12);
      fireLight.position.set(pos.x, 4.2, pos.z);
      fireLight.castShadow = true;
      this.scene.add(fireLight);

      this.braziers.push({ light: fireLight, baseIntensity: 1.5 });
    });
  }

  private setupPhysicsEnvironment(): void {
    const pw = this.context.physicsWorld;
    if (!pw.ready) return;

    // Static floor collider matching arena
    pw.createStaticBox(0, -0.4, 0, 15, 0.4, 15);

    // Static dais collider
    pw.createStaticBox(0, 0.2, 0, 7.5, 0.3, 7.5);
  }

  private spawnPhysicsShowcase(): void {
    const pw = this.context.physicsWorld;
    if (!pw.ready) return;

    // 1. Royal Emblem Test Orb (Golden Moonfang Crest)
    const sphereRadius = 0.55;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x332200,
      emissiveIntensity: 0.2,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, goldMat);
    sphereMesh.castShadow = true;
    this.scene.add(sphereMesh);

    const spherePhys = pw.createDynamicSphere(0, 5, 0, sphereRadius, 0.65);
    if (spherePhys) {
      this.physicsEntities.push({ mesh: sphereMesh, body: spherePhys.body });
    }

    // 2. Training Relic Test Cubes
    for (let i = 0; i < 3; i++) {
      const boxHalf = 0.35;
      const boxGeo = new THREE.BoxGeometry(boxHalf * 2, boxHalf * 2, boxHalf * 2);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x8892a0,
        metalness: 0.5,
        roughness: 0.4,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.castShadow = true;
      this.scene.add(boxMesh);

      const offset = (i - 1) * 1.5;
      const boxPhys = pw.createDynamicBox(offset, 4 + i * 1.2, -1, boxHalf, boxHalf, boxHalf, 0.3);
      if (boxPhys) {
        this.physicsEntities.push({ mesh: boxMesh, body: boxPhys.body });
      }
    }
  }

  public spawnInteractiveCrest(): void {
    const pw = this.context.physicsWorld;
    if (!pw.ready) return;

    const r = 0.4 + Math.random() * 0.25;
    const isGold = Math.random() > 0.4;
    const geo = new THREE.SphereGeometry(r, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: isGold ? 0xdfb15b : 0x4a779d,
      metalness: 0.8,
      roughness: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const rx = (Math.random() - 0.5) * 5;
    const rz = (Math.random() - 0.5) * 5;
    const phys = pw.createDynamicSphere(rx, 8, rz, r, 0.7);
    if (phys) {
      this.physicsEntities.push({ mesh, body: phys.body });
      this.context.audioManager.playHitSound(300 + Math.random() * 200);
      this.context.cameraManager.addShake(0.1);
    }
  }

  public update(deltaTime: number): void {
    this.timeAccumulator += deltaTime;

    // Brazier fire flicker animation
    this.braziers.forEach((b, idx) => {
      const flicker = Math.sin(this.timeAccumulator * 8 + idx) * 0.25 + (Math.random() - 0.5) * 0.15;
      b.light.intensity = b.baseIntensity + flicker;
    });

    // Handle space key to spawn interactive crest
    if (this.context.inputManager.isActionJustPressed('dodge')) {
      this.spawnInteractiveCrest();
    }
  }

  public fixedUpdate(_fixedDeltaTime: number): void {
    // Synchronize Three.js visual meshes with Rapier 3D rigid bodies
    for (let i = 0; i < this.physicsEntities.length; i++) {
      const entity = this.physicsEntities[i];
      const t = entity.body.translation();
      const r = entity.body.rotation();

      entity.mesh.position.set(t.x, t.y, t.z);
      entity.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  public destroy(): void {
    // Cleanup Three.js geometries and materials
    this.physicsEntities.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.scene.remove(mesh);
    });
    this.physicsEntities = [];
    this.braziers = [];
  }
}
