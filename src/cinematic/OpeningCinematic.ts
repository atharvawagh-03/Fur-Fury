/**
 * Opening Cinematic Director - Step 4: Rhazakar Dragon and Opening Cinematic
 * Implements PRD Section 7 ("Signature opening: playable cinematic sequence"):
 * - Beat 1: Clouds split; Rhazakar's silhouette emerges; mounted close-up of Anuki with look-around
 * - Beat 2: Dragon dives toward tournament arena; wind streaks; player can lean A/D to bank flight
 * - Beat 3: Flare brake, thunderous landing, dust & embers, Anuki dismounts, dragon roar
 * - Beat 4: Rhazakar ascends to overhead patrol; seamless blend into third-person hero camera
 * - Full skip and replay support conforming to PRD FR-01 & Section 10
 */

import * as THREE from 'three';
import { RhazakarModel } from '../dragon/RhazakarModel';
import { RhazakarAnimator } from '../dragon/RhazakarAnimator';
import { DragonEffects } from '../dragon/DragonEffects';
import { AnukiController } from '../character/AnukiController';
import { CameraManager } from '../camera/CameraManager';
import { AudioManager } from '../audio/AudioManager';
import { EventBus } from '../core/EventBus';

export type CinematicBeat =
  | 'IDLE_INACTIVE'
  | 'BEAT_1_CLOUDBREAK'    // High altitude glide, mounted close-up
  | 'BEAT_2_GRAND_DIVE'     // High-speed dive with player banking agency
  | 'BEAT_3_TOUCHDOWN'      // Flare brake, heavy landing, dismount & roar
  | 'BEAT_4_TRANSITION'     // Rhazakar takes flight to sky patrol; camera returns to hero
  | 'COMPLETED';

export interface CinematicSubtitle {
  speaker?: string;
  text: string;
  duration: number;
}

export class OpeningCinematic {
  private rhazakar: RhazakarModel;
  private dragonAnimator: RhazakarAnimator;
  private dragonEffects: DragonEffects;
  private anuki: AnukiController;
  private cameraManager: CameraManager;
  private audioManager: AudioManager;
  private eventBus = EventBus.getInstance();

  private active: boolean = false;
  private currentBeat: CinematicBeat = 'IDLE_INACTIVE';
  private beatTime: number = 0;
  private totalCinematicTime: number = 0;

  // Flight path waypoints
  private startPos = new THREE.Vector3(0, 38, -75);
  private divePos = new THREE.Vector3(0, 26, -38);
  private flarePos = new THREE.Vector3(0, 10, -8);
  private landPos = new THREE.Vector3(0, 0, 0);

  // Dynamic player flight banking input
  private bankInput: number = 0;
  private currentBank: number = 0;

  // Mounted look-around offsets
  private lookYaw: number = 0;
  private lookPitch: number = 0;

  // Sound triggers per beat
  private playedHeartbeat: boolean = false;
  private playedFlap: boolean = false;
  private playedImpact: boolean = false;
  private playedRoar: boolean = false;
  private playedFanfare: boolean = false;

  constructor(
    rhazakar: RhazakarModel,
    dragonAnimator: RhazakarAnimator,
    dragonEffects: DragonEffects,
    anuki: AnukiController,
    cameraManager: CameraManager,
    audioManager: AudioManager
  ) {
    this.rhazakar = rhazakar;
    this.dragonAnimator = dragonAnimator;
    this.dragonEffects = dragonEffects;
    this.anuki = anuki;
    this.cameraManager = cameraManager;
    this.audioManager = audioManager;
  }

  public isPlaying(): boolean {
    return this.active;
  }

  public getCurrentBeat(): CinematicBeat {
    return this.currentBeat;
  }

  /**
   * Start or restart the opening cinematic sequence
   */
  public play(): void {
    this.active = true;
    this.totalCinematicTime = 0;
    this.beatTime = 0;
    this.currentBeat = 'BEAT_1_CLOUDBREAK';

    // Reset sound flags
    this.playedHeartbeat = false;
    this.playedFlap = false;
    this.playedImpact = false;
    this.playedRoar = false;
    this.playedFanfare = false;

    // Position Rhazakar at high start waypoint
    const root = this.rhazakar.getRoot();
    root.position.copy(this.startPos);
    root.rotation.set(0, 0, 0);

    // Set dragon to glide
    this.dragonAnimator.setState('FLY_GLIDE');
    this.dragonAnimator.setBankAngle(0);

    // Attach Anuki to Rhazakar's horn perch
    this.attachAnukiToPerch();

    // Notify UI: cinematic started
    this.eventBus.emit('CINEMATIC_STATE', {
      active: true,
      beat: this.currentBeat,
      subtitle: {
        speaker: 'Veyrholm Chronicle',
        text: 'A storm breaks over Veyrholm’s Grand Arena... On the horns of the colossal scarlet dragon Rhazakar rides Lady Anuki.',
      },
      showPrompt: 'Use [Mouse] to look around while mounted',
    });

    if (!this.playedHeartbeat) {
      this.audioManager.playHeartbeat();
      this.playedHeartbeat = true;
    }
  }

