/**
 * Rhazakar Dragon Procedural & State-Driven Animator
 * Controls organic kinematics for flight, flapping, high-speed dive, aerial flare-braking,
 * ground touchdown, roar, breathing idles, and overhead guardian arena patrols.
 */

import { RhazakarModel, RhazakarRig } from './RhazakarModel';

export type DragonAnimState =
  | 'FLY_GLIDE'
  | 'FLY_FLAP'
  | 'DIVE'
  | 'FLARE_BRAKE'
  | 'TOUCHDOWN_LAND'
  | 'GROUND_ROAR'
  | 'GROUND_IDLE'
  | 'OVERHEAD_PATROL';

export class RhazakarAnimator {
  private model: RhazakarModel;
  private rig: RhazakarRig;
  private state: DragonAnimState = 'FLY_GLIDE';
  private animTime: number = 0;
  private stateTime: number = 0;
  private bankAngle: number = 0; // Current bank / roll angle in radians (-1 to 1)
  private targetBankAngle: number = 0;

  // Patrol circle parameters
  private patrolAngle: number = 0;
  private patrolRadius: number = 26;
  private patrolAltitude: number = 28;
  private patrolSpeed: number = 0.35; // rad/s

  constructor(model: RhazakarModel) {
    this.model = model;
    this.rig = model.getRig();
  }

  public getState(): DragonAnimState {
    return this.state;
  }

  public setState(nextState: DragonAnimState): void {
    if (this.state !== nextState) {
      this.state = nextState;
      this.stateTime = 0;
    }
  }

  public setBankAngle(target: number): void {
    this.targetBankAngle = Math.max(-0.65, Math.min(0.65, target));
  }

  public update(deltaTime: number): void {
    this.animTime += deltaTime;
    this.stateTime += deltaTime;

    // Smoothly interpolate bank angle
    this.bankAngle += (this.targetBankAngle - this.bankAngle) * Math.min(1, deltaTime * 6.0);

    switch (this.state) {
      case 'FLY_GLIDE':
        this.animateGlide(deltaTime);
        break;
      case 'FLY_FLAP':
        this.animateFlap(deltaTime, 1.6);
        break;
      case 'DIVE':
        this.animateDive(deltaTime);
        break;
      case 'FLARE_BRAKE':
        this.animateFlareBrake(deltaTime);
        break;
      case 'TOUCHDOWN_LAND':
        this.animateTouchdown(deltaTime);
        break;
      case 'GROUND_ROAR':
        this.animateGroundRoar(deltaTime);
        break;
      case 'GROUND_IDLE':
        this.animateGroundIdle(deltaTime);
        break;
      case 'OVERHEAD_PATROL':
        this.animateOverheadPatrol(deltaTime);
        break;
    }

    // Dynamic tail sine-wave undulation in all states
    this.animateTail(deltaTime);
  }

  /**
   * Majestic soaring glide with slow wing billow and air banking
   */
  private animateGlide(_dt: number): void {
    const t = this.animTime * 1.5;
    const wingWave = Math.sin(t) * 0.12;

    // Wings spread wide with subtle flexing
    this.rig.wingShoulderL.rotation.z = -0.4 + wingWave - this.bankAngle * 0.5;
    this.rig.wingShoulderR.rotation.z = 0.4 - wingWave - this.bankAngle * 0.5;

    this.rig.wingElbowL.rotation.z = -0.15 + wingWave * 0.5;
    this.rig.wingElbowR.rotation.z = 0.15 - wingWave * 0.5;

    this.rig.wingShoulderL.rotation.y = -0.1;
    this.rig.wingShoulderR.rotation.y = 0.1;

    // Neck arcs slightly up and follows bank
    this.rig.neck1.rotation.x = -0.2 + Math.sin(t * 0.8) * 0.05;
    this.rig.neck2.rotation.x = -0.1;
    this.rig.neck3.rotation.y = this.bankAngle * 0.3;
    this.rig.head.rotation.z = -this.bankAngle * 0.2;

    // Legs tucked backward aerodynamically
    this.tuckLegsForFlight();

    // Body bank
    this.rig.pelvis.rotation.z = this.bankAngle;
    this.rig.pelvis.rotation.x = 0.05;
  }

