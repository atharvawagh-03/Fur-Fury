/**
 * Rhazakar 3D Dragon Model & Skeletal Rig
 * Fully articulated 3D colossal scarlet dragon model conforming to PRD Section 10 & 11:
 * - Colossal wingspan (~30 meters), muscular chest, armored keel scutes
 * - Articulated serpentine neck, expressive head, hinged jaw, glowing amber eyes
 * - Sweeping obsidian horn ridges with dedicated mount perch for Lady Anuki
 * - Multi-jointed wings with leathery membranes and finger phalanges
 * - Heavy taloned forelegs and hindlegs for earth-shattering landings
 * - Segmented spine and dynamic undulating tail with dorsal fins
 */

import * as THREE from 'three';
import { RhazakarMaterials } from './RhazakarMaterials';

export interface WingAnchorData {
  flankAnchor: THREE.Group;
  shoulder: THREE.Group;
  elbow: THREE.Group;
  wrist: THREE.Group;
  fingerTips: THREE.Group[];
  membraneGeo: THREE.BufferGeometry;
}

export interface RhazakarRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck1: THREE.Group;
  neck2: THREE.Group;
  neck3: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Group;
  perchSocket: THREE.Group; // Attachment point for Lady Anuki between the horns
  snoutSocket: THREE.Group; // Breath vapor & roar particle socket
  throatLight: THREE.PointLight;

  // Flank attachment anchors
  flankAnchorL: THREE.Group;
  flankAnchorR: THREE.Group;

  // Wings
  wingShoulderL: THREE.Group;
  wingElbowL: THREE.Group;
  wingWristL: THREE.Group;
  wingFingersL: THREE.Group[];
  wingMembraneL: THREE.Mesh;

  wingShoulderR: THREE.Group;
  wingElbowR: THREE.Group;
  wingWristR: THREE.Group;
  wingFingersR: THREE.Group[];
  wingMembraneR: THREE.Mesh;

  // Front Legs
  frontThighL: THREE.Group;
  frontShinL: THREE.Group;
  frontFootL: THREE.Group;

  frontThighR: THREE.Group;
  frontShinR: THREE.Group;
  frontFootR: THREE.Group;

  // Hind Legs
  hindThighL: THREE.Group;
  hindShinL: THREE.Group;
  hindFootL: THREE.Group;

  hindThighR: THREE.Group;
  hindShinR: THREE.Group;
  hindFootR: THREE.Group;

  // Tail
  tailSegments: THREE.Group[];
}

export class RhazakarModel {
  private group: THREE.Group;
  private rig!: RhazakarRig;
  private leftWingAnchors!: WingAnchorData;
  private rightWingAnchors!: WingAnchorData;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Rhazakar_Dragon';
    this.buildModel();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public getRig(): RhazakarRig {
    return this.rig;
  }

  public getPerchWorldPosition(out: THREE.Vector3): void {
    if (this.rig && this.rig.perchSocket) {
      this.rig.perchSocket.getWorldPosition(out);
    }
  }

  public getPerchWorldQuaternion(out: THREE.Quaternion): void {
    if (this.rig && this.rig.perchSocket) {
      this.rig.perchSocket.getWorldQuaternion(out);
    }
  }

  public getSnoutWorldPosition(out: THREE.Vector3): void {
    if (this.rig && this.rig.snoutSocket) {
      this.rig.snoutSocket.getWorldPosition(out);
    }
  }

