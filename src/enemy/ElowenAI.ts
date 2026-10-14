/**
 * Dame Elowen Vale, the Rose Sentinel - Boss Combat AI & Behavior Tree
 * Conforming strictly to PRD Section 6, 9, 12:
 * - 280 HP, 80 Poise. High-speed duelist with needle rapier.
 * - Thrust flurries, deep lunges, and defensive parry stance.
 * - Punish recovery window on missed long lunges.
 * - Phase 2 "Rose Petal Dance" at 50% HP.
 * - Non-gory honorable yield granting Sentinel's Rose Seal & narrative revelation.
 */

import * as THREE from 'three';
import { ElowenModel } from './ElowenModel';
import { ElowenAnimator, ElowenAIState } from './ElowenAnimator';
import { BossAttackDef, BossPhase, BossStats, IBossEnemy } from './EnemyTypes';
import { DamageResult } from '../combat/CombatTypes';
import { AudioManager } from '../audio/AudioManager';
import { CameraManager } from '../camera/CameraManager';
import { EventBus } from '../core/EventBus';

export class ElowenAI implements IBossEnemy {
  private model: ElowenModel;
  private animator: ElowenAnimator;
  private audioManager: AudioManager;
  private cameraManager: CameraManager;
  private eventBus = EventBus.getInstance();

  // Boss Vitals & Poise per PRD Section 6
  private maxHealth: number = 280;
  private currentHealth: number = 280;
  private maxPoise: number = 80;
  private currentPoise: number = 80;
  private phase: BossPhase = 1;
  private state: ElowenAIState = 'IDLE_DUELIST';

  // Combat Timers
  private stateTimer: number = 0;
  private attackCooldown: number = 1.0;
  private isInvulnerable: boolean = false;
  private currentAttackDef: BossAttackDef | null = null;
  private hasDealtDamageInCurrentSwing: boolean = false;

  // Visual tell aura (rose-pink glint during telegraph)
  private telegraphGlow: THREE.PointLight;
  private hitFlashTimer: number = 0;

  // Attack Definitions
  private readonly attacks: Record<string, BossAttackDef> = {
    THRUST_FLURRY: {
      id: 'THRUST_FLURRY',
      name: 'Rose Thorn Triple Flurry',
      telegraphDuration: 0.50,
      attackDuration: 0.45,
      recoveryDuration: 0.65,
      damage: 22,
      poiseDamage: 18,
      hitRadius: 2.6,
      hitArcDeg: 70,
      forwardImpulse: 1.2,
    },
    LUNGE: {
      id: 'LUNGE',
      name: 'Sentinel Piercing Lunge',
      telegraphDuration: 0.70,
      attackDuration: 0.35,
      recoveryDuration: 1.25, // PRD Punish Window: 1.25s overextended recovery
      damage: 34,
      poiseDamage: 30,
      hitRadius: 3.2,
      hitArcDeg: 50,
      forwardImpulse: 2.2,
    },
    PARRY_STANCE: {
      id: 'PARRY_STANCE',
      name: 'Riposte Stance',
      telegraphDuration: 0.20,
      attackDuration: 1.40,
      recoveryDuration: 0.40,
      damage: 28,
      poiseDamage: 35,
      hitRadius: 2.0,
      hitArcDeg: 120,
      forwardImpulse: 0.5,
    },
  };

  // Callback to damage player
  public onAttackPlayerHit?: (damage: number, poiseDamage: number, hitPos: THREE.Vector3) => void;

  constructor(
    model: ElowenModel,
    audioManager: AudioManager,
    cameraManager: CameraManager
  ) {
    this.model = model;
    this.animator = new ElowenAnimator(this.model.getRig());
    this.audioManager = audioManager;
    this.cameraManager = cameraManager;

    // Rose danger glint
    this.telegraphGlow = new THREE.PointLight(0xff5577, 0, 4.0);
    this.telegraphGlow.position.set(0, 1.4, 0.4);
    this.model.getRoot().add(this.telegraphGlow);

    this.transitionToState('IDLE_DUELIST');
  }

  public getRoot(): THREE.Group {
    return this.model.getRoot();
  }

  public getModel(): ElowenModel {
    return this.model;
  }

  public getAnimator(): ElowenAnimator {
    return this.animator;
  }

  public getPosition(): THREE.Vector3 {
    return this.model.getRoot().position;
  }

  public getHitboxRadius(): number {
    return 0.95; // Agile fencer hitbox
  }

  public isAlive(): boolean {
    return this.state !== 'DEFEATED_KNEEL';
  }

