# Delta Specification: Rendering Shadows

## Base Specification
This delta specification modifies and extends [rendering-shadows/spec.md](file:///C:/Users/pietr/progetti/mondo/openspec/specs/rendering-shadows/spec.md).

## Baseline Summary
The baseline specification defines the directional light setup, shadow camera following loop, layer-based shadows for first-person meshes, and entity shadow configuration (terrain, existing structures, monsters, decorations).

## Modifications & Additions
We extend the entity shadow configurations to explicitly include the new Pyramid and Lighthouse structures.

### Requirements

Requirement 4 is modified to:

4. **Entity Shadow Configuration**:
   - The terrain mesh MUST be set to receive shadows (`receiveShadow = true`).
   - All structure meshes (including existing structures and the new `Pyramid` and `Lighthouse` structures) MUST traverse their children and set `castShadow = true` and `receiveShadow = true`.
   - All monster meshes (including the new `golem` variant) MUST set `castShadow = true` and `receiveShadow = true`.
   - Decoration meshes or InstancedMeshes MUST set `castShadow = true` and `receiveShadow = true`.

### Scenarios

Scenario 3 is modified or extended to:

#### Scenario 4: New structures (Pyramid and Lighthouse) cast and receive shadows
* **Given** a Pyramid or Lighthouse structure is loaded into the scene
* **When** shadows are rendered
* **Then** `castShadow` and `receiveShadow` MUST be set to true on all their child meshes