  /**
   * Powerful flapping flight cycle with wing stroke and lift
   */
  private animateFlap(_dt: number, flapSpeed: number = 2.0): void {
    const flapCycle = Math.sin(this.animTime * Math.PI * flapSpeed);
    const downstroke = flapCycle > 0;

    // Wing shoulder stroke: -0.7 (high) to +0.5 (low)
    const strokeAngle = flapCycle * 0.55;

    this.rig.wingShoulderL.rotation.z = -0.2 - strokeAngle - this.bankAngle * 0.5;
    this.rig.wingShoulderR.rotation.z = 0.2 + strokeAngle - this.bankAngle * 0.5;

    // Elbow & wrist flex on upstroke / feathering
    const elbowFlex = downstroke ? 0.1 : 0.45;
    this.rig.wingElbowL.rotation.z = -elbowFlex;
    this.rig.wingElbowR.rotation.z = elbowFlex;

    // Fingers spread
    for (let f = 0; f < this.rig.wingFingersL.length; f++) {
      const fan = 0.15 * f;
      this.rig.wingFingersL[f].rotation.z = (downstroke ? 0.05 : -0.15) + fan * 0.05;
      this.rig.wingFingersR[f].rotation.z = (downstroke ? -0.05 : 0.15) - fan * 0.05;
    }

    // Chest & neck bob slightly with wing strokes
    this.rig.chest.position.y = 0.6 + flapCycle * 0.2;
    this.rig.neck1.rotation.x = -0.25 - flapCycle * 0.08;

    this.tuckLegsForFlight();

    this.rig.pelvis.rotation.z = this.bankAngle;
  }

  /**
   * Steep aerodynamic dive toward the arena (wings swept back, head down)
   */
  private animateDive(_dt: number): void {
    const t = this.animTime * 6.0;
    const flutter = Math.sin(t) * 0.05;

    // Wings tucked back against flanks
    this.rig.wingShoulderL.rotation.set(-0.6, -0.65, -0.15 + flutter - this.bankAngle * 0.3);
    this.rig.wingShoulderR.rotation.set(-0.6, 0.65, 0.15 - flutter - this.bankAngle * 0.3);

    this.rig.wingElbowL.rotation.set(0.2, -0.4, -0.3);
    this.rig.wingElbowR.rotation.set(0.2, 0.4, 0.3);

    // Streamlined neck & pitched head
    this.rig.neck1.rotation.set(-0.45, 0, 0);
    this.rig.neck2.rotation.set(-0.35, 0, 0);
    this.rig.neck3.rotation.set(-0.15, this.bankAngle * 0.2, 0);
    this.rig.head.rotation.set(-0.1, 0, -this.bankAngle * 0.3);

    // Legs firmly tucked
    this.tuckLegsForFlight(true);

    // Pelvis pitched forward into dive
    this.rig.pelvis.rotation.x = 0.35;
    this.rig.pelvis.rotation.z = this.bankAngle;
  }

  /**
   * Air-braking flare as dragon approaches arena touchdown
   */
  private animateFlareBrake(_dt: number): void {
    const progress = Math.min(1, this.stateTime / 1.5);
    const ease = Math.sin((progress * Math.PI) / 2);

    // Wings spread wide and angled forward like giant parachutes
    this.rig.wingShoulderL.rotation.set(0.3 * ease, 0.5 * ease, -0.7 * ease);
    this.rig.wingShoulderR.rotation.set(0.3 * ease, -0.5 * ease, 0.7 * ease);

    this.rig.wingElbowL.rotation.set(-0.2, 0.3 * ease, 0.1);
    this.rig.wingElbowR.rotation.set(-0.2, -0.3 * ease, -0.1);

    // Neck cranes upward
    this.rig.neck1.rotation.set(0.2 * ease, 0, 0);
    this.rig.neck2.rotation.set(0.25 * ease, 0, 0);
    this.rig.neck3.rotation.set(0.15 * ease, 0, 0);
    this.rig.head.rotation.set(-0.2 * ease, 0, 0);

    // Hind legs swing forward preparing for ground impact
    this.rig.hindThighL.rotation.set(-0.6 * ease, 0, -0.2);
    this.rig.hindThighR.rotation.set(-0.6 * ease, 0, 0.2);
    this.rig.frontThighL.rotation.set(-0.4 * ease, 0, -0.2);
    this.rig.frontThighR.rotation.set(-0.4 * ease, 0, 0.2);

    this.rig.pelvis.rotation.x = -0.3 * ease;
    this.rig.pelvis.rotation.z = 0;
  }

