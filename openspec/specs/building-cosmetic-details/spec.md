</Specification: Rotating Lighthouse Beam>
<Specification: Building Cosmetic Details>
## Description
Defines chimneys, lit windows, stone reliefs, and associated effects for buildings.

## Requirements
1. **House Chimneys & Smoke**:
   - Houses MUST feature chimney structures that spawn rising grey smoke particles.
2. **Lit Windows**:
   - Houses, towers, and castles MUST have glowing yellow window plates/panels.
3. **Stone Reliefs**:
   - Towers and castles MUST display decorative stone relief blocks.

## Scenarios
### Scenario 1: Smoke emitting from chimney
* **Given** a house structure with a chimney is loaded
* **When** the active particle loop ticks
* **Then** smoke particles MUST be spawned at the chimney's top position and rise upwards
