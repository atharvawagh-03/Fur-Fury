/**
 * Sir Brannoc Cinderhand, the Forge Warden - Boss Combat AI & Behavior Tree
 * Conforming strictly to PRD Section 6, 9, 12:
 * - 420 HP, 140 Poise. Heavy volcanic smith boss.
 * - Seismic ground shockwaves, wide horizontal sweeps, and molten hazard eruptions.
 * - Extended punish recovery window (1.5s) when hammerhead is lodged in floor stones.
 * - Phase 2 Superheated Molten Overdrive at 50% HP.
 * - Non-gory honorable yield granting Forge Warden's Cinder Seal.
 */

import * as THREE from 'three';
import { BrannocModel } from './BrannocModel';
import { BrannocAnimator, BrannocAIState } from './BrannocAnimator';
import { BossAttackDef, BossPhase, BossStats, IBossEnemy } from './EnemyTypes';
import { DamageResult } from '../combat/CombatTypes';
import { AudioManager } from '../audio/AudioManager';
import { CameraManager } from '../camera/CameraManager';
import { EventBus } from '../core/EventBus';

export class BrannocAI implements IBossEnemy {
  private model: BrannocModel;
  private animator: BrannocAnimator;
  private audioManager: AudioManager;
  private cameraManager: CameraManager;
  private eventBus = EventBus.getInstance();

  // Boss Vitals & Poise per PRD Section 6
  private maxHealth: number = 420;
  private currentHealth: number = 420;
  private maxPoise: number = 140;
  private currentPoise: number = 140;
  private phase: BossPhase = 1;
  private state: BrannocAIState = 'IDLE_GUARD';

  // Combat Timers
  private stateTimer: number = 0;
  private attackCooldown: number = 1.4;
  private isInvulnerable: boolean = false;
  private currentAttackDef: BossAttackDef | null = null;
  private hasDealtDamageInCurrentSwing: boolean = false;

  // Visual tell aura (bright volcanic orange flare during telegraph)
  private telegraphGlow: THREE.PointLight;
  private hitFlashTimer: number = 0;

  // Attack Definitions
  private readonly attacks: Record<string, BossAttackDef> = {
    SLAM: {
      id: 'SLAM',
      name: 'Molten Seismic Slam',
      telegraphDuration: 1.10,
      attackDuration: 0.40,
      recoveryDuration: 1.50, // PRD Punish Window: 1.5s hammer lodged in stone
      damage: 45,
      poiseDamage: 50,
      hitRadius: 3.2,
      hitArcDeg: 90,
      forwardImpulse: 1.0,
      isUnblockable: true,
    },
    SWEEP: {
      id: 'SWEEP',
      name: 'Forge Hearth Sweep',
      telegraphDuration: 0.90,
      attackDuration: 0.50,
      recoveryDuration: 0.95,
      damage: 32,
      poiseDamage: 35,
      hitRadius: 3.4,
      hitArcDeg: 160,
      forwardImpulse: 0.6,
    },
  };

  // Callback to damage player
  public onAttackPlayerHit?: (damage: number, poiseDamage: number, hitPos: THREE.Vector3) => void;

  constructor(
    model: BrannocModel,
    audioManager: AudioManager,
    cameraManager: CameraManager
  ) {
    this.model = model;
    this.animator = new BrannocAnimator(this.model.getRig());
    this.audioManager = audioManager;
    this.cameraManager = cameraManager;

    // Volcanic furnace telegraph glow
    this.telegraphGlow = new THREE.PointLight(0xff4400, 0, 5.5);
    this.telegraphGlow.position.set(0, 1.8, 0.5);
    this.model.getRoot().add(this.telegraphGlow);

    this.transitionToState('IDLE_GUARD');
  }

  public getRoot(): THREE.Group {
    return this.model.getRoot();
  }

  public getModel(): BrannocModel {
    return this.model;
  }

  public getAnimator(): BrannocAnimator {
    return this.animator;
  }

  public getPosition(): THREE.Vector3 {
    return this.model.getRoot().position;
  }

  public getHitboxRadius(): number {
    return 1.35; // Heavy titan boss hitbox
  }

  public isAlive(): boolean {
    return this.state !== 'DEFEATED_KNEEL';
  }

  public getBossStats(): BossStats {
    return {
      name: 'SIR BRANNOC CINDERHAND',
      title: 'The Forge Warden',
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
    this.isInvulnerable = false;
    this.telegraphGlow.intensity = 0;
    this.transitionToState('IDLE_GUARD');
  }

  public update(deltaTime: number, playerPos: THREE.Vector3): void {
    this.stateTimer += deltaTime;

    // Hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer <= 0) {
        this.resetArmorColor();
      }
    }

