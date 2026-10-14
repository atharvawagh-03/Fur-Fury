/**
 * Input Management System
 * Handles keyboard and mouse states with action mappings for Fur & Fury controls.
 */

export interface KeyBindings {
  forward: string[];
  backward: string[];
  left: string[];
  right: string[];
  lightAttack: string[];
  heavyAttack: string[];
  dodge: string[];
  parry: string[];
  guard: string[];
  lockOn: string[];
  interact: string[];
  dragonCall: string[];
  heal: string[];
  menu: string[];
}

export const DefaultKeyBindings: KeyBindings = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  lightAttack: ['KeyJ', 'Mouse0'],
  heavyAttack: ['KeyK', 'Mouse2'],
  dodge: ['Space'],
  parry: ['KeyF', 'KeyQ'],
  guard: ['ShiftLeft'],
  lockOn: ['KeyR', 'MiddleMouse'],
  interact: ['KeyE'],
  dragonCall: ['KeyT', 'KeyX'],
  heal: ['KeyH'],
  menu: ['Escape', 'Enter'],
};

export class InputManager {
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private bindings: KeyBindings = { ...DefaultKeyBindings };
  private onKeyDownBound = this.onKeyDown.bind(this);
  private onKeyUpBound = this.onKeyUp.bind(this);

  constructor() {
    this.attach();
  }

  private attach(): void {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  public detach(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.keysDown.clear();
    this.keysJustPressed.clear();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.keysDown.has(e.code)) {
      this.keysJustPressed.add(e.code);
    }
    this.keysDown.add(e.code);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }

  public isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  public isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  public isActionActive(action: keyof KeyBindings): boolean {
    const validCodes = this.bindings[action];
    return validCodes.some((code) => this.keysDown.has(code));
  }

  public isActionJustPressed(action: keyof KeyBindings): boolean {
    const validCodes = this.bindings[action];
    return validCodes.some((code) => this.keysJustPressed.has(code));
  }

  /**
   * Clears single-frame trigger buffers. Must be called at end of frame.
   */
  public endFrame(): void {
    this.keysJustPressed.clear();
  }
}