  public getBossStats(): BossStats {
    return {
      name: 'DAME ELOWEN VALE',
      title: 'The Rose Sentinel',
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
    this.transitionToState('IDLE_DUELIST');
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
        this.currentPoise = Math.min(this.maxPoise, this.currentPoise + 14 * deltaTime);
      }
    }

    // Execute state logic
    switch (this.state) {
      case 'IDLE_DUELIST':
        this.updateIdleDuelist(deltaTime, playerPos);
        break;
      case 'APPROACH':
        this.updateApproach(deltaTime, playerPos);
        break;
      case 'TELEGRAPH_THRUST':
      case 'TELEGRAPH_LUNGE':
        this.updateTelegraph(deltaTime, playerPos);
        break;
      case 'ATTACK_THRUST':
      case 'ATTACK_LUNGE':
        this.updateAttack(deltaTime, playerPos);
        break;
      case 'PARRY_STANCE':
        this.updateParryStance(deltaTime, playerPos);
        break;
      case 'PUNISH_RECOVERY':
        this.updatePunishRecovery(deltaTime, playerPos);
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

  private updateIdleDuelist(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 6.0);
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

    const dist = this.getPosition().distanceTo(playerPos);

    if (dist > 3.0) {
      this.transitionToState('APPROACH');
      return;
    }

    if (this.attackCooldown <= 0) {
      this.decideNextMove(dist);
    }
  }

  private updateApproach(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 7.0);

