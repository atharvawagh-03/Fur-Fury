/**
 * Rhazakar PBR Material & Procedural Texture Factory
 * Conforming to PRD Section 10 & Art Bible:
 * - Gigantic scarlet dragon with layered crimson scales and iridescent bronze specular sheen
 * - Darker horn ridges with striated charcoal/obsidian bone grain
 * - Glowing amber reptilian eyes with slit pupils
 * - Worn leathery wing membranes with warm vascular undertones
 * - Molten heartfire throat glow and ivory fangs
 */

import * as THREE from 'three';

export class RhazakarMaterials {
  private static scaleTextureCache: THREE.CanvasTexture | null = null;
  private static hornTextureCache: THREE.CanvasTexture | null = null;
  private static wingTextureCache: THREE.CanvasTexture | null = null;
  private static eyeTextureCache: THREE.CanvasTexture | null = null;

  /**
   * Procedural layered crimson draconic scale texture
   */
  public static createScaleTexture(): THREE.CanvasTexture {
    if (this.scaleTextureCache) return this.scaleTextureCache;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base deep crimson/scarlet fill
    const grad = ctx.createRadialGradient(size / 2, size / 2, 50, size / 2, size / 2, size * 0.7);
    grad.addColorStop(0, '#9e1414');
    grad.addColorStop(0.6, '#750909');
    grad.addColorStop(1, '#420303');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Overlapping scale pattern
    const rows = 16;
    const cols = 16;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2 === 0) ? 0 : cellW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + offsetX;
        const y = r * cellH;

