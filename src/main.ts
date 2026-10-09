/**
 * FUR & FURY - Application Entry Point
 * "Adorable by Nature. Dangerous by Destiny."
 */

import './style.css';
import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', async () => {
  const canvasContainer = document.getElementById('canvas-container');
  const uiOverlay = document.getElementById('ui-overlay');

  if (!canvasContainer || !uiOverlay) {
    console.error('Missing root DOM elements for Fur & Fury mounting.');
    return;
  }

  const game = new Game();
  try {
    await game.bootstrap(canvasContainer, uiOverlay);
  } catch (err) {
    console.error('Fatal initialization error:', err);
    uiOverlay.innerHTML = `
      <div style="padding: 2rem; color: #ff5555; background: rgba(0,0,0,0.85); font-family: monospace;">
        <h2>Engine Initialization Error</h2>
        <pre>${err instanceof Error ? err.stack || err.message : String(err)}</pre>
      </div>
    `;
  }
});