  /**
   * Fast-forward / Skip to duel gameplay immediately
   */
  public skip(): void {
    if (!this.active && this.currentBeat === 'COMPLETED') return;

    this.active = false;
    this.currentBeat = 'COMPLETED';

    // Position Anuki standing proudly in the dueling circle
    this.detachAnukiFromPerch(new THREE.Vector3(0, 0, 2.5));

    // Dragon takes off to continuous overhead patrol in the sky
    this.dragonAnimator.setState('OVERHEAD_PATROL');
    this.dragonEffects.setSpeedLinesActive(false);

    // Reset camera shake
    this.cameraManager.addShake(0);

    // Notify UI: cinematic finished
    this.eventBus.emit('CINEMATIC_STATE', {
      active: false,
      beat: 'COMPLETED',
      subtitle: null,
      showPrompt: null,
    });
  }

  /**
   * Player input handlers during cinematic
   */
  public handleBankInput(lean: number): void {
    if (this.currentBeat === 'BEAT_2_GRAND_DIVE') {
      this.bankInput = Math.max(-1, Math.min(1, lean));
    }
  }

  public handleLookOffset(deltaX: number, deltaY: number): void {
    if (this.currentBeat === 'BEAT_1_CLOUDBREAK') {
      this.lookYaw = Math.max(-0.8, Math.min(0.8, this.lookYaw + deltaX * 0.003));
      this.lookPitch = Math.max(-0.4, Math.min(0.4, this.lookPitch - deltaY * 0.003));
    }
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    this.totalCinematicTime += deltaTime;
    this.beatTime += deltaTime;

    switch (this.currentBeat) {
      case 'BEAT_1_CLOUDBREAK':
        this.updateBeat1Cloudbreak(deltaTime);
        break;
      case 'BEAT_2_GRAND_DIVE':
        this.updateBeat2GrandDive(deltaTime);
        break;
      case 'BEAT_3_TOUCHDOWN':
        this.updateBeat3Touchdown(deltaTime);
        break;
      case 'BEAT_4_TRANSITION':
        this.updateBeat4Transition(deltaTime);
        break;
    }

    // Keep Anuki attached to horn perch while mounted
    if (this.currentBeat === 'BEAT_1_CLOUDBREAK' || this.currentBeat === 'BEAT_2_GRAND_DIVE') {
      this.syncAnukiMountedPosition();
    }
  }

  /**
   * BEAT 1: Clouds split, majestic glide, mounted close-up (Duration: 8.5 seconds)
   */
  private updateBeat1Cloudbreak(deltaTime: number): void {
    const beatDuration = 8.5;
    const progress = Math.min(1, this.beatTime / beatDuration);

    // Rhazakar glides forward and slightly downward
    const root = this.rhazakar.getRoot();
    root.position.lerpVectors(this.startPos, this.divePos, progress * 0.55);
    root.rotation.set(0, 0, 0);

    // Periodic wing flap
    if (this.beatTime > 3.0 && !this.playedFlap) {
      this.audioManager.playDragonWingFlap();
      this.playedFlap = true;
    }

    // Camera: Starts with dramatic close-up facing Lady Anuki perched on the horns
    const perchWorld = new THREE.Vector3();
    this.rhazakar.getPerchWorldPosition(perchWorld);

    // Camera positioned in front of and slightly above Anuki, framing her face and the sweeping horns
    const camTarget = perchWorld.clone().add(new THREE.Vector3(0, 0.4, 0));
    const camPos = perchWorld.clone().add(
      new THREE.Vector3(
        Math.sin(this.lookYaw) * 3.5,
        1.1 + this.lookPitch * 1.5,
        -3.8 + Math.cos(this.lookYaw) * 0.8
      )
    );

    this.cameraManager.camera.position.lerp(camPos, Math.min(1, deltaTime * 5.0));
    this.cameraManager.camera.lookAt(camTarget);

    if (this.beatTime >= beatDuration) {
      this.currentBeat = 'BEAT_2_GRAND_DIVE';
      this.beatTime = 0;
      this.dragonAnimator.setState('DIVE');
      this.dragonEffects.setSpeedLinesActive(true, 1.0);

      this.eventBus.emit('CINEMATIC_STATE', {
        active: true,
        beat: this.currentBeat,
        subtitle: {
          speaker: 'Rhazakar',
          text: '“Hold tight, little flame! The arena awaits.”',
        },
        showPrompt: 'Press [A / D] to bank flight maneuvers',
      });
    }
  }

