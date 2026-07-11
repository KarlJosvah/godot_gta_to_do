# Open-World Sandbox Project: Comprehensive Architecture & Asset Roadmap

## Phase 1: On-Foot Character Controller & Basic Rigging
Establish the player’s foundation, basic movements, and baseline humanoid mesh structures.

* **Step 1.1: Humanoid Model & Skeleton Setup**
    * *Asset Task:* Model or source a low-poly character prototype mesh (e.g., a simple blocky layout to easily see body orientation).
    * *Asset Task:* Generate a clean skeletal hierarchy (Rig) containing core human joints (Hips, Spine, Shoulders, Elbows, Wrists, Neck, Head, Thighs, Knees, Ankles).
    * *Asset Task:* Perform skin weight painting to make sure the mesh deforms smoothly without tearing at the joints when moving.
* **Step 1.2: Core Locomotion Animations**
    * *Asset Task:* Author or download separate, loopable keyframe animations: An absolute idle stance, a forward walk loop, a forward run loop, and a distinct jump loop (ideally split into jump-start, mid-air loop, and landing states).
    * *Asset Task:* Establish an Engine Animator Controller utilizing a 1D or 2D Blend Tree that smoothly transitions between Idle, Walk, and Run based on a single velocity variable.
* **Step 1.3: Input Parsing & Locomotion Code**
    * *Code Task:* Write an input listener script that catches hardware events (Keyboard WASD, Gamepad thumbsticks).
    * *Code Task:* Set up character physics movement using a standard Character Controller component or a Rigidbody capsule. Translate input vector directions relative to the active camera viewpoint.
    * *Code Task:* Link the calculated moving speed directly into the Animator component to dynamically drive the locomotion blend tree, and implement a ground-check raycast to track jumping states.

---

## Phase 2: Drivable Vehicle Physics & Modeling
Create a fully functional mechanical vehicle framework capable of interacting with physics engines.

* **Step 2.1: Vehicle Mesh Disassembly**
    * *Asset Task:* Model or source a generic 4-door civilian sedan mesh.
    * *Asset Task:* Detach the 4 wheel objects entirely from the main body chassis. Reset the pivot orientation for every wheel mesh to its dead center to ensure they spin evenly without wobbling.
    * *Asset Task:* Set up dedicated structural empty nodes (sockets) inside the car layout marking the exact physical locations where wheels, headlights, and camera rigs will sit.
* **Step 2.2: Wheel Collider & Suspension Calibration**
    * *Code Task:* Attach the main chassis mesh to a heavy Rigidbody component. Distribute the center of mass lower in the vehicle chassis to prevent the car from flipping over constantly during tight turns.
    * *Code Task:* Generate 4 dedicated Wheel Colliders (or custom raycast suspension springs) mapped exactly to the structural wheel nodes. 
    * *Code Task:* Expose variable sliders within the editor to easily fine-tune suspension dampening, spring forces, and tire friction slip curves.
* **Step 2.3: Drivable Transmission & Steering Logic**
    * *Code Task:* Create a vehicle controller script reading analog inputs (Triggers/WS for Gas/Brake, Stick/AD for Steering).
    * *Code Task:* Direct motor torque calculations to the driving wheels for acceleration, apply braking force variables to all 4 wheels when requested, and alter the rotation angle of the front wheel colliders up to a maximum threshold (e.g., 35–40 degrees) for steering.
    * *Code Task:* Program a visual feedback script that forces the separate 3D wheel meshes to copy the position and spin rotations of the underlying physical wheel colliders.

---

## Phase 3: Vehicle Interaction & Perspective Switching
Construct the crucial system loop that lets a player seamlessly cross over from foot locomotion to driving.

* **Step 3.1: Vehicle Boarding & Exit Animations**
    * *Asset Task:* Create an "Enter Vehicle" animation: Player opens a door, ducks, steps inside, sits down, and pulls the door shut.
    * *Asset Task:* Create an "Exit Vehicle" animation: Player pushes the door open, slides out, stands up, and shuts the door.
    * *Asset Task:* Ensure these animations use root motion or explicit positioning offsets so the character ends up perfectly aligned with the seat or street upon completion.
* **Step 3.2: Spatial Trigger Volumes & Prompts**
    * *Code Task:* Add a simple Box/Sphere Trigger Volume over the driver's side door of the vehicle prefab, designated as an "Interaction Zone".
    * *Code Task:* Program an interaction detection script on the player that constantly checks if they are stepping inside one of these zones. 
