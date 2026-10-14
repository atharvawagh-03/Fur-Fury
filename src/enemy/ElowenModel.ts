/**
 * 3D Articulated Rig & Model for Dame Elowen Vale, the Rose Sentinel
 * Conforming strictly to PRD Section 6 & 12:
 * - Rose-etched polished steel plate armor
 * - Burgundy tabard, upright duelist silhouette
 * - Slim duelist rapier with swept basket hilt
 */

import * as THREE from 'three';

export interface ElowenRig {
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

  // Weapon
  rapier: THREE.Group;
  rapierBlade: THREE.Mesh;
  rapierTip: THREE.Object3D;
  rapierHilt: THREE.Mesh;

  // Legs
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;

  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;

  cuirassMesh: THREE.Mesh;
  tabardMesh: THREE.Mesh;
}

export class ElowenModel {
  private root: THREE.Group;
  private rig!: ElowenRig;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'DameElowen_Root';
    this.buildCharacter();
  }

  public getRoot(): THREE.Group {
    return this.root;
  }

  public getRig(): ElowenRig {
    return this.rig;
  }

  public getRapierTipWorldPosition(target: THREE.Vector3): void {
    if (this.rig.rapierTip) {
      this.rig.rapierTip.getWorldPosition(target);
    } else {
      this.root.getWorldPosition(target);
    }
  }

  private buildCharacter(): void {
    // PBR Materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xccd4df,
      metalness: 0.90,
      roughness: 0.22,
    });

    const roseGoldMat = new THREE.MeshStandardMaterial({
      color: 0xe0a088,
      metalness: 0.85,
      roughness: 0.28,
    });

    const burgundyMat = new THREE.MeshStandardMaterial({
      color: 0x5a1825,
      metalness: 0.15,
      roughness: 0.75,
    });

    const darkLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x241d1a,
      metalness: 0.10,
      roughness: 0.70,
    });

    const faceMat = new THREE.MeshStandardMaterial({
      color: 0xe8c8b4,
      metalness: 0.05,
      roughness: 0.65,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x221a16,
      metalness: 0.1,
      roughness: 0.8,
    });

    // 1. Root & Hips (Pelvis at Y = 1.0m)
    const hips = new THREE.Group();
    hips.position.y = 1.0;
    this.root.add(hips);

    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.22, 12);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, steelMat);
    pelvisMesh.castShadow = true;
    hips.add(pelvisMesh);

    // 2. Spine & Chest (Slim athletic duelist torso)
    const spine = new THREE.Group();
    spine.position.y = 0.14;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.22;
    spine.add(chest);

    // Polished steel corset cuirass with rose filigree trim
    const cuirassGeo = new THREE.BoxGeometry(0.48, 0.42, 0.32);
    const cuirassMesh = new THREE.Mesh(cuirassGeo, steelMat);
    cuirassMesh.position.y = 0.04;
    cuirassMesh.castShadow = true;
    chest.add(cuirassMesh);

    // Rose emblem engraved at center of breastplate
    const roseGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10);
    const roseMesh = new THREE.Mesh(roseGeo, roseGoldMat);
    roseMesh.rotation.x = Math.PI / 2;
    roseMesh.position.set(0, 0.10, 0.17);
    roseMesh.castShadow = true;
    chest.add(roseMesh);

    // Elegant burgundy velvet duelist tabard with split tails
    const tabardGeo = new THREE.BoxGeometry(0.32, 0.68, 0.34);
    const tabardMesh = new THREE.Mesh(tabardGeo, burgundyMat);
    tabardMesh.position.set(0, -0.14, 0);
    tabardMesh.castShadow = true;
    chest.add(tabardMesh);

    // 3. Neck & Head
    const neck = new THREE.Group();
    neck.position.y = 0.28;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.16;
    neck.add(head);

    const faceGeo = new THREE.SphereGeometry(0.15, 14, 14);
    faceGeo.scale(0.85, 1.05, 0.9);
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.castShadow = true;
    head.add(faceMesh);

    // Sleek dark hair tied back in an elegant duelist braid
    const hairGeo = new THREE.SphereGeometry(0.16, 12, 12);
    hairGeo.scale(0.9, 1.0, 1.05);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.04, -0.04);
    hairMesh.castShadow = true;
    head.add(hairMesh);

    const braidGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.38, 8);
    const braidMesh = new THREE.Mesh(braidGeo, hairMat);
    braidMesh.position.set(0, -0.12, -0.18);
    braidMesh.rotation.x = 0.2;
    braidMesh.castShadow = true;
    head.add(braidMesh);

    // 4. Arms & Duelist Shoulders
    // Left Arm (Held behind back or poised defensively)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.30, 0.16, 0);
    chest.add(leftShoulder);

    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.y = -0.14;
    leftShoulder.add(leftUpperArm);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.30, 8);
    const leftUpperMesh = new THREE.Mesh(armGeo, burgundyMat);
    leftUpperMesh.position.y = -0.12;
    leftUpperMesh.castShadow = true;
    leftUpperArm.add(leftUpperMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.28;
    leftUpperArm.add(leftForearm);

    const forearmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.28, 8);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, steelMat);
    leftForearmMesh.position.y = -0.12;
    leftForearmMesh.castShadow = true;
    leftForearm.add(leftForearmMesh);

    const leftHand = new THREE.Group();
    leftHand.position.y = -0.26;
    leftForearm.add(leftHand);

    // Right Arm (Holds Duelist Rapier)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.30, 0.16, 0);
    chest.add(rightShoulder);

    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.y = -0.14;
    rightShoulder.add(rightUpperArm);

    const rightUpperMesh = new THREE.Mesh(armGeo, burgundyMat);
    rightUpperMesh.position.y = -0.12;
    rightUpperMesh.castShadow = true;
    rightUpperArm.add(rightUpperMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.28;
    rightUpperArm.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, steelMat);
    rightForearmMesh.position.y = -0.12;
    rightForearmMesh.castShadow = true;
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.y = -0.26;
    rightForearm.add(rightHand);

    // 5. Slim Duelist Rapier
    const rapier = new THREE.Group();
    rapier.name = 'Rose_Sentinel_Rapier';
    rapier.rotation.x = Math.PI / 2;
    rightHand.add(rapier);

    // Swept basket guard hilt
    const hiltGeo = new THREE.TorusGeometry(0.10, 0.02, 8, 16, Math.PI * 1.5);
    const rapierHilt = new THREE.Mesh(hiltGeo, roseGoldMat);
    rapierHilt.rotation.y = Math.PI / 2;
    rapierHilt.position.y = 0.04;
    rapierHilt.castShadow = true;
    rapier.add(rapierHilt);

    // 1.15m flexible needle-sharp rapier blade
    const bladeGeo = new THREE.CylinderGeometry(0.012, 0.005, 1.15, 6);
    const rapierBlade = new THREE.Mesh(bladeGeo, steelMat);
    rapierBlade.position.y = 0.62;
    rapierBlade.castShadow = true;
    rapier.add(rapierBlade);

    const rapierTip = new THREE.Object3D();
    rapierTip.position.y = 1.20;
    rapier.add(rapierTip);

    // 6. Legs & Long Duelist Boots
    const thighGeo = new THREE.CylinderGeometry(0.10, 0.08, 0.42, 8);
    const bootGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.44, 8);
    const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.24);

    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.14, -0.10, 0);
    hips.add(leftThigh);

    const leftThighMesh = new THREE.Mesh(thighGeo, burgundyMat);
    leftThighMesh.position.y = -0.20;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    const leftShin = new THREE.Group();
    leftShin.position.y = -0.42;
    leftThigh.add(leftShin);

    const leftShinMesh = new THREE.Mesh(bootGeo, darkLeatherMat);
    leftShinMesh.position.y = -0.20;
    leftShinMesh.castShadow = true;
    leftShin.add(leftShinMesh);

    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.42;
    leftShin.add(leftFoot);

    const leftFootMesh = new THREE.Mesh(footGeo, darkLeatherMat);
    leftFootMesh.position.set(0, 0.04, 0.05);
    leftFootMesh.castShadow = true;
    leftFoot.add(leftFootMesh);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.14, -0.10, 0);
    hips.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(thighGeo, burgundyMat);
    rightThighMesh.position.y = -0.20;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightShin = new THREE.Group();
    rightShin.position.y = -0.42;
    rightThigh.add(rightShin);

    const rightShinMesh = new THREE.Mesh(bootGeo, darkLeatherMat);
    rightShinMesh.position.y = -0.20;
    rightShinMesh.castShadow = true;
    rightShin.add(rightShinMesh);

    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.42;
    rightShin.add(rightFoot);

    const rightFootMesh = new THREE.Mesh(footGeo, darkLeatherMat);
    rightFootMesh.position.set(0, 0.04, 0.05);
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
      rapier,
      rapierBlade,
      rapierTip,
      rapierHilt,
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
