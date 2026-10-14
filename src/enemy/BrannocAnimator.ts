/**
 * Procedural Animation Controller for Sir Brannoc Cinderhand, the Forge Warden
 * Conforming strictly to PRD Section 6, 9, 12:
 * - Imposing heavy smith powerhouse kinematics
 * - Distinct telegraphed seismic slams and sweeping arcs
 * - Extended punish recovery when hammer is lodged in ground
 * - Honorable defeat surrender kneel resting on hammer haft
 */

import { BrannocRig } from './BrannocModel';

export type BrannocAIState =
  | 'IDLE_GUARD'
  | 'APPROACH'
  | 'TELEGRAPH_SLAM'
  | 'ATTACK_SLAM'
  | 'TELEGRAPH_SWEEP'
  | 'ATTACK_SWEEP'
  | 'PUNISH_RECOVERY'
  | 'STAGGERED'
  | 'TRANSITION_PHASE_2'
  | 'DEFEATED_KNEEL';

export class BrannocAnimator {
  private rig: BrannocRig;
  private state: BrannocAIState = 'IDLE_GUARD';
  private stateTime: number = 0;
  private animProgress: number = 0;
  private animDuration: number = 1.0;

  constructor(rig: BrannocRig) {
    this.rig = rig;
  }

  public setState(state: BrannocAIState, duration: number = 1.0): void {
    if (this.state !== state) {
      this.state = state;
      this.stateTime = 0;
      this.animProgress = 0;
      this.animDuration = Math.max(0.01, duration);
    }
  }

  public getState(): BrannocAIState {
    return this.state;
  }

  public getProgress(): number {
    return Math.min(1.0, this.animProgress);
  }

  public update(deltaTime: number): void {
    this.stateTime += deltaTime;
    this.animProgress = this.stateTime / this.animDuration;

    this.resetPose();

    switch (this.state) {
      case 'IDLE_GUARD':
        this.animateIdleGuard(this.stateTime);
        break;
      case 'APPROACH':
        this.animateApproach(this.stateTime);
        break;
      case 'TELEGRAPH_SLAM':
        this.animateTelegraphSlam(this.animProgress);
        break;
      case 'ATTACK_SLAM':
        this.animateAttackSlam(this.animProgress);
        break;
      case 'TELEGRAPH_SWEEP':
        this.animateTelegraphSweep(this.animProgress);
        break;
      case 'ATTACK_SWEEP':
        this.animateAttackSweep(this.animProgress);
        break;
      case 'PUNISH_RECOVERY':
        this.animatePunishRecovery(this.animProgress);
        break;
      case 'STAGGERED':
        this.animateStaggered(this.animProgress);
        break;
      case 'TRANSITION_PHASE_2':
        this.animatePhase2Transition(this.animProgress);
        break;
      case 'DEFEATED_KNEEL':
        this.animateDefeatedKneel(this.animProgress);
        break;
    }
  }

  private resetPose(): void {
    const r = this.rig;
    r.hips.position.set(0, 1.10, 0);
    r.hips.rotation.set(0, 0, 0);
    r.spine.rotation.set(0, 0, 0);
    r.chest.rotation.set(0, 0, 0);
    r.neck.rotation.set(0, 0, 0);
    r.head.rotation.set(0, 0, 0);

    r.leftShoulder.rotation.set(0, 0, 0);
    r.leftUpperArm.rotation.set(0, 0, 0);
    r.leftForearm.rotation.set(0, 0, 0);
    r.leftHand.rotation.set(0, 0, 0);

    r.rightShoulder.rotation.set(0, 0, 0);
    r.rightUpperArm.rotation.set(0, 0, 0);
    r.rightForearm.rotation.set(0, 0, 0);
    r.rightHand.rotation.set(0, 0, 0);

    r.warhammer.position.set(0, 0, 0);
    r.warhammer.rotation.set(0, 0, 0);

    r.leftThigh.rotation.set(0, 0, 0);
    r.leftShin.rotation.set(0, 0, 0);
    r.leftFoot.rotation.set(0, 0, 0);

    r.rightThigh.rotation.set(0, 0, 0);
    r.rightShin.rotation.set(0, 0, 0);
    r.rightFoot.rotation.set(0, 0, 0);
  }

  private animateIdleGuard(time: number): void {
    const r = this.rig;
    const breathe = Math.sin(time * 2.0) * 0.025;

    r.hips.position.y = 1.10 + breathe;
    r.chest.rotation.x = -breathe * 0.5;

    // Both arms hold warhammer diagonally across chest
    r.rightUpperArm.rotation.x = 0.7;
    r.rightUpperArm.rotation.y = -0.3;
    r.rightForearm.rotation.x = -0.5;

    r.leftUpperArm.rotation.x = 0.5;
    r.leftUpperArm.rotation.y = 0.4;
    r.leftForearm.rotation.x = -0.6;

    r.warhammer.rotation.set(0.4, 0.2, -0.3);

    // Sturdy wide stance
    r.leftThigh.rotation.z = -0.15;
    r.rightThigh.rotation.z = 0.15;
  }

