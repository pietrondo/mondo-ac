import * as THREE from 'three';
import { WORLD_SIZE, WORLD_SCALE, WATER_LEVEL } from '../config';

export function createWater(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE * WORLD_SCALE * 1.5,
    WORLD_SIZE * WORLD_SCALE * 1.5,
    64,
    64
  );
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0x4A90D9,
    transparent: true,
    opacity: 0.75,
    metalness: 0.3,
    roughness: 0.1,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.time = { value: 0 };
    shader.uniforms.waveAmplitude = { value: 0.3 };
    shader.uniforms.waveSpeed = { value: 0.8 };
    shader.uniforms.waveFrequency = { value: 0.02 };

    shader.vertexShader = `
      uniform float time;
      uniform float waveAmplitude;
      uniform float waveSpeed;
      uniform float waveFrequency;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vUv = uv;
      
      float wave1 = sin(position.x * waveFrequency + time * waveSpeed) * waveAmplitude;
      float wave2 = sin(position.z * waveFrequency * 0.7 + time * waveSpeed * 1.2) * waveAmplitude * 0.6;
      float wave3 = sin((position.x + position.z) * waveFrequency * 0.5 + time * waveSpeed * 0.8) * waveAmplitude * 0.4;
      
      float height = wave1 + wave2 + wave3;
      
      #include <begin_vertex>
      transformed.y += height;
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      float fresnel = pow(1.0 - abs(dot(normalize(vWorldPosition - cameraPosition), vec3(0.0, 1.0, 0.0))), 2.0);
      vec3 deepColor = vec3(0.1, 0.25, 0.4);
      vec3 surfaceColor = vec3(0.3, 0.5, 0.7);
      vec3 colorMix = mix(deepColor, surfaceColor, fresnel * 0.5 + 0.5);
      
      float sparkle = sin(vUv.x * 50.0 + time * 2.0) * sin(vUv.y * 50.0 + time * 1.5) * 0.1;
      sparkle = max(0.0, sparkle);
      
      gl_FragColor.rgb = mix(gl_FragColor.rgb, colorMix, 0.3) + vec3(sparkle);
      
      #include <dithering_fragment>
      `
    );

    (material as any)._waterUniforms = shader.uniforms;
  };

  const water = new THREE.Mesh(geometry, material);
  water.position.y = WATER_LEVEL;
  water.receiveShadow = true;

  return water;
}

export function updateWater(water: THREE.Mesh, time: number): void {
  const material = water.material as THREE.MeshStandardMaterial;
  if ((material as any)._waterUniforms) {
    (material as any)._waterUniforms.time.value = time;
  }
}