    // Passive Poise Regen
    if (this.state !== 'STAGGERED' && this.state !== 'DEFEATED_KNEEL') {
      if (this.currentPoise < this.maxPoise) {
        this.currentPoise = Math.min(this.maxPoise, this.currentPoise + 18 * deltaTime);
      }
    }

    // Execute state logic
    switch (this.state) {
      case 'IDLE_GUARD':
        this.updateIdleGuard(deltaTime, playerPos);
        break;
      case 'APPROACH':
        this.updateApproach(deltaTime, playerPos);
        break;
      case 'TELEGRAPH_SLAM':
      case 'TELEGRAPH_SWEEP':
        this.updateTelegraph(deltaTime, playerPos);
        break;
      case 'ATTACK_SLAM':
      case 'ATTACK_SWEEP':
        this.updateAttack(deltaTime, playerPos);
        break;
      case 'PUNISH_RECOVERY':
        this.updatePunishRecovery(deltaTime);
        break;
      case 'STAGGERED':
        this.updateStaggered(deltaTime);
        break;
      case 'TRANSITION_PHASE_2':
        this.updatePhase2Transition(deltaTime);
        break;
      case 'DEFEATED_KNEEL':
        break;
    }

    this.animator.update(deltaTime);

    // Sync boss stats to HUD
    this.eventBus.emit('BOSS_STATS_UPDATED', this.getBossStats());
  }

  private updateIdleGuard(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 4.5);
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

    const dist = this.getPosition().distanceTo(playerPos);

    if (dist > 3.4) {
      this.transitionToState('APPROACH');
      return;
    }

    if (this.attackCooldown <= 0) {
      this.decideNextMove(dist);
    }
  }

  private updateApproach(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 5.0);

    const bossPos = this.getPosition();
    const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= 3.2) {
      this.transitionToState('IDLE_GUARD');
      return;
    }

    const moveSpeed = this.phase === 2 ? 3.0 : 2.2;
    toPlayer.normalize();
    bossPos.addScaledVector(toPlayer, moveSpeed * deltaTime);

    if (this.attackCooldown <= 0 && dist < 4.2) {
      this.decideNextMove(dist);
    }
  }

  private decideNextMove(dist: number): void {
    // 60% chance Seismic Slam, 40% Sweep
    if (dist > 2.8 || Math.random() < 0.6) {
      this.startTelegraph(this.attacks.SLAM);
    } else {
      this.startTelegraph(this.attacks.SWEEP);
    }
  }

  private startTelegraph(attack: BossAttackDef): void {
    this.currentAttackDef = attack;
    const stateName: BrannocAIState =
      attack.id === 'SLAM' ? 'TELEGRAPH_SLAM' : 'TELEGRAPH_SWEEP';

    const duration = this.phase === 2 ? attack.telegraphDuration * 0.85 : attack.telegraphDuration;
    this.transitionToState(stateName, duration);

    this.telegraphGlow.intensity = 4.5;
    this.audioManager.playSwordSwing(true);
  }

  private updateTelegraph(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 4.0);

    if (this.currentAttackDef && this.stateTimer >= this.currentAttackDef.telegraphDuration) {
      this.telegraphGlow.intensity = 0;
      this.executeAttack(this.currentAttackDef);
    }
  }

  private executeAttack(attack: BossAttackDef): void {
    this.currentAttackDef = attack;
    this.hasDealtDamageInCurrentSwing = false;

    const attackState: BrannocAIState =
      attack.id === 'SLAM' ? 'ATTACK_SLAM' : 'ATTACK_SWEEP';

    this.transitionToState(attackState, attack.attackDuration);
    this.audioManager.playSwordSwing(true);
  }

  private updateAttack(deltaTime: number, playerPos: THREE.Vector3): void {
    const def = this.currentAttackDef;
    if (!def) {
      this.transitionToState('IDLE_GUARD');
      return;
    }

    // Forward impulse
    if (def.forwardImpulse > 0) {
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.getRoot().quaternion);
      this.getPosition().addScaledVector(fwd, def.forwardImpulse * deltaTime * 2.5);
    }

    // Hitbox check
    if (!this.hasDealtDamageInCurrentSwing && this.stateTimer >= def.attackDuration * 0.45) {
      const bossPos = this.getPosition();
      const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist <= def.hitRadius) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.getRoot().quaternion);
        const angle = THREE.MathUtils.radToDeg(forward.angleTo(toPlayer));

        if (angle <= def.hitArcDeg * 0.5) {
          this.hasDealtDamageInCurrentSwing = true;
          if (this.onAttackPlayerHit) {
            this.onAttackPlayerHit(def.damage, def.poiseDamage, playerPos);
          }
          this.audioManager.playHitSound(120);
          this.cameraManager.addShake(def.id === 'SLAM' ? 0.45 : 0.25);
        }
      }
    }

    if (this.stateTimer >= def.attackDuration) {
      if (def.id === 'SLAM') {
        // Seismic impact sound and camera shake
        this.cameraManager.addShake(0.35);
        this.audioManager.playHitSound(80);
        // Major punish window!
        this.transitionToState('PUNISH_RECOVERY', def.recoveryDuration);
      } else {
        this.transitionToState('IDLE_GUARD');
        this.attackCooldown = (this.phase === 2 ? 0.8 : 1.3) + Math.random() * 0.4;
      }
    }
  }

  private updatePunishRecovery(_deltaTime: number): void {
    const recoveryTime = this.currentAttackDef ? this.currentAttackDef.recoveryDuration : 1.5;
    if (this.stateTimer >= recoveryTime) {
      this.transitionToState('IDLE_GUARD');
      this.attackCooldown = 0.8;
    }
  }

  private updateStaggered(_deltaTime: number): void {
    if (this.stateTimer >= 2.2) {
      this.currentPoise = this.maxPoise * 0.8;
      this.transitionToState('IDLE_GUARD');
      this.attackCooldown = 1.0;
    }
  }

  private updatePhase2Transition(_deltaTime: number): void {
    if (this.stateTimer >= 1.6) {
      this.isInvulnerable = false;
      this.transitionToState('IDLE_GUARD');
      this.attackCooldown = 0.4;
    }
  }

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
        targetName: 'Sir Brannoc Cinderhand',
      };
    }

    this.currentHealth -= amount;
    this.currentPoise -= poiseDamage;

    // Flash armor
    this.flashArmorColor(isCritical ? 0xffea00 : isHeavy ? 0xff3300 : 0x884422);

    // Poise break check
    let poiseBroken = false;
    if (this.currentPoise <= 0 && this.state !== 'STAGGERED') {
      poiseBroken = true;
      this.currentPoise = 0;
      this.transitionToState('STAGGERED', 2.2);
      this.cameraManager.addShake(0.35);
      this.audioManager.playParryClang();
    }

    // Phase 2 transition check (HP <= 50% = 210)
    if (this.phase === 1 && this.currentHealth <= this.maxHealth * 0.5 && this.currentHealth > 0) {
      this.phase = 2;
      this.isInvulnerable = true;
      this.transitionToState('TRANSITION_PHASE_2', 1.6);
      this.cameraManager.addShake(0.45);
      this.audioManager.playDragonCall(); // Great volcanic roar
      this.eventBus.emit('BOSS_PHASE_CHANGED', 2);

      // Enhance furnace glow in Phase 2
      this.model.getRig().moltenCoreLight.intensity = 4.0;
    }

    // Defeat check
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.transitionToState('DEFEATED_KNEEL', 2.5);
      this.eventBus.emit('BOSS_DEFEATED', {
        bossName: 'Sir Brannoc Cinderhand',
        title: 'The Forge Warden',
        honorableYield: true,
        dialogue:
          '“By the eternal fires... you possess the fury of the ancients. Take the Cinder Seal, and bring honour to our fallen realm.”',
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
      targetName: 'Sir Brannoc Cinderhand',
    };
  }

  public onParriedByPlayer(): void {
    this.telegraphGlow.intensity = 0;
    this.currentPoise = Math.max(0, this.currentPoise - 60);
    this.transitionToState('STAGGERED', 2.2);
    this.cameraManager.addShake(0.35);
  }

  private lookAtTarget(targetPos: THREE.Vector3, turnSpeed: number): void {
    const root = this.model.getRoot();
    const toTarget = new THREE.Vector3().subVectors(targetPos, root.position);
    toTarget.y = 0;
    if (toTarget.lengthSq() < 0.001) return;

    const targetYaw = Math.atan2(toTarget.x, toTarget.z);
    root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, targetYaw, Math.min(1.0, turnSpeed));
  }

  private transitionToState(newState: BrannocAIState, duration: number = 1.0): void {
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
      mesh.material.color.setHex(0x2e2c2b);
    }
  }
}