  /**
   * BEAT 2: The Grand Dive toward the tournament arena (Duration: 7.5 seconds)
   */
  private updateBeat2GrandDive(deltaTime: number): void {
    const beatDuration = 7.5;
    const progress = Math.min(1, this.beatTime / beatDuration);
    const easeProgress = Math.pow(progress, 1.4); // Accelerating dive

    // Smooth banking input interpolation
    this.currentBank += (this.bankInput * 0.55 - this.currentBank) * Math.min(1, deltaTime * 4.0);
    this.dragonAnimator.setBankAngle(this.currentBank);

    // Rhazakar dives steeply toward arena flare point
    const root = this.rhazakar.getRoot();
    const diveStartX = this.divePos.x;
    const currentX = diveStartX + this.currentBank * 12.0;

    root.position.x = currentX;
    root.position.y = THREE.MathUtils.lerp(this.divePos.y, this.flarePos.y, easeProgress);
    root.position.z = THREE.MathUtils.lerp(this.divePos.z, this.flarePos.z, easeProgress);

    // Pitch down into dive
    root.rotation.x = 0.28 + Math.sin(progress * Math.PI) * 0.15;
    root.rotation.z = this.currentBank * 0.8;

    // Camera: Trailing chase camera above and behind Rhazakar's giant wings
    const camTarget = root.position.clone().add(new THREE.Vector3(0, 3.0, 4.0));
    const camPos = root.position.clone().add(new THREE.Vector3(this.currentBank * 3.0, 9.0, 16.0));

    this.cameraManager.camera.position.lerp(camPos, Math.min(1, deltaTime * 8.0));
    this.cameraManager.camera.lookAt(camTarget);

    // Subtle wind buffeting shake
    this.cameraManager.addShake(0.04 + progress * 0.08);

    if (this.beatTime >= beatDuration) {
      this.currentBeat = 'BEAT_3_TOUCHDOWN';
      this.beatTime = 0;
      this.dragonAnimator.setState('FLARE_BRAKE');
      this.dragonEffects.setSpeedLinesActive(false);

      this.eventBus.emit('CINEMATIC_STATE', {
        active: true,
        beat: this.currentBeat,
        subtitle: {
          speaker: 'Veyrholm Spectators',
          text: 'The colosseum banners scatter in the gale as colossal wings blot out the sun...',
        },
        showPrompt: null,
      });
    }
  }

