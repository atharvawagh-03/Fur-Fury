/**
 * Lady Anuki Procedural & Skeletal Animation Controller
 * Drives the articulated 3D rig with fluid, state-blended procedural animation:
 * - Idle breathing, ear twitches, tail swishing, and cape cloth drift
 * - Walk / Run / Sprint locomotion cycles with quadruped-derived biped mechanics
 * - Jump anticipation, airborne suspension, and landing squash-and-stretch
 * - Dodge roll evasive tumble and recovery
 * - Combat poses: Light / Heavy sword attacks, Parry deflection, and Guard stance
 */

import * as THREE from 'three';
import { AnukiRig } from './AnukiModel';

export type LocomotionState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'SPRINT'
  | 'JUMP'
  | 'FALL'
  | 'DODGE'
  | 'ATTACK_LIGHT'
  | 'ATTACK_LIGHT_1'
  | 'ATTACK_LIGHT_2'
  | 'ATTACK_LIGHT_3'
  | 'ATTACK_HEAVY'
  | 'PARRY'
  | 'GUARD'
  | 'HEAL';

export class AnukiAnimator {
  private rig: AnukiRig;
  private currentState: LocomotionState = 'IDLE';
  private targetState: LocomotionState = 'IDLE';
  private stateTime: number = 0;
  private blendFactor: number = 1.0;
  private blendDuration: number = 0.15; // Fast responsive state blending

  // Ear twitch timer
  private earTwitchTimer: number = 2.5;
  private isTwitching: boolean = false;
  private twitchProgress: number = 0;

  // Jump & Landing
  private isGrounded: boolean = true;
  private verticalVelocity: number = 0;
  private landSquashTimer: number = 0;

  // Dodge Roll
  private dodgeProgress: number = 0;
  private dodgeDuration: number = 0.45; // 450ms responsive combat dodge

  // Attack Animation (Combo 1, 2, 3 & Heavy Breaker)
  private attackProgress: number = 0;
  private attackDuration: number = 0.35;
  private attackType: 'LIGHT_1' | 'LIGHT_2' | 'LIGHT_3' | 'HEAVY' = 'LIGHT_1';

  // Healing animation
  private healProgress: number = 0;
  private healDuration: number = 0.85;

  // Cape cloth original vertices
  private capePosAttr: THREE.BufferAttribute;
  private capeOrigZ: Float32Array;

  constructor(rig: AnukiRig) {
    this.rig = rig;

    // Cache initial cape mesh vertex positions for dynamic procedural cloth wave
    const geo = this.rig.capeMesh.geometry as THREE.PlaneGeometry;
    this.capePosAttr = geo.attributes.position as THREE.BufferAttribute;
    this.capeOrigZ = new Float32Array(this.capePosAttr.count);
    for (let i = 0; i < this.capePosAttr.count; i++) {
      this.capeOrigZ[i] = this.capePosAttr.getZ(i);
    }
  }

  public setState(state: LocomotionState): void {
    if (this.targetState !== state) {
      this.targetState = state;
      this.blendFactor = 0;
      this.stateTime = 0;

      if (state === 'DODGE') {
        this.dodgeProgress = 0;
      } else if (
        state === 'ATTACK_LIGHT' ||
        state === 'ATTACK_LIGHT_1' ||
        state === 'ATTACK_LIGHT_2' ||
        state === 'ATTACK_LIGHT_3' ||
        state === 'ATTACK_HEAVY'
      ) {
        this.attackProgress = 0;
        if (state === 'ATTACK_LIGHT_2') {
          this.attackType = 'LIGHT_2';
          this.attackDuration = 0.38;
        } else if (state === 'ATTACK_LIGHT_3') {
          this.attackType = 'LIGHT_3';
          this.attackDuration = 0.52;
        } else if (state === 'ATTACK_HEAVY') {
          this.attackType = 'HEAVY';
          this.attackDuration = 0.58;
        } else {
          this.attackType = 'LIGHT_1';
          this.attackDuration = 0.35;
        }
      } else if (state === 'HEAL') {
        this.healProgress = 0;
        this.healDuration = 0.85;
      }
    }
  }

