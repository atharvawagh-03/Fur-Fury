/**
 * Sir Garrick Ironjaw - Boss Combat AI & Behavior Tree
 * Conforming strictly to PRD Section 6, 9, 12:
 * - 3 distinct attack families (Halberd Sweep, Ground Slam, Boot Stomp)
 * - 2 telegraphed punish windows
 * - Adaptive Phase 2 enraged transition at 50% HP
 * - Poise break stagger & parry vulnerability
 * - Non-gory honorable defeat surrender kneel
 */

import * as THREE from 'three';
import { GarrickModel } from './GarrickModel';
import { GarrickAnimator } from './GarrickAnimator';
import { BossAttackDef, BossPhase, BossStats, GarrickAIState, IGarrickBoss } from './EnemyTypes';
import { DamageResult } from '../combat/CombatTypes';
import { AudioManager } from '../audio/AudioManager';
import { CameraManager } from '../camera/CameraManager';
import { EventBus } from '../core/EventBus';

export class GarrickAI implements IGarrickBoss {
  private model: GarrickModel;
  private animator: GarrickAnimator;
  private audioManager: AudioManager;
  private cameraManager: CameraManager;
  private eventBus = EventBus.getInstance();

  // Boss Vitals & Poise
  private maxHealth: number = 350;
  private currentHealth: number = 350;
  private maxPoise: number = 100;
  private currentPoise: number = 100;
  private phase: BossPhase = 1;
  private state: GarrickAIState = 'IDLE_GUARD';

  // Combat Timers
  private stateTimer: number = 0;
  private attackCooldown: number = 1.2;
  private closeProximityTimer: number = 0;
  private isInvulnerable: boolean = false;
  private currentAttackDef: BossAttackDef | null = null;
  private hasDealtDamageInCurrentSwing: boolean = false;

  // Visual tell aura (orange danger glow during telegraph)
  private telegraphGlow: THREE.PointLight;
  private hitFlashTimer: number = 0;

  // Attack Definitions
  private readonly attacks: Record<string, BossAttackDef> = {
    SWEEP: {
      id: 'SWEEP',
      name: 'Ironjaw Crescent Sweep',
      telegraphDuration: 0.85,
      attackDuration: 0.55,
      recoveryDuration: 0.95,
      damage: 26,
      poiseDamage: 22,
      hitRadius: 2.8,
      hitArcDeg: 140,
      forwardImpulse: 0.8,
    },
    SLAM: {
      id: 'SLAM',
      name: 'Gatekeeper Ground Slam',
      telegraphDuration: 1.05,
      attackDuration: 0.45,
      recoveryDuration: 1.40, // PRD Punish Window: 1.4s weapon stuck in ground
      damage: 38,
      poiseDamage: 40,
      hitRadius: 2.4,
      hitArcDeg: 80,
      forwardImpulse: 1.2,
    },
    STOMP: {
      id: 'STOMP',
      name: 'Iron Boot Pushback Stomp',
      telegraphDuration: 0.45,
      attackDuration: 0.35,
      recoveryDuration: 0.75,
      damage: 18,
      poiseDamage: 28,
      hitRadius: 1.8,
      hitArcDeg: 120,
      forwardImpulse: 0.2,
    },
  };

  // Callback to damage player
  public onAttackPlayerHit?: (damage: number, poiseDamage: number, hitPos: THREE.Vector3) => void;

  constructor(
    model: GarrickModel,
    audioManager: AudioManager,
    cameraManager: CameraManager
  ) {
    this.model = model;
    this.animator = new GarrickAnimator(this.model.getRig());
    this.audioManager = audioManager;
    this.cameraManager = cameraManager;

    // Telegraph danger warning light
    this.telegraphGlow = new THREE.PointLight(0xff6600, 0, 4.5);
    this.telegraphGlow.position.set(0, 1.8, 0.4);
    this.model.getRoot().add(this.telegraphGlow);

    this.transitionToState('IDLE_GUARD');
  }

  public getRoot(): THREE.Group {
    return this.model.getRoot();
  }

  public getModel(): GarrickModel {
    return this.model;
  }

  public getAnimator(): GarrickAnimator {
    return this.animator;
  }