  /**
   * Ground touchdown: heavy spring compression and lowering head for Lady Anuki to dismount
   */
  private animateTouchdown(_dt: number): void {
    // Initial shock squash (0 - 0.4s), then spring settle
    let squash = 0;
    if (this.stateTime < 0.5) {
      squash = Math.sin((this.stateTime / 0.5) * Math.PI) * 0.8;
    } else {
      squash = Math.sin((this.stateTime - 0.5) * 6.0) * Math.exp(-(this.stateTime - 0.5) * 2.5) * 0.2;
    }

    this.rig.pelvis.position.y = 4.8 - squash * 1.4;
    this.rig.pelvis.rotation.set(0, 0, 0);

    // Wings fold back onto flanks
    const fold = Math.min(1, this.stateTime / 1.4);
    this.rig.wingShoulderL.rotation.set(-0.8 * fold, -0.4 * fold, 0.2 * fold);
    this.rig.wingShoulderR.rotation.set(-0.8 * fold, 0.4 * fold, -0.2 * fold);
    this.rig.wingElbowL.rotation.set(0.5 * fold, -0.6 * fold, 0);
    this.rig.wingElbowR.rotation.set(0.5 * fold, 0.6 * fold, 0);

    // Legs planted firmly on arena floor
    this.plantLegsOnGround(squash);

    // Lower neck gently downward so Anuki's horn perch lowers toward ground level
    const neckDrop = Math.min(1, Math.max(0, (this.stateTime - 0.3) / 1.5));
    this.rig.neck1.rotation.set(-0.45 * neckDrop, 0, 0);
    this.rig.neck2.rotation.set(-0.35 * neckDrop, 0, 0);
    this.rig.neck3.rotation.set(-0.25 * neckDrop, 0, 0);
    this.rig.head.rotation.set(0.35 * neckDrop, 0, 0);
  }

  /**
   * Ground Roar: Rears back, flares wings, opens jaws, glowing throat light
   */
  private animateGroundRoar(_dt: number): void {
    const t = this.stateTime;
    const roarPhase = Math.sin(Math.min(Math.PI, t * 1.2));

    // Chest rears back slightly
    this.rig.pelvis.position.y = 4.8 + roarPhase * 0.8;
    this.rig.pelvis.rotation.x = -0.15 * roarPhase;

    // Wings partially flare
    this.rig.wingShoulderL.rotation.set(0.2 * roarPhase, 0.3 * roarPhase, -0.5 * roarPhase);
    this.rig.wingShoulderR.rotation.set(0.2 * roarPhase, -0.3 * roarPhase, 0.5 * roarPhase);

    // Neck arches proudly upward
    this.rig.neck1.rotation.set(0.3 * roarPhase, 0, 0);
    this.rig.neck2.rotation.set(0.35 * roarPhase, 0, 0);
    this.rig.neck3.rotation.set(0.2 * roarPhase, 0, 0);
    this.rig.head.rotation.set(-0.3 * roarPhase + Math.sin(t * 18.0) * 0.04, 0, 0);

    // Jaws open wide for roar
    this.rig.jaw.rotation.x = 0.55 * roarPhase;

    // Throat light intensity pulses with roar
    this.rig.throatLight.intensity = 2.5 + roarPhase * 4.0 + Math.sin(t * 20.0) * 1.5;

    this.plantLegsOnGround(0);
  }

