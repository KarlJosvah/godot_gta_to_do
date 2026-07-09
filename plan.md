# Open-World Sandbox Project: Development Roadmap

## Phase 1: Core Player Framework & Driving
Focus entirely on the "Enter/Exit" vehicle loop and basic player movement.

*   **Step 1.1: On-Foot Controller**
	*   Create a basic character controller with standard inputs (Walk, Run, Look).
	*   Use a simple placeholder primitive (like a capsule mesh) for the player.
*   **Step 1.2: Basic Car Physics**
	*   Implement a drivable vehicle using standard physics components.
	*   Configure acceleration, braking, turning, and realistic suspension weight.
*   **Step 1.3: Vehicle Interaction System**
	*   Create an interaction zone (trigger volume) around the driver's side door.
	*   Implement switch logic: When the interaction key is pressed near a car, disable the On-Foot script, hide/parent the player mesh inside the vehicle, and enable the Car Driving script.
	*   Ensure exiting reverses this process and places the player safely next to the vehicle.

---

## Phase 2: Combat & Environment Physics
Introduce basic physical destruction, weapon mechanics, and economy loops.

*   **Step 2.1: Melee Combat**
	*   Set up basic collision checks or animations for punch and kick attacks.
	*   Give entities a basic health script to register damage from these attacks.
*   **Step 2.2: Gunplay Fundamentals**
	*   Implement a raycast (hitscan) or fast-moving projectile system for firing weapons.
	*   Add variables for ammo count, reloading, and a basic crosshair UI.
*   **Step 2.3: Destructible Environment Props**
	*   Place street props (lamp posts, trash cans, barriers) with active physics rigidbodies.
	*   Allow them to react physically when hit by a car, or swap to a "broken" mesh variant when their health reaches zero.
*   **Step 2.4: Gun Shop System**
	*   Set up a simple trigger zone or UI menu where player currency can be exchanged to increment ammo counters or buy weapons.

---

## Phase 3: Ambient NPC Life & Traffic
Populate the sandbox with autonomous entities and parked vehicles.

*   **Step 3.1: Wandering Pedestrians**
	*   Create an NPC controller that randomly selects coordinates along sidewalk paths and navigates to them.
	*   Ensure NPCs have physical collision boxes so they can be knocked over or ragdolled when struck by a vehicle.
*   **Step 3.2: Ambient Traffic & Parked Cars**
	*   Implement simple path-following logic for NPC cars to drive along designated road tracks.
	*   Create a spawner script that randomly places stationary, empty vehicles along sidewalks and parking zones at startup.
*   **Step 3.3: Grand Theft Auto (Car Jacking)**
	*   Expand the vehicle entry logic from Step 1.3: If an NPC is currently in the driver's seat, interrupt their driving state, eject them from the vehicle, and hand control over to the player.

---

## Phase 4: Reactive AI & Chaos
Tie the combat, vehicles, and NPCs together to form a dynamic, systemic world.

*   **Step 4.1: Aggression & Combat AI**
	*   Assign a random profile variable to NPCs upon spawning (e.g., *70% Coward, 30% Fighter*).
	*   If assaulted or car-jacked, "Fighter" NPCs should play an attack animation or pull a random weapon from their inventory to fight back.
*   **Step 4.2: Environmental Panic State**
	*   Create a perception radius around the player when a gun is fired.
	*   Send a panic event to all nearby wandering NPCs, switching their state from "Wander" to "Panic Sprint" away from the gunshot coordinates.