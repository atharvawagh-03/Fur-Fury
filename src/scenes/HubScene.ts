/**
 * Castle Sanctuary of Veyrholm - Hub Scene (Step 8: Storytelling, Dialogue & Interactive Systems)
 * Conforming strictly to PRD Section 5, 8, 14, 16:
 * - Peaceful castle cloister with sunlit fountain, stone arcades, and rose gardens
 * - Rhazakar perched atop the high watchtower watching lovingly over Lady Anuki
 * - Interactive NPCs: Squire Pippin, Archivist Kenneth, Sir Garrick, Dame Elowen
 * - Inspectable Dragon-Binding Relic, Sanctuary Spring, and hidden kitten passage
 * - Proximity interaction triggers [E]
 */

import * as THREE from 'three';
import { IScene, SceneContext } from '../scene/IScene';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { AnukiController } from '../character/AnukiController';
import { RhazakarModel } from '../dragon/RhazakarModel';
import { RhazakarAnimator } from '../dragon/RhazakarAnimator';
import { GarrickModel } from '../enemy/GarrickModel';
import { ElowenModel } from '../enemy/ElowenModel';
import { DialogueManager } from '../narrative/DialogueManager';
import { EventBus } from '../core/EventBus';
import { PhotoModeController } from '../camera/PhotoModeController';
import { DisposalHelper } from '../core/DisposalHelper';

export interface InteractiveEntity {
  id: string;
  name: string;
  promptText: string;
  position: THREE.Vector3;
  radius: number;
  onInteract: () => void;
}

export class HubScene implements IScene {
  public readonly id = 'HubScene';
  private scene: THREE.Scene;
  private context!: SceneContext;
  private thirdPersonCamera!: ThirdPersonCamera;
  private anuki!: AnukiController;
  private rhazakar!: RhazakarModel;
  private dragonAnimator!: RhazakarAnimator;

  // Interactive Entities
  private interactiveEntities: InteractiveEntity[] = [];
  private nearestEntity: InteractiveEntity | null = null;
  private dialogueManager!: DialogueManager;
  private photoMode!: PhotoModeController;

