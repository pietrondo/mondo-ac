# Specification: Shield Power-Up

## Description
This specification defines the visual representation, runtime state, invulnerability effect, and HUD countdown display for the Shield power-up.

## Requirements
1. **Visual Representation**:
   - The Shield power-up MUST be represented in-game by a glowing cyan/light-blue icosahedron core (color `0x00e5ff`) surrounded by a rotating wireframe torus ring (color `0x80deea`).
   - The torus ring mesh MUST rotate around the core during frame updates.
2. **Runtime State & Invulnerability**:
   - Collecting a Shield power-up MUST set the player's remaining shield time to exactly 8 seconds.
   - While the remaining shield time is greater than 0, the player's `isInvulnerable` state MUST be set to true.
   - When the player is invulnerable, all incoming damage to the player MUST be ignored/blocked.
   - The remaining shield time MUST decrement according to frame delta time, and `isInvulnerable` MUST become false once remaining shield time reaches 0 or less.
3. **HUD Countdown Display**:
   - The HUD MUST display active timed buffs, including Adrenaline (speed boost), Overclock (damage boost), and Shield.
   - The display MUST show the remaining time in seconds for each active buff in real-time.

## Scenarios

### Scenario 1: Shield activation and invulnerability
* **Given** a player has 0 seconds of remaining shield time and `isInvulnerable` is false
* **When** the player collects a Shield power-up
* **Then** the remaining shield time MUST become 8.0 seconds
* **And** the player's `isInvulnerable` state MUST immediately become true

### Scenario 2: Invulnerable player takes no damage
* **Given** a player with `isInvulnerable` set to true and health at 100
* **When** the player is hit by an attack dealing 30 damage
* **Then** the player's health MUST remain at 100
* **And** the attack damage MUST be completely ignored

### Scenario 3: Shield duration ticks down and expires
* **Given** a player with 1.0 second of remaining shield time and `isInvulnerable` set to true
* **When** a frame update occurs with delta time 1.2 seconds
* **Then** the remaining shield time MUST become 0 seconds
* **And** the player's `isInvulnerable` state MUST become false

### Scenario 4: HUD displays remaining shield duration
* **Given** a player with an active Shield power-up having 5.5 seconds remaining
* **When** the HUD updates its active buffs list
* **Then** the HUD MUST display the Shield buff with its remaining time formatted (e.g. showing "5.5s" or similar)
