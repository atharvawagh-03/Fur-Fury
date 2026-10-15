/**
 * Disposal Helper - Step 10: Performance Optimization & Memory Management
 * Provides deep recursive disposal of Three.js hierarchies, meshes, geometries,
 * materials, and GPU textures to prevent WebGL memory leaks during scene transitions.
 */

import * as THREE from 'three';

export class DisposalHelper {
  /**
   * Recursively traverses an Object3D hierarchy and properly disposes of
   * all geometries, materials, and embedded textures.
   */
  public static disposeHierarchy(object: THREE.Object3D): void {
    if (!object) return;

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.Line).isLine || (child as THREE.Points).isPoints) {
        const mesh = child as THREE.Mesh;

        // Dispose geometry
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        // Dispose material(s) and associated texture maps
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => this.disposeMaterial(mat));
          } else {
            this.disposeMaterial(mesh.material);
          }
        }
      }
    });

    // Remove from parent if still attached
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /**
   * Disposes of a single material and all its texture maps
   */
  public static disposeMaterial(material: THREE.Material): void {
    if (!material) return;

    const mat = material as any;

    // Check all standard Three.js texture properties
    const textureKeys = [
      'map',
      'alphaMap',
      'roughnessMap',
      'metalnessMap',
      'normalMap',
      'bumpMap',
      'displacementMap',
      'aoMap',
      'emissiveMap',
      'specularMap',
      'envMap',
      'lightMap',
      'gradientMap',
    ];

    for (const key of textureKeys) {
      if (mat[key] && typeof mat[key].dispose === 'function') {
        mat[key].dispose();
        mat[key] = null;
      }
    }

    material.dispose();
  }

  /**
   * Explicitly disposes a list of textures
   */
  public static disposeTextures(...textures: (THREE.Texture | null | undefined)[]): void {
    for (const tex of textures) {
      if (tex && typeof tex.dispose === 'function') {
        tex.dispose();
      }
    }
  }
}