  // Visuals & Atmosphere
  private fountainWater!: THREE.Mesh;
  private pollenParticles!: THREE.Points;
  private pollenGeometry!: THREE.BufferGeometry;
  private eventBus = EventBus.getInstance();
  private unbindEvents: (() => void)[] = [];
  private elapsedTime: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
  }

  public getThreeScene(): THREE.Scene {
    return this.scene;
  }

  public getAnuki(): AnukiController {
    return this.anuki;
  }

  public getRhazakar(): RhazakarModel {
    return this.rhazakar;
  }

  public async init(context: SceneContext): Promise<void> {
    this.context = context;
    this.dialogueManager = DialogueManager.getInstance(context.audioManager);

    // 1. Warm Golden Sanctuary Lighting & Sky
    this.scene.background = new THREE.Color(0xbfe0f7);
    this.scene.fog = new THREE.FogExp2(0xcde6f7, 0.015);

    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.75);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // 2. Build Castle Sanctuary Architecture
    this.buildSanctuaryArchitecture();

    // 3. Spawn Lady Anuki
    this.anuki = new AnukiController(
      this.scene,
      context.physicsWorld,
      context.inputManager,
      context.audioManager,
      0,
      0.1,
      0, // Spawn by the central fountain
      context.cameraManager
    );

    // 4. Spawn Rhazakar perched atop the South Tower Arch
    this.rhazakar = new RhazakarModel();
    this.scene.add(this.rhazakar.getRoot());
    this.rhazakar.getRoot().position.set(0, 7.8, -16);
    this.rhazakar.getRoot().rotation.y = 0; // Looking down lovingly toward the courtyard
    this.dragonAnimator = new RhazakarAnimator(this.rhazakar);
    this.dragonAnimator.setState('GROUND_IDLE');

    // 5. Initialize Third-Person Follow Camera
    this.thirdPersonCamera = new ThirdPersonCamera(context.cameraManager);
    this.thirdPersonCamera.setTarget(this.anuki.getModel().getRoot());

    // 6. Spawn Interactive NPCs & Props
    this.setupInteractiveEntities();

    // 7. Ambient Pollen Particle System
    this.setupPollenParticles();

    // Event listener for Lock-on
    const unbindLockOn = this.eventBus.on<void>('TOGGLE_LOCK_ON', () => {
      const isLocked = this.thirdPersonCamera.toggleLockOn(new THREE.Vector3(0, 1.2, 0));
      this.context.audioManager.playUiClick();
      this.eventBus.emit('LOCK_ON_STATE', isLocked);
    });
    this.unbindEvents.push(unbindLockOn);

    // Step 9 Photo Mode Subsystem
    this.photoMode = new PhotoModeController(context.cameraManager);

    const unbindPhoto = this.eventBus.on<void>('TOGGLE_PHOTO_MODE', () => {
      if (this.photoMode.isPhotoModeActive()) {
        this.photoMode.deactivate();
      } else {
        this.photoMode.activate(this.anuki.getPosition());
      }
    });
    this.unbindEvents.push(unbindPhoto);

    const unbindPhotoFov = this.eventBus.on<number>('SET_PHOTO_FOV', (fov) => {
      this.photoMode.setFov(fov);
    });
    this.unbindEvents.push(unbindPhotoFov);

    const unbindPhotoRoll = this.eventBus.on<number>('SET_PHOTO_ROLL', (roll) => {
      this.photoMode.setRoll(roll);
    });
    this.unbindEvents.push(unbindPhotoRoll);
  }

  private buildSanctuaryArchitecture(): void {
    const pw = this.context.physicsWorld;

    // Limestone Paver Floor
    const floorGeo = new THREE.PlaneGeometry(42, 42);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xded2c1,
      roughness: 0.65,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    if (pw.ready) {
      pw.createStaticBox(0, -0.25, 0, 21, 0.25, 21);
    }

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xbdb09e,
      roughness: 0.7,
      metalness: 0.15,
    });

    // Outer Cloister Walls
    const wallGeoN = new THREE.BoxGeometry(42, 8, 2);
    const wallN = new THREE.Mesh(wallGeoN, stoneMat);
    wallN.position.set(0, 4, -21);
    wallN.castShadow = true;
    this.scene.add(wallN);
    if (pw.ready) pw.createStaticBox(0, 4, -21, 21, 4, 1);

    const wallS = new THREE.Mesh(wallGeoN, stoneMat);
    wallS.position.set(0, 4, 21);
    wallS.castShadow = true;
    this.scene.add(wallS);
    if (pw.ready) pw.createStaticBox(0, 4, 21, 21, 4, 1);

    const wallSide = new THREE.BoxGeometry(2, 8, 42);
    const wallW = new THREE.Mesh(wallSide, stoneMat);
    wallW.position.set(-21, 4, 0);
    wallW.castShadow = true;
    this.scene.add(wallW);
    if (pw.ready) pw.createStaticBox(-21, 4, 0, 1, 4, 21);

    const wallE = new THREE.Mesh(wallSide, stoneMat);
    wallE.position.set(21, 4, 0);
    wallE.castShadow = true;
    this.scene.add(wallE);
    if (pw.ready) pw.createStaticBox(21, 4, 0, 1, 4, 21);

    // Watchtower Perch for Rhazakar (South Side)
    const towerGeo = new THREE.BoxGeometry(14, 8, 5);
    const towerMesh = new THREE.Mesh(towerGeo, stoneMat);
    towerMesh.position.set(0, 4, -18);
    towerMesh.castShadow = true;
    this.scene.add(towerMesh);
    if (pw.ready) pw.createStaticBox(0, 4, -18, 7, 4, 2.5);

    // Central Sanctuary Fountain
    const basinGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.8, 16);
    const basinMesh = new THREE.Mesh(basinGeo, stoneMat);
    basinMesh.position.set(0, 0.4, 0);
    basinMesh.castShadow = true;
    this.scene.add(basinMesh);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4aa3df,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    this.fountainWater = new THREE.Mesh(new THREE.CircleGeometry(3.2, 16), waterMat);
    this.fountainWater.rotation.x = -Math.PI / 2;
    this.fountainWater.position.set(0, 0.75, 0);
    this.scene.add(this.fountainWater);

    const centerPillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 2.2, 12);
    const centerPillar = new THREE.Mesh(centerPillarGeo, stoneMat);
    centerPillar.position.set(0, 1.1, 0);
    this.scene.add(centerPillar);

    // Cloister Arcade Columns & Benches
    for (let x = -14; x <= 14; x += 7) {
      if (Math.abs(x) < 2) continue;
      const colGeo = new THREE.CylinderGeometry(0.35, 0.45, 5, 8);
      const col = new THREE.Mesh(colGeo, stoneMat);
      col.position.set(x, 2.5, 14);
      col.castShadow = true;
      this.scene.add(col);

      // Stone Bench
      const benchGeo = new THREE.BoxGeometry(2.4, 0.5, 0.8);
      const bench = new THREE.Mesh(benchGeo, stoneMat);
      bench.position.set(x, 0.25, 12);
      bench.castShadow = true;
      this.scene.add(bench);
    }
  }

  private setupInteractiveEntities(): void {
    // 1. Squire Pippin NPC (Young apprentice in blue doublet)
    const pippinGroup = new THREE.Group();
    pippinGroup.position.set(-6.5, 0, 5.0);
    this.scene.add(pippinGroup);

    const doubletMat = new THREE.MeshStandardMaterial({ color: 0x2b4c7e, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c8ad, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x7c4923, roughness: 0.8 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.8, 8), doubletMat);
    body.position.y = 0.8;
    pippinGroup.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
    head.position.y = 1.35;
    pippinGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), hairMat);
    hair.position.set(0, 1.40, -0.02);
    pippinGroup.add(hair);

    this.interactiveEntities.push({
      id: 'pippin',
      name: 'Squire Pippin',
      promptText: '[E] Talk to Squire Pippin',
      position: pippinGroup.position,
      radius: 2.2,
      onInteract: () => {
        this.dialogueManager.startDialogue('squire_pippin');
      },
    });

    // 2. Archivist Kenneth (Elderly loremaster in scholar robes)
    const kennethGroup = new THREE.Group();
    kennethGroup.position.set(7.5, 0, 5.0);
    this.scene.add(kennethGroup);

    const robeMat = new THREE.MeshStandardMaterial({ color: 0x4a2a35, roughness: 0.8 });
    const whiteHairMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 });

    const kBody = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.35, 1.1, 8), robeMat);
    kBody.position.y = 0.85;
    kennethGroup.add(kBody);

    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
    kHead.position.y = 1.5;
    kennethGroup.add(kHead);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), whiteHairMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.32, 0.12);
    kennethGroup.add(beard);

    // Stone reading pedestal with scroll
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.6), doubletMat);
    pedestal.position.set(0, 0.45, 0.5);
    kennethGroup.add(pedestal);

    this.interactiveEntities.push({
      id: 'kenneth',
      name: 'Archivist Kenneth',
      promptText: '[E] Consult Archivist Kenneth',
      position: kennethGroup.position,
      radius: 2.2,
      onInteract: () => {
        this.dialogueManager.startDialogue('archivist_kenneth');
      },
    });

    // 3. Spared Sir Garrick Ironjaw in Hub
    const garrickModel = new GarrickModel();
    const garrickRoot = garrickModel.getRoot();
    garrickRoot.position.set(-10.5, 0, 12.0);
    garrickRoot.rotation.y = Math.PI * 0.15;
    this.scene.add(garrickRoot);

    this.interactiveEntities.push({
      id: 'garrick_hub',
      name: 'Sir Garrick Ironjaw',
      promptText: '[E] Speak with Sir Garrick',
      position: garrickRoot.position,
      radius: 2.5,
      onInteract: () => {
        this.dialogueManager.startDialogue('sir_garrick_hub');
      },
    });

    // 4. Spared Dame Elowen Vale in Hub
    const elowenModel = new ElowenModel();
    const elowenRoot = elowenModel.getRoot();
    elowenRoot.position.set(10.5, 0, 12.0);
    elowenRoot.rotation.y = -Math.PI * 0.15;
    this.scene.add(elowenRoot);

    this.interactiveEntities.push({
      id: 'elowen_hub',
      name: 'Dame Elowen Vale',
      promptText: '[E] Speak with Dame Elowen',
      position: elowenRoot.position,
      radius: 2.5,
      onInteract: () => {
        this.dialogueManager.startDialogue('dame_elowen_hub');
      },
    });

    // 5. Dragon-Binding Siphon Machine (Inspectable Relic)
    const relicGroup = new THREE.Group();
    relicGroup.position.set(14.0, 0, -8.0);
    this.scene.add(relicGroup);

    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222224, metalness: 0.9, roughness: 0.4 });
    const runeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xaa22ff,
      emissive: 0x8811ee,
      emissiveIntensity: 2.5,
    });

    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 2.2, 10), ironMat);
    boiler.position.y = 1.1;
    relicGroup.add(boiler);

    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 16), runeGlowMat);
    runeRing.position.y = 1.2;
    relicGroup.add(runeRing);

    const siphonLight = new THREE.PointLight(0xaa22ff, 1.5, 6);
    siphonLight.position.set(0, 1.3, 0);
    relicGroup.add(siphonLight);

    this.interactiveEntities.push({
      id: 'relic_machine',
      name: 'Flame Siphon Conduit',
      promptText: '[E] Inspect Siphon Machinery',
      position: relicGroup.position,
      radius: 2.6,
      onInteract: () => {
        this.dialogueManager.startDialogue('relic_dragon_binding');
      },
    });

    // 6. Central Sanctuary Spring Fountain
    this.interactiveEntities.push({
      id: 'sanctuary_spring',
      name: 'Sanctuary Spring',
      promptText: '[E] Drink & Rest at Spring',
      position: new THREE.Vector3(0, 0, 0),
      radius: 3.5,
      onInteract: () => {
        this.dialogueManager.startDialogue('ancient_fountain');
      },
    });
  }

  private setupPollenParticles(): void {
    const count = 400;
    this.pollenGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }

    this.pollenGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffea9f,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    this.pollenParticles = new THREE.Points(this.pollenGeometry, mat);
    this.scene.add(this.pollenParticles);
  }

  public update(deltaTime: number): void {
    if (this.photoMode.isPhotoModeActive()) {
      this.photoMode.update();
      return;
    }

    this.elapsedTime += deltaTime;

    // Subtle water ripple
    if (this.fountainWater) {
      this.fountainWater.rotation.z += deltaTime * 0.15;
    }

    // Drifting sunbeam pollen
    if (this.pollenGeometry) {
      const posAttr = this.pollenGeometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= deltaTime * 0.4;
        arr[i] += Math.sin(this.elapsedTime + i) * 0.015;
        if (arr[i + 1] < 0.1) {
          arr[i + 1] = 8.0;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Check interaction proximity
    const anukiPos = this.anuki.getPosition();
    let closest: InteractiveEntity | null = null;
    let minDistance = Infinity;

    for (const ent of this.interactiveEntities) {
      const dist = anukiPos.distanceTo(ent.position);
      if (dist <= ent.radius && dist < minDistance) {
        minDistance = dist;
        closest = ent;
      }
    }

    if (closest !== this.nearestEntity) {
      this.nearestEntity = closest;
      if (closest && !this.dialogueManager.isActive()) {
        this.eventBus.emit('INTERACTION_PROMPT_SHOW', {
          name: closest.name,
          promptText: closest.promptText,
        });
      } else {
        this.eventBus.emit('INTERACTION_PROMPT_HIDE');
      }
    }

    // Handle interact input (E key or interact action)
    if (
      this.context.inputManager.isActionJustPressed('interact') ||
      this.context.inputManager.isActionJustPressed('lightAttack')
    ) {
      if (this.dialogueManager.isActive()) {
        this.dialogueManager.advance();
      } else if (this.nearestEntity) {
        this.nearestEntity.onInteract();
      }
    }

    // Update Lady Anuki
    const cameraYaw = this.thirdPersonCamera.getYaw();
    this.anuki.update(deltaTime, cameraYaw, this.context.cameraManager.camera);

    // Update Rhazakar in tower perched mode
    this.dragonAnimator.update(deltaTime);

    // Update Camera
    this.thirdPersonCamera.update(deltaTime);
  }

  public fixedUpdate(fixedDeltaTime: number): void {
    this.anuki.fixedUpdate(fixedDeltaTime);
  }

  public destroy(): void {
    this.unbindEvents.forEach((unbind) => unbind());
    this.unbindEvents = [];
    this.anuki.dispose();
    DisposalHelper.disposeHierarchy(this.scene);
    this.scene.clear();
  }
}