  /**
   * BEAT 3: Wing flare, heavy landing, dismount, and roar (Duration: 9.0 seconds)
   */
  private updateBeat3Touchdown(deltaTime: number): void {
    const beatDuration = 9.0;
    const root = this.rhazakar.getRoot();

    // 0 - 2.0s: Wing Flare braking over center dueling ring
    if (this.beatTime < 2.0) {
      const brakeProg = this.beatTime / 2.0;
      root.position.lerpVectors(this.flarePos, this.landPos, brakeProg);
      root.rotation.set(0, 0, 0);

      const camTarget = new THREE.Vector3(0, 2.5, 0);
      const camPos = new THREE.Vector3(0, 4.0, -18);
      this.cameraManager.camera.position.lerp(camPos, Math.min(1, deltaTime * 4.0));
      this.cameraManager.camera.lookAt(camTarget);

      this.syncAnukiMountedPosition();
    }
    // 2.0s: Impact Touchdown moment!
    else if (this.beatTime >= 2.0 && this.beatTime < 4.5) {
      if (!this.playedImpact) {
        root.position.copy(this.landPos);
        this.dragonAnimator.setState('TOUCHDOWN_LAND');
        this.dragonEffects.triggerTouchdownImpact(new THREE.Vector3(0, 0, 0));
        this.audioManager.playDragonImpact();
        this.cameraManager.addShake(0.65); // Big impact shake
        this.playedImpact = true;
      }

      // Dragon lowers neck so Anuki's perch comes down near the arena floor
      this.syncAnukiMountedPosition();

      // Camera: Low-angle dramatic framing facing the grounded dragon and dismounting kitten
      const camTarget = new THREE.Vector3(0, 1.8, -1.0);
      const camPos = new THREE.Vector3(4.5, 1.5, 8.5);
      this.cameraManager.camera.position.lerp(camPos, Math.min(1, deltaTime * 4.0));
      this.cameraManager.camera.lookAt(camTarget);
    }
    // 4.5s - 6.5s: Anuki hops down to arena sand
    else if (this.beatTime >= 4.5 && this.beatTime < 6.5) {
      const dismountProg = Math.min(1, (this.beatTime - 4.5) / 1.5);
      const dismountTarget = new THREE.Vector3(0, 0, 3.2);

      // Interpolate Anuki stepping down from horns to ground
      const perchWorld = new THREE.Vector3();
      this.rhazakar.getPerchWorldPosition(perchWorld);

      const anukiPos = new THREE.Vector3().lerpVectors(perchWorld, dismountTarget, dismountProg);
      // Small graceful arc
      anukiPos.y += Math.sin(dismountProg * Math.PI) * 0.5;
      this.anuki.teleport(anukiPos.x, anukiPos.y, anukiPos.z);

      if (dismountProg >= 1.0) {
        this.anuki.teleport(0, 0, 3.2);
      }
    }
    // 6.5s - 9.0s: Rhazakar rears back and ROARS!
    else {
      if (!this.playedRoar) {
        this.dragonAnimator.setState('GROUND_ROAR');
        this.audioManager.playDragonRoar();
        this.cameraManager.addShake(0.35);
        this.playedRoar = true;

        this.eventBus.emit('CINEMATIC_STATE', {
          active: true,
          beat: this.currentBeat,
          subtitle: {
            speaker: 'Rhazakar',
            text: '“I can carry you to the gates, little flame. Beyond them, the choice must be yours.”',
          },
          showPrompt: null,
        });
      }

      // Camera tracks Lady Anuki standing proud in front of the roaring dragon
      const camTarget = new THREE.Vector3(0, 1.2, 2.5);
      const camPos = new THREE.Vector3(-3.2, 1.6, 6.8);
      this.cameraManager.camera.position.lerp(camPos, Math.min(1, deltaTime * 5.0));
      this.cameraManager.camera.lookAt(camTarget);
    }

    if (this.beatTime >= beatDuration) {
      this.currentBeat = 'BEAT_4_TRANSITION';
      this.beatTime = 0;
      if (!this.playedFanfare) {
        this.audioManager.playCinematicFanfare();
        this.playedFanfare = true;
      }

      this.eventBus.emit('CINEMATIC_STATE', {
        active: true,
        beat: this.currentBeat,
        subtitle: {
          speaker: 'Lady Anuki',
          text: '“I challenge the Rite. For Rhaz. For the Crown of Embers.”',
        },
        showPrompt: 'Prepare for duel! Camera returning to Lady Anuki...',
      });
    }
  }

  /**
   * BEAT 4: Rhazakar takes flight to sky guardian patrol, seamless camera blend (Duration: 3.5 seconds)
   */
  private updateBeat4Transition(deltaTime: number): void {
    const beatDuration = 3.5;
    const progress = Math.min(1, this.beatTime / beatDuration);

    // Dragon ascends to sky
    const root = this.rhazakar.getRoot();
    root.position.y = THREE.MathUtils.lerp(0, 28, Math.sin((progress * Math.PI) / 2));
    root.position.z = THREE.MathUtils.lerp(0, 24, progress);

    if (this.beatTime < 1.0) {
      this.dragonAnimator.setState('FLY_FLAP');
    } else {
      this.dragonAnimator.setState('OVERHEAD_PATROL');
    }

    // Blend camera to third-person hero follow position behind Anuki
    const anukiPos = this.anuki.getPosition();
    const heroCamTarget = new THREE.Vector3(anukiPos.x, anukiPos.y + 0.9, anukiPos.z);
    const heroCamPos = new THREE.Vector3(anukiPos.x, anukiPos.y + 1.8, anukiPos.z + 3.8);

    this.cameraManager.camera.position.lerp(heroCamPos, Math.min(1, deltaTime * 3.5));
    this.cameraManager.camera.lookAt(heroCamTarget);

    if (this.beatTime >= beatDuration) {
      this.skip(); // Finalizes transition and restores full hero controls
    }
  }

  /**
   * Keeps Anuki locked to Rhazakar's horn perch platform during flight
   */
  private syncAnukiMountedPosition(): void {
    const perchWorld = new THREE.Vector3();
    this.rhazakar.getPerchWorldPosition(perchWorld);
    // Align Anuki facing forward on the dragon's head
    this.anuki.teleport(perchWorld.x, perchWorld.y, perchWorld.z);
    this.anuki.getModel().getRoot().rotation.set(0, 0, 0);
  }

  private attachAnukiToPerch(): void {
    const perchWorld = new THREE.Vector3();
    this.rhazakar.getPerchWorldPosition(perchWorld);
    this.anuki.teleport(perchWorld.x, perchWorld.y, perchWorld.z);
  }

  private detachAnukiFromPerch(groundPos: THREE.Vector3): void {
    this.anuki.teleport(groundPos.x, groundPos.y, groundPos.z);
    this.anuki.getModel().getRoot().rotation.set(0, Math.PI, 0); // Face North Gate
  }
}
