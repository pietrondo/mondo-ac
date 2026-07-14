# Delta Specification: Player Movement

## Base Specification
This delta specification modifies and extends [player-movement/spec.md](file:///C:/Users/pietr/progetti/mondo/openspec/specs/player-movement/spec.md).

## Baseline Summary
The baseline specification defines the AABB collision check, minimum penetration resolution, sliding physics, and iterative resolution for player movement against solid structure colliders.

## Modifications & Additions
We extend the player movement/controls capability to support proper state clearing during death/respawn cycles, dual-key binding for triggering player respawn, and automatic restoration of pointer lock.

### Requirements

Add the following requirements:

5. **Input State Reset**:
   - The input system MUST provide a reset capability that clears all boolean keystates (e.g. forward, backward, left, right, jump, interact, reload, run, attack) and mouse states.
   - The input state MUST be reset immediately when the player dies.
   - The input state MUST be reset immediately when the player respawns.
6. **Respawn Cycle & Pointer Lock**:
   - The player respawn action MUST be triggered by either the interact key (KeyE) or the reload key (KeyR) when the player is in a deceased state.
   - When the player respawns, the system MUST automatically request a pointer lock on the canvas/document body to restore cursor locking.

### Scenarios

Add the following scenarios:

#### Scenario 3: Keyboard inputs reset upon death and respawn
* **Given** a player is moving with the forward key pressed (keystate forward is true)
* **When** the player dies
* **Then** the input system MUST reset, clearing the forward keystate (and all other keystates) to false
* **And** if a key is pressed during the respawn phase, it MUST also be cleared when the respawn sequence completes

#### Scenario 4: Player respawns using dual keys and locks cursor
* **Given** a player is in a dead state with cursor unlocked
* **When** the player presses the KeyR (reload) or KeyE (interact) key
* **Then** the player respawn cycle MUST trigger
* **And** the system MUST request pointer lock on the document body/canvas