  public getPosition(): THREE.Vector3 {
    return this.model.getRoot().position;
  }

  public getHitboxRadius(): number {
    return 1.15; // Generous collision volume for human knight
  }

  public isAlive(): boolean {
    return this.state !== 'DEFEATED_KNEEL';
  }

  public getBossStats(): BossStats {
    return {
      name: 'SIR GARRICK IRONJAW',
      title: 'The Gatekeeper',
      health: Math.max(0, this.currentHealth),
      maxHealth: this.maxHealth,
      poise: Math.max(0, this.currentPoise),
      maxPoise: this.maxPoise,
      phase: this.phase,
      state: this.state,
      isStaggered: this.state === 'STAGGERED',
      isDefeated: this.state === 'DEFEATED_KNEEL',
    };
  }

  public resetBoss(): void {
    this.currentHealth = this.maxHealth;
    this.currentPoise = this.maxPoise;
    this.phase = 1;
    this.transitionToState('IDLE_GUARD');
    this.eventBus.emit('BOSS_STATS_UPDATED', this.getBossStats());
  }

  /**
   * Main AI Update Loop
   */
  public update(deltaTime: number, playerPos: THREE.Vector3): void {
    this.stateTimer += deltaTime;
    this.animator.update(deltaTime);

    // Update material flash feedback
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer <= 0) {
        this.resetArmorColor();
      }
    }

    if (this.state === 'DEFEATED_KNEEL') {
      return; // Completed encounter
    }

    // Distance and orientation to player
    const myPos = this.model.getRoot().position;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, myPos);
    toPlayer.y = 0;
    const distanceToPlayer = toPlayer.length();

    // Smoothly turn to face player during non-attack/punish states
    if (
      this.state === 'IDLE_GUARD' ||
      this.state === 'APPROACH' ||
      this.state === 'TELEGRAPH_SWEEP' ||
      this.state === 'TELEGRAPH_SLAM'
    ) {
      if (distanceToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.model.getRoot().rotation.y = THREE.MathUtils.lerp(
          this.model.getRoot().rotation.y,
          targetAngle,
          deltaTime * (this.phase === 2 ? 6.0 : 4.2)
        );
      }
    }

    // Execute state logic
    switch (this.state) {
      case 'IDLE_GUARD':
        this.updateIdleGuard(deltaTime, distanceToPlayer);
        break;

      case 'APPROACH':
        this.updateApproach(deltaTime, toPlayer, distanceToPlayer);
        break;

      case 'TELEGRAPH_SWEEP':
      case 'TELEGRAPH_SLAM':
        this.updateTelegraph(deltaTime);
        break;

      case 'ATTACK_SWEEP':
      case 'ATTACK_SLAM':
      case 'ATTACK_STOMP':
        this.updateAttack(deltaTime, playerPos, distanceToPlayer);
        break;

      case 'PUNISH_RECOVERY':
        if (this.stateTimer >= (this.currentAttackDef?.recoveryDuration || 1.2)) {
          this.transitionToState('IDLE_GUARD');
        }
        break;

      case 'STAGGERED':
        if (this.stateTimer >= 1.8) {
          this.currentPoise = this.maxPoise;
          this.transitionToState('IDLE_GUARD');
        }
        break;

      case 'TRANSITION_PHASE_2':
        if (this.stateTimer >= 1.6) {
          this.isInvulnerable = false;
          this.transitionToState('IDLE_GUARD');
        }
        break;
    }

    // Emit live stats to UI HUD
    this.eventBus.emit('BOSS_STATS_UPDATED', this.getBossStats());
  }

  private updateIdleGuard(deltaTime: number, distance: number): void {
    if (distance <= 2.2) {
      this.closeProximityTimer += deltaTime;
      if (this.closeProximityTimer > 0.8) {
        this.closeProximityTimer = 0;
        this.startAttack(this.attacks.STOMP);
        return;
      }
    } else {
      this.closeProximityTimer = 0;
    }

    if (this.stateTimer >= this.attackCooldown) {
      if (distance > 3.8) {
        this.transitionToState('APPROACH');
      } else {
        // In striking range: choose attack family
        const chooseSlam = Math.random() < (this.phase === 2 ? 0.55 : 0.40);
        this.startTelegraph(chooseSlam ? this.attacks.SLAM : this.attacks.SWEEP);
      }
    }
  }

  private updateApproach(deltaTime: number, toPlayer: THREE.Vector3, distance: number): void {
    const approachSpeed = this.phase === 2 ? 3.4 : 2.6;
    const moveDir = toPlayer.clone().normalize();
    this.model.getRoot().position.addScaledVector(moveDir, approachSpeed * deltaTime);

    // Keep within arena radius (< 15.5m)
    const currentRadius = Math.hypot(this.model.getRoot().position.x, this.model.getRoot().position.z);
    if (currentRadius > 15.5) {
      this.model.getRoot().position.clampLength(0, 15.5);
    }

    // Stop approaching and attack when within reach
    if (distance <= 3.2 || this.stateTimer > 4.5) {
      const chooseSlam = Math.random() < 0.5;
      this.startTelegraph(chooseSlam ? this.attacks.SLAM : this.attacks.SWEEP);
    }
  }

  private startTelegraph(attack: BossAttackDef): void {
    this.currentAttackDef = attack;
    const isSlam = attack.id === 'SLAM';
    const stateName = isSlam ? 'TELEGRAPH_SLAM' : 'TELEGRAPH_SWEEP';

    const telegraphDuration = this.phase === 2
      ? attack.telegraphDuration * 0.75
      : attack.telegraphDuration;

    this.transitionToState(stateName, telegraphDuration);

    // Warning glow tell
    this.telegraphGlow.color.setHex(isSlam ? 0xff2200 : 0xff7700);
    this.telegraphGlow.intensity = 2.5;

    // Telegraph audio cue
    this.audioManager.playSwordSwing(true);
  }

  private updateTelegraph(_deltaTime: number): void {
    const duration = this.currentAttackDef?.telegraphDuration || 0.8;
    // Pulse danger light intensity
    const progress = Math.min(1.0, this.stateTimer / duration);
    this.telegraphGlow.intensity = progress * 4.0;

    if (this.stateTimer >= duration) {
      this.telegraphGlow.intensity = 0;
      this.executeAttackSwing();
    }
  }

  private executeAttackSwing(): void {
    if (!this.currentAttackDef) return;

    const isSlam = this.currentAttackDef.id === 'SLAM';
    const isStomp = this.currentAttackDef.id === 'STOMP';
    const stateName = isSlam ? 'ATTACK_SLAM' : isStomp ? 'ATTACK_STOMP' : 'ATTACK_SWEEP';

    this.hasDealtDamageInCurrentSwing = false;
    this.transitionToState(stateName, this.currentAttackDef.attackDuration);

    // Forward impulse
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.getRoot().rotation.y);
    this.model.getRoot().position.addScaledVector(forward, this.currentAttackDef.forwardImpulse);

    // Audio cue
    this.audioManager.playSwordSwing(true);
  }

  private updateAttack(_deltaTime: number, playerPos: THREE.Vector3, distance: number): void {
    const def = this.currentAttackDef;
    if (!def) return;

    // Check hit frame (around 50% through the swing)
    const progress = this.stateTimer / def.attackDuration;
    if (progress >= 0.35 && progress <= 0.75 && !this.hasDealtDamageInCurrentSwing) {
      // Evaluate if player is inside strike cone and distance
      if (distance <= def.hitRadius) {
        const toPlayer = new THREE.Vector3().subVectors(playerPos, this.model.getRoot().position).normalize();
        const bossForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.getRoot().rotation.y);
        const dot = bossForward.dot(toPlayer);
        const threshold = Math.cos(THREE.MathUtils.degToRad(def.hitArcDeg / 2));

        if (dot >= threshold) {
          this.hasDealtDamageInCurrentSwing = true;
          this.onAttackPlayerHit?.(def.damage, def.poiseDamage, playerPos);

          // Impact effects
          this.audioManager.playHitSound(140);
          this.cameraManager.addShake(def.id === 'SLAM' ? 0.35 : 0.22);
        }
      }
    }

    if (this.stateTimer >= def.attackDuration) {
      // Transition to punish recovery window
      if (def.id === 'SLAM') {
        // Slam creates ground shockwave crack
        this.cameraManager.addShake(0.30);
        this.audioManager.playHitSound(90);
        this.transitionToState('PUNISH_RECOVERY', def.recoveryDuration);
      } else {
        // Enraged Phase 2 chain: Sweep into immediate Slam!
        if (this.phase === 2 && def.id === 'SWEEP' && Math.random() < 0.65) {
          this.startTelegraph(this.attacks.SLAM);
        } else {
          this.transitionToState('IDLE_GUARD');
          this.attackCooldown = (this.phase === 2 ? 0.6 : 1.2) + Math.random() * 0.4;
        }
      }
    }
  }

  private startAttack(attack: BossAttackDef): void {
    this.currentAttackDef = attack;
    this.hasDealtDamageInCurrentSwing = false;
    this.transitionToState('ATTACK_STOMP', attack.attackDuration);
  }

  /**
   * Implements IDamageable for combat system integration
   */
  public takeDamage(
    amount: number,
    poiseDamage: number,
    _hitPoint: THREE.Vector3,
    _hitNormal: THREE.Vector3,
    isHeavy: boolean,
    isCritical: boolean = false
  ): DamageResult {
    if (this.isInvulnerable || this.state === 'DEFEATED_KNEEL') {
      return {
        hit: false,
        damageDealt: 0,
        poiseBroken: false,
        isCritical: false,
        currentHealth: this.currentHealth,
        maxHealth: this.maxHealth,
        targetName: 'Sir Garrick Ironjaw',
      };
    }

    this.currentHealth -= amount;
    this.currentPoise -= poiseDamage;

    // Hit flash reaction
    this.flashArmorColor(isCritical ? 0xffea00 : isHeavy ? 0xff4422 : 0xccddee);

    // Poise break check
    let poiseBroken = false;
    if (this.currentPoise <= 0 && this.state !== 'STAGGERED') {
      poiseBroken = true;
      this.currentPoise = 0;
      this.transitionToState('STAGGERED', 1.8);
      this.cameraManager.addShake(0.28);
      this.audioManager.playParryClang();
    }

    // Phase 2 transition check (HP <= 50% = 175)
    if (this.phase === 1 && this.currentHealth <= this.maxHealth * 0.5 && this.currentHealth > 0) {
      this.phase = 2;
      this.isInvulnerable = true;
      this.transitionToState('TRANSITION_PHASE_2', 1.6);
      this.cameraManager.addShake(0.40);
      this.audioManager.playDragonCall(); // Battle roar
      this.eventBus.emit('BOSS_PHASE_CHANGED', 2);
    }

    // Defeat check
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.transitionToState('DEFEATED_KNEEL', 2.5);
      this.eventBus.emit('BOSS_DEFEATED', {
        bossName: 'Sir Garrick Ironjaw',
        title: 'The Gatekeeper',
        honorableYield: true,
      });
      this.audioManager.playParryClang();
    }

    return {
      hit: true,
      damageDealt: amount,
      poiseBroken,
      isCritical,
      currentHealth: this.currentHealth,
      maxHealth: this.maxHealth,
      targetName: 'Sir Garrick Ironjaw',
    };
  }

  /**
   * Called when player successfully parries Garrick's attack
   */
  public onParriedByPlayer(): void {
    this.telegraphGlow.intensity = 0;
    this.currentPoise = Math.max(0, this.currentPoise - 50);
    this.transitionToState('STAGGERED', 2.0);
    this.cameraManager.addShake(0.35);
  }

  private transitionToState(newState: GarrickAIState, duration: number = 1.0): void {
    this.state = newState;
    this.stateTimer = 0;
    this.animator.setState(newState, duration);
  }

  private flashArmorColor(hex: number): void {
    this.hitFlashTimer = 0.08;
    const mesh = this.model.getRig().cuirassMesh;
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.setHex(hex);
    }
  }

  private resetArmorColor(): void {
    const mesh = this.model.getRig().cuirassMesh;
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.setHex(0x68707a);
    }
  }
}
