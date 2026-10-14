/**
 * Core Combat Subsystem - Step 5: Sword Combat and Player Abilities
 * Conforming strictly to PRD Section 9 ("Combat system requirements"):
 * - Light 3-hit combo chain (Horizontal Slash -> Backhand Cut -> Rising Spin Leap)
 * - Heavy Breaker Strike with high poise damage
 * - Timed Parry window with metallic clash, starburst VFX, and Riposte counter window
 * - Guard defensive stance with stamina block cost and guard break
 * - Consumable restorative Elixir of Embers (3 charges) with drinking animation
 * - Dynamic hitboxes, weapon ribbon arc trails, contact sparks, and AAA hit-stop micro-freeze
 * - Floating 3D combat damage text with critical styling
 */

import * as THREE from 'three';
import { AnukiModel } from '../character/AnukiModel';
import { AnukiAnimator } from '../character/AnukiAnimator';
import { CombatVFX } from './CombatVFX';
import { AudioManager } from '../audio/AudioManager';
import { CameraManager } from '../camera/CameraManager';
import { EventBus } from '../core/EventBus';
import {
  AttackDefinition,
  AttackType,
  CombatStats,
  IDamageable,
} from './CombatTypes';

export class CombatSystem {
  private model: AnukiModel;
  private animator: AnukiAnimator;
  private vfx: CombatVFX;
  private audioManager: AudioManager;
  private cameraManager: CameraManager;
  private eventBus = EventBus.getInstance();

  // Attack Definitions
  private readonly attacks: Record<AttackType, AttackDefinition> = {
    NONE: {
      type: 'NONE',
      name: 'None',
      damage: 0,
      poiseDamage: 0,
      staminaCost: 0,
      duration: 0,
      hitWindowStart: 0,
      hitWindowEnd: 0,
      hitStopMs: 0,
      forwardLunge: 0,
      trailColor: 0xffffff,
    },
    LIGHT_1: {
      type: 'LIGHT_1',
      name: 'Moonfang Cross-Slash',
      damage: 16,
      poiseDamage: 12,
      staminaCost: 12,
      duration: 0.35,
      hitWindowStart: 0.25,
      hitWindowEnd: 0.65,
      hitStopMs: 45,
      forwardLunge: 0.6,
      trailColor: 0xffeedd,
    },
    LIGHT_2: {
      type: 'LIGHT_2',
      name: 'Moonfang Backhand Cleave',
      damage: 24,
      poiseDamage: 18,
      staminaCost: 14,
      duration: 0.38,
      hitWindowStart: 0.25,
      hitWindowEnd: 0.65,
      hitStopMs: 55,
      forwardLunge: 0.8,
      trailColor: 0xffdf88,
    },
    LIGHT_3: {
      type: 'LIGHT_3',
      name: 'Moonfang Rising Spin Finisher',
      damage: 42,
      poiseDamage: 38,
      staminaCost: 20,
      duration: 0.52,
      hitWindowStart: 0.28,
      hitWindowEnd: 0.72,
      hitStopMs: 75,
      forwardLunge: 1.4,
      trailColor: 0xffaa33,
    },
    HEAVY: {
      type: 'HEAVY',
      name: 'Moonfang Breaker Downward Cleave',
      damage: 60,
      poiseDamage: 55,
      staminaCost: 26,
      duration: 0.58,
      hitWindowStart: 0.32,
      hitWindowEnd: 0.68,
      hitStopMs: 90,
      forwardLunge: 1.1,
      trailColor: 0xff5511,
    },
    RIPOSTE: {
      type: 'RIPOSTE',
      name: 'Critical Riposte Strike',
      damage: 95,
      poiseDamage: 70,
      staminaCost: 10,
      duration: 0.45,
      hitWindowStart: 0.22,
      hitWindowEnd: 0.65,
      hitStopMs: 95,
      forwardLunge: 1.2,
      trailColor: 0xffd700,
    },
  };

  // Combat State
  private currentAttack: AttackDefinition = this.attacks.NONE;
  private attackTimer: number = 0;
  private comboStep: number = 0; // 0: ready, 1: Light 1, 2: Light 2, 3: Light 3
  private comboResetTimer: number = 0;
  private readonly COMBO_WINDOW = 0.48; // Window in seconds to continue combo

  // Parry & Riposte
  private parryActive: boolean = false;
  private parryTimer: number = 0;
  private readonly PARRY_WINDOW = 0.22; // 220ms active deflection window
  private riposteActive: boolean = false;
  private riposteTimer: number = 0;
  private readonly RIPOSTE_WINDOW = 1.4; // 1.4s counter opportunity window

