# Specification: Player Movement (Collision Resolution)

## Description
This specification defines the collision resolution behavior for the player against solid structure bounding boxes, replacing the radial push-out algorithm with a precise Axis-Aligned Bounding Box (AABB) minimum penetration sliding physics calculation.

## Requirements
1. **AABB Intersection Check**:
   - The player's collision volume MUST be represented as an Axis-Aligned Bounding Box (AABB) with dimensions determined by the player's radius and height.
   - The collision loop MUST check intersections between the player's AABB and all solid structure AABBs.
2. **Minimum Penetration Resolution**:
   - When an intersection with a solid structure is detected, the system MUST compute the overlap depth along the X-axis and the Z-axis.
   - The player's position MUST be adjusted by pushing the player out of the structure along the axis of minimum penetration (the axis with the smaller overlap depth).
   - The push-out direction MUST align with the relative position of the player's center to the structure's center on that axis.
3. **Sliding Physics**:
   - When the player is resolved along one axis, their velocity along that axis SHOULD be set to zero, allowing the remaining velocity along the perpendicular axis to cause the player to slide smoothly along the structure's face.
4. **Iterative Resolution**:
   - The collision resolution loop MUST update the player's AABB position immediately after resolving each collision so that subsequent collision checks in the same frame use the corrected position.
   - The loop MUST check all active structure colliders in a frame rather than breaking after the first detected collision.

## Scenarios

### Scenario 1: Player collides with a wall face and slides
* **Given** a structure with bounding box `box` centered at (0, 0, 0) extending from (-5, -5, -5) to (5, 5, 5)
* **When** the player moves to cross the positive X boundary (e.g. at position (5.2, 0, 0) with radius 0.5, resulting in player X-bounds [4.7, 5.7] and Z-bounds [-0.5, 0.5])
* **Then** the overlap on the X-axis is 0.3 (5.0 - 4.7) and the overlap on the Z-axis is 1.0 (0.5 - (-0.5))
* **And** since the X overlap (0.3) is less than the Z overlap (1.0), the player MUST be pushed out along the X-axis
* **And** the resolved X position of the player MUST be exactly 5.5
* **And** the player's Z movement MUST remain unaffected, allowing smooth sliding along the Z-axis

### Scenario 2: Player resolves multiple colliders iteratively
* **Given** two nearby solid structures
* **When** the player's movement in a single frame intersects both structures
* **Then** the collision loop MUST resolve the first intersection, update the player's position and bounding box, and then check and resolve the second intersection from the updated position
* **And** the player MUST NOT teleport to arbitrary coordinates or get stuck
