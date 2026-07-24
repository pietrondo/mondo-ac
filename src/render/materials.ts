import * as THREE from 'three';

export function createTerrainMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    metalness: 0.1,
    roughness: 0.85,
    vertexColors: true,
    flatShading: true,
    side: THREE.FrontSide
  });
}

export function createFresnelMaterial(params: { color?: number | string, emissive?: number | string, emissiveIntensity?: number, fresnelColor?: number | string, fresnelPower?: number, fresnelIntensity?: number } = {}): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: params.color !== undefined ? params.color : 0x444444,
    emissive: params.emissive !== undefined ? params.emissive : 0x000000,
    emissiveIntensity: params.emissiveIntensity !== undefined ? params.emissiveIntensity : 1.0,
    roughness: 0.7,
    metalness: 0.3
  });

  const customUniforms = {
    uFresnelColor: { value: new THREE.Color(params.fresnelColor !== undefined ? params.fresnelColor : (params.emissive || 0x00ffff)) },
    uFresnelPower: { value: params.fresnelPower !== undefined ? params.fresnelPower : 3.0 },
    uFresnelIntensity: { value: params.fresnelIntensity !== undefined ? params.fresnelIntensity : 2.0 }
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFresnelColor = customUniforms.uFresnelColor;
    shader.uniforms.uFresnelPower = customUniforms.uFresnelPower;
    shader.uniforms.uFresnelIntensity = customUniforms.uFresnelIntensity;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform vec3 uFresnelColor;
      uniform float uFresnelPower;
      uniform float uFresnelIntensity;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      vec3 V = normalize(cameraPosition - vWorldPosition);
      vec3 N = normalize(vWorldNormal);
      float fresnelTerm = dot(N, V);
      fresnelTerm = clamp(1.0 - fresnelTerm, 0.0, 1.0);
      fresnelTerm = pow(fresnelTerm, uFresnelPower);
      totalEmissiveRadiance += uFresnelColor * fresnelTerm * uFresnelIntensity;`
    );
  };
  return material;
}
