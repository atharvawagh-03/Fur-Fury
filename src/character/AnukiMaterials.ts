/**
 * Anuki Materials & Procedural Texture Factory
 * Generates high-fidelity PBR textures for Lady Anuki conforming to PRD Section 11 & Reference Image:
 * - Cream-gold fluffy fur with tabby accents
 * - Oversized expressive sapphire-blue feline eyes
 * - Hand-engraved silver plate armor with ornate filigree
 * - Interlocking chainmail hauberk
 * - Warm ivory woven cloth cape
 * - Pale pink satin ear bow
 * - Rich saddle-brown leather belts
 * - Gleaming Moonfang steel blade and burnished gold trims
 */

import * as THREE from 'three';

export class AnukiMaterials {
  private static furTexture: THREE.CanvasTexture | null = null;
  private static eyeTexture: THREE.CanvasTexture | null = null;
  private static armorTexture: THREE.CanvasTexture | null = null;
  private static chainmailTexture: THREE.CanvasTexture | null = null;
  private static capeTexture: THREE.CanvasTexture | null = null;
  private static leatherTexture: THREE.CanvasTexture | null = null;

  /**
   * Procedural Cream-Gold Fur Texture with soft tabby striping and whisker nodes
   */
  public static getFurTexture(): THREE.CanvasTexture {
    if (this.furTexture) return this.furTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base cream-gold warm gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#f3d9a2'); // Warm golden cream
    grad.addColorStop(0.5, '#eec886'); // Rich honey gold
    grad.addColorStop(1, '#faebd7'); // Antique ivory underbelly

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine fur grain and hair strands
    ctx.strokeStyle = 'rgba(212, 163, 89, 0.25)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 4 + Math.random() * 8;
      const angle = (Math.random() - 0.5) * 0.4 + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Soft forehead and flank tabby stripes
    ctx.strokeStyle = 'rgba(184, 125, 54, 0.28)';
    ctx.lineWidth = 6;
    for (let s = 0; s < 7; s++) {
      const sy = 60 + s * 55;
      ctx.beginPath();
      ctx.moveTo(80, sy);
      ctx.quadraticCurveTo(256, sy + (s % 2 === 0 ? 25 : -15), 432, sy);
      ctx.stroke();
    }

    // Delicate cream-white fur highlights
    ctx.strokeStyle = 'rgba(255, 250, 240, 0.4)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 3 + Math.random() * 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 2, y + len);
      ctx.stroke();
    }

