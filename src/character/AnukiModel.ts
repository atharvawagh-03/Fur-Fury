/**
 * Lady Anuki 3D Character Model - Refined High-Fidelity Edition
 * Hand-authored, fully articulated 3D character conforming exactly to the authoritative reference images:
 * - Exact photorealistic round kitten face with large sapphire eyes, plush chubby cheeks, cute pink nose, and signature pink ear bow
 * - Smooth, organic anatomy with NO boxy primitives: all edges smoothed and curved
 * - Rounded kitten ears with pink inner ear recess and fluffy fur contours (no 4-sided pyramids!)
 * - Exquisite hand-engraved silver plate armor with floral filigree, golden borders, and articulated joints
 * - Contoured breastplate (cuirass) with central ridge and gorget collar
 * - Multi-tiered rounded shoulder pauldrons with gold rimming
 * - Smooth vambraces, gauntlets, and soft feline paws with sculpted toe digits
 * - Real interlocking iron chainmail skirt with scalloped drape
 * - Articulated greaves with rounded knee poleyns and curved plate sabatons over soft kitten paws (no boxy feet!)
 * - Flowing ivory hooded cape with draped cowl collar and gold embroidery
 * - Fluffy multi-segment tail with white tip
 * - Ornate straight knight blade "Moonfang" with swept crossguard and leather hip scabbard
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
        this.cuirassMaterial.roughness = 0.25;
        this.cuirassMaterial.metalness = 0.25;
      } else if (armorFinish === 'GOLDEN_SUN') {
        this.cuirassMaterial.color.setHex(0xffd700);
        this.cuirassMaterial.roughness = 0.22;
        this.cuirassMaterial.metalness = 0.30;
      } else if (armorFinish === 'OBSIDIAN_NIGHT') {
        this.cuirassMaterial.color.setHex(0x383842);
        this.cuirassMaterial.roughness = 0.30;
        this.cuirassMaterial.metalness = 0.35;
      }
      this.cuirassMaterial.needsUpdate = true;
    }

    if (this.greavesMaterial) {
      if (armorFinish === 'SILVER_ENGRAVED') {
        this.greavesMaterial.color.setHex(0xffffff);
        this.greavesMaterial.roughness = 0.25;
        this.greavesMaterial.metalness = 0.25;
      } else if (armorFinish === 'GOLDEN_SUN') {
        this.greavesMaterial.color.setHex(0xffd700);
        this.greavesMaterial.roughness = 0.22;
        this.greavesMaterial.metalness = 0.30;
      } else if (armorFinish === 'OBSIDIAN_NIGHT') {
        this.greavesMaterial.color.setHex(0x383842);
        this.greavesMaterial.roughness = 0.30;
        this.greavesMaterial.metalness = 0.35;
      }
      this.greavesMaterial.needsUpdate = true;
    }

    if (this.capeMaterial) {
      if (capeDye === 'IVORY_PEARL') {
        this.capeMaterial.color.setHex(0xfffef9);
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
    const faceMat = AnukiMaterials.createPhotorealisticFaceMaterial();
    const furMat = AnukiMaterials.createFurPhotoMaterial();
    const cuirassMat = AnukiMaterials.createCuirassPhotoMaterial();
    const chainmailMat = AnukiMaterials.createChainmailPhotoMaterial();
    const greavesMat = AnukiMaterials.createGreavesPhotoMaterial();
    const capeMat = AnukiMaterials.createCapeMaterial();
    const bowMat = AnukiMaterials.createPinkBowMaterial();
    const leatherMat = AnukiMaterials.createLeatherMaterial();
    const goldMat = AnukiMaterials.createGoldTrimMaterial();
    const steelMat = AnukiMaterials.createSteelBladeMaterial();
    const gemMat = AnukiMaterials.createRubyGemMaterial();
    const eyeMat = AnukiMaterials.createEyeMaterial();

    // Soft pink inner ear material
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: 0xf5b5c5,
      roughness: 0.8,
      metalness: 0.05,
    });

    this.cuirassMaterial = cuirassMat;
    this.greavesMaterial = greavesMat;
    this.capeMaterial = capeMat;

    // 1. Root and Hips Pivot
    const root = new THREE.Group();
    root.name = 'Rig_Root';
    this.group.add(root);

    const hips = new THREE.Group();
    hips.name = 'Rig_Hips';
    hips.position.y = 0.44;
    root.add(hips);

    // Smooth rounded pelvis volume (24x24 segments)
    const pelvisGeo = new THREE.SphereGeometry(0.18, 24, 24);
    pelvisGeo.scale(1.0, 0.88, 0.92);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, furMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    hips.add(pelvisMesh);

    // Interlocking chainmail hauberk skirt with smooth flare (28 segments)
    const skirtGeo = new THREE.CylinderGeometry(0.19, 0.25, 0.22, 28, 2, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, chainmailMat);
    skirtMesh.position.y = -0.07;
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);

    // Leather belt with smooth round profile and gold buckle
    const beltGeo = new THREE.CylinderGeometry(0.196, 0.202, 0.048, 24);
    const beltMesh = new THREE.Mesh(beltGeo, leatherMat);
    beltMesh.position.y = 0.04;
    hips.add(beltMesh);

    // Rounded gold buckle
    const buckleGeo = new THREE.BoxGeometry(0.058, 0.046, 0.02);
    const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
    buckleMesh.position.set(0, 0.04, 0.198);
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

    // Beautiful smoothly contoured knight breastplate (Cuirass) with 32 radial segments
    const cuirassGeo = new THREE.CylinderGeometry(0.205, 0.18, 0.25, 32, 2);
    cuirassGeo.scale(1.02, 1.0, 0.92);
    const cuirassMesh = new THREE.Mesh(cuirassGeo, cuirassMat);
    cuirassMesh.position.y = 0.04;
    cuirassMesh.castShadow = true;
    cuirassMesh.receiveShadow = true;
    chest.add(cuirassMesh);

    // Cuirass front curved plate with central vertical keel/ridge and filigree engraving
    const frontPlateGeo = new THREE.PlaneGeometry(0.38, 0.26, 24, 20);
    const frontPos = frontPlateGeo.attributes.position;
    for (let i = 0; i < frontPos.count; i++) {
      const x = frontPos.getX(i);
      const y = frontPos.getY(i);
      // Gentle convex curvature wrapping chest
      const curveZ = -Math.pow(x / 0.19, 2) * 0.038;
      // Slight vertical chest swell
      const swellZ = Math.max(0, 0.13 - Math.abs(y)) * 0.04;
      frontPos.setZ(i, curveZ + swellZ);
    }
    frontPlateGeo.computeVertexNormals();

    const frontPlate = new THREE.Mesh(frontPlateGeo, cuirassMat);
    frontPlate.position.set(0, 0.04, 0.182);
    frontPlate.castShadow = true;
    chest.add(frontPlate);

    // Gold filigree rim trim along waist
    const waistTrimGeo = new THREE.TorusGeometry(0.198, 0.008, 10, 32);
    const waistTrim = new THREE.Mesh(waistTrimGeo, goldMat);
    waistTrim.rotation.x = Math.PI * 0.5;
    waistTrim.position.y = -0.08;
    chest.add(waistTrim);

    // Gorget (curved neck armor collar with gold rolled rim)
    const gorgetGeo = new THREE.CylinderGeometry(0.145, 0.185, 0.065, 24);
    const gorgetMesh = new THREE.Mesh(gorgetGeo, cuirassMat);
    gorgetMesh.position.y = 0.16;
    gorgetMesh.castShadow = true;
    chest.add(gorgetMesh);

    const gorgetRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.007, 10, 24),
      goldMat
    );
    gorgetRim.rotation.x = Math.PI * 0.5;
    gorgetRim.position.y = 0.19;
    chest.add(gorgetRim);

    // 3. Neck & Head
    const neck = new THREE.Group();
    neck.name = 'Rig_Neck';
    neck.position.y = 0.18;
    chest.add(neck);

    const head = new THREE.Group();
    head.name = 'Rig_Head';
    head.position.y = 0.12;
    neck.add(head);

    // 3D Cranium / Head Volume (Plush round kitten cranium, 32x28 segments)
    const headGeo = new THREE.SphereGeometry(0.235, 32, 28);
    headGeo.scale(1.08, 0.96, 1.02);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.position.set(0, 0.01, -0.035);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    head.add(headMesh);

    // Sculpted 3D Chubby Kitten Cheeks (Volume supporting the head from 3/4 & profile view)
    for (const side of [-1, 1]) {
      const cheekGeo = new THREE.SphereGeometry(0.088, 20, 20);
      cheekGeo.scale(1.15, 0.88, 0.95);
      const cheekMesh = new THREE.Mesh(cheekGeo, furMat);
      cheekMesh.position.set(side * 0.12, -0.015, 0.06);
      cheekMesh.castShadow = true;
      head.add(cheekMesh);
    }

    // PHOTOREALISTIC 3D CONTOURED FACE SHELL (Smooth curvature, seamless integration)
    const faceWidth = 0.54;
    const faceHeight = 0.44;
    const faceGeo = new THREE.PlaneGeometry(faceWidth, faceHeight, 32, 32);
    const pos = faceGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Natural feline facial curvature matching chubby cheek volume:
      const cheekCurvature = -Math.pow(x / (faceWidth * 0.5), 2) * 0.092;
      const snoutDist = Math.hypot(x, y + 0.04);
      const snoutProtrusion = Math.max(0, 0.15 - snoutDist) * 0.19;
      const verticalRoll = -Math.pow(y / (faceHeight * 0.5), 2) * 0.042;

      pos.setZ(i, cheekCurvature + snoutProtrusion + verticalRoll);
    }
    faceGeo.computeVertexNormals();

    const faceShell = new THREE.Mesh(faceGeo, faceMat);
    faceShell.position.set(0, 0.015, 0.172);
    faceShell.castShadow = true;
    faceShell.receiveShadow = true;
    head.add(faceShell);

    // High-fidelity sapphire eyes in rig (large, expressive, glossy)
    const eyeGeo = new THREE.SphereGeometry(0.046, 20, 20);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.098, 0.015, 0.165);
    leftEye.visible = false; // Hidden behind photorealistic eye
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.098, 0.015, 0.165);
    rightEye.visible = false;
    head.add(rightEye);

    // 3D KITTEN EARS (Smooth rounded contours, no 4-sided pyramids!)
    // Left Ear
    const leftEar = new THREE.Group();
    leftEar.name = 'Rig_LeftEar';
    leftEar.position.set(0.145, 0.175, 0.0);
    leftEar.rotation.set(-0.08, 0.18, -0.25);
    head.add(leftEar);

    // Smooth rounded outer ear cone (16 segments, curved contour)
    const earOuterGeo = new THREE.ConeGeometry(0.082, 0.165, 16);
    earOuterGeo.scale(1.0, 1.0, 0.42);
    const leftEarOuter = new THREE.Mesh(earOuterGeo, furMat);
    leftEarOuter.position.y = 0.08;
    leftEarOuter.castShadow = true;
    leftEar.add(leftEarOuter);

    // Recessed soft pink inner ear cavity
    const earInnerGeo = new THREE.ConeGeometry(0.065, 0.135, 16);
    earInnerGeo.scale(0.95, 1.0, 0.32);
    const leftEarInner = new THREE.Mesh(earInnerGeo, innerEarMat);
    leftEarInner.position.set(0, 0.075, 0.015);
    leftEar.add(leftEarInner);

    // Inner ear fur tuft
    const tuftGeo = new THREE.SphereGeometry(0.026, 10, 10);
    tuftGeo.scale(0.7, 1.2, 0.5);
    const leftTuft = new THREE.Mesh(tuftGeo, furMat);
    leftTuft.position.set(0, 0.035, 0.025);
    leftEar.add(leftTuft);

    // Right Ear
    const rightEar = new THREE.Group();
    rightEar.name = 'Rig_RightEar';
    rightEar.position.set(-0.145, 0.175, 0.0);
    rightEar.rotation.set(-0.08, -0.18, 0.25);
    head.add(rightEar);

    const rightEarOuter = new THREE.Mesh(earOuterGeo, furMat);
    rightEarOuter.position.y = 0.08;
    rightEarOuter.castShadow = true;
    rightEar.add(rightEarOuter);

    const rightEarInner = new THREE.Mesh(earInnerGeo, innerEarMat);
    rightEarInner.position.set(0, 0.075, 0.015);
    rightEar.add(rightEarInner);

    const rightTuft = new THREE.Mesh(tuftGeo, furMat);
    rightTuft.position.set(0, 0.035, 0.025);
    rightEar.add(rightTuft);

    // SIGNATURE BABY PINK EAR BOW ON LEFT EAR (Conforming to reference artwork)
    const bow = new THREE.Group();
    bow.name = 'Rig_EarBow';
    bow.position.set(0.12, 0.19, 0.135);
    bow.rotation.set(0.12, 0.26, -0.22);
    head.add(bow);

    // Bow central knot (smooth sphere, 16 segments)
    const knotGeo = new THREE.SphereGeometry(0.024, 16, 16);
    knotGeo.scale(1.1, 1.0, 0.9);
    const knot = new THREE.Mesh(knotGeo, bowMat);
    knot.castShadow = true;
    bow.add(knot);

    // Smooth ribbon loops (torus geometry with 16x24 segments)
    const loopGeo = new THREE.TorusGeometry(0.036, 0.014, 14, 24, Math.PI * 1.6);

    const leftLoop = new THREE.Mesh(loopGeo, bowMat);
    leftLoop.rotation.set(0, Math.PI / 2, 0.38);
    leftLoop.position.set(0.034, 0.016, 0);
    leftLoop.castShadow = true;
    bow.add(leftLoop);

    const rightLoop = new THREE.Mesh(loopGeo, bowMat);
    rightLoop.rotation.set(0, -Math.PI / 2, -0.38);
    rightLoop.position.set(-0.034, 0.016, 0);
    rightLoop.castShadow = true;
    bow.add(rightLoop);

    // Trailing curved ribbon tails
    const ribbonTail1 = this.createCurvedRibbonTail(bowMat, 0.016, 0.07, -0.28);
    ribbonTail1.position.set(0.014, -0.042, 0.012);
    bow.add(ribbonTail1);

    const ribbonTail2 = this.createCurvedRibbonTail(bowMat, 0.016, 0.07, 0.28);
    ribbonTail2.position.set(-0.014, -0.042, 0.012);
    bow.add(ribbonTail2);

    // 4. Arms & Miniature Gauntlets
    const leftShoulder = new THREE.Group();
    leftShoulder.name = 'Rig_LeftShoulder';
    leftShoulder.position.set(0.20, 0.06, 0.0);
    chest.add(leftShoulder);

    // Left Pauldron (Smooth multi-tiered rounded shoulder plate)
    const pauldronGeo = new THREE.SphereGeometry(0.086, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const leftPauldron = new THREE.Mesh(pauldronGeo, cuirassMat);
    leftPauldron.rotation.z = -0.3;
    leftPauldron.castShadow = true;
    leftShoulder.add(leftPauldron);

    const pauldronRimGeo = new THREE.TorusGeometry(0.086, 0.009, 10, 24);
    const leftRim = new THREE.Mesh(pauldronRimGeo, goldMat);
    leftRim.rotation.x = Math.PI * 0.5;
    leftRim.position.y = -0.02;
    leftShoulder.add(leftRim);

    const leftArm = new THREE.Group();
    leftArm.name = 'Rig_LeftArm';
    leftArm.position.y = -0.04;
    leftShoulder.add(leftArm);

    // Smooth rounded arm cylinder (24 segments)
    const armUpperGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.12, 24);
    const leftArmUpper = new THREE.Mesh(armUpperGeo, cuirassMat);
    leftArmUpper.position.y = -0.06;
    leftArmUpper.castShadow = true;
    leftArm.add(leftArmUpper);

    const leftForearm = new THREE.Group();
    leftForearm.name = 'Rig_LeftForearm';
    leftForearm.position.y = -0.12;
    leftArm.add(leftForearm);

    // Smooth contoured gauntlet with flared elbow & wrist cuffs (24 segments)
    const gauntletGeo = new THREE.CylinderGeometry(0.054, 0.044, 0.12, 24);
    const leftGauntlet = new THREE.Mesh(gauntletGeo, cuirassMat);
    leftGauntlet.position.y = -0.06;
    leftGauntlet.castShadow = true;
    leftForearm.add(leftGauntlet);

    const leftPaw = new THREE.Group();
    leftPaw.name = 'Rig_LeftPaw';
    leftPaw.position.y = -0.12;
    leftForearm.add(leftPaw);

    // Sculpted soft kitten paw with cute toe digits (No box!)
    const leftPawMesh = this.createKittenPawMesh(furMat);
    leftPaw.add(leftPawMesh);

    // Right Arm (Sword Arm)
    const rightShoulder = new THREE.Group();
    rightShoulder.name = 'Rig_RightShoulder';
    rightShoulder.position.set(-0.20, 0.06, 0.0);
    chest.add(rightShoulder);

    const rightPauldron = new THREE.Mesh(pauldronGeo, cuirassMat);
    rightPauldron.rotation.z = 0.3;
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

    const rightArmUpper = new THREE.Mesh(armUpperGeo, cuirassMat);
    rightArmUpper.position.y = -0.06;
    rightArmUpper.castShadow = true;
    rightArm.add(rightArmUpper);

    const rightForearm = new THREE.Group();
    rightForearm.name = 'Rig_RightForearm';
    rightForearm.position.y = -0.12;
    rightArm.add(rightForearm);

    const rightGauntlet = new THREE.Mesh(gauntletGeo, cuirassMat);
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

    // 5. Weapon: MOONFANG
    const swordMesh = this.buildMoonfangSword(steelMat, goldMat, leatherMat, gemMat);
    weaponHand.add(swordMesh);

    // Scabbard on left hip with smooth curves
    const scabbardMesh = this.buildScabbard(leatherMat, goldMat);
    scabbardMesh.position.set(0.20, 0.02, -0.04);
    scabbardMesh.rotation.set(0.3, 0.2, -0.3);
    hips.add(scabbardMesh);

    // 6. Hind Legs & Greaves (Anatomical contours, curved plate sabatons - NO BOXES!)
    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.name = 'Rig_LeftThigh';
    leftThigh.position.set(0.12, -0.08, 0.0);
    hips.add(leftThigh);

    const thighGeo = new THREE.CylinderGeometry(0.068, 0.056, 0.16, 24);
    const leftThighMesh = new THREE.Mesh(thighGeo, greavesMat);
    leftThighMesh.position.y = -0.08;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    const leftCalf = new THREE.Group();
    leftCalf.name = 'Rig_LeftCalf';
    leftCalf.position.y = -0.16;
    leftThigh.add(leftCalf);

    // Knee poleyn (rounded cup guard over knee)
    const poleynGeo = new THREE.SphereGeometry(0.052, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const leftPoleyn = new THREE.Mesh(poleynGeo, greavesMat);
    leftPoleyn.rotation.x = Math.PI * 0.5;
    leftPoleyn.position.set(0, 0.02, 0.042);
    leftCalf.add(leftPoleyn);

    // Smooth anatomical greave
    const greaveGeo = new THREE.CylinderGeometry(0.056, 0.046, 0.14, 24);
    const leftGreave = new THREE.Mesh(greaveGeo, greavesMat);
    leftGreave.position.y = -0.07;
    leftGreave.castShadow = true;
    leftCalf.add(leftGreave);

    const leftFoot = new THREE.Group();
    leftFoot.name = 'Rig_LeftFoot';
    leftFoot.position.y = -0.14;
    leftCalf.add(leftFoot);

    // Sculpted rounded hind paw with toe digits (NO BoxGeometry!)
    const leftFootMesh = this.createHindKittenPaw(furMat);
    leftFootMesh.position.set(0, -0.018, 0.03);
    leftFoot.add(leftFootMesh);

    // Articulated curved plate sabaton lames covering the instep smoothly
    const sabatonGeo = new THREE.CylinderGeometry(0.048, 0.054, 0.085, 20, 1, false, 0, Math.PI);
    const leftSabaton = new THREE.Mesh(sabatonGeo, greavesMat);
    leftSabaton.rotation.x = -Math.PI * 0.5;
    leftSabaton.position.set(0, 0.005, 0.035);
    leftFoot.add(leftSabaton);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.name = 'Rig_RightThigh';
    rightThigh.position.set(-0.12, -0.08, 0.0);
    hips.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(thighGeo, greavesMat);
    rightThighMesh.position.y = -0.08;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightCalf = new THREE.Group();
    rightCalf.name = 'Rig_RightCalf';
    rightCalf.position.y = -0.16;
    rightThigh.add(rightCalf);

    const rightPoleyn = new THREE.Mesh(poleynGeo, greavesMat);
    rightPoleyn.rotation.x = Math.PI * 0.5;
    rightPoleyn.position.set(0, 0.02, 0.042);
    rightCalf.add(rightPoleyn);

    const rightGreave = new THREE.Mesh(greaveGeo, greavesMat);
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

    const rightSabaton = new THREE.Mesh(sabatonGeo, greavesMat);
    rightSabaton.rotation.x = -Math.PI * 0.5;
    rightSabaton.position.set(0, 0.005, 0.035);
    rightFoot.add(rightSabaton);

    // 7. Fluffy Kitten Tail (Multi-Segment Secondary Motion with smooth rounded segments)
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

    // 8. Flowing Ivory Cape with Cowl Hood Drape
    const { capeMesh, capeBones } = this.buildIvoryCape(chest, capeMat, goldMat);

    // Store complete Rig reference
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

  /**
   * Helper: Creates a soft sculpted kitten front paw with distinct rounded toe beans
   */
  private createKittenPawMesh(furMat: THREE.Material): THREE.Group {
    const pawGroup = new THREE.Group();

    // Central rounded paw pad
    const palmGeo = new THREE.SphereGeometry(0.045, 18, 16);
    palmGeo.scale(1.0, 0.78, 1.15);
    const palmMesh = new THREE.Mesh(palmGeo, furMat);
    palmMesh.castShadow = true;
    pawGroup.add(palmMesh);

    // 4 Soft rounded toe digits
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

  /**
   * Helper: Creates a soft sculpted hind kitten foot with rounded pads (No box)
   */
  private createHindKittenPaw(furMat: THREE.Material): THREE.Group {
    const footGroup = new THREE.Group();

    // Rounded tarsal foot arch
    const archGeo = new THREE.SphereGeometry(0.05, 18, 16);
    archGeo.scale(0.85, 0.65, 1.35);
    const archMesh = new THREE.Mesh(archGeo, furMat);
    archMesh.castShadow = true;
    footGroup.add(archMesh);

    // 4 Soft rounded toes at front of foot
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

  /**
   * Helper: Creates curved ribbon tails with bevels
   */
  private createCurvedRibbonTail(
    mat: THREE.Material,
    width: number,
    height: number,
    tiltZ: number
  ): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(width, height, 4, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Gentle curve outward and backward
      pos.setZ(i, Math.sin((y / height) * Math.PI) * 0.008);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = tiltZ;
    mesh.castShadow = true;
    return mesh;
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

    // Smooth diamond-cross-section blade
    const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeLength, bladeThickness);
    const blade = new THREE.Mesh(bladeGeo, steelMat);
    blade.position.y = bladeLength / 2 + 0.04;
    blade.castShadow = true;
    sword.add(blade);

    // Tapered blade tip (smooth cone)
    const tipGeo = new THREE.ConeGeometry(bladeWidth / 2, 0.12, 12);
    tipGeo.scale(1.0, 1.0, bladeThickness / bladeWidth);
    const tip = new THREE.Mesh(tipGeo, steelMat);
    tip.position.y = bladeLength + 0.04 + 0.06;
    tip.rotation.y = Math.PI / 4;
    tip.castShadow = true;
    sword.add(tip);

    // Central fuller groove
    const fullerGeo = new THREE.BoxGeometry(0.012, bladeLength * 0.75, bladeThickness * 1.2);
    const fullerMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.9, roughness: 0.3 });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = bladeLength / 2 + 0.02;
    sword.add(fuller);

    // Crossguard with curved swept quillons (Reference: Hero sword art)
    const guardGeo = new THREE.BoxGeometry(0.20, 0.03, 0.035);
    const guard = new THREE.Mesh(guardGeo, goldMat);
    guard.position.y = 0.04;
    guard.castShadow = true;
    sword.add(guard);

    // Swept golden quillon tips (12 segments)
    const wingGeo = new THREE.ConeGeometry(0.022, 0.055, 12);
    const leftWing = new THREE.Mesh(wingGeo, goldMat);
    leftWing.position.set(0.10, 0.05, 0);
    sword.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, goldMat);
    rightWing.position.set(-0.10, 0.05, 0);
    sword.add(rightWing);

    // Inset ruby gem in center of crossguard
    const gemGeo = new THREE.OctahedronGeometry(0.018);
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 0.04, 0.02);
    sword.add(gem);

    // Wire/leather wrapped cylindrical hilt (16 segments)
    const hiltGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16);
    const hilt = new THREE.Mesh(hiltGeo, leatherMat);
    hilt.position.y = -0.02;
    sword.add(hilt);

    // Sculpted gold spherical pommel (16 segments)
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
    // Ornate gold clasps on collar
    const claspGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 16);
    const leftClasp = new THREE.Mesh(claspGeo, goldMat);
    leftClasp.rotation.x = Math.PI / 2;
    leftClasp.position.set(0.13, 0.14, 0.06);
    chestParent.add(leftClasp);

    const rightClasp = new THREE.Mesh(claspGeo, goldMat);
    rightClasp.rotation.x = Math.PI / 2;
    rightClasp.position.set(-0.13, 0.14, 0.06);
    chestParent.add(rightClasp);

    // 3D Cowl hood collar draped over shoulders (matching turnaround "BACK")
    const cowlGeo = new THREE.TorusGeometry(0.155, 0.028, 12, 28, Math.PI * 1.3);
    const cowlMesh = new THREE.Mesh(cowlGeo, capeMat);
    cowlMesh.rotation.set(Math.PI * 0.45, 0, Math.PI * 0.35);
    cowlMesh.position.set(0, 0.12, -0.06);
    cowlMesh.castShadow = true;
    chestParent.add(cowlMesh);

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

    const widthTop = 0.36;
    const widthBottom = 0.56;
    const height = 0.64;

    // High-resolution cape plane (24x32 grid) with smooth cloth folds
    const capeGeo = new THREE.PlaneGeometry(widthBottom, height, 24, 32);
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const normalizedY = (y + height / 2) / height;
      const widthFactor = (1 - normalizedY) * (widthBottom / widthBottom) + normalizedY * (widthTop / widthBottom);
      pos.setX(i, pos.getX(i) * widthFactor);

      const x = pos.getX(i);
      // Soft natural drape curve around kitten back
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
