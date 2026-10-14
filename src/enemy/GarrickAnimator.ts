/**
 * Procedural Animation Controller for Sir Garrick Ironjaw
 * Conforming strictly to PRD Section 6, 9, 12:
 * - Imposing heavy armored human kinematics
 * - Distinct telegraphed attack windups (Sweep, Slam, Stomp)
 * - Clear punish recovery openings
 * - Honorable defeat kneel surrender
 */

import { GarrickRig } from './GarrickModel';
import { GarrickAIState } from './EnemyTypes';

export class GarrickAnimator {
  private rig: GarrickRig;
  private state: GarrickAIState = 'IDLE_GUARD';
  private stateTime: number = 0;
  private animProgress: number = 0;
  private animDuration: number = 1.0;

  constructor(rig: GarrickRig) {
    this.rig = rig;
  }

  public setState(state: GarrickAIState, duration: number = 1.0): void {
    if (this.state !== state) {
      this.state = state;
      this.stateTime = 0;
      this.animProgress = 0;
      this.animDuration = Math.max(0.01, duration);
    }
  }

  public getState(): GarrickAIState {
    return this.state;
  }

  public getProgress(): number {
    return Math.min(1.0, this.animProgress);
  }

  public update(deltaTime: number): void {
    this.stateTime += deltaTime;
    this.animProgress = this.stateTime / this.animDuration;

    // Reset default joint rotations
    this.resetPose();

    switch (this.state) {
      case 'IDLE_GUARD':
        this.animateIdleGuard(this.stateTime);
        break;
      case 'APPROACH':
        this.animateApproach(this.stateTime);
        break;
      case 'TELEGRAPH_SWEEP':
        this.animateTelegraphSweep(this.animProgress);
        break;
      case 'ATTACK_SWEEP':
        this.animateAttackSweep(this.animProgress);
        break;
      case 'TELEGRAPH_SLAM':
        this.animateTelegraphSlam(this.animProgress);
        break;
      case 'ATTACK_SLAM':
        this.animateAttackSlam(this.animProgress);
        break;
      case 'ATTACK_STOMP':
        this.animateAttackStomp(this.animProgress);
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
    r.hips.position.set(0, 1.05, 0);
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

    r.halberd.rotation.set(Math.PI / 2, 0, 0);
    r.halberd.position.set(0, 0, 0);

    r.leftThigh.rotation.set(0, 0, 0);
    r.leftShin.rotation.set(0, 0, 0);
    r.leftFoot.rotation.set(0, 0, 0);

    r.rightThigh.rotation.set(0, 0, 0);
    r.rightShin.rotation.set(0, 0, 0);
    r.rightFoot.rotation.set(0, 0, 0);
  }

  private animateIdleGuard(time: number): void {
    const r = this.rig;
    const breath = Math.sin(time * 2.2) * 0.04;

    // Resolute combat stance
    r.hips.position.y = 1.03 + breath * 0.5;
    r.chest.rotation.x = 0.08 + breath;
    r.chest.rotation.y = -0.15; // Slanted combat guard stance

    // Right arm holds halberd diagonally across front
    r.rightShoulder.rotation.set(-0.2, -0.2, 0.3);
    r.rightUpperArm.rotation.set(-0.4, 0.2, -0.3);
    r.rightForearm.rotation.set(0.6, 0.3, 0);
    r.rightHand.rotation.set(0.2, 0, 0);

    r.halberd.rotation.set(1.2, 0.4, -0.3);

    // Left arm braced forward to stabilize weapon
    r.leftShoulder.rotation.set(0.1, 0.2, -0.3);
    r.leftUpperArm.rotation.set(-0.3, -0.3, 0.4);
    r.leftForearm.rotation.set(0.7, -0.2, 0);

    // Legs spaced in balanced combat stance
    r.leftThigh.rotation.set(-0.15, 0.2, -0.1);
    r.leftShin.rotation.set(0.25, 0, 0);
    r.rightThigh.rotation.set(0.20, -0.2, 0.1);
    r.rightShin.rotation.set(0.15, 0, 0);
  }

  private animateApproach(time: number): void {
    const r = this.rig;
    const stride = time * 4.2;
    const legSwing = Math.sin(stride) * 0.55;
    const verticalBounce = Math.abs(Math.sin(stride)) * 0.06;

    r.hips.position.y = 1.03 + verticalBounce;
    r.chest.rotation.y = -Math.sin(stride) * 0.15;
    r.chest.rotation.x = 0.12;

    // Alternating leg stride
    r.leftThigh.rotation.x = legSwing;
    r.leftShin.rotation.x = legSwing < 0 ? -legSwing * 0.8 : 0.1;
    r.rightThigh.rotation.x = -legSwing;
    r.rightShin.rotation.x = legSwing > 0 ? legSwing * 0.8 : 0.1;

    // Halberd carried at ready while advancing
    r.rightUpperArm.rotation.set(-0.5, 0.2, -0.3);
    r.rightForearm.rotation.set(0.7, 0, 0);
    r.halberd.rotation.set(1.0 + Math.sin(stride) * 0.1, 0.2, -0.2);

    r.leftUpperArm.rotation.set(0.3 * Math.sin(stride), -0.2, 0.3);
  }

  private animateTelegraphSweep(p: number): void {
    const r = this.rig;
    const pullBack = Math.sin(p * Math.PI * 0.5);

    // Torso winds up heavily to right flank
    r.hips.position.y = 0.98;
    r.spine.rotation.y = pullBack * 0.85;
    r.chest.rotation.y = pullBack * 0.45;
    r.chest.rotation.x = 0.15;

    // Pulls halberd horizontally behind right hip
    r.rightShoulder.rotation.set(-0.1, pullBack * 0.6, 0.4);
    r.rightUpperArm.rotation.set(-0.6 * pullBack, -0.4 * pullBack, -0.5);
    r.rightForearm.rotation.set(0.8, -0.3, 0);
    r.halberd.rotation.set(0.3, 1.2 * pullBack, -0.8);

    r.leftUpperArm.rotation.set(-0.2, 0.6 * pullBack, 0.5);
    r.head.rotation.y = -pullBack * 0.6; // Eyes locked forward on player
  }

  private animateAttackSweep(p: number): void {
    const r = this.rig;
    // Explosive forward swing
    const swing = Math.sin(p * Math.PI);
    const followThrough = p > 0.5 ? (p - 0.5) * 2 : 0;

    r.hips.position.y = 1.0 - swing * 0.08;
    r.spine.rotation.y = 0.85 - p * 1.8; // Sweeps from +0.85 to -0.95 rad (105 degrees!)
    r.chest.rotation.x = 0.22 - followThrough * 0.1;

    // Halberd sweeps forward at horizontal chest/waist level
    r.rightUpperArm.rotation.set(-0.8, -0.2, 0.4);
    r.rightForearm.rotation.set(0.4, 0.2, 0);
    r.halberd.rotation.set(0.2, -0.5 + p * 1.8, 0);

    r.leftUpperArm.rotation.set(-0.4, -0.4, 0.3);
  }

  private animateTelegraphSlam(p: number): void {
    const r = this.rig;
    const lift = Math.sin(p * Math.PI * 0.5);

    // Arches back and raises halberd high overhead with both hands
    r.hips.position.y = 1.08 + lift * 0.05;
    r.chest.rotation.x = -lift * 0.28; // Leans backward

    r.rightShoulder.rotation.set(-lift * 1.4, 0, 0.2);
    r.rightUpperArm.rotation.set(-lift * 1.6, 0, -0.2);
    r.rightForearm.rotation.set(0.4, 0, 0);

    r.leftShoulder.rotation.set(-lift * 1.4, 0, -0.2);
    r.leftUpperArm.rotation.set(-lift * 1.6, 0, 0.2);
    r.leftForearm.rotation.set(0.4, 0, 0);

    r.halberd.rotation.set(Math.PI - lift * 0.4, 0, 0);
    r.head.rotation.x = -lift * 0.2;
  }

  private animateAttackSlam(p: number): void {
    const r = this.rig;
    // Fast downward crash
    const strike = Math.pow(p, 0.4);

    r.hips.position.y = 1.05 - strike * 0.25; // Squats into strike
    r.chest.rotation.x = strike * 0.65;       // Hurls entire body forward

    r.rightUpperArm.rotation.set(-strike * 0.2, 0, 0);
    r.rightForearm.rotation.set(strike * 0.8, 0, 0);
    r.leftUpperArm.rotation.set(-strike * 0.2, 0, 0);
    r.leftForearm.rotation.set(strike * 0.8, 0, 0);

    // Blade slams down into ground
    r.halberd.rotation.set(strike * 1.6, 0, 0);
    r.halberd.position.set(0, -strike * 0.35, strike * 0.45);
  }

  private animateAttackStomp(p: number): void {
    const r = this.rig;
    const lift = p < 0.4 ? p / 0.4 : 1.0 - (p - 0.4) / 0.6;

    r.hips.position.y = 1.05 + lift * 0.08;
    // Right knee lifts high and stomps
    r.rightThigh.rotation.set(-lift * 1.1, 0, 0);
    r.rightShin.rotation.set(lift * 1.3, 0, 0);

    r.leftThigh.rotation.set(0.1, 0, 0);
    r.leftShin.rotation.set(0.2, 0, 0);

    // Halberd held defensively during kick/stomp
    r.rightUpperArm.rotation.set(-0.4, 0.2, -0.2);
    r.halberd.rotation.set(1.4, 0.2, 0);
  }

  private animatePunishRecovery(p: number): void {
    const r = this.rig;
    const recover = Math.min(1.0, p);

    // Heaves halberd out of ground, breathing heavily
    r.hips.position.y = 0.88 + recover * 0.12;
    r.chest.rotation.x = 0.35 - recover * 0.2;

    r.rightUpperArm.rotation.set(-0.2, 0, 0);
    r.rightForearm.rotation.set(0.6, 0, 0);
    r.halberd.rotation.set(1.6, 0, 0);
    r.halberd.position.set(0, -0.25 + recover * 0.25, 0.4);

    r.head.rotation.x = 0.2; // Head lowered
  }

  private animateStaggered(p: number): void {
    const r = this.rig;
    const wobble = Math.sin(p * Math.PI * 4.0) * (1.0 - p);

    // Reeled back in disorientation
    r.hips.position.y = 1.02;
    r.spine.rotation.x = -0.35 * (1.0 - p);
    r.spine.rotation.y = wobble * 0.25;

    r.leftUpperArm.rotation.set(0.3, 0, 0.6);
    r.rightUpperArm.rotation.set(0.2, 0, -0.6);
    r.halberd.rotation.set(0.8, wobble * 0.4, 0.2);
    r.head.rotation.set(-0.2, wobble * 0.3, 0);
  }

  private animatePhase2Transition(p: number): void {
    const r = this.rig;
    const roar = Math.sin(p * Math.PI);

    // Chest expands, head thrown back in battle roar
    r.hips.position.y = 1.08;
    r.chest.rotation.x = -roar * 0.35;
    r.head.rotation.x = -roar * 0.55;

    r.leftUpperArm.rotation.set(-roar * 1.2, 0, 0.5);
    r.rightUpperArm.rotation.set(-roar * 1.2, 0, -0.5);
    r.halberd.rotation.set(roar * 1.8, 0, 0);
  }

  private animateDefeatedKneel(p: number): void {
    const r = this.rig;
    const ease = Math.min(1.0, p * 1.2);

    // Lowers onto right knee, kneeling honorably before Anuki
    r.hips.position.set(0, 1.05 - ease * 0.48, ease * 0.15);

    // Right leg bent fully to ground
    r.rightThigh.rotation.set(ease * 1.55, 0, 0);
    r.rightShin.rotation.set(ease * 1.50, 0, 0);

    // Left leg supporting forward
    r.leftThigh.rotation.set(-ease * 0.85, 0, 0);
    r.leftShin.rotation.set(ease * 0.95, 0, 0);

    // Halberd planted firmly upright into arena sand
    r.rightShoulder.rotation.set(-ease * 0.3, 0, 0);
    r.rightUpperArm.rotation.set(-ease * 0.4, 0, 0.1);
    r.rightForearm.rotation.set(ease * 0.8, 0, 0);
    r.halberd.rotation.set(0, 0, 0); // Vertical plant
    r.halberd.position.set(0.25, -ease * 0.45, 0.2);

    // Respectful bow of head
    r.chest.rotation.x = ease * 0.30;
    r.head.rotation.x = ease * 0.45;
  }
}