    const bossPos = this.getPosition();
    const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= 2.8) {
      this.transitionToState('IDLE_DUELIST');
      return;
    }

    const moveSpeed = this.phase === 2 ? 4.2 : 3.2;
    toPlayer.normalize();
    bossPos.addScaledVector(toPlayer, moveSpeed * deltaTime);

    if (this.attackCooldown <= 0 && dist < 4.0) {
      this.decideNextMove(dist);
    }
  }

  private decideNextMove(dist: number): void {
    const roll = Math.random();

    if (dist > 3.0) {
      // Long range: Piercing Lunge
      this.startTelegraph(this.attacks.LUNGE);
    } else if (roll < 0.35 && this.phase === 1) {
      // Medium roll: enter defensive parry stance
      this.transitionToState('PARRY_STANCE', this.attacks.PARRY_STANCE.attackDuration);
    } else {
      // Close range: rapid thrust flurry
      this.startTelegraph(this.attacks.THRUST_FLURRY);
    }
  }

  private startTelegraph(attack: BossAttackDef): void {
    this.currentAttackDef = attack;
    const stateName: ElowenAIState =
      attack.id === 'LUNGE' ? 'TELEGRAPH_LUNGE' : 'TELEGRAPH_THRUST';

    const duration = this.phase === 2 ? attack.telegraphDuration * 0.8 : attack.telegraphDuration;
    this.transitionToState(stateName, duration);

    this.telegraphGlow.intensity = 3.5;
    this.audioManager.playSwordSwing(false);
  }

  private updateTelegraph(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 6.0);

    if (this.currentAttackDef && this.stateTimer >= this.currentAttackDef.telegraphDuration) {
      this.telegraphGlow.intensity = 0;
      this.executeAttack(this.currentAttackDef);
    }
  }

  private executeAttack(attack: BossAttackDef): void {
    this.currentAttackDef = attack;
    this.hasDealtDamageInCurrentSwing = false;

    const attackState: ElowenAIState =
      attack.id === 'LUNGE' ? 'ATTACK_LUNGE' : 'ATTACK_THRUST';

    this.transitionToState(attackState, attack.attackDuration);
    this.audioManager.playSwordSwing(false);
  }

  private updateAttack(deltaTime: number, playerPos: THREE.Vector3): void {
    const def = this.currentAttackDef;
    if (!def) {
      this.transitionToState('IDLE_DUELIST');
      return;
    }

    // Forward thrust impulse
    if (def.forwardImpulse > 0) {
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.getRoot().quaternion);
      this.getPosition().addScaledVector(fwd, def.forwardImpulse * deltaTime * 3.5);
    }

    // Hitbox check
    if (!this.hasDealtDamageInCurrentSwing && this.stateTimer >= def.attackDuration * 0.35) {
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
          this.audioManager.playHitSound(200);
          this.cameraManager.addShake(def.id === 'LUNGE' ? 0.28 : 0.16);
        }
      }
    }

    if (this.stateTimer >= def.attackDuration) {
      if (def.id === 'LUNGE') {
        // Punish window! Overextended lunge
        this.transitionToState('PUNISH_RECOVERY', def.recoveryDuration);
      } else {
        this.transitionToState('IDLE_DUELIST');
        this.attackCooldown = (this.phase === 2 ? 0.5 : 1.0) + Math.random() * 0.4;
      }
    }
  }

  private updateParryStance(deltaTime: number, playerPos: THREE.Vector3): void {
    this.lookAtTarget(playerPos, deltaTime * 8.0);

    if (this.stateTimer >= this.attacks.PARRY_STANCE.attackDuration) {
      this.transitionToState('IDLE_DUELIST');
      this.attackCooldown = 0.8;
    }
  }

  private updatePunishRecovery(_deltaTime: number, _playerPos: THREE.Vector3): void {
    const recoveryTime = this.currentAttackDef ? this.currentAttackDef.recoveryDuration : 1.25;
    if (this.stateTimer >= recoveryTime) {
      this.transitionToState('IDLE_DUELIST');
      this.attackCooldown = 0.6;
    }
  }

  private updateStaggered(_deltaTime: number): void {
    if (this.stateTimer >= 1.8) {
      this.currentPoise = this.maxPoise * 0.75;
      this.transitionToState('IDLE_DUELIST');
      this.attackCooldown = 0.8;
    }
  }

  private updatePhase2Transition(_deltaTime: number): void {
    if (this.stateTimer >= 1.4) {
      this.isInvulnerable = false;
      this.transitionToState('IDLE_DUELIST');
      this.attackCooldown = 0.3;
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
        targetName: 'Dame Elowen Vale',
      };
    }

    // Check if player attacked into Elowen's Parry Stance!
    if (this.state === 'PARRY_STANCE') {
      if (!isHeavy) {
        // Player used light attack! Elowen parries, deflects, and counters!
        this.audioManager.playParryClang();
        this.cameraManager.addShake(0.32);
        this.executeAttack(this.attacks.THRUST_FLURRY);
        return {
          hit: false,
          damageDealt: 0,
          poiseBroken: false,
          isCritical: false,
          currentHealth: this.currentHealth,
          maxHealth: this.maxHealth,
          targetName: 'Dame Elowen Vale (Parried!)',
        };
      } else {
        // Player used Heavy Breaker Strike! Breaks right through her parry!
        poiseDamage *= 2.0;
      }
    }

    this.currentHealth -= amount;
    this.currentPoise -= poiseDamage;

    // Flash armor
    this.flashArmorColor(isCritical ? 0xffea00 : isHeavy ? 0xff4422 : 0xff99aa);

    // Poise break check
    let poiseBroken = false;
    if (this.currentPoise <= 0 && this.state !== 'STAGGERED') {
      poiseBroken = true;
      this.currentPoise = 0;
      this.transitionToState('STAGGERED', 1.8);
      this.cameraManager.addShake(0.25);
      this.audioManager.playParryClang();
    }

    // Phase 2 transition check (HP <= 50% = 140)
    if (this.phase === 1 && this.currentHealth <= this.maxHealth * 0.5 && this.currentHealth > 0) {
      this.phase = 2;
      this.isInvulnerable = true;
      this.transitionToState('TRANSITION_PHASE_2', 1.4);
      this.cameraManager.addShake(0.35);
      this.audioManager.playDragonCall();
      this.eventBus.emit('BOSS_PHASE_CHANGED', 2);
    }

    // Defeat check
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.transitionToState('DEFEATED_KNEEL', 2.0);
      this.eventBus.emit('BOSS_DEFEATED', {
        bossName: 'Dame Elowen Vale',
        title: 'The Rose Sentinel',
        honorableYield: true,
        dialogue:
          '“Your blade is true... hear me, champion: the villagers were taken north to the molten forges of Bellforge. Take the Rose Seal.”',
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
      targetName: 'Dame Elowen Vale',
    };
  }

  public onParriedByPlayer(): void {
    this.telegraphGlow.intensity = 0;
    this.currentPoise = Math.max(0, this.currentPoise - 45);
    this.transitionToState('STAGGERED', 2.0);
    this.cameraManager.addShake(0.30);
  }

  private lookAtTarget(targetPos: THREE.Vector3, turnSpeed: number): void {
    const root = this.model.getRoot();
    const toTarget = new THREE.Vector3().subVectors(targetPos, root.position);
    toTarget.y = 0;
    if (toTarget.lengthSq() < 0.001) return;

    const targetYaw = Math.atan2(toTarget.x, toTarget.z);
    root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, targetYaw, Math.min(1.0, turnSpeed));
  }

  private transitionToState(newState: ElowenAIState, duration: number = 1.0): void {
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
      mesh.material.color.setHex(0xccd4df);
    }
  }
}
