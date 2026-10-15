/**
 * Rosebridge Keep - Stage I Scene
 * Conforming strictly to PRD Section 6 & 12:
 * - Rain-dark Gothic battlements, cobblestone courtyard, rose planters, vaulted cloisters
 * - Boss Encounter: Dame Elowen Vale, the Rose Sentinel
 * - Lady Anuki third-person combat and camera controller
 */

import * as THREE from 'three';
import { IScene, SceneContext } from '../scene/IScene';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { AnukiController } from '../character/AnukiController';
import { ElowenModel } from '../enemy/ElowenModel';
import { ElowenAI } from '../enemy/ElowenAI';
import { DamageableDummy, DamageableCrate } from '../combat/DamageableProp';
import { PropFactory } from '../world/PropFactory';
import { EventBus } from '../core/EventBus';
import { DisposalHelper } from '../core/DisposalHelper';

export class RosebridgeScene implements IScene {
  public readonly id = 'RosebridgeScene';
  private scene: THREE.Scene;
  private context!: SceneContext;
  private thirdPersonCamera!: ThirdPersonCamera;
  private anuki!: AnukiController;
  private elowen!: ElowenAI;
  private damageableTargets: (DamageableDummy | DamageableCrate | ElowenAI)[] = [];

  // Environment elements
  private rainParticles!: THREE.Points;
  private rainGeometry!: THREE.BufferGeometry;
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

  public getElowen(): ElowenAI {
    return this.elowen;
  }

  public async init(context: SceneContext): Promise<void> {
    this.context = context;

    // 1. Stormy Gothic Lighting & Fog
    this.scene.background = new THREE.Color(0x0a121c);
    this.scene.fog = new THREE.FogExp2(0x0e1824, 0.022);

    const ambientLight = new THREE.AmbientLight(0x2d3a4d, 0.65);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x8fa8c7, 1.4);
    moonLight.position.set(20, 35, 15);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 80;
    const d = 25;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    this.scene.add(moonLight);

    // Warm courtyard lantern lights
    const lantern1 = new THREE.PointLight(0xffb366, 1.2, 16);
    lantern1.position.set(-10, 3.5, -8);
    this.scene.add(lantern1);

    const lantern2 = new THREE.PointLight(0xffb366, 1.2, 16);
    lantern2.position.set(10, 3.5, -8);
    this.scene.add(lantern2);

    // 2. Build Rosebridge Courtyard Architecture & Colliders
    this.buildCourtyardArchitecture();

    // 3. Rain Particle System
    this.setupRainParticles();

    // 4. Spawn Lady Anuki
    this.anuki = new AnukiController(
      this.scene,
      context.physicsWorld,
      context.inputManager,
      context.audioManager,
      0,
      0.1,
      6.0, // Spawn on south side of courtyard
      context.cameraManager
    );

    // 5. Initialize Third-Person Follow Camera
    this.thirdPersonCamera = new ThirdPersonCamera(context.cameraManager);
    this.thirdPersonCamera.setTarget(this.anuki.getModel().getRoot());

    // 6. Spawn Boss: Dame Elowen Vale at north end of courtyard
    const elowenModel = new ElowenModel();
    this.scene.add(elowenModel.getRoot());
    elowenModel.getRoot().position.set(0, 0, -6.5);
    elowenModel.getRoot().rotation.y = 0; // Facing south toward Anuki

    this.elowen = new ElowenAI(elowenModel, context.audioManager, context.cameraManager);
    this.damageableTargets.push(this.elowen);
    this.anuki.getCombatSystem().registerTarget(this.elowen);

    // Hook Elowen attacks to player defenses
    this.elowen.onAttackPlayerHit = (damage, poiseDamage, hitPos) => {
      const stats = this.anuki.getStats();
      const defenseRes = this.anuki.getCombatSystem().handleIncomingAttack(
        damage,
        poiseDamage,
        stats.stamina,
        hitPos
      );

      if (defenseRes.deflected) {
        this.elowen.onParriedByPlayer();
      } else if (defenseRes.blocked) {
        this.anuki.drainStamina(defenseRes.staminaCost);
        this.anuki.takeDamage(defenseRes.damageTaken);
      } else {
        this.anuki.takeDamage(defenseRes.damageTaken);
      }
    };

    // Practice Dummy in side alcove
    const dummyProp = PropFactory.createTrainingDummy(-6.5, 0, 0);
    this.scene.add(dummyProp.mesh);
    const dummy = new DamageableDummy(dummyProp.mesh as THREE.Group, 'Keep Training Pell');
    this.damageableTargets.push(dummy);
    this.anuki.getCombatSystem().registerTarget(dummy);

    // Register spare decision listeners
    const unbindDecision = this.eventBus.on<string>('SPARE_BOSS_DECISION', (_decision) => {
      // Handled by LevelProgressionManager
    });
    this.unbindEvents.push(unbindDecision);