* **Step 3.3: Possession Context Switcher**
    * *Code Task:* When the interaction button is pressed inside a zone, lock the player's inputs, snap their position to align with the door handle, and play the "Enter Vehicle" animation.
    * *Code Task:* At the exact frame the character sits down, disable the On-Foot script, unrender or turn off the player's capsule collisions, parent the player mesh directly inside the car hierarchy, and hand controller inputs over to the vehicle physics script.
    * *Code Task:* Command the camera system (e.g., Cinemachine or custom camera scripts) to smoothly lerp its target follow point from the player capsule over to the car chassis. Reverse this entire sequence precisely when the player presses the exit button.

---

## Phase 4: Melee Combat Mechanics
Build physical, close-quarters combat capabilities allowing the player to strike objects or characters.

* **Step 4.1: Attack Animations & Upper Body Blending**
    * *Asset Task:* Create a snappy "Left/Right Jab" punch animation and a forward "Front Kick" animation.
    * *Asset Task:* Configure an animation masking layer in the engine that isolates the spine upward. This lets the player punch or strike with their upper body while still playing normal running/walking animations on their lower body.
* **Step 4.2: Hitbox Triggers & Timing Windows**
    * *Code Task:* Add simple primitive colliders (spheres or capsules) around the player character's hands and feet bones, setting them as triggers.
    * *Code Task:* Program a combat animation event system that keeps these specific hand/foot hitboxes disabled by default, activating their physics checks *only* during the active swinging frames of the attack animation before turning them off again.
* **Step 4.3: Health Pools & Impact Distribution**
    * *Code Task:* Write a generic `Health.cs` script that can be attached to any entity in the game (Player, NPCs, props). It should contain fields for `currentHealth`, `maxHealth`, and a public function `TakeDamage(float amount)`.
    * *Code Task:* When an active hand/foot combat hitbox overlaps an entity with a `Health` script during an attack frame, invoke the damage function and trigger a minor screen shake or particle impact spark at the contact point.

---

## Phase 5: Gunplay Fundamentals & Target Systems
Implement ranged combat options incorporating weapons, ammunition tracking, and camera aim states.

* **Step 5.1: Weapon Models, Sockets, and Animation States**
    * *Asset Task:* Model a basic 3D semi-automatic pistol. Define a socket node at the end of the barrel barrel called `Muzzle_Flash_Socket` and an export node named `Ejection_Port_Socket`.
    * *Asset Task:* Generate an upper-body "Combat Ready / Aiming" stance animation, a weapon recoil animation, and a reload animation sequence.
* **Step 5.2: Raycast Fire Logic & Ammo Counters**
    * *Code Task:* Write a weapon inventory manager keeping track of variables: `currentAmmoInClip`, `reserveAmmo`, and `magazineSize`.
    * *Code Task:* When the fire input is detected in an aiming state, fire an invisible Raycast out from the exact center of the player's camera screen. Check if the raycast intersects a collider containing a `Health` script and deal damage.
    * *Code Task:* Deduct ammunition from the clip with every shot. Block firing actions when `currentAmmoInClip` hits zero, forcing a reload state that shifts values from `reserveAmmo` after playing the reload animation.
* **Step 5.3: Muzzle Effects & Audio Implementation**
    * *Asset Task:* Design a fast visual particle effect for the expanding gas flash at the barrel tip, a smoking bullet trail line, and generic surface impact dust. Sourced audio files for a sharp gunshot blast, mechanical reload movements, and an empty magazine click.
    * *Code Task:* At the exact frame a raycast shot fires, instantiate the muzzle flash particle system at the `Muzzle_Flash_Socket`, render a brief line renderer trail to the hit target, spawn impact dust at the raycast hit point, and play the gunshot audio clip.

---

## Phase 6: Destructible Environment Props
Fill the open world map layout with structural clutter objects that break realistically under physical impacts.

* **Step 6.1: Asset Creation & Fractured Multi-Mesh Setup**
    * *Asset Task:* Model standard urban street assets: a concrete traffic barrier, a plastic trash can, and a tall metal street lamp post.
    * *Asset Task:* Build a secondary "broken" model variant for each object (e.g., a snapped lamp post stump, scattered concrete debris chunks). Ensure the broken pieces have their own centered pivot points.
* **Step 6.2: Replacement Switch Scripts**
    * *Code Task:* Attach a standard `Health` script alongside a rigid collider to the pristine prop model.
    * *Code Task:* Program an impact checker monitor inside the prop script using `OnCollisionEnter`. If a moving Rigidbody with a heavy mass asset (like a car) hits the prop at a velocity exceeding a specific threshold, reduce the prop's health pool straight to zero.
