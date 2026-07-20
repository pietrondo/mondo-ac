import * as THREE from 'three';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();

  // Exponential fog for realistic atmospheric depth
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.0022);
  scene.background = new THREE.Color(0x87CEEB);

  // Ambient Light
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  // Hemispheric Light (sky & ground gradient)
  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3E2723, 0.4);
  scene.add(hemiLight);

  // High Quality Directional Sun Light
  const sun = new THREE.DirectionalLight(0xfffaed, 1.3);
  sun.position.set(120, 220, 120);
  sun.castShadow = false;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 250;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 1.5;
  scene.add(sun);

  return scene;
}
