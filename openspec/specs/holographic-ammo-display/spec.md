# Specification: Holographic Ammo Display

## Description
Defines requirements for the holographic ammo display attached to weapon models.

## Requirements
1. **Attachment**:
   - The display MUST be a 3D plane mesh attached to the weapon group.
   - It MUST float slightly (e.g. 0.02 units) above the model to prevent clipping.
2. **Display**:
   - The texture MUST be a CanvasTexture showing active magazine and reserve ammo.
   - The canvas MUST render text in a neon color on a dark/transparent background.
   - Texture updates MUST trigger only when active ammo counts change.

## Scenarios
### Scenario 1: Initializing weapon
* **Given** a player weapon is spawned
* **Then** a floating plane mesh with the CanvasTexture is attached to the weapon group

### Scenario 2: Firing updates display
* **Given** a player fires a weapon and ammo count decreases
* **Then** the canvas texture updates with the new ammo count