  /**
   * Standing idle: colossal chest breathing and calm demeanor
   */
  private animateGroundIdle(_dt: number): void {
    const breath = Math.sin(this.animTime * 1.2);

    this.rig.pelvis.position.y = 4.8 + breath * 0.08;
    this.rig.chest.scale.set(1.15 + breath * 0.02, 1.3 + breath * 0.03, 1.4);

    // Relaxed folded wings
    this.rig.wingShoulderL.rotation.set(-0.7, -0.3, 0.15);
    this.rig.wingShoulderR.rotation.set(-0.7, 0.3, -0.15);
    this.rig.wingElbowL.rotation.set(0.4, -0.5, 0);
    this.rig.wingElbowR.rotation.set(0.4, 0.5, 0);

    // Subtle head glance & jaw breathing
    this.rig.neck1.rotation.set(-0.15 + breath * 0.03, Math.sin(this.animTime * 0.4) * 0.08, 0);
    this.rig.neck2.rotation.set(-0.1, 0, 0);
    this.rig.head.rotation.set(0.05, Math.sin(this.animTime * 0.4) * 0.08, 0);
    this.rig.jaw.rotation.x = 0.05 + Math.max(0, breath * 0.06);

    this.plantLegsOnGround(0);
  }

  /**
   * Guardian Overhead Patrol: Soars in majestic high-altitude circles above the Grand Arena
   */
  private animateOverheadPatrol(deltaTime: number): void {
    this.patrolAngle += this.patrolSpeed * deltaTime;

    const x = Math.cos(this.patrolAngle) * this.patrolRadius;
    const z = Math.sin(this.patrolAngle) * this.patrolRadius;
    const y = this.patrolAltitude + Math.sin(this.animTime * 0.8) * 1.5;

    // Position root in sky
    const root = this.model.getRoot();
    root.position.set(x, y, z);

    // Look along tangent of circle
    const tangentX = -Math.sin(this.patrolAngle);
    const tangentZ = Math.cos(this.patrolAngle);
    const heading = Math.atan2(tangentX, tangentZ);
    root.rotation.set(0, heading + Math.PI, 0);

    // Natural inward banking roll on circular trajectory
    const circleBank = 0.32;
    this.setBankAngle(circleBank);

    // Alternate between gliding and occasional flap
    const cycle = (this.animTime % 8.0);
    if (cycle < 3.0) {
      this.animateFlap(deltaTime, 1.4);
    } else {
      this.animateGlide(deltaTime);
    }
  }

  /**
   * Aerodynamic leg tuck for flight
   */
  private tuckLegsForFlight(tight: boolean = false): void {
    const angle = tight ? 0.9 : 0.65;
    this.rig.frontThighL.rotation.set(angle, 0, -0.15);
    this.rig.frontThighR.rotation.set(angle, 0, 0.15);
    this.rig.frontShinL.rotation.set(-angle * 1.2, 0, 0);
    this.rig.frontShinR.rotation.set(-angle * 1.2, 0, 0);

    this.rig.hindThighL.rotation.set(angle * 0.9, 0, -0.2);
    this.rig.hindThighR.rotation.set(angle * 0.9, 0, 0.2);
    this.rig.hindShinL.rotation.set(-angle * 1.1, 0, 0);
    this.rig.hindShinR.rotation.set(-angle * 1.1, 0, 0);
  }

  /**
   * Plant all four taloned legs firmly on ground
   */
  private plantLegsOnGround(squash: number): void {
    const s = squash * 0.3;
    this.rig.frontThighL.rotation.set(0.1 + s, 0, -0.1);
    this.rig.frontThighR.rotation.set(0.1 + s, 0, 0.1);
    this.rig.frontShinL.rotation.set(-0.2 - s, 0, 0);
    this.rig.frontShinR.rotation.set(-0.2 - s, 0, 0);

    this.rig.hindThighL.rotation.set(-0.15 - s, 0, -0.15);
    this.rig.hindThighR.rotation.set(-0.15 - s, 0, 0.15);
    this.rig.hindShinL.rotation.set(0.3 + s, 0, 0);
    this.rig.hindShinR.rotation.set(0.3 + s, 0, 0);
  }

  /**
   * Dynamic undulating tail sine wave
   */
  private animateTail(_dt: number): void {
    const t = this.animTime * 2.2;
    for (let i = 0; i < this.rig.tailSegments.length; i++) {
      const seg = this.rig.tailSegments[i];
      const phase = t - i * 0.45;
      seg.rotation.y = Math.sin(phase) * 0.12 * (1 + i * 0.08) - this.bankAngle * 0.15;
      seg.rotation.x = Math.cos(phase * 0.8) * 0.06;
    }
  }
}
