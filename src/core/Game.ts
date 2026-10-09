/**
 * Game Orchestrator
 * High-level bootstrap coordinating physics, scenes, camera, engine, and UI.
 */

import { CameraManager } from '../camera/CameraManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { SceneManager } from '../scene/SceneManager';
import { InputManager } from '../input/InputManager';
import { AudioManager } from '../audio/AudioManager';
import { UIManager } from '../ui/UIManager';
import { Engine } from './Engine';
import { BootScene } from '../scenes/BootScene';
import { ArenaScene } from '../scenes/ArenaScene';

export class Game {
  private engine!: Engine;
  private cameraManager!: CameraManager;
  private physicsWorld!: PhysicsWorld;
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private audioManager!: AudioManager;
  private uiManager!: UIManager;

  public async bootstrap(canvasContainer: HTMLElement, uiOverlay: HTMLElement): Promise<void> {
    console.log('[Fur & Fury] Initializing Rapier 3D WebAssembly physics engine...');
    await PhysicsWorld.initialize();

    this.physicsWorld = new PhysicsWorld();
    this.physicsWorld.init();

    this.cameraManager = new CameraManager();
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();

    this.sceneManager = new SceneManager(
      this.cameraManager,
      this.physicsWorld,
      this.inputManager,
      this.audioManager
    );

    this.engine = new Engine(
      canvasContainer,
      this.cameraManager,
      this.physicsWorld,
      this.sceneManager,
      this.inputManager
    );

    this.uiManager = new UIManager(uiOverlay, this.audioManager);
    this.uiManager.setTimeReference(this.engine.getTime());

    // Register scenes
    const bootScene = new BootScene();
    const arenaScene = new ArenaScene();
    this.sceneManager.registerScene(bootScene);
    this.sceneManager.registerScene(arenaScene);

    // Switch to Grand Arena primary environment
    await this.sceneManager.switchScene(arenaScene.id);
    this.engine.start();

    // UI update loop
    setInterval(() => {
      this.uiManager.update();
    }, 250);

    console.log('[Fur & Fury] Bootstrap complete. Ready for Step 1 execution.');
  }

  public destroy(): void {
    if (this.engine) this.engine.destroy();
    if (this.inputManager) this.inputManager.detach();
    if (this.physicsWorld) this.physicsWorld.dispose();
  }
}
