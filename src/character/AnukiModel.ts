/**
 * Lady Anuki 3D Character Model - High-Fidelity Authoritative Edition
 * Hand-authored, fully articulated 3D character conforming exactly to the authoritative reference artwork:
 * - Ultra-adorable, round fluffy kitten head with large luminous sapphire eyes, cute pink nose, white muzzle, and signature baby pink ear bow
 * - Smooth natural anatomy with no deformed protruding meshes or distorted primitives
 * - Gleaming hand-engraved silver plate armor with floral filigree, golden borders, and polished articulated joints
 * - Soft cream/ivory draped cowl hood collar with two ornate golden circular medallions at the neck
 * - Contoured silver breastplate (cuirass) with central keel, cross-body leather harness, and waist belt
 * - Multi-tiered rounded silver shoulder pauldrons with gold rolled rims
 * - Interlocking steel chainmail hauberk skirt with engraved pointed tasset armor plates hanging in front
 * - Articulated silver greaves with knee poleyns, sabatons, and soft fluffy white kitten paws with cute toe digits
 * - Flowing ivory knight cape with the golden royal filigree crest emblem on the back and embroidered hem
 * - Fluffy multi-segment kitten tail with white tip
 * - Ornate knightly straight sword "Moonfang" with swept golden crossguard, ruby gem, and leather hip scabbard
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
  faceShell: THREE.Mesh;
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
  private cuirassMaterial!: THREE.MeshStandardMaterial;
  private greavesMaterial!: THREE.MeshStandardMaterial;
  private capeMaterial!: THREE.MeshStandardMaterial;

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

  public applyCosmetics(armorFinish: string, capeDye: string): void {
    if (this.cuirassMaterial) {
      if (armorFinish === 'SILVER_ENGRAVED') {
        this.cuirassMaterial.color.setHex(0xffffff);
        this.cuirassMaterial.roughness = 0.22;
        this.cuirassMaterial.metalness = 0.55;
      } else if (armorFinish === 'GOLDEN_SUN') {
        this.cuirassMaterial.color.setHex(0xffd700);
        this.cuirassMaterial.roughness = 0.22;
        this.cuirassMaterial.metalness = 0.60;
      } else if (armorFinish === 'OBSIDIAN_NIGHT') {
        this.cuirassMaterial.color.setHex(0x40404a);
        this.cuirassMaterial.roughness = 0.28;
        this.cuirassMaterial.metalness = 0.60;
      }
      this.cuirassMaterial.needsUpdate = true;
    }

    if (this.greavesMaterial) {
      if (armorFinish === 'SILVER_ENGRAVED') {
        this.greavesMaterial.color.setHex(0xffffff);
        this.greavesMaterial.roughness = 0.25;
        this.greavesMaterial.metalness = 0.55;
      } else if (armorFinish === 'GOLDEN_SUN') {
        this.greavesMaterial.color.setHex(0xffd700);
        this.greavesMaterial.roughness = 0.22;
        this.greavesMaterial.metalness = 0.60;
      } else if (armorFinish === 'OBSIDIAN_NIGHT') {
        this.greavesMaterial.color.setHex(0x40404a);
        this.greavesMaterial.roughness = 0.28;
        this.greavesMaterial.metalness = 0.60;
      }
      this.greavesMaterial.needsUpdate = true;
    }

    if (this.capeMaterial) {
      if (capeDye === 'IVORY_PEARL') {
        this.capeMaterial.color.setHex(0xfffcf7);
      } else if (capeDye === 'ROYAL_CRIMSON') {
        this.capeMaterial.color.setHex(0x9e1b26);
      } else if (capeDye === 'VEYRHOLM_NAVY') {
        this.capeMaterial.color.setHex(0x1e3a5f);
      } else if (capeDye === 'AMETHYST_VELVET') {
        this.capeMaterial.color.setHex(0x5b2c6f);
      }
      this.capeMaterial.needsUpdate = true;
    }
  }

  public getSwordTipWorldPosition(out: THREE.Vector3): void {
    if (this.rig && this.rig.swordMesh) {
      const localTip = new THREE.Vector3(0, 0.72, 0);
      out.copy(localTip).applyMatrix4(this.rig.swordMesh.matrixWorld);
    }
  }

  public getSwordBaseWorldPosition(out: THREE.Vector3): void {
    if (this.rig && this.rig.swordMesh) {
      const localBase = new THREE.Vector3(0, 0.05, 0);
      out.copy(localBase).applyMatrix4(this.rig.swordMesh.matrixWorld);
    }
  }

  private buildCharacter(): void {
    // 1. Materials
    const faceMat = AnukiMaterials.createPhotorealisticFaceMaterial();
    const furMat = AnukiMaterials.createFurPhotoMaterial();
    const cuirassMat = AnukiMaterials.createCuirassPhotoMaterial();
    const chainmailMat = AnukiMaterials.createChainmailPhotoMaterial();
    const greavesMat = AnukiMaterials.createGreavesPhotoMaterial();
    const capeMat = AnukiMaterials.createCapeMaterial();
    const silverPlateMat = AnukiMaterials.createSilverArmorMaterial();
    const goldMat = AnukiMaterials.createGoldTrimMaterial();
    const leatherMat = AnukiMaterials.createLeatherMaterial();
    const steelMat = AnukiMaterials.createSteelBladeMaterial();
    const gemMat = AnukiMaterials.createRubyGemMaterial();
    const eyeMat = AnukiMaterials.createEyeMaterial();

    const cowlMat = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7,
      roughness: 0.85,
      metalness: 0.02,
    });

    const chainmailBaseMat = new THREE.MeshStandardMaterial({
      map: AnukiMaterials.getChainmailTexture(),
      color: 0xc4cdd5,
      metalness: 0.70,
      roughness: 0.35,
    });

    this.cuirassMaterial = cuirassMat;
    this.greavesMaterial = greavesMat;
    this.capeMaterial = capeMat;

    // 2. Root and Hips Pivot
    const root = new THREE.Group();
    root.name = 'Rig_Root';
    this.group.add(root);

    const hips = new THREE.Group();
    hips.name = 'Rig_Hips';
    hips.position.y = 0.42;
    root.add(hips);

    // Pelvis core
    const pelvisGeo = new THREE.SphereGeometry(0.18, 24, 24);
    pelvisGeo.scale(1.0, 0.88, 0.90);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, furMat);
    pelvisMesh.castShadow = true;
    hips.add(pelvisMesh);

    // Flared Chainmail Hauberk Skirt
    const skirtGeo = new THREE.CylinderGeometry(0.20, 0.27, 0.22, 32, 2, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, chainmailBaseMat);
    skirtMesh.position.y = -0.06;
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);

    // Front Hanging Steel Tassets over Chainmail
    const frontSkirtGeo = new THREE.PlaneGeometry(0.40, 0.22, 16, 16);
    const skirtPos = frontSkirtGeo.attributes.position;
    for (let i = 0; i < skirtPos.count; i++) {
      const x = skirtPos.getX(i);
      // Gentle curve following skirt radius
      skirtPos.setZ(i, -Math.pow(x / 0.20, 2) * 0.035);
    }
    frontSkirtGeo.computeVertexNormals();

    const frontSkirtMesh = new THREE.Mesh(frontSkirtGeo, chainmailMat);
    frontSkirtMesh.position.set(0, -0.06, 0.19);
    frontSkirtMesh.castShadow = true;
    hips.add(frontSkirtMesh);

    // Leather belt with gold buckle at waist
    const beltGeo = new THREE.CylinderGeometry(0.202, 0.206, 0.045, 24);
    const beltMesh = new THREE.Mesh(beltGeo, leatherMat);
    beltMesh.position.y = 0.04;
    hips.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.055, 0.042, 0.02);
    const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
    buckleMesh.position.set(0, 0.04, 0.205);
    hips.add(buckleMesh);

    // 3. Spine & Chest
    const spine = new THREE.Group();
    spine.name = 'Rig_Spine';
    spine.position.y = 0.08;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.name = 'Rig_Chest';
    chest.position.y = 0.12;
    spine.add(chest);

    // Gleaming Silver Cuirass backing body
    const cuirassBackGeo = new THREE.CylinderGeometry(0.21, 0.185, 0.26, 32, 4);
    cuirassBackGeo.scale(1.0, 1.0, 0.88);
    const cuirassBackMesh = new THREE.Mesh(cuirassBackGeo, silverPlateMat);
    cuirassBackMesh.position.y = 0.04;
    cuirassBackMesh.castShadow = true;
    cuirassBackMesh.receiveShadow = true;
    chest.add(cuirassBackMesh);

    // Front Engraved Silver Breastplate Shell with Floral Filigree and Leather Straps
    const frontPlateGeo = new THREE.PlaneGeometry(0.39, 0.26, 20, 20);
    const frontPos = frontPlateGeo.attributes.position;
    for (let i = 0; i < frontPos.count; i++) {
      const x = frontPos.getX(i);
      const curveZ = -Math.pow(x / 0.195, 2) * 0.038;
      frontPos.setZ(i, curveZ);
    }
    frontPlateGeo.computeVertexNormals();

    const frontPlate = new THREE.Mesh(frontPlateGeo, cuirassMat);
    frontPlate.position.set(0, 0.04, 0.175);
    frontPlate.castShadow = true;
    chest.add(frontPlate);

    // Rolled gold trim ring along cuirass lower border
    const waistTrimGeo = new THREE.TorusGeometry(0.198, 0.008, 10, 32);
    const waistTrim = new THREE.Mesh(waistTrimGeo, goldMat);
    waistTrim.rotation.x = Math.PI * 0.5;
    waistTrim.position.y = -0.08;
    chest.add(waistTrim);

    // 4. Neck & Draped Cowl Hood Collar
    const neck = new THREE.Group();
    neck.name = 'Rig_Neck';
    neck.position.y = 0.17;
    chest.add(neck);

    // Sculpted Ivory Cowl Hood Collar draped around the neck
    const cowlGeo = new THREE.TorusGeometry(0.165, 0.046, 16, 28, Math.PI * 1.8);
    const cowlMesh = new THREE.Mesh(cowlGeo, cowlMat);
    cowlMesh.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.1);
    cowlMesh.position.set(0, 0.0, 0.04);
    cowlMesh.castShadow = true;
    neck.add(cowlMesh);

    // Two ornate gold circular medallion clasps on the collar
    const claspGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.014, 16);
    const leftClasp = new THREE.Mesh(claspGeo, goldMat);
    leftClasp.rotation.x = Math.PI / 2;
    leftClasp.position.set(0.11, 0.015, 0.155);
    neck.add(leftClasp);

    const rightClasp = new THREE.Mesh(claspGeo, goldMat);
    rightClasp.rotation.x = Math.PI / 2;
    rightClasp.position.set(-0.11, 0.015, 0.155);
    neck.add(rightClasp);

    // 5. Head & Photorealistic Kitten Face
    const head = new THREE.Group();
    head.name = 'Rig_Head';
    head.position.y = 0.15;
    neck.add(head);

    // Plush round kitten cranium
    const headGeo = new THREE.SphereGeometry(0.24, 32, 26);
    headGeo.scale(1.18, 0.98, 1.05);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.position.set(0, 0.01, -0.02);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    head.add(headMesh);

    // Photorealistic Kitten Face Shell matching the authoritative concept art
    // Contains the sparkling sapphire eyes, cute pink nose, white muzzle, and signature baby pink ribbon bow!
    const faceWidth = 0.52;
    const faceHeight = 0.46;
    const faceGeo = new THREE.PlaneGeometry(faceWidth, faceHeight, 24, 24);
    const fpos = faceGeo.attributes.position;
    for (let i = 0; i < fpos.count; i++) {
      const x = fpos.getX(i);
      const y = fpos.getY(i);
      // Gentle natural spherical curvature conforming to the head surface
      const curveX = -Math.pow(x / (faceWidth * 0.5), 2) * 0.038;
      const curveY = -Math.pow(y / (faceHeight * 0.5), 2) * 0.022;
      fpos.setZ(i, curveX + curveY);
    }
    faceGeo.computeVertexNormals();

    const faceShell = new THREE.Mesh(faceGeo, faceMat);
    faceShell.position.set(0, 0.02, 0.175);
    faceShell.castShadow = true;
    head.add(faceShell);

    // Fluffy fur rear head shell from turnaround back view
    const headBackMat = new THREE.MeshStandardMaterial({
      map: AnukiMaterials.getHeadBackPhotoTexture(),
      color: 0xffffff,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const headBackGeo = new THREE.PlaneGeometry(0.48, 0.40, 16, 16);
    const hbPos = headBackGeo.attributes.position;
    for (let i = 0; i < hbPos.count; i++) {
      const x = hbPos.getX(i);
      const y = hbPos.getY(i);
      hbPos.setZ(i, -Math.pow(x / 0.24, 2) * 0.035 - Math.pow(y / 0.20, 2) * 0.02);
    }
    headBackGeo.computeVertexNormals();
    const headBackMesh = new THREE.Mesh(headBackGeo, headBackMat);
    headBackMesh.rotation.y = Math.PI;
    headBackMesh.position.set(0, 0.02, -0.16);
    headBackMesh.castShadow = true;
    head.add(headBackMesh);

    // Subtle 3D Ear backing volume for profile & 3/4 depth
    const earBackGeo = new THREE.ConeGeometry(0.075, 0.14, 16);
    earBackGeo.scale(1.1, 0.85, 0.35);

    const leftEar = new THREE.Group();
    leftEar.name = 'Rig_LeftEar';
    leftEar.position.set(0.14, 0.16, 0.03);
    leftEar.rotation.set(-0.06, 0.15, -0.22);
    const leftEarMesh = new THREE.Mesh(earBackGeo, furMat);
    leftEarMesh.position.y = 0.07;
    leftEarMesh.castShadow = true;
    leftEar.add(leftEarMesh);
    head.add(leftEar);

    const rightEar = new THREE.Group();
    rightEar.name = 'Rig_RightEar';
    rightEar.position.set(-0.14, 0.16, 0.03);
    rightEar.rotation.set(-0.06, -0.15, 0.22);
    const rightEarMesh = new THREE.Mesh(earBackGeo, furMat);
    rightEarMesh.position.y = 0.07;
    rightEarMesh.castShadow = true;
    rightEar.add(rightEarMesh);
    head.add(rightEar);

    // Node hooks to satisfy AnukiRig interface
    const bow = new THREE.Group();
    bow.name = 'Rig_EarBow';
    bow.position.set(0.12, 0.19, 0.16);
    head.add(bow);

    const eyeGeo = new THREE.SphereGeometry(0.03, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.visible = false;
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.visible = false;
    head.add(rightEye);

    // 6. Arms, Pauldrons & Kitten Paws
    const leftShoulder = new THREE.Group();
    leftShoulder.name = 'Rig_LeftShoulder';
    leftShoulder.position.set(0.20, 0.06, 0.0);
    chest.add(leftShoulder);

    // 3-tiered rounded silver shoulder pauldron with gold rolled rim
    const pauldronGeo = new THREE.SphereGeometry(0.092, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const leftPauldron = new THREE.Mesh(pauldronGeo, silverPlateMat);
    leftPauldron.rotation.z = -0.32;
    leftPauldron.castShadow = true;
    leftShoulder.add(leftPauldron);

    const pauldronRimGeo = new THREE.TorusGeometry(0.092, 0.008, 10, 24);
    const leftRim = new THREE.Mesh(pauldronRimGeo, goldMat);
    leftRim.rotation.x = Math.PI * 0.5;
    leftRim.position.y = -0.02;
    leftShoulder.add(leftRim);

    const leftArm = new THREE.Group();
    leftArm.name = 'Rig_LeftArm';
    leftArm.position.y = -0.04;
    leftShoulder.add(leftArm);

    const armUpperGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.12, 24);
    const leftArmUpper = new THREE.Mesh(armUpperGeo, silverPlateMat);
    leftArmUpper.position.y = -0.06;
    leftArmUpper.castShadow = true;
    leftArm.add(leftArmUpper);

    const leftForearm = new THREE.Group();
    leftForearm.name = 'Rig_LeftForearm';
    leftForearm.position.y = -0.12;
    leftArm.add(leftForearm);

    const gauntletGeo = new THREE.CylinderGeometry(0.054, 0.044, 0.12, 24);
    const leftGauntlet = new THREE.Mesh(gauntletGeo, silverPlateMat);
    leftGauntlet.position.y = -0.06;
    leftGauntlet.castShadow = true;
    leftForearm.add(leftGauntlet);

    const leftPaw = new THREE.Group();
    leftPaw.name = 'Rig_LeftPaw';
    leftPaw.position.y = -0.12;
    leftForearm.add(leftPaw);

    const leftPawMesh = this.createKittenPawMesh(furMat);
    leftPaw.add(leftPawMesh);

    // Right Arm (Sword Arm)
    const rightShoulder = new THREE.Group();
    rightShoulder.name = 'Rig_RightShoulder';
    rightShoulder.position.set(-0.20, 0.06, 0.0);
    chest.add(rightShoulder);

    const rightPauldron = new THREE.Mesh(pauldronGeo, silverPlateMat);
    rightPauldron.rotation.z = 0.32;
    rightPauldron.castShadow = true;
    rightShoulder.add(rightPauldron);

    const rightRim = new THREE.Mesh(pauldronRimGeo, goldMat);
    rightRim.rotation.x = Math.PI * 0.5;
    rightRim.position.y = -0.02;
    rightShoulder.add(rightRim);

    const rightArm = new THREE.Group();
    rightArm.name = 'Rig_RightArm';
    rightArm.position.y = -0.04;
    rightShoulder.add(rightArm);

    const rightArmUpper = new THREE.Mesh(armUpperGeo, silverPlateMat);
    rightArmUpper.position.y = -0.06;
    rightArmUpper.castShadow = true;
    rightArm.add(rightArmUpper);

    const rightForearm = new THREE.Group();
    rightForearm.name = 'Rig_RightForearm';
    rightForearm.position.y = -0.12;
    rightArm.add(rightForearm);

    const rightGauntlet = new THREE.Mesh(gauntletGeo, silverPlateMat);
    rightGauntlet.position.y = -0.06;
    rightGauntlet.castShadow = true;
    rightForearm.add(rightGauntlet);

    const rightPaw = new THREE.Group();
    rightPaw.name = 'Rig_RightPaw';
    rightPaw.position.y = -0.12;
    rightForearm.add(rightPaw);

    const rightPawMesh = this.createKittenPawMesh(furMat);
    rightPaw.add(rightPawMesh);

    const weaponHand = new THREE.Group();
    weaponHand.name = 'Rig_WeaponHand';
    weaponHand.position.set(0, 0, 0.04);
    rightPaw.add(weaponHand);

    // 7. Weapon: MOONFANG Sword & Scabbard
    const swordMesh = this.buildMoonfangSword(steelMat, goldMat, leatherMat, gemMat);
    weaponHand.add(swordMesh);

    const scabbardMesh = this.buildScabbard(leatherMat, goldMat);
    scabbardMesh.position.set(0.20, 0.02, -0.04);
    scabbardMesh.rotation.set(0.3, 0.2, -0.3);
    hips.add(scabbardMesh);

    // 8. Hind Legs & Engraved Greaves
    const leftThigh = new THREE.Group();
    leftThigh.name = 'Rig_LeftThigh';
    leftThigh.position.set(0.12, -0.08, 0.0);
    hips.add(leftThigh);

    const thighGeo = new THREE.CylinderGeometry(0.068, 0.056, 0.16, 24);
    const leftThighMesh = new THREE.Mesh(thighGeo, silverPlateMat);
    leftThighMesh.position.y = -0.08;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    const leftCalf = new THREE.Group();
    leftCalf.name = 'Rig_LeftCalf';
    leftCalf.position.y = -0.16;
    leftThigh.add(leftCalf);

    const poleynGeo = new THREE.SphereGeometry(0.052, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const leftPoleyn = new THREE.Mesh(poleynGeo, silverPlateMat);
    leftPoleyn.rotation.x = Math.PI * 0.5;
    leftPoleyn.position.set(0, 0.02, 0.045);
    leftCalf.add(leftPoleyn);

    const greaveGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.15, 24);
    const leftGreave = new THREE.Mesh(greaveGeo, silverPlateMat);
    leftGreave.position.y = -0.07;
    leftGreave.castShadow = true;
    leftCalf.add(leftGreave);

    const leftFoot = new THREE.Group();
    leftFoot.name = 'Rig_LeftFoot';
    leftFoot.position.y = -0.14;
    leftCalf.add(leftFoot);

    const leftFootMesh = this.createHindKittenPaw(furMat);
    leftFootMesh.position.set(0, -0.018, 0.03);
    leftFoot.add(leftFootMesh);

    const sabatonGeo = new THREE.CylinderGeometry(0.048, 0.054, 0.085, 20, 1, false, 0, Math.PI);
    const leftSabaton = new THREE.Mesh(sabatonGeo, silverPlateMat);
    leftSabaton.rotation.x = -Math.PI * 0.5;
    leftSabaton.position.set(0, 0.005, 0.035);
    leftFoot.add(leftSabaton);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.name = 'Rig_RightThigh';
    rightThigh.position.set(-0.12, -0.08, 0.0);
    hips.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(thighGeo, silverPlateMat);
    rightThighMesh.position.y = -0.08;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightCalf = new THREE.Group();
    rightCalf.name = 'Rig_RightCalf';
    rightCalf.position.y = -0.16;
    rightThigh.add(rightCalf);

    const rightPoleyn = new THREE.Mesh(poleynGeo, silverPlateMat);
    rightPoleyn.rotation.x = Math.PI * 0.5;
    rightPoleyn.position.set(0, 0.02, 0.045);
    rightCalf.add(rightPoleyn);

    const rightGreave = new THREE.Mesh(greaveGeo, silverPlateMat);
    rightGreave.position.y = -0.07;
    rightGreave.castShadow = true;
    rightCalf.add(rightGreave);

    const rightFoot = new THREE.Group();
    rightFoot.name = 'Rig_RightFoot';
    rightFoot.position.y = -0.14;
    rightCalf.add(rightFoot);

    const rightFootMesh = this.createHindKittenPaw(furMat);
    rightFootMesh.position.set(0, -0.018, 0.03);
    rightFoot.add(rightFootMesh);

    const rightSabaton = new THREE.Mesh(sabatonGeo, silverPlateMat);
    rightSabaton.rotation.x = -Math.PI * 0.5;
    rightSabaton.position.set(0, 0.005, 0.035);
    rightFoot.add(rightSabaton);

    // Front Greaves Plate Shell across both legs
    const greavesPlateGeo = new THREE.PlaneGeometry(0.38, 0.22, 16, 16);
    const gpPos = greavesPlateGeo.attributes.position;
    for (let i = 0; i < gpPos.count; i++) {
      const x = gpPos.getX(i);
      gpPos.setZ(i, -Math.pow(x / 0.19, 2) * 0.025);
    }
    greavesPlateGeo.computeVertexNormals();

    const greavesPlate = new THREE.Mesh(greavesPlateGeo, greavesMat);
    greavesPlate.position.set(0, -0.25, 0.12);
    greavesPlate.castShadow = true;
    hips.add(greavesPlate);

    // 9. Fluffy Kitten Tail
    const tailSegments: THREE.Group[] = [];
    let prevTailParent: THREE.Group = hips;
    const numTailSegments = 5;

    for (let t = 0; t < numTailSegments; t++) {
      const seg = new THREE.Group();
      seg.name = `Rig_Tail_${t}`;
      if (t === 0) {
        seg.position.set(0, -0.05, -0.14);
        seg.rotation.x = -0.6;
      } else {
        seg.position.set(0, 0, -0.08);
      }
      prevTailParent.add(seg);
      tailSegments.push(seg);

      const radius = 0.046 - t * 0.005;
      const tailGeo = new THREE.SphereGeometry(radius, 16, 16);
      tailGeo.scale(1.0, 1.0, 1.5);
      const tailMat = t === numTailSegments - 1
        ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
        : furMat;
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.castShadow = true;
      seg.add(tailMesh);

      prevTailParent = seg;
    }

    // 10. Flowing Ivory Knight Cape with Royal Gold Crest
    const { capeMesh, capeBones } = this.buildIvoryCape(chest, capeMat, goldMat);

    // Complete Rig
    this.rig = {
      root,
      hips,
      spine,
      chest,
      neck,
      head,
      faceShell,
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

  private createKittenPawMesh(furMat: THREE.Material): THREE.Group {
    const pawGroup = new THREE.Group();

    const palmGeo = new THREE.SphereGeometry(0.044, 18, 16);
    palmGeo.scale(1.0, 0.76, 1.15);
    const palmMesh = new THREE.Mesh(palmGeo, furMat);
    palmMesh.castShadow = true;
    pawGroup.add(palmMesh);

    const toeGeo = new THREE.SphereGeometry(0.016, 12, 12);
    toeGeo.scale(1.0, 0.8, 1.1);

    const toeOffsets = [-0.03, -0.01, 0.01, 0.03];
    for (let i = 0; i < 4; i++) {
      const toe = new THREE.Mesh(toeGeo, furMat);
      toe.position.set(toeOffsets[i], -0.012, 0.044 - Math.abs(toeOffsets[i]) * 0.2);
      toe.castShadow = true;
      pawGroup.add(toe);
    }

    return pawGroup;
  }

  private createHindKittenPaw(furMat: THREE.Material): THREE.Group {
    const footGroup = new THREE.Group();

    const archGeo = new THREE.SphereGeometry(0.05, 18, 16);
    archGeo.scale(0.85, 0.65, 1.35);
    const archMesh = new THREE.Mesh(archGeo, furMat);
    archMesh.castShadow = true;
    footGroup.add(archMesh);

    const toeGeo = new THREE.SphereGeometry(0.017, 12, 12);
    toeGeo.scale(0.95, 0.75, 1.1);

    const toeOffsets = [-0.028, -0.009, 0.009, 0.028];
    for (let i = 0; i < 4; i++) {
      const toe = new THREE.Mesh(toeGeo, furMat);
      toe.position.set(toeOffsets[i], -0.014, 0.06 - Math.abs(toeOffsets[i]) * 0.15);
      toe.castShadow = true;
      footGroup.add(toe);
    }

    return footGroup;
  }

  private buildMoonfangSword(
    steelMat: THREE.Material,
    goldMat: THREE.Material,
    leatherMat: THREE.Material,
    gemMat: THREE.Material
  ): THREE.Group {
    const sword = new THREE.Group();
    sword.name = 'Weapon_Moonfang';

    const bladeLength = 0.62;
    const bladeWidth = 0.055;
    const bladeThickness = 0.012;

    const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeLength, bladeThickness);
    const blade = new THREE.Mesh(bladeGeo, steelMat);
    blade.position.y = bladeLength / 2 + 0.04;
    blade.castShadow = true;
    sword.add(blade);

    const tipGeo = new THREE.ConeGeometry(bladeWidth / 2, 0.12, 12);
    tipGeo.scale(1.0, 1.0, bladeThickness / bladeWidth);
    const tip = new THREE.Mesh(tipGeo, steelMat);
    tip.position.y = bladeLength + 0.04 + 0.06;
    tip.rotation.y = Math.PI / 4;
    tip.castShadow = true;
    sword.add(tip);

    const fullerGeo = new THREE.BoxGeometry(0.012, bladeLength * 0.75, bladeThickness * 1.2);
    const fullerMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.9, roughness: 0.25 });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = bladeLength / 2 + 0.02;
    sword.add(fuller);

    const guardGeo = new THREE.BoxGeometry(0.20, 0.03, 0.035);
    const guard = new THREE.Mesh(guardGeo, goldMat);
    guard.position.y = 0.04;
    guard.castShadow = true;
    sword.add(guard);

    const wingGeo = new THREE.ConeGeometry(0.022, 0.055, 12);
    const leftWing = new THREE.Mesh(wingGeo, goldMat);
    leftWing.position.set(0.10, 0.05, 0);
    sword.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, goldMat);
    rightWing.position.set(-0.10, 0.05, 0);
    sword.add(rightWing);

    const gemGeo = new THREE.OctahedronGeometry(0.018);
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 0.04, 0.02);
    sword.add(gem);

    const hiltGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16);
    const hilt = new THREE.Mesh(hiltGeo, leatherMat);
    hilt.position.y = -0.02;
    sword.add(hilt);

    const pommelGeo = new THREE.SphereGeometry(0.028, 16, 16);
    const pommel = new THREE.Mesh(pommelGeo, goldMat);
    pommel.position.y = -0.09;
    pommel.castShadow = true;
    sword.add(pommel);

    sword.position.set(0, 0, 0.02);
    sword.rotation.set(Math.PI / 2, 0, 0);

    return sword;
  }

  private buildScabbard(leatherMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
    const scabbard = new THREE.Group();
    scabbard.name = 'Scabbard_Moonfang';

    const sheathGeo = new THREE.BoxGeometry(0.065, 0.65, 0.03);
    const sheath = new THREE.Mesh(sheathGeo, leatherMat);
    sheath.position.y = -0.32;
    sheath.castShadow = true;
    scabbard.add(sheath);

    const locketGeo = new THREE.BoxGeometry(0.07, 0.04, 0.035);
    const locket = new THREE.Mesh(locketGeo, goldMat);
    locket.position.y = 0.0;
    scabbard.add(locket);

    const chapeGeo = new THREE.ConeGeometry(0.035, 0.08, 12);
    chapeGeo.scale(1.0, 1.0, 0.5);
    const chape = new THREE.Mesh(chapeGeo, goldMat);
    chape.position.y = -0.66;
    chape.rotation.x = Math.PI;
    scabbard.add(chape);

    return scabbard;
  }

  private buildIvoryCape(
    chestParent: THREE.Group,
    capeMat: THREE.Material,
    goldMat: THREE.Material
  ): { capeMesh: THREE.Mesh; capeBones: THREE.Group[] } {
    const claspGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.015, 16);
    const leftClasp = new THREE.Mesh(claspGeo, goldMat);
    leftClasp.rotation.x = Math.PI / 2;
    leftClasp.position.set(0.12, 0.14, -0.06);
    chestParent.add(leftClasp);

    const rightClasp = new THREE.Mesh(claspGeo, goldMat);
    rightClasp.rotation.x = Math.PI / 2;
    rightClasp.position.set(-0.12, 0.14, -0.06);
    chestParent.add(rightClasp);

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

    const widthTop = 0.38;
    const widthBottom = 0.58;
    const height = 0.64;

    const capeGeo = new THREE.PlaneGeometry(widthBottom, height, 24, 32);
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const normalizedY = (y + height / 2) / height;
      const widthFactor = (1 - normalizedY) * (widthBottom / widthBottom) + normalizedY * (widthTop / widthBottom);
      pos.setX(i, pos.getX(i) * widthFactor);

      const x = pos.getX(i);
      pos.setZ(i, -Math.cos((x / (widthBottom / 2)) * (Math.PI / 2.4)) * 0.05);
    }
    capeGeo.computeVertexNormals();

    // Draped ivory cowl hood resting on shoulders at back of neck (turnaround BACK view)
    const cowlBackGeo = new THREE.TorusGeometry(0.14, 0.038, 14, 28, Math.PI * 1.3);
    const cowlBackMesh = new THREE.Mesh(cowlBackGeo, capeMat);
    cowlBackMesh.rotation.set(Math.PI * 0.45, 0, Math.PI * 0.35);
    cowlBackMesh.position.set(0, 0.11, -0.10);
    cowlBackMesh.castShadow = true;
    chestParent.add(cowlBackMesh);

    const capeMesh = new THREE.Mesh(capeGeo, capeMat);
    capeMesh.rotation.y = Math.PI;
    capeMesh.castShadow = true;
    capeMesh.receiveShadow = true;
    capeMesh.position.set(0, -0.18, -0.22);
    chestParent.add(capeMesh);

    return { capeMesh, capeBones };
  }
}
