/**
 * Enemy and Boss AI Type Definitions - Step 6: Human Knight Enemies & Intelligent AI
 * Conforming strictly to PRD Section 6, 9, 12 ("Sir Garrick Ironjaw, the Gatekeeper").
 */

import * as THREE from 'three';
import { IDamageable } from '../combat/CombatTypes';

export type GarrickAIState =
  | 'SPAWNING'
  | 'IDLE_GUARD'
  | 'APPROACH'
  | 'TELEGRAPH_SWEEP'
  | 'ATTACK_SWEEP'
  | 'TELEGRAPH_SLAM'
  | 'ATTACK_SLAM'
  | 'ATTACK_STOMP'
  | 'PUNISH_RECOVERY'
  | 'STAGGERED'
  | 'TRANSITION_PHASE_2'
  | 'DEFEATED_KNEEL';

export type BossPhase = 1 | 2;

export interface BossStats {
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  poise: number;
  maxPoise: number;
  phase: BossPhase;
  state: string;
  isStaggered: boolean;
  isDefeated: boolean;
}

export interface BossAttackDef {
  id: string;
  name: string;
  telegraphDuration: number;
  attackDuration: number;
  recoveryDuration: number;
  damage: number;
  poiseDamage: number;
  hitRadius: number;
  hitArcDeg: number;
  forwardImpulse: number;
  isUnblockable?: boolean;
}

export interface IBossEnemy extends IDamageable {
  getBossStats(): BossStats;
  getRoot(): THREE.Group;
  getPosition(): THREE.Vector3;
  update(deltaTime: number, playerPos: THREE.Vector3): void;
  resetBoss?(): void;
  onAttackPlayerHit?: (damage: number, poiseDamage: number, hitPos: THREE.Vector3) => void;
  onParriedByPlayer?(): void;
}

export type IGarrickBoss = IBossEnemy;

