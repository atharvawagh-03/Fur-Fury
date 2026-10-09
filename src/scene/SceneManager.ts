/**
 * Scene Manager
 * Orchestrates registration, transitions, and frame lifecycle updates of game scenes.
 */

import * as THREE from 'three';
import { IScene, SceneContext } from './IScene';
import { CameraManager } from '../camera/CameraManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { InputManager } from '../input/InputManager';
import { AudioManager } from '../audio/AudioManager';

export class SceneManager {
  private scenes: Map<string, IScene> = new Map();
  private activeScene: IScene | null = null;
  private context: SceneContext;

  constructor(
    cameraManager: CameraManager,
    physicsWorld: PhysicsWorld,
    inputManager: InputManager,
    audioManager: AudioManager
  ) {
    this.context = {
      cameraManager,
      physicsWorld,
      inputManager,
      audioManager,
    };
  }

  public registerScene(scene: IScene): void {
    this.scenes.set(scene.id, scene);
  }

  public async switchScene(sceneId: string): Promise<void> {
    const nextScene = this.scenes.get(sceneId);
    if (!nextScene) {
      throw new Error(`Scene "${sceneId}" not found in SceneManager.`);
    }

    if (this.activeScene) {
      this.activeScene.destroy();
    }

    this.activeScene = nextScene;
    await this.activeScene.init(this.context);
  }

  public getActiveScene(): IScene | null {
    return this.activeScene;
  }

  public getActiveThreeScene(): THREE.Scene | null {
    return this.activeScene ? this.activeScene.getThreeScene() : null;
  }

  public update(deltaTime: number): void {
    if (this.activeScene) {
      this.activeScene.update(deltaTime);
    }
  }

  public fixedUpdate(fixedDeltaTime: number): void {
    if (this.activeScene) {
      this.activeScene.fixedUpdate(fixedDeltaTime);
    }
  }
}
