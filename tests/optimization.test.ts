import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Profiler } from '../src/core/Profiler';
import { QualityManager } from '../src/core/QualityManager';
import { DisposalHelper } from '../src/core/DisposalHelper';

// Mock WebGLRenderer for headless Node.js testing
function createMockRenderer() {
  return {
    info: {
      render: {
        calls: 42,
        triangles: 12500,
        points: 0,
        lines: 0,
        frame: 100,
      },
      memory: {
        geometries: 18,
        textures: 12,
      },
      programs: [],
    },
    setPixelRatio: (_dpr: number) => {},
    shadowMap: {
      enabled: true,
    },
  } as unknown as THREE.WebGLRenderer;
}

describe('Step 10: Optimization, Profiling & Memory Management', () => {
  it('1. Profiler accurately calculates rolling average FPS and delta times', () => {
    const profiler = Profiler.getInstance();
    profiler.reset();

    // Simulate 60 frames at 16.67ms (60 FPS)
    let time = 1000;
    for (let i = 0; i < 60; i++) {
      profiler.startFrame(time);
      profiler.recordPhysicsDuration(2.1);
      time += 16.67;
      profiler.endFrame();
    }

    const metrics = profiler.getMetrics();
    assert.strictEqual(metrics.tier, 'PERFECT_60');
    assert.ok(metrics.fps >= 58 && metrics.fps <= 62, `FPS should be ~60, got ${metrics.fps}`);
    assert.ok(metrics.frameTimeMs >= 15 && metrics.frameTimeMs <= 18);
    assert.strictEqual(metrics.physicsMs, 2.1);
  });

  it('2. Profiler classifies performance tiers based on frame rate', () => {
    const profiler = Profiler.getInstance();
    profiler.reset();

    // Simulate severe lag at 40ms per frame (25 FPS)
    let time = 5000;
    for (let i = 0; i < 60; i++) {
      profiler.startFrame(time);
      time += 40.0;
      profiler.endFrame();
    }

    const degradedMetrics = profiler.getMetrics();
    assert.strictEqual(degradedMetrics.tier, 'DEGRADED_30');
    assert.ok(degradedMetrics.fps <= 30, `Expected <= 30 FPS, got ${degradedMetrics.fps}`);

    // Simulate recovery to 20ms per frame (50 FPS)
    for (let i = 0; i < 60; i++) {
      profiler.startFrame(time);
      time += 20.0;
      profiler.endFrame();
    }

    const goodMetrics = profiler.getMetrics();
    assert.strictEqual(goodMetrics.tier, 'GOOD_45');
    assert.ok(goodMetrics.fps >= 45 && goodMetrics.fps <= 54);
  });

  it('3. Profiler captures WebGL renderer info metrics', () => {
    const profiler = Profiler.getInstance();
    const mockRenderer = createMockRenderer();
    profiler.setRenderer(mockRenderer);

    profiler.startFrame(10000);
    const metrics = profiler.endFrame();

    assert.strictEqual(metrics.drawCalls, 42);
    assert.strictEqual(metrics.triangles, 12500);
    assert.strictEqual(metrics.geometries, 18);
    assert.strictEqual(metrics.textures, 12);
  });

  it('4. QualityManager configures presets (ULTRA, HIGH, BALANCED, LOW, AUTO_60FPS)', () => {
    const qm = QualityManager.getInstance();
    const mockRenderer = createMockRenderer();
    let appliedDpr = 1.0;

    mockRenderer.setPixelRatio = (dpr: number) => { appliedDpr = dpr; };
    qm.setRenderer(mockRenderer);

    // Test LOW preset
    qm.setPreset('LOW');
    let profile = qm.getProfile();
    assert.strictEqual(profile.preset, 'LOW');
    assert.strictEqual(profile.pixelRatio, 0.85);
    assert.strictEqual(appliedDpr, 0.85);
    assert.strictEqual(profile.shadowsEnabled, false);
    assert.strictEqual(profile.particleBudgetScale, 0.5);

    // Test BALANCED preset
    qm.setPreset('BALANCED');
    profile = qm.getProfile();
    assert.strictEqual(profile.preset, 'BALANCED');
    assert.strictEqual(profile.pixelRatio, 1.0);
    assert.strictEqual(appliedDpr, 1.0);
    assert.strictEqual(profile.shadowsEnabled, true);

    // Test AUTO_60FPS preset
    qm.setPreset('AUTO_60FPS');
    profile = qm.getProfile();
    assert.strictEqual(profile.preset, 'AUTO_60FPS');
    assert.strictEqual(profile.autoScaleActive, true);
  });

  it('5. QualityManager dynamic auto-scaling throttles and recovers DPR', () => {
    const qm = QualityManager.getInstance();
    const mockRenderer = createMockRenderer();
    let appliedDpr = 1.5;
    mockRenderer.setPixelRatio = (dpr: number) => { appliedDpr = dpr; };
    qm.setRenderer(mockRenderer);
    qm.setPreset('AUTO_60FPS');

    assert.ok(appliedDpr > 0);
    const initialDpr = qm.getProfile().pixelRatio;

    // Simulate 50 frames of heavy lag (<45 FPS)
    const laggingMetrics = {
      fps: 35,
      frameTimeMs: 28.5,
      avgFrameTimeMs: 28.5,
      drawCalls: 180,
      triangles: 200000,
      geometries: 40,
      textures: 30,
      physicsMs: 3.5,
      tier: 'DEGRADED_30' as const,
    };

    for (let i = 0; i < 50; i++) {
      qm.update(laggingMetrics);
    }

    const throttledDpr = qm.getProfile().pixelRatio;
    assert.ok(throttledDpr < initialDpr, `DPR should throttle from ${initialDpr}, but got ${throttledDpr}`);

    // Simulate sustained rock-solid 60 FPS (>58 FPS for 310 frames)
    const optimalMetrics = {
      fps: 60,
      frameTimeMs: 16.6,
      avgFrameTimeMs: 16.6,
      drawCalls: 50,
      triangles: 50000,
      geometries: 20,
      textures: 15,
      physicsMs: 1.8,
      tier: 'PERFECT_60' as const,
    };

    for (let i = 0; i < 310; i++) {
      qm.update(optimalMetrics);
    }

    const recoveredDpr = qm.getProfile().pixelRatio;
    assert.ok(recoveredDpr > throttledDpr, `DPR should recover from ${throttledDpr}, got ${recoveredDpr}`);
  });

  it('6. DisposalHelper recursively frees geometries, materials, and textures', () => {
    const root = new THREE.Group();

    let geoDisposed = false;
    let matDisposed = false;
    let texDisposed = false;

    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.dispose = () => { geoDisposed = true; };

    const tex = new THREE.Texture();
    tex.dispose = () => { texDisposed = true; };

    const mat = new THREE.MeshStandardMaterial({ map: tex });
    mat.dispose = () => { matDisposed = true; };

    const mesh = new THREE.Mesh(geo, mat);
    root.add(mesh);

    DisposalHelper.disposeHierarchy(root);

    assert.strictEqual(geoDisposed, true, 'Geometry should be disposed');
    assert.strictEqual(matDisposed, true, 'Material should be disposed');
    assert.strictEqual(texDisposed, true, 'Texture map should be disposed');
  });
});
