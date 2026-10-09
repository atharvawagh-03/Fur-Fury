# FUR & FURY

> **"Adorable by Nature. Dangerous by Destiny."**

A 3D fantasy action-adventure browser game developed with **TypeScript**, **Three.js**, **Rapier 3D**, and **Vite**.

---

## Quick Start

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Automated Test Suite
```bash
npm run test
```

### 4. Production Build
```bash
npm run build
```

---

## Project Structure

```
├── public/                 # Static assets & favicon
├── src/
│   ├── audio/              # Web Audio API bus & sound synthesis
│   ├── camera/             # CameraManager, FOV & shake system
│   ├── config/             # GameConfig constants & parameters
│   ├── core/               # Engine, Time loop, EventBus, Game bootstrap
│   ├── input/              # InputManager & key bindings
│   ├── physics/            # Rapier 3D WASM wrapper & rigid bodies
│   ├── scenes/             # Scene implementations (BootScene, etc.)
│   ├── scene/              # SceneManager & IScene interfaces
│   ├── save/               # SaveManager & persistence schema
│   ├── ui/                 # UIManager & HUD overlay
│   ├── style.css           # Cinematic CSS design system
│   └── main.ts             # Application entrypoint
├── tests/                  # Vitest automated test suite
├── docs/                   # ARCHITECTURE.md & technical documentation
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Milestone Status

- **Step 1: Project Foundation and Game Architecture** — **COMPLETE**
- Step 2: 3D World and Medieval Environment — Pending Approval
