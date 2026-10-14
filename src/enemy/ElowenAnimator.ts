/**
 * Procedural Animation Controller for Dame Elowen Vale, the Rose Sentinel
 * Conforming strictly to PRD Section 6 & 12:
 * - Fluid high-speed fencing kinematics & duelist footwork
 * - Distinct telegraphed thrusts, feints, and parry stance
 * - Clear punish recovery openings
 * - Fencer's honorable surrender kneel with rapier planted tip-down
 */

import { ElowenRig } from './ElowenModel';

export type ElowenAIState =
  | 'IDLE_DUELIST'
  | 'APPROACH'
  | 'TELEGRAPH_THRUST'
  | 'ATTACK_THRUST'
  | 'TELEGRAPH_LUNGE'
  | 'ATTACK_LUNGE'
  | 'PARRY_STANCE'
  | 'PUNISH_RECOVERY'
  | 'STAGGERED'
  | 'TRANSITION_PHASE_2'
  | 'DEFEATED_KNEEL';

export class ElowenAnimator {
  private rig: ElowenRig;
  private state: ElowenAIState = 'IDLE_DUELIST';
  private stateTime: number = 0;
  private animProgress: number = 0;
  private animDuration: number = 1.0;

  constructor(rig: ElowenRig) {
    this.rig = rig;
  }

  public setState(state: ElowenAIState, duration: number = 1.0): void {
    if (this.state !== state) {
      this.state = state;
      this.stateTime = 0;
      this.animProgress = 0;
      this.animDuration = Math.max(0.01, duration);
    }
  }

  public getState(): ElowenAIState {
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
      case 'IDLE_DUELIST':
        this.animateIdleDuelist(this.stateTime);
        break;
      case 'APPROACH':
        this.animateApproach(this.stateTime);
        break;
      case 'TELEGRAPH_THRUST':
        this.animateTelegraphThrust(this.animProgress);
        break;
      case 'ATTACK_THRUST':
        this.animateAttackThrust(this.animProgress);
        break;
      case 'TELEGRAPH_LUNGE':
        this.animateTelegraphLunge(this.animProgress);
        break;
      case 'ATTACK_LUNGE':
        this.animateAttackLunge(this.animProgress);
        break;
      case 'PARRY_STANCE':
        this.animateParryStance(this.stateTime);
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
    r.hips.position.set(0, 1.0, 0);
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

    r.rapier.position.set(0, 0, 0);
    r.rapier.rotation.set(Math.PI / 2, 0, 0);

    r.leftThigh.rotation.set(0, 0, 0);
    r.leftShin.rotation.set(0, 0, 0);
    r.leftFoot.rotation.set(0, 0, 0);

    r.rightThigh.rotation.set(0, 0, 0);
    r.rightShin.rotation.set(0, 0, 0);
    r.rightFoot.rotation.set(0, 0, 0);
  }

  private animateIdleDuelist(time: number): void {
    const r = this.rig;
    const breathe = Math.sin(time * 2.8) * 0.03;

    // Elegant sideway fencing stance
    r.hips.position.y = 1.0 + breathe;
    r.hips.rotation.y = -0.45; // Angled body profile
    r.chest.rotation.y = 0.25;
    r.chest.rotation.z = -0.04;

    // Left arm arched back gracefully behind hip
    r.leftShoulder.rotation.z = -0.2;
    r.leftUpperArm.rotation.x = -0.5;
    r.leftUpperArm.rotation.y = 0.3;
    r.leftForearm.rotation.x = -0.7;

    // Right arm poised holding rapier pointed towards player
    r.rightUpperArm.rotation.x = 0.6 + breathe * 0.5;
    r.rightUpperArm.rotation.y = -0.3;
    r.rightForearm.rotation.x = -0.4;
    r.rightHand.rotation.x = 0.2;
    r.rapier.rotation.set(Math.PI / 2 + 0.1, 0, -0.2);

    // Legs in agile fencing stance
    r.leftThigh.rotation.x = -0.15;
    r.leftShin.rotation.x = 0.15;
    r.rightThigh.rotation.x = 0.22;
    r.rightShin.rotation.x = -0.10;
  }

