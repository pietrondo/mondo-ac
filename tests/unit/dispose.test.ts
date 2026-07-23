import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { disposeObject3D, markSharedMaterial } from '../../src/utils/dispose';
import { Collectible } from '../../src/entities/Collectible';
import { PowerUp } from '../../src/entities/PowerUp';
import { RemotePlayer } from '../../src/net/multiplayer';

interface MockElement {
  style: Record<string, string>;
  textContent: string;
  remove(): void;
}

function createMockElement(): MockElement {
  return {
    style: {},
    textContent: '',
    remove: () => {},
  };
}

const elementStash: MockElement[] = [];

beforeEach(() => {
  elementStash.length = 0;
  vi.stubGlobal('document', {
    createElement: () => {
      const el = createMockElement();
      elementStash.push(el);
      return el;
    },
    body: { appendChild: () => {} },
  });
});

describe('disposeObject3D', () => {
  it('disposes geometries on a single mesh', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geo, mat);
    const geoDispose = vi.spyOn(geo, 'dispose');
    const matDispose = vi.spyOn(mat, 'dispose');

    disposeObject3D(mesh);

    expect(geoDispose).toHaveBeenCalledOnce();
    expect(matDispose).toHaveBeenCalledOnce();
  });

  it('disposes geometries and materials across a hierarchy', () => {
    const root = new THREE.Group();
    const child1 = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial());
    const child2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2), new THREE.MeshBasicMaterial());
    const grandchild = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
    child2.add(grandchild);
    root.add(child1);
    root.add(child2);

    let disposedGeos = 0;
    let disposedMats = 0;
    root.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const m = c as THREE.Mesh;
        const origGeoDispose = m.geometry.dispose.bind(m.geometry);
        m.geometry.dispose = () => { disposedGeos++; origGeoDispose(); };
        const origMatDispose = (m.material as THREE.Material).dispose.bind(m.material);
        m.material.dispose = () => { disposedMats++; origMatDispose(); };
      }
    });

    disposeObject3D(root);

    expect(disposedGeos).toBe(3);
    expect(disposedMats).toBe(3);
  });

  it('keepSharedMaterials: true preserves all materials (opt-in safety)', () => {
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), mat);
    const matDispose = vi.spyOn(mat, 'dispose');

    disposeObject3D(mesh, { keepSharedMaterials: true });

    expect(matDispose).not.toHaveBeenCalled();
  });

  it('does not dispose materials marked as shared even without the flag', () => {
    const sharedMat = new THREE.MeshBasicMaterial();
    markSharedMaterial(sharedMat);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), sharedMat);
    const matDispose = vi.spyOn(sharedMat, 'dispose');

    disposeObject3D(mesh);

    expect(matDispose).not.toHaveBeenCalled();
  });

  it('handles multi-material arrays', () => {
    const mat1 = new THREE.MeshBasicMaterial();
    const mat2 = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), [mat1, mat2]);
    const spy1 = vi.spyOn(mat1, 'dispose');
    const spy2 = vi.spyOn(mat2, 'dispose');

    disposeObject3D(mesh);

    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it('skips non-mesh objects in traversal', () => {
    const light = new THREE.PointLight();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), new THREE.MeshBasicMaterial());
    const group = new THREE.Group();
    group.add(light);
    group.add(mesh);

    expect(() => disposeObject3D(group)).not.toThrow();
  });

  it('Collectible.dispose preserves static shared materials via auto-detection', () => {
    const c1 = new Collectible(new THREE.Vector3(0, 0, 0), 'coin');
    const c2 = new Collectible(new THREE.Vector3(5, 0, 0), 'coin');
    const sharedMat = c1.mesh.material as THREE.Material;
    const sharedGeo = c1.mesh.geometry;
    expect(c2.mesh.material).toBe(sharedMat);
    expect(c2.mesh.geometry).toBe(sharedGeo);

    const matDispose = vi.spyOn(sharedMat, 'dispose');
    const geoDispose = vi.spyOn(sharedGeo, 'dispose');

    c1.dispose();
    expect(matDispose).not.toHaveBeenCalled();
    expect(geoDispose).not.toHaveBeenCalled();

    c2.dispose();
    expect(matDispose).not.toHaveBeenCalled();
    expect(geoDispose).not.toHaveBeenCalled();
  });

  it('PowerUp.dispose preserves static shared geometries and frees inline ones', () => {
    const p1 = new PowerUp(new THREE.Vector3(0, 0, 0), 'ammo');
    const p2 = new PowerUp(new THREE.Vector3(5, 0, 0), 'ammo');

    const inlineGeo = p1.mesh.children[1]?.geometry;
    expect(inlineGeo).toBeDefined();

    const inlineGeoDispose = vi.spyOn(inlineGeo!, 'dispose');
    p1.dispose();
    expect(inlineGeoDispose).toHaveBeenCalledOnce();

    p2.dispose();
  });

  it('RemotePlayer.destroy releases geometries and materials', () => {
    const scene = new THREE.Scene();
    const rp = new RemotePlayer('p1', 'Test', scene);
    expect(scene.children.length).toBe(1);

    const meshes = rp.mesh.children as THREE.Mesh[];
    const geos = meshes.map(m => m.geometry);
    const mats = meshes.map(m => m.material as THREE.Material);
    const geoSpies = geos.map(g => vi.spyOn(g, 'dispose'));
    const matSpies = mats.map(m => vi.spyOn(m, 'dispose'));

    rp.destroy(scene);

    geoSpies.forEach(s => expect(s).toHaveBeenCalledOnce());
    matSpies.forEach(s => expect(s).toHaveBeenCalledOnce());
    expect(scene.children.length).toBe(0);
  });
});