* **Step 6.3: Debris Physics Spawning**
    * *Code Task:* The moment a prop's health hits zero, drop the pristine mesh model out of the scene completely.
    * *Code Task:* Instantly instantiate the "broken/fractured" mesh prefab at the exact same spatial coordinates. Apply a sudden, outwards physical explosion impulse force to the broken pieces so they scatter across the street asphalt naturally before slowly cleaning them up via a fade-out script to save memory.

---

## Phase 7: Gun Shop Economy & User Interfaces
Provide clear, scannable HUD tracking elements alongside functional locations to purchase upgrades.

* **Step 7.1: UI Layout Canvas Design**
    * *Asset Task:* Design crisp 2D graphic assets: a weapon silhouette display, text numbers for ammo configurations, a currency count icon ($), and an overhead targeting crosshair graphic.
    * *Code Task:* Construct a screen space UI overlay canvas. Bind text fields directly to the Player Inventory variables so money and ammo readouts match up in real-time.
* **Step 7.2: Interactive Store Trigger Zones**
    * *Asset Task:* Build a simple retail building interior or an outdoor gun vending cage. Design a clean, list-style 2D menu interface detailing items for sale (Pistol, Pistol Ammo) with their matching prices.
    * *Code Task:* Place an interaction trigger box in front of the store display counter. When the player steps inside this zone, draw an overlay prompt saying "Press [E] to Browse Shop".
* **Step 7.3: Transaction Verification Systems**
    * *Code Task:* Pressing the shop button locks player movement and overlays the store menu onto the screen canvas.
    * *Code Task:* Program button item callbacks: When clicking "Buy Ammo", verify if `PlayerMoney >= AmmoPrice`. If true, subtract the cost from `PlayerMoney`, update the UI text, and add the purchased counts straight into the weapon manager's `reserveAmmo` variable.

---

## Phase 8: Autonomous Pedestrian Wandering AI
Populate the sandbox sidewalks with basic, self-navigating ambient citizen characters.

* **Step 8.1: Sidewalk Node Layouts & Mesh Variety**
    * *Asset Task:* Create 2 or 3 distinct variation textures or clothing assets for the base humanoid rig model to simulate different city residents.
    * *Code Task:* Build a basic path node network system: Place a series of invisible empty vector transform objects down the center lines of sidewalks, linking them together in a chain script to map out walkable pathways.
* **Step 8.2: Pathfinding Decisions & Simple Steer Operations**
    * *Code Task:* Equip the NPC prefabs with an AI controller script (using NavMesh Agents or basic vector math steering behaviors).
    * *Code Task:* At startup, command the NPC to pick a random connecting node in the sidewalk path layout, calculate the heading direction, select a random walking speed, and move towards it. Once the NPC crosses within a tiny radius of the target node, pause for a random interval before selecting a new connecting node.
* **Step 8.3: Dynamic Ragdoll Rig State Blending**
    * *Asset Task:* Configure a full Ragdoll physics setup on the NPC skeletal bones by applying rigidbodies and joint constraints (e.g., Character Joints) to every main limb bone segment. Keep this ragdoll system completely disabled while the NPC is alive.
    * *Code Task:* Program a collision listener on the NPC capsule. If a vehicle collider contacts the NPC above a slow walking speed, immediately disable the main AI script, disable the standard Animator component, and activate the Ragdoll joint physics. This causes the character to get thrown like a physical prop across the pavement based on the car's impact direction.

---

## Phase 9: Ambient Vehicle Traffic & Parked Spawners
Give the open world roads functional ambient traffic lines alongside static parked vehicle placements.

* **Step 9.1: Road Track Waypoint Arrays**
    * *Code Task:* Create a secondary waypoint path network layout separate from the sidewalks, running straight down the middle of the driving lanes. Link these nodes together sequentially to build looping track paths representing one-way or two-way city traffic lanes.
* **Step 9.2: Vehicle Auto-Pilot Steering & Braking**
    * *Code Task:* Build an ambient traffic driver AI script attached to cars. This script reads the next upcoming lane node, applies motor torque to steer the wheels towards it, and advances down the node chain.
    * *Code Task:* Cast a short raycast straight out from the front bumper of the traffic car. If the raycast hits another vehicle, a pedestrian, or an obstacle, apply maximum braking force to avoid collisions, resuming acceleration only once the lane ahead clears up.
* **Step 9.3: Sidewalk Curb Spawn Anchors**
    * *Code Task:* Scatter static parking space marker points across the city design along sidewalk edges.
    * *Code Task:* Write a master world initialization script: When the game scene loads up, iterate through these parked anchors and run a random check (e.g., 60% chance to spawn). If successful, instantiate a random empty car prefab directly onto the spot, leaving it shut down and ready for player jacking.

