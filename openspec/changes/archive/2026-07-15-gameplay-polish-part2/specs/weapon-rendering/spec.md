# Delta Specification: Weapon Rendering

## Base Specification
This delta specification modifies [weapon-rendering/spec.md](file:///C:/Users/pietr/progetti/mondo/openspec/specs/weapon-rendering/spec.md).

## Baseline Summary
The baseline capability handles rendering and basic positioning of first-person weapon meshes.

## Modifications & Additions
We extend weapon rendering to support dynamic CanvasTexture attachments.

### Requirements
Add the following requirement:
1. **Holographic Mount**:
   - Weapon rendering MUST support attaching a dynamic CanvasTexture display plane to the weapon group.

### Scenarios
Add the following scenario:
#### Scenario: Attaching ammo display
* **Given** a weapon model is initialized
* **Then** a sub-mesh displaying the canvas texture is attached to the weapon group