    const unbindLockOn = this.eventBus.on<void>('TOGGLE_LOCK_ON', () => {
      const isLocked = this.thirdPersonCamera.toggleLockOn(new THREE.Vector3(0, 1.2, -6.5));
      this.context.audioManager.playUiClick();
      this.eventBus.emit('LOCK_ON_STATE', isLocked);
    });
    this.unbindEvents.push(unbindLockOn);
  }

  private buildCourtyardArchitecture(): void {
    const pw = this.context.physicsWorld;

    // Cobblestone Courtyard Floor
    const floorGeo = new THREE.PlaneGeometry(36, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x333b47,
      roughness: 0.35, // Wet stone reflections
      metalness: 0.25,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    if (pw.ready) {
      pw.createStaticBox(0, -0.25, 0, 18, 0.25, 24);
    }

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.85,
      metalness: 0.15,
    });

    const roseMat = new THREE.MeshStandardMaterial({
      color: 0xb3243f,
      roughness: 0.6,
      metalness: 0.1,
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1f3d29,
      roughness: 0.7,
      metalness: 0.05,
    });

    // Outer Keep Walls (North, South, East, West)
    const northWallGeo = new THREE.BoxGeometry(36, 7, 2);
    const northWall = new THREE.Mesh(northWallGeo, wallMat);
    northWall.position.set(0, 3.5, -24);
    northWall.castShadow = true;
    this.scene.add(northWall);
    if (pw.ready) pw.createStaticBox(0, 3.5, -24, 18, 3.5, 1);

    const southWall = new THREE.Mesh(northWallGeo, wallMat);
    southWall.position.set(0, 3.5, 24);
    southWall.castShadow = true;
    this.scene.add(southWall);
    if (pw.ready) pw.createStaticBox(0, 3.5, 24, 18, 3.5, 1);

    const sideWallGeo = new THREE.BoxGeometry(2, 7, 48);
    const westWall = new THREE.Mesh(sideWallGeo, wallMat);
    westWall.position.set(-18, 3.5, 0);
    westWall.castShadow = true;
    this.scene.add(westWall);
    if (pw.ready) pw.createStaticBox(-18, 3.5, 0, 1, 3.5, 24);

    const eastWall = new THREE.Mesh(sideWallGeo, wallMat);
    eastWall.position.set(18, 3.5, 0);
    eastWall.castShadow = true;
    this.scene.add(eastWall);
    if (pw.ready) pw.createStaticBox(18, 3.5, 0, 1, 3.5, 24);

    // Gothic Pillars & Archways lining the cloisters
    for (let z = -16; z <= 16; z += 8) {
      // West Cloister Pillars
      const pGeo = new THREE.CylinderGeometry(0.35, 0.45, 6, 8);
      const pillarW = new THREE.Mesh(pGeo, wallMat);
      pillarW.position.set(-12, 3, z);
      pillarW.castShadow = true;
      this.scene.add(pillarW);

      // East Cloister Pillars
      const pillarE = new THREE.Mesh(pGeo, wallMat);
      pillarE.position.set(12, 3, z);
      pillarE.castShadow = true;
      this.scene.add(pillarE);

      // Rose planters flanking pillars
      const planterGeo = new THREE.BoxGeometry(1.6, 0.6, 1.2);
      const planterW = new THREE.Mesh(planterGeo, wallMat);
      planterW.position.set(-15, 0.3, z);
      this.scene.add(planterW);

      const bushW = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), foliageMat);
      bushW.position.set(-15, 0.9, z);
      this.scene.add(bushW);

      const roseBloomW = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), roseMat);
      roseBloomW.position.set(-15, 1.3, z);
      this.scene.add(roseBloomW);

      const planterE = new THREE.Mesh(planterGeo, wallMat);
      planterE.position.set(15, 0.3, z);
      this.scene.add(planterE);

      const bushE = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), foliageMat);
      bushE.position.set(15, 0.9, z);
      this.scene.add(bushE);

      const roseBloomE = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), roseMat);
      roseBloomE.position.set(15, 1.3, z);
      this.scene.add(roseBloomE);
    }
  }

  private setupRainParticles(): void {
    const rainCount = 1200;
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x99bbdd,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.scene.add(this.rainParticles);
  }

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    // Update Rain drops
    if (this.rainGeometry) {
      const posAttr = this.rainGeometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= deltaTime * 35.0; // Fast rain velocity
        if (arr[i + 1] < 0) {
          arr[i + 1] = 25.0;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Camera yaw
    const cameraYaw = this.thirdPersonCamera.getYaw();

    // Update Lady Anuki
    this.anuki.update(deltaTime, cameraYaw, this.context.cameraManager.camera);

    // Update Dame Elowen
    if (this.elowen) {
      this.elowen.update(deltaTime, this.anuki.getPosition());
    }

    // Update Third Person Camera
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