        // Individual scale shield shape
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + cellW * 0.5, y);
        ctx.bezierCurveTo(x + cellW * 0.95, y + cellH * 0.35, x + cellW * 0.85, y + cellH * 0.95, x + cellW * 0.5, y + cellH);
        ctx.bezierCurveTo(x + cellW * 0.15, y + cellH * 0.95, x + cellW * 0.05, y + cellH * 0.35, x + cellW * 0.5, y);
        ctx.closePath();

        // Scale gradient with bronze rim highlight
        const scaleGrad = ctx.createLinearGradient(x, y, x, y + cellH);
        scaleGrad.addColorStop(0, '#bd2626');
        scaleGrad.addColorStop(0.4, '#8a0d0d');
        scaleGrad.addColorStop(0.85, '#5c0606');
        scaleGrad.addColorStop(1, '#330202');
        ctx.fillStyle = scaleGrad;
        ctx.fill();

        // Scale edge bevel
        ctx.strokeStyle = '#c95132';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Subtle center ridge line
        ctx.beginPath();
        ctx.moveTo(x + cellW * 0.5, y + 2);
        ctx.lineTo(x + cellW * 0.5, y + cellH * 0.8);
        ctx.strokeStyle = 'rgba(235, 130, 80, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.scaleTextureCache = texture;
    return texture;
  }

  /**
   * Procedural horn ridge & charcoal obsidian texture
   */
  public static createHornTexture(): THREE.CanvasTexture {
    if (this.hornTextureCache) return this.hornTextureCache;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark charcoal base
    ctx.fillStyle = '#1c1b1c';
    ctx.fillRect(0, 0, size, size);

    // Striated bone ridges
    for (let y = 0; y < size; y += 4) {
      const alpha = 0.15 + Math.random() * 0.25;
      const shade = Math.floor(40 + Math.random() * 30);
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
      ctx.fillRect(0, y, size, 2 + Math.random() * 3);
    }

    // Longitudinal micro-cracks
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.6)';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      const x = Math.random() * size;
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 20, size);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    this.hornTextureCache = texture;
    return texture;
  }

  /**
   * Procedural wing leathery membrane texture with vascular veins
   */
  public static createWingTexture(): THREE.CanvasTexture {
    if (this.wingTextureCache) return this.wingTextureCache;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Leathery deep brick red with warm center glow
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#5a0e0e');
    grad.addColorStop(0.5, '#7b1818');
    grad.addColorStop(1, '#440909');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Fine capillary vein network
    ctx.strokeStyle = 'rgba(175, 45, 30, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 60;
        cy += (Math.random() - 0.2) * 50;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Leathery surface mottling
    for (let i = 0; i < 2000; i++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(210, 80, 50, ${alpha})` : `rgba(20, 5, 5, ${alpha})`;
      ctx.fillRect(px, py, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.wingTextureCache = texture;
    return texture;
  }

  /**
   * Glowing reptilian amber eye with slit pupil
   */
  public static createEyeTexture(): THREE.CanvasTexture {
    if (this.eyeTextureCache) return this.eyeTextureCache;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Fiery amber radial gradient
    const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.48);
    grad.addColorStop(0, '#ffe066');
    grad.addColorStop(0.35, '#ff9900');
    grad.addColorStop(0.7, '#cc4400');
    grad.addColorStop(0.9, '#801500');
    grad.addColorStop(1, '#2b0000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Slit pupil
    ctx.save();
    ctx.fillStyle = '#0a0300';
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, 14, size * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil rim glow
    ctx.strokeStyle = 'rgba(255, 210, 100, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Specular catchlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(size / 2 - 25, size / 2 - 35, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    this.eyeTextureCache = texture;
    return texture;
  }

  private static scuteTextureCache: THREE.CanvasTexture | null = null;

  /**
   * Procedural segmented cream-sand underbelly armor scute plate texture
   * Conforming to PRD Section 10 & official Red Dragon visual reference:
   * Cream/tan palette (#dfc5a0 / #e8d5be) with segmented horizontal plates and horny striations
   */
  public static createScuteTexture(): THREE.CanvasTexture {
    if (this.scuteTextureCache) return this.scuteTextureCache;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base warm bone/cream sand fill
    ctx.fillStyle = '#dec5a2';
    ctx.fillRect(0, 0, size, size);

    // Segmented horizontal armor plate bands with deep shadow grooves
    const plateCount = 10;
    const plateH = size / plateCount;
    for (let i = 0; i < plateCount; i++) {
      const y = i * plateH;

      // Curved plate gradient from highlighted upper edge to shaded bottom edge
      const grad = ctx.createLinearGradient(0, y, 0, y + plateH);
      grad.addColorStop(0, '#f5e4cd');
      grad.addColorStop(0.2, '#e8d2b4');
      grad.addColorStop(0.75, '#c9ad88');
      grad.addColorStop(1, '#9e7e59');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, size, plateH);

      // Deep groove between plates
      ctx.strokeStyle = '#5c3e24';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.25, y + 4, size * 0.75, y + 4, size, y);
      ctx.stroke();

      // Sharp highlight just below the groove
      ctx.strokeStyle = 'rgba(255, 245, 230, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y + 4);
      ctx.bezierCurveTo(size * 0.25, y + 7, size * 0.75, y + 7, size, y + 4);
      ctx.stroke();

      // Subtle vertical bone striations across plates
      for (let s = 0; s < 18; s++) {
        const sx = Math.random() * size;
        ctx.strokeStyle = 'rgba(120, 85, 55, 0.22)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(sx, y + 3);
        ctx.lineTo(sx + (Math.random() - 0.5) * 6, y + plateH - 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    this.scuteTextureCache = texture;
    return texture;
  }

  /**
   * PBR Primary Dragon Scales Material
   */
  public static createScarletScalesMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xba1a1a,
      roughness: 0.52,
      metalness: 0.18,
      map: this.createScaleTexture(),
      bumpMap: this.createScaleTexture(),
      bumpScale: 0.08,
      roughnessMap: this.createScaleTexture(),
    });
  }

  /**
   * PBR Armored Underbelly / Keel Scute Plates Material
   * Conforms to official Red Dragon reference palette: cream-sand armor (#dec5a2)
   */
  public static createBellyScutesMaterial(): THREE.MeshStandardMaterial {
    const scuteMap = this.createScuteTexture();
    return new THREE.MeshStandardMaterial({
      color: 0xdec5a2,
      roughness: 0.58,
      metalness: 0.1,
      map: scuteMap,
      bumpMap: scuteMap,
      bumpScale: 0.12,
    });
  }

  /**
   * PBR Obsidian Horn & Ridge Material
   */
  public static createHornMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x242022,
      roughness: 0.38,
      metalness: 0.35,
      map: this.createHornTexture(),
      bumpMap: this.createHornTexture(),
      bumpScale: 0.1,
    });
  }

  /**
   * PBR Wing Leathery Membrane Material (double-sided)
   */
  public static createWingMembraneMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x8a1c1c,
      roughness: 0.62,
      metalness: 0.08,
      map: this.createWingTexture(),
      side: THREE.DoubleSide,
    });
  }

  /**
   * Wing Bone & Claws Material
   */
  public static createWingBoneMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x611515,
      roughness: 0.45,
      metalness: 0.2,
      map: this.createHornTexture(),
    });
  }

  /**
   * Amber Reptilian Eyes Material with Emissive Glow
   */
  public static createAmberEyeMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.createEyeTexture(),
      roughness: 0.15,
      metalness: 0.1,
      emissive: new THREE.Color(0xd95700),
      emissiveIntensity: 0.45,
    });
  }

  /**
   * Heartfire Throat Emissive Material
   */
  public static createHeartfireMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0xff4d00,
      transparent: true,
      opacity: 0.85,
    });
  }

  /**
   * Ivory Fangs & Spikes Material
   */
  public static createFangMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xded7c5,
      roughness: 0.3,
      metalness: 0.1,
    });
  }

  /**
   * Saddle Mount / Horn Perch Platform Material for Lady Anuki
   */
  public static createSaddleMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x3d2516,
      roughness: 0.7,
      metalness: 0.15,
    });
  }
}
