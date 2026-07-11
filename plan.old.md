# Open-World Sandbox Project: Development & Asset Roadmap

## Phase 1: Core Player Movement & Driving

Focus on basic player movement using functional prototype assets and car driving system.

*   **Step 1.1: On-Foot Controller & Prototype Rigging**
	*   *Asset Task:* Create or source a simple low-poly humanoid 3D mesh (or a basic blockout model) and assign a standard skeletal rig.
	*   *Asset Task:* Create or source a small set of basic animations: Idle, Walk, Run, and Jump. Set up the animation blending tree in your engine.
	*   *Code Task:* Implement a character controller using standard inputs (Walk, Run, Look) driven by the animation blend tree.
*   **Step 1.2: Basic Car Physics & Vehicle Modeling**
	*   *Asset Task:* Model a basic low-poly 4-door sedan. Separate the 4 wheel meshes from the main chassis mesh so they can rotate and turn independently. Ensure the pivot points for all wheels are perfectly centered.
	*   *Code Task:* Implement a drivable vehicle using standard physics. Configure engine acceleration, braking, steering angles, and suspension weight utilizing the independent wheel components.
*   **Step 1.3: Vehicle Interaction System & Entry Animations**
	*   *Asset Task:* Create two specialized character animations: "Enter Vehicle" (opening door, stepping in, sitting down) and "Exit Vehicle" (stepping out, closing door).
	*   *Code Task:* Create an interaction trigger volume around the driver's side door.
	*   *Code Task:* Implement the switch logic: When the interaction key is pressed, disable the On-Foot script, snap the player to the correct entry position, play the "Enter Vehicle" animation, parent the player mesh inside the vehicle, and finally hand control over to the Car Driving script.

---

## Phase 2: Combat & Environment Physics
Introduce physical destruction, weapon mechanics, and the economy loop alongside their visual/audio components.

*   **Step 2.1: Melee Combat & Rigged Strikes**
	*   *Asset Task:* Create or source distinct "Punch" and "Kick" animations for the player skeleton. 
	*   *Asset Task:* Create punch/kick impact sound effects and a tiny screen-shake profile.
	*   *Code Task:* Set up collision hit-boxes tied to the player's hands and feet that activate exclusively during the attack animation frames. Give entities a basic health script to register damage.
*   **Step 2.2: Gunplay, Weapon Assets, and VFX**
	*   *Asset Task:* Model a 3D Pistol asset. Ensure it contains a designated socket point at the tip of the barrel for muzzle flashes, and a separate magazine mesh if animating reloads.
	*   *Asset Task:* Create a standard gun firing animation (upper body blend), a reload animation, visual particles (Muzzle Flash, Bullet Smoke, Wall Impact Sparks), and audio assets (Gunshot, Empty Click, Reload).
	*   *Code Task:* Implement a raycast (hitscan) or projectile system for firing weapons. Link the firing logic to instantiate the muzzle flash VFX, play the audio, and trigger the recoil/reload animations. Add variables for ammo count and a basic crosshair UI.
*   **Step 2.3: Destructible Environment Props & Asset Fracturing**
	*   *Asset Task:* Model basic street props: a street lamp, a plastic trash can, and a concrete barrier.
	*   *Asset Task:* Create a "broken/destroyed" mesh variant for each prop (e.g., a crushed trash can, a broken lamp post stump). Alternatively, use a tool to fracture the original mesh into physical chunks.
	*   *Code Task:* Place these props in the world with active physics rigidbodies so they react to car collisions. Implement a script that swaps the pristine prop mesh for its "broken" variant when its health pool or physical impact threshold is breached.
*   **Step 2.4: Gun Shop System & UI Assets**
	*   *Asset Task:* Design basic 2D UI elements: weapon icons, ammo counters, a cash icon, and a clean shop menu layout.
	*   *Code Task:* Set up a simple physical trigger zone or UI menu where player currency can be exchanged to increment ammo counters or buy weapons.

---

## Phase 3: Ambient NPC Life & Traffic
Populate the sandbox with autonomous entities, varied vehicle models, and environment assets.

*   **Step 3.1: Wandering Pedestrians & Modular Outfits**
	*   *Asset Task:* Create 2-3 distinct NPC character meshes. To save time, use a modular setup (e.g., different head textures or jacket colors swapped onto the same base skeleton/rig used by the player).
	*   *Asset Task:* Create an "NPC Ragdoll" profile or a custom "Hit by Car" animation state.
	*   *Code Task:* Build an NPC AI controller that randomly selects coordinates along sidewalk nodes and navigates to them using the base walk animations. Ensure physical collision boxes trigger a ragdoll state if struck by a high-velocity vehicle.
*   **Step 3.2: Ambient Traffic & Car Variants**
	*   *Asset Task:* Model 1-2 additional vehicle types (e.g., a sports car, a pickup truck) separating their wheels and assigning unique physics properties (sports car goes faster, truck has more mass).
	*   *Code Task:* Implement simple node-based path-following logic for NPC cars to drive down designated road lanes. Create a spawner script that randomly places stationary, empty vehicles along sidewalks and parking zones at startup.
*   **Step 3.3: Grand Theft Auto (Car Jacking Animations)**
	*   *Asset Task:* Create an aggressive "Car Jacking" animation sequence: Player pulls open the door, reaches inside, and yanks the driver out. Create a corresponding "Getting Ejected" animation for the NPC.
	*   *Code Task:* Expand the vehicle entry logic from Step 1.3: If an NPC is detected in the driver's seat, snap both entities to their respective roles, play the synchronized car jacking animation sequence, break the NPC's driving AI, and hand vehicle control to the player.

---

## Phase 4: Reactive AI & Chaos
Tie combat, vehicles, and NPCs together with expressive AI feedback animations.

*   **Step 4.1: Aggression, Combat AI, & Armed NPCs**
	*   *Asset Task:* Create a simple "Aim Weapon" and "Shoot Weapon" animation loop for the NPC models.
	*   *Code Task:* Assign a random profile variable to NPCs upon spawning (e.g., *70% Coward, 30% Fighter*).
	*   *Code Task:* If assaulted or car-jacked, "Fighter" NPCs should skip flight behavior, draw a randomized weapon mesh attached to their hands, play the combat animations, and fire back at the player's coordinates.
*   **Step 4.2: Environmental Panic State & Expressions**
	*   *Asset Task:* Create a "Panic Sprint" animation (frantic running, hands flailing or covering head) and record terrified NPC screaming audio clips.
	*   *Code Task:* Create an invisible perception radius around the player when a weapon is fired.
	*   *Code Task:* Broadcast a panic event to all nearby wandering NPCs within that radius, forcing them to drop their wander state, play the panic sprint animation, play random screaming audio, and flee directly away from the gunshot coordinates.