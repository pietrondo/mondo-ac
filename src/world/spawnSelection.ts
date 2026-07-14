import * as THREE from 'three';

export function selectMonsterSpawns(
  candidates: THREE.Vector3[],
  anchor: THREE.Vector3,
  limit: number,
  maxDistance = 240
): THREE.Vector3[] {
  const sorted = [...candidates].sort(
    (a, b) => a.distanceToSquared(anchor) - b.distanceToSquared(anchor)
  );

  const selected = sorted.slice(0, limit).map((position) => position.clone());
  const nearestDistance = selected[0]?.distanceTo(anchor) ?? Number.POSITIVE_INFINITY;

  if (selected.length > 0 && nearestDistance <= maxDistance) {
    return selected;
  }

  const fallbackCount = Math.max(4, Math.min(limit, 6));
  const radius = 24;
  const fallback: THREE.Vector3[] = [];

  for (let i = 0; i < fallbackCount; i++) {
    const angle = (i / fallbackCount) * Math.PI * 2;
    fallback.push(
      new THREE.Vector3(
        anchor.x + Math.cos(angle) * radius,
        anchor.y,
        anchor.z + Math.sin(angle) * radius
      )
    );
  }

  return fallback;
}
