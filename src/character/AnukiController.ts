/**
 * Lady Anuki Kinematic Character Controller
 * Manages player input, Rapier 3D kinematic physics, stamina, locomotion state machine,
 * audio triggers, visual particle feedback, and combat stances conforming to PRD FR-02.
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AnukiModel } from './AnukiModel';
import { AnukiAnimator, LocomotionState } from './AnukiAnimator';
import { AnukiEffects } from './AnukiEffects';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { InputManager } from '../input/InputManager';
import { AudioManager } from '../audio/AudioManager';
import { EventBus } from '../core/EventBus';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  isInvulnerable: boolean;
  state: LocomotionState;
  speed: number;
}

export class AnukiController {
  private model: AnukiModel;
  private animator: AnukiAnimator;
  private effects: AnukiEffects;
  private physicsWorld: PhysicsWorld;
  private inputManager: InputManager;
  private audioManager: AudioManager;
  private eventBus = EventBus.getInstance();

  // Rapier physics components
  private body: RAPIER.RigidBody | null = null;
  private collider: RAPIER.Collider | null = null;
  private characterController: RAPIER.KinematicCharacterController | null = null;

  // Stats & Resources
  private health: number = 100;
  private maxHealth: number = 100;
  private stamina: number = 100;
  private maxStamina: number = 100;
  private staminaRegenRate: number = 28; // Stamina/sec
  private staminaSprintCost: number = 16; // Stamina/sec
  private staminaDodgeCost: number = 22; // Stamina/dodge

  // Movement parameters
  private walkSpeed: number = 3.6;   // m/s
  private sprintSpeed: number = 6.4; // m/s
  private currentSpeed: number = 0;
  private verticalVelocity: number = 0;
  private gravity: number = -18.0;
  private jumpForce: number = 6.2;
  private isGrounded: boolean = true;

  // Dodge state
  private isDodging: boolean = false;
  private dodgeTimer: number = 0;
  private dodgeDuration: number = 0.45;
  private dodgeDirection: THREE.Vector3 = new THREE.Vector3();
  private dodgeSpeed: number = 8.8;

  // Attack / Action state
  private isAttacking: boolean = false;
  private attackTimer: number = 0;
  private attackDuration: number = 0.4;

  // Footstep audio pacing
  private footstepTimer: number = 0;

  // Transform helpers
  private movementVector: THREE.Vector3 = new THREE.Vector3();
  private targetRotationY: number = Math.PI; // Face North Gate (-Z) by default
  private currentRotationY: number = Math.PI;

  constructor(
    scene: THREE.Scene,
    physicsWorld: PhysicsWorld,
    inputManager: InputManager,
    audioManager: AudioManager,
    spawnX: number = 0,
    spawnY: number = 0.5,
    spawnZ: number = 0
  ) {
    this.physicsWorld = physicsWorld;
    this.inputManager = inputManager;
    this.audioManager = audioManager;

    // 1. Build 3D Articulated Model
    this.model = new AnukiModel();
    scene.add(this.model.getRoot());

    // 2. Setup Procedural Animator & Effects
    this.animator = new AnukiAnimator(this.model.getRig());
    this.effects = new AnukiEffects(scene);

    // 3. Initialize Rapier 3D Kinematic Controller & Capsule
    this.initPhysics(spawnX, spawnY, spawnZ);
  }

  private initPhysics(x: number, y: number, z: number): void {
    if (!this.physicsWorld.ready) return;

    // Capsule dimensions: radius 0.26m, halfHeight 0.28m (total height ~0.82m)
    const capsule = this.physicsWorld.createKinematicCapsule(x, y + 0.4, z, 0.26, 0.28);
    if (capsule) {
      this.body = capsule.body;
      this.collider = capsule.collider;
    }

    this.characterController = this.physicsWorld.createCharacterController(0.03);
    if (this.characterController) {
      this.characterController.enableAutostep(0.3, 0.2, true);
      this.characterController.enableSnapToGround(0.25);
    }

    this.model.getRoot().position.set(x, y, z);
  }

  public getModel(): AnukiModel {
    return this.model;
  }

  public getPosition(): THREE.Vector3 {
    return this.model.getRoot().position;
  }

  public teleport(x: number, y: number, z: number): void {
    this.model.getRoot().position.set(x, y, z);
    if (this.body) {
      this.body.setTranslation({ x, y: y + 0.4, z }, true);
      this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    this.currentSpeed = 0;
    this.verticalVelocity = 0;
    this.movementVector.set(0, 0, 0);
  }

  public setFacing(yaw: number): void {
    this.targetRotationY = yaw;
    this.currentRotationY = yaw;
    this.model.getRoot().rotation.y = yaw;
  }

  public getStats(): PlayerStats {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      isInvulnerable: this.isDodging && this.dodgeTimer < 0.35,
      state: this.animator.getState(),
      speed: this.currentSpeed,
    };
  }

  public jump(): void {
    if (this.isGrounded && !this.isDodging) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
      this.animator.setState('JUMP');
      this.audioManager.playJumpSound();
      this.effects.emitBurst(this.model.getRoot().position, 8);
    }
  }

  /**
   * Updates player logic, input parsing, animations, and stats
   */
  public update(deltaTime: number, cameraYaw: number): void {
    // 1. Update active timers
    this.updateTimers(deltaTime);

    // 2. Handle stamina regeneration
    this.updateStamina(deltaTime);

    // 3. Process combat actions (Attack, Parry, Guard)
    this.handleCombatInputs();

    // 4. Calculate movement direction relative to camera yaw
    this.calculateMovement(deltaTime, cameraYaw);

    // 5. Update procedural animator
    this.animator.update(deltaTime, this.currentSpeed);

    // 6. Update visual effects
    this.effects.update(deltaTime);

    // 7. Dispatch real-time stats to UI
    this.eventBus.emit('PLAYER_STATS_UPDATED', this.getStats());
  }

  private updateTimers(deltaTime: number): void {
    if (this.isDodging) {
      this.dodgeTimer += deltaTime;
      if (this.dodgeTimer >= this.dodgeDuration) {
        this.isDodging = false;
        this.dodgeTimer = 0;
      }
    }

    if (this.isAttacking) {
      this.attackTimer += deltaTime;
      if (this.attackTimer >= this.attackDuration) {
        this.isAttacking = false;
        this.attackTimer = 0;
        this.animator.setState('IDLE');
      }
    }
  }

  private updateStamina(deltaTime: number): void {
    if (!this.isDodging && !this.inputManager.isActionActive('guard')) {
      const isSprinting = this.inputManager.isKeyDown('ShiftLeft') && this.movementVector.lengthSq() > 0.01;
      if (isSprinting && this.stamina > 0) {
        this.stamina = Math.max(0, this.stamina - this.staminaSprintCost * deltaTime);
      } else if (!isSprinting) {
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * deltaTime);
      }
    }
  }

  public triggerAttackLight(): void {
    if (this.isDodging) return;
    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackDuration = 0.36;
    this.animator.setState('ATTACK_LIGHT');
    this.audioManager.playSwordSwing(false);
  }

  public triggerAttackHeavy(): void {
    if (this.isDodging) return;
    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackDuration = 0.54;
    this.animator.setState('ATTACK_HEAVY');
    this.audioManager.playSwordSwing(true);
  }

  public triggerParry(): void {
    if (this.isDodging || this.isAttacking) return;
    this.animator.setState('PARRY');
    this.audioManager.playParryClang();
  }

  private handleCombatInputs(): void {
    if (this.isDodging) return;

    // Light Attack (J key)
    if (this.inputManager.isActionJustPressed('lightAttack') && !this.isAttacking) {
      this.triggerAttackLight();
      return;
    }

    // Heavy Attack (K key)
    if (this.inputManager.isActionJustPressed('heavyAttack') && !this.isAttacking) {
      this.triggerAttackHeavy();
      return;
    }

    // Parry (Q or F key)
    if (this.inputManager.isActionJustPressed('parry') && !this.isAttacking) {
      this.triggerParry();
      return;
    }

    // Guard (holding Shift or E)
    if (this.inputManager.isActionActive('guard') && !this.isAttacking) {
      this.animator.setState('GUARD');
      return;
    }
  }

  private calculateMovement(deltaTime: number, cameraYaw: number): void {
    // Don't interrupt attack animations with walking, but allow dodge cancel
    if (this.isAttacking && !this.inputManager.isActionJustPressed('dodge')) {
      this.currentSpeed = 0;
      return;
    }

    // Check Jump input (KeyC or jump trigger)
    if (this.inputManager.isKeyJustPressed('KeyC') && this.isGrounded && !this.isDodging) {
      this.jump();
      return;
    }

    // Check Dodge input (Space key)
    if (this.inputManager.isActionJustPressed('dodge') && !this.isDodging && this.stamina >= this.staminaDodgeCost) {
      this.isDodging = true;
      this.isAttacking = false;
      this.dodgeTimer = 0;
      this.stamina -= this.staminaDodgeCost;

      // Determine dodge direction
      let dx = 0;
      let dz = 0;
      if (this.inputManager.isActionActive('forward')) dz -= 1;
      if (this.inputManager.isActionActive('backward')) dz += 1;
      if (this.inputManager.isActionActive('left')) dx -= 1;
      if (this.inputManager.isActionActive('right')) dx += 1;

      if (dx === 0 && dz === 0) {
        // Dodge forward in direction hero is facing
        this.dodgeDirection.set(Math.sin(this.currentRotationY), 0, Math.cos(this.currentRotationY));
      } else {
        const inputAngle = Math.atan2(dx, dz);
        const worldAngle = cameraYaw + inputAngle;
        this.dodgeDirection.set(Math.sin(worldAngle), 0, Math.cos(worldAngle)).normalize();
        this.targetRotationY = worldAngle;
        this.currentRotationY = worldAngle;
      }

      this.animator.setState('DODGE');
      this.audioManager.playDodgeWhoosh();
      this.effects.emitBurst(this.model.getRoot().position, 14);
      return;
    }

    // If currently dodging, execute dodge velocity burst
    if (this.isDodging) {
      const p = this.dodgeTimer / this.dodgeDuration;
      const speedFactor = 1.0 - Math.pow(p, 1.8);
      this.currentSpeed = this.dodgeSpeed * speedFactor;
      this.movementVector.copy(this.dodgeDirection).multiplyScalar(this.currentSpeed * deltaTime);
      return;
    }

    // Standard locomotion inputs
    let moveX = 0;
    let moveZ = 0;

    if (this.inputManager.isActionActive('forward')) moveZ -= 1;
    if (this.inputManager.isActionActive('backward')) moveZ += 1;
    if (this.inputManager.isActionActive('left')) moveX -= 1;
    if (this.inputManager.isActionActive('right')) moveX += 1;

    const inputLength = Math.hypot(moveX, moveZ);

    if (inputLength > 0.01) {
      const isSprinting = this.inputManager.isKeyDown('ShiftLeft') && this.stamina > 2;
      const targetSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;

      // Acceleration smoothing
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, deltaTime * 12.0);

      // Rotate input by camera yaw
      const inputAngle = Math.atan2(moveX, moveZ);
      const worldMoveAngle = cameraYaw + inputAngle;

      this.targetRotationY = worldMoveAngle;

      this.movementVector.set(
        Math.sin(worldMoveAngle) * this.currentSpeed * deltaTime,
        0,
        Math.cos(worldMoveAngle) * this.currentSpeed * deltaTime
      );

      // Animation state
      if (this.isGrounded) {
        if (isSprinting) {
          this.animator.setState('SPRINT');
        } else if (this.currentSpeed > 4.2) {
          this.animator.setState('RUN');
        } else {
          this.animator.setState('WALK');
        }
      }

      // Footstep audio & dust particles
      const stepInterval = isSprinting ? 0.22 : 0.36;
      this.footstepTimer += deltaTime;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.audioManager.playFootstep(isSprinting);
        this.effects.emitFootstep(this.model.getRoot().position, isSprinting);
      }
    } else {
      // Deceleration
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, deltaTime * 14.0);
      this.movementVector.set(0, 0, 0);

      if (this.isGrounded && !this.isAttacking && this.animator.getState() !== 'GUARD' && this.animator.getState() !== 'PARRY') {
        this.animator.setState('IDLE');
      }
      this.footstepTimer = 0;
    }

    // Smooth rotation towards target facing direction
    const angleDiff = THREE.MathUtils.euclideanModulo(this.targetRotationY - this.currentRotationY + Math.PI, Math.PI * 2) - Math.PI;
    this.currentRotationY += angleDiff * Math.min(1.0, deltaTime * 16.0);
    this.model.getRoot().rotation.y = this.currentRotationY;
  }

  /**
   * Fixed physics step synchronizing with Rapier Kinematic Character Controller
   */
  public fixedUpdate(fixedDeltaTime: number): void {
    if (!this.body || !this.collider || !this.characterController) {
      // Fallback simple transform update if physics WASM is offline
      const pos = this.model.getRoot().position;
      pos.add(this.movementVector);
      return;
    }

    // Apply gravity & vertical velocity
    if (this.isGrounded) {
      this.verticalVelocity = -0.5; // slight downward stick
    } else {
      this.verticalVelocity += this.gravity * fixedDeltaTime;
    }

    const desiredTranslation = new RAPIER.Vector3(
      this.movementVector.x,
      this.verticalVelocity * fixedDeltaTime,
      this.movementVector.z
    );

    // Compute kinematic collision movement with Rapier world
    this.characterController.computeColliderMovement(this.collider, desiredTranslation);
    const correctedMovement = this.characterController.computedMovement();

    // Check grounded state
    const grounded = this.characterController.computedGrounded();
    if (grounded !== this.isGrounded) {
      this.isGrounded = grounded;
      if (grounded) {
        this.effects.emitBurst(this.model.getRoot().position, 8);
      }
    }
    this.animator.setGrounded(this.isGrounded, this.verticalVelocity);

    // Update kinematic rigid body position
    const currentTranslation = this.body.translation();
    const nextX = currentTranslation.x + correctedMovement.x;
    const nextY = currentTranslation.y + correctedMovement.y;
    const nextZ = currentTranslation.z + correctedMovement.z;

    this.body.setNextKinematicTranslation({
      x: nextX,
      y: nextY,
      z: nextZ,
    });

    // Synchronize Three.js visual mesh group
    this.model.getRoot().position.set(nextX, nextY - 0.4, nextZ);
  }

  public dispose(): void {
    this.effects.dispose();
  }
}
