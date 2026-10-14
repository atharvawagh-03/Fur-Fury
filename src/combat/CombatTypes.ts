/**
 * Combat System Type Definitions
 * Conforming to PRD Section 9 ("Combat system requirements"):
 * - Light 3-hit combo chain, Heavy breaker strike, Parry & Riposte, Guard block, and Consumable Heal.
 */

import * as THREE from 'three';

export type AttackType =
  | 'NONE'
  | 'LIGHT_1'
  | 'LIGHT_2'
  | 'LIGHT_3'
  | 'HEAVY'
  | 'RIPOSTE';

export interface AttackDefinition {
  type: AttackType;
  name: string;
  damage: number;
  poiseDamage: number;
  staminaCost: number;
  duration: number;        // Total animation duration in seconds
  hitWindowStart: number;  // Normalized progress (0..1) when hitbox becomes active
  hitWindowEnd: number;    // Normalized progress (0..1) when hitbox finishes
  hitStopMs: number;       // Micro-freeze impact duration (under 100ms per PRD Section 9)
  forwardLunge: number;    // Forward movement impulse in meters
  trailColor: number;      // Hex color for blade ribbon trail
}

export interface DamageResult {
  hit: boolean;
  damageDealt: number;
  poiseBroken: boolean;
  isCritical: boolean;
  currentHealth: number;
  maxHealth: number;
  targetName: string;
}

export interface IDamageable {
  takeDamage(
    amount: number,
    poiseDamage: number,
    hitPoint: THREE.Vector3,
    hitNormal: THREE.Vector3,
    isHeavy: boolean,
    isCritical?: boolean
  ): DamageResult;
  getPosition(): THREE.Vector3;
  getHitboxRadius(): number;
  isAlive(): boolean;
}

export interface FloatingDamageText {
  id: number;
  position: THREE.Vector3;
  text: string;
  isCritical: boolean;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
  color: string;
}

export interface CombatStats {
  comboCount: number;
  comboMultiplier: number;
  maxCombo: number;
  totalDamageDealt: number;
  parryCount: number;
  riposteActive: boolean;
  riposteTimer: number;
  elixirCount: number;
  maxElixirs: number;
  isGuarding: boolean;
  guardBroken: boolean;
}