    this.furTexture = new THREE.CanvasTexture(canvas);
    this.furTexture.wrapS = THREE.RepeatWrapping;
    this.furTexture.wrapT = THREE.RepeatWrapping;
    return this.furTexture;
  }

  /**
   * Expressive Feline Eye Texture (Sapphire blue iris with radial depth and specular reflection)
   */
  public static getEyeTexture(): THREE.CanvasTexture {
    if (this.eyeTexture) return this.eyeTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const cx = 128;
    const cy = 128;

    // Sclera base (soft warm white)
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 256, 256);

    // Deep limbal ring
    const limbalGrad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 115);
    limbalGrad.addColorStop(0, '#104e8b'); // Deep sapphire
    limbalGrad.addColorStop(0.7, '#0f3864');
    limbalGrad.addColorStop(1, '#051224'); // Dark limbus
    ctx.fillStyle = limbalGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 115, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant cyan-azure iris center
    const irisGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 80);
    irisGrad.addColorStop(0, '#70d6ff'); // Luminous sky cyan
    irisGrad.addColorStop(0.5, '#2e86de'); // Radiant cerulean
    irisGrad.addColorStop(1, '#134e8d');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();

    // Radial iris fibres
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const r1 = 30 + (i % 3) * 6;
      const r2 = 105;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(180, 230, 255, 0.5)' : 'rgba(10, 45, 90, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }

    // Kitten pupil (deep onyx slightly oval)
    ctx.fillStyle = '#060a10';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crystalline highlight reflection (primary catchlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.ellipse(cx - 22, cy - 22, 14, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Secondary subtle highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(cx + 18, cy + 20, 6, 0, Math.PI * 2);
    ctx.fill();

    this.eyeTexture = new THREE.CanvasTexture(canvas);
    return this.eyeTexture;
  }

  /**
   * Hand-Engraved Silver Plate Armor Texture with royal filigree motifs
   */
  public static getArmorTexture(): THREE.CanvasTexture {
    if (this.armorTexture) return this.armorTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Polished medieval steel base
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#e8ebed');
    grad.addColorStop(0.5, '#cfd6dc');
    grad.addColorStop(1, '#b0b8c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Engraved leaf and floral scrollwork filigree
    ctx.strokeStyle = 'rgba(70, 78, 86, 0.45)';
    ctx.lineWidth = 2.5;

    for (let y = 40; y < 512; y += 90) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.bezierCurveTo(160, y - 30, 220, y + 30, 256, y);
      ctx.bezierCurveTo(292, y - 30, 352, y + 30, 472, y);
      ctx.stroke();

      // Scrollwork florets
      ctx.strokeRect(110, y - 10, 20, 20);
      ctx.strokeRect(380, y - 10, 20, 20);
    }

    // Border ridges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 492, 492);

    ctx.strokeStyle = 'rgba(50, 58, 64, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 480, 480);

    this.armorTexture = new THREE.CanvasTexture(canvas);
    this.armorTexture.wrapS = THREE.RepeatWrapping;
    this.armorTexture.wrapT = THREE.RepeatWrapping;
    return this.armorTexture;
  }

  /**
   * Realistic Interlocking Chainmail Texture
   */
  public static getChainmailTexture(): THREE.CanvasTexture {
    if (this.chainmailTexture) return this.chainmailTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark under-padding
    ctx.fillStyle = '#1c2024';
    ctx.fillRect(0, 0, 256, 256);

    // Interlocked iron rings
    const ringRadius = 7;
    const step = 11;
    for (let y = 0; y < 256; y += step) {
      const offsetX = (Math.floor(y / step) % 2) * (step / 2);
      for (let x = -step; x < 256 + step; x += step) {
        const rx = x + offsetX;
        // Ring shadow
        ctx.strokeStyle = '#0e1012';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(rx, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Ring metallic specular edge
        ctx.strokeStyle = '#8a949f';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(rx - 0.8, y - 0.8, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    this.chainmailTexture = new THREE.CanvasTexture(canvas);
    this.chainmailTexture.wrapS = THREE.RepeatWrapping;
    this.chainmailTexture.wrapT = THREE.RepeatWrapping;
    this.chainmailTexture.repeat.set(4, 4);
    return this.chainmailTexture;
  }

  /**
   * Warm Ivory Cape Woven Linen Texture with gold filigree hem
   */
  public static getCapeTexture(): THREE.CanvasTexture {
    if (this.capeTexture) return this.capeTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Warm ivory base
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle cloth cross-weave texture
    ctx.fillStyle = 'rgba(230, 222, 210, 0.35)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1);
    }
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1, 512);
    }

    // Gold embroidered bottom hem border
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 480, 512, 12);
    ctx.strokeStyle = '#f5df88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < 512; x += 16) {
      ctx.moveTo(x, 480);
      ctx.lineTo(x + 8, 492);
      ctx.lineTo(x + 16, 480);
    }
    ctx.stroke();

    this.capeTexture = new THREE.CanvasTexture(canvas);
    this.capeTexture.wrapS = THREE.RepeatWrapping;
    this.capeTexture.wrapT = THREE.ClampToEdgeWrapping;
    return this.capeTexture;
  }

  /**
   * Rich Saddle-Brown Leather Texture for belts & straps
   */
  public static getLeatherTexture(): THREE.CanvasTexture {
    if (this.leatherTexture) return this.leatherTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#59341b';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(40, 22, 10, 0.4)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2);
    }

    // Stitched edge lines
    ctx.strokeStyle = '#e6c88b';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(6, 6, 244, 244);
    ctx.setLineDash([]);

    this.leatherTexture = new THREE.CanvasTexture(canvas);
    return this.leatherTexture;
  }

  // --- Material Factory Methods ---

  public static createFurMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getFurTexture(),
      roughness: 0.85,
      metalness: 0.05,
      bumpScale: 0.02,
    });
  }

  public static createEyeMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getEyeTexture(),
      roughness: 0.05,
      metalness: 0.1,
    });
  }

  public static createSilverArmorMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getArmorTexture(),
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.22,
    });
  }

  public static createChainmailMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getChainmailTexture(),
      metalness: 0.85,
      roughness: 0.4,
    });
  }

  public static createCapeMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getCapeTexture(),
      color: 0xfffef9,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  }

  public static createPinkBowMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf8a5c2, // Pale baby pink matching reference image
      roughness: 0.45,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
  }

  public static createLeatherMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getLeatherTexture(),
      roughness: 0.7,
      metalness: 0.1,
    });
  }

  public static createGoldTrimMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xdeb853,
      metalness: 0.92,
      roughness: 0.2,
    });
  }

  public static createSteelBladeMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf2f4f7,
      metalness: 0.98,
      roughness: 0.12,
    });
  }

  public static createRubyGemMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xb71540,
      metalness: 0.3,
      roughness: 0.1,
    });
  }
}
