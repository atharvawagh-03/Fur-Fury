/**
 * Core Time & Frame Delta Management
 * Provides stable variable delta time for rendering and accumulator metrics for fixed timestep physics.
 */

export class Time {
  public deltaTime: number = 0;
  public elapsedTime: number = 0;
  public frameCount: number = 0;
  public fps: number = 60;

  private lastTime: number = 0;
  private fpsUpdateInterval: number = 0.5; // Update FPS reading every 500ms
  private fpsTimer: number = 0;
  private fpsFrameCounter: number = 0;

  constructor() {
    this.lastTime = performance.now();
  }

  public update(currentTime: number): void {
    const rawDelta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp delta time to avoid large jumps during window blur / tab switch (max 100ms)
    this.deltaTime = Math.min(rawDelta, 0.1);
    this.elapsedTime += this.deltaTime;
    this.frameCount++;

    // Compute FPS rolling average
    this.fpsTimer += this.deltaTime;
    this.fpsFrameCounter++;
    if (this.fpsTimer >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.fpsFrameCounter / this.fpsTimer));
      this.fpsTimer = 0;
      this.fpsFrameCounter = 0;
    }
  }

  public reset(): void {
    this.lastTime = performance.now();
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.frameCount = 0;
    this.fps = 60;
  }
}
