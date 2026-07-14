import * as THREE from 'three';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();

  // Fog for distance fading
  scene.fog = new THREE.Fog(0x87CEEB, 200, 800);
  scene.background = new THREE.Color(0x87CEEB);

  // Ambient
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Hemispheric
  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x555555, 0.3);
  scene.add(hemiLight);

  // Directional sun
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(100, 200, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  return scene;
}
