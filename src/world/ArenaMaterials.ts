/**
 * Grand Arena PBR Material & Procedural Texture Factory
 * Generates authored PBR textures (Ashlar stone, arena sands, royal heraldic fabric, wrought iron, aged wood).
 */

import * as THREE from 'three';

export class ArenaMaterials {
  private static stoneTexture: THREE.CanvasTexture | null = null;
  private static sandTexture: THREE.CanvasTexture | null = null;
  private static woodTexture: THREE.CanvasTexture | null = null;
  private static bannerTextureNavy: THREE.CanvasTexture | null = null;
  private static bannerTextureCrimson: THREE.CanvasTexture | null = null;

  /**
   * Procedural Limestone Ashlar Blocks Texture
   */
  public static getStoneTexture(): THREE.CanvasTexture {
    if (this.stoneTexture) return this.stoneTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base limestone color
    ctx.fillStyle = '#9b9487';
    ctx.fillRect(0, 0, 1024, 1024);

    // Stone blocks grid (alternating brick pattern)
    const rows = 16;
    const rowHeight = 1024 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowHeight;
      const isOffset = r % 2 === 1;
      const blockWidth = 128;
      const offsetX = isOffset ? blockWidth / 2 : 0;

      for (let x = -offsetX; x < 1024; x += blockWidth) {
        // Individual stone tone variation
        const shade = Math.floor(135 + (Math.sin(r * 3.7 + x * 0.1) * 20) + (Math.random() * 15 - 7));
        ctx.fillStyle = `rgb(${shade + 10}, ${shade + 5}, ${shade - 5})`;
        ctx.fillRect(x + 2, y + 2, blockWidth - 4, rowHeight - 4);

        // Subtle noise & grain within block
        for (let i = 0; i < 40; i++) {
          const px = x + 2 + Math.random() * (blockWidth - 4);
          const py = y + 2 + Math.random() * (rowHeight - 4);
          const speckle = Math.floor(shade + (Math.random() * 40 - 20));
          ctx.fillStyle = `rgba(${speckle}, ${speckle}, ${speckle}, 0.25)`;
          ctx.fillRect(px, py, 3, 3);
        }
      }

      // Mortar groove line
      ctx.fillStyle = '#4c463e';
      ctx.fillRect(0, y, 1024, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.stoneTexture = texture;
    return texture;
  }

  /**
   * Procedural Arena Sand & Dirt Texture
   */
  public static getSandTexture(): THREE.CanvasTexture {
    if (this.sandTexture) return this.sandTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Sand base
    ctx.fillStyle = '#8f7c5e';
    ctx.fillRect(0, 0, 1024, 1024);

    // Grit and pebble noise
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const colorMod = Math.random() * 50 - 25;
      const r = Math.floor(143 + colorMod);
      const g = Math.floor(124 + colorMod * 0.9);
      const b = Math.floor(94 + colorMod * 0.8);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Trod-upon arena ground circular sweep marks
    ctx.strokeStyle = 'rgba(100, 85, 60, 0.2)';
    ctx.lineWidth = 6;
    for (let radius = 100; radius < 600; radius += 80) {
      ctx.beginPath();
      ctx.arc(512, 512, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.sandTexture = texture;
    return texture;
  }

  /**
   * Procedural Weathered Timber Texture
   */
  public static getWoodTexture(): THREE.CanvasTexture {
    if (this.woodTexture) return this.woodTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#4a3525';
    ctx.fillRect(0, 0, 512, 512);

    // Wood grain lines
    for (let y = 0; y < 512; y += 3) {
      const shade = Math.floor(60 + Math.sin(y * 0.2) * 20 + Math.random() * 15);
      ctx.fillStyle = `rgb(${shade + 20}, ${shade}, ${shade - 15})`;
      ctx.fillRect(0, y, 512, 2);
    }

    // Planks borders
    ctx.fillStyle = '#22150d';
    for (let x = 0; x < 512; x += 64) {
      ctx.fillRect(x, 0, 4, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.woodTexture = texture;
    return texture;
  }

  /**
   * Veyrholm Royal Heraldic Banner (Navy & Gold Lion Crest)
   */
  public static getBannerTextureNavy(): THREE.CanvasTexture {
    if (this.bannerTextureNavy) return this.bannerTextureNavy;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Royal Navy background
    ctx.fillStyle = '#16233b';
    ctx.fillRect(0, 0, 512, 1024);

    // Ornate Gold border
    ctx.strokeStyle = '#e5b85e';
    ctx.lineWidth = 16;
    ctx.strokeRect(20, 20, 472, 984);

    ctx.strokeStyle = '#916f2b';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, 440, 952);

    // Veyrholm Stylized Heraldic Lion / Gryphon Crest
    ctx.save();
    ctx.translate(256, 400);

    // Shield background
    ctx.fillStyle = '#0f1726';
    ctx.beginPath();
    ctx.moveTo(0, -160);
    ctx.lineTo(130, -110);
    ctx.lineTo(110, 80);
    ctx.lineTo(0, 180);
    ctx.lineTo(-110, 80);
    ctx.lineTo(-130, -110);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e5b85e';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Stylized Rampant Lion figure
    ctx.fillStyle = '#fbe3a1';
    // Head & Mane
    ctx.beginPath();
    ctx.arc(0, -50, 40, 0, Math.PI * 2);
    ctx.fill();
    // Crown
    ctx.fillStyle = '#e5b85e';
    ctx.beginPath();
    ctx.moveTo(-35, -80);
    ctx.lineTo(-20, -115);
    ctx.lineTo(0, -95);
    ctx.lineTo(20, -115);
    ctx.lineTo(35, -80);
    ctx.closePath();
    ctx.fill();

    // Torso & Paws
    ctx.fillStyle = '#fbe3a1';
    ctx.beginPath();
    ctx.ellipse(0, 25, 30, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Claws
    ctx.fillRect(-65, -20, 45, 12);
    ctx.fillRect(20, -35, 50, 12);
    ctx.fillRect(-50, 60, 35, 14);
    ctx.fillRect(15, 60, 35, 14);

    ctx.restore();

    // Bottom Chevron tail cut
    ctx.fillStyle = '#000000';
    // Banner swallowtail cutout (visual indicator)
    ctx.fillStyle = '#e5b85e';
    ctx.beginPath();
    ctx.moveTo(40, 950);
    ctx.lineTo(256, 900);
    ctx.lineTo(472, 950);
    ctx.lineWidth = 12;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.bannerTextureNavy = texture;
    return texture;
  }

  /**
   * Veyrholm Regent Crimson & Gold Banner
   */
  public static getBannerTextureCrimson(): THREE.CanvasTexture {
    if (this.bannerTextureCrimson) return this.bannerTextureCrimson;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Crimson base
    ctx.fillStyle = '#6b1419';
    ctx.fillRect(0, 0, 512, 1024);

    // Gold borders
    ctx.strokeStyle = '#e5b85e';
    ctx.lineWidth = 16;
    ctx.strokeRect(20, 20, 472, 984);

    // Double chevron gold emblems
    ctx.strokeStyle = '#fbe3a1';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(100, 300);
    ctx.lineTo(256, 450);
    ctx.lineTo(412, 300);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100, 450);
    ctx.lineTo(256, 600);
    ctx.lineTo(412, 450);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.bannerTextureCrimson = texture;
    return texture;
  }

  // Pre-configured PBR Materials
  public static createLimestoneMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getStoneTexture().clone();
    tex.repeat.set(6, 6);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.8,
      metalness: 0.08,
      color: 0xc8c0b2,
    });
  }

  public static createDarkStoneMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getStoneTexture().clone();
    tex.repeat.set(4, 4);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.15,
      color: 0x5a554d,
    });
  }

  public static createArenaGroundMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getSandTexture();
    tex.repeat.set(8, 8);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.95,
      metalness: 0.02,
      color: 0xbaa88e,
    });
  }

  public static createWroughtIronMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x242426,
      roughness: 0.45,
      metalness: 0.85,
    });
  }

  public static createBurnishedGoldMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xdeb853,
      roughness: 0.28,
      metalness: 0.92,
    });
  }

  public static createWoodMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getWoodTexture();
    tex.repeat.set(2, 2);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.7,
      metalness: 0.05,
      color: 0x8a6240,
    });
  }
}
