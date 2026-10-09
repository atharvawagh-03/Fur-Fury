/**
 * Core Engine
 * Manages WebGL rendering context, window resize handling,
 * and deterministic fixed-timestep game loop.
 */

import * as THREE from 'three';
import { Time } from './Time';
import { GameConfig } from '../config/GameConfig';
import { CameraManager } from '../camera/CameraManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { SceneManager } from '../scene/SceneManager';
import { InputManager } from '../input/InputManager';

export class Engine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private cameraManager: CameraManager;
  private physicsWorld: PhysicsWorld;
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private time: Time;

  private isRunning: boolean = false;
  private physicsAccumulator: number = 0;
  private fixedDeltaTime: number = GameConfig.PHYSICS.FIXED_DELTA_TIME;
  private maxSubSteps: number = GameConfig.PHYSICS.MAX_SUB_STEPS;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    container: HTMLElement,
    cameraManager: CameraManager,
    physicsWorld: PhysicsWorld,
    sceneManager: SceneManager,
    inputManager: InputManager
  ) {
    this.container = container;
    this.cameraManager = cameraManager;
    this.physicsWorld = physicsWorld;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.time = new Time();

    // Initialize WebGLRenderer with AAA-quality tone mapping & shadow configs
    this.renderer = new THREE.WebGLRenderer({
      antialias: GameConfig.GRAPHICS.ANTIALIAS,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GameConfig.GRAPHICS.PIXEL_RATIO_MAX));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    this.setupResizeHandler();
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getTime(): Time {
    return this.time;
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      if (width === 0 || height === 0) return;

      this.cameraManager.handleResize(width, height);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GameConfig.GRAPHICS.PIXEL_RATIO_MAX));
    };

    window.addEventListener('resize', handleResize);
    this.resizeObserver = new ResizeObserver(() => handleResize());
    this.resizeObserver.observe(this.container);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.time.reset();
    this.loop(performance.now());
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    this.time.update(currentTime);
    const dt = this.time.deltaTime;

    // --- Fixed-timestep physics simulation ---
    this.physicsAccumulator += dt;
    let subSteps = 0;
    while (this.physicsAccumulator >= this.fixedDeltaTime && subSteps < this.maxSubSteps) {
      this.physicsWorld.step();
      this.sceneManager.fixedUpdate(this.fixedDeltaTime);
      this.physicsAccumulator -= this.fixedDeltaTime;
      subSteps++;
    }

    // Clamp physics accumulator if falling behind
    if (this.physicsAccumulator > this.fixedDeltaTime * this.maxSubSteps) {
      this.physicsAccumulator = 0;
    }

    // --- Variable timestep update ---
    this.cameraManager.update(dt);
    this.sceneManager.update(dt);

    // --- Render active scene ---
    const activeThreeScene = this.sceneManager.getActiveThreeScene();
    if (activeThreeScene) {
      this.renderer.render(activeThreeScene, this.cameraManager.getCamera());
    }

    // Flush input single-frame signals
    this.inputManager.endFrame();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public destroy(): void {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