  public getState(): LocomotionState {
    return this.targetState;
  }

  public getCurrentBlendedState(): LocomotionState {
    return this.currentState;
  }

  public setGrounded(grounded: boolean, verticalVel: number): void {
    if (!this.isGrounded && grounded) {
      // Just landed! Trigger squash-and-stretch
      this.landSquashTimer = 0.2;
    }
    this.isGrounded = grounded;
    this.verticalVelocity = verticalVel;
  }

  public update(deltaTime: number, speed: number): void {
    this.stateTime += deltaTime;

    // State blend interpolation
    if (this.blendFactor < 1.0) {
      this.blendFactor = Math.min(1.0, this.blendFactor + deltaTime / this.blendDuration);
      if (this.blendFactor >= 1.0) {
        this.currentState = this.targetState;
      }
    }

    // Ear twitch procedural routine
    this.updateEarTwitches(deltaTime);

    // Apply animation based on state
    switch (this.targetState) {
      case 'IDLE':
        this.animateIdle(deltaTime);
        break;
      case 'WALK':
        this.animateWalk(deltaTime, speed);
        break;
      case 'RUN':
        this.animateRun(deltaTime, speed);
        break;
      case 'SPRINT':
        this.animateSprint(deltaTime, speed);
        break;
      case 'JUMP':
      case 'FALL':
        this.animateJumpFall(deltaTime);
        break;
      case 'DODGE':
        this.animateDodge(deltaTime);
        break;
      case 'ATTACK_LIGHT':
      case 'ATTACK_LIGHT_1':
      case 'ATTACK_LIGHT_2':
      case 'ATTACK_LIGHT_3':
      case 'ATTACK_HEAVY':
        this.animateAttack(deltaTime);
        break;
      case 'PARRY':
        this.animateParry(deltaTime);
        break;
      case 'GUARD':
        this.animateGuard(deltaTime);
        break;
      case 'HEAL':
        this.animateHeal(deltaTime);
        break;
    }

    // Landing squash & stretch recovery
    if (this.landSquashTimer > 0) {
      this.landSquashTimer -= deltaTime;
      const squashRatio = Math.sin((this.landSquashTimer / 0.2) * Math.PI);
      this.rig.hips.position.y = 0.44 - squashRatio * 0.08;
      this.rig.hips.scale.set(1.0 + squashRatio * 0.12, 1.0 - squashRatio * 0.14, 1.0 + squashRatio * 0.12);
    } else if (this.targetState !== 'DODGE') {
      this.rig.hips.position.y = 0.44;
      this.rig.hips.scale.set(1.0, 1.0, 1.0);
    }

    // Dynamic procedural cape cloth wave
    this.updateCapePhysics(deltaTime, speed);
  }

  /**
   * Procedural Idle Animation
   */
  private animateIdle(_deltaTime: number): void {
    const t = this.stateTime;

    // 1. Rhythmic breathing oscillation
    const breath = Math.sin(t * 2.2);
    this.rig.chest.scale.set(1.0 + breath * 0.02, 1.0 + breath * 0.025, 1.0 + breath * 0.035);
    this.rig.chest.position.y = 0.12 + breath * 0.005;

    // 2. Subtle head weight shifting and curiosity tilt
    this.rig.head.rotation.z = Math.sin(t * 1.1) * 0.04;
    this.rig.head.rotation.y = Math.sin(t * 0.6) * 0.06;
    this.rig.head.rotation.x = Math.sin(t * 1.8) * 0.03;

    // 3. Gentle resting paws
    this.rig.leftShoulder.rotation.set(0.05, 0, 0);
    this.rig.rightShoulder.rotation.set(0.05, 0, 0);
    this.rig.leftArm.rotation.set(-0.1, 0, 0.1);
    this.rig.rightArm.rotation.set(-0.1, 0, -0.1);
    this.rig.leftForearm.rotation.set(0.2, 0, 0);
    this.rig.rightForearm.rotation.set(0.2, 0, 0);

    // Sword resting upright in ready grip
    this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.1, 0, 0);

