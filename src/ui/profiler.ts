import * as THREE from 'three';

export class PerformanceProfiler {
  private overlay: HTMLDivElement | null = null;
  private isVisible = false;
  private frameTimeBuffer: number[] = [];
  private lastTime = performance.now();
  private frameCount = 0;
  private currentFps = 60;
  private currentFrameTime = 16.6;

  private latestStats = {
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    lines: 0,
    points: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    entitiesCount: 0,
    particlesCount: 0,
    jsHeapUsedMB: 0,
    jsHeapTotalMB: 0,
    gpuRenderer: 'Standard WebGL GPU',
  };

  constructor() {
    this.createOverlay();
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'l') {
        this.toggle();
      }
    });
  }

  private createOverlay(): void {
    if (typeof document === 'undefined') return;
    this.overlay = document.createElement('div');
    this.overlay.id = 'profiler-log-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 550px;
      max-width: 90vw;
      background: rgba(10, 15, 25, 0.95);
      border: 2px solid #00E5FF;
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.4);
      border-radius: 12px;
      padding: 20px;
      color: #E0F7FA;
      font-family: monospace;
      font-size: 13px;
      z-index: 10000;
      display: none;
      user-select: text;
    `;
    this.overlay.innerHTML = `
      <div style="display:flex; justify-between; align-items:center; border-bottom: 1px solid #00E5FF; padding-bottom: 10px; margin-bottom: 15px;">
        <span style="font-weight:bold; font-size:16px; color:#00E5FF;">📊 DIAGNOSTICA PRESTAZIONI (TASTO L)</span>
        <button id="close-profiler-btn" style="background:#FF1744; border:none; color:white; padding:4px 10px; border-radius:4px; cursor:pointer;">X</button>
      </div>
      <div id="profiler-stats-content">Caricamento log...</div>
      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button id="copy-log-btn" style="flex:1; background:#00E5FF; border:none; color:#0A0F19; font-weight:bold; padding:8px; border-radius:6px; cursor:pointer;">📋 COPIA LOG NEGLI APPUNTI</button>
      </div>
    `;
    document.body.appendChild(this.overlay);

    const closeBtn = this.overlay.querySelector('#close-profiler-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const copyBtn = this.overlay.querySelector('#copy-log-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = this.generateLogText();
        navigator.clipboard.writeText(text).then(() => {
          alert('Log prestazionale copiato negli appunti! Invialo per la diagnosi.');
        });
      });
    }
  }

  toggle(): void {
    if (this.isVisible) this.hide();
    else this.show();
  }

  show(): void {
    this.isVisible = true;
    if (this.overlay) {
      this.overlay.style.display = 'block';
      this.renderContent();
    }
  }

  hide(): void {
    this.isVisible = false;
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  private getGpuInfo(renderer: THREE.WebGLRenderer): string {
    try {
      const gl = renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown GPU';
      }
    } catch (e) {}
    return 'Standard WebGL GPU';
  }

  private hitchLogs: Array<{
    time: string;
    fps: number;
    frameMs: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    monsters: number;
    particles: number;
    heapMB: number;
  }> = [];

  private lastHitchRecordTime = 0;

  update(renderer: THREE.WebGLRenderer, monstersCount: number, particlesCount: number): void {
    const now = performance.now();
    const deltaMs = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    this.frameTimeBuffer.push(deltaMs);
    if (this.frameTimeBuffer.length > 60) this.frameTimeBuffer.shift();

    if (this.frameCount >= 15) {
      const avgMs = this.frameTimeBuffer.reduce((a, b) => a + b, 0) / this.frameTimeBuffer.length;
      this.currentFrameTime = Math.round(avgMs * 10) / 10;
      this.currentFps = Math.round(1000 / (avgMs || 1));
      this.frameCount = 0;
    }

    const mem = (performance as any).memory;
    const heapMB = mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0;

    // Detect frame hitch (frame time > 28ms = < 35 FPS)
    if (deltaMs > 28 && now - this.lastHitchRecordTime > 2000) {
      this.lastHitchRecordTime = now;
      const hitchFps = Math.round(1000 / deltaMs);
      const timeStr = new Date().toLocaleTimeString();
      this.hitchLogs.push({
        time: timeStr,
        fps: hitchFps,
        frameMs: Math.round(deltaMs * 10) / 10,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        monsters: monstersCount,
        particles: particlesCount,
        heapMB
      });
      if (this.hitchLogs.length > 10) this.hitchLogs.shift();
    }

    this.latestStats = {
      fps: this.currentFps,
      frameTimeMs: this.currentFrameTime,
      drawCalls: renderer.info.render.calls,
      lines: renderer.info.render.lines,
      points: renderer.info.render.points,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      entitiesCount: monstersCount,
      particlesCount: particlesCount,
      jsHeapUsedMB: heapMB,
      jsHeapTotalMB: mem ? Math.round(mem.totalJSHeapSize / 1048576) : 0,
      gpuRenderer: this.getGpuInfo(renderer),
    };

    if (this.isVisible) {
      this.renderContent();
    }
  }

  private renderContent(): void {
    const content = this.overlay?.querySelector('#profiler-stats-content');
    if (content) {
      const hitchesHtml = this.hitchLogs.length === 0
        ? '<div style="color:#00E676; font-size:11px;">Nessun calo improviso registrato finora.</div>'
        : this.hitchLogs.slice(-4).map(h =>
            `<div style="font-size:11px; color:#FF5252;">[${h.time}] ${h.fps} FPS (${h.frameMs}ms) | Calls: ${h.drawCalls} | Triangles: ${h.triangles} | Geoms: ${h.geometries} | Monsters: ${h.monsters} | Heap: ${h.heapMB}MB</div>`
          ).join('');

      content.innerHTML = `
        <div style="line-height: 1.8;">
          <div>⚡ <b>FPS:</b> <span style="color:${this.latestStats.fps < 30 ? '#FF1744' : '#00E676'}">${this.latestStats.fps} FPS</span> (${this.latestStats.frameTimeMs} ms/frame)</div>
          <div>🎮 <b>GPU:</b> ${this.latestStats.gpuRenderer}</div>
          <div>🖌️ <b>Draw Calls (Chiamate GPU):</b> ${this.latestStats.drawCalls}</div>
          <div>🔺 <b>Triangoli / Poligoni:</b> ${this.latestStats.triangles.toLocaleString()}</div>
          <div>📏 <b>Linee / Punti WebGL:</b> ${this.latestStats.lines} linee | ${this.latestStats.points} punti</div>
          <div>📐 <b>Geometrie in VRAM:</b> ${this.latestStats.geometries}</div>
          <div>🖼️ <b>Texture in VRAM:</b> ${this.latestStats.textures}</div>
          <div>💾 <b>Memoria JS Heap:</b> ${this.latestStats.jsHeapUsedMB > 0 ? `${this.latestStats.jsHeapUsedMB} MB / ${this.latestStats.jsHeapTotalMB} MB` : 'N/A'}</div>
          <div>👾 <b>Nemici Attivi:</b> ${this.latestStats.entitiesCount}</div>
          <div>✨ <b>Particelle Meteo/Combattimento:</b> ${this.latestStats.particlesCount}</div>
          <div style="margin-top:12px; border-top: 1px dashed rgba(0,229,255,0.4); padding-top: 8px;">
            <b style="color:#FFD700;">⏱️ STORICO CALI E SCATTI (&lt; 35 FPS):</b>
            ${hitchesHtml}
          </div>
        </div>
      `;
    }
  }

  private generateLogText(): string {
    const hitchText = this.hitchLogs.length === 0
      ? 'No frame hitches detected'
      : this.hitchLogs.map(h => `  [${h.time}] ${h.fps} FPS (${h.frameMs}ms) | Calls: ${h.drawCalls} | Triangles: ${h.triangles} | Geoms: ${h.geometries} | Monsters: ${h.monsters} | Heap: ${h.heapMB}MB`).join('\n');

    return `=== MONDO 3D PERFORMANCE LOG ===
Data/Ora: ${new Date().toISOString()}
Screen Resolution: ${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio})
GPU: ${this.latestStats.gpuRenderer}
FPS: ${this.latestStats.fps} (${this.latestStats.frameTimeMs} ms)
WebGL Draw Calls: ${this.latestStats.drawCalls}
WebGL Triangles: ${this.latestStats.triangles}
WebGL Lines: ${this.latestStats.lines}
WebGL Points: ${this.latestStats.points}
VRAM Geometries: ${this.latestStats.geometries}
VRAM Textures: ${this.latestStats.textures}
JS Heap Memory: ${this.latestStats.jsHeapUsedMB > 0 ? `${this.latestStats.jsHeapUsedMB}MB / ${this.latestStats.jsHeapTotalMB}MB` : 'N/A'}
Monsters: ${this.latestStats.entitiesCount}
Particles: ${this.latestStats.particlesCount}

--- HISTORICAL FRAME HITCHES (< 35 FPS) ---
${hitchText}
================================`;
  }
}
