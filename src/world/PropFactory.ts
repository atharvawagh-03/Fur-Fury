/**
 * Medieval Tournament Prop Factory
 * Builds banners, wooden training dummies, weapon racks, breakable crates, and barrels with Rapier colliders.
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { ArenaMaterials } from './ArenaMaterials';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export interface InteractiveProp {
  mesh: THREE.Object3D;
  body?: RAPIER.RigidBody;
  type: 'crate' | 'barrel' | 'dummy' | 'banner' | 'weaponRack';
  update?: (time: number) => void;
}

export class PropFactory {
  /**
   * Creates an animated Royal Hanging Banner
   */
  public static createBanner(
    navy: boolean = true,
    width: number = 1.8,
    height: number = 4.5
  ): { mesh: THREE.Mesh; update: (time: number) => void } {
    const geo = new THREE.PlaneGeometry(width, height, 12, 24);
    const posAttr = geo.attributes.position;
    const initialPositions = posAttr.array.slice() as Float32Array;

    const texture = navy ? ArenaMaterials.getBannerTextureNavy() : ArenaMaterials.getBannerTextureCrimson();
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Crossbar mounting pole
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, width + 0.4, 8);
    const poleMat = ArenaMaterials.createWroughtIronMaterial();
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.rotation.z = Math.PI / 2;
    pole.position.y = height / 2;
    pole.castShadow = true;
    mesh.add(pole);

    // Dynamic wave motion simulating breeze
    const update = (time: number) => {
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const origX = initialPositions[i * 3];
        const origY = initialPositions[i * 3 + 1];
        // Upper edge fixed; lower reaches wave more
        const factor = (height / 2 - origY) / height;
        const wave = Math.sin(time * 3 + origY * 2 + origX * 1.5) * 0.12 * Math.max(0, factor);
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    };

    return { mesh, update };
  }

  /**
   * Creates a wooden crate with iron corner brackets and dynamic Rapier physics
   */
  public static createCrate(
    x: number,
    y: number,
    z: number,
    size: number = 1.0,
    physicsWorld?: PhysicsWorld
  ): InteractiveProp {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Main wooden box
    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const boxMat = ArenaMaterials.createWoodMaterial();
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    group.add(boxMesh);

    // Iron corner straps
    const strapMat = ArenaMaterials.createWroughtIronMaterial();
    const strapGeoH = new THREE.BoxGeometry(size * 1.02, 0.08, size * 1.02);
    const strapTop = new THREE.Mesh(strapGeoH, strapMat);
    strapTop.position.y = size * 0.35;
    strapTop.castShadow = true;
    group.add(strapTop);

    const strapBottom = new THREE.Mesh(strapGeoH, strapMat);
    strapBottom.position.y = -size * 0.35;
    strapBottom.castShadow = true;
    group.add(strapBottom);

    let body: RAPIER.RigidBody | undefined;
    if (physicsWorld && physicsWorld.ready) {
      const half = size / 2;
      const phys = physicsWorld.createDynamicBox(x, y, z, half, half, half, 0.2);
      if (phys) {
        body = phys.body;
      }
    }

    return { mesh: group, body, type: 'crate' };
  }

  /**
   * Creates an authentic wooden tournament barrel with iron hoops
   */
  public static createBarrel(
    x: number,
    y: number,
    z: number,
    radius: number = 0.5,
    height: number = 1.2,
    physicsWorld?: PhysicsWorld
  ): InteractiveProp {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Bulging barrel cylinder
    const barrelGeo = new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, height, 16);
    const woodMat = ArenaMaterials.createWoodMaterial();
    const barrelMesh = new THREE.Mesh(barrelGeo, woodMat);
    barrelMesh.scale.set(1.15, 1, 1.15); // Slight bulge
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    group.add(barrelMesh);

    // Iron hoops
    const hoopMat = ArenaMaterials.createWroughtIronMaterial();
    const hoopPositions = [-height * 0.35, -height * 0.15, height * 0.15, height * 0.35];
    hoopPositions.forEach((hy) => {
      const hoopGeo = new THREE.TorusGeometry(radius * 0.95, 0.035, 8, 18);
      const hoop = new THREE.Mesh(hoopGeo, hoopMat);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = hy;
      hoop.castShadow = true;
      group.add(hoop);
    });

    let body: RAPIER.RigidBody | undefined;
    if (physicsWorld && physicsWorld.ready) {
      // Cylinder approximated by cuboid or ball for stable physics
      const halfR = radius * 0.9;
      const halfH = height / 2;
      const phys = physicsWorld.createDynamicBox(x, y, z, halfR, halfH, halfR, 0.25);
      if (phys) {
        body = phys.body;
      }
    }

    return { mesh: group, body, type: 'barrel' };
  }

  /**
   * Creates a training pell / knight dummy per PRD Section 8
   */
  public static createTrainingDummy(x: number, y: number, z: number): InteractiveProp {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const woodMat = ArenaMaterials.createWoodMaterial();
    const ironMat = ArenaMaterials.createWroughtIronMaterial();

    // Base cross stand
    const standGeo = new THREE.BoxGeometry(1.6, 0.15, 0.3);
    const stand1 = new THREE.Mesh(standGeo, woodMat);
    stand1.castShadow = true;
    group.add(stand1);

    const stand2 = stand1.clone();
    stand2.rotation.y = Math.PI / 2;
    group.add(stand2);

    // Vertical pole
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.y = 1.2;
    post.castShadow = true;
    group.add(post);

    // Torso / padded sack
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.1, 10);
    const sackMat = new THREE.MeshStandardMaterial({
      color: 0x9c8868,
      roughness: 0.9,
    });
    const torso = new THREE.Mesh(torsoGeo, sackMat);
    torso.position.y = 1.5;
    torso.castShadow = true;
    group.add(torso);

    // Cross-arm pole
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    const arms = new THREE.Mesh(armGeo, woodMat);
    arms.rotation.z = Math.PI / 2;
    arms.position.y = 1.7;
    arms.castShadow = true;
    group.add(arms);

    // Wooden shield attached to left arm
    const shieldGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x334466,
      roughness: 0.7,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(-0.8, 1.6, 0.2);
    shield.castShadow = true;
    group.add(shield);

    // Training pot helmet
    const helmGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.45, 10);
    const helm = new THREE.Mesh(helmGeo, ironMat);
    helm.position.y = 2.2;
    helm.castShadow = true;
    group.add(helm);

    return { mesh: group, type: 'dummy' };
  }

  /**
   * Creates a medieval tournament weapon rack with halberds and shields
   */
  public static createWeaponRack(x: number, y: number, z: number, rotationY: number = 0): InteractiveProp {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const woodMat = ArenaMaterials.createWoodMaterial();
    const ironMat = ArenaMaterials.createWroughtIronMaterial();

    // A-frame side posts
    const sideA = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.7), woodMat);
    sideA.position.set(-1.0, 0.8, 0);
    sideA.castShadow = true;
    group.add(sideA);

    const sideB = sideA.clone();
    sideB.position.set(1.0, 0.8, 0);
    group.add(sideB);

    // Cross rails
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.15), woodMat);
    railTop.position.set(0, 1.3, 0);
    railTop.castShadow = true;
    group.add(railTop);

    const railBottom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.15), woodMat);
    railBottom.position.set(0, 0.4, 0);
    railBottom.castShadow = true;
    group.add(railBottom);

    // 4 Halberds / Spears leaning on rack
    for (let i = -0.7; i <= 0.7; i += 0.45) {
      const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6);
      const shaft = new THREE.Mesh(shaftGeo, woodMat);
      shaft.position.set(i, 1.25, 0);
      shaft.rotation.x = 0.15;
      shaft.castShadow = true;
      group.add(shaft);

      // Spear / Halberd blade
      const bladeGeo = new THREE.ConeGeometry(0.08, 0.4, 4);
      const blade = new THREE.Mesh(bladeGeo, ironMat);
      blade.position.set(i, 2.5, -0.18);
      blade.rotation.x = 0.15;
      blade.castShadow = true;
      group.add(blade);
    }

    return { mesh: group, type: 'weaponRack' };
  }
}