  private buildModel(): void {
    const scalesMat = RhazakarMaterials.createScarletScalesMaterial();
    const bellyMat = RhazakarMaterials.createBellyScutesMaterial();
    const hornMat = RhazakarMaterials.createHornMaterial();
    const wingMat = RhazakarMaterials.createWingMembraneMaterial();
    const wingBoneMat = RhazakarMaterials.createWingBoneMaterial();
    const eyeMat = RhazakarMaterials.createAmberEyeMaterial();
    const heartfireMat = RhazakarMaterials.createHeartfireMaterial();
    const fangMat = RhazakarMaterials.createFangMaterial();
    const saddleMat = RhazakarMaterials.createSaddleMaterial();

    // 1. Root & Master Node
    const root = new THREE.Group();
    root.name = 'Dragon_Rig_Root';
    this.group.add(root);

    // 2. Pelvis (Base height ~5m off ground when standing)
    const pelvis = new THREE.Group();
    pelvis.name = 'Dragon_Pelvis';
    pelvis.position.set(0, 4.8, 0);
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.5, 3.2, 12),
      scalesMat
    );
    pelvisMesh.rotation.x = Math.PI * 0.5;
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    pelvis.add(pelvisMesh);

    // 3. Spine (Abdomen)
    const spine = new THREE.Group();
    spine.name = 'Dragon_Spine';
    spine.position.set(0, 0.4, -2.4);
    pelvis.add(spine);

    const spineMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 1.8, 3.5, 12),
      scalesMat
    );
    spineMesh.rotation.x = Math.PI * 0.5;
    spineMesh.castShadow = true;
    spine.add(spineMesh);

    // Underbelly Scute Plates on spine
    const spineScute = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 3.2),
      bellyMat
    );
    spineScute.position.set(0, -1.2, 0);
    spineScute.castShadow = true;
    spine.add(spineScute);

    // 4. Chest & Keel (Massive forward ribcage & shoulder anchor)
    const chest = new THREE.Group();
    chest.name = 'Dragon_Chest';
    chest.position.set(0, 0.6, -2.8);
    spine.add(chest);

    const chestMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 16, 12),
      scalesMat
    );
    chestMesh.scale.set(1.15, 1.3, 1.4);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chest.add(chestMesh);

    // Broad Keel plate
    const keelMesh = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 3.6, 8),
      bellyMat
    );
    keelMesh.rotation.x = -Math.PI * 0.45;
    keelMesh.position.set(0, -1.6, -0.4);
    keelMesh.scale.set(1.4, 1.0, 0.6);
    keelMesh.castShadow = true;
    chest.add(keelMesh);

    // Dorsal Spines on chest
    for (let i = 0; i < 4; i++) {
      const spineSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 1.2, 6),
        hornMat
      );
      spineSpike.position.set(0, 2.2, -1.2 + i * 0.9);
      spineSpike.rotation.x = -0.35;
      spineSpike.castShadow = true;
      chest.add(spineSpike);
    }

    // 5. Neck Segments (Serpentine arc forward and up)
    const neck1 = new THREE.Group();
    neck1.name = 'Dragon_Neck1';
    neck1.position.set(0, 1.2, -2.6);
    neck1.rotation.x = -0.25;
    chest.add(neck1);

    const neck1Mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.0, 2.5, 12),
      scalesMat
    );
    neck1Mesh.position.set(0, 1.0, -0.3);
    neck1Mesh.rotation.x = 0.2;
    neck1Mesh.castShadow = true;
    neck1.add(neck1Mesh);

    const neck2 = new THREE.Group();
    neck2.name = 'Dragon_Neck2';
    neck2.position.set(0, 2.0, -0.6);
    neck2.rotation.x = -0.15;
    neck1.add(neck2);

    const neck2Mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.6, 2.4, 12),
      scalesMat
    );
    neck2Mesh.position.set(0, 0.9, -0.2);
    neck2Mesh.rotation.x = 0.15;
    neck2Mesh.castShadow = true;
    neck2.add(neck2Mesh);

    const neck3 = new THREE.Group();
    neck3.name = 'Dragon_Neck3';
    neck3.position.set(0, 1.8, -0.4);
    neck3.rotation.x = 0.1;
    neck2.add(neck3);

    const neck3Mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.3, 2.2, 12),
      scalesMat
    );
    neck3Mesh.position.set(0, 0.8, -0.2);
    neck3Mesh.castShadow = true;
    neck3.add(neck3Mesh);

    // 6. Head & Skull
    const head = new THREE.Group();
    head.name = 'Dragon_Head';
    head.position.set(0, 1.6, -0.5);
    neck3.add(head);

    // Cranium
    const cranium = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.5, 2.4),
      scalesMat
    );
    cranium.position.set(0, 0.2, -0.4);
    cranium.castShadow = true;
    head.add(cranium);

    // Snout / Upper Muzzle
    const snout = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2.8, 8),
      scalesMat
    );
    snout.rotation.x = Math.PI * 0.5;
    snout.position.set(0, 0.1, -2.4);
    snout.scale.set(1.2, 1.0, 0.85);
    snout.castShadow = true;
    head.add(snout);

    // Nostril ridges with heat glow
    const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hornMat);
    nostrilL.position.set(-0.45, 0.45, -3.2);
    head.add(nostrilL);

    const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hornMat);
    nostrilR.position.set(0.45, 0.45, -3.2);
    head.add(nostrilR);

    // Brow ridges & Amber Eyes
    const eyeBrowL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 1.2), hornMat);
    eyeBrowL.position.set(-1.0, 0.65, -0.9);
    eyeBrowL.rotation.z = 0.35;
    head.add(eyeBrowL);

    const eyeBrowR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 1.2), hornMat);
    eyeBrowR.position.set(1.0, 0.65, -0.9);
    eyeBrowR.rotation.z = -0.35;
    head.add(eyeBrowR);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), eyeMat);
    eyeL.position.set(-0.95, 0.4, -0.85);
    head.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), eyeMat);
    eyeR.position.set(0.95, 0.4, -0.85);
    head.add(eyeR);

    // Upper fangs
    for (let f = -1; f <= 1; f += 0.5) {
      if (Math.abs(f) < 0.2) continue;
      const upperFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), fangMat);
      upperFang.position.set(f * 0.8, -0.3, -2.2 - Math.abs(f) * 0.4);
      upperFang.rotation.x = Math.PI;
      head.add(upperFang);
    }

    // Hinged Lower Jaw
    const jaw = new THREE.Group();
    jaw.name = 'Dragon_Jaw';
    jaw.position.set(0, -0.4, -0.6);
    head.add(jaw);

    const jawMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2.6),
      scalesMat
    );
    jawMesh.position.set(0, -0.2, -1.3);
    jawMesh.castShadow = true;
    jaw.add(jawMesh);

    // Lower fangs
    for (let f = -1; f <= 1; f += 0.5) {
      if (Math.abs(f) < 0.2) continue;
      const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), fangMat);
      lowerFang.position.set(f * 0.7, 0.25, -1.8 - Math.abs(f) * 0.4);
      jaw.add(lowerFang);
    }

    // Throat Heartfire Glow
    const throatCore = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), heartfireMat);
    throatCore.position.set(0, -0.1, -1.1);
    head.add(throatCore);

    const throatLight = new THREE.PointLight(0xff5500, 2.5, 12, 1.8);
    throatLight.position.set(0, 0, -1.2);
    head.add(throatLight);

    // Sweeping Obsidian Horn Crowns
    const hornL = this.createHornBranch(hornMat, true);
    hornL.position.set(-0.85, 0.9, 0.4);
    hornL.rotation.set(-0.35, -0.25, 0.2);
    head.add(hornL);

    const hornR = this.createHornBranch(hornMat, false);
    hornR.position.set(0.85, 0.9, 0.4);
    hornR.rotation.set(-0.35, 0.25, -0.2);
    head.add(hornR);

    // Dedicated Perch Platform between the Horns for Lady Anuki
    const perchSocket = new THREE.Group();
    perchSocket.name = 'Perch_Socket_Anuki';
    perchSocket.position.set(0, 0.95, 0.2);
    head.add(perchSocket);

    // Leather mount saddle cushion & grip rim
    const saddlePad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.75, 0.18, 12),
      saddleMat
    );
    saddlePad.castShadow = true;
    perchSocket.add(saddlePad);

    const saddleRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.08, 8, 16),
      hornMat
    );
    saddleRim.rotation.x = Math.PI * 0.5;
    perchSocket.add(saddleRim);

    // Breath vapor socket at the tip of the snout
    const snoutSocket = new THREE.Group();
    snoutSocket.name = 'Snout_Socket_Breath';
    snoutSocket.position.set(0, -0.2, -3.2);
    head.add(snoutSocket);

    // Flank attachment anchors for wing membranes
    const flankAnchorL = new THREE.Group();
    flankAnchorL.name = 'Flank_Anchor_L';
    flankAnchorL.position.set(-2.2, -0.4, 1.8);
    chest.add(flankAnchorL);

    const flankAnchorR = new THREE.Group();
    flankAnchorR.name = 'Flank_Anchor_R';
    flankAnchorR.position.set(2.2, -0.4, 1.8);
    chest.add(flankAnchorR);

    // 7. Colossal Articulated Wings (Left & Right)
    const leftWing = this.createArticulatedWing(wingBoneMat, wingMat, true, flankAnchorL);
    leftWing.shoulder.position.set(-2.4, 1.2, 0.2);
    chest.add(leftWing.shoulder);
    this.group.add(leftWing.membrane);
    this.leftWingAnchors = leftWing.anchors;

    const rightWing = this.createArticulatedWing(wingBoneMat, wingMat, false, flankAnchorR);
    rightWing.shoulder.position.set(2.4, 1.2, 0.2);
    chest.add(rightWing.shoulder);
    this.group.add(rightWing.membrane);
    this.rightWingAnchors = rightWing.anchors;

    // 8. Forelegs (Shoulder -> Thigh -> Shin -> Taloned Foot)
    const { thigh: frontThighL, shin: frontShinL, foot: frontFootL } =
      this.createLeg(scalesMat, hornMat, false, true);
    frontThighL.position.set(-2.2, -0.6, -1.8);
    chest.add(frontThighL);

    const { thigh: frontThighR, shin: frontShinR, foot: frontFootR } =
      this.createLeg(scalesMat, hornMat, false, false);
    frontThighR.position.set(2.2, -0.6, -1.8);
    chest.add(frontThighR);

    // 9. Hind Legs
    const { thigh: hindThighL, shin: hindShinL, foot: hindFootL } =
      this.createLeg(scalesMat, hornMat, true, true);
    hindThighL.position.set(-2.0, -0.4, 0.4);
    pelvis.add(hindThighL);

    const { thigh: hindThighR, shin: hindShinR, foot: hindFootR } =
      this.createLeg(scalesMat, hornMat, true, false);
    hindThighR.position.set(2.0, -0.4, 0.4);
    pelvis.add(hindThighR);

    // 10. Multi-segment Serpentine Tail
    const tailSegments: THREE.Group[] = [];
    let parentTail: THREE.Group = pelvis;
    const tailCount = 6;
    for (let t = 0; t < tailCount; t++) {
      const tailSeg = new THREE.Group();
      tailSeg.name = `Dragon_Tail_${t}`;
      tailSeg.position.set(0, -0.15, 1.9 + (t === 0 ? 0 : 0.6));
      parentTail.add(tailSeg);
      tailSegments.push(tailSeg);

      const rad = Math.max(0.4, 1.4 - t * 0.18);
      const len = 2.4 - t * 0.1;
      const segMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.8, rad, len, 10),
        scalesMat
      );
      segMesh.rotation.x = Math.PI * 0.5;
      segMesh.position.set(0, 0, len * 0.5);
      segMesh.castShadow = true;
      tailSeg.add(segMesh);

      // Dorsal ridge spine
      const tailSpine = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.9 - t * 0.1, 6),
        hornMat
      );
      tailSpine.position.set(0, rad + 0.3, len * 0.5);
      tailSpine.rotation.x = 0.4;
      tailSpine.castShadow = true;
      tailSeg.add(tailSpine);

      // Tail blade / spade tip on last segment
      if (t === tailCount - 1) {
        const spadeTip = new THREE.Mesh(
          new THREE.ConeGeometry(0.6, 2.0, 4),
          hornMat
        );
        spadeTip.rotation.x = Math.PI * 0.5;
        spadeTip.position.set(0, 0, len + 0.8);
        spadeTip.scale.set(1.6, 0.4, 1.0);
        spadeTip.castShadow = true;
        tailSeg.add(spadeTip);
      }

      parentTail = tailSeg;
    }

    // Populate Rig Struct
    this.rig = {
      root,
      pelvis,
      spine,
      chest,
      neck1,
      neck2,
      neck3,
      head,
      jaw,
      perchSocket,
      snoutSocket,
      throatLight,

      flankAnchorL,
      flankAnchorR,

      wingShoulderL: leftWing.shoulder,
      wingElbowL: leftWing.elbow,
      wingWristL: leftWing.wrist,
      wingFingersL: leftWing.fingers,
      wingMembraneL: leftWing.membrane,

      wingShoulderR: rightWing.shoulder,
      wingElbowR: rightWing.elbow,
      wingWristR: rightWing.wrist,
      wingFingersR: rightWing.fingers,
      wingMembraneR: rightWing.membrane,

      frontThighL,
      frontShinL,
      frontFootL,

      frontThighR,
      frontShinR,
      frontFootR,

      hindThighL,
      hindShinL,
      hindFootL,

      hindThighR,
      hindShinR,
      hindFootR,

      tailSegments,
    };

    // Initialize wing membrane vertex buffer
    this.updateWingMembranes();
  }

  /**
   * Dynamically updates the wing membrane vertices to conform precisely to the bones and fingers
   */
  public updateWingMembranes(): void {
    if (this.leftWingAnchors) {
      this.updateSingleWingMembrane(this.leftWingAnchors, true);
    }
    if (this.rightWingAnchors) {
      this.updateSingleWingMembrane(this.rightWingAnchors, false);
    }
  }

  private updateSingleWingMembrane(anchors: WingAnchorData, _isLeft: boolean): void {
    if (!anchors || !anchors.membraneGeo) return;

    const root = this.group;
    const posAttr = anchors.membraneGeo.attributes.position as THREE.BufferAttribute;
    const tempWorld = new THREE.Vector3();

    // 0. Flank
    anchors.flankAnchor.getWorldPosition(tempWorld);
    const vFlank = root.worldToLocal(tempWorld.clone());

    // 1. Shoulder
    anchors.shoulder.getWorldPosition(tempWorld);
    const vShoulder = root.worldToLocal(tempWorld.clone());

    // 2. Elbow
    anchors.elbow.getWorldPosition(tempWorld);
    const vElbow = root.worldToLocal(tempWorld.clone());

    // 3. Wrist
    anchors.wrist.getWorldPosition(tempWorld);
    const vWrist = root.worldToLocal(tempWorld.clone());

    // 4..7 Finger tips
    const vF: THREE.Vector3[] = [];
    for (let f = 0; f < 4; f++) {
      if (anchors.fingerTips[f]) {
        anchors.fingerTips[f].getWorldPosition(tempWorld);
        vF.push(root.worldToLocal(tempWorld.clone()));
      } else {
        vF.push(vWrist.clone());
      }
    }

    // 8. Scallop 0-1
    const vScallop01 = new THREE.Vector3().lerpVectors(vF[0], vF[1], 0.5).lerp(vWrist, 0.16);
    // 9. Scallop 1-2
    const vScallop12 = new THREE.Vector3().lerpVectors(vF[1], vF[2], 0.5).lerp(vWrist, 0.18);
    // 10. Scallop 2-3
    const vScallop23 = new THREE.Vector3().lerpVectors(vF[2], vF[3], 0.5).lerp(vWrist, 0.22);
    // 11. Scallop 3-Elbow
    const vScallop3Elbow = new THREE.Vector3().lerpVectors(vF[3], vFlank, 0.5).lerp(vElbow, 0.2);
    // 12. Mid Forearm
    const vMidForearm = new THREE.Vector3().lerpVectors(vElbow, vWrist, 0.5);
    vMidForearm.y += 0.25;

    posAttr.setXYZ(0, vFlank.x, vFlank.y, vFlank.z);
    posAttr.setXYZ(1, vShoulder.x, vShoulder.y, vShoulder.z);
    posAttr.setXYZ(2, vElbow.x, vElbow.y, vElbow.z);
    posAttr.setXYZ(3, vWrist.x, vWrist.y, vWrist.z);
    posAttr.setXYZ(4, vF[0].x, vF[0].y, vF[0].z);
    posAttr.setXYZ(5, vF[1].x, vF[1].y, vF[1].z);
    posAttr.setXYZ(6, vF[2].x, vF[2].y, vF[2].z);
    posAttr.setXYZ(7, vF[3].x, vF[3].y, vF[3].z);
    posAttr.setXYZ(8, vScallop01.x, vScallop01.y, vScallop01.z);
    posAttr.setXYZ(9, vScallop12.x, vScallop12.y, vScallop12.z);
    posAttr.setXYZ(10, vScallop23.x, vScallop23.y, vScallop23.z);
    posAttr.setXYZ(11, vScallop3Elbow.x, vScallop3Elbow.y, vScallop3Elbow.z);
    posAttr.setXYZ(12, vMidForearm.x, vMidForearm.y, vMidForearm.z);

    posAttr.needsUpdate = true;
    anchors.membraneGeo.computeVertexNormals();
  }

  /**
   * Builds an articulated dragon wing structure with bones and stretched membrane
   */
  private createArticulatedWing(
    boneMat: THREE.Material,
    membraneMat: THREE.Material,
    isLeft: boolean,
    flankAnchor: THREE.Group
  ): {
    shoulder: THREE.Group;
    elbow: THREE.Group;
    wrist: THREE.Group;
    fingers: THREE.Group[];
    membrane: THREE.Mesh;
    anchors: WingAnchorData;
  } {
    const sideSign = isLeft ? -1 : 1;

    // Shoulder Joint
    const shoulder = new THREE.Group();
    shoulder.name = isLeft ? 'Wing_Shoulder_L' : 'Wing_Shoulder_R';

    // Humerus (Upper arm bone ~6m long)
    const humerusLen = 6.2;
    const humerus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.85, humerusLen, 10),
      boneMat
    );
    humerus.position.set(sideSign * humerusLen * 0.48, 0.8, -0.3);
    humerus.rotation.z = sideSign * 0.65;
    humerus.rotation.y = sideSign * 0.2;
    humerus.castShadow = true;
    shoulder.add(humerus);

    // Elbow Joint
    const elbow = new THREE.Group();
    elbow.name = isLeft ? 'Wing_Elbow_L' : 'Wing_Elbow_R';
    elbow.position.set(sideSign * humerusLen * 0.9, 1.4, -0.6);
    shoulder.add(elbow);

    // Radius / Ulna (Forearm bone ~8m long extending outward)
    const forearmLen = 7.8;
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.65, forearmLen, 10),
      boneMat
    );
    forearm.position.set(sideSign * forearmLen * 0.48, 0.2, 0.8);
    forearm.rotation.z = sideSign * 0.15;
    forearm.rotation.x = -0.3;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Wrist Joint / Carpus
    const wrist = new THREE.Group();
    wrist.name = isLeft ? 'Wing_Wrist_L' : 'Wing_Wrist_R';
    wrist.position.set(sideSign * forearmLen * 0.92, 0.3, 1.5);
    elbow.add(wrist);

    // Wing Thumb / Clutched Spur
    const wingThumb = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 1.2, 6),
      boneMat
    );
    wingThumb.position.set(sideSign * 0.2, 0.8, 0);
    wingThumb.rotation.z = sideSign * 0.4;
    wrist.add(wingThumb);

    // 4 Articulated Wing Finger Phalanges spreading the flight membrane
    const fingers: THREE.Group[] = [];
    const fingerTips: THREE.Group[] = [];
    const fingerAngles = [0.15, 0.5, 0.85, 1.25];
    const fingerLengths = [9.5, 9.0, 8.2, 7.0];

    for (let f = 0; f < 4; f++) {
      const fingerGroup = new THREE.Group();
      fingerGroup.name = `${isLeft ? 'Wing_Finger_L' : 'Wing_Finger_R'}_${f}`;
      const fLen = fingerLengths[f];
      fingerGroup.rotation.y = sideSign * fingerAngles[f];

      const phalanx = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.3, fLen, 8),
        boneMat
      );
      phalanx.position.set(0, -fLen * 0.48, fLen * 0.45);
      phalanx.rotation.x = Math.PI * 0.42;
      phalanx.castShadow = true;
      fingerGroup.add(phalanx);

      // Dedicated Tip Anchor for tracking membrane edge
      const tipAnchor = new THREE.Group();
      tipAnchor.name = `Finger_Tip_${f}`;
      tipAnchor.position.set(0, -fLen * 0.92, fLen * 0.88);
      fingerGroup.add(tipAnchor);
      fingerTips.push(tipAnchor);

      wrist.add(fingerGroup);
      fingers.push(fingerGroup);
    }

    // Dynamic Leathery Flight Membrane BufferGeometry (13 vertices, 11 triangles)
    const membraneGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(13 * 3);
    const uvs = new Float32Array([
      0.05, 0.2,   // 0: Flank
      0.2, 0.85,   // 1: Shoulder
      0.45, 0.8,   // 2: Elbow
      0.7, 0.75,   // 3: Wrist
      0.98, 0.9,   // 4: F0 Tip
      0.95, 0.65,  // 5: F1 Tip
      0.88, 0.4,   // 6: F2 Tip
      0.75, 0.15,  // 7: F3 Tip
      0.92, 0.75,  // 8: Scallop01
      0.86, 0.5,   // 9: Scallop12
      0.76, 0.25,  // 10: Scallop23
      0.5, 0.15,   // 11: Scallop3Elbow
      0.58, 0.8    // 12: Mid Forearm
    ]);

    const indices = isLeft
      ? [
          0, 1, 2,
          0, 2, 11,
          2, 12, 3,
          2, 3, 11,
          3, 4, 8,
          3, 8, 5,
          3, 5, 9,
          3, 9, 6,
          3, 6, 10,
          3, 10, 7,
          3, 7, 11,
        ]
      : [
          0, 2, 1,
          0, 11, 2,
          2, 3, 12,
          2, 11, 3,
          3, 8, 4,
          3, 5, 8,
          3, 9, 5,
          3, 6, 9,
          3, 10, 6,
          3, 7, 10,
          3, 11, 7,
        ];

    membraneGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    membraneGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    membraneGeo.setIndex(indices);

    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    membrane.name = isLeft ? 'Wing_Membrane_L' : 'Wing_Membrane_R';
    membrane.castShadow = true;
    membrane.receiveShadow = true;

    const anchors: WingAnchorData = {
      flankAnchor,
      shoulder,
      elbow,
      wrist,
      fingerTips,
      membraneGeo,
    };

    return { shoulder, elbow, wrist, fingers, membrane, anchors };
  }

  /**
   * Builds an articulated leg (thigh, shin, and multi-taloned foot)
   */
  private createLeg(
    scalesMat: THREE.Material,
    hornMat: THREE.Material,
    isHind: boolean,
    isLeft: boolean
  ): { thigh: THREE.Group; shin: THREE.Group; foot: THREE.Group } {
    const sideSign = isLeft ? -1 : 1;
    const thigh = new THREE.Group();
    thigh.name = `${isHind ? 'Hind' : 'Front'}_Thigh_${isLeft ? 'L' : 'R'}`;

    const thighLen = isHind ? 3.8 : 3.4;
    const thighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.25, thighLen, 10),
      scalesMat
    );
    thighMesh.position.set(sideSign * 0.4, -thighLen * 0.45, isHind ? 0.4 : -0.2);
    thighMesh.rotation.z = sideSign * 0.2;
    thighMesh.castShadow = true;
    thigh.add(thighMesh);

    // Shin / Crus
    const shin = new THREE.Group();
    shin.name = `${isHind ? 'Hind' : 'Front'}_Shin_${isLeft ? 'L' : 'R'}`;
    shin.position.set(sideSign * 0.6, -thighLen * 0.9, isHind ? 0.6 : -0.3);
    thigh.add(shin);

    const shinLen = isHind ? 3.5 : 3.0;
    const shinMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.85, shinLen, 10),
      scalesMat
    );
    shinMesh.position.set(0, -shinLen * 0.45, isHind ? -0.4 : 0.3);
    shinMesh.castShadow = true;
    shin.add(shinMesh);

    // Heavy Taloned Foot
    const foot = new THREE.Group();
    foot.name = `${isHind ? 'Hind' : 'Front'}_Foot_${isLeft ? 'L' : 'R'}`;
    foot.position.set(0, -shinLen * 0.95, 0);
    shin.add(foot);

    const footMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.7, 2.2),
      scalesMat
    );
    footMesh.position.set(0, -0.3, 0.3);
    footMesh.castShadow = true;
    foot.add(footMesh);

    // 4 Curved Talons
    for (let c = -1; c <= 1; c += 0.66) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 6), hornMat);
      claw.position.set(c * 0.6, -0.45, 1.4);
      claw.rotation.x = Math.PI * 0.55;
      claw.castShadow = true;
      foot.add(claw);
    }
    // Back spur claw
    const backClaw = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.8, 6), hornMat);
    backClaw.position.set(0, -0.45, -0.7);
    backClaw.rotation.x = -Math.PI * 0.45;
    backClaw.castShadow = true;
    foot.add(backClaw);

    return { thigh, shin, foot };
  }

  /**
   * Sweeping backward-curving horn branch
   */
  private createHornBranch(hornMat: THREE.Material, isLeft: boolean): THREE.Group {
    const hornGroup = new THREE.Group();
    const sideSign = isLeft ? -1 : 1;

    // Segmented curved horn
    const segments = 5;
    let parentNode = hornGroup;
    for (let s = 0; s < segments; s++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(sideSign * 0.25, 0.45, 0.4);
      segGroup.rotation.x = 0.35;
      segGroup.rotation.z = sideSign * 0.2;
      parentNode.add(segGroup);

      const rad = Math.max(0.08, 0.45 - s * 0.08);
      const len = 0.75;
      const hornSeg = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.8, rad, len, 8),
        hornMat
      );
      hornSeg.position.set(0, len * 0.5, 0);
      hornSeg.castShadow = true;
      segGroup.add(hornSeg);

      parentNode = segGroup;
    }

    return hornGroup;
  }
}
