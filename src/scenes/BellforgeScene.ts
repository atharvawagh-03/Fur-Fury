/**
 * Bellforge Foundry - Stage II Scene
 * Conforming strictly to PRD Section 6 & 12:
 * - Subterranean volcanic foundry, molten bronze floor lanes, smoke shafts & heavy chains
 * - Boss Encounter: Sir Brannoc Cinderhand, the Forge Warden
 * - Lady Anuki third-person combat and camera controller
 */

import * as THREE from 'three';
import { IScene, SceneContext } from '../scene/IScene';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { AnukiController } from '../character/AnukiController';
import { BrannocModel } from '../enemy/BrannocModel';
import { BrannocAI } from '../enemy/BrannocAI';
import { DamageableDummy, DamageableCrate } from '../combat/DamageableProp';
import { PropFactory } from '../world/PropFactory';
import { EventBus } from '../core/EventBus';
import { DisposalHelper } from '../core/DisposalHelper';

export class BellforgeScene implements IScene {
  public readonly id = 'BellforgeScene';
  private scene: THREE.Scene;
  private context!: SceneContext;
  private thirdPersonCamera!: ThirdPersonCamera;
  private anuki!: AnukiController;
  private brannoc!: BrannocAI;
  private damageableTargets: (DamageableDummy | DamageableCrate | BrannocAI)[] = [];

  // Environment elements
  private emberParticles!: THREE.Points;
  private emberGeometry!: THREE.BufferGeometry;
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

  public getBrannoc(): BrannocAI {
    return this.brannoc;
  }

  public async init(context: SceneContext): Promise<void> {
    this.context = context;

    // 1. Subterranean Volcanic Lighting & Fog
    this.scene.background = new THREE.Color(0x160804);
    this.scene.fog = new THREE.FogExp2(0x1e0b06, 0.024);

    const ambientLight = new THREE.AmbientLight(0x40180e, 0.7);
    this.scene.add(ambientLight);

    const furnaceOverheadLight = new THREE.DirectionalLight(0xff5511, 1.6);
    furnaceOverheadLight.position.set(0, 30, -5);
    furnaceOverheadLight.castShadow = true;
    furnaceOverheadLight.shadow.mapSize.width = 1024;
    furnaceOverheadLight.shadow.mapSize.height = 1024;
    furnaceOverheadLight.shadow.camera.near = 0.5;
    furnaceOverheadLight.shadow.camera.far = 80;
    const d = 25;
    furnaceOverheadLight.shadow.camera.left = -d;
    furnaceOverheadLight.shadow.camera.right = d;
    furnaceOverheadLight.shadow.camera.top = d;
    furnaceOverheadLight.shadow.camera.bottom = -d;
    this.scene.add(furnaceOverheadLight);

    // Glowing Lava lights along molten troughs
    const lavaLight1 = new THREE.PointLight(0xff4400, 2.5, 18);
    lavaLight1.position.set(-8, 1.2, 0);
    this.scene.add(lavaLight1);

    const lavaLight2 = new THREE.PointLight(0xff4400, 2.5, 18);
    lavaLight2.position.set(8, 1.2, 0);
    this.scene.add(lavaLight2);

    // 2. Build Subterranean Foundry Architecture
    this.buildFoundryArchitecture();

    // 3. Setup Floating Embers & Smoke Particle System
    this.setupEmberParticles();

    // 4. Spawn Lady Anuki
    this.anuki = new AnukiController(
      this.scene,
      context.physicsWorld,
      context.inputManager,
      context.audioManager,
      0,
      0.1,
      6.5, // Spawn south of foundry forge
      context.cameraManager
    );

    // 5. Initialize Third-Person Camera
    this.thirdPersonCamera = new ThirdPersonCamera(context.cameraManager);
    this.thirdPersonCamera.setTarget(this.anuki.getModel().getRoot());

    // 6. Spawn Boss: Sir Brannoc Cinderhand at north end of forge
    const brannocModel = new BrannocModel();
    this.scene.add(brannocModel.getRoot());
    brannocModel.getRoot().position.set(0, 0, -6.5);
    brannocModel.getRoot().rotation.y = 0; // Facing south toward Anuki

    this.brannoc = new BrannocAI(brannocModel, context.audioManager, context.cameraManager);
    this.damageableTargets.push(this.brannoc);
    this.anuki.getCombatSystem().registerTarget(this.brannoc);

    // Hook Brannoc's attacks to Anuki defenses
    this.brannoc.onAttackPlayerHit = (damage, poiseDamage, hitPos) => {
      const stats = this.anuki.getStats();
      const defenseRes = this.anuki.getCombatSystem().handleIncomingAttack(
        damage,
        poiseDamage,
        stats.stamina,
        hitPos
      );

      if (defenseRes.deflected) {
        this.brannoc.onParriedByPlayer();
      } else if (defenseRes.blocked) {
        this.anuki.drainStamina(defenseRes.staminaCost);
        this.anuki.takeDamage(defenseRes.damageTaken);
      } else {
        this.anuki.takeDamage(defenseRes.damageTaken);
      }
    };

    // Foundry Training Pell
    const dummyProp = PropFactory.createTrainingDummy(-6.0, 0, 0);
    this.scene.add(dummyProp.mesh);
    const dummy = new DamageableDummy(dummyProp.mesh as THREE.Group, 'Foundry Iron Pell');
    this.damageableTargets.push(dummy);
    this.anuki.getCombatSystem().registerTarget(dummy);

    const unbindLockOn = this.eventBus.on<void>('TOGGLE_LOCK_ON', () => {
      const isLocked = this.thirdPersonCamera.toggleLockOn(new THREE.Vector3(0, 1.2, -6.5));
      this.context.audioManager.playUiClick();
      this.eventBus.emit('LOCK_ON_STATE', isLocked);
    });
    this.unbindEvents.push(unbindLockOn);
  }

