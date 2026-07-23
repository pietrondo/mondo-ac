import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { disposeObject3D, markSharedMaterial } from '../../src/utils/dispose';

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

  it('does not dispose materials marked as shared when keepSharedMaterials is true', () => {
    const sharedMat = new THREE.MeshBasicMaterial();
    markSharedMaterial(sharedMat);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), sharedMat);
    const matDispose = vi.spyOn(sharedMat, 'dispose');
    const geoDispose = vi.spyOn(mesh.geometry, 'dispose');

    disposeObject3D(mesh, { keepSharedMaterials: true });

    expect(geoDispose).toHaveBeenCalledOnce();
    expect(matDispose).not.toHaveBeenCalled();
  });

  it('disposes materials marked as shared when keepSharedMaterials is false (default)', () => {
    const sharedMat = new THREE.MeshBasicMaterial();
    markSharedMaterial(sharedMat);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), sharedMat);
    const matDispose = vi.spyOn(sharedMat, 'dispose');

    disposeObject3D(mesh);

    expect(matDispose).toHaveBeenCalledOnce();
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
});
