/**
 * Anuki Materials & Texture Factory
 * Generates and loads photorealistic PBR textures extracted directly from the authoritative reference artwork:
 * - Exact photorealistic kitten face with sapphire eyes, cute muzzle, pink nose, and pink ear bow
 * - Authentic cream-gold fluffy fur photo texture
 * - Exact hand-engraved silver plate cuirass with floral filigree and leather belt
 * - Interlocking iron chainmail hauberk
 * - Engraved silver greaves and soft kitten paws
 * - Warm ivory cloth cape
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

  // Photorealistic reference textures
  private static headPhotoTexture: THREE.Texture | null = null;
  private static cuirassPhotoTexture: THREE.Texture | null = null;
  private static chainmailPhotoTexture: THREE.Texture | null = null;
  private static greavesPhotoTexture: THREE.Texture | null = null;
  private static furPhotoTexture: THREE.Texture | null = null;

  /**
   * Exact Photorealistic Head Texture extracted directly from reference artwork
   */
  public static getHeadPhotoTexture(): THREE.Texture {
    if (this.headPhotoTexture) return this.headPhotoTexture;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof (document as any).createElementNS === 'function') {
      const loader = new THREE.TextureLoader();
      this.headPhotoTexture = loader.load('/assets/character/anuki_head_alpha.png');
      this.headPhotoTexture.colorSpace = THREE.SRGBColorSpace;
      return this.headPhotoTexture;
    }
    return this.getFurTexture();
  }

  /**
   * Exact Photorealistic Cuirass Texture extracted from reference artwork
   */
  public static getCuirassPhotoTexture(): THREE.Texture {
    if (this.cuirassPhotoTexture) return this.cuirassPhotoTexture;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof (document as any).createElementNS === 'function') {
      const loader = new THREE.TextureLoader();
      this.cuirassPhotoTexture = loader.load('/assets/character/anuki_cuirass.png');
      this.cuirassPhotoTexture.colorSpace = THREE.SRGBColorSpace;
      return this.cuirassPhotoTexture;
    }
    return this.getArmorTexture();
  }

  /**
   * Exact Chainmail Photo Texture
   */
  public static getChainmailPhotoTexture(): THREE.Texture {
    if (this.chainmailPhotoTexture) return this.chainmailPhotoTexture;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof (document as any).createElementNS === 'function') {
      const loader = new THREE.TextureLoader();
      this.chainmailPhotoTexture = loader.load('/assets/character/anuki_chainmail.png');
      this.chainmailPhotoTexture.colorSpace = THREE.SRGBColorSpace;
      return this.chainmailPhotoTexture;
    }
    return this.getChainmailTexture();
  }

  /**
   * Exact Greaves & Paws Photo Texture
   */
  public static getGreavesPhotoTexture(): THREE.Texture {
    if (this.greavesPhotoTexture) return this.greavesPhotoTexture;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof (document as any).createElementNS === 'function') {
      const loader = new THREE.TextureLoader();
      this.greavesPhotoTexture = loader.load('/assets/character/anuki_greaves.png');
      this.greavesPhotoTexture.colorSpace = THREE.SRGBColorSpace;
      return this.greavesPhotoTexture;
    }
    return this.getArmorTexture();
  }

  /**
   * Photorealistic Fur Texture
   */
  public static getFurPhotoTexture(): THREE.Texture {
    if (this.furPhotoTexture) return this.furPhotoTexture;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof (document as any).createElementNS === 'function') {
      const loader = new THREE.TextureLoader();
      this.furPhotoTexture = loader.load('/assets/character/anuki_fur_photo.png');
      this.furPhotoTexture.colorSpace = THREE.SRGBColorSpace;
      this.furPhotoTexture.wrapS = THREE.RepeatWrapping;
      this.furPhotoTexture.wrapT = THREE.RepeatWrapping;
      return this.furPhotoTexture;
    }
    return this.getFurTexture();
  }

  /**
   * Procedural Fur Texture Fallback
   */
  public static getFurTexture(): THREE.CanvasTexture {
    if (this.furTexture) return this.furTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#f3d9a2');
    grad.addColorStop(0.5, '#eec886');
    grad.addColorStop(1, '#faebd7');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

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

    this.furTexture = new THREE.CanvasTexture(canvas);
    this.furTexture.wrapS = THREE.RepeatWrapping;
    this.furTexture.wrapT = THREE.RepeatWrapping;
    return this.furTexture;
  }

  public static getEyeTexture(): THREE.CanvasTexture {
    if (this.eyeTexture) return this.eyeTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const cx = 128;
    const cy = 128;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 256, 256);

    const limbalGrad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 115);
    limbalGrad.addColorStop(0, '#104e8b');
    limbalGrad.addColorStop(0.7, '#0f3864');
    limbalGrad.addColorStop(1, '#051224');
    ctx.fillStyle = limbalGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 115, 0, Math.PI * 2);
    ctx.fill();

    const irisGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 80);
    irisGrad.addColorStop(0, '#70d6ff');
    irisGrad.addColorStop(0.5, '#2e86de');
    irisGrad.addColorStop(1, '#134e8d');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#060a10';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.ellipse(cx - 22, cy - 22, 14, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();

    this.eyeTexture = new THREE.CanvasTexture(canvas);
    return this.eyeTexture;
  }

  public static getArmorTexture(): THREE.CanvasTexture {
    if (this.armorTexture) return this.armorTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#e8ebed');
    grad.addColorStop(0.5, '#cfd6dc');
    grad.addColorStop(1, '#b0b8c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(70, 78, 86, 0.45)';
    ctx.lineWidth = 2.5;
    for (let y = 40; y < 512; y += 90) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.bezierCurveTo(160, y - 30, 220, y + 30, 256, y);
      ctx.bezierCurveTo(292, y - 30, 352, y + 30, 472, y);
      ctx.stroke();
    }

    this.armorTexture = new THREE.CanvasTexture(canvas);
    this.armorTexture.wrapS = THREE.RepeatWrapping;
    this.armorTexture.wrapT = THREE.RepeatWrapping;
    return this.armorTexture;
  }

  public static getChainmailTexture(): THREE.CanvasTexture {
    if (this.chainmailTexture) return this.chainmailTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1c2024';
    ctx.fillRect(0, 0, 256, 256);

    const ringRadius = 7;
    const step = 11;
    for (let y = 0; y < 256; y += step) {
      const offsetX = (Math.floor(y / step) % 2) * (step / 2);
      for (let x = -step; x < 256 + step; x += step) {
        const rx = x + offsetX;
        ctx.strokeStyle = '#8a949f';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(rx, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    this.chainmailTexture = new THREE.CanvasTexture(canvas);
    this.chainmailTexture.wrapS = THREE.RepeatWrapping;
    this.chainmailTexture.wrapT = THREE.RepeatWrapping;
    this.chainmailTexture.repeat.set(4, 4);
    return this.chainmailTexture;
  }

  public static getCapeTexture(): THREE.CanvasTexture {
    if (this.capeTexture) return this.capeTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 480, 512, 12);

    this.capeTexture = new THREE.CanvasTexture(canvas);
    return this.capeTexture;
  }

  public static getLeatherTexture(): THREE.CanvasTexture {
    if (this.leatherTexture) return this.leatherTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#59341b';
    ctx.fillRect(0, 0, 256, 256);

    this.leatherTexture = new THREE.CanvasTexture(canvas);
    return this.leatherTexture;
  }

  // --- Material Factory Methods ---

  /**
   * Photorealistic Face Material matching reference image exactly
   */
  public static createPhotorealisticFaceMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getHeadPhotoTexture(),
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Photorealistic Engraved Silver Cuirass Material
   * Balanced metalness for crisp visibility under directional lighting
   */
  public static createCuirassPhotoMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getCuirassPhotoTexture(),
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0.25,
    });
  }

  /**
   * Photorealistic Chainmail Material
   */
  public static createChainmailPhotoMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getChainmailPhotoTexture(),
      color: 0xd8dde2,
      metalness: 0.35,
      roughness: 0.45,
    });
  }

  /**
   * Photorealistic Greaves & Paws Material
   */
  public static createGreavesPhotoMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getGreavesPhotoTexture(),
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0.28,
    });
  }

  /**
   * Photorealistic Golden Fur Material
   */
  public static createFurPhotoMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getFurPhotoTexture(),
      color: 0xffeedd,
      roughness: 0.85,
      metalness: 0.05,
    });
  }

  public static createFurMaterial(): THREE.MeshStandardMaterial {
    return this.createFurPhotoMaterial();
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
      map: this.getCuirassPhotoTexture(),
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.22,
    });
  }

  public static createChainmailMaterial(): THREE.MeshStandardMaterial {
    return this.createChainmailPhotoMaterial();
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
      color: 0xf8a5c2, // Pale baby pink matching reference
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