  // Guard State
  private isGuarding: boolean = false;
  private guardBroken: boolean = false;
  private guardBreakTimer: number = 0;

  // Consumable Healing (Elixir of Embers)
  private elixirCount: number = 3;
  private readonly maxElixirs: number = 3;
  private isHealing: boolean = false;
  private healTimer: number = 0;
  private readonly HEAL_DURATION = 0.85;

  // Registered Targets for Collision Detection
  private targets: IDamageable[] = [];
  private hitTargetsInCurrentSwing: Set<IDamageable> = new Set();

  // Hit-Stop Micro-Freeze
  private hitStopTimer: number = 0;

  // Stats Tracking
  private comboStreak: number = 0;
  private maxComboStreak: number = 0;
  private totalDamageDealt: number = 0;
  private totalParries: number = 0;

  constructor(
    model: AnukiModel,
    animator: AnukiAnimator,
    vfx: CombatVFX,
    audioManager: AudioManager,
    cameraManager: CameraManager
  ) {
    this.model = model;
    this.animator = animator;
    this.vfx = vfx;
    this.audioManager = audioManager;
    this.cameraManager = cameraManager;
  }

  public registerTarget(target: IDamageable): void {
    if (!this.targets.includes(target)) {
      this.targets.push(target);
    }
  }

  public unregisterTarget(target: IDamageable): void {
    const idx = this.targets.indexOf(target);
    if (idx !== -1) {
      this.targets.splice(idx, 1);
    }
  }

  public getTargets(): IDamageable[] {
    return this.targets;
  }

  public isAttacking(): boolean {
    return this.currentAttack.type !== 'NONE';
  }

  public cancelAttack(): void {
    if (this.isAttacking()) {
      this.finishAttack();
    }
  }

  public isParrying(): boolean {
    return this.parryActive;
  }

  public isBlocking(): boolean {
    return this.isGuarding && !this.guardBroken;
  }

  public getStats(): CombatStats {
    const multiplier = Math.min(2.5, 1.0 + (this.comboStreak > 1 ? (this.comboStreak - 1) * 0.15 : 0));
    return {
      comboCount: this.comboStreak,
      comboMultiplier: Math.round(multiplier * 10) / 10,
      maxCombo: this.maxComboStreak,
      totalDamageDealt: this.totalDamageDealt,
      parryCount: this.totalParries,
      riposteActive: this.riposteActive,
      riposteTimer: this.riposteTimer,
      elixirCount: this.elixirCount,
      maxElixirs: this.maxElixirs,
      isGuarding: this.isGuarding,
      guardBroken: this.guardBroken,
    };
  }

  /**
   * Executes a light attack or advances the 3-hit combo chain
   */
  public executeLightAttack(currentStamina: number): { success: boolean; staminaCost: number; lungeDistance: number } {
    if (this.isAttacking() || this.isHealing || this.guardBroken) {
      return { success: false, staminaCost: 0, lungeDistance: 0 };
    }

    // Check if Riposte window is active
    if (this.riposteActive) {
      return this.executeRiposte(currentStamina);
    }

    let nextStep = this.comboStep + 1;
    if (nextStep > 3 || this.comboResetTimer <= 0) {
      nextStep = 1;
    }

    let def: AttackDefinition;
    if (nextStep === 1) def = this.attacks.LIGHT_1;
    else if (nextStep === 2) def = this.attacks.LIGHT_2;
    else def = this.attacks.LIGHT_3;

    if (currentStamina < def.staminaCost) {
      return { success: false, staminaCost: 0, lungeDistance: 0 };
    }

    this.comboStep = nextStep;
    this.currentAttack = def;
    this.attackTimer = 0;
    this.hitTargetsInCurrentSwing.clear();

    // Trigger visual and audio cues
    const stateName = nextStep === 1 ? 'ATTACK_LIGHT_1' : nextStep === 2 ? 'ATTACK_LIGHT_2' : 'ATTACK_LIGHT_3';
    this.animator.setState(stateName);
    this.vfx.setTrailActive(true, def.trailColor);
    this.audioManager.playSwordSwing(nextStep === 3);

    return {
      success: true,
      staminaCost: def.staminaCost,
      lungeDistance: def.forwardLunge,
    };
  }