  private buildFoundryArchitecture(): void {
    const pw = this.context.physicsWorld;

    // Basalt Stone Floor
    const floorGeo = new THREE.PlaneGeometry(36, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b1a,
      roughness: 0.75,
      metalness: 0.3,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    if (pw.ready) {
      pw.createStaticBox(0, -0.25, 0, 18, 0.25, 24);
    }

    // Molten Lava Troughs (left and right glowing rivers)
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff4400,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.1,
    });

    const lavaGeo = new THREE.BoxGeometry(3.5, 0.2, 40);

    const leftLava = new THREE.Mesh(lavaGeo, lavaMat);
    leftLava.position.set(-10, 0.05, 0);
    this.scene.add(leftLava);

    const rightLava = new THREE.Mesh(lavaGeo, lavaMat);
    rightLava.position.set(10, 0.05, 0);
    this.scene.add(rightLava);

    // Blackened Iron Foundry Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x181413,
      roughness: 0.85,
      metalness: 0.5,
    });

    const northWallGeo = new THREE.BoxGeometry(36, 10, 2);
    const northWall = new THREE.Mesh(northWallGeo, wallMat);
    northWall.position.set(0, 5, -24);
    northWall.castShadow = true;
    this.scene.add(northWall);
    if (pw.ready) pw.createStaticBox(0, 5, -24, 18, 5, 1);

    const southWall = new THREE.Mesh(northWallGeo, wallMat);
    southWall.position.set(0, 5, 24);
    southWall.castShadow = true;
    this.scene.add(southWall);
    if (pw.ready) pw.createStaticBox(0, 5, 24, 18, 5, 1);

    const sideWallGeo = new THREE.BoxGeometry(2, 10, 48);
    const westWall = new THREE.Mesh(sideWallGeo, wallMat);
    westWall.position.set(-18, 5, 0);
    westWall.castShadow = true;
    this.scene.add(westWall);
    if (pw.ready) pw.createStaticBox(-18, 5, 0, 1, 5, 24);

    const eastWall = new THREE.Mesh(sideWallGeo, wallMat);
    eastWall.position.set(18, 5, 0);
    eastWall.castShadow = true;
    this.scene.add(eastWall);
    if (pw.ready) pw.createStaticBox(18, 5, 0, 1, 5, 24);

    // Massive Hanging Chains and Forge Smelters
    const chainMat = new THREE.MeshStandardMaterial({
      color: 0x2e2725,
      metalness: 0.9,
      roughness: 0.4,
    });

    for (let x = -8; x <= 8; x += 8) {
      for (let z = -12; z <= 12; z += 12) {
        const chainGeo = new THREE.CylinderGeometry(0.12, 0.12, 12, 6);
        const chain = new THREE.Mesh(chainGeo, chainMat);
        chain.position.set(x, 6, z);
        chain.castShadow = true;
        this.scene.add(chain);

        // Hanging furnace cauldron at bottom of chain
        const cauldronGeo = new THREE.CylinderGeometry(0.8, 0.5, 1.2, 8);
        const cauldron = new THREE.Mesh(cauldronGeo, wallMat);
        cauldron.position.set(x, 1.8, z);
        cauldron.castShadow = true;
        this.scene.add(cauldron);

        // Molten glow inside cauldron
        const cauldronLava = new THREE.Mesh(new THREE.CircleGeometry(0.7, 8), lavaMat);
        cauldronLava.rotation.x = -Math.PI / 2;
        cauldronLava.position.set(x, 2.35, z);
        this.scene.add(cauldronLava);
      }
    }
  }

  private setupEmberParticles(): void {
    const emberCount = 600;
    this.emberGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }

    this.emberGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const emberMat = new THREE.PointsMaterial({
      color: 0xff6611,
      size: 0.18,
      transparent: true,
      opacity: 0.85,
    });

    this.emberParticles = new THREE.Points(this.emberGeometry, emberMat);
    this.scene.add(this.emberParticles);
  }

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    // Update rising ember particles
    if (this.emberGeometry) {
      const posAttr = this.emberGeometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += deltaTime * 2.5; // Slowly drifting upward
        arr[i] += Math.sin(this.elapsedTime + i) * 0.02;
        if (arr[i + 1] > 12.0) {
          arr[i + 1] = 0.2;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Camera yaw
    const cameraYaw = this.thirdPersonCamera.getYaw();

    // Update Lady Anuki
    this.anuki.update(deltaTime, cameraYaw, this.context.cameraManager.camera);

    // Update Sir Brannoc
    if (this.brannoc) {
      this.brannoc.update(deltaTime, this.anuki.getPosition());
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
