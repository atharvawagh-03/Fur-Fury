/**
 * Rapier 3D Physics World Wrapper
 * Handles WebAssembly initialization, deterministic fixed-step simulation, and collision geometries.
 */

import RAPIER from '@dimforge/rapier3d-compat';
import { GameConfig } from '../config/GameConfig';

export class PhysicsWorld {
  private static isInitialized = false;
  private world: RAPIER.World | null = null;
  private isReady = false;

  public static async initialize(): Promise<void> {
    if (!PhysicsWorld.isInitialized) {
      await RAPIER.init();
      PhysicsWorld.isInitialized = true;
    }
  }

  public init(): void {
    if (!PhysicsWorld.isInitialized) {
      throw new Error('Call await PhysicsWorld.initialize() before creating a PhysicsWorld instance.');
    }

    const { x, y, z } = GameConfig.PHYSICS.GRAVITY;
    this.world = new RAPIER.World(new RAPIER.Vector3(x, y, z));
    this.isReady = true;
  }

  public step(): void {
    if (this.world && this.isReady) {
      this.world.step();
    }
  }

  public getRawWorld(): RAPIER.World | null {
    return this.world;
  }

  public get ready(): boolean {
    return this.isReady;
  }

  /**
   * Helper to create a static floor / ground collider
   */
  public createStaticBox(
    posX: number,
    posY: number,
    posZ: number,
    halfExtentsX: number,
    halfExtentsY: number,
    halfExtentsZ: number
  ): { body: RAPIER.RigidBody; collider: RAPIER.Collider } | null {
    if (!this.world) return null;

    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(posX, posY, posZ);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfExtentsX, halfExtentsY, halfExtentsZ);
    const collider = this.world.createCollider(colliderDesc, body);

    return { body, collider };
  }

  /**
   * Helper to create a dynamic physics sphere / body
   */
  public createDynamicSphere(
    posX: number,
    posY: number,
    posZ: number,
    radius: number,
    restitution: number = 0.6
  ): { body: RAPIER.RigidBody; collider: RAPIER.Collider } | null {
    if (!this.world) return null;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(posX, posY, posZ)
      .setLinearDamping(0.1)
      .setAngularDamping(0.1);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.ball(radius)
      .setRestitution(restitution)
      .setFriction(0.4);
    const collider = this.world.createCollider(colliderDesc, body);

    return { body, collider };
  }

  /**
   * Helper to create a dynamic physics box
   */
  public createDynamicBox(
    posX: number,
    posY: number,
    posZ: number,
    halfX: number,
    halfY: number,
    halfZ: number,
    restitution: number = 0.3
  ): { body: RAPIER.RigidBody; collider: RAPIER.Collider } | null {
    if (!this.world) return null;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(posX, posY, posZ)
      .setLinearDamping(0.2)
      .setAngularDamping(0.2);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfX, halfY, halfZ)
      .setRestitution(restitution)
      .setFriction(0.6);
    const collider = this.world.createCollider(colliderDesc, body);

    return { body, collider };
  }

  public dispose(): void {
    if (this.world) {
      this.world.free();
      this.world = null;
      this.isReady = false;
    }
  }
}
