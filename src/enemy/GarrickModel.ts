/**
 * Articulated 3D Rig & Model for Sir Garrick Ironjaw, the Gatekeeper
 * Conforming strictly to PRD Section 6, 9, 12:
 * - Realistic adult human proportions (~2.15m tall)
 * - Iron-grey heavy plate armor, square silhouette, scarred open-face sallet helmet
 * - Broad halberd with crescent blade, top thrusting spear, and rear armor hook
 */

import * as THREE from 'three';
import { GarrickMaterials } from './GarrickMaterials';

export interface GarrickRig {
  root: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  helmet: THREE.Group;

  // Arms
  leftShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;

  rightShoulder: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;

  // Weapon
  halberd: THREE.Group;
  halberdBlade: THREE.Mesh;
  halberdTip: THREE.Object3D;
  halberdBase: THREE.Object3D;

  // Legs
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;

  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;

  // Armor highlights & mesh references
  cuirassMesh: THREE.Mesh;
  tabardMesh: THREE.Mesh;
}

export class GarrickModel {
  private root: THREE.Group;
  private rig!: GarrickRig;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'SirGarrick_Root';
    this.buildCharacter();
  }

  public getRoot(): THREE.Group {
    return this.root;
  }

  public getRig(): GarrickRig {
    return this.rig;
  }

  public getHalberdTipWorldPosition(target: THREE.Vector3): void {
    if (this.rig.halberdTip) {
      this.rig.halberdTip.getWorldPosition(target);
    } else {
      this.root.getWorldPosition(target);
    }
  }

  public getHalberdBladeWorldPosition(target: THREE.Vector3): void {
    if (this.rig.halberdBlade) {
      this.rig.halberdBlade.getWorldPosition(target);
    } else {
      this.root.getWorldPosition(target);
    }
  }

  public getHalberdBaseWorldPosition(target: THREE.Vector3): void {
    if (this.rig.halberdBase) {
      this.rig.halberdBase.getWorldPosition(target);
    } else {
      this.root.getWorldPosition(target);
    }
  }

  private buildCharacter(): void {
    const ironMat = GarrickMaterials.createHeavyIronPlateMaterial();
    const darkIronMat = GarrickMaterials.createDarkIronMaterial();
    const chainmailMat = GarrickMaterials.createChainmailMaterial();
    const faceMat = GarrickMaterials.createFaceMaterial();
    const brassMat = GarrickMaterials.createBrassAccentMaterial();
    const tabardMat = GarrickMaterials.createBurgundyTabardMaterial();
    const bladeMat = GarrickMaterials.createHalberdBladeMaterial();
    const shaftMat = GarrickMaterials.createHalberdShaftMaterial();

    // 1. Root & Hips (Pelvis at Y = 1.05m)
    const hips = new THREE.Group();
    hips.position.y = 1.05;
    this.root.add(hips);

    // Pelvis fauld plate
    const pelvisGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.26, 12);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, ironMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    hips.add(pelvisMesh);

    // Chainmail skirt peeking beneath fauld
    const skirtGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.32, 12, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, chainmailMat);
    skirtMesh.position.y = -0.10;
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);

    // 2. Spine & Chest (Y = 0.22 above hips)
    const spine = new THREE.Group();
    spine.position.y = 0.16;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.24;
    spine.add(chest);

    // Heavy iron breastplate with prominent central deflecting ridge
    const cuirassGeo = new THREE.BoxGeometry(0.64, 0.46, 0.42);
    const cuirassMesh = new THREE.Mesh(cuirassGeo, ironMat);
    cuirassMesh.position.y = 0.04;
    cuirassMesh.castShadow = true;
    cuirassMesh.receiveShadow = true;
    chest.add(cuirassMesh);

    // Central brass crest medallion on cuirass
    const medallionGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
    const medallion = new THREE.Mesh(medallionGeo, brassMat);
    medallion.rotation.x = Math.PI / 2;
    medallion.position.set(0, 0.10, 0.22);
    medallion.castShadow = true;
    chest.add(medallion);

    // Burgundy tabard sash hanging over breastplate and hips
    const tabardGeo = new THREE.BoxGeometry(0.36, 0.72, 0.44);
    const tabardMesh = new THREE.Mesh(tabardGeo, tabardMat);
    tabardMesh.position.set(0, -0.12, 0);
    tabardMesh.castShadow = true;
    chest.add(tabardMesh);

    // 3. Neck & Head (Neck at Y = 0.32 above chest)
    const neck = new THREE.Group();
    neck.position.y = 0.32;
    chest.add(neck);

    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.14, 10);
    const neckMesh = new THREE.Mesh(neckGeo, chainmailMat);
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    const head = new THREE.Group();
    head.position.y = 0.18;
    neck.add(head);

    // Knight head with scarred face texture
    const faceGeo = new THREE.SphereGeometry(0.18, 16, 16);
    faceGeo.scale(0.9, 1.1, 0.95);
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.castShadow = true;
    head.add(faceMesh);

    // Scarred open-face sallet helmet with brow ridge and cheek plates
    const helmet = new THREE.Group();
    head.add(helmet);

    const helmCapGeo = new THREE.SphereGeometry(0.21, 16, 16);
    helmCapGeo.scale(1.0, 1.15, 1.1);
    const helmCap = new THREE.Mesh(helmCapGeo, ironMat);
    helmCap.position.set(0, 0.04, -0.02);
    helmCap.castShadow = true;
    helmet.add(helmCap);

    // Helm comb crest ridge running over skull
    const combGeo = new THREE.BoxGeometry(0.06, 0.12, 0.38);
    const combMesh = new THREE.Mesh(combGeo, darkIronMat);
    combMesh.position.set(0, 0.18, -0.02);
    combMesh.castShadow = true;
    helmet.add(combMesh);

    // Open-face visor brow rim
    const browGeo = new THREE.BoxGeometry(0.38, 0.08, 0.18);
    const browMesh = new THREE.Mesh(browGeo, brassMat);
    browMesh.position.set(0, 0.08, 0.14);
    browMesh.castShadow = true;
    helmet.add(browMesh);

    // 4. Arms & Heavy Pauldrons
    // Left Arm (Shield / Braced Arm)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.38, 0.18, 0);
    chest.add(leftShoulder);

    // Layered square iron pauldron
    const pauldronGeo = new THREE.BoxGeometry(0.28, 0.24, 0.32);
    const leftPauldron = new THREE.Mesh(pauldronGeo, ironMat);
    leftPauldron.position.set(-0.06, 0.02, 0);
    leftPauldron.castShadow = true;
    leftShoulder.add(leftPauldron);

    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.y = -0.16;
    leftShoulder.add(leftUpperArm);

    const upperArmGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.34, 10);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, ironMat);
    leftUpperArmMesh.position.y = -0.14;
    leftUpperArmMesh.castShadow = true;
    leftUpperArm.add(leftUpperArmMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.32;
    leftUpperArm.add(leftForearm);

    const forearmGeo = new THREE.CylinderGeometry(0.10, 0.09, 0.32, 10);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, ironMat);
    leftForearmMesh.position.y = -0.14;
    leftForearmMesh.castShadow = true;
    leftForearm.add(leftForearmMesh);

    const leftHand = new THREE.Group();
    leftHand.position.y = -0.30;
    leftForearm.add(leftHand);

    const gauntletGeo = new THREE.BoxGeometry(0.14, 0.14, 0.16);
    const leftGauntlet = new THREE.Mesh(gauntletGeo, darkIronMat);
    leftGauntlet.castShadow = true;
    leftHand.add(leftGauntlet);

    // Right Arm (Primary Weapon Arm holding Halberd)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.38, 0.18, 0);
    chest.add(rightShoulder);

    const rightPauldron = new THREE.Mesh(pauldronGeo, ironMat);
    rightPauldron.position.set(0.06, 0.02, 0);
    rightPauldron.castShadow = true;
    rightShoulder.add(rightPauldron);

    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.y = -0.16;
    rightShoulder.add(rightUpperArm);

    const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, ironMat);
    rightUpperArmMesh.position.y = -0.14;
    rightUpperArmMesh.castShadow = true;
    rightUpperArm.add(rightUpperArmMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.32;
    rightUpperArm.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, ironMat);
    rightForearmMesh.position.y = -0.14;
    rightForearmMesh.castShadow = true;
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.y = -0.30;
    rightForearm.add(rightHand);

    const rightGauntlet = new THREE.Mesh(gauntletGeo, darkIronMat);
    rightGauntlet.castShadow = true;
    rightHand.add(rightGauntlet);

    // 5. Broad Halberd Weapon Attached to Right Hand
    const halberd = new THREE.Group();
    halberd.name = 'Gatekeeper_Halberd';
    // Offset so hand grips the middle-upper balance point of the shaft
    halberd.position.set(0, 0, 0);
    halberd.rotation.x = Math.PI / 2; // Forward alignment
    rightHand.add(halberd);

    // 2.4m ash-wood shaft
    const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.45, 8);
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0.55; // Extended forwards and backwards from grip
    shaft.castShadow = true;
    halberd.add(shaft);

    // Bottom counter-weight butt spike (Base)
    const buttGeo = new THREE.ConeGeometry(0.05, 0.18, 8);
    const butt = new THREE.Mesh(buttGeo, brassMat);
    butt.rotation.x = Math.PI;
    butt.position.y = -0.70;
    butt.castShadow = true;
    halberd.add(butt);

    const halberdBase = new THREE.Object3D();
    halberdBase.position.y = -0.70;
    halberd.add(halberdBase);

    // Head mounting socket collar
    const collarGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.22, 8);
    const collar = new THREE.Mesh(collarGeo, darkIronMat);
    collar.position.y = 1.62;
    collar.castShadow = true;
    halberd.add(collar);

    // Crescent Axe Blade (Forward cutting edge)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, -0.25);
    bladeShape.quadraticCurveTo(0.42, 0.0, 0.38, 0.32);
    bladeShape.lineTo(0.05, 0.22);
    bladeShape.lineTo(0.05, -0.18);
    bladeShape.closePath();

    const extrudeSettings = { depth: 0.025, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.015, bevelThickness: 0.01 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    bladeGeo.center();
    const halberdBlade = new THREE.Mesh(bladeGeo, bladeMat);
    halberdBlade.position.set(0.18, 1.72, 0);
    halberdBlade.castShadow = true;
    halberd.add(halberdBlade);

    // Rear Armor Hook / Pick (Opposite side of crescent blade)
    const hookShape = new THREE.Shape();
    hookShape.moveTo(0, -0.06);
    hookShape.lineTo(-0.24, -0.14);
    hookShape.lineTo(-0.26, -0.04);
    hookShape.lineTo(0, 0.08);
    hookShape.closePath();

    const hookGeo = new THREE.ExtrudeGeometry(hookShape, extrudeSettings);
    hookGeo.center();
    const hookMesh = new THREE.Mesh(hookGeo, bladeMat);
    hookMesh.position.set(-0.14, 1.68, 0);
    hookMesh.castShadow = true;
    halberd.add(hookMesh);

    // Top Thrusting Spear Point (42cm piercing spike)
    const spearGeo = new THREE.ConeGeometry(0.06, 0.42, 4);
    spearGeo.scale(0.8, 1, 0.3); // Flatted diamond cross-section
    const spearMesh = new THREE.Mesh(spearGeo, bladeMat);
    spearMesh.position.y = 1.95;
    spearMesh.castShadow = true;
    halberd.add(spearMesh);

    const halberdTip = new THREE.Object3D();
    halberdTip.position.y = 2.16; // Extreme piercing tip
    halberd.add(halberdTip);

    // 6. Legs & Greaves (Left & Right)
    const legGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.44, 10);
    const shinGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.44, 10);
    const kneeGeo = new THREE.SphereGeometry(0.13, 10, 10);
    const sabatonGeo = new THREE.BoxGeometry(0.18, 0.12, 0.32);

    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.18, -0.12, 0);
    hips.add(leftThigh);

    const leftThighMesh = new THREE.Mesh(legGeo, ironMat);
    leftThighMesh.position.y = -0.22;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    const leftShin = new THREE.Group();
    leftShin.position.y = -0.46;
    leftThigh.add(leftShin);

    const leftKnee = new THREE.Mesh(kneeGeo, brassMat);
    leftKnee.position.set(0, 0, 0.04);
    leftKnee.castShadow = true;
    leftShin.add(leftKnee);

    const leftShinMesh = new THREE.Mesh(shinGeo, ironMat);
    leftShinMesh.position.y = -0.22;
    leftShinMesh.castShadow = true;
    leftShin.add(leftShinMesh);

    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.46;
    leftShin.add(leftFoot);

    const leftSabaton = new THREE.Mesh(sabatonGeo, darkIronMat);
    leftSabaton.position.set(0, 0.06, 0.06);
    leftSabaton.castShadow = true;
    leftFoot.add(leftSabaton);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.18, -0.12, 0);
    hips.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(legGeo, ironMat);
    rightThighMesh.position.y = -0.22;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightShin = new THREE.Group();
    rightShin.position.y = -0.46;
    rightThigh.add(rightShin);

    const rightKnee = new THREE.Mesh(kneeGeo, brassMat);
    rightKnee.position.set(0, 0, 0.04);
    rightKnee.castShadow = true;
    rightShin.add(rightKnee);

    const rightShinMesh = new THREE.Mesh(shinGeo, ironMat);
    rightShinMesh.position.y = -0.22;
    rightShinMesh.castShadow = true;
    rightShin.add(rightShinMesh);

    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.46;
    rightShin.add(rightFoot);

    const rightSabaton = new THREE.Mesh(sabatonGeo, darkIronMat);
    rightSabaton.position.set(0, 0.06, 0.06);
    rightSabaton.castShadow = true;
    rightFoot.add(rightSabaton);

    // Populate Rig Reference Object
    this.rig = {
      root: this.root,
      hips,
      spine,
      chest,
      neck,
      head,
      helmet,
      leftShoulder,
      leftUpperArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightUpperArm,
      rightForearm,
      rightHand,
      halberd,
      halberdBlade,
      halberdTip,
      halberdBase,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      cuirassMesh,
      tabardMesh,
    };
  }
}
