/**
 * Rhazakar 3D Dragon Model & Skeletal Rig - Refined High-Fidelity Edition
 * Hand-sculpted, fully articulated 3D colossal scarlet dragon model conforming to:
 * - Authoritative Reference Artwork ("THE RED DRAGON: LOYAL • POWERFUL • FEARLESS")
 * - Smooth, organic draconic anatomy: no sharp/boxy primitives, beautifully rounded edges
 * - Sculpted reptilian skull with organic snout, flared nostrils, and articulated jaw
 * - Sweeping backward-curving obsidian horn crown with cheek and brow horn crests
 * - Elegant S-curved muscular serpentine neck with smooth wrapping cream-sand underbelly scutes
 * - Robust muscular chest with curved armored keel plates and continuous dorsal spine ridge
 * - Muscular articulated legs with defined joints and sculpted paws with 4 curved talons + rear spur
 * - Multi-jointed colossal wings with leathery membranes and finger phalanges
 * - Dedicated mount perch for Lady Anuki positioned securely behind the crest
 * - Multi-segment serpentine tail tapering smoothly to the finned tip
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

    // Smooth rounded pelvis mesh (24 radial segments, rounded contour)
    const pelvisGeo = new THREE.CylinderGeometry(1.8, 1.5, 3.2, 24, 2);
    pelvisGeo.scale(1.0, 1.0, 0.95);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, scalesMat);
    pelvisMesh.rotation.x = Math.PI * 0.5;
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    pelvis.add(pelvisMesh);

    // Smooth curved hip scutes
    const pelvisScute = this.createCurvedUnderbellyShield(2.2, 2.0, 2.8, 0.35, bellyMat);
    pelvisScute.position.set(0, -1.05, 0);
    pelvisScute.rotation.x = Math.PI * 0.5;
    pelvis.add(pelvisScute);

    // 3. Spine (Abdomen)
    const spine = new THREE.Group();
    spine.name = 'Dragon_Spine';
    spine.position.set(0, 0.4, -2.4);
    pelvis.add(spine);

    // Smooth rounded abdomen cylinder (24 segments)
    const spineGeo = new THREE.CylinderGeometry(2.15, 1.85, 3.5, 24, 2);
    spineGeo.scale(1.05, 1.0, 1.15);
    const spineMesh = new THREE.Mesh(spineGeo, scalesMat);
    spineMesh.rotation.x = Math.PI * 0.5;
    spineMesh.castShadow = true;
    spineMesh.receiveShadow = true;
    spine.add(spineMesh);

    // Smooth curved underbelly scute plates on spine (no boxy edges)
    const spineScute = this.createCurvedUnderbellyShield(2.35, 2.1, 3.2, 0.4, bellyMat);
    spineScute.position.set(0, -1.2, 0);
    spineScute.rotation.x = Math.PI * 0.5;
    spine.add(spineScute);

    // Dorsal Spines on spine
    for (let i = 0; i < 3; i++) {
      const spineSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 1.1, 12),
        hornMat
      );
      spineSpike.position.set(0, 2.0, -1.0 + i * 1.0);
      spineSpike.rotation.x = -0.3;
      spineSpike.castShadow = true;
      spine.add(spineSpike);
    }

    // 4. Chest & Keel (Massive forward ribcage & shoulder anchor)
    const chest = new THREE.Group();
    chest.name = 'Dragon_Chest';
    chest.position.set(0, 0.6, -2.8);
    spine.add(chest);

    // Smooth volumetric ribcage sphere (32x24 segments)
    const chestGeo = new THREE.SphereGeometry(2.8, 32, 24);
    chestGeo.scale(1.18, 1.32, 1.42);
    const chestMesh = new THREE.Mesh(chestGeo, scalesMat);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chest.add(chestMesh);

    // Broad smoothly sculpted armored keel scute plate (matching front view in reference)
    const keelGeo = new THREE.CylinderGeometry(1.3, 2.2, 3.8, 24, 2, false, -Math.PI * 0.4, Math.PI * 0.8);
    keelGeo.scale(1.4, 1.0, 0.7);
    const keelMesh = new THREE.Mesh(keelGeo, bellyMat);
    keelMesh.rotation.x = -Math.PI * 0.46;
    keelMesh.position.set(0, -1.5, -0.3);
    keelMesh.castShadow = true;
    chest.add(keelMesh);

    // Dorsal Spines on chest (Sleek backward raked, matching scale & spike detail)
    for (let i = 0; i < 4; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.2, 1.3 - i * 0.05, 12);
      spikeGeo.scale(1.0, 1.0, 0.6);
      const spineSpike = new THREE.Mesh(spikeGeo, hornMat);
      spineSpike.position.set(0, 2.25, -1.3 + i * 0.85);
      spineSpike.rotation.x = -0.38;
      spineSpike.castShadow = true;
      chest.add(spineSpike);
    }

    // 5. Neck Segments (Serpentine arc forward and up, smoothly contoured)
    // Neck 1 (Base of neck)
    const neck1 = new THREE.Group();
    neck1.name = 'Dragon_Neck1';
    neck1.position.set(0, 1.2, -2.6);
    neck1.rotation.x = -0.25;
    chest.add(neck1);

    const neck1Mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.65, 2.05, 2.5, 24),
      scalesMat
    );
    neck1Mesh.position.set(0, 1.0, -0.3);
    neck1Mesh.rotation.x = 0.2;
    neck1Mesh.castShadow = true;
    neck1.add(neck1Mesh);

    // Smooth curved throat/underbelly scute on neck 1 (wraps smoothly around anterior throat)
    const neck1Scute = this.createCurvedThroatShield(1.72, 2.12, 2.4, bellyMat);
    neck1Scute.position.set(0, 1.0, -0.35);
    neck1Scute.rotation.x = 0.2;
    neck1.add(neck1Scute);

    // Dorsal neck spike 1
    const neck1Spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 12), hornMat);
    neck1Spike.position.set(0, 2.1, 0.4);
    neck1Spike.rotation.x = -0.4;
    neck1Spike.castShadow = true;
    neck1.add(neck1Spike);

    // Neck 2 (Mid neck arch)
    const neck2 = new THREE.Group();
    neck2.name = 'Dragon_Neck2';
    neck2.position.set(0, 2.0, -0.6);
    neck2.rotation.x = -0.15;
    neck1.add(neck2);

    const neck2Mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.65, 2.4, 24),
      scalesMat
    );
    neck2Mesh.position.set(0, 0.9, -0.2);
    neck2Mesh.rotation.x = 0.15;
    neck2Mesh.castShadow = true;
    neck2.add(neck2Mesh);

    // Smooth curved throat scute on neck 2
    const neck2Scute = this.createCurvedThroatShield(1.42, 1.72, 2.3, bellyMat);
    neck2Scute.position.set(0, 0.9, -0.25);
    neck2Scute.rotation.x = 0.15;
    neck2.add(neck2Scute);

    // Dorsal neck spike 2
    const neck2Spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.05, 12), hornMat);
    neck2Spike.position.set(0, 1.85, 0.3);
    neck2Spike.rotation.x = -0.35;
    neck2Spike.castShadow = true;
    neck2.add(neck2Spike);

    // Neck 3 (Throat leading into head)
    const neck3 = new THREE.Group();
    neck3.name = 'Dragon_Neck3';
    neck3.position.set(0, 1.8, -0.4);
    neck3.rotation.x = 0.1;
    neck2.add(neck3);

    const neck3Mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.35, 2.2, 24),
      scalesMat
    );
    neck3Mesh.position.set(0, 0.8, -0.2);
    neck3Mesh.castShadow = true;
    neck3.add(neck3Mesh);

    // Smooth curved throat scute on neck 3
    const neck3Scute = this.createCurvedThroatShield(1.12, 1.42, 2.1, bellyMat);
    neck3Scute.position.set(0, 0.8, -0.25);
    neck3.add(neck3Scute);

    // Dorsal neck spike 3
    const neck3Spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 12), hornMat);
    neck3Spike.position.set(0, 1.55, 0.2);
    neck3Spike.rotation.x = -0.3;
    neck3Spike.castShadow = true;
    neck3.add(neck3Spike);

    // 6. Sculpted Dragon Head & Skull (Conforming exactly to reference head close-up)
    const head = new THREE.Group();
    head.name = 'Dragon_Head';
    head.position.set(0, 1.6, -0.5);
    neck3.add(head);

    // Sculpted organic Cranium (smooth rounded reptilian skull, no box)
    const craniumGeo = new THREE.SphereGeometry(1.25, 32, 24);
    craniumGeo.scale(1.05, 0.85, 1.35);
    const cranium = new THREE.Mesh(craniumGeo, scalesMat);
    cranium.position.set(0, 0.25, -0.4);
    cranium.castShadow = true;
    cranium.receiveShadow = true;
    head.add(cranium);

    // Muzzle / Snout: Smoothly tapered, organic nasal bridge with smooth normals
    const snoutGeo = new THREE.CylinderGeometry(0.65, 1.15, 2.7, 24, 4);
    snoutGeo.scale(1.15, 1.0, 0.8);
    const snout = new THREE.Mesh(snoutGeo, scalesMat);
    snout.rotation.x = Math.PI * 0.5;
    snout.position.set(0, 0.12, -2.05);
    snout.castShadow = true;
    head.add(snout);

    // Sculpted nasal crest ridge running along top of snout
    const crestGeo = new THREE.CylinderGeometry(0.08, 0.18, 2.4, 16);
    crestGeo.scale(0.6, 1.0, 1.8);
    const crest = new THREE.Mesh(crestGeo, hornMat);
    crest.rotation.x = Math.PI * 0.5;
    crest.position.set(0, 0.52, -2.1);
    head.add(crest);

    // Flared Organic Nostril Ridges
    const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), hornMat);
    nostrilL.scale.set(0.8, 0.9, 1.4);
    nostrilL.position.set(-0.46, 0.38, -3.1);
    head.add(nostrilL);

    const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), hornMat);
    nostrilR.scale.set(0.8, 0.9, 1.4);
    nostrilR.position.set(0.46, 0.38, -3.1);
    head.add(nostrilR);

    // Sculpted Draconic Brow Ridges & Glowing Amber Eyes (Head Close-up Reference)
    const browGeo = new THREE.CylinderGeometry(0.22, 0.28, 1.3, 16);
    browGeo.scale(0.8, 1.0, 1.4);

    const eyeBrowL = new THREE.Mesh(browGeo, hornMat);
    eyeBrowL.position.set(-0.95, 0.58, -0.9);
    eyeBrowL.rotation.set(-0.1, -0.2, 0.4);
    head.add(eyeBrowL);

    const eyeBrowR = new THREE.Mesh(browGeo, hornMat);
    eyeBrowR.position.set(0.95, 0.58, -0.9);
    eyeBrowR.rotation.set(-0.1, 0.2, -0.4);
    head.add(eyeBrowR);

    // Glowing Amber Reptilian Eyes
    const eyeGeo = new THREE.SphereGeometry(0.35, 20, 20);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.95, 0.4, -0.85);
    eyeL.rotation.y = -0.25;
    head.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.95, 0.4, -0.85);
    eyeR.rotation.y = 0.25;
    head.add(eyeR);

    // Lateral Cheek / Jaw Horn Spikes (Reference: Head Close-up has 3 distinct flared spines)
    for (const side of [-1, 1]) {
      // Primary cheek flare spike
      const cheekHorn1 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.85, 12), hornMat);
      cheekHorn1.position.set(side * 1.15, 0.05, -0.5);
      cheekHorn1.rotation.set(-0.25, 0, side * -0.95);
      cheekHorn1.castShadow = true;
      head.add(cheekHorn1);

      // Mid cheek spike
      const cheekHorn2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 12), hornMat);
      cheekHorn2.position.set(side * 1.08, -0.05, -1.2);
      cheekHorn2.rotation.set(-0.2, 0, side * -0.9);
      cheekHorn2.castShadow = true;
      head.add(cheekHorn2);

      // Anterior cheek spike
      const cheekHorn3 = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.55, 12), hornMat);
      cheekHorn3.position.set(side * 0.98, -0.15, -1.8);
      cheekHorn3.rotation.set(-0.15, 0, side * -0.8);
      cheekHorn3.castShadow = true;
      head.add(cheekHorn3);
    }

    // Upper fangs (Sleek ivory fangs along upper jaw)
    for (let f = -1; f <= 1; f += 0.4) {
      if (Math.abs(f) < 0.15) continue;
      const upperFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55, 12), fangMat);
      upperFang.position.set(f * 0.72, -0.25, -2.0 - Math.abs(f) * 0.45);
      upperFang.rotation.set(Math.PI * 0.95, 0, -f * 0.15);
      head.add(upperFang);
    }

    // Hinged Lower Jaw - Sculpted organic curvature (no box)
    const jaw = new THREE.Group();
    jaw.name = 'Dragon_Jaw';
    jaw.position.set(0, -0.35, -0.6);
    head.add(jaw);

    // Smooth rounded jaw body
    const jawGeo = new THREE.CylinderGeometry(0.65, 0.95, 2.5, 24, 3);
    jawGeo.scale(1.05, 0.65, 0.85);
    const jawMesh = new THREE.Mesh(jawGeo, scalesMat);
    jawMesh.rotation.x = Math.PI * 0.5;
    jawMesh.position.set(0, -0.15, -1.25);
    jawMesh.castShadow = true;
    jaw.add(jawMesh);

    // Smooth curved chin & under-jaw scute shield
    const jawScute = this.createCurvedThroatShield(0.72, 1.02, 2.4, bellyMat);
    jawScute.position.set(0, -0.32, -1.25);
    jawScute.rotation.x = Math.PI * 0.5;
    jaw.add(jawScute);

    // Lower fangs
    for (let f = -1; f <= 1; f += 0.45) {
      if (Math.abs(f) < 0.15) continue;
      const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.48, 12), fangMat);
      lowerFang.position.set(f * 0.62, 0.18, -1.7 - Math.abs(f) * 0.45);
      lowerFang.rotation.set(-0.15, 0, f * 0.15);
      jaw.add(lowerFang);
    }

    // Throat Heartfire Glow
    const throatCore = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), heartfireMat);
    throatCore.position.set(0, -0.05, -1.1);
    head.add(throatCore);

    const throatLight = new THREE.PointLight(0xff5500, 2.5, 12, 1.8);
    throatLight.position.set(0, 0, -1.2);
    head.add(throatLight);

    // Sweeping Obsidian Horn Crowns (Sleek, aerodynamic S-curve matching reference!)
    const hornL = this.createRefinedHornBranch(hornMat, true);
    hornL.position.set(-0.75, 0.85, 0.35);
    hornL.rotation.set(-0.35, -0.22, 0.18);
    head.add(hornL);

    const hornR = this.createRefinedHornBranch(hornMat, false);
    hornR.position.set(0.75, 0.85, 0.35);
    hornR.rotation.set(-0.35, 0.22, -0.18);
    head.add(hornR);

    // Secondary Crown Spikes behind the main horns
    for (const side of [-1, 1]) {
      const crownSpike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.85, 12), hornMat);
      crownSpike.position.set(side * 0.45, 0.95, 0.65);
      crownSpike.rotation.set(-0.6, side * -0.2, side * 0.2);
      head.add(crownSpike);
    }

    // Dedicated Perch Platform between the Horns for Lady Anuki (Reference: "IN-GAME (FLYING)")
    const perchSocket = new THREE.Group();
    perchSocket.name = 'Perch_Socket_Anuki';
    perchSocket.position.set(0, 0.95, 0.2);
    head.add(perchSocket);

    // Dedicated hero rim/fill light on perch for cinematic flight readability
    const heroPerchLight = new THREE.PointLight(0xfffaed, 1.8, 6.0, 1.6);
    heroPerchLight.position.set(0, 0.8, -0.6);
    perchSocket.add(heroPerchLight);

    // Leather mount saddle cushion & grip rim
    const saddlePad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.75, 0.18, 20),
      saddleMat
    );
    saddlePad.castShadow = true;
    perchSocket.add(saddlePad);

    const saddleRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.08, 12, 24),
      hornMat
    );
    saddleRim.rotation.x = Math.PI * 0.5;
    perchSocket.add(saddleRim);

    // Breath vapor socket at the tip of the snout
    const snoutSocket = new THREE.Group();
    snoutSocket.name = 'Snout_Socket_Breath';
    snoutSocket.position.set(0, -0.1, -3.3);
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

    // 8. Forelegs (Smooth, muscular limbs & sculpted taloned paws)
    const { thigh: frontThighL, shin: frontShinL, foot: frontFootL } =
      this.createRefinedLeg(scalesMat, hornMat, false, true);
    frontThighL.position.set(-2.2, -0.6, -1.8);
    chest.add(frontThighL);

    const { thigh: frontThighR, shin: frontShinR, foot: frontFootR } =
      this.createRefinedLeg(scalesMat, hornMat, false, false);
    frontThighR.position.set(2.2, -0.6, -1.8);
    chest.add(frontThighR);

    // 9. Hind Legs (Muscular predator thighs, defined hocks & talons)
    const { thigh: hindThighL, shin: hindShinL, foot: hindFootL } =
      this.createRefinedLeg(scalesMat, hornMat, true, true);
    hindThighL.position.set(-2.0, -0.4, 0.4);
    pelvis.add(hindThighL);

    const { thigh: hindThighR, shin: hindShinR, foot: hindFootR } =
      this.createRefinedLeg(scalesMat, hornMat, true, false);
    hindThighR.position.set(2.0, -0.4, 0.4);
    pelvis.add(hindThighR);

    // 10. Multi-segment Serpentine Tail (Smoothly tapering with dorsal spines)
    const tailSegments: THREE.Group[] = [];
    let parentTail: THREE.Group = pelvis;
    const tailCount = 6;
    for (let t = 0; t < tailCount; t++) {
      const tailSeg = new THREE.Group();
      tailSeg.name = `Dragon_Tail_${t}`;
      tailSeg.position.set(0, -0.15, 1.9 + (t === 0 ? 0 : 0.6));
      parentTail.add(tailSeg);
      tailSegments.push(tailSeg);

      const rad = Math.max(0.35, 1.4 - t * 0.18);
      const len = 2.4 - t * 0.1;
      const segMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.82, rad, len, 20),
        scalesMat
      );
      segMesh.rotation.x = Math.PI * 0.5;
      segMesh.position.set(0, 0, len * 0.5);
      segMesh.castShadow = true;
      tailSeg.add(segMesh);

      // Dorsal ridge spine on each tail segment
      const tailSpine = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.9 - t * 0.1, 12),
        hornMat
      );
      tailSpine.position.set(0, rad + 0.35, len * 0.5);
      tailSpine.rotation.x = 0.4;
      tailSpine.castShadow = true;
      tailSeg.add(tailSpine);

      // Tail blade / spade tip on last segment
      if (t === tailCount - 1) {
        const spadeTip = new THREE.Mesh(
          new THREE.ConeGeometry(0.55, 2.2, 12),
          hornMat
        );
        spadeTip.rotation.x = Math.PI * 0.5;
        spadeTip.position.set(0, 0, len + 0.9);
        spadeTip.scale.set(1.5, 0.35, 1.0);
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
   * Helper: Creates curved wrapping underbelly scute plate with smooth edges (no flat boxes)
   */
  private createCurvedUnderbellyShield(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    _depth: number,
    material: THREE.Material
  ): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      24,
      2,
      false,
      Math.PI * 0.65,
      Math.PI * 0.7
    );
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Helper: Creates curved throat scute shield that wraps anterior neck contours
   */
  private createCurvedThroatShield(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    material: THREE.Material
  ): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      24,
      1,
      false,
      Math.PI * 0.7,
      Math.PI * 0.6
    );
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    return mesh;
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
   * Builds an articulated dragon wing structure with smooth bones and stretched membrane
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

    // Rounded shoulder humerus base cap
    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 16), boneMat);
    shoulderCap.castShadow = true;
    shoulder.add(shoulderCap);

    // Humerus (Upper arm bone ~6m long, 16 radial segments)
    const humerusLen = 6.2;
    const humerus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.85, humerusLen, 16),
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

    // Rounded elbow joint cap
    const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), boneMat);
    elbowCap.castShadow = true;
    elbow.add(elbowCap);

    // Radius / Ulna (Forearm bone ~8m long extending outward, 16 radial segments)
    const forearmLen = 7.8;
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.65, forearmLen, 16),
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

    // Rounded wrist carpal bulb
    const wristCap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), boneMat);
    wristCap.castShadow = true;
    wrist.add(wristCap);

    // Wing Thumb / Clutched Spur
    const wingThumb = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 1.2, 12),
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
        new THREE.CylinderGeometry(0.12, 0.3, fLen, 12),
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
   * Builds an articulated muscular leg (thigh, shin, and sculpted taloned paw)
   */
  private createRefinedLeg(
    scalesMat: THREE.Material,
    hornMat: THREE.Material,
    isHind: boolean,
    isLeft: boolean
  ): { thigh: THREE.Group; shin: THREE.Group; foot: THREE.Group } {
    const sideSign = isLeft ? -1 : 1;
    const thigh = new THREE.Group();
    thigh.name = `${isHind ? 'Hind' : 'Front'}_Thigh_${isLeft ? 'L' : 'R'}`;

    // Rounded muscular hip joint cap
    const hipCap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 20), scalesMat);
    hipCap.castShadow = true;
    thigh.add(hipCap);

    // Muscular thigh cylinder (24 radial segments with smooth normals)
    const thighLen = isHind ? 3.8 : 3.4;
    const thighGeo = new THREE.CylinderGeometry(0.9, 1.3, thighLen, 24);
    thighGeo.scale(1.1, 1.0, 1.15);
    const thighMesh = new THREE.Mesh(thighGeo, scalesMat);
    thighMesh.position.set(sideSign * 0.4, -thighLen * 0.45, isHind ? 0.4 : -0.2);
    thighMesh.rotation.z = sideSign * 0.2;
    thighMesh.castShadow = true;
    thigh.add(thighMesh);

    // Shin / Crus
    const shin = new THREE.Group();
    shin.name = `${isHind ? 'Hind' : 'Front'}_Shin_${isLeft ? 'L' : 'R'}`;
    shin.position.set(sideSign * 0.6, -thighLen * 0.9, isHind ? 0.6 : -0.3);
    thigh.add(shin);

    // Rounded knee/hock joint cap
    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 20), scalesMat);
    kneeCap.castShadow = true;
    shin.add(kneeCap);

    const shinLen = isHind ? 3.5 : 3.0;
    const shinGeo = new THREE.CylinderGeometry(0.7, 0.9, shinLen, 24);
    shinGeo.scale(1.05, 1.0, 1.1);
    const shinMesh = new THREE.Mesh(shinGeo, scalesMat);
    shinMesh.position.set(0, -shinLen * 0.45, isHind ? -0.4 : 0.3);
    shinMesh.castShadow = true;
    shin.add(shinMesh);

    // Sculpted Draconic Foot & Curved Talons (No box!)
    const foot = new THREE.Group();
    foot.name = `${isHind ? 'Hind' : 'Front'}_Foot_${isLeft ? 'L' : 'R'}`;
    foot.position.set(0, -shinLen * 0.95, 0);
    shin.add(foot);

    // Sculpted curved tarsal foot arch
    const footArchGeo = new THREE.SphereGeometry(1.0, 24, 16);
    footArchGeo.scale(1.25, 0.55, 1.5);
    const footArchMesh = new THREE.Mesh(footArchGeo, scalesMat);
    footArchMesh.position.set(0, -0.15, 0.25);
    footArchMesh.castShadow = true;
    foot.add(footArchMesh);

    // 4 Articulated Toes with Curved Talons spreading outward naturally
    const toeAngles = [-0.45, -0.15, 0.15, 0.45];
    const toeOffsets = [-0.65, -0.22, 0.22, 0.65];

    for (let t = 0; t < 4; t++) {
      const toeGroup = new THREE.Group();
      toeGroup.position.set(toeOffsets[t], -0.28, 1.05);
      toeGroup.rotation.y = toeAngles[t];
      foot.add(toeGroup);

      // Toe digital pad
      const toePad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 0.7, 16),
        scalesMat
      );
      toePad.rotation.x = Math.PI * 0.45;
      toePad.position.set(0, 0, 0.25);
      toePad.castShadow = true;
      toeGroup.add(toePad);

      // Large sharp curved talon (16 radial segments, smooth curve)
      const clawGeo = new THREE.ConeGeometry(0.18, 1.05, 16);
      clawGeo.scale(1.0, 1.0, 0.7);
      const claw = new THREE.Mesh(clawGeo, hornMat);
      claw.position.set(0, -0.1, 0.85);
      claw.rotation.x = Math.PI * 0.65;
      claw.castShadow = true;
      toeGroup.add(claw);
    }

    // Rear spur claw (dewclaw)
    const backSpur = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 14), hornMat);
    backSpur.position.set(0, -0.2, -0.75);
    backSpur.rotation.x = -Math.PI * 0.48;
    backSpur.castShadow = true;
    foot.add(backSpur);

    return { thigh, shin, foot };
  }

  /**
   * Sweeping backward-curving horn branch conforming to Reference Artwork
   */
  private createRefinedHornBranch(hornMat: THREE.Material, isLeft: boolean): THREE.Group {
    const hornGroup = new THREE.Group();
    const sideSign = isLeft ? -1 : 1;

    // Multi-segment curved horn with smooth tapering and 16 radial segments
    const segments = 7;
    let parentNode = hornGroup;

    for (let s = 0; s < segments; s++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(sideSign * 0.20, 0.42, 0.38);
      // Gentle sweep backward and slightly upward at tips
      segGroup.rotation.x = 0.32 - s * 0.02;
      segGroup.rotation.z = sideSign * 0.16;
      parentNode.add(segGroup);

      const rad = Math.max(0.06, 0.48 - s * 0.065);
      const len = 0.68;
      const hornSeg = new THREE.Mesh(
        new THREE.CylinderGeometry(rad * 0.82, rad, len, 16),
        hornMat
      );
      hornSeg.position.set(0, len * 0.5, 0);
      hornSeg.castShadow = true;
      segGroup.add(hornSeg);

      // Horn base ring ridges
      if (s < 4) {
        const ridge = new THREE.Mesh(
          new THREE.TorusGeometry(rad * 1.04, 0.03, 10, 16),
          hornMat
        );
        ridge.rotation.x = Math.PI * 0.5;
        ridge.position.set(0, 0.05, 0);
        segGroup.add(ridge);
      }

      parentNode = segGroup;
    }

    // Sharp tapering horn tip
    const tipGeo = new THREE.ConeGeometry(0.06, 0.55, 16);
    const tipMesh = new THREE.Mesh(tipGeo, hornMat);
    tipMesh.position.set(0, 0.5, 0);
    tipMesh.castShadow = true;
    parentNode.add(tipMesh);

    return hornGroup;
  }
}