  private animateApproach(time: number): void {
    const r = this.rig;
    const stepSpeed = 8.0;
    const legCycle = Math.sin(time * stepSpeed);

    // Quick agile fencing advances
    r.hips.position.y = 1.0 + Math.abs(Math.sin(time * stepSpeed)) * 0.05;
    r.hips.rotation.y = -0.35;
    r.chest.rotation.y = 0.20;

    r.leftThigh.rotation.x = legCycle * 0.45;
    r.leftShin.rotation.x = Math.max(0, -legCycle * 0.5);
    r.rightThigh.rotation.x = -legCycle * 0.45;
    r.rightShin.rotation.x = Math.max(0, legCycle * 0.5);

    // Left arm balanced
    r.leftUpperArm.rotation.x = -0.4;
    r.leftForearm.rotation.x = -0.6;

    // Right arm ready to thrust
    r.rightUpperArm.rotation.x = 0.5;
    r.rightUpperArm.rotation.y = -0.2;
    r.rightForearm.rotation.x = -0.3;
    r.rapier.rotation.set(Math.PI / 2 + 0.05, 0, -0.15);
  }

  private animateTelegraphThrust(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Pulls blade back tight to chest, coiling energy
    r.hips.position.y = 0.96;
    r.hips.rotation.y = -0.55;
    r.chest.rotation.y = 0.40;

    r.rightUpperArm.rotation.x = 0.8 * p;
    r.rightUpperArm.rotation.y = -0.45 * p;
    r.rightUpperArm.position.z = -0.12 * p;
    r.rightForearm.rotation.x = -0.8 * p;
    r.rightHand.rotation.x = -0.3 * p;

    r.leftUpperArm.rotation.x = -0.7 * p;
    r.leftForearm.rotation.x = -0.9 * p;

    r.leftThigh.rotation.x = -0.25;
    r.rightThigh.rotation.x = 0.35;
  }

  private animateAttackThrust(progress: number): void {
    const r = this.rig;
    // 3 rapid jabs cycle (0 to 1 over attack duration)
    const cycle = (progress * 3) % 1.0;
    const jabPhase = Math.sin(cycle * Math.PI);

    r.hips.position.y = 0.95;
    r.hips.position.z = progress * 0.4;
    r.chest.rotation.y = 0.15;

    // Rapid straight needle thrust forward
    r.rightUpperArm.rotation.x = 1.4 - jabPhase * 0.3;
    r.rightUpperArm.position.z = jabPhase * 0.35;
    r.rightForearm.rotation.x = -0.1 + jabPhase * 0.2;
    r.rapier.rotation.set(Math.PI / 2 - jabPhase * 0.15, 0, 0);

    r.rightThigh.rotation.x = 0.4;
    r.leftThigh.rotation.x = -0.3;
  }

  private animateTelegraphLunge(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Deep crouch and back-step coiling for maximum reach
    r.hips.position.y = 0.88;
    r.hips.rotation.y = -0.6;
    r.spine.rotation.x = 0.25 * p;

    r.rightUpperArm.rotation.x = 0.9;
    r.rightForearm.rotation.x = -0.95;

    r.leftThigh.rotation.x = -0.4 * p;
    r.leftShin.rotation.x = 0.5 * p;
    r.rightThigh.rotation.x = 0.5 * p;
    r.rightShin.rotation.x = -0.3 * p;
  }

  private animateAttackLunge(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Massive extended classical duelist lunge
    r.hips.position.y = 0.72;
    r.hips.position.z = p * 0.8;
    r.spine.rotation.x = 0.15;
    r.chest.rotation.y = 0.1;

    // Right arm completely locked straight forward
    r.rightUpperArm.rotation.x = 1.55;
    r.rightForearm.rotation.x = 0;
    r.rightHand.rotation.x = 0;
    r.rapier.rotation.set(Math.PI / 2, 0, 0);

    // Left arm thrown back horizontally for balance
    r.leftUpperArm.rotation.x = -1.2;
    r.leftForearm.rotation.x = -0.2;

    // Front knee bent 90 degrees, rear leg locked straight
    r.rightThigh.rotation.x = 0.75;
    r.rightShin.rotation.x = 0.35;
    r.leftThigh.rotation.x = -0.65;
    r.leftShin.rotation.x = 0.05;
  }

