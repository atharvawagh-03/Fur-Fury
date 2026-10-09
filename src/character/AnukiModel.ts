/**
 * Lady Anuki 3D Character Model
 * Hand-authored, fully articulated 3D character conforming to PRD Section 11 & Reference Art:
 * - Adorable cream-gold fluffy kitten knight
 * - Expressive sapphire eyes, cute muzzle & pink nose
 * - Signature pale pink ear bow on left ear
 * - Hand-engraved silver plate armor & chainmail skirt
 * - Articulated pauldrons, gauntlets, poleyns, and greaves
 * - Weighted warm ivory cape with multi-bone cloth simulation
 * - Fluffy multi-segment tail with secondary motion
 * - Ornate straight knight blade "Moonfang" and leather hip scabbard
 */

import * as THREE from 'three';
import { AnukiMaterials } from './AnukiMaterials';

export interface AnukiRig {
  root: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  bow: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;

  leftShoulder: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  leftPaw: THREE.Group;

  rightShoulder: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  rightPaw: THREE.Group;
  weaponHand: THREE.Group;

  leftThigh: THREE.Group;
  leftCalf: THREE.Group;
  leftFoot: THREE.Group;

  rightThigh: THREE.Group;
  rightCalf: THREE.Group;
  rightFoot: THREE.Group;

  tailSegments: THREE.Group[];
  capeBones: THREE.Group[];
  capeMesh: THREE.Mesh;

  swordMesh: THREE.Group;
  scabbardMesh: THREE.Group;
}

export class AnukiModel {
  private group: THREE.Group;
  private rig!: AnukiRig;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LadyAnuki_Character';
    this.buildCharacter();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public getRig(): AnukiRig {
    return this.rig;
  }

