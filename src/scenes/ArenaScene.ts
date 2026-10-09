/**
 * Grand Arena Gameplay & Environment Showcase Scene
 * Hosts the hand-authored medieval colosseum environment, PBR materials,
 * Rapier static/dynamic colliders, and cinematic vantage controls.
 */

import * as THREE from 'three';
import { IScene, SceneContext } from '../scene/IScene';
import { GrandArena } from '../world/GrandArena';
import { EnvironmentManager } from '../world/EnvironmentManager';
import { ArenaCameraController, CameraPreset } from '../camera/ArenaCameraController';
import { EventBus } from '../core/EventBus';

export class ArenaScene implements IScene {
  public readonly id = 'ArenaScene';
  private scene: THREE.Scene;
  private context!: SceneContext;
  private arena!: GrandArena;
  private environment!: EnvironmentManager;
  private cameraController!: ArenaCameraController;
  private eventBus = EventBus.getInstance();
  private unbindEvents: (() => void)[] = [];
  private elapsedTime: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
  }

  public getThreeScene(): THREE.Scene {
    return this.scene;
  }

  public async init(context: SceneContext): Promise<void> {
    this.context = context;

    // 1. Atmosphere, sky dome, and golden hour lighting
    this.environment = new EnvironmentManager(this.scene);
    this.environment.setupAtmosphere();

    // 2. Grand Arena architecture & Rapier colliders
    this.arena = new GrandArena(context.physicsWorld);
    this.arena.build();
    this.scene.add(this.arena.getRoot());

    // 3. Orbit & Cinematic Vantage Camera Controller
    this.cameraController = new ArenaCameraController(context.cameraManager);

    // 4. Register EventBus listeners for UI controls
    const unbindPreset = this.eventBus.on<CameraPreset>('SET_CAMERA_PRESET', (preset) => {
      this.cameraController.applyPreset(preset);
      this.context.audioManager.playUiClick();
    });
    this.unbindEvents.push(unbindPreset);

    const unbindOrbit = this.eventBus.on<void>('TOGGLE_AUTO_ORBIT', () => {
      const active = this.cameraController.toggleAutoOrbit();
      this.context.audioManager.playUiClick();
      this.eventBus.emit('AUTO_ORBIT_STATE', active);
    });
    this.unbindEvents.push(unbindOrbit);

    const unbindSpawn = this.eventBus.on<void>('SPAWN_PHYSICS_PROP', () => {
      this.spawnInteractiveBoulder();
    });
    this.unbindEvents.push(unbindSpawn);
  }

  private spawnInteractiveBoulder(): void {
    const pw = this.context.physicsWorld;
    if (!pw.ready) return;

    const r = 0.5 + Math.random() * 0.3;
    const geo = new THREE.SphereGeometry(r, 20, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xdeb853,
      metalness: 0.85,
      roughness: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Spawn slightly above the arena center
    const rx = (Math.random() - 0.5) * 8;
    const rz = (Math.random() - 0.5) * 8;
    const phys = pw.createDynamicSphere(rx, 10, rz, r, 0.6);
    if (phys) {
      this.arena.getProps().push({
        mesh,
        body: phys.body,
        type: 'crate',
      });
      this.context.audioManager.playHitSound(280);
      this.context.cameraManager.addShake(0.12);
    }
  }

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    // Update particles & atmosphere
    this.environment.update(deltaTime, this.elapsedTime);

    // Update banner cloth flutter, fire flames, and lights
    this.arena.update(deltaTime, this.elapsedTime);

    // Smooth camera damping & orbit
    this.cameraController.update(deltaTime);

    // Drop interactive prop on Space key
    if (this.context.inputManager.isActionJustPressed('dodge')) {
      this.spawnInteractiveBoulder();
    }
  }

  public fixedUpdate(_fixedDeltaTime: number): void {
    // Physical prop transformation sync is handled in arena.update()
  }

  public destroy(): void {
    this.unbindEvents.forEach((unbind) => unbind());
    this.unbindEvents = [];
    this.environment.dispose();
    this.arena.dispose();
    this.scene.clear();
  }
}
