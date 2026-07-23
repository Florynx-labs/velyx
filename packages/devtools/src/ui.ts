/**
 * VELYX In-App DevTools Visual Panel Widget
 * Developed by Florynx Labs (v0.4.0)
 */

import type { DevtoolsHook } from './index.js';

export function mountDevtoolsUI(hook: DevtoolsHook): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('velyx-devtools-root');
  if (existing) return;

  const root = document.createElement('div');
  root.id = 'velyx-devtools-root';
  root.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #090c13;
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    color: #fff;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 999999;
    backdrop-filter: blur(10px);
  `;

  root.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">
      <span style="background: #6366f1; color: #fff; border-radius: 4px; padding: 2px 6px; font-size: 10px;">VELYX</span>
      <span>DevTools Visual Inspector</span>
    </div>
    <div id="velyx-devtools-stats" style="color: #94a3b8; font-family: monospace;">
      Signals: 0 | Components: 0
    </div>
  `;

  document.body.appendChild(root);

  function updateUI(): void {
    const statsEl = document.getElementById('velyx-devtools-stats');
    if (statsEl) {
      const signals = hook.getSignals();
      statsEl.textContent = `Signals: ${signals.length} | Values: ${signals.map(s => `${s.name}=${String(s.value)}`).join(', ') || 'none'}`;
    }
  }

  window.addEventListener('velyx:devtools:update', updateUI);
  updateUI();
}
