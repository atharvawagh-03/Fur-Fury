/**
 * 3D Articulated Rig & Model for Sir Brannoc Cinderhand, the Forge Warden
 * Conforming strictly to PRD Section 6 & 12:
 * - Soot-darkened heavy forge plate armor with glowing molten seams
 * - Anvil pauldrons, heavy furnace breastplate with iron fire grate
 * - Oversized volcanic two-handed smith warhammer
 */

import * as THREE from 'three';

export interface BrannocRig {
  root: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;

  // Arms
  leftShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;

  rightShoulder: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;

  // Hammer
  warhammer: THREE.Group;
  hammerHead: THREE.Mesh;
  hammerGlowMesh: THREE.Mesh;
  hammerImpactPoint: THREE.Object3D;

  // Legs
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;

  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;

  cuirassMesh: THREE.Mesh;
  furnaceGrateMesh: THREE.Mesh;
  moltenCoreLight: THREE.PointLight;
}

export class BrannocModel {
  private root: THREE.Group;
  private rig!: BrannocRig;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'SirBrannoc_Root';
    this.buildCharacter();
  }

  public getRoot(): THREE.Group {
    return this.root;
  }

  public getRig(): BrannocRig {
    return this.rig;
  }

  public getHammerImpactWorldPosition(target: THREE.Vector3): void {
    if (this.rig.hammerImpactPoint) {
      this.rig.hammerImpactPoint.getWorldPosition(target);
    } else {
      this.root.getWorldPosition(target);
    }
  }

  private buildCharacter(): void {
    // PBR Materials
    const sootIronMat = new THREE.MeshStandardMaterial({
      color: 0x2e2c2b,
      metalness: 0.85,
      roughness: 0.45,
    });

    const moltenSeamMat = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff3300,
      emissiveIntensity: 1.8,
      metalness: 0.2,
      roughness: 0.3,
    });

    const bronzeTrimMat = new THREE.MeshStandardMaterial({
      color: 0xb5733a,
      metalness: 0.9,
      roughness: 0.35,
    });

    const furnaceGrateMat = new THREE.MeshStandardMaterial({
      color: 0x1a1816,
      metalness: 0.95,
      roughness: 0.5,
    });

    const warhammerHeadMat = new THREE.MeshStandardMaterial({
      color: 0x3d3835,
      metalness: 0.9,
      roughness: 0.3,
    });

    const haftWoodMat = new THREE.MeshStandardMaterial({
      color: 0x2b1c11,
      metalness: 0.1,
      roughness: 0.8,
    });

    // 1. Root & Hips (Pelvis at Y = 1.10m for 2.1m boss)
    const hips = new THREE.Group();
    hips.position.y = 1.10;
    this.root.add(hips);

    const pelvisGeo = new THREE.BoxGeometry(0.52, 0.28, 0.36);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, sootIronMat);
    pelvisMesh.castShadow = true;
    hips.add(pelvisMesh);

    // 2. Spine & Massive Chest
    const spine = new THREE.Group();
    spine.position.y = 0.18;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.26;
    spine.add(chest);

    // Heavy furnace cuirass
    const cuirassGeo = new THREE.BoxGeometry(0.72, 0.58, 0.48);
    const cuirassMesh = new THREE.Mesh(cuirassGeo, sootIronMat);
    cuirassMesh.position.y = 0.08;
    cuirassMesh.castShadow = true;
    chest.add(cuirassMesh);

    // Furnace iron grate on breastplate
    const grateGeo = new THREE.BoxGeometry(0.36, 0.32, 0.06);
    const furnaceGrateMesh = new THREE.Mesh(grateGeo, furnaceGrateMat);
    furnaceGrateMesh.position.set(0, 0.10, 0.25);
    chest.add(furnaceGrateMesh);

    // Glowing molten magma behind the iron grate
    const moltenCoreGeo = new THREE.PlaneGeometry(0.32, 0.28);
    const moltenCoreMesh = new THREE.Mesh(moltenCoreGeo, moltenSeamMat);
    moltenCoreMesh.position.set(0, 0.10, 0.23);
    chest.add(moltenCoreMesh);

    // Molten furnace point light
    const moltenCoreLight = new THREE.PointLight(0xff5500, 1.8, 3.5);
    moltenCoreLight.position.set(0, 0.10, 0.30);
    chest.add(moltenCoreLight);

    // Anvil pauldrons on shoulders
    const pauldronGeo = new THREE.BoxGeometry(0.32, 0.22, 0.32);
    const leftPauldron = new THREE.Mesh(pauldronGeo, bronzeTrimMat);
    leftPauldron.position.set(-0.48, 0.32, 0);
    leftPauldron.castShadow = true;
    chest.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, bronzeTrimMat);
    rightPauldron.position.set(0.48, 0.32, 0);
    rightPauldron.castShadow = true;
    chest.add(rightPauldron);

    // 3. Neck & Great Helm
    const neck = new THREE.Group();
    neck.position.y = 0.38;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.16;
    neck.add(head);

    const helmGeo = new THREE.BoxGeometry(0.30, 0.34, 0.32);
    const helmMesh = new THREE.Mesh(helmGeo, sootIronMat);
    helmMesh.castShadow = true;
    head.add(helmMesh);

    // Glowing horizontal visor slit
    const visorGeo = new THREE.BoxGeometry(0.22, 0.04, 0.02);
    const visorMesh = new THREE.Mesh(visorGeo, moltenSeamMat);
    visorMesh.position.set(0, 0.04, 0.17);
    head.add(visorMesh);

    // 4. Arms & Huge Gauntlets
    const armGeo = new THREE.CylinderGeometry(0.12, 0.10, 0.36, 8);
    const forearmGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.34, 8);

    // Left Arm
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.46, 0.24, 0);
    chest.add(leftShoulder);

    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.y = -0.16;
    leftShoulder.add(leftUpperArm);

    const leftUpperMesh = new THREE.Mesh(armGeo, sootIronMat);
    leftUpperMesh.position.y = -0.14;
    leftUpperMesh.castShadow = true;
    leftUpperArm.add(leftUpperMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.32;
    leftUpperArm.add(leftForearm);

    const leftForearmMesh = new THREE.Mesh(forearmGeo, sootIronMat);
    leftForearmMesh.position.y = -0.14;
    leftForearmMesh.castShadow = true;
    leftForearm.add(leftForearmMesh);

    const leftHand = new THREE.Group();
    leftHand.position.y = -0.30;
    leftForearm.add(leftHand);

    // Right Arm (holds the warhammer)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.46, 0.24, 0);
    chest.add(rightShoulder);

    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.y = -0.16;
    rightShoulder.add(rightUpperArm);

    const rightUpperMesh = new THREE.Mesh(armGeo, sootIronMat);
    rightUpperMesh.position.y = -0.14;
    rightUpperMesh.castShadow = true;
    rightUpperArm.add(rightUpperMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.32;
    rightUpperArm.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, sootIronMat);
    rightForearmMesh.position.y = -0.14;
    rightForearmMesh.castShadow = true;
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.y = -0.30;
    rightForearm.add(rightHand);

    // 5. Oversized Volcanic Smith Warhammer
    const warhammer = new THREE.Group();
    warhammer.name = 'Forge_Warden_Warhammer';
    rightHand.add(warhammer);

    // 1.5m ash-wood shaft with iron reinforcers
    const haftGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.6, 8);
    const haftMesh = new THREE.Mesh(haftGeo, haftWoodMat);
    haftMesh.position.y = 0.5;
    haftMesh.castShadow = true;
    warhammer.add(haftMesh);

    // Massive anvil-shaped warhammer head
    const headBlockGeo = new THREE.BoxGeometry(0.44, 0.32, 0.65);
    const hammerHead = new THREE.Mesh(headBlockGeo, warhammerHeadMat);
    hammerHead.position.set(0, 1.25, 0);
    hammerHead.castShadow = true;
    warhammer.add(hammerHead);

    // Glowing molten rune inlay on both sides of hammer head
    const runeInlayGeo = new THREE.BoxGeometry(0.46, 0.12, 0.45);
    const hammerGlowMesh = new THREE.Mesh(runeInlayGeo, moltenSeamMat);
    hammerGlowMesh.position.set(0, 1.25, 0);
    warhammer.add(hammerGlowMesh);

    // Impact point at business end
    const hammerImpactPoint = new THREE.Object3D();
    hammerImpactPoint.position.set(0, 1.25, 0.35);
    warhammer.add(hammerImpactPoint);

    // 6. Heavy Armored Legs
    const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.46, 8);
    const greaveGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.48, 8);
    const bootGeo = new THREE.BoxGeometry(0.18, 0.12, 0.34);

    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.20, -0.12, 0);
    hips.add(leftThigh);

    const leftThighMesh = new THREE.Mesh(legGeo, sootIronMat);
    leftThighMesh.position.y = -0.22;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    const leftShin = new THREE.Group();
    leftShin.position.y = -0.46;
    leftThigh.add(leftShin);

    const leftShinMesh = new THREE.Mesh(greaveGeo, sootIronMat);
    leftShinMesh.position.y = -0.22;
    leftShinMesh.castShadow = true;
    leftShin.add(leftShinMesh);

    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.46;
    leftShin.add(leftFoot);

    const leftFootMesh = new THREE.Mesh(bootGeo, sootIronMat);
    leftFootMesh.position.set(0, 0.06, 0.06);
    leftFootMesh.castShadow = true;
    leftFoot.add(leftFootMesh);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.20, -0.12, 0);
    hips.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(legGeo, sootIronMat);
    rightThighMesh.position.y = -0.22;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightShin = new THREE.Group();
    rightShin.position.y = -0.46;
    rightThigh.add(rightShin);

    const rightShinMesh = new THREE.Mesh(greaveGeo, sootIronMat);
    rightShinMesh.position.y = -0.22;
    rightShinMesh.castShadow = true;
    rightShin.add(rightShinMesh);

    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.46;
    rightShin.add(rightFoot);

    const rightFootMesh = new THREE.Mesh(bootGeo, sootIronMat);
    rightFootMesh.position.set(0, 0.06, 0.06);
    rightFootMesh.castShadow = true;
    rightFoot.add(rightFootMesh);

    this.rig = {
      root: this.root,
      hips,
      spine,
      chest,
      neck,
      head,
      leftShoulder,
      leftUpperArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightUpperArm,
      rightForearm,
      rightHand,
      warhammer,
      hammerHead,
      hammerGlowMesh,
      hammerImpactPoint,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      cuirassMesh,
      furnaceGrateMesh,
      moltenCoreLight,
    };
  }
}
