/**
 * Performance Profiler & Telemetry Engine - Step 10: Optimization & Release Readiness
 * Real-time monitoring of frame time budgets, rolling average FPS, Three.js draw calls,
 * triangle counts, GPU memory, and physics simulation time.
 */

import * as THREE from 'three';

export type PerformanceTier = 'PERFECT_60' | 'GOOD_45' | 'DEGRADED_30';

export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  avgFrameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  physicsMs: number;
  tier: PerformanceTier;
  heapMemoryMB?: number;
}

export class Profiler {
  private static instance: Profiler | null = null;

  // Frame time ring buffer for smooth rolling calculations
  private frameTimes: number[] = [];
  private readonly bufferSize: number = 60;
  private lastFrameTimestamp: number = 0;
  private currentFrameDeltaMs: number = 16.67;
  private physicsDurationMs: number = 0;

  // Cached metrics
  private cachedMetrics: PerformanceMetrics = {
    fps: 60,
    frameTimeMs: 16.67,
    avgFrameTimeMs: 16.67,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    physicsMs: 0,
    tier: 'PERFECT_60',
  };

  private renderer: THREE.WebGLRenderer | null = null;

  public static getInstance(): Profiler {
    if (!this.instance) {
      this.instance = new Profiler();
    }
    return this.instance;
  }

  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Called at the start of every render loop frame
   */
  public startFrame(timestamp: number): void {
    if (this.lastFrameTimestamp > 0) {
      const delta = Math.max(1, timestamp - this.lastFrameTimestamp);
      this.currentFrameDeltaMs = delta;

      this.frameTimes.push(delta);
      if (this.frameTimes.length > this.bufferSize) {
        this.frameTimes.shift();
      }
    }
    this.lastFrameTimestamp = timestamp;
  }

  /**
   * Records elapsed time taken by physics step
   */
  public recordPhysicsDuration(durationMs: number): void {
    this.physicsDurationMs = Math.max(0, durationMs);
  }

  /**
   * Called at the end of every render loop frame to compute telemetry snapshot
   */
  public endFrame(): PerformanceMetrics {
    const sum = this.frameTimes.reduce((acc, val) => acc + val, 0);
    const avgDeltaMs = this.frameTimes.length > 0 ? sum / this.frameTimes.length : 16.67;
    const currentFps = Math.min(144, Math.round(1000 / avgDeltaMs));

    let tier: PerformanceTier = 'PERFECT_60';
    if (currentFps < 40) {
      tier = 'DEGRADED_30';
    } else if (currentFps < 55) {
      tier = 'GOOD_45';
    }

    let drawCalls = 0;
    let triangles = 0;
    let geometries = 0;
    let textures = 0;

    if (this.renderer) {
      drawCalls = this.renderer.info.render.calls;
      triangles = this.renderer.info.render.triangles;
      geometries = this.renderer.info.memory.geometries;
      textures = this.renderer.info.memory.textures;
    }

    let heapMemoryMB: number | undefined;
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      heapMemoryMB = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
    }

    this.cachedMetrics = {
      fps: currentFps,
      frameTimeMs: Math.round(this.currentFrameDeltaMs * 10) / 10,
      avgFrameTimeMs: Math.round(avgDeltaMs * 10) / 10,
      drawCalls,
      triangles,
      geometries,
      textures,
      physicsMs: Math.round(this.physicsDurationMs * 10) / 10,
      tier,
      heapMemoryMB,
    };

    return this.cachedMetrics;
  }

  public getMetrics(): PerformanceMetrics {
    return this.cachedMetrics;
  }

  public reset(): void {
    this.frameTimes = [];
    this.lastFrameTimestamp = 0;
    this.currentFrameDeltaMs = 16.67;
    this.physicsDurationMs = 0;
  }
}
