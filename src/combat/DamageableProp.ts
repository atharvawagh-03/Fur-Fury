/**
 * Damageable Entity Component for Tournament Props & Training Dummies
 * Implements IDamageable for combat validation against PRD Section 8 & 9.
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { IDamageable, DamageResult } from './CombatTypes';

export class DamageableDummy implements IDamageable {
  public mesh: THREE.Group;
  private torsoMesh: THREE.Mesh | null = null;
  private name: string;
  private maxHealth: number = 120;
  private currentHealth: number = 120;
  private maxPoise: number = 45;
  private currentPoise: number = 45;
  private isStaggered: boolean = false;
  private staggerTimer: number = 0;

  // Spring wobble physics
  private wobbleAngle: number = 0;
  private wobbleVelocity: number = 0;
  private readonly wobbleStiffness = 32.0;
  private readonly wobbleDamping = 6.5;

  constructor(mesh: THREE.Group, name: string = 'Tournament Pell (Dummy)') {
    this.mesh = mesh;
    this.name = name;

    // Locate torso mesh for impact flashing and spring wobble
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
        if (child.position.y > 1.0) {
          this.torsoMesh = child;
        }
      }
    });
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  public getHitboxRadius(): number {
    return 0.75;
  }

  public isAlive(): boolean {
    return true; // Resilient practice dummy
  }

  public takeDamage(
    amount: number,
    poiseDamage: number,
    _hitPoint: THREE.Vector3,
    hitNormal: THREE.Vector3,
    isHeavy: boolean,
    isCritical: boolean = false
  ): DamageResult {
    this.currentHealth -= amount;
    this.currentPoise -= poiseDamage;

    // Apply wobble impulse
    const impulse = (isCritical ? 0.7 : isHeavy ? 0.5 : 0.3) * (hitNormal.z > 0 ? 1 : -1);
    this.wobbleVelocity += impulse;

    let poiseBroken = false;
    if (this.currentPoise <= 0 && !this.isStaggered) {
      this.isStaggered = true;
      this.staggerTimer = 1.2;
      this.wobbleVelocity += 1.2;
      poiseBroken = true;
    }

    if (this.currentHealth <= 0) {
      // Resilient training dummy restores health after taking a full beat
      this.currentHealth = this.maxHealth;
      this.currentPoise = this.maxPoise;
    }

    // Material flash effect
    if (this.torsoMesh && this.torsoMesh.material instanceof THREE.MeshStandardMaterial) {
      const origColor = this.torsoMesh.material.color.getHex();
      this.torsoMesh.material.color.setHex(isCritical ? 0xffea00 : isHeavy ? 0xff4422 : 0xddbb99);
      setTimeout(() => {
        if (this.torsoMesh && this.torsoMesh.material instanceof THREE.MeshStandardMaterial) {
          this.torsoMesh.material.color.setHex(origColor);
        }
      }, 90);
    }

    return {
      hit: true,
      damageDealt: amount,
      poiseBroken,
      isCritical,
      currentHealth: this.currentHealth,
      maxHealth: this.maxHealth,
      targetName: this.name,
    };
  }

  public update(deltaTime: number): void {
    // 1. Spring-damper physics for realistic hit wobble
    const springForce = -this.wobbleStiffness * this.wobbleAngle;
    const dampingForce = -this.wobbleDamping * this.wobbleVelocity;
    const acceleration = springForce + dampingForce;

    this.wobbleVelocity += acceleration * deltaTime;
    this.wobbleAngle += this.wobbleVelocity * deltaTime;

    this.mesh.rotation.x = this.wobbleAngle;

    // 2. Poise recovery
    if (this.isStaggered) {
      this.staggerTimer -= deltaTime;
      this.mesh.rotation.y += deltaTime * 6.0; // Spin while staggered
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.currentPoise = this.maxPoise;
        this.mesh.rotation.y = 0;
      }
    } else if (this.currentPoise < this.maxPoise) {
      this.currentPoise = Math.min(this.maxPoise, this.currentPoise + deltaTime * 15);
    }
  }
}

export class DamageableCrate implements IDamageable {
  public mesh: THREE.Group;
  private body?: RAPIER.RigidBody;
  private name: string;
  private health: number = 50;

  constructor(mesh: THREE.Group, body?: RAPIER.RigidBody, name: string = 'Tournament Supply Crate') {
    this.mesh = mesh;
    this.body = body;
    this.name = name;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  public getHitboxRadius(): number {
    return 0.65;
  }

  public isAlive(): boolean {
    return this.health > 0;
  }

  public takeDamage(
    amount: number,
    _poiseDamage: number,
    _hitPoint: THREE.Vector3,
    hitNormal: THREE.Vector3,
    isHeavy: boolean,
    isCritical: boolean = false
  ): DamageResult {
    this.health -= amount;

    // Apply physical impulse via Rapier 3D
    if (this.body) {
      const forceMag = (isCritical ? 14 : isHeavy ? 10 : 6);
      const impulse = {
        x: -hitNormal.x * forceMag,
        y: Math.abs(hitNormal.y) * forceMag * 0.5 + 2.0,
        z: -hitNormal.z * forceMag,
      };
      this.body.applyImpulse(impulse, true);
      this.body.applyTorqueImpulse({ x: (Math.random() - 0.5) * 3, y: 2, z: (Math.random() - 0.5) * 3 }, true);
    }

    return {
      hit: true,
      damageDealt: amount,
      poiseBroken: false,
      isCritical,
      currentHealth: Math.max(0, this.health),
      maxHealth: 50,
      targetName: this.name,
    };
  }
}
