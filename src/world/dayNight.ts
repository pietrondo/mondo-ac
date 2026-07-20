import * as THREE from 'three';

export type WeatherType = 'clear' | 'rain' | 'storm';

export class DayNightManager {
  private scene: THREE.Scene;
  private sun: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  timeOfDay = 12.0; // 0 to 24 (12 = Noon)
  daySpeed = 0.05;  // Hours per real second
  weather: WeatherType = 'clear';
  weatherTimer = 45.0;

  private isNightTime = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sun = scene.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
    this.hemiLight = scene.children.find(c => c instanceof THREE.HemisphereLight) as THREE.HemisphereLight;
    this.ambientLight = scene.children.find(c => c instanceof THREE.AmbientLight) as THREE.AmbientLight;
  }

  update(delta: number): void {
    // Advance time
    this.timeOfDay = (this.timeOfDay + delta * this.daySpeed) % 24;
    this.isNightTime = this.timeOfDay < 5.5 || this.timeOfDay > 19.5;

    // Weather transition
    this.weatherTimer -= delta;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 40 + Math.random() * 50;
      const roll = Math.random();
      if (roll < 0.6) this.weather = 'clear';
      else if (roll < 0.85) this.weather = 'rain';
      else this.weather = 'storm';
    }

    // Calculate Sun position (arc across sky)
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const distance = 300;
    const sunX = Math.cos(sunAngle) * distance;
    const sunY = Math.sin(sunAngle) * distance;
    const sunZ = Math.sin(sunAngle * 0.5) * 100;

    if (this.sun) {
      this.sun.position.set(sunX, Math.max(sunY, -50), sunZ);
    }

    // Sky colors
    let skyColor: THREE.Color;
    let fogColor: THREE.Color;
    let sunIntensity = 1.2;
    let ambientIntensity = 0.4;

    if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
      // Day
      const dayFactor = Math.sin(((this.timeOfDay - 6) / 12) * Math.PI);
      skyColor = new THREE.Color(0x87CEEB).lerp(new THREE.Color(0x5499C7), 1 - dayFactor);
      fogColor = skyColor.clone();
      sunIntensity = 0.5 + dayFactor * 0.9;
      ambientIntensity = 0.2 + dayFactor * 0.35;
    } else if (this.timeOfDay > 18 && this.timeOfDay <= 19.5) {
      // Sunset
      const t = (this.timeOfDay - 18) / 1.5;
      skyColor = new THREE.Color(0x87CEEB).lerp(new THREE.Color(0xFD7D36), t);
      fogColor = skyColor.clone();
      sunIntensity = (1 - t) * 0.6;
      ambientIntensity = 0.2;
    } else if (this.timeOfDay >= 4.5 && this.timeOfDay < 6) {
      // Sunrise
      const t = (this.timeOfDay - 4.5) / 1.5;
      skyColor = new THREE.Color(0x0A0D1A).lerp(new THREE.Color(0xFFB74D), t);
      fogColor = skyColor.clone();
      sunIntensity = t * 0.6;
      ambientIntensity = 0.15 + t * 0.1;
    } else {
      // Night
      skyColor = new THREE.Color(0x0B0E17);
      fogColor = new THREE.Color(0x0A0C14);
      sunIntensity = 0.05;
      ambientIntensity = 0.12;
    }

    // Weather modifications
    if (this.weather === 'rain') {
      skyColor.lerp(new THREE.Color(0x455A64), 0.5);
      fogColor.lerp(new THREE.Color(0x37474F), 0.5);
      sunIntensity *= 0.5;
      ambientIntensity *= 0.7;
    } else if (this.weather === 'storm') {
      skyColor.lerp(new THREE.Color(0x263238), 0.8);
      fogColor.lerp(new THREE.Color(0x1C252A), 0.8);
      sunIntensity *= 0.2;
      ambientIntensity *= 0.5;
    }

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(skyColor);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(fogColor);
      this.scene.fog.density = this.weather === 'storm' ? 0.005 : this.weather === 'rain' ? 0.0035 : 0.0022;
    } else if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(fogColor);
    }
    if (this.sun) {
      this.sun.intensity = sunIntensity;
    }
    if (this.ambientLight) {
      this.ambientLight.intensity = ambientIntensity;
    }
    if (this.hemiLight) {
      this.hemiLight.color.copy(skyColor);
      this.hemiLight.groundColor.setHex(this.isNightTime ? 0x111111 : 0x444444);
    }
  }

  getNightSpeedMultiplier(): number {
    return this.isNightTime ? 1.25 : 1.0;
  }

  getFormattedTime(): string {
    const hours = Math.floor(this.timeOfDay);
    const mins = Math.floor((this.timeOfDay % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  getWeatherIcon(): string {
    if (this.weather === 'rain') return '🌧️ PIOGGIA';
    if (this.weather === 'storm') return '⚡ TEMPORALE';
    return this.isNightTime ? '🌙 NOTTE' : '☀️ SOLE';
  }
}
