/**
 * Grand Arena Gameplay & Character Scene
 * Integrates Lady Anuki with third-person kinematic controller,
 * Rapier 3D collision physics, dynamic follow camera, cinematic vantage presets,
 * and Step 4: Rhazakar the Scarlet Dragon with the playable Opening Cinematic.
 */

import * as THREE from 'three';
import { IScene, SceneContext } from '../scene/IScene';
import { GrandArena } from '../world/GrandArena';
import { EnvironmentManager } from '../world/EnvironmentManager';
import { ArenaCameraController, CameraPreset } from '../camera/ArenaCameraController';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { AnukiController } from '../character/AnukiController';
import { RhazakarModel } from '../dragon/RhazakarModel';
import { RhazakarAnimator } from '../dragon/RhazakarAnimator';
import { DragonEffects } from '../dragon/DragonEffects';
import { OpeningCinematic } from '../cinematic/OpeningCinematic';
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

  // Step 4 Dragon & Cinematic Subsystems
  private rhazakar!: RhazakarModel;
  private dragonAnimator!: RhazakarAnimator;
  private dragonEffects!: DragonEffects;
  private cinematic!: OpeningCinematic;

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

  public getRhazakar(): RhazakarModel {
    return this.rhazakar;
  }

  public getDragonAnimator(): RhazakarAnimator {
    return this.dragonAnimator;
  }

  public getCinematic(): OpeningCinematic {
    return this.cinematic;
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
    this.anuki = new AnukiController(
      this.scene,
      context.physicsWorld,
      context.inputManager,
      context.audioManager,
      0,
      0.1,
      2.5
    );

    // 4. Initialize Rhazakar the Scarlet Dragon and VFX
    this.rhazakar = new RhazakarModel();
    this.scene.add(this.rhazakar.getRoot());

    this.dragonAnimator = new RhazakarAnimator(this.rhazakar);
    this.dragonEffects = new DragonEffects(this.scene);

    // 5. Initialize Opening Cinematic Sequence Director
    this.cinematic = new OpeningCinematic(
      this.rhazakar,
      this.dragonAnimator,
      this.dragonEffects,
      this.anuki,
      context.cameraManager,
      context.audioManager
    );

    // 6. Initialize Third-Person Follow Camera & Cinematic Camera
    this.thirdPersonCamera = new ThirdPersonCamera(context.cameraManager);
    this.thirdPersonCamera.setTarget(this.anuki.getModel().getRoot());
    this.cameraController = new ArenaCameraController(context.cameraManager);

    // 7. Register EventBus listeners for UI controls
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

    // Play/Skip Cinematic listeners
    const unbindPlayCinematic = this.eventBus.on<void>('PLAY_OPENING_CINEMATIC', () => {
      this.playOpeningCinematic();
    });
    this.unbindEvents.push(unbindPlayCinematic);

    const unbindSkipCinematic = this.eventBus.on<void>('SKIP_OPENING_CINEMATIC', () => {
      this.cinematic.skip();
      this.cameraMode = 'THIRD_PERSON';
      this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
    });
    this.unbindEvents.push(unbindSkipCinematic);

    const unbindDragonCall = this.eventBus.on<void>('TRIGGER_DRAGON_CALL', () => {
      this.triggerDragonCall();
    });
    this.unbindEvents.push(unbindDragonCall);

    const unbindDrawSword = this.eventBus.on<void>('DRAW_SWORD_ACTION', () => {
      if (this.cinematic.isPlaying()) {
        this.cinematic.triggerSwordDraw();
      }
    });
    this.unbindEvents.push(unbindDrawSword);

    // Track mouse movement for cinematic look-around agency
    const onMouseMove = (e: MouseEvent) => {
      if (this.cinematic.isPlaying()) {
        this.cinematic.handleLookOffset(e.movementX, e.movementY);
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    this.unbindEvents.push(() => window.removeEventListener('mousemove', onMouseMove));

    // Launch opening cinematic on initial game start per PRD Section 10
    this.playOpeningCinematic();
  }

  public playOpeningCinematic(): void {
    this.cameraMode = 'CINEMATIC';
    this.cinematic.play();
    this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
  }

  public triggerDragonCall(): boolean {
    if (this.dragonCallCooldown > 0 || this.cinematic.isPlaying()) return false;

    this.dragonCallCooldown = this.DRAGON_CALL_MAX_COOLDOWN;
    this.dragonAnimator.triggerDragonCall();
    this.context.audioManager.playDragonCall();
    this.context.cameraManager.addShake(0.28);

    this.eventBus.emit('DRAGON_CALL_COOLDOWN', {
      current: this.dragonCallCooldown,
      max: this.DRAGON_CALL_MAX_COOLDOWN,
    });
    return true;
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

  private dragonCallCooldown: number = 0;
  private readonly DRAGON_CALL_MAX_COOLDOWN: number = 18.0;

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    // Handle cinematic active loop
    if (this.cinematic.isPlaying()) {
      // Check for contextual sword draw key (E or J key)
      if (this.cinematic.isAwaitingSwordDraw()) {
        if (
          this.context.inputManager.isActionJustPressed('interact') ||
          this.context.inputManager.isActionJustPressed('lightAttack')
        ) {
          this.cinematic.triggerSwordDraw();
        }
      }

      // Check Escape key to skip cinematic
      if (this.context.inputManager.isActionJustPressed('menu')) {
        this.cinematic.skip();
        this.cameraMode = 'THIRD_PERSON';
        this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
        return;
      }

      // Handle player flight banking input (A/D or Left/Right)
      let lean = 0;
      if (this.context.inputManager.isActionActive('left')) lean -= 1.0;
      if (this.context.inputManager.isActionActive('right')) lean += 1.0;
      this.cinematic.handleBankInput(lean);

      // Update cinematic sequence & dragon
      this.cinematic.update(deltaTime);
      this.dragonAnimator.update(deltaTime);
      this.dragonEffects.update(deltaTime, this.rhazakar.getRoot().position);

      // Update atmosphere
      this.environment.update(deltaTime, this.elapsedTime);
      this.arena.update(deltaTime, this.elapsedTime);
      return;
    }

    // Auto-transition camera when cinematic completes
    if (!this.cinematic.isPlaying() && this.cameraMode === 'CINEMATIC' && this.cinematic.getCurrentBeat() === 'COMPLETED') {
      this.cameraMode = 'THIRD_PERSON';
      this.eventBus.emit('CAMERA_MODE_CHANGED', this.cameraMode);
    }

    // --- PLAYABLE THIRD-PERSON DUEL GAMEPLAY ---

    // Update Dragon Call cooldown timer
    if (this.dragonCallCooldown > 0) {
      this.dragonCallCooldown = Math.max(0, this.dragonCallCooldown - deltaTime);
      this.eventBus.emit('DRAGON_CALL_COOLDOWN', {
        current: this.dragonCallCooldown,
        max: this.DRAGON_CALL_MAX_COOLDOWN,
      });
    }

    // Check Dragon Call action key (T or X key per PRD Section 9 & 10)
    if (this.context.inputManager.isActionJustPressed('dragonCall')) {
      this.triggerDragonCall();
    }

    // --- PLAYABLE THIRD-PERSON DUEL GAMEPLAY ---

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

    // Update Rhazakar in continuous overhead arena patrol mode
    this.dragonAnimator.update(deltaTime);
    this.dragonEffects.update(deltaTime, this.rhazakar.getRoot().position);

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
    // Only run Rapier kinematic step when not mounted on dragon
    if (!this.cinematic.isPlaying() || this.cinematic.getCurrentBeat() === 'COMPLETED') {
      this.anuki.fixedUpdate(fixedDeltaTime);
    }
  }

  public destroy(): void {
    this.unbindEvents.forEach((unbind) => unbind());
    this.unbindEvents = [];
    this.anuki.dispose();
    this.dragonEffects.dispose();
    this.environment.dispose();
    this.arena.dispose();
    this.scene.clear();
  }
}