  /**
   * Executes a high-damage heavy breaker downward cleave
   */
  public executeHeavyAttack(currentStamina: number): { success: boolean; staminaCost: number; lungeDistance: number } {
    if (this.isAttacking() || this.isHealing || this.guardBroken) {
      return { success: false, staminaCost: 0, lungeDistance: 0 };
    }

    if (this.riposteActive) {
      return this.executeRiposte(currentStamina);
    }

    const def = this.attacks.HEAVY;
    if (currentStamina < def.staminaCost) {
      return { success: false, staminaCost: 0, lungeDistance: 0 };
    }

    this.comboStep = 0; // Heavy resets light combo
    this.currentAttack = def;
    this.attackTimer = 0;
    this.hitTargetsInCurrentSwing.clear();

    this.animator.setState('ATTACK_HEAVY');
    this.vfx.setTrailActive(true, def.trailColor);
    this.audioManager.playSwordSwing(true);

    return {
      success: true,
      staminaCost: def.staminaCost,
      lungeDistance: def.forwardLunge,
    };
  }

  /**
   * Executes a devastating critical riposte attack after parrying
   */
  private executeRiposte(currentStamina: number): { success: boolean; staminaCost: number; lungeDistance: number } {
    const def = this.attacks.RIPOSTE;
    if (currentStamina < def.staminaCost) {
      return { success: false, staminaCost: 0, lungeDistance: 0 };
    }

    this.riposteActive = false;
    this.riposteTimer = 0;
    this.comboStep = 3;
    this.currentAttack = def;
    this.attackTimer = 0;
    this.hitTargetsInCurrentSwing.clear();

    this.animator.setState('ATTACK_LIGHT_3');
    this.vfx.setTrailActive(true, def.trailColor);
    this.audioManager.playSwordSwing(true);
    this.cameraManager.addShake(0.18);

    return {
      success: true,
      staminaCost: def.staminaCost,
      lungeDistance: def.forwardLunge,
    };
  }

  /**
   * Initiates parry deflection stance
   */
  public executeParry(): boolean {
    if (this.isAttacking() || this.parryActive || this.isHealing || this.guardBroken) return false;

    this.parryActive = true;
    this.parryTimer = 0;
    this.animator.setState('PARRY');
    this.audioManager.playParryClang();

    // Check if there is an attack in proximity to deflect immediately
    this.evaluateImmediateParry();
    return true;
  }

  private evaluateImmediateParry(): void {
    // If standing close to practice targets, trigger deflection starburst and open riposte window
    const heroPos = this.model.getRoot().position;
    for (const target of this.targets) {
      if (target.getPosition().distanceTo(heroPos) < 2.5) {
        this.triggerSuccessfulParry(target.getPosition());
        break;
      }
    }
  }

  public triggerSuccessfulParry(contactPoint: THREE.Vector3): void {
    this.totalParries++;
    this.riposteActive = true;
    this.riposteTimer = this.RIPOSTE_WINDOW;
    this.cameraManager.addShake(0.24);

    this.vfx.triggerParryBurst(contactPoint);
    this.vfx.addFloatingDamage(contactPoint, 0, true, 'PARRY!');
    this.audioManager.playParryClang();

    this.eventBus.emit('PARRY_SUCCESS', {
      point: contactPoint,
      riposteDuration: this.RIPOSTE_WINDOW,
    });
  }

  /**
   * Processes incoming enemy attack against player's active defensive stance:
   * - If timed parry window is active: deflects 100% damage, triggers parry clang & starburst, opens Riposte window
   * - If guard stance is active and player has stamina: mitigates 85% damage, consumes stamina based on poise damage
   * - If guard stamina depleted: triggers guard break stagger (1.2s vulnerability)
   * - Otherwise: takes full unmitigated damage
   */
  public handleIncomingAttack(
    damage: number,
    poiseDamage: number,
    currentStamina: number = 100,
    attackerPos?: THREE.Vector3
  ): {
    deflected: boolean;
    blocked: boolean;
    guardBroken: boolean;
    damageTaken: number;
    staminaCost: number;
  } {
    // 1. Check Timed Parry Window
    if (this.parryActive) {
      const contactPoint = attackerPos || this.model.getRoot().position.clone().add(new THREE.Vector3(0, 0.8, -0.6));
      this.triggerSuccessfulParry(contactPoint);
      return {
        deflected: true,
        blocked: false,
        guardBroken: false,
        damageTaken: 0,
        staminaCost: 0,
      };
    }

    // 2. Check Guard Blocking
    if (this.isGuarding && !this.guardBroken) {
      const blockStaminaCost = Math.round(poiseDamage * 0.8);
      if (currentStamina < blockStaminaCost || currentStamina <= 10) {
        // Guard Break!
        this.guardBroken = true;
        this.guardBreakTimer = 1.2;
        this.isGuarding = false;
        this.cameraManager.addShake(0.32);
        this.audioManager.playHitSound(120);
        this.vfx.triggerHitSparks(this.model.getRoot().position, new THREE.Vector3(0, 1, 0), true);
        return {
          deflected: false,
          blocked: false,
          guardBroken: true,
          damageTaken: Math.round(damage * 0.5),
          staminaCost: currentStamina,
        };
      }

      // Successful Guard Block: 85% damage mitigation
      const mitigatedDamage = Math.round(damage * 0.15);
      this.audioManager.playHitSound(260);
      this.cameraManager.addShake(0.12);
      const contact = attackerPos || this.model.getRoot().position;
      this.vfx.triggerHitSparks(contact, new THREE.Vector3(0, 1, 0), false);

      return {
        deflected: false,
        blocked: true,
        guardBroken: false,
        damageTaken: mitigatedDamage,
        staminaCost: blockStaminaCost,
      };
    }

    // 3. Unmitigated hit
    return {
      deflected: false,
      blocked: false,
      guardBroken: false,
      damageTaken: damage,
      staminaCost: 0,
    };
  }

