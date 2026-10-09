/**
 * Scene Interface
 * Defines the lifecycle of game scenes in Fur & Fury.
 */

import * as THREE from 'three';
import { CameraManager } from '../camera/CameraManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { InputManager } from '../input/InputManager';
import { AudioManager } from '../audio/AudioManager';

export interface SceneContext {
  cameraManager: CameraManager;
  physicsWorld: PhysicsWorld;
  inputManager: InputManager;
  audioManager: AudioManager;
}

export interface IScene {
  readonly id: string;
  init(context: SceneContext): Promise<void> | void;
  update(deltaTime: number): void;
  fixedUpdate(fixedDeltaTime: number): void;
  destroy(): void;
  getThreeScene(): THREE.Scene;
}
