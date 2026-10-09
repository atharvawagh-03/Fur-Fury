/**
 * Grand Arena Architectural Level Builder
 * Hand-authors Veyrholm's royal tournament arena: circular limestone colosseum,
 * tiered stands, North Portcullis gate, Regent's royal pavilion, braziers, and Rapier colliders.
 */

import * as THREE from 'three';
import { ArenaMaterials } from './ArenaMaterials';
import { PropFactory, InteractiveProp } from './PropFactory';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export class GrandArena {
  private group: THREE.Group;
  private physicsWorld: PhysicsWorld;
  private props: InteractiveProp[] = [];
  private braziers: { light: THREE.PointLight; baseIntensity: number; mesh: THREE.Mesh }[] = [];
  private banners: { update: (time: number) => void }[] = [];

  constructor(physicsWorld: PhysicsWorld) {
    this.group = new THREE.Group();
    this.physicsWorld = physicsWorld;
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public getProps(): InteractiveProp[] {
    return this.props;
  }

  public build(): void {
    this.buildArenaFloor();
    this.buildPerimeterWallAndStands();
    this.buildChampionsNorthGate();
    this.buildRegentRoyalPavilion();
    this.buildGrandBraziers();
    this.buildTournamentProps();
    this.buildStaticColliders();
  }

  /**
   * 1. Circular Arena Ground (36m diameter)
   */
  private buildArenaFloor(): void {
    const arenaRadius = 18;

    // Outer foundation ring
    const foundationGeo = new THREE.CylinderGeometry(arenaRadius + 6, arenaRadius + 7, 2, 48);
    const darkStoneMat = ArenaMaterials.createDarkStoneMaterial();
    const foundation = new THREE.Mesh(foundationGeo, darkStoneMat);
    foundation.position.y = -1.0;
    foundation.receiveShadow = true;
    this.group.add(foundation);

    // Arena sand and flagstone floor
    const groundGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius, 0.4, 48);
    const groundMat = ArenaMaterials.createArenaGroundMaterial();
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Inset carved limestone tournament dueling ring (14m radius)
    const ringGeo = new THREE.TorusGeometry(14, 0.25, 12, 64);
    const goldStoneMat = ArenaMaterials.createBurnishedGoldMaterial();
    const duelingRing = new THREE.Mesh(ringGeo, goldStoneMat);
    duelingRing.rotation.x = Math.PI / 2;
    duelingRing.position.y = 0.21;
    duelingRing.receiveShadow = true;
    this.group.add(duelingRing);

    // Inner heraldic star rosette / center emblem
    const centerGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.05, 16);
    const limestoneMat = ArenaMaterials.createLimestoneMaterial();
    const centerPlate = new THREE.Mesh(centerGeo, limestoneMat);
    centerPlate.position.y = 0.22;
    centerPlate.receiveShadow = true;
    this.group.add(centerPlate);
  }

  /**
   * 2. Perimeter Ashlar Retaining Wall & Tiered Spectator Colosseum Stands
   */
  private buildPerimeterWallAndStands(): void {
    const arenaRadius = 18;
    const limestoneMat = ArenaMaterials.createLimestoneMaterial();
    const darkStoneMat = ArenaMaterials.createDarkStoneMaterial();

    // Inner retaining wall (height 3.6m)
    const wallGeo = new THREE.CylinderGeometry(arenaRadius + 0.6, arenaRadius + 0.6, 3.6, 48, 1, true);
    const retainingWall = new THREE.Mesh(wallGeo, limestoneMat);
    retainingWall.position.y = 1.8;
    retainingWall.castShadow = true;
    retainingWall.receiveShadow = true;
    this.group.add(retainingWall);

    // Wall coping rim with gold trim
    const copingGeo = new THREE.TorusGeometry(arenaRadius + 0.6, 0.35, 8, 48);
    const coping = new THREE.Mesh(copingGeo, darkStoneMat);
    coping.rotation.x = Math.PI / 2;
    coping.position.y = 3.6;
    coping.castShadow = true;
    this.group.add(coping);

    // Tiered spectator tiers (3 concentric ascending stone tiers)
    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const tierRadius = arenaRadius + 1.2 + t * 2.2;
      const tierHeight = 1.4;
      const tierY = 3.6 + t * tierHeight;

      const tierGeo = new THREE.CylinderGeometry(tierRadius + 2.2, tierRadius, tierHeight, 48, 1, true);
      const tierMesh = new THREE.Mesh(tierGeo, limestoneMat);
      tierMesh.position.y = tierY + tierHeight / 2;
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      this.group.add(tierMesh);
    }

    // Outer colosseum gallery arcade pillars (16 perimeter columns)
    const pillarCount = 16;
    const galleryRadius = arenaRadius + 8.5;
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      // Skip North Gate (around angle 0) and South Balcony (around angle PI)
      if (Math.abs(angle) < 0.35 || Math.abs(angle - Math.PI) < 0.35) continue;

      const x = Math.cos(angle) * galleryRadius;
      const z = Math.sin(angle) * galleryRadius;

      const colGeo = new THREE.CylinderGeometry(0.7, 0.8, 11, 12);
      const col = new THREE.Mesh(colGeo, limestoneMat);
      col.position.set(x, 5.5, z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      // Arch capital
      const capGeo = new THREE.BoxGeometry(2.0, 0.8, 2.0);
      const cap = new THREE.Mesh(capGeo, darkStoneMat);
      cap.position.set(x, 11.2, z);
      cap.castShadow = true;
      this.group.add(cap);

      // Royal heraldic banners hanging between alternating columns
      if (i % 2 === 0) {
        const bannerData = PropFactory.createBanner(i % 4 === 0, 1.6, 4.8);
        bannerData.mesh.position.set(x * 0.92, 7.8, z * 0.92);
        bannerData.mesh.rotation.y = angle + Math.PI / 2;
        this.group.add(bannerData.mesh);
        this.banners.push({ update: bannerData.update });
      }
    }
  }

  /**
   * 3. North Gate of Champions (Entrance for Sir Garrick Ironjaw)
   */
  private buildChampionsNorthGate(): void {
    const limestoneMat = ArenaMaterials.createLimestoneMaterial();
    const ironMat = ArenaMaterials.createWroughtIronMaterial();
    const darkStoneMat = ArenaMaterials.createDarkStoneMaterial();

    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -18);

    // Left gate tower
    const towerGeo = new THREE.BoxGeometry(4, 12, 5);
    const towerL = new THREE.Mesh(towerGeo, limestoneMat);
    towerL.position.set(-5, 6, -2);
    towerL.castShadow = true;
    towerL.receiveShadow = true;
    gateGroup.add(towerL);

    // Right gate tower
    const towerR = new THREE.Mesh(towerGeo, limestoneMat);
    towerR.position.set(5, 6, -2);
    towerR.castShadow = true;
    towerR.receiveShadow = true;
    gateGroup.add(towerR);

    // Overhead lintel arch
    const archGeo = new THREE.BoxGeometry(14, 3.2, 5.2);
    const arch = new THREE.Mesh(archGeo, darkStoneMat);
    arch.position.set(0, 11.6, -2);
    arch.castShadow = true;
    arch.receiveShadow = true;
    gateGroup.add(arch);

    // Heavy Iron Portcullis
    const portcullisGroup = new THREE.Group();
    portcullisGroup.position.set(0, 4.5, -2);

    // Vertical iron bars
    for (let x = -2.6; x <= 2.6; x += 0.5) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.5, 8), ironMat);
      bar.position.x = x;
      bar.castShadow = true;
      portcullisGroup.add(bar);
      // Spike at bottom
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 4), ironMat);
      spike.position.set(x, -3.9, 0);
      spike.rotation.x = Math.PI;
      portcullisGroup.add(spike);
    }
    // Horizontal crossbars
    for (let y = -3.0; y <= 3.0; y += 1.5) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.18), ironMat);
      hBar.position.y = y;
      hBar.castShadow = true;
      portcullisGroup.add(hBar);
    }
    gateGroup.add(portcullisGroup);

    // Twin giant royal crimson banners flanking the gate
    const bannerL = PropFactory.createBanner(false, 2.0, 6.0);
    bannerL.mesh.position.set(-4.5, 7.5, 0.8);
    gateGroup.add(bannerL.mesh);
    this.banners.push({ update: bannerL.update });

    const bannerR = PropFactory.createBanner(false, 2.0, 6.0);
    bannerR.mesh.position.set(4.5, 7.5, 0.8);
    gateGroup.add(bannerR.mesh);
    this.banners.push({ update: bannerR.update });

    this.group.add(gateGroup);
  }

  /**
   * 4. South Regent's Royal Viewing Pavilion & Balcony
   */
  private buildRegentRoyalPavilion(): void {
    const limestoneMat = ArenaMaterials.createLimestoneMaterial();
    const goldMat = ArenaMaterials.createBurnishedGoldMaterial();
    const darkStoneMat = ArenaMaterials.createDarkStoneMaterial();

    const royalGroup = new THREE.Group();
    royalGroup.position.set(0, 0, 18);
    royalGroup.rotation.y = Math.PI;

    // Balcony platform cantilevered over arena
    const platformGeo = new THREE.BoxGeometry(10, 1.2, 5);
    const platform = new THREE.Mesh(platformGeo, darkStoneMat);
    platform.position.set(0, 4.2, 2.5);
    platform.castShadow = true;
    platform.receiveShadow = true;
    royalGroup.add(platform);

    // Balustrade railing with gold posts
    const railGeo = new THREE.BoxGeometry(9.6, 0.9, 0.3);
    const rail = new THREE.Mesh(railGeo, limestoneMat);
    rail.position.set(0, 5.25, 0.2);
    rail.castShadow = true;
    royalGroup.add(rail);

    // 4 Royal Gold-Fluted Pavilion Columns
    for (let x = -3.8; x <= 3.8; x += 2.5) {
      const colGeo = new THREE.CylinderGeometry(0.35, 0.4, 6.0, 12);
      const col = new THREE.Mesh(colGeo, limestoneMat);
      col.position.set(x, 7.5, 2.5);
      col.castShadow = true;
      royalGroup.add(col);
    }

    // Pavilion Ornamental Canopy / Roof
    const roofGeo = new THREE.ConeGeometry(6.5, 3.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x4a1215, // Regal velvet burgundy
      roughness: 0.6,
      metalness: 0.2,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 11.5, 2.5);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    royalGroup.add(roof);

    // Regent's Throne silhouette
    const throneBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.4), darkStoneMat);
    throneBase.position.set(0, 5.2, 3.5);
    royalGroup.add(throneBase);

    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.3), goldMat);
    throneBack.position.set(0, 6.6, 4.1);
    throneBack.castShadow = true;
    royalGroup.add(throneBack);

    // Banners on royal box
    const navyBanner = PropFactory.createBanner(true, 1.8, 5.0);
    navyBanner.mesh.position.set(-3.8, 7.0, 0.2);
    royalGroup.add(navyBanner.mesh);
    this.banners.push({ update: navyBanner.update });

    const navyBanner2 = PropFactory.createBanner(true, 1.8, 5.0);
    navyBanner2.mesh.position.set(3.8, 7.0, 0.2);
    royalGroup.add(navyBanner2.mesh);
    this.banners.push({ update: navyBanner2.update });

    this.group.add(royalGroup);
  }

  /**
   * 5. 8 Grand Arena Fire Braziers positioned along arena perimeter
   */
  private buildGrandBraziers(): void {
    const brazierCount = 8;
    const brazierRadius = 16.5;
    const ironMat = ArenaMaterials.createWroughtIronMaterial();
    const darkStoneMat = ArenaMaterials.createDarkStoneMaterial();

    for (let i = 0; i < brazierCount; i++) {
      const angle = (i / brazierCount) * Math.PI * 2;
      const x = Math.cos(angle) * brazierRadius;
      const z = Math.sin(angle) * brazierRadius;

      // Stone plinth
      const plinthGeo = new THREE.CylinderGeometry(0.7, 0.85, 3.2, 8);
      const plinth = new THREE.Mesh(plinthGeo, darkStoneMat);
      plinth.position.set(x, 1.6, z);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      this.group.add(plinth);

      // Iron brazier bowl
      const bowlGeo = new THREE.ConeGeometry(1.1, 0.8, 8, 1, true);
      const bowl = new THREE.Mesh(bowlGeo, ironMat);
      bowl.rotation.x = Math.PI;
      bowl.position.set(x, 3.6, z);
      bowl.castShadow = true;
      this.group.add(bowl);

      // Glowing flame sphere
      const flameGeo = new THREE.SphereGeometry(0.4, 12, 12);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff6611,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 4.0, z);
      this.group.add(flame);

      // Dynamic flame point light
      const fireLight = new THREE.PointLight(0xff7722, 2.2, 16);
      fireLight.position.set(x, 4.3, z);
      fireLight.castShadow = true;
      fireLight.shadow.bias = -0.002;
      this.group.add(fireLight);

      this.braziers.push({
        light: fireLight,
        baseIntensity: 2.2,
        mesh: flame,
      });
    }
  }

  /**
   * 6. Tournament Props (Barriers, weapon racks, training dummies, breakable crates & barrels)
   */
  private buildTournamentProps(): void {
    const pw = this.physicsWorld;

    // West Wing Training Zone (X < -8)
    const dummy1 = PropFactory.createTrainingDummy(-11, 0, -5);
    this.group.add(dummy1.mesh);
    this.props.push(dummy1);

    const dummy2 = PropFactory.createTrainingDummy(-11, 0, 5);
    this.group.add(dummy2.mesh);
    this.props.push(dummy2);

    const rackW = PropFactory.createWeaponRack(-13, 0, 0, Math.PI / 2);
    this.group.add(rackW.mesh);
    this.props.push(rackW);

    // East Wing Tournament Supply Staging (X > 8)
    const rackE = PropFactory.createWeaponRack(13, 0, 0, -Math.PI / 2);
    this.group.add(rackE.mesh);
    this.props.push(rackE);

    // Wooden Crates with physics
    const crate1 = PropFactory.createCrate(11, 0.5, -4, 1.0, pw);
    this.group.add(crate1.mesh);
    this.props.push(crate1);

    const crate2 = PropFactory.createCrate(11, 1.5, -4, 0.9, pw);
    this.group.add(crate2.mesh);
    this.props.push(crate2);

    const crate3 = PropFactory.createCrate(12.2, 0.5, -3.2, 1.1, pw);
    this.group.add(crate3.mesh);
    this.props.push(crate3);

    // Tournament Barrels with physics
    const barrel1 = PropFactory.createBarrel(10.5, 0.6, 4, 0.45, 1.2, pw);
    this.group.add(barrel1.mesh);
    this.props.push(barrel1);

    const barrel2 = PropFactory.createBarrel(11.8, 0.6, 4.8, 0.48, 1.25, pw);
    this.group.add(barrel2.mesh);
    this.props.push(barrel2);

    // Wooden perimeter tournament lane barriers
    const barrierMat = ArenaMaterials.createWoodMaterial();
    const barrierPositions = [
      { x: -9, z: -9, rot: 0.6 },
      { x: 9, z: -9, rot: -0.6 },
      { x: -9, z: 9, rot: -0.6 },
      { x: 9, z: 9, rot: 0.6 },
    ];

    barrierPositions.forEach((bp) => {
      const barrierGroup = new THREE.Group();
      barrierGroup.position.set(bp.x, 0, bp.z);
      barrierGroup.rotation.y = bp.rot;

      const beam = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 0.2), barrierMat);
      beam.position.y = 0.8;
      beam.castShadow = true;
      barrierGroup.add(beam);

      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), barrierMat);
      leg1.position.set(-1.5, 0.5, 0);
      leg1.castShadow = true;
      barrierGroup.add(leg1);

      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), barrierMat);
      leg2.position.set(1.5, 0.5, 0);
      leg2.castShadow = true;
      barrierGroup.add(leg2);

      this.group.add(barrierGroup);
    });
  }

  /**
   * 7. Rapier 3D Static Colliders for Arena Floor & Perimeter Walls
   */
  private buildStaticColliders(): void {
    if (!this.physicsWorld.ready) return;

    // Arena Floor Collider (36m diameter ground)
    this.physicsWorld.createStaticBox(0, -0.2, 0, 24, 0.2, 24);

    // Retaining circular boundary wall approximation (16 segment cuboids enclosing arena)
    const wallSegments = 16;
    const r = 18.2;
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      // Tangential wall boxes
      this.physicsWorld.createStaticBox(x, 2.0, z, 3.8, 2.0, 0.8);
    }

    // North Gate portcullis solid block collider
    this.physicsWorld.createStaticBox(0, 4.0, -18.5, 3.5, 4.0, 1.0);
  }

  public update(_deltaTime: number, elapsedTime: number): void {
    // Dynamic brazier flame flicker & pulse
    this.braziers.forEach((b, idx) => {
      const flicker = Math.sin(elapsedTime * 9 + idx * 1.5) * 0.35 + (Math.random() - 0.5) * 0.15;
      b.light.intensity = b.baseIntensity + flicker;
      const scaleFlicker = 1.0 + flicker * 0.1;
      b.mesh.scale.set(scaleFlicker, scaleFlicker * 1.2, scaleFlicker);
    });

    // Wave cloth banners
    this.banners.forEach((b) => b.update(elapsedTime));

    // Synchronize physics props (crates & barrels)
    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];
      if (prop.body) {
        const t = prop.body.translation();
        const r = prop.body.rotation();
        prop.mesh.position.set(t.x, t.y, t.z);
        prop.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      }
    }
  }

  public dispose(): void {
    this.props.forEach((prop) => {
      prop.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      this.group.remove(prop.mesh);
    });
    this.props = [];
    this.braziers = [];
    this.banners = [];
  }
}
