/**
 * Grand Arena Gameplay & Character Scene
 * Integrates Lady Anuki with third-person kinematic controller,
 * Rapier 3D collision physics, dynamic follow camera, and cinematic vantage presets.
 */

import * as THREE from 'three';
import { IScene, SceneContext } from '../scene/IScene';
import { GrandArena } from '../world/GrandArena';
import { EnvironmentManager } from '../world/EnvironmentManager';
import { ArenaCameraController, CameraPreset } from '../camera/ArenaCameraController';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { AnukiController } from '../character/AnukiController';
import { EventBus } from '../core/EventBus';

export type ActiveCameraMode = 'THIRD_PERSON' | 'CINEMATIC';

export class ArenaScene implements IScene {
  public readonly id = 'ArenaScene';
  private scene: THREE.Scene;
  private context!: SceneContext;
  private arena!: GrandArena;
  private environment!: EnvironmentManager;
  private cameraController!: ArenaCameraController;
  private thirdPersonCamera!: ThirdPersonCamera;
  private anuki!: AnukiController;
  private cameraMode: ActiveCameraMode = 'THIRD_PERSON';

  private eventBus = EventBus.getInstance();
  private unbindEvents: (() => void)[] = [];
  private elapsedTime: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
  }

  public getThreeScene(): THREE.Scene {
    return this.scene;
  }

  public getAnuki(): AnukiController {
    return this.anuki;
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

    // 3. Spawn Lady Anuki with Kinematic Character Controller
    // Spawns standing in the dueling circle facing the North Gate of Champions
    this.anuki = new AnukiController(
      this.scene,
      context.physicsWorld,
      context.inputManager,
      context.audioManager,
      0,
      0.1,
      2.5
    );

    // 4. Initialize Third-Person Follow Camera & Cinematic Camera
    this.thirdPersonCamera = new ThirdPersonCamera(context.cameraManager);
    this.thirdPersonCamera.setTarget(this.anuki.getModel().getRoot());

    this.cameraController = new ArenaCameraController(context.cameraManager);

    // 5. Register EventBus listeners for UI controls
    const unbindPreset = this.eventBus.on<CameraPreset>('SET_CAMERA_PRESET', (preset) => {
      this.cameraMode = 'CINEMATIC';
      this.cameraController.applyPreset(preset);
      this.context.audioManager.playUiClick();
      this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
    });
    this.unbindEvents.push(unbindPreset);

    const unbindHeroCam = this.eventBus.on<void>('SWITCH_TO_HERO_CAMERA', () => {
      this.cameraMode = 'THIRD_PERSON';
      this.context.audioManager.playUiClick();
      this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
    });
    this.unbindEvents.push(unbindHeroCam);

    const unbindLockOn = this.eventBus.on<void>('TOGGLE_LOCK_ON', () => {
      const isLocked = this.thirdPersonCamera.toggleLockOn(new THREE.Vector3(0, 1.2, -4));
      this.context.audioManager.playUiClick();
      this.eventBus.emit('LOCK_ON_STATE', isLocked);
    });
    this.unbindEvents.push(unbindLockOn);

    const unbindOrbit = this.eventBus.on<void>('TOGGLE_AUTO_ORBIT', () => {
      this.cameraMode = 'CINEMATIC';
      const active = this.cameraController.toggleAutoOrbit();
      this.context.audioManager.playUiClick();
      this.eventBus.emit('AUTO_ORBIT_STATE', active);
      this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
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

    const r = 0.45 + Math.random() * 0.25;
    const geo = new THREE.SphereGeometry(r, 20, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xdeb853,
      metalness: 0.85,
      roughness: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Spawn slightly ahead of Anuki or above center
    const anukiPos = this.anuki.getPosition();
    const rx = anukiPos.x + (Math.random() - 0.5) * 4;
    const rz = anukiPos.z + (Math.random() - 0.5) * 4;
    const phys = pw.createDynamicSphere(rx, 8, rz, r, 0.6);
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

    // Check Lock-On toggle key (R key)
    if (this.context.inputManager.isActionJustPressed('lockOn')) {
      const isLocked = this.thirdPersonCamera.toggleLockOn(new THREE.Vector3(0, 1.2, -4));
      this.context.audioManager.playUiClick();
      this.eventBus.emit('LOCK_ON_STATE', isLocked);
    }

    // Auto-switch back to third person camera if player moves with WASD
    const isMovingInput =
      this.context.inputManager.isActionActive('forward') ||
      this.context.inputManager.isActionActive('backward') ||
      this.context.inputManager.isActionActive('left') ||
      this.context.inputManager.isActionActive('right');

    if (isMovingInput && this.cameraMode === 'CINEMATIC') {
      this.cameraMode = 'THIRD_PERSON';
      this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
    }

    // Get active camera yaw for character movement orientation
    const cameraYaw = this.thirdPersonCamera.getYaw();

    // Update Lady Anuki (Controller, Animator, Particle FX, Audio)
    this.anuki.update(deltaTime, cameraYaw);

    // Update active camera
    if (this.cameraMode === 'THIRD_PERSON') {
      this.thirdPersonCamera.update(deltaTime);
    } else {
      this.cameraController.update(deltaTime);
    }

    // Update atmosphere & environmental particles
    this.environment.update(deltaTime, this.elapsedTime);

    // Update banner cloth flutter, fire braziers, and dynamic physical props
    this.arena.update(deltaTime, this.elapsedTime);
  }

  public fixedUpdate(fixedDeltaTime: number): void {
    // Run Rapier 3D kinematic character controller simulation step
    this.anuki.fixedUpdate(fixedDeltaTime);
  }

  public destroy(): void {
    this.unbindEvents.forEach((unbind) => unbind());
    this.unbindEvents = [];
    this.anuki.dispose();
    this.environment.dispose();
    this.arena.dispose();
    this.scene.clear();
  }
}
