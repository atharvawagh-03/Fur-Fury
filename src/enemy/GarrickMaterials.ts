/**
 * PBR Materials & Procedural Textures for Sir Garrick Ironjaw
 * Conforming strictly to PRD Section 12 ("Iron-grey heavy plate, scarred open-face helmet, broad halberd, square silhouette").
 */

import * as THREE from 'three';

export class GarrickMaterials {
  private static ironPlateTexture: THREE.CanvasTexture | null = null;
  private static scarredFaceTexture: THREE.CanvasTexture | null = null;
  private static chainmailTexture: THREE.CanvasTexture | null = null;
  private static halberdWoodTexture: THREE.CanvasTexture | null = null;

  /**
   * Procedural iron-grey plate steel texture with hammered denting and edge scratches
   */
  public static getIronPlateTexture(): THREE.CanvasTexture {
    if (this.ironPlateTexture) return this.ironPlateTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base iron-grey gradient
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#555b63');
      grad.addColorStop(0.5, '#444950');
      grad.addColorStop(1, '#3a3f45');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Fine metallic brush lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 200; i++) {
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + (Math.random() - 0.5) * 8);
        ctx.stroke();
      }

      // Battle gouges & scratch lines
      ctx.strokeStyle = 'rgba(20, 22, 25, 0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const len = 15 + Math.random() * 35;
        const angle = (Math.random() - 0.5) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }

      // Edge highlights along scratches
      ctx.strokeStyle = 'rgba(220, 230, 245, 0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20, y + 5);
        ctx.stroke();
      }
    }

    this.ironPlateTexture = new THREE.CanvasTexture(canvas);
    this.ironPlateTexture.wrapS = THREE.RepeatWrapping;
    this.ironPlateTexture.wrapT = THREE.RepeatWrapping;
    return this.ironPlateTexture;
  }

  /**
   * Procedural scarred knight face with open helmet visor, salt-and-pepper beard, and battle scar
   */
  public static getScarredFaceTexture(): THREE.CanvasTexture {
    if (this.scarredFaceTexture) return this.scarredFaceTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Rugged weathered skin
      const skinGrad = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size / 2);
      skinGrad.addColorStop(0, '#c79b7b');
      skinGrad.addColorStop(0.7, '#b28667');
      skinGrad.addColorStop(1, '#8e6247');
      ctx.fillStyle = skinGrad;
      ctx.fillRect(0, 0, size, size);

      // Cropped grey-brown knight beard & mustache
      ctx.fillStyle = '#4a4440';
      ctx.beginPath();
      ctx.arc(size / 2, size * 0.72, size * 0.22, 0, Math.PI);
      ctx.fill();

      // Determined grim eyes with steely grey iris
      const drawEye = (x: number) => {
        ctx.fillStyle = '#22252a';
        ctx.beginPath();
        ctx.arc(x, size * 0.42, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7a8595'; // Steely iris
        ctx.beginPath();
        ctx.arc(x, size * 0.42, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111215'; // Pupil
        ctx.beginPath();
        ctx.arc(x, size * 0.42, 4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(size * 0.38);
      drawEye(size * 0.62);

      // Thick furrowed knight eyebrows
      ctx.strokeStyle = '#38332f';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(size * 0.30, size * 0.36);
      ctx.lineTo(size * 0.45, size * 0.38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size * 0.70, size * 0.36);
      ctx.lineTo(size * 0.55, size * 0.38);
      ctx.stroke();

      // Signature diagonal battle scar across right cheek and jaw
      ctx.strokeStyle = '#6a2828';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size * 0.32, size * 0.32);
      ctx.lineTo(size * 0.42, size * 0.68);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(235, 180, 180, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.33, size * 0.32);
      ctx.lineTo(size * 0.43, size * 0.68);
      ctx.stroke();
    }

    this.scarredFaceTexture = new THREE.CanvasTexture(canvas);
    return this.scarredFaceTexture;
  }

  /**
   * Procedural chainmail texture
   */
  public static getChainmailTexture(): THREE.CanvasTexture {
    if (this.chainmailTexture) return this.chainmailTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#22262c';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = '#666e7a';
      ctx.lineWidth = 2.5;

      const step = 16;
      for (let y = 0; y < size + step; y += step) {
        for (let x = 0; x < size + step; x += step) {
          const offsetX = (Math.floor(y / step) % 2) * (step / 2);
          ctx.beginPath();
          ctx.arc(x + offsetX, y, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    this.chainmailTexture = new THREE.CanvasTexture(canvas);
    this.chainmailTexture.wrapS = THREE.RepeatWrapping;
    this.chainmailTexture.wrapT = THREE.RepeatWrapping;
    this.chainmailTexture.repeat.set(4, 4);
    return this.chainmailTexture;
  }

  /**
   * Procedural ash-wood halberd shaft texture
   */
  public static getHalberdWoodTexture(): THREE.CanvasTexture {
    if (this.halberdWoodTexture) return this.halberdWoodTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, size, 0);
      grad.addColorStop(0, '#4a3828');
      grad.addColorStop(0.5, '#5c4633');
      grad.addColorStop(1, '#3b2b1d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(25, 18, 12, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, size);
        ctx.stroke();
      }
    }

    this.halberdWoodTexture = new THREE.CanvasTexture(canvas);
    this.halberdWoodTexture.wrapS = THREE.RepeatWrapping;
    this.halberdWoodTexture.wrapT = THREE.RepeatWrapping;
    return this.halberdWoodTexture;
  }

  /**
   * Materials
   */
  public static createHeavyIronPlateMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x68707a,
      roughness: 0.38,
      metalness: 0.82,
      map: this.getIronPlateTexture(),
    });
  }

  public static createDarkIronMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x363a40,
      roughness: 0.52,
      metalness: 0.75,
    });
  }

  public static createChainmailMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x777f8a,
      roughness: 0.65,
      metalness: 0.70,
      map: this.getChainmailTexture(),
    });
  }

  public static createFaceMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.05,
      map: this.getScarredFaceTexture(),
    });
  }

  public static createHalberdBladeMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xc8d2de,
      roughness: 0.22,
      metalness: 0.92,
    });
  }

  public static createHalberdShaftMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x6e523b,
      roughness: 0.72,
      metalness: 0.12,
      map: this.getHalberdWoodTexture(),
    });
  }

  public static createBrassAccentMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xbf9b30,
      roughness: 0.32,
      metalness: 0.88,
    });
  }

  public static createBurgundyTabardMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x4d161c,
      roughness: 0.85,
      metalness: 0.10,
    });
  }
}
