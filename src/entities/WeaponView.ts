import * as THREE from 'three';
import { ParticlePool } from '../combat/particles';

export class WeaponView {
  readonly group: THREE.Group;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly muzzleFlash: THREE.Group;
  private readonly glowMaterial: THREE.MeshBasicMaterial;
  private flashRemaining = 0;
  private recoil = 0;

  private rifleModel!: THREE.Group;
  private shotgunModel!: THREE.Group;
  private flamethrowerModel!: THREE.Group;
  private knifeModel!: THREE.Group;
  private activeType: 'rifle' | 'shotgun' | 'flamethrower' | 'melee' = 'rifle';

  private readonly ammoCanvas!: HTMLCanvasElement;
  private readonly ammoContext!: CanvasRenderingContext2D;
  private readonly ammoTexture!: THREE.CanvasTexture;
  private lastDrawnAmmo: number | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.position.set(0.38, -0.42, -0.95);
    this.group.rotation.set(-0.08, 0.28, -0.05);

    if (typeof document !== 'undefined') {
      this.ammoCanvas = document.createElement('canvas');
      this.ammoCanvas.width = 128;
      this.ammoCanvas.height = 64;
      const ctx = this.ammoCanvas.getContext('2d');
      if (ctx) {
        this.ammoContext = ctx;
      }
      this.ammoTexture = new THREE.CanvasTexture(this.ammoCanvas);
      this.updateAmmo(30); // Draw initial ammo value
    } else {
      this.ammoCanvas = null as any;
      this.ammoContext = null as any;
      this.ammoTexture = new THREE.Texture() as any;
    }

    this.createRifleModel();
    this.createShotgunModel();
    this.createKnifeModel();

    // Muzzle flash - stile DOOM: forma a stella a 8 punte con alone
    const muzzleGroup = new THREE.Group();