---

## Phase 10: Grand Theft Auto Vehicle Hijacking
Create the iconic sandbox mechanic of forcibly ripping an NPC driver straight out of their car.

* **Step 10.1: Synchronized Hijack Animations**
    * *Asset Task:* Create a synchronized double-character animation sequence. 
    * *Asset Task:* Player view: Player grabs the car door handle, yanks it open aggressively, reaches inside, grabs the driver's clothes, and pulls backward.
    * *Asset Task:* NPC view: The driver reacts in shock, gets pulled sideways across the seat console, tumbles out the open door onto the ground, and rolls over.
* **Step 10.2: Hijack Target Interception Logic**
    * *Code Task:* Update the Phase 3 interaction logic. When the player approaches a car door and hits enter, check if the car's seat variable references an active NPC driver component.
    * *Code Task:* If an NPC driver is detected, immediately override and halt both the NPC's pathfinding script and the vehicle's auto-pilot system, locking down all car inputs.
* **Step 10.3: Eviction Execution Sequence**
    * *Code Task:* Snap the player and the target NPC to face each other at their designated layout spots next to the door hinge.
    * *Code Task:* Play the synchronized jacking animations on both skeletons simultaneously.
    * *Code Task:* At the exact frame the NPC animation hits the pavement, unparent the NPC from the car seat container, switch their state to a brief knock-down animation or temporary ragdoll, clear out their ownership ties to the vehicle, and trigger the player's standard vehicle possession logic from Phase 3.

---

## Phase 11: NPC Aggression Profiles & Retaliation Combat
Transform the ambient city inhabitants from passive wanderers into responsive, combative entities.

* **Step 11.1: Personality Profile Variables**
    * *Code Task:* Add an enum variable variable to the NPC initialization script: `public enum NPCType { Coward, Fighter }`.
    * *Code Task:* When an NPC is spawned into the world by the system managers, run a random percentage check to assign their profile type (e.g., 70% chance to set as `Coward`, 30% chance to set as `Fighter`).
* **Step 11.2: Hostile Retaliation Target Locking**
    * *Code Task:* Write an event listener inside the NPC health script called `OnTakeDamage`. 
    * *Code Task:* If an NPC gets struck by a player's melee punch, shot by a weapon raycast, or yanked out of their vehicle, check their personality type. If they are designated a `Fighter`, immediately break their wandering path routine and assign the player's transform object as their active `CombatTarget`.
* **Step 11.3: Armed NPC Combat Behavior Loops**
    * *Asset Task:* Create a basic tracking animation loop for NPCs: facing a target, raising a weapon model, and playing a recoil animation.
    * *Code Task:* If a `Fighter` NPC has an armed weapon flag enabled in their profile parameters, instantiate a pistol model mesh into their right-hand bone socket.
    * *Code Task:* Program the combat AI loop: The NPC continuously rotates to keep their forward axis facing the player's position, moves within firing range, and runs a timed repeat routine that fires raycasts back at the player's coordinates, calling the player's `TakeDamage` function upon successful hits.

---

## Phase 12: Sound Perception & World Panic Loops
Complete the systemic chaos circle by forcing entire city blocks to scatter frantically when weapon discharges occur.

* **Step 12.1: Panic Escape Animations & Audio Vocalizations**
    * *Asset Task:* Create a high-energy "Panic Sprint" loop: The character runs at maximum speed while wildly waving their arms or protecting their head.
    * *Asset Task:* Record or source a library array of high-pitched panicked screams and frantic breathing audio clips.
* **Step 12.2: Gunshot Sound Perception Spheres**
    * *Code Task:* Expand the player's Phase 5 weapon fire script. Every single time a gun raycast successfully executes, run an instant spatial check command like `Physics.OverlapSphere` centered right on the player's coordinate position, setting the check radius to a wide distance (e.g., 30 meters).
* **Step 12.3: Mass Dispersal Flee Commands**
    * *Code Task:* Loop through all the colliders picked up inside that gunshot overlap sphere. Check if any hit objects possess the ambient NPC wander script.
    * *Code Task:* For every valid NPC found inside the radius (regardless of whether they are a `Coward` or a `Fighter`), instantly disrupt their normal wandering or parked logic loop and force them into a `Panicked` state.
    * *Code Task:* Play a random screaming audio clip from the sound library array, set their animation state directly to the frantic panic sprint loop, calculate a running path vector pointing exactly away from the player's gunshot source coordinates, and force them to sprint in that direction for a set amount of time before allowing them to calm down and despawn.