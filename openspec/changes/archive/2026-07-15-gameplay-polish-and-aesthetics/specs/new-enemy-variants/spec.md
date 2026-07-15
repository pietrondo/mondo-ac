# Delta Specification: New Enemy Variants

## Base Specification
This delta specification modifies [new-enemy-variants/spec.md](file:///C:/Users/pietr/progetti/mondo/openspec/specs/new-enemy-variants/spec.md).

## Baseline Summary
Defines crawler and drone profiles.

## Modifications & Additions
We add billboard health bars and visual upgrades.

### Requirements
Add the following requirements:
3. **Visuals & Bars**: Crawler/drone meshes MUST support visual detail accessories and manage billboard health bars.

### Scenarios
Add the following scenarios:
#### Scenario 3: Health bar rendering
* **Given** drone monster is hit
* **When** updating
* **Then** it renders a billboard health bar