  /**
   * Sets guard blocking state
   */
  public setGuarding(guarding: boolean): void {
    if (this.isAttacking() || this.guardBroken || this.isHealing) {
      this.isGuarding = false;
      return;
    }

    if (this.isGuarding !== guarding) {
      this.isGuarding = guarding;
      if (guarding) {
        this.animator.setState('GUARD');
      } else if (this.animator.getState() === 'GUARD') {
        this.animator.setState('IDLE');
      }
    }
  }

  /**
   * Consumable healing item (Elixir of Embers)
   */
  public executeHeal(currentHealth: number, maxHealth: number): { success: boolean; amountHealed: number } {
    if (this.isAttacking() || this.isHealing || this.elixirCount <= 0 || currentHealth >= maxHealth) {
      return { success: false, amountHealed: 0 };
    }

    this.isHealing = true;
    this.healTimer = 0;
    this.elixirCount--;
    const healAmount = 40;

    this.animator.setState('HEAL');
    const heroPos = this.model.getRoot().position;
    this.vfx.triggerHealAura(heroPos);
    this.vfx.addFloatingDamage(heroPos, healAmount, false, `+${healAmount} HP`);
    this.audioManager.playHitSound(520); // Golden chime

    return {
      success: true,
      amountHealed: healAmount,
    };
  }

  /**
   * Main combat update loop
   */
  public update(deltaTime: number, camera: THREE.Camera): void {
    // 1. Process Hit-Stop Micro-Freeze
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= deltaTime;
      if (this.hitStopTimer > 0) {
        return; // Pause animation & updates during micro-freeze for AAA crunch
      }
    }

    // 2. Update Sword Blade Ribbon Trail
    const tipPos = new THREE.Vector3();
    const basePos = new THREE.Vector3();
    this.model.getSwordTipWorldPosition(tipPos);
    this.model.getSwordBaseWorldPosition(basePos);
    this.vfx.updateBladeTrail(tipPos, basePos, deltaTime);

    // 3. Update active attack progression
    if (this.isAttacking()) {
      this.attackTimer += deltaTime;
      const progress = this.attackTimer / this.currentAttack.duration;

      // Check active hitbox damage window
      if (progress >= this.currentAttack.hitWindowStart && progress <= this.currentAttack.hitWindowEnd) {
        this.performHitboxTrace(tipPos, basePos);
      }

      if (this.attackTimer >= this.currentAttack.duration) {
        this.finishAttack();
      }
    }

