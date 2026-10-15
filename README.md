# FUR & FURY

> **"Adorable by Nature. Dangerous by Destiny."**

A 3D fantasy action-adventure browser game following **Lady Anuki**, a brave kitten knight with an embroidered pink ear bow, and her colossal red dragon companion **Rhazakar the Unbroken**, as they challenge the mighty human champions of the Kingdom of **Veyrholm**.

Engineered with **TypeScript**, **Three.js**, **Rapier 3D WebAssembly**, and **Vite**.

---

## 🎮 Gameplay Controls

| Action | Keyboard / Mouse | Description |
| :--- | :--- | :--- |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | 8-directional bipedal movement relative to camera |
| **Sprint** | <kbd>Shift</kbd> (Hold) | Energetic feline bounding sprint (consumes stamina) |
| **Evasive Roll** | <kbd>Space</kbd> | 360° dodge roll with invulnerability window (i-frames) |
| **Jump** | <kbd>C</kbd> | Vertical leap with apex hang and cloth animation |
| **Light Attack** | <kbd>J</kbd> / Left Click | 3-hit combo chain cross-slashes with Moonfang |
| **Heavy Strike** | <kbd>K</kbd> | Heavy overhead breaker strike (massive poise damage) |
| **Parry** | <kbd>Q</kbd> / <kbd>F</kbd> | 0.22s precision deflection window opening Critical Riposte |
| **Guard** | <kbd>Shift</kbd> (Stationary) | Defensive sword block mitigating damage |
| **Dragon Call** | <kbd>T</kbd> / <kbd>X</kbd> | Signals Rhazakar for an overhead aerial strafing run |
| **Duel Lock-On** | <kbd>R</kbd> | Smooth camera framing centered on active opponent |
| **Interact** | <kbd>E</kbd> | Proximity interactions with NPCs, spring, & lore shrines |
| **Photo Mode** | <kbd>P</kbd> | Enters 360° free orbit camera with cinematic filters |
| **Hide Photo HUD** | <kbd>H</kbd> | Hides all interface elements for clean screenshots |
| **Settings Modal** | <kbd>O</kbd> / HUD button | Opens 6-tab menu (Gameplay, Audio, Accessibility, Wardrobe, Graphics, Credits) |

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Automated Test Suite (81 Tests across 27 Suites)
```bash
npm test
```

### 4. Production Build (Zero Warnings / Strict TypeScript)
```bash
npm run build
```

---

## 🏛️ Subsystems & Architecture

```
├── public/                     # Static assets & favicon
├── src/
│   ├── audio/                  # 4-channel Web Audio mixer & procedural synthesizers
│   ├── camera/                 # ThirdPersonCamera, ArenaCameraController, PhotoModeController
│   ├── character/              # AnukiModel, AnukiAnimator, AnukiController, AnukiMaterials
│   ├── cinematic/              # 4-beat opening sequence director with banking physics
│   ├── combat/                 # Combo chains, timed parry, riposte, poise, damageables
│   ├── config/                 # GameConfig constants & physics / graphics defaults
│   ├── core/                   # Engine, Profiler, QualityManager, DisposalHelper, EventBus, Game
│   ├── cosmetics/              # 3 craftable armor finishes & 4 cape silk dyes
│   ├── dragon/                 # RhazakarModel (articulated rig), animator, vapor & shockwave VFX
│   ├── enemy/                  # Sir Garrick, Dame Elowen, Sir Brannoc models & behavior trees
│   ├── input/                  # InputManager keyboard & mouse action mapping
│   ├── narrative/              # Branching dialogue engine & 5 Veyrholm Lore Codex chronicles
│   ├── physics/                # Rapier 3D WebAssembly physics wrapper & dynamic colliders
│   ├── progression/            # Oath Seals, Fast-Travel map, & 3-branch skill upgrade tree
│   ├── scenes/                 # ArenaScene, HubScene, RosebridgeScene, BellforgeScene, BootScene
│   ├── scene/                  # SceneManager & IScene lifecycle interface
│   ├── save/                   # LocalStorage persistence schema (seals, upgrades, settings)
│   ├── settings/               # SettingsManager (difficulty, volume bus, accessibility)
│   ├── style.css               # Dark fantasy gold-accented UI & glassmorphism HUD
│   ├── ui/                     # UIManager modal menus, dialogue cards, photo deck, telemetry
│   └── main.ts                 # Bootstrap entrypoint
├── tests/                      # Automated unit test suites (81 tests)
├── docs/                       # ARCHITECTURE.md specification & development blueprint
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🏆 10-Step Development Roadmap (100% COMPLETE)

| Step | Milestone Name | Status | Key Features |
| :--- | :--- | :---: | :--- |
| **Step 1** | **Project Foundation & Game Architecture** | **COMPLETED** | Fixed-timestep loop (60 Hz), Rapier 3D WASM, Three.js renderer, HUD |
| **Step 2** | **3D World & Medieval Environment** | **COMPLETED** | 36m Grand Arena colosseum, ashlar limestone, banners, fire braziers |
| **Step 3** | **Anuki Character & Third-Person Controller** | **COMPLETED** | Kitten knight 3D rig, pink ear bow, PBR fur & silver cuirass, dodge roll |
| **Step 4** | **Rhazakar Dragon & Opening Cinematic** | **COMPLETED** | Colossal red dragon, 4-beat arrival cinematic, landing shockwave |
| **Step 5** | **Sword Combat & Player Abilities** | **COMPLETED** | 3-hit light combo, heavy breaker, timed parry, poise break, elixir flask |
| **Step 6** | **Human Knight Enemies & Intelligent AI** | **COMPLETED** | Sir Garrick Ironjaw AI, halberd swings, ground slam punish window, surrender |
| **Step 7** | **Level Progression & Boss Battles** | **COMPLETED** | 3 Boss encounters, Oath Seals, Fast-Travel, 3-tier skill upgrades |
| **Step 8** | **Storytelling, Dialogue & Interactive Systems**| **COMPLETED** | Castle Sanctuary Hub, interactive NPCs, branching dialogue, Lore Codex |
| **Step 9** | **UI/UX, Audio, Visual Effects & Polish** | **COMPLETED** | Settings modal, accessibility options, audio bus mixing, cosmetics, Photo Mode |
| **Step 10** | **Optimization, Testing & Final Deployment** | **COMPLETED** | 60 FPS Profiler, Dynamic DPR scaler, GPU DisposalHelper, 81 tests pass |

---

## ⚡ Performance & Quality Scaler (Step 10)

- **Target Frame Rate**: Locked 60 FPS (16.6 ms frame budget).
- **Dynamic Resolution Scaling (DPR)**: Automatically adapts pixel ratio (from native down to 0.75x) if frame rate drops below 45 FPS, and restores fidelity when optimal.
- **Deep Memory Disposal**: Recursive disposal of all Three.js geometries, materials, and GPU textures across scene transitions to guarantee zero WebGL memory leaks.
- **Graphic Presets**: `AUTO_60FPS`, `ULTRA`, `HIGH`, `BALANCED`, `LOW` available in Game Settings.