  private buildCharacter(): void {
    const furMat = AnukiMaterials.createFurMaterial();
    const eyeMat = AnukiMaterials.createEyeMaterial();
    const armorMat = AnukiMaterials.createSilverArmorMaterial();
    const chainmailMat = AnukiMaterials.createChainmailMaterial();
    const capeMat = AnukiMaterials.createCapeMaterial();
    const bowMat = AnukiMaterials.createPinkBowMaterial();
    const leatherMat = AnukiMaterials.createLeatherMaterial();
    const goldMat = AnukiMaterials.createGoldTrimMaterial();
    const steelMat = AnukiMaterials.createSteelBladeMaterial();
    const gemMat = AnukiMaterials.createRubyGemMaterial();

    // 1. Root and Hips Pivot
    const root = new THREE.Group();
    root.name = 'Rig_Root';
    this.group.add(root);

    const hips = new THREE.Group();
    hips.name = 'Rig_Hips';
    hips.position.y = 0.44; // Hip height
    root.add(hips);

    // Fluffy lower torso & pelvis
    const pelvisGeo = new THREE.SphereGeometry(0.18, 16, 16);
    pelvisGeo.scale(1.0, 0.85, 0.9);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, furMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    hips.add(pelvisMesh);

    // Chainmail skirt / fauld
    const skirtGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.18, 16, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, chainmailMat);
    skirtMesh.position.y = -0.06;
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);

    // Leather belt with gold buckle
    const beltGeo = new THREE.CylinderGeometry(0.185, 0.19, 0.05, 16);
    const beltMesh = new THREE.Mesh(beltGeo, leatherMat);
    beltMesh.position.y = 0.04;
    hips.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.06, 0.05, 0.02);
    const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
    buckleMesh.position.set(0, 0.04, 0.185);
    hips.add(buckleMesh);

    // 2. Spine & Chest
    const spine = new THREE.Group();
    spine.name = 'Rig_Spine';
    spine.position.y = 0.08;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.name = 'Rig_Chest';
    chest.position.y = 0.12;
    spine.add(chest);

    // Silver engraved breastplate (Cuirass) with central ridge
    const cuirassGeo = new THREE.CylinderGeometry(0.19, 0.17, 0.24, 16);
    cuirassGeo.scale(1.0, 1.0, 0.85);
    const cuirassMesh = new THREE.Mesh(cuirassGeo, armorMat);
    cuirassMesh.position.y = 0.04;
    cuirassMesh.castShadow = true;
    cuirassMesh.receiveShadow = true;
    chest.add(cuirassMesh);

    // Cuirass central decorative crest ridge
    const ridgeGeo = new THREE.BoxGeometry(0.02, 0.22, 0.04);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, goldMat);
    ridgeMesh.position.set(0, 0.04, 0.15);
    chest.add(ridgeMesh);

    // Gorget (neck armor collar)
    const gorgetGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.06, 16);
    const gorgetMesh = new THREE.Mesh(gorgetGeo, armorMat);
    gorgetMesh.position.y = 0.16;
    gorgetMesh.castShadow = true;
    chest.add(gorgetMesh);

    // 3. Neck & Head
    const neck = new THREE.Group();
    neck.name = 'Rig_Neck';
    neck.position.y = 0.18;
    chest.add(neck);

    const head = new THREE.Group();
    head.name = 'Rig_Head';
    head.position.y = 0.12;
    neck.add(head);

    // Fluffy cream-gold kitten head cranium
    const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
    headGeo.scale(1.08, 0.95, 1.0); // Slightly rounded chubby kitten proportions
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    head.add(headMesh);

    // Fluffy chubby cheeks
    const leftCheekGeo = new THREE.SphereGeometry(0.11, 16, 16);
    leftCheekGeo.scale(1.0, 0.8, 0.9);
    const leftCheek = new THREE.Mesh(leftCheekGeo, furMat);
    leftCheek.position.set(0.14, -0.06, 0.12);
    leftCheek.castShadow = true;
    head.add(leftCheek);

    const rightCheek = new THREE.Mesh(leftCheekGeo, furMat);
    rightCheek.position.set(-0.14, -0.06, 0.12);
    rightCheek.castShadow = true;
    head.add(rightCheek);

    // Snout / Muzzle (soft cream-white)
    const snoutGeo = new THREE.SphereGeometry(0.09, 16, 16);
    snoutGeo.scale(1.1, 0.75, 1.0);
    const snoutMat = new THREE.MeshStandardMaterial({
      color: 0xfff3e0,
      roughness: 0.85,
    });
    const snoutMesh = new THREE.Mesh(snoutGeo, snoutMat);
    snoutMesh.position.set(0, -0.07, 0.18);
    head.add(snoutMesh);

    // Cute tiny pink kitten nose
    const noseGeo = new THREE.ConeGeometry(0.024, 0.024, 8);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xfca3b7,
      roughness: 0.4,
    });
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    noseMesh.rotation.x = Math.PI;
    noseMesh.position.set(0, -0.045, 0.265);
    head.add(noseMesh);

    // Large expressive sapphire blue feline eyes
    const eyeGeo = new THREE.SphereGeometry(0.072, 16, 16);
    eyeGeo.scale(1.0, 1.0, 0.6);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.105, 0.015, 0.19);
    leftEye.rotation.y = 0.22;
    leftEye.rotation.x = -0.05;
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.105, 0.015, 0.19);
    rightEye.rotation.y = -0.22;
    rightEye.rotation.x = -0.05;
    head.add(rightEye);

    // Triangular kitten ears
    const leftEar = new THREE.Group();
    leftEar.name = 'Rig_LeftEar';
    leftEar.position.set(0.14, 0.18, 0.02);
    leftEar.rotation.set(-0.1, 0.2, -0.28);
    head.add(leftEar);

    const earGeo = new THREE.ConeGeometry(0.08, 0.16, 4);
    earGeo.scale(1.0, 1.0, 0.4);
    const leftEarOuter = new THREE.Mesh(earGeo, furMat);
    leftEarOuter.castShadow = true;
    leftEar.add(leftEarOuter);

    // Soft pink inner ear fluff
    const innerEarGeo = new THREE.ConeGeometry(0.06, 0.13, 4);
    innerEarGeo.scale(0.85, 0.85, 0.25);
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: 0xf8bbd0,
      roughness: 0.9,
    });
    const leftInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    leftInnerEar.position.z = 0.015;
    leftEar.add(leftInnerEar);

    const rightEar = new THREE.Group();
    rightEar.name = 'Rig_RightEar';
    rightEar.position.set(-0.14, 0.18, 0.02);
    rightEar.rotation.set(-0.1, -0.2, 0.28);
    head.add(rightEar);

    const rightEarOuter = new THREE.Mesh(earGeo, furMat);
    rightEarOuter.castShadow = true;
    rightEar.add(rightEarOuter);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    rightInnerEar.position.z = 0.015;
    rightEar.add(rightInnerEar);

    // SIGNATURE PINK BOW ON LEFT EAR (per PRD & Reference Image)
    const bow = new THREE.Group();
    bow.name = 'Rig_EarBow';
    bow.position.set(0.12, 0.19, 0.08); // Attached at base of left ear
    bow.rotation.set(0.15, 0.3, -0.2);
    head.add(bow);

    // Bow central knot
    const knotGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const knot = new THREE.Mesh(knotGeo, bowMat);
    knot.castShadow = true;
    bow.add(knot);

    // Left ribbon loop
    const loopGeo = new THREE.TorusGeometry(0.035, 0.014, 8, 16, Math.PI * 1.6);
    const leftLoop = new THREE.Mesh(loopGeo, bowMat);
    leftLoop.rotation.set(0, Math.PI / 2, 0.4);
    leftLoop.position.set(0.032, 0.015, 0);
    leftLoop.castShadow = true;
    bow.add(leftLoop);

    // Right ribbon loop
    const rightLoop = new THREE.Mesh(loopGeo, bowMat);
    rightLoop.rotation.set(0, -Math.PI / 2, -0.4);
    rightLoop.position.set(-0.032, 0.015, 0);
    rightLoop.castShadow = true;
    bow.add(rightLoop);

    // Trailing ribbon tails
    const tailRibbonGeo = new THREE.BoxGeometry(0.018, 0.065, 0.005);
    const ribbonTail1 = new THREE.Mesh(tailRibbonGeo, bowMat);
    ribbonTail1.position.set(0.015, -0.04, 0.01);
    ribbonTail1.rotation.z = -0.3;
    bow.add(ribbonTail1);

    const ribbonTail2 = new THREE.Mesh(tailRibbonGeo, bowMat);
    ribbonTail2.position.set(-0.015, -0.04, 0.01);
    ribbonTail2.rotation.z = 0.3;
    bow.add(ribbonTail2);

    // 4. Arms & Miniature Gauntlets
    // Left Arm (Shield / Free Paw)
    const leftShoulder = new THREE.Group();
    leftShoulder.name = 'Rig_LeftShoulder';
    leftShoulder.position.set(0.20, 0.06, 0.0);
    chest.add(leftShoulder);

    // Left Pauldron (curved shoulder armor plate)
    const pauldronGeo = new THREE.SphereGeometry(0.08, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const leftPauldron = new THREE.Mesh(pauldronGeo, armorMat);
    leftPauldron.rotation.z = -0.3;
    leftPauldron.castShadow = true;
    leftShoulder.add(leftPauldron);

    // Gold rim on pauldron
    const pauldronRimGeo = new THREE.TorusGeometry(0.08, 0.01, 8, 16);
    const leftRim = new THREE.Mesh(pauldronRimGeo, goldMat);
    leftRim.rotation.x = Math.PI / 2;
    leftRim.position.y = -0.02;
    leftShoulder.add(leftRim);

    const leftArm = new THREE.Group();
    leftArm.name = 'Rig_LeftArm';
    leftArm.position.y = -0.04;
    leftShoulder.add(leftArm);

    const armUpperGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.12, 12);
    const leftArmUpper = new THREE.Mesh(armUpperGeo, armorMat);
    leftArmUpper.position.y = -0.06;
    leftArmUpper.castShadow = true;
    leftArm.add(leftArmUpper);

    const leftForearm = new THREE.Group();
    leftForearm.name = 'Rig_LeftForearm';
    leftForearm.position.y = -0.12;
    leftArm.add(leftForearm);

    // Miniature silver gauntlet
    const gauntletGeo = new THREE.CylinderGeometry(0.052, 0.042, 0.12, 12);
    const leftGauntlet = new THREE.Mesh(gauntletGeo, armorMat);
    leftGauntlet.position.y = -0.06;
    leftGauntlet.castShadow = true;
    leftForearm.add(leftGauntlet);

    const leftPaw = new THREE.Group();
    leftPaw.name = 'Rig_LeftPaw';
    leftPaw.position.y = -0.12;
    leftForearm.add(leftPaw);

    const pawGeo = new THREE.SphereGeometry(0.045, 12, 12);
    pawGeo.scale(1.0, 0.8, 1.2);
    const leftPawMesh = new THREE.Mesh(pawGeo, furMat);
    leftPawMesh.castShadow = true;
    leftPaw.add(leftPawMesh);

    // Right Arm (Sword Arm)
    const rightShoulder = new THREE.Group();
    rightShoulder.name = 'Rig_RightShoulder';
    rightShoulder.position.set(-0.20, 0.06, 0.0);
    chest.add(rightShoulder);

    const rightPauldron = new THREE.Mesh(pauldronGeo, armorMat);
    rightPauldron.rotation.z = 0.3;
    rightPauldron.castShadow = true;
    rightShoulder.add(rightPauldron);

    const rightRim = new THREE.Mesh(pauldronRimGeo, goldMat);
    rightRim.rotation.x = Math.PI / 2;
    rightRim.position.y = -0.02;
    rightShoulder.add(rightRim);

    const rightArm = new THREE.Group();
    rightArm.name = 'Rig_RightArm';
    rightArm.position.y = -0.04;
    rightShoulder.add(rightArm);

    const rightArmUpper = new THREE.Mesh(armUpperGeo, armorMat);
    rightArmUpper.position.y = -0.06;
    rightArmUpper.castShadow = true;
    rightArm.add(rightArmUpper);

    const rightForearm = new THREE.Group();
    rightForearm.name = 'Rig_RightForearm';
    rightForearm.position.y = -0.12;
    rightArm.add(rightForearm);

    const rightGauntlet = new THREE.Mesh(gauntletGeo, armorMat);
    rightGauntlet.position.y = -0.06;
    rightGauntlet.castShadow = true;
    rightForearm.add(rightGauntlet);

    const rightPaw = new THREE.Group();
    rightPaw.name = 'Rig_RightPaw';
    rightPaw.position.y = -0.12;
    rightForearm.add(rightPaw);

    const rightPawMesh = new THREE.Mesh(pawGeo, furMat);
    rightPawMesh.castShadow = true;
    rightPaw.add(rightPawMesh);

    const weaponHand = new THREE.Group();
    weaponHand.name = 'Rig_WeaponHand';
    weaponHand.position.set(0, 0, 0.04);
    rightPaw.add(weaponHand);

    // 5. Weapon: MOONFANG (Hero Sword)
    const swordMesh = this.buildMoonfangSword(steelMat, goldMat, leatherMat, gemMat);
    weaponHand.add(swordMesh);

    // Scabbard on left hip
    const scabbardMesh = this.buildScabbard(leatherMat, goldMat);
    scabbardMesh.position.set(0.20, 0.02, -0.04);
    scabbardMesh.rotation.set(0.3, 0.2, -0.3);
    hips.add(scabbardMesh);

    // 6. Hind Legs & Greaves
    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.name = 'Rig_LeftThigh';
    leftThigh.position.set(0.12, -0.08, 0.0);
    hips.add(leftThigh);

    const thighGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.16, 12);
    const leftThighMesh = new THREE.Mesh(thighGeo, armorMat);
    leftThighMesh.position.y = -0.08;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    // Knee Poleyn
    const poleynGeo = new THREE.SphereGeometry(0.04, 10, 10);
    const leftPoleyn = new THREE.Mesh(poleynGeo, goldMat);
    leftPoleyn.position.set(0, -0.16, 0.05);
    leftThigh.add(leftPoleyn);

    const leftCalf = new THREE.Group();
    leftCalf.name = 'Rig_LeftCalf';
    leftCalf.position.y = -0.16;
    leftThigh.add(leftCalf);

    // Silver greave
    const greaveGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.14, 12);
    const leftGreave = new THREE.Mesh(greaveGeo, armorMat);
    leftGreave.position.y = -0.07;
    leftGreave.castShadow = true;
    leftCalf.add(leftGreave);

    const leftFoot = new THREE.Group();
    leftFoot.name = 'Rig_LeftFoot';
    leftFoot.position.y = -0.14;
    leftCalf.add(leftFoot);

    // Cute hind paw with silver sabaton plate
    const hindPawGeo = new THREE.BoxGeometry(0.08, 0.045, 0.12);
    const leftFootMesh = new THREE.Mesh(hindPawGeo, furMat);
    leftFootMesh.position.set(0, -0.02, 0.03);
    leftFootMesh.castShadow = true;
    leftFoot.add(leftFootMesh);

    const sabatonGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.08, 8, 1, false, 0, Math.PI);
    const leftSabaton = new THREE.Mesh(sabatonGeo, armorMat);
    leftSabaton.rotation.x = -Math.PI / 2;
    leftSabaton.position.set(0, 0.0, 0.03);
    leftFoot.add(leftSabaton);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.name = 'Rig_RightThigh';
    rightThigh.position.set(-0.12, -0.08, 0.0);
    hips.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(thighGeo, armorMat);
    rightThighMesh.position.y = -0.08;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightPoleyn = new THREE.Mesh(poleynGeo, goldMat);
    rightPoleyn.position.set(0, -0.16, 0.05);
    rightThigh.add(rightPoleyn);

    const rightCalf = new THREE.Group();
    rightCalf.name = 'Rig_RightCalf';
    rightCalf.position.y = -0.16;
    rightThigh.add(rightCalf);

    const rightGreave = new THREE.Mesh(greaveGeo, armorMat);
    rightGreave.position.y = -0.07;
    rightGreave.castShadow = true;
    rightCalf.add(rightGreave);

    const rightFoot = new THREE.Group();
    rightFoot.name = 'Rig_RightFoot';
    rightFoot.position.y = -0.14;
    rightCalf.add(rightFoot);

    const rightFootMesh = new THREE.Mesh(hindPawGeo, furMat);
    rightFootMesh.position.set(0, -0.02, 0.03);
    rightFootMesh.castShadow = true;
    rightFoot.add(rightFootMesh);

    const rightSabaton = new THREE.Mesh(sabatonGeo, armorMat);
    rightSabaton.rotation.x = -Math.PI / 2;
    rightSabaton.position.set(0, 0.0, 0.03);
    rightFoot.add(rightSabaton);

    // 7. Fluffy Kitten Tail (Multi-Segment Secondary Motion)
    const tailSegments: THREE.Group[] = [];
    let prevTailParent: THREE.Group = hips;
    const numTailSegments = 5;

    for (let t = 0; t < numTailSegments; t++) {
      const seg = new THREE.Group();
      seg.name = `Rig_Tail_${t}`;
      if (t === 0) {
        seg.position.set(0, -0.05, -0.14);
        seg.rotation.x = -0.6; // Arched outward
      } else {
        seg.position.set(0, 0, -0.08);
      }
      prevTailParent.add(seg);
      tailSegments.push(seg);

      // Tail segment mesh
      const radius = 0.045 - t * 0.005;
      const tailGeo = new THREE.SphereGeometry(radius, 10, 10);
      tailGeo.scale(1.0, 1.0, 1.5);
      const tailMat = t === numTailSegments - 1
        ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }) // Cute white tip
        : furMat;
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.castShadow = true;
      seg.add(tailMesh);

      prevTailParent = seg;
    }

    // 8. Flowing Ivory Cape (Multi-Bone Chain & Dynamic Cloth Mesh)
    const { capeMesh, capeBones } = this.buildIvoryCape(chest, capeMat, goldMat);

    // Store complete Rig reference
    this.rig = {
      root,
      hips,
      spine,
      chest,
      neck,
      head,
      leftEar,
      rightEar,
      bow,
      leftEye,
      rightEye,
      leftShoulder,
      leftArm,
      leftForearm,
      leftPaw,
      rightShoulder,
      rightArm,
      rightForearm,
      rightPaw,
      weaponHand,
      leftThigh,
      leftCalf,
      leftFoot,
      rightThigh,
      rightCalf,
      rightFoot,
      tailSegments,
      capeBones,
      capeMesh,
      swordMesh,
      scabbardMesh,
    };
  }

  /**
   * Constructs Moonfang - Lady Anuki's Ornate Straight Knight Sword
   */
  private buildMoonfangSword(
    steelMat: THREE.Material,
    goldMat: THREE.Material,
    leatherMat: THREE.Material,
    gemMat: THREE.Material
  ): THREE.Group {
    const sword = new THREE.Group();
    sword.name = 'Weapon_Moonfang';

    // 1. Blade: double-edged straight blade with fuller
    const bladeLength = 0.62;
    const bladeWidth = 0.055;
    const bladeThickness = 0.012;

    const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeLength, bladeThickness);
    const blade = new THREE.Mesh(bladeGeo, steelMat);
    blade.position.y = bladeLength / 2 + 0.04;
    blade.castShadow = true;
    sword.add(blade);

    // Tapered blade tip
    const tipGeo = new THREE.ConeGeometry(bladeWidth / 2, 0.12, 4);
    tipGeo.scale(1.0, 1.0, bladeThickness / bladeWidth);
    const tip = new THREE.Mesh(tipGeo, steelMat);
    tip.position.y = bladeLength + 0.04 + 0.06;
    tip.rotation.y = Math.PI / 4;
    tip.castShadow = true;
    sword.add(tip);

    // Center fuller groove
    const fullerGeo = new THREE.BoxGeometry(0.012, bladeLength * 0.75, bladeThickness * 1.2);
    const fullerMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.9, roughness: 0.3 });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = bladeLength / 2 + 0.02;
    sword.add(fuller);

    // 2. Ornate Crossguard (winged cruciform with gold filigree)
    const guardGeo = new THREE.BoxGeometry(0.20, 0.03, 0.035);
    const guard = new THREE.Mesh(guardGeo, goldMat);
    guard.position.y = 0.04;
    guard.castShadow = true;
    sword.add(guard);

    // Winged tips
    const wingGeo = new THREE.ConeGeometry(0.02, 0.05, 6);
    const leftWing = new THREE.Mesh(wingGeo, goldMat);
    leftWing.position.set(0.10, 0.05, 0);
    sword.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, goldMat);
    rightWing.position.set(-0.10, 0.05, 0);
    sword.add(rightWing);

    // Center ruby jewel
    const gemGeo = new THREE.OctahedronGeometry(0.018);
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 0.04, 0.02);
    sword.add(gem);

    // 3. Leather-wrapped hilt / grip
    const hiltGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12);
    const hilt = new THREE.Mesh(hiltGeo, leatherMat);
    hilt.position.y = -0.02;
    sword.add(hilt);

    // 4. Round gold pommel
    const pommelGeo = new THREE.SphereGeometry(0.028, 12, 12);
    const pommel = new THREE.Mesh(pommelGeo, goldMat);
    pommel.position.y = -0.09;
    pommel.castShadow = true;
    sword.add(pommel);

    // Orient sword comfortably in paw
    sword.position.set(0, 0, 0.02);
    sword.rotation.set(Math.PI / 2, 0, 0);

    return sword;
  }

  /**
   * Constructs leather hip scabbard with gold chape
   */
  private buildScabbard(leatherMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
    const scabbard = new THREE.Group();
    scabbard.name = 'Scabbard_Moonfang';

    const sheathGeo = new THREE.BoxGeometry(0.065, 0.65, 0.03);
    const sheath = new THREE.Mesh(sheathGeo, leatherMat);
    sheath.position.y = -0.32;
    sheath.castShadow = true;
    scabbard.add(sheath);

    // Gold locket (throat of scabbard)
    const locketGeo = new THREE.BoxGeometry(0.07, 0.04, 0.035);
    const locket = new THREE.Mesh(locketGeo, goldMat);
    locket.position.y = 0.0;
    scabbard.add(locket);

    // Gold chape (protective bottom tip)
    const chapeGeo = new THREE.ConeGeometry(0.035, 0.08, 4);
    chapeGeo.scale(1.0, 1.0, 0.5);
    const chape = new THREE.Mesh(chapeGeo, goldMat);
    chape.position.y = -0.66;
    chape.rotation.x = Math.PI;
    scabbard.add(chape);

    return scabbard;
  }

  /**
   * Constructs flowing ivory cape with multi-bone chain
   */
  private buildIvoryCape(
    chestParent: THREE.Group,
    capeMat: THREE.Material,
    goldMat: THREE.Material
  ): { capeMesh: THREE.Mesh; capeBones: THREE.Group[] } {
    // Twin gold lion clasps on shoulders
    const claspGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 12);
    const leftClasp = new THREE.Mesh(claspGeo, goldMat);
    leftClasp.rotation.x = Math.PI / 2;
    leftClasp.position.set(0.13, 0.14, 0.06);
    chestParent.add(leftClasp);

    const rightClasp = new THREE.Mesh(claspGeo, goldMat);
    rightClasp.rotation.x = Math.PI / 2;
    rightClasp.position.set(-0.13, 0.14, 0.06);
    chestParent.add(rightClasp);

    // Multi-segment cape bone hierarchy
    const capeBones: THREE.Group[] = [];
    let prevBone: THREE.Group = chestParent;
    const numCapeBones = 4;

    for (let b = 0; b < numCapeBones; b++) {
      const bone = new THREE.Group();
      bone.name = `Rig_CapeBone_${b}`;
      if (b === 0) {
        bone.position.set(0, 0.14, -0.14);
      } else {
        bone.position.set(0, -0.15, -0.01);
      }
      prevBone.add(bone);
      capeBones.push(bone);
      prevBone = bone;
    }

    // High-resolution curved cape cloth geometry
    const widthTop = 0.36;
    const widthBottom = 0.56;
    const height = 0.64;

    const capeGeo = new THREE.PlaneGeometry(widthBottom, height, 16, 24);
    // Taper top width
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const normalizedY = (y + height / 2) / height; // 0 at bottom, 1 at top
      const widthFactor = (1 - normalizedY) * (widthBottom / widthBottom) + normalizedY * (widthTop / widthBottom);
      pos.setX(i, pos.getX(i) * widthFactor);

      // Natural cloth curvature wrapping around back
      const x = pos.getX(i);
      pos.setZ(i, -Math.cos((x / (widthBottom / 2)) * (Math.PI / 2.4)) * 0.05);
    }
    capeGeo.computeVertexNormals();

    const capeMesh = new THREE.Mesh(capeGeo, capeMat);
    capeMesh.castShadow = true;
    capeMesh.receiveShadow = true;
    capeMesh.position.set(0, -0.18, -0.14);
    chestParent.add(capeMesh);

    return { capeMesh, capeBones };
  }
}