    // 4. Update Combo Reset Timer
    if (!this.isAttacking() && this.comboStep > 0) {
      this.comboResetTimer -= deltaTime;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
        this.comboStreak = 0;
      }
    }

    // 5. Update Parry Timer
    if (this.parryActive) {
      this.parryTimer += deltaTime;
      if (this.parryTimer >= this.PARRY_WINDOW) {
        this.parryActive = false;
        if (this.animator.getState() === 'PARRY') {
          this.animator.setState('IDLE');
        }
      }
    }

    // 6. Update Riposte Window Timer
    if (this.riposteActive) {
      this.riposteTimer -= deltaTime;
      if (this.riposteTimer <= 0) {
        this.riposteActive = false;
        this.riposteTimer = 0;
      }
    }

    // 7. Update Guard Break Timer
    if (this.guardBroken) {
      this.guardBreakTimer -= deltaTime;
      if (this.guardBreakTimer <= 0) {
        this.guardBroken = false;
      }
    }

    // 8. Update Healing Timer
    if (this.isHealing) {
      this.healTimer += deltaTime;
      if (this.healTimer >= this.HEAL_DURATION) {
        this.isHealing = false;
        this.healTimer = 0;
        if (this.animator.getState() === 'HEAL') {
          this.animator.setState('IDLE');
        }
      }
    }

    // 9. Update VFX
    this.vfx.update(deltaTime, camera);
  }

  /**
   * Evaluates sword blade collision against registered damageable entities
   */
  private performHitboxTrace(bladeTip: THREE.Vector3, bladeBase: THREE.Vector3): void {
    const heroPos = this.model.getRoot().position;
    const heroForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.getRoot().rotation.y);

    for (const target of this.targets) {
      if (this.hitTargetsInCurrentSwing.has(target) || !target.isAlive()) continue;

      const targetPos = target.getPosition();
      const radius = target.getHitboxRadius();

      // Check distance from sword blade line segment to target center
      const dist = this.distancePointToSegment(targetPos, bladeBase, bladeTip);

      // Check forward cone (120 degree arc in front of Anuki)
      const toTarget = new THREE.Vector3().subVectors(targetPos, heroPos).normalize();
      const dot = heroForward.dot(toTarget);

      if (dist <= radius + 0.35 && dot > -0.2) {
        this.hitTargetsInCurrentSwing.add(target);
        this.applyHitToTarget(target, bladeTip);
      }
    }
  }

  private applyHitToTarget(target: IDamageable, hitPoint: THREE.Vector3): void {
    const isCritical = this.currentAttack.type === 'RIPOSTE' || (this.comboStep === 3 && Math.random() < 0.4);
    const multiplier = Math.min(2.5, 1.0 + (this.comboStreak > 1 ? (this.comboStreak - 1) * 0.15 : 0));
    const finalDamage = Math.round(this.currentAttack.damage * multiplier * (isCritical ? 1.8 : 1.0));
    const isHeavy = this.currentAttack.type === 'HEAVY' || this.currentAttack.type === 'RIPOSTE' || this.comboStep === 3;

    const hitNormal = new THREE.Vector3().subVectors(hitPoint, target.getPosition()).normalize();
    if (hitNormal.lengthSq() < 0.01) hitNormal.set(0, 1, 0);

    // Apply damage to target
    const result = target.takeDamage(
      finalDamage,
      this.currentAttack.poiseDamage,
      hitPoint,
      hitNormal,
      isHeavy,
      isCritical
    );

    // Increment combo
    this.comboStreak++;
    if (this.comboStreak > this.maxComboStreak) {
      this.maxComboStreak = this.comboStreak;
    }
    this.totalDamageDealt += finalDamage;

    // Contact Sparks & Impact VFX
    this.vfx.triggerHitSparks(hitPoint, hitNormal, isHeavy);
    this.vfx.addFloatingDamage(hitPoint, finalDamage, isCritical);

    // Sound
    this.audioManager.playHitSound(isHeavy ? 160 : 280);

    // Camera impulse
    const shake = isCritical ? 0.35 : isHeavy ? 0.22 : 0.10;
    this.cameraManager.addShake(shake);

    // Hit-stop micro-freeze (PRD Section 9: under 100ms)
    this.hitStopTimer = this.currentAttack.hitStopMs / 1000;

    // Dispatch event to EventBus
    this.eventBus.emit('COMBAT_HIT', {
      targetName: result.targetName,
      damage: finalDamage,
      isCritical,
      poiseBroken: result.poiseBroken,
      comboStreak: this.comboStreak,
      attackType: this.currentAttack.type,
    });
  }

  private finishAttack(): void {
    this.currentAttack = this.attacks.NONE;
    this.vfx.setTrailActive(false);
    this.comboResetTimer = this.COMBO_WINDOW;

    if (this.animator.getState().startsWith('ATTACK')) {
      this.animator.setState('IDLE');
    }
  }

  private distancePointToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ap = new THREE.Vector3().subVectors(p, a);

    const abLenSq = ab.lengthSq();
    if (abLenSq === 0) return ap.length();

    const t = Math.max(0, Math.min(1, ap.dot(ab) / abLenSq));
    const closest = new THREE.Vector3().copy(a).addScaledVector(ab, t);
    return p.distanceTo(closest);
  }

  public dispose(): void {
    this.vfx.dispose();
    this.targets = [];
  }
}
