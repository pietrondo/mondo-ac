# Specification: Structure Generation Foundations

## Description
This specification defines the foundation extensions and AABB collider adjustments for standard world structures to prevent visual floating on sloped terrain.

## Requirements
1. **Downward Foundation Extensions**:
   - The standard structures (`House`, `Tower`, `Castle`, and `Ruin`) MUST be extended with dark slate stone foundation meshes extending downward by 4 meters to prevent visual clipping/floating on slopes.
   - **House Foundation**: MUST have a box base of size 3.1 x 4 x 3.1 centered at local `y = -2`.
   - **Tower Foundation**: MUST have a cylindrical base of radius 1.9 and height 4 centered at local `y = -2`.
   - **Castle Foundation**: MUST have a slab base of size 15 x 4 x 15 centered at local `y = -2`.
   - **Ruin Foundation**: MUST have a box base of size 3.1 x 4 x 0.6 centered at local `y = -2` directly beneath the standing wall mesh.
2. **AABB Collider Expansion**:
   - The bounding boxes (AABB colliders) for `House`, `Tower`, `Castle`, and `Ruin` structures MUST have their minimum Y boundary extended downward to `-4` meters (relative to the structure's origin) to align with the bottom of the new foundations.

## Scenarios

### Scenario 1: House structure foundation and collider bounds
* **Given** a House structure is generated
* **When** its meshes are added to the scene and its collider is constructed
* **Then** the mesh group MUST contain a dark slate stone foundation box of size 3.1 x 4 x 3.1 at `y = -2`
* **And** the minimum Y coordinate of its AABB collider MUST be exactly -4

### Scenario 2: Tower structure foundation and collider bounds
* **Given** a Tower structure is generated
* **When** its meshes are added to the scene and its collider is constructed
* **Then** the mesh group MUST contain a dark slate cylindrical foundation of radius 1.9 and height 4 at `y = -2`
* **And** the minimum Y coordinate of its AABB collider MUST be exactly -4

### Scenario 3: Castle structure foundation and collider bounds
* **Given** a Castle structure is generated
* **When** its meshes are added to the scene and its collider is constructed
* **Then** the mesh group MUST contain a dark slate foundation slab of size 15 x 4 x 15 at `y = -2`
* **And** the minimum Y coordinate of its AABB collider MUST be exactly -4

### Scenario 4: Ruin structure foundation and collider bounds
* **Given** a Ruin structure is generated
* **When** its meshes are added to the scene and its collider is constructed
* **Then** the mesh group MUST contain a dark slate foundation block of size 3.1 x 4 x 0.6 at `y = -2`
* **And** the minimum Y coordinate of its AABB collider MUST be exactly -4