  private animateParryStance(time: number): void {
    const r = this.rig;
    const shimmer = Math.sin(time * 6.0) * 0.02;

    // Defensive high-guard swept basket hilt held across chest
    r.hips.position.y = 0.96;
    r.hips.rotation.y = -0.2;
    r.chest.rotation.y = -0.15;

    r.rightUpperArm.rotation.x = 1.1 + shimmer;
    r.rightUpperArm.rotation.y = -0.5;
    r.rightForearm.rotation.x = -0.9;
    r.rightHand.rotation.x = 0.4;
    // Rapier blade held vertically protecting chest
    r.rapier.rotation.set(Math.PI * 0.8, -0.2, 0.4);

    r.leftUpperArm.rotation.x = -0.3;
    r.leftForearm.rotation.x = -0.5;
  }

  private animatePunishRecovery(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Overextended lunge, struggling to recover footing
    r.hips.position.y = 0.78 + p * 0.18;
    r.spine.rotation.x = 0.25 * (1.0 - p);

    r.rightUpperArm.rotation.x = 1.3 - p * 0.6;
    r.rightForearm.rotation.x = -0.2;

    r.rightThigh.rotation.x = 0.6 * (1.0 - p);
    r.leftThigh.rotation.x = -0.5 * (1.0 - p);
  }

  private animateStaggered(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);
    const wobble = Math.sin(progress * 15.0) * (1.0 - p) * 0.12;

    // Recoiling backward, blade knocked aside
    r.hips.position.y = 0.92;
    r.hips.position.z = -0.25 * (1.0 - p);
    r.spine.rotation.x = -0.25;
    r.head.rotation.x = -0.2 + wobble;

    r.rightUpperArm.rotation.x = 0.3;
    r.rightUpperArm.rotation.z = 0.6 + wobble;
    r.rapier.rotation.set(0.3, 0.5, 0);

    r.leftUpperArm.rotation.x = -0.4;
    r.leftUpperArm.rotation.z = -0.5;
  }

  private animatePhase2Transition(progress: number): void {
    const r = this.rig;
    // Elegant pirouette spin
    const spin = progress * Math.PI * 2;
    r.hips.rotation.y = spin;
    r.hips.position.y = 1.0 + Math.sin(progress * Math.PI) * 0.15;

    r.rightUpperArm.rotation.x = 1.2;
    r.rightUpperArm.rotation.z = 0.4;
    r.leftUpperArm.rotation.x = 1.2;
    r.leftUpperArm.rotation.z = -0.4;
  }

  private animateDefeatedKneel(progress: number): void {
    const r = this.rig;
    const p = Math.min(1.0, progress);

    // Sinks gracefully onto one knee
    r.hips.position.y = 1.0 - p * 0.48; // Pelvis down to 0.52m
    r.hips.position.z = -p * 0.1;
    r.spine.rotation.x = 0.22 * p;
    r.head.rotation.x = 0.28 * p; // Respectful head bow

    // Both hands rest solemnly atop the rapier pommel
    r.rightUpperArm.rotation.x = 0.6 * p;
    r.rightForearm.rotation.x = -0.5 * p;
    r.leftUpperArm.rotation.x = 0.6 * p;
    r.leftForearm.rotation.x = -0.5 * p;

    // Rapier planted tip-first into the cobblestone ground
    r.rapier.rotation.set(0, 0, 0);
    r.rapier.position.set(0, -0.2 * p, 0.3 * p);

    // Left knee grounded, right foot forward
    r.leftThigh.rotation.x = 0.8 * p;
    r.leftShin.rotation.x = 1.4 * p;
    r.rightThigh.rotation.x = -0.3 * p;
    r.rightShin.rotation.x = 0.8 * p;
  }
}