    // 4. Stable legs
    this.rig.leftThigh.rotation.set(0, 0, 0);
    this.rig.rightThigh.rotation.set(0, 0, 0);
    this.rig.leftCalf.rotation.set(0, 0, 0);
    this.rig.rightCalf.rotation.set(0, 0, 0);

    // 5. Gentle, graceful tail swishing
    const tailWave = Math.sin(t * 2.4);
    for (let i = 0; i < this.rig.tailSegments.length; i++) {
      const seg = this.rig.tailSegments[i];
      seg.rotation.y = tailWave * (0.12 + i * 0.08);
      seg.rotation.x = -0.5 + Math.sin(t * 2.4 + i * 0.5) * 0.06;
    }
  }

  /**
   * Procedural Walk Locomotion Cycle
   */
  private animateWalk(_deltaTime: number, speed: number): void {
    const cycleSpeed = Math.max(2.5, speed * 2.0);
    const t = this.stateTime * cycleSpeed;

    // Hip bob and lateral weight shift
    this.rig.hips.position.y = 0.44 + Math.abs(Math.sin(t)) * 0.03;
    this.rig.hips.rotation.y = Math.sin(t) * 0.08;
    this.rig.hips.rotation.z = Math.cos(t) * 0.04;

    // Alternating leg strides
    const leftLegSwing = Math.sin(t);
    const rightLegSwing = -leftLegSwing;

    this.rig.leftThigh.rotation.x = leftLegSwing * 0.55;
    this.rig.leftCalf.rotation.x = Math.max(0, -leftLegSwing * 0.45);

    this.rig.rightThigh.rotation.x = rightLegSwing * 0.55;
    this.rig.rightCalf.rotation.x = Math.max(0, -rightLegSwing * 0.45);

    // Arm counter-swing
    this.rig.leftArm.rotation.x = rightLegSwing * 0.4;
    this.rig.rightArm.rotation.x = leftLegSwing * 0.35;
    this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.2, 0, 0);

    // Dynamic tail balance counter-sway
    for (let i = 0; i < this.rig.tailSegments.length; i++) {
      const seg = this.rig.tailSegments[i];
      seg.rotation.y = -Math.sin(t + i * 0.4) * 0.22;
      seg.rotation.x = -0.45 + Math.cos(t * 2) * 0.08;
    }

    // Head subtle bob
    this.rig.head.rotation.x = Math.sin(t * 2) * 0.04;
    this.rig.head.rotation.y = -Math.sin(t) * 0.05;
  }

  /**
   * Procedural Run Locomotion Cycle
   */
  private animateRun(_deltaTime: number, speed: number): void {
    const cycleSpeed = Math.max(4.0, speed * 1.8);
    const t = this.stateTime * cycleSpeed;

    // Forward spine pitch
    this.rig.spine.rotation.x = 0.22;
    this.rig.head.rotation.x = -0.15; // Keep eyes forward

    // Energetic vertical bounce
    this.rig.hips.position.y = 0.44 + Math.abs(Math.sin(t)) * 0.05;
    this.rig.hips.rotation.y = Math.sin(t) * 0.12;

    // Striding legs
    const swing = Math.sin(t);
    this.rig.leftThigh.rotation.x = swing * 0.85;
    this.rig.leftCalf.rotation.x = Math.max(0, -swing * 0.7);

    this.rig.rightThigh.rotation.x = -swing * 0.85;
    this.rig.rightCalf.rotation.x = Math.max(0, swing * 0.7);

    // Arms pumping
    this.rig.leftArm.rotation.x = -swing * 0.65;
    this.rig.rightArm.rotation.x = swing * 0.5;

    // Tail lifted high and trailing for aerodynamic balance
    for (let i = 0; i < this.rig.tailSegments.length; i++) {
      const seg = this.rig.tailSegments[i];
      seg.rotation.x = -0.25 + Math.sin(t * 2) * 0.1;
      seg.rotation.y = -Math.sin(t + i * 0.5) * 0.18;
    }
  }

  /**
   * Agile Sprint Cycle
   */
  private animateSprint(_deltaTime: number, speed: number): void {
    const cycleSpeed = Math.max(5.5, speed * 1.6);
    const t = this.stateTime * cycleSpeed;

    // Deep forward charge stance
    this.rig.spine.rotation.x = 0.35;
    this.rig.head.rotation.x = -0.26; // Head lifted, determined look
    this.rig.hips.position.y = 0.40 + Math.abs(Math.sin(t)) * 0.06;

    // Powerful bounding strides
    const stride = Math.sin(t);
    this.rig.leftThigh.rotation.x = stride * 1.15;
    this.rig.leftCalf.rotation.x = Math.max(0, -stride * 0.95);

    this.rig.rightThigh.rotation.x = -stride * 1.15;
    this.rig.rightCalf.rotation.x = Math.max(0, stride * 0.95);

    // Arms sprinting
    this.rig.leftArm.rotation.x = -stride * 0.85;
    this.rig.rightArm.rotation.x = stride * 0.65;
    this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.35, 0, -0.2);

    // Tail streaming straight back
    for (let i = 0; i < this.rig.tailSegments.length; i++) {
      const seg = this.rig.tailSegments[i];
      seg.rotation.x = -0.15;
      seg.rotation.y = -Math.sin(t + i * 0.6) * 0.15;
    }
  }

  /**
   * Jump & Fall Airborne Animation
   */
  private animateJumpFall(_deltaTime: number): void {
    if (this.verticalVelocity > 0.5) {
      // Ascending Jump pose: paws tucked slightly, cape trailing downward
      this.rig.spine.rotation.x = -0.15;
      this.rig.hips.position.y = 0.44;

      this.rig.leftThigh.rotation.x = -0.35;
      this.rig.leftCalf.rotation.x = 0.7;
      this.rig.rightThigh.rotation.x = -0.4;
      this.rig.rightCalf.rotation.x = 0.75;

      this.rig.leftArm.rotation.x = -0.5;
      this.rig.rightArm.rotation.x = -0.3;

      // Ears flattened back by wind
      this.rig.leftEar.rotation.x = -0.35;
      this.rig.rightEar.rotation.x = -0.35;
    } else {
      // Descending Fall pose: extended paws preparing for touchdown
      this.rig.spine.rotation.x = 0.1;
      this.rig.leftThigh.rotation.x = 0.25;
      this.rig.rightThigh.rotation.x = 0.25;
      this.rig.leftCalf.rotation.x = 0.2;
      this.rig.rightCalf.rotation.x = 0.2;

      this.rig.leftArm.rotation.x = 0.4;
      this.rig.rightArm.rotation.x = 0.3;

      // Tail angled up for stability
      for (const seg of this.rig.tailSegments) {
        seg.rotation.x = -0.7;
      }
    }
  }

  /**
   * Dodge Roll Evasive Tumble
   */
  private animateDodge(deltaTime: number): void {
    this.dodgeProgress += deltaTime / this.dodgeDuration;
    const p = Math.min(1.0, this.dodgeProgress);

    // 360-degree forward tumble rotation around root center
    this.rig.root.rotation.x = p * Math.PI * 2;

    // Tuck limbs into tight ball during mid-roll (0.2 to 0.7)
    if (p < 0.7) {
      this.rig.hips.position.y = 0.28;
      this.rig.spine.rotation.x = 0.5;
      this.rig.head.rotation.x = 0.4;

      this.rig.leftThigh.rotation.x = 1.0;
      this.rig.leftCalf.rotation.x = 1.2;
      this.rig.rightThigh.rotation.x = 1.0;
      this.rig.rightCalf.rotation.x = 1.2;

      this.rig.leftArm.rotation.x = 0.8;
      this.rig.rightArm.rotation.x = 0.8;
    } else {
      // Unroll and recover into ready crouch
      const recover = (p - 0.7) / 0.3;
      this.rig.hips.position.y = 0.28 + recover * 0.16;
      this.rig.spine.rotation.x = 0.5 * (1 - recover);
      this.rig.head.rotation.x = 0.4 * (1 - recover);
      this.rig.leftThigh.rotation.x = 1.0 * (1 - recover);
      this.rig.rightThigh.rotation.x = 1.0 * (1 - recover);
    }

    if (p >= 1.0) {
      this.rig.root.rotation.x = 0;
      this.setState('IDLE');
    }
  }

  /**
   * Sword Attack Animation (Light 1, Light 2, Light 3 Finisher & Heavy Breaker)
   */
  private animateAttack(deltaTime: number): void {
    this.attackProgress += deltaTime / this.attackDuration;
    const p = Math.min(1.0, this.attackProgress);

    switch (this.attackType) {
      case 'LIGHT_1': {
        // Strike 1: Horizontal cross-slash (right to left)
        if (p < 0.25) {
          const w = p / 0.25;
          this.rig.rightShoulder.rotation.set(-0.2 * w, -0.6 * w, 0.4 * w);
          this.rig.rightArm.rotation.set(-0.4 * w, 0.3 * w, 0.2 * w);
          this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.3, -0.5 * w, 0.3 * w);
          this.rig.spine.rotation.y = -0.3 * w;
        } else if (p < 0.65) {
          const s = (p - 0.25) / 0.4;
          this.rig.rightShoulder.rotation.set(0.3, 0.8 * s - 0.6, -0.2);
          this.rig.rightArm.rotation.set(0.2, -0.5 * s + 0.3, -0.4);
          this.rig.swordMesh.rotation.set(Math.PI / 2 - 0.2, 1.2 * s - 0.5, -0.6 * s);
          this.rig.spine.rotation.y = -0.3 + 0.7 * s;
        } else {
          const r = (p - 0.65) / 0.35;
          this.rig.rightShoulder.rotation.set(0.3 * (1 - r), 0.2 * (1 - r), 0);
          this.rig.spine.rotation.y = 0.4 * (1 - r);
        }
        break;
      }
      case 'LIGHT_2': {
        // Strike 2: Backhand rising diagonal sweep (left to right)
        if (p < 0.25) {
          const w = p / 0.25;
          this.rig.rightShoulder.rotation.set(0.3 * w, 0.5 * w, -0.2 * w);
          this.rig.rightArm.rotation.set(-0.2 * w, -0.6 * w, 0.2 * w);
          this.rig.swordMesh.rotation.set(Math.PI / 2 - 0.3, 0.4 * w, -0.3 * w);
          this.rig.spine.rotation.y = 0.35 * w;
        } else if (p < 0.65) {
          const s = (p - 0.25) / 0.4;
          this.rig.rightShoulder.rotation.set(0.3 - 0.5 * s, 0.5 - 1.0 * s, 0.3 * s);
          this.rig.rightArm.rotation.set(-0.2 + 0.6 * s, -0.6 + 1.1 * s, -0.4 * s);
          this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.2, -1.1 * s + 0.4, 0.7 * s);
          this.rig.spine.rotation.y = 0.35 - 0.75 * s;
        } else {
          const r = (p - 0.65) / 0.35;
          this.rig.rightShoulder.rotation.set(-0.2 * (1 - r), -0.5 * (1 - r), 0);
          this.rig.spine.rotation.y = -0.4 * (1 - r);
        }
        break;
      }
      case 'LIGHT_3': {
        // Strike 3: Upward rising spinning leap slash (360 spin + vertical hang)
        const spin = p * Math.PI * 2;
        this.rig.root.rotation.y = spin;
        if (p < 0.3) {
          const w = p / 0.3;
          this.rig.hips.position.y = 0.44 - 0.08 * w; // Crouch
          this.rig.rightArm.rotation.set(-0.8 * w, 0.4 * w, 0.4 * w);
          this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.4, 0, 0.2);
        } else if (p < 0.7) {
          const s = (p - 0.3) / 0.4;
          this.rig.hips.position.y = 0.36 + Math.sin(s * Math.PI) * 0.35; // Aerial leap!
          this.rig.rightArm.rotation.set(-1.2 + 2.0 * s, -0.4 * s, -0.5 * s);
          this.rig.swordMesh.rotation.set(Math.PI / 2 - 0.4, 1.4 * s, -0.8 * s);
          this.rig.leftArm.rotation.set(0.5, 0, -0.5);
        } else {
          const r = (p - 0.7) / 0.3;
          this.rig.hips.position.y = 0.44 - (1 - r) * 0.06; // Touchdown
          this.rig.rightArm.rotation.set(0.8 * (1 - r), 0, 0);
        }
        break;
      }
      case 'HEAVY': {
        // Heavy Breaker: Two-handed overhead downward cleave
        if (p < 0.3) {
          const w = p / 0.3;
          this.rig.rightArm.rotation.set(-1.5 * w, 0, 0.3);
          this.rig.leftArm.rotation.set(-0.9 * w, 0, -0.3);
          this.rig.spine.rotation.x = -0.28 * w;
          this.rig.hips.position.y = 0.44 + 0.06 * w;
        } else if (p < 0.7) {
          const s = (p - 0.3) / 0.4;
          this.rig.rightArm.rotation.set(-1.5 + 2.4 * s, 0, 0);
          this.rig.leftArm.rotation.set(-0.9 + 1.4 * s, 0, 0);
          this.rig.spine.rotation.x = -0.28 + 0.65 * s;
          this.rig.hips.position.y = 0.50 - 0.15 * s; // Deep impact crouch
        } else {
          const r = (p - 0.7) / 0.3;
          this.rig.rightArm.rotation.set(0.9 * (1 - r), 0, 0);
          this.rig.spine.rotation.x = 0.37 * (1 - r);
          this.rig.hips.position.y = 0.35 + 0.09 * r;
        }
        break;
      }
    }

    if (p >= 1.0) {
      this.rig.root.rotation.y = 0;
      this.setState('IDLE');
    }
  }

  /**
   * Healing Consumable Animation
   */
  private animateHeal(deltaTime: number): void {
    this.healProgress += deltaTime / this.healDuration;
    const p = Math.min(1.0, this.healProgress);

    // Left paw brings restorative draught to snout; head tilts back
    if (p < 0.35) {
      const w = p / 0.35;
      this.rig.leftArm.rotation.set(-1.2 * w, 0.4 * w, 0.5 * w);
      this.rig.leftForearm.rotation.set(1.4 * w, 0, 0);
      this.rig.head.rotation.x = -0.3 * w;
      this.rig.rightArm.rotation.set(0.2, 0, 0);
    } else if (p < 0.75) {
      // Sip with head back
      this.rig.leftArm.rotation.set(-1.2, 0.4, 0.5);
      this.rig.leftForearm.rotation.set(1.4, 0, 0);
      this.rig.head.rotation.x = -0.35 + Math.sin(p * 20) * 0.04;
    } else {
      // Lower paw and return to ready stance
      const r = (p - 0.75) / 0.25;
      this.rig.leftArm.rotation.set(-1.2 * (1 - r), 0.4 * (1 - r), 0.5 * (1 - r));
      this.rig.leftForearm.rotation.set(1.4 * (1 - r), 0, 0);
      this.rig.head.rotation.x = -0.35 * (1 - r);
    }

    if (p >= 1.0) {
      this.setState('IDLE');
    }
  }

  /**
   * Parry Deflection Stance
   */
  private animateParry(_deltaTime: number): void {
    // Crisp diagonal blade deflection across chest
    this.rig.rightArm.rotation.set(-0.5, 0.3, 0.4);
    this.rig.rightForearm.rotation.set(0.8, -0.4, 0);
    this.rig.swordMesh.rotation.set(Math.PI / 4, 0.4, 0.3);

    this.rig.leftArm.rotation.set(-0.4, -0.2, -0.3);
    this.rig.spine.rotation.y = 0.15;
    this.rig.head.rotation.y = -0.15; // Focused duel stare
  }

  /**
   * Guard Defense Stance
   */
  private animateGuard(_deltaTime: number): void {
    // Braced shield/blade guard posture
    this.rig.hips.position.y = 0.40; // Low defensive center of gravity
    this.rig.spine.rotation.x = 0.12;

    this.rig.leftArm.rotation.set(-0.35, 0.2, 0.3);
    this.rig.leftForearm.rotation.set(0.5, 0, 0);

    this.rig.rightArm.rotation.set(-0.4, -0.1, -0.2);
    this.rig.rightForearm.rotation.set(0.7, 0, 0);
    this.rig.swordMesh.rotation.set(Math.PI / 2 + 0.4, 0, 0.1);

    this.rig.leftThigh.rotation.set(0.15, 0.1, 0);
    this.rig.rightThigh.rotation.set(-0.15, -0.1, 0);
  }

  /**
   * Procedural Ear Twitching
   */
  private updateEarTwitches(deltaTime: number): void {
    if (!this.isTwitching) {
      this.earTwitchTimer -= deltaTime;
      if (this.earTwitchTimer <= 0) {
        this.isTwitching = true;
        this.twitchProgress = 0;
        this.earTwitchTimer = 2.0 + Math.random() * 3.5;
      }
    } else {
      this.twitchProgress += deltaTime / 0.18; // Quick 180ms feline twitch
      const p = Math.min(1.0, this.twitchProgress);
      const twitchAngle = Math.sin(p * Math.PI * 4) * 0.18;

      // Twitch left ear (the one with the pink bow!)
      this.rig.leftEar.rotation.z = -0.28 + twitchAngle;
      this.rig.bow.rotation.z = -0.2 + twitchAngle * 0.6;

      if (p >= 1.0) {
        this.isTwitching = false;
        this.rig.leftEar.rotation.z = -0.28;
        this.rig.bow.rotation.z = -0.2;
      }
    }
  }

  /**
   * Procedural Cape Cloth Physics
   */
  private updateCapePhysics(_deltaTime: number, speed: number): void {
    const time = this.stateTime;
    const isMoving = speed > 0.1;
    const windSpeed = isMoving ? 4.0 + speed * 1.5 : 2.0;
    const waveAmplitude = isMoving ? 0.08 + speed * 0.025 : 0.035;

    // 1. Cape Bone chain rotation (trails backward when running)
    const trailPitch = Math.min(0.85, speed * 0.12);
    for (let b = 0; b < this.rig.capeBones.length; b++) {
      const bone = this.rig.capeBones[b];
      bone.rotation.x = trailPitch + Math.sin(time * windSpeed + b * 0.6) * 0.08;
    }

    // 2. Vertex-level cloth ripple across cape mesh
    const count = this.capePosAttr.count;
    for (let i = 0; i < count; i++) {
      const origZ = this.capeOrigZ[i];
      const y = this.capePosAttr.getY(i);
      const x = this.capePosAttr.getX(i);

      // Bottom hem flaps more than top pinned shoulders
      const heightFactor = Math.max(0, 0.32 - y) / 0.64;
      const ripple = Math.sin(time * windSpeed + y * 6 + x * 4) * waveAmplitude * heightFactor;

      this.capePosAttr.setZ(i, origZ - trailPitch * 0.25 * heightFactor + ripple);
    }
    this.capePosAttr.needsUpdate = true;
  }
}
