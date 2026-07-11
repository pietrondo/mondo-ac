import GUI from 'lil-gui';
import { HeightMap } from '../world/heightmap';
import { BiomeMap } from '../world/biomeMap';
import { SEED } from '../config';

export class DebugOverlay {
  gui: GUI;
  private heightMap: HeightMap;
  private biomeMap: BiomeMap;

  constructor(heightMap: HeightMap, biomeMap: BiomeMap) {
    this.heightMap = heightMap;
    this.biomeMap = biomeMap;
    this.gui = new GUI({ title: 'Debug' });
    this.gui.hide();
    this.setupControls();
  }

  private setupControls(): void {
    const params = {
      seed: SEED,
      showWireframe: false,
      cameraHeight: 8,
      playerSpeed: 5,
      timeScale: 1.0,
      showStats: () => this.showStats()
    };

    this.gui.add(params, 'seed').listen();
    this.gui.add(params, 'showWireframe').onChange((v: boolean) => {
      document.dispatchEvent(new CustomEvent('debug-wireframe', { detail: v }));
    });
    this.gui.add(params, 'cameraHeight', 1, 20).onChange((v: number) => {
      document.dispatchEvent(new CustomEvent('debug-camera-height', { detail: v }));
    });
    this.gui.add(params, 'playerSpeed', 1, 20).onChange((v: number) => {
      document.dispatchEvent(new CustomEvent('debug-player-speed', { detail: v }));
    });
    this.gui.add(params, 'timeScale', 0.1, 3.0);
    this.gui.add(params, 'showStats').name('Show Stats');
  }

  private showStats(): void {
    const stats = {
      seed: SEED,
      'height range': `${this.heightMap.get(0, 0).toFixed(1)} - ${this.heightMap.get(128, 128).toFixed(1)}`,
      'biomes': 'coast, plains, forest, desert, mountain, snow',
      'biome at center': this.biomeMap.getBiome(128, 128)
    };
    console.table(stats);
    alert(JSON.stringify(stats, null, 2));
  }

  toggle(): void {
    if (this.gui._hidden) {
      this.gui.show();
    } else {
      this.gui.hide();
    }
  }
}