  private animateApproach(time: number): void {
    const r = this.rig;
    const stepSpeed = 4.5;
    const legCycle = Math.sin(time * stepSpeed);

    // Heavy earth-rumbling gait
    r.hips.position.y = 1.10 + Math.abs(Math.sin(time * stepSpeed)) * 0.08;
    r.hips.rotation.y = Math.sin(time * (stepSpeed * 0.5)) * 0.15;

    r.leftThigh.rotation.x = legCycle * 0.5;
    r.leftShin.rotation.x = Math.max(0, -legCycle * 0.4);
    r.rightThigh.rotation.x = -legCycle * 0.5;
    r.rightShin.rotation.x = Math.max(0, legCycle * 0.4);

    // Hammer swaying with march
    r.rightUpperArm.rotation.x = 0.6 + legCycle * 0.15;
    r.rightForearm.rotation.x = -0.4;
    r.warhammer.rotation.set(0.3, 0.1, -0.2);
  }

  private animateTelegraphSlam(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // High overhead windup, arching spine back
    r.hips.position.y = 1.05;
    r.spine.rotation.x = -0.35 * p;
    r.chest.rotation.x = -0.25 * p;

    // Both arms raise massive hammer high overhead
    r.rightUpperArm.rotation.x = 2.4 * p;
    r.rightForearm.rotation.x = 0.4 * p;
    r.leftUpperArm.rotation.x = 2.2 * p;
    r.leftUpperArm.rotation.y = 0.4 * p;
    r.leftForearm.rotation.x = 0.4 * p;

    r.warhammer.rotation.set(-1.2 * p, 0, 0);

    // Back leg braced
    r.rightThigh.rotation.x = -0.3 * p;
    r.leftThigh.rotation.x = 0.3 * p;
  }

  private animateAttackSlam(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Crushing downward smash
    r.hips.position.y = 0.95 - p * 0.15;
    r.spine.rotation.x = 0.45 * p;
    r.chest.rotation.x = 0.35 * p;

    r.rightUpperArm.rotation.x = 2.4 - p * 2.8; // Brings down to -0.4
    r.rightForearm.rotation.x = -0.2;
    r.leftUpperArm.rotation.x = 2.2 - p * 2.6;
    r.leftForearm.rotation.x = -0.2;

    r.warhammer.rotation.set(1.4 * p, 0, 0);
  }

  private animateTelegraphSweep(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Torso twists hard right to wind up horizontal sweep
    r.hips.rotation.y = -0.7 * p;
    r.spine.rotation.y = -0.5 * p;

    r.rightUpperArm.rotation.x = 0.8 * p;
    r.rightUpperArm.rotation.y = -0.8 * p;
    r.warhammer.rotation.set(0, -1.2 * p, 0.4 * p);
  }

  private animateAttackSweep(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // 180-degree horizontal sweeping rotation
    r.hips.rotation.y = -0.7 + p * 1.5;
    r.spine.rotation.y = -0.5 + p * 1.2;

    r.rightUpperArm.rotation.x = 0.8;
    r.rightUpperArm.rotation.y = -0.8 + p * 1.8;
    r.warhammer.rotation.set(0, -1.2 + p * 2.4, 0);
  }

  private animatePunishRecovery(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);
    const struggle = Math.sin(progress * 12.0) * (1.0 - p) * 0.06;

    // Hammer wedged into ground, pulling to free it
    r.hips.position.y = 0.85;
    r.spine.rotation.x = 0.4 + struggle;

    r.rightUpperArm.rotation.x = -0.2;
    r.leftUpperArm.rotation.x = -0.2;
    r.warhammer.rotation.set(1.4, 0, 0);
  }

  private animateStaggered(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);
    const wobble = Math.sin(progress * 14.0) * (1.0 - p) * 0.15;

    // Stumbling back heavily
    r.hips.position.y = 1.0;
    r.hips.position.z = -0.3 * (1.0 - p);
    r.spine.rotation.x = -0.3;
    r.head.rotation.x = -0.2 + wobble;

    r.rightUpperArm.rotation.x = 0.2;
    r.leftUpperArm.rotation.x = 0.2;
  }

  private animatePhase2Transition(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Roars, raises hammer skyward, furnace flaring
    r.hips.position.y = 1.15;
    r.spine.rotation.x = -0.4 * p;
    r.head.rotation.x = -0.4 * p;

    r.rightUpperArm.rotation.x = 2.5 * p;
    r.leftUpperArm.rotation.x = 2.5 * p;
    r.warhammer.rotation.set(-0.8 * p, 0, 0);
  }

  private animateDefeatedKneel(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Heavy knee to ground, resting on warhammer shaft
    r.hips.position.y = 1.10 - p * 0.52; // Pelvis down to 0.58m
    r.spine.rotation.x = 0.35 * p;
    r.head.rotation.x = 0.30 * p;

    // Both hands draped on top of hammer haft
    r.rightUpperArm.rotation.x = 0.8 * p;
    r.leftUpperArm.rotation.x = 0.8 * p;

    r.warhammer.position.set(0, -0.3 * p, 0.4 * p);
    r.warhammer.rotation.set(0.1, 0, 0);

    // Left knee down
    r.leftThigh.rotation.x = 0.9 * p;
    r.leftShin.rotation.x = 1.4 * p;
    r.rightThigh.rotation.x = -0.2 * p;
    r.rightShin.rotation.x = 0.7 * p;
  }
}