    // Stella principale a 8 punte
    const muzzleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.0,
    });
    const muzzleCore = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 8), muzzleMaterial);
    muzzleCore.rotation.z = Math.PI / 2;
    muzzleGroup.add(muzzleCore);

    // Seconda stella ruotata per effetto a 16 punte
    const muzzleMaterial2 = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.0,
    });
    const muzzleInner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 8), muzzleMaterial2);
    muzzleInner.rotation.z = Math.PI / 2 + Math.PI / 8;
    muzzleGroup.add(muzzleInner);

    // Alone di luce intorno
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.0,
    });
    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), glowMaterial);
    glowMesh.scale.set(1.5, 0.6, 1);
    muzzleGroup.add(glowMesh);

    this.muzzleFlash = muzzleGroup;
    this.glowMaterial = glowMaterial;
    this.muzzleFlash.position.set(0.42, 0.02, -0.44);
    this.muzzleFlash.visible = false;
    this.group.add(this.muzzleFlash);

    camera.add(this.group);
    this.setWeapon('rifle');
  }

  private createRifleModel(): void {
    this.rifleModel = new THREE.Group();

    // Corpo principale più spesso e dettagliato
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.22, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.2, roughness: 0.75 })
    );
    this.rifleModel.add(body);

    // Dettaglio laterale corpo
    const bodyDetail = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.18, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true, metalness: 0.15, roughness: 0.8 })
    );
    bodyDetail.position.set(0, 0, 0.02);
    this.rifleModel.add(bodyDetail);

    // Canna con raffreddamento a spirale (heat sink)
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.68, 12),
      new THREE.MeshStandardMaterial({ color: 0x37474f, flatShading: true, metalness: 0.45, roughness: 0.5 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.14, 0.03, -0.42);
    this.rifleModel.add(barrel);

    // Anelli del heat sink (raffreddamento a spirale)
    for (let i = 0; i < 6; i++) {
      const heatRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true, metalness: 0.5, roughness: 0.55 })
      );
      heatRing.rotation.z = Math.PI / 2;
      heatRing.position.set(0.14 - 0.2 + i * 0.08, 0.03, -0.42);
      this.rifleModel.add(heatRing);
    }

    // Torcia tattica sotto la canna
    const flashlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.3, roughness: 0.7 })
    );
    flashlight.rotation.z = Math.PI / 2;
    flashlight.position.set(0.18, -0.08, -0.35);
    this.rifleModel.add(flashlight);

    // Lente della torcia
    const flashlightLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffcc, flatShading: true, emissive: 0x444422, emissiveIntensity: 0.3 })
    );
    flashlightLens.rotation.z = Math.PI / 2;
    flashlightLens.position.set(0.27, -0.08, -0.35);
    this.rifleModel.add(flashlightLens);

    // Impugnatura ergonomica
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.35, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1b, flatShading: true, roughness: 0.85 })
    );
    grip.position.set(-0.1, -0.2, -0.04);
    grip.rotation.z = -0.25;
    this.rifleModel.add(grip);

    // Texture impugnatura (linee)
    for (let i = 0; i < 4; i++) {
      const gripLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, 0.02, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true })
      );
      gripLine.position.set(-0.1, -0.12 - i * 0.06, -0.04);
      gripLine.rotation.z = -0.25;
      this.rifleModel.add(gripLine);
    }

    // Grilletto
    const trigger = new THREE.Mesh(
      new THREE.TorusGeometry(0.025, 0.008, 4, 8, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true, metalness: 0.6, roughness: 0.4 })
    );
    trigger.rotation.z = Math.PI / 2;
    trigger.position.set(-0.02, -0.08, -0.04);
    this.rifleModel.add(trigger);

    // Guardia grilletto
    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.006, 4, 12, Math.PI * 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.4, roughness: 0.6 })
    );
    triggerGuard.rotation.z = Math.PI / 2 + 0.3;
    triggerGuard.position.set(-0.02, -0.08, -0.04);
    this.rifleModel.add(triggerGuard);

    // Caricatore curvo
    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.32, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true })
    );
    magazine.position.set(-0.04, -0.14, 0.1);
    magazine.rotation.z = 0.18;
    this.rifleModel.add(magazine);

    // Dettaglio caricatore
    const magDetail = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.28, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, flatShading: true })
    );
    magDetail.position.set(-0.04, -0.14, 0.1);
    magDetail.rotation.z = 0.18;
    this.rifleModel.add(magDetail);

    // Mirino olografico più grande con luce rossa
    const sightBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true })
    );
    sightBase.position.set(0.0, 0.13, -0.1);
    this.rifleModel.add(sightBase);

    const sightMount = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1b, flatShading: true })
    );
    sightMount.position.set(0.0, 0.18, -0.1);
    this.rifleModel.add(sightMount);

    // Cornice mirino
    const sightFrameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.12, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true })
    );
    sightFrameLeft.position.set(-0.04, 0.26, -0.1);
    this.rifleModel.add(sightFrameLeft);

    const sightFrameRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.12, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true })
    );
    sightFrameRight.position.set(0.04, 0.26, -0.1);
    this.rifleModel.add(sightFrameRight);

    const sightFrameTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.02, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true })
    );
    sightFrameTop.position.set(0.0, 0.32, -0.1);
    this.rifleModel.add(sightFrameTop);

    // Lente mirino
    const sightLens = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 })
    );
    sightLens.position.set(0.0, 0.26, -0.1);
    this.rifleModel.add(sightLens);

    // Punto reticolo rosso
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 });
    const reticle = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), reticleMat);
    reticle.position.set(0.0, 0.26, -0.1);
    this.rifleModel.add(reticle);

    // Accenti rossi sul corpo
    const redAccent1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.02, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, flatShading: true, emissive: 0x330000 })
    );
    redAccent1.position.set(0, 0.08, -0.35);
    this.rifleModel.add(redAccent1);

    const redAccent2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, flatShading: true, emissive: 0x330000 })
    );
    redAccent2.position.set(0.24, 0.03, 0);
    this.rifleModel.add(redAccent2);

    // Calcio con texture dettagliata
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, roughness: 0.9 })
    );
    stock.position.set(0.0, -0.06, 0.5);
    this.rifleModel.add(stock);

    // Texture calcio (bump pattern)
    for (let i = 0; i < 5; i++) {
      const stockLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.02, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true })
      );
      stockLine.position.set(0, -0.06, 0.35 + i * 0.08);
      this.rifleModel.add(stockLine);
    }

    // Pad calcio
    const stockPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.24, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, flatShading: true, roughness: 0.95 })
    );
    stockPad.position.set(0.0, -0.06, 0.76);
    this.rifleModel.add(stockPad);

    // Neon cyan ammo counter screen mesh
    const ammoGeo = new THREE.PlaneGeometry(0.12, 0.06);
    const ammoMat = new THREE.MeshBasicMaterial({
      map: this.ammoTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const rifleAmmoMesh = new THREE.Mesh(ammoGeo, ammoMat);
    rifleAmmoMesh.position.set(0.0, 0.16, -0.02);
    rifleAmmoMesh.rotation.x = -0.15;
    this.rifleModel.add(rifleAmmoMesh);

    this.group.add(this.rifleModel);
  }

  private createShotgunModel(): void {
    this.shotgunModel = new THREE.Group();

    // Corpo principale più spesso
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.28, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x2d1b15, flatShading: true, metalness: 0.15, roughness: 0.85 })
    );
    this.shotgunModel.add(body);

    // Dettaglio corpo
    const bodyDetail = new THREE.Mesh(
      new THREE.BoxGeometry(0.57, 0.24, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true, metalness: 0.1, roughness: 0.9 })
    );
    bodyDetail.position.set(0, 0, 0.02);
    this.shotgunModel.add(bodyDetail);

    // Canne più lunghe e robusti
    const barrelLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.06, 0.85, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.7, roughness: 0.35 })
    );
    barrelLeft.rotation.z = Math.PI / 2;
    barrelLeft.position.set(0.28, 0.06, -0.12);
    this.shotgunModel.add(barrelLeft);

    const barrelRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.06, 0.85, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.7, roughness: 0.35 })
    );
    barrelRight.rotation.z = Math.PI / 2;
    barrelRight.position.set(0.28, 0.06, 0.12);
    this.shotgunModel.add(barrelRight);

    // Rinforzo canne
    const barrelSupport = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.15, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true, metalness: 0.5, roughness: 0.5 })
    );
    barrelSupport.position.set(0.55, 0.06, 0);
    this.shotgunModel.add(barrelSupport);

    // Pompa (pump action)
    const pump = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.18, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.4, roughness: 0.6 })
    );
    pump.position.set(0.15, -0.08, 0);
    this.shotgunModel.add(pump);

    // Impugnatura pompa
    const pumpGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.42, 6),
      new THREE.MeshStandardMaterial({ color: 0x2d1b15, flatShading: true, roughness: 0.9 })
    );
    pumpGrip.rotation.z = Math.PI / 2;
    pumpGrip.position.set(0.15, -0.18, 0);
    this.shotgunModel.add(pumpGrip);

    // Impugnatura principale
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.28, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x2d1b15, flatShading: true, roughness: 0.9 })
    );
    grip.position.set(-0.18, -0.2, 0);
    grip.rotation.z = -0.3;
    this.shotgunModel.add(grip);

    // Texture impugnatura
    for (let i = 0; i < 5; i++) {
      const gripLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.02, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true })
      );
      gripLine.position.set(-0.18, -0.12 - i * 0.05, 0);
      gripLine.rotation.z = -0.3;
      this.shotgunModel.add(gripLine);
    }

    // Grilletto
    const trigger = new THREE.Mesh(
      new THREE.TorusGeometry(0.03, 0.01, 4, 8, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true, metalness: 0.6, roughness: 0.4 })
    );
    trigger.rotation.z = Math.PI / 2;
    trigger.position.set(-0.05, -0.1, 0);
    this.shotgunModel.add(trigger);

    // Guardia grilletto
    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.008, 4, 12, Math.PI * 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, metalness: 0.4, roughness: 0.6 })
    );
    triggerGuard.rotation.z = Math.PI / 2 + 0.3;
    triggerGuard.position.set(-0.05, -0.1, 0);
    this.shotgunModel.add(triggerGuard);

    // Mirino a fibra ottica
    const sightBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true })
    );
    sightBase.position.set(0.0, 0.18, -0.1);
    this.shotgunModel.add(sightBase);

    const sightMount = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true })
    );
    sightMount.position.set(0.0, 0.24, -0.1);
    this.shotgunModel.add(sightMount);

    // Fibra ottica rossa
    const fiberOptic = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 })
    );
    fiberOptic.rotation.z = Math.PI / 2;
    fiberOptic.position.set(0.0, 0.28, -0.1);
    this.shotgunModel.add(fiberOptic);

    // Anelli fibra ottica
    const fiberRing1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true })
    );
    fiberRing1.rotation.z = Math.PI / 2;
    fiberRing1.position.set(-0.03, 0.28, -0.1);
    this.shotgunModel.add(fiberRing1);

    const fiberRing2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true })
    );
    fiberRing2.rotation.z = Math.PI / 2;
    fiberRing2.position.set(0.03, 0.28, -0.1);
    this.shotgunModel.add(fiberRing2);

    // Calcio in legno con banda nera
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.26, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true, roughness: 0.9 })
    );
    stock.position.set(0.0, -0.1, 0.4);
    this.shotgunModel.add(stock);

    // Banda nera sul calcio
    const blackBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.28, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, flatShading: true, roughness: 0.95 })
    );
    blackBand.position.set(0.0, -0.1, 0.25);
    this.shotgunModel.add(blackBand);

    // Texture calcio
    for (let i = 0; i < 4; i++) {
      const stockLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.02, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x4a372b, flatShading: true })
      );
      stockLine.position.set(0, -0.1, 0.5 + i * 0.06);
      this.shotgunModel.add(stockLine);
    }

    // Pad calcio
    const stockPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.28, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x050505, flatShading: true, roughness: 0.95 })
    );
    stockPad.position.set(0.0, -0.1, 0.7);
    this.shotgunModel.add(stockPad);

    // Neon cyan ammo counter screen mesh
    const ammoGeo = new THREE.PlaneGeometry(0.12, 0.06);
    const ammoMat = new THREE.MeshBasicMaterial({
      map: this.ammoTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const shotgunAmmoMesh = new THREE.Mesh(ammoGeo, ammoMat);
    shotgunAmmoMesh.position.set(0.0, 0.2, -0.02);
    shotgunAmmoMesh.rotation.x = -0.15;
    this.shotgunModel.add(shotgunAmmoMesh);

    this.group.add(this.shotgunModel);
  }

  private createKnifeModel(): void {
    this.knifeModel = new THREE.Group();

    // Lama più lunga e affilata
    const bladeLength = 0.55;
    const bladeWidth = 0.08;
    const bladeThickness = 0.015;

    // Lama principale
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(bladeThickness, bladeWidth, bladeLength),
      new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.95, roughness: 0.08, flatShading: true })
    );
    blade.position.set(0.06, 0.06, -0.32);
    blade.rotation.y = 0.08;
    this.knifeModel.add(blade);

    // Filo della lama (beveled edge)
    const bladeEdge = new THREE.Mesh(
      new THREE.BoxGeometry(bladeThickness * 0.6, bladeWidth * 0.3, bladeLength * 0.98),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.98, roughness: 0.05, flatShading: true })
    );
    bladeEdge.position.set(0.06 - bladeThickness * 0.25, 0.06 - bladeWidth * 0.35, -0.32);
    bladeEdge.rotation.y = 0.08;
    this.knifeModel.add(bladeEdge);

    // Punta della lama affilata
    const bladeTip = new THREE.Mesh(
      new THREE.ConeGeometry(bladeWidth * 0.5, 0.08, 4),
      new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.95, roughness: 0.08, flatShading: true })
    );
    bladeTip.rotation.x = Math.PI / 2;
    bladeTip.position.set(0.06, 0.06, -0.6);
    bladeTip.rotation.y = 0.08;
    this.knifeModel.add(bladeTip);

    // Riflessi metallici sulla lama
    const bladeReflection1 = new THREE.Mesh(
      new THREE.BoxGeometry(bladeThickness * 1.1, bladeWidth * 0.15, bladeLength * 0.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
    );
    bladeReflection1.position.set(0.06, 0.06 + bladeWidth * 0.2, -0.25);
    bladeReflection1.rotation.y = 0.08;
    this.knifeModel.add(bladeReflection1);

    const bladeReflection2 = new THREE.Mesh(
      new THREE.BoxGeometry(bladeThickness * 1.1, bladeWidth * 0.08, bladeLength * 0.25),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    );
    bladeReflection2.position.set(0.06, 0.06 - bladeWidth * 0.1, -0.45);
    bladeReflection2.rotation.y = 0.08;
    this.knifeModel.add(bladeReflection2);

    // Guardia protettiva
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.18, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true, metalness: 0.7, roughness: 0.4 })
    );
    guard.position.set(0.04, 0.06, -0.05);
    guard.rotation.y = 0.08;
    this.knifeModel.add(guard);

    // Dettaglio guardia
    const guardDetail = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.16, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true, metalness: 0.6, roughness: 0.5 })
    );
    guardDetail.position.set(0.04, 0.06, -0.05);
    guardDetail.rotation.y = 0.08;
    this.knifeModel.add(guardDetail);

    // Impugnatura ergonomica
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true, roughness: 0.9 })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.03, 0.04, 0.08);
    this.knifeModel.add(handle);

    // Texture impugnatura (grip pattern)
    for (let i = 0; i < 6; i++) {
      const gripRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.051, 0.051, 0.015, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true, roughness: 0.95 })
      );
      gripRing.rotation.x = Math.PI / 2;
      gripRing.position.set(0.03, 0.04, 0.0 + i * 0.03);
      this.knifeModel.add(gripRing);
    }

    // Pomolo impugnatura
    const pommel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true, metalness: 0.7, roughness: 0.4 })
    );
    pommel.rotation.x = Math.PI / 2;
    pommel.position.set(0.03, 0.04, 0.2);
    this.knifeModel.add(pommel);

    // Vite pomolo
    const pommelScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.02, 6),
      new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true, metalness: 0.8, roughness: 0.3 })
    );
    pommelScrew.rotation.x = Math.PI / 2;
    pommelScrew.position.set(0.03, 0.04, 0.23);
    this.knifeModel.add(pommelScrew);

    this.createFlamethrowerModel();
    this.group.add(this.knifeModel);
  }

  private createFlamethrowerModel(): void {
    this.flamethrowerModel = new THREE.Group();

    // Body chassis
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.28, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true, metalness: 0.4, roughness: 0.6 })
    );
    this.flamethrowerModel.add(body);

    // Dual Fuel Tanks
    const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12);
    tankGeo.rotateX(Math.PI / 2);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xFF3D00, emissive: 0xDD2C00, emissiveIntensity: 0.3, metalness: 0.6 });

    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(-0.16, 0.18, 0.1);
    this.flamethrowerModel.add(tank1);

    const tank2 = new THREE.Mesh(tankGeo, tankMat);
    tank2.position.set(0.16, 0.18, 0.1);
    this.flamethrowerModel.add(tank2);

    // Nozzle Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x37474F, metalness: 0.8, roughness: 0.3 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, -0.02, -0.6);
    this.flamethrowerModel.add(barrel);

    // Pilot Flame Light
    const pilotLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xFFAB00 })
    );
    pilotLight.position.set(0, -0.02, -0.92);
    this.flamethrowerModel.add(pilotLight);

    this.group.add(this.flamethrowerModel);
  }

  setWeapon(type: 'rifle' | 'shotgun' | 'flamethrower' | 'melee'): void {
    this.activeType = type;
    this.rifleModel.visible = (type === 'rifle');
    this.shotgunModel.visible = (type === 'shotgun');
    this.flamethrowerModel.visible = (type === 'flamethrower');
    this.knifeModel.visible = (type === 'melee');

    if (type === 'melee') {
      this.group.position.set(0.28, -0.48, -0.75);
      this.group.rotation.set(0.4, 0.1, -0.2);
    } else if (type === 'shotgun') {
      this.group.position.set(0.35, -0.44, -0.85);
      this.group.rotation.set(-0.06, 0.24, -0.04);
      this.muzzleFlash.position.set(0.44, 0.04, -0.41);
    } else if (type === 'flamethrower') {
      this.group.position.set(0.34, -0.42, -0.85);
      this.group.rotation.set(-0.05, 0.22, -0.03);
      this.muzzleFlash.position.set(0.34, -0.02, -0.92);
    } else {
      this.group.position.set(0.38, -0.42, -0.95);
      this.group.rotation.set(-0.08, 0.28, -0.05);
      this.muzzleFlash.position.set(0.42, 0.02, -0.44);
    }
  }

  fire(particlePool?: ParticlePool): void {
    if (this.activeType === 'melee') {
      this.recoil = 1.5;
    } else {
      this.flashRemaining = 0.06;
      this.recoil = 1.0;
      this.muzzleFlash.visible = true;
      this.glowMaterial.opacity = 1;

      // Spawn physical brass shell ejection
      if (particlePool && this.camera) {
        const origin = new THREE.Vector3();
        this.camera.getWorldPosition(origin);

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

        const offsetX = this.activeType === 'shotgun' ? 0.35 : 0.38;
        const offsetY = this.activeType === 'shotgun' ? -0.44 : -0.42;
        const offsetZ = this.activeType === 'shotgun' ? -0.5 : -0.6;

        // Spawn position in world coordinates
        const shellPos = origin.clone()
          .addScaledVector(right, offsetX)
          .addScaledVector(up, offsetY)
          .addScaledVector(forward, -offsetZ);

        // Eject to the right and slightly up and back
        const shellVel = right.clone().multiplyScalar(1.5 + Math.random() * 0.8)
          .addScaledVector(up, 1.0 + Math.random() * 0.8)
          .addScaledVector(forward, -0.4 - Math.random() * 0.4);

        particlePool.spawn('shell', shellPos, shellVel, 3.0);
      }
    }
  }

  update(delta: number): void {
    if (this.activeType === 'melee') {
      this.recoil = Math.max(0, this.recoil - delta * 12);
      this.group.position.set(
        0.28,
        -0.48 + this.recoil * 0.1,
        -0.75 - this.recoil * 0.2
      );
      this.group.rotation.set(
        0.4 + this.recoil * 0.2,
        0.1 - this.recoil * 0.1,
        -0.2
      );
    } else {
      this.recoil = Math.max(0, this.recoil - delta * 18);
      const basePos = this.activeType === 'shotgun' ? [0.35, -0.44, -0.85] : [0.38, -0.42, -0.95];
      const baseRotX = this.activeType === 'shotgun' ? -0.06 : -0.08;
      const baseRotY = this.activeType === 'shotgun' ? 0.24 : 0.28;
      const baseRotZ = this.activeType === 'shotgun' ? -0.04 : -0.05;

      this.group.position.set(
        basePos[0],
        basePos[1] - this.recoil * 0.02,
        basePos[2] + this.recoil * (this.activeType === 'shotgun' ? 0.14 : 0.08)
      );

      // Pitch rotation kicks decay via linear interpolation (this.recoil)
      const pitchKick = this.activeType === 'shotgun' ? 0.22 : 0.14;
      this.group.rotation.set(
        baseRotX + this.recoil * pitchKick,
        baseRotY,
        baseRotZ - this.recoil * 0.02
      );

      if (this.flashRemaining > 0) {
        this.flashRemaining -= delta;
        this.glowMaterial.opacity = Math.max(0, this.flashRemaining / 0.06);
        if (this.flashRemaining <= 0) {
          this.muzzleFlash.visible = false;
        }
      }
    }
  }

  isFlashVisible(): boolean {
    return this.muzzleFlash.visible;
  }

  updateAmmo(ammo: number): void {
    if (this.lastDrawnAmmo === ammo) return;
    this.lastDrawnAmmo = ammo;

    const ctx = this.ammoContext;
    if (!ctx) return;
    const canvas = this.ammoCanvas;

    // Background
    ctx.fillStyle = 'rgba(10, 15, 20, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Neon cyan border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Neon cyan text
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(ammo), canvas.width / 2, canvas.height / 2);

    this.ammoTexture.needsUpdate = true;
  }
}
